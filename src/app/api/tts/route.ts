import { NextRequest, NextResponse } from 'next/server';
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

    // 環境変数チェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const ttsVoice = process.env.TTS_VOICE || 'alloy'; // デフォルトはalloy

    console.log('🔧 Environment variables:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasOpenaiApiKey: !!openaiApiKey,
      ttsVoice: ttsVoice
    });

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      console.warn('⚠️ Missing environment variables for TTS service');
      return NextResponse.json(
        { 
          error: 'TTS service temporarily unavailable - missing configuration',
          audioUrl: '',
          cached: false 
        },
        { status: 503 }
      );
    }

    // Dynamic Supabase client creation with error handling
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // コンテンツIDとテキストのハッシュでファイル名を生成
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    const fileName = `${contentId}_${textHash}.mp3`;

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
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // より安価なモデル
        input: text,
        voice: ttsVoice, // 環境変数から取得、デフォルトはalloy
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