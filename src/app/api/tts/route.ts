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

    // OpenAI APIキーのみ必須、Supabaseは任意
    if (!openaiApiKey) {
      console.warn('⚠️ Missing OpenAI API key for TTS service');
      return NextResponse.json(
        { 
          error: 'TTS service temporarily unavailable - missing OpenAI API key',
          audioUrl: '',
          cached: false 
        },
        { status: 503 }
      );
    }

    // Supabaseが利用できない場合は警告のみ
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Supabase not available - TTS will work without caching');
    }

    // Supabaseが利用可能な場合のキャッシュ処理
    let supabase = null;
    let useCaching = false;
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        useCaching = true;
        console.log('✅ Supabase client created - caching enabled');

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
      } catch (supabaseError) {
        console.warn('⚠️ Supabase setup failed, proceeding without caching:', supabaseError);
        useCaching = false;
      }
    } else {
      console.log('ℹ️ No Supabase config - proceeding without caching');
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
    
    // Supabaseが利用可能な場合はアップロード
    if (useCaching && supabase) {
      try {
        const textHash = crypto.createHash('md5').update(text).digest('hex');
        const fileName = `${contentId}_${textHash}.mp3`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio')
          .upload(fileName, audioBuffer, {
            contentType: 'audio/mpeg',
            cacheControl: '3600'
          });

        if (!uploadError) {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('audio')
            .getPublicUrl(fileName);

          console.log('✅ TTS generated and cached successfully:', fileName);
          
          return NextResponse.json({
            audioUrl: urlData.publicUrl,
            cached: false
          });
        } else {
          console.warn('⚠️ Supabase upload failed, returning direct audio:', uploadError);
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase operation failed, returning direct audio:', supabaseError);
      }
    }

    // Supabaseが利用できない場合は直接音声データを返す
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

    console.log('✅ TTS generated successfully (no caching)');
    
    return NextResponse.json({
      audioUrl: audioDataUrl,
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