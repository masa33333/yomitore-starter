import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // サーバーサイドで環境変数を直接チェック
    const envCheck = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
      // 環境変数の存在確認（値は表示しない）
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasOpenaiApiKey: !!process.env.OPENAI_API_KEY,
      hasClaudeApiKey: !!process.env.CLAUDE_API_KEY,
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
      hasTtsVoice: !!process.env.TTS_VOICE,
      // 値の一部を表示（デバッグ用）
      supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
        : 'NOT SET',
      serviceKeyPreview: process.env.SUPABASE_SERVICE_KEY 
        ? `${process.env.SUPABASE_SERVICE_KEY.substring(0, 10)}...` 
        : 'NOT SET',
      openaiKeyPreview: process.env.OPENAI_API_KEY 
        ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` 
        : 'NOT SET',
      // 全環境変数のキー一覧（値は表示しない）
      allEnvKeys: Object.keys(process.env)
        .filter(key => 
          key.startsWith('NEXT_PUBLIC_') || 
          key.startsWith('SUPABASE_') || 
          key.startsWith('OPENAI_') ||
          key.startsWith('CLAUDE_') ||
          key.startsWith('GEMINI_') ||
          key.startsWith('TTS_')
        )
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check environment variables', details: error },
      { status: 500 }
    );
  }
}