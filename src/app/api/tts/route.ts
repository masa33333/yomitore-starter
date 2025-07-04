import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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
      ttsVoice: ttsVoice,
      supabaseUrlLength: supabaseUrl?.length || 0,
      serviceKeyLength: supabaseServiceKey?.length || 0,
      openaiKeyLength: openaiApiKey?.length || 0,
      // 環境変数の実際の値の一部を表示（デバッグ用）
      supabaseUrlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined',
      serviceKeyPreview: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 10)}...` : 'undefined',
      openaiKeyPreview: openaiApiKey ? `${openaiApiKey.substring(0, 10)}...` : 'undefined'
    });

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_KEY');
      if (!openaiApiKey) missingVars.push('OPENAI_API_KEY');
      
      console.warn('⚠️ Missing environment variables for TTS service:', missingVars);
      return NextResponse.json(
        { 
          error: `TTS service temporarily unavailable - missing configuration: ${missingVars.join(', ')}`,
          missingVariables: missingVars,
          audioUrl: '',
          cached: false 
        },
        { status: 503 }
      );
    }

    // Create Supabase client directly in API route
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Supabase client created successfully');
    } catch (supabaseError) {
      console.error('❌ Failed to create Supabase client:', supabaseError);
      return NextResponse.json(
        { 
          error: 'TTS service temporarily unavailable - Supabase connection failed',
          details: supabaseError instanceof Error ? supabaseError.message : 'Unknown error',
          audioUrl: '',
          cached: false 
        },
        { status: 503 }
      );
    }

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
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error('❌ OpenAI TTS error:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        voice: ttsVoice,
        textLength: text.length
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to generate audio',
          details: errorData,
          voice: ttsVoice,
          status: response.status
        },
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