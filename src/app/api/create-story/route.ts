import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { 
  generateStoryPrompt, 
  parseStoryResponse, 
  validateStoryParameters,
  STORY_SYSTEM_MESSAGE,
  type StoryParameters 
} from "@/lib/storyPrompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ストーリー生成レスポンス型
interface StoryResponse {
  story: string;
  themes: string[];
  title?: string;
  genre?: string;
  tone?: string;
  feeling?: string;
  level?: number;
}

// OpenAI API呼び出し関数（エラーハンドリング強化）
async function callOpenAI(userPrompt: string, systemMessage: string) {
  try {
    console.log('🔄 [OpenAI API] 呼び出し開始');
    console.log('🔄 [OpenAI API] システムメッセージ:', systemMessage.substring(0, 100) + '...');
    console.log('🔄 [OpenAI API] ユーザープロンプト:', userPrompt.substring(0, 200) + '...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: systemMessage
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const rawResponse = completion.choices[0].message.content?.trim() ?? "";
    console.log('✅ [OpenAI API] 応答受信完了:', {
      responseLength: rawResponse.length,
      model: completion.model,
      usage: completion.usage
    });

    return rawResponse;
  } catch (err) {
    console.error('[OpenAI API] 呼び出し失敗:', {
      error: err,
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[create-story] 受信パラメータ:", body);

    const { genre, tone, feeling, level }: StoryParameters = body;

    // 🔧 パラメータ必須チェックの強化
    if (!genre || !tone || !feeling || !level) {
      const missingParams = [];
      if (!genre) missingParams.push('genre');
      if (!tone) missingParams.push('tone');
      if (!feeling) missingParams.push('feeling');
      if (!level) missingParams.push('level');
      
      console.error('[create-story] 必須パラメータ不足:', { missingParams, received: body });
      return NextResponse.json({ 
        error: `必須パラメータが不足しています: ${missingParams.join(', ')}`,
        detail: `Missing required parameters: ${missingParams.join(', ')}`
      }, { status: 400 });
    }

    // バリデーション
    const validationError = validateStoryParameters({ genre, tone, feeling, level });
    if (validationError) {
      console.error('[create-story] バリデーションエラー:', validationError);
      return NextResponse.json({ 
        error: validationError,
        detail: `Validation failed: ${validationError}`
      }, { status: 400 });
    }

    console.log('[create-story] ストーリー生成リクエスト:', { genre, tone, feeling, level });

    // プロンプト生成
    const userPrompt = generateStoryPrompt({ genre, tone, feeling, level });
    console.log("[create-story] プロンプト:", userPrompt.substring(0, 300) + '...');

    // OpenAI API呼び出し
    const rawResponse = await callOpenAI(userPrompt, STORY_SYSTEM_MESSAGE);
    
    // 🔍 rawResponseの内容をログ出力（デバッグ用）
    console.log('[create-story] rawResponse受信:', {
      length: rawResponse.length,
      firstChars: rawResponse.substring(0, 200),
      lastChars: rawResponse.substring(Math.max(0, rawResponse.length - 100)),
      containsTitle: rawResponse.includes('title'),
      containsContent: rawResponse.includes('content'),
      isValidJSON: (() => {
        try {
          JSON.parse(rawResponse);
          return true;
        } catch {
          return false;
        }
      })()
    });

    // 🔧 レスポンス解析（専用エラーハンドリング）
    let story, themes, title, parsedGenre, parsedTone, parsedFeeling;
    try {
      console.log('[create-story] parseStoryResponse呼び出し開始');
      const parseResult = parseStoryResponse(rawResponse);
      
      story = parseResult.story;
      themes = parseResult.themes;
      title = parseResult.title;
      parsedGenre = parseResult.genre;
      parsedTone = parseResult.tone;
      parsedFeeling = parseResult.feeling;
      
      console.log('[create-story] parseStoryResponse完了:', {
        storyLength: story?.length || 0,
        themesCount: themes?.length || 0,
        hasTitle: !!title,
        title: title
      });
      
    } catch (parseError) {
      console.error('[create-story] parseStoryResponse エラー:', {
        error: parseError,
        message: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        rawResponseSample: rawResponse.substring(0, 500)
      });
      
      // フォールバック: 直接JSONパースを試行
      try {
        console.log('[create-story] フォールバック: 直接JSON解析を試行');
        const fallbackResult = JSON.parse(rawResponse);
        if (fallbackResult.title && fallbackResult.content) {
          story = Array.isArray(fallbackResult.content) 
            ? fallbackResult.content.join('\n\n')
            : fallbackResult.content;
          themes = fallbackResult.themes || ["A Second Chance at Dreams", "Finding Light in Dark Times", "The Power of Unexpected Friendship"];
          title = fallbackResult.title;
          parsedGenre = fallbackResult.genre || genre;
          parsedTone = fallbackResult.tone || tone;
          parsedFeeling = fallbackResult.feeling || feeling;
          console.log('[create-story] フォールバック成功');
        } else {
          throw new Error('フォールバック解析でも有効な構造が見つかりません');
        }
      } catch (fallbackError) {
        console.error('[create-story] フォールバックも失敗:', fallbackError);
        throw new Error(`レスポンス解析に失敗しました: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }

    // タイトルが空または未定義の場合は生成失敗として扱う
    if (!title || title.trim() === '') {
      console.error('❌ ストーリー生成失敗: タイトルが空です');
      return NextResponse.json({ 
        error: "タイトルの生成に失敗しました。再度お試しください。",
        story: "Sorry, we couldn't generate a proper story title. Please try again.",
        themes: ["Overcoming Challenges", "New Beginnings", "Personal Growth"]
      }, { status: 422 });
    }

    console.log('✅ ストーリー生成完了:', {
      title: title,
      storyLength: story.length,
      themesCount: themes.length
    });

    const response: StoryResponse = {
      story,
      themes,
      title,
      genre: parsedGenre || genre,
      tone: parsedTone || tone,
      feeling: parsedFeeling || feeling,
      level
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[create-story] エラー内容:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return new Response(JSON.stringify({ 
      error: "ストーリーの生成に失敗しました", 
      detail: error instanceof Error ? error.message : 'Unknown error',
      story: "Sorry, we couldn't generate your story at this time. Please try again later.",
      themes: ["Overcoming Challenges", "New Beginnings", "Personal Growth"]
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}