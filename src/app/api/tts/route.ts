import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { text, contentId } = await request.json();

    if (!text || !contentId) {
      return NextResponse.json(
        { error: 'text and contentId are required' },
        { status: 400 }
      );
    }

    console.log('🎵 TTS request:', { contentId, textLength: text.length });

    // コンテンツIDとテキストのハッシュでファイル名を生成
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    const fileName = `${contentId}_${textHash}.mp3`;

    // Supabaseクライアント作成
    const supabase = createServiceSupabaseClient();

    // 既存のファイルをチェック
    const { data: existingFile } = await supabase.storage
      .from('audio')
      .list('', { search: fileName });

    if (existingFile && existingFile.length > 0) {
      // 既存ファイルがある場合はパブリックURLを返す
      const { data: urlData } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);
      
      console.log('✅ Using cached audio file:', fileName);
      return NextResponse.json({ 
        audioUrl: urlData.publicUrl,
        cached: true 
      });
    }

    // OpenAI TTS APIを使用（コスト効率的な代替案）
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // より安価なモデル
        input: text,
        voice: 'alloy', // 英語学習に適した声
        response_format: 'mp3',
        speed: 0.9 // 学習者向けに少し遅め
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI TTS error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate audio' },
        { status: 500 }
      );
    }

    // 音声データを取得
    const audioBuffer = await response.arrayBuffer();
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to save audio file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    console.log('✅ TTS generated successfully:', fileName);
    
    return NextResponse.json({
      audioUrl: urlData.publicUrl,
      cached: false
    });

  } catch (error) {
    console.error('❌ TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}