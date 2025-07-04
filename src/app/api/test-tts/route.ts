import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TTS Test API called');
    
    // 環境変数チェック
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const ttsVoice = process.env.TTS_VOICE ?? "alloy";
    
    console.log('🔧 Test TTS Environment:', {
      hasOpenaiApiKey: !!openaiApiKey,
      ttsVoice: ttsVoice,
      openaiKeyLength: openaiApiKey?.length || 0
    });

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not found' },
        { status: 500 }
      );
    }

    console.log('🎵 Making TTS request to OpenAI...');

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: ttsVoice,
        input: "This is a test of OpenAI text to speech from Vercel deployment.",
        response_format: "mp3"
      }),
    });

    console.log('🔍 OpenAI TTS Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI TTS Error:', error);
      return NextResponse.json(
        { 
          error: 'OpenAI TTS failed',
          details: error,
          status: response.status
        },
        { status: 500 }
      );
    }

    const buffer = await response.arrayBuffer();
    console.log('✅ TTS Audio generated successfully:', {
      bufferSize: buffer.byteLength,
      voice: ttsVoice
    });

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=\"test-tts.mp3\""
      },
    });

  } catch (err: any) {
    console.error('❌ TTS Test Error:', err);
    return NextResponse.json(
      { 
        error: 'TTS test failed',
        details: err.message,
        stack: err.stack
      },
      { status: 500 }
    );
  }
}