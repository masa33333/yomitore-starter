import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServiceSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
import { TimingsJSON } from '@/types/highlight';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// Whisper APIレスポンスの型定義
type WhisperWord = {
  word: string;
  start: number;
  end: number;
};

type WhisperSegment = {
  text: string;
  start: number; 
  end: number;
};

type WhisperResponse = {
  words?: WhisperWord[];
  segments?: WhisperSegment[];
  text: string;
};

/**
 * Whisperレスポンスを TimingsJSON 形式に変換
 */
function buildTimingsFromWhisper(
  words: WhisperWord[] = [], 
  segments: WhisperSegment[] = []
): TimingsJSON {
  console.log('🎵 Building timings from Whisper:', { 
    wordsCount: words.length, 
    segmentsCount: segments.length 
  });

  // 単語レベルが優先（より精密）
  const useWords = words.length > 0;
  
  if (useWords) {
    // 単語データのクリーニング・ソート
    const cleanedWords = words
      .map((word, i) => ({
        i,
        text: (word.word || '').trim(),
        start: Math.max(0, Number(word.start) || 0),
        end: Math.max(0, Number(word.end) || 0),
      }))
      .filter(w => w.text.length > 0)
      .sort((a, b) => a.start - b.start);

    // 時間の一貫性チェック・修正
    for (let i = 0; i < cleanedWords.length; i++) {
      const current = cleanedWords[i];
      
      // end < start の修正
      if (current.end < current.start) {
        current.end = current.start + 0.1; // 最小100ms
      }
      
      // 前の単語と重複している場合の修正
      if (i > 0) {
        const previous = cleanedWords[i - 1];
        if (current.start < previous.end) {
          previous.end = current.start;
        }
      }
    }

    console.log('✅ Word-level timings generated:', {
      itemsCount: cleanedWords.length,
      duration: cleanedWords[cleanedWords.length - 1]?.end || 0,
      averageWordDuration: cleanedWords.length > 0 ? 
        (cleanedWords[cleanedWords.length - 1].end / cleanedWords.length).toFixed(3) : 0
    });

    return {
      granularity: 'word',
      items: cleanedWords,
      source: 'openai-transcribe',
      model: 'whisper-1',
      createdAt: new Date().toISOString(),
    };
  }

  // フォールバック: セグメントベース
  if (segments.length > 0) {
    const cleanedSegments = segments
      .map((segment, i) => ({
        i,
        text: (segment.text || '').trim(),
        start: Math.max(0, Number(segment.start) || 0),
        end: Math.max(0, Number(segment.end) || 0),
      }))
      .filter(s => s.text.length > 0)
      .sort((a, b) => a.start - b.start);

    console.log('⚠️ Segment-level timings (fallback):', {
      itemsCount: cleanedSegments.length,
      duration: cleanedSegments[cleanedSegments.length - 1]?.end || 0
    });

    return {
      granularity: 'sentence',
      items: cleanedSegments,
      source: 'openai-transcribe',
      model: 'whisper-1',
      createdAt: new Date().toISOString(),
    };
  }

  throw new Error('No valid words or segments found in Whisper response');
}

/**
 * Supabaseから音声ファイルを取得
 */
async function fetchAudioFromSupabase(audioUrl: string): Promise<ArrayBuffer> {
  console.log('📥 Fetching audio from Supabase:', { audioUrl });
  
  try {
    const response = await fetch(audioUrl);
    
    if (!response.ok) {
      throw new Error(`Audio fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('✅ Audio fetched successfully:', { 
      size: arrayBuffer.byteLength,
      sizeKB: Math.round(arrayBuffer.byteLength / 1024)
    });
    
    return arrayBuffer;
  } catch (error) {
    console.error('❌ Audio fetch error:', error);
    throw error;
  }
}

/**
 * TimingsをSupabaseにキャッシュ
 */
async function cacheTimingsToSupabase(
  contentId: string, 
  textHash: string, 
  timings: TimingsJSON
): Promise<void> {
  console.log('💾 Caching timings to Supabase:', { contentId, textHash });
  
  try {
    const supabase = createServiceSupabaseClient();
    
    if (!supabase) {
      console.warn('⚠️ Supabase client not available - skipping cache');
      return;
    }
    
    const filePath = `timings/${contentId}/${textHash}.json`;
    const fileContent = JSON.stringify(timings, null, 2);
    
    const { data, error } = await supabase.storage
      .from('timings')
      .upload(filePath, fileContent, {
        contentType: 'application/json',
        cacheControl: '31536000', // 1年
        upsert: true // 既存ファイルを上書き
      });
    
    if (error) {
      console.error('❌ Supabase cache error:', error);
      // キャッシュ失敗は致命的ではない
      return;
    }
    
    console.log('✅ Timings cached successfully:', { 
      path: data?.path,
      size: fileContent.length 
    });
    
  } catch (error) {
    console.error('❌ Cache operation error:', error);
    // キャッシュ失敗は致命的ではない
  }
}

/**
 * Supabaseからキャッシュされたタイミングを取得
 */
async function getCachedTimings(
  contentId: string, 
  textHash: string
): Promise<TimingsJSON | null> {
  console.log('🔍 Checking cached timings:', { contentId, textHash });
  
  try {
    const supabase = createServiceSupabaseClient();
    
    if (!supabase) {
      console.log('⚠️ Supabase client not available - no cache check');
      return null;
    }
    
    const filePath = `timings/${contentId}/${textHash}.json`;
    
    const { data, error } = await supabase.storage
      .from('timings')
      .download(filePath);
    
    if (error) {
      console.log('📝 No cached timings found:', error.message);
      return null;
    }
    
    const jsonText = await data.text();
    const timings = JSON.parse(jsonText) as TimingsJSON;
    
    console.log('🎉 Cached timings found:', {
      source: timings.source,
      granularity: timings.granularity,
      itemsCount: timings.items?.length
    });
    
    return timings;
    
  } catch (error) {
    console.log('📝 Cache check failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 Whisper Timings API called');
  
  try {
    const body = await request.json();
    const { audioUrl, contentId, textHash } = body;
    
    console.log('📝 Request params:', { 
      audioUrl: audioUrl?.substring(0, 50) + '...',
      contentId,
      textHash 
    });
    
    if (!audioUrl || !contentId || !textHash) {
      return NextResponse.json(
        { error: 'audioUrl, contentId, and textHash are required' },
        { status: 400 }
      );
    }
    
    // 1. キャッシュチェック
    const cachedTimings = await getCachedTimings(contentId, textHash);
    if (cachedTimings) {
      console.log('🎉 Returning cached timings');
      return NextResponse.json({
        cached: true,
        timings: cachedTimings,
        message: 'Cached timings returned successfully'
      });
    }
    
    // 2. 音声ファイル取得
    const audioBuffer = await fetchAudioFromSupabase(audioUrl);
    
    // 3. OpenAI Whisper API呼び出し
    console.log('🎵 Calling OpenAI Whisper API...');
    const audioFile = new File([audioBuffer], 'audio.mp3', { 
      type: 'audio/mpeg' 
    });
    
    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
    }
    const whisperResponse = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      timestamp_granularities: ['word', 'segment'],
      response_format: 'verbose_json',
    }) as WhisperResponse;
    
    console.log('✅ Whisper API response received:', {
      wordsCount: whisperResponse.words?.length || 0,
      segmentsCount: whisperResponse.segments?.length || 0,
      textLength: whisperResponse.text?.length || 0
    });
    
    // 4. TimingsJSON形式に変換
    const timings = buildTimingsFromWhisper(
      whisperResponse.words, 
      whisperResponse.segments
    );
    
    // 5. Supabaseにキャッシュ（バックグラウンド）
    cacheTimingsToSupabase(contentId, textHash, timings);
    
    console.log('🎉 Whisper timings generated successfully');
    
    return NextResponse.json({
      cached: false,
      timings,
      message: 'Whisper timings generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Whisper Timings API error:', error);
    
    // エラーの種類に応じた適切なレスポンス
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Please try again in a few moments',
            retryAfter: 60 
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('file size')) {
        return NextResponse.json(
          { 
            error: 'File too large',
            message: 'Audio file exceeds maximum size limit' 
          },
          { status: 413 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to generate timings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
