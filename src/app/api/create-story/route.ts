import { NextResponse } from "next/server";

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

// ストーリーパラメータ型
interface StoryParameters {
  genre: string;
  tone: string;
  feeling: string;
  level: number;
}

// フォールバック用のサンプルストーリー生成
function generateFallbackStory(params: StoryParameters): StoryResponse {
  const { genre, tone, feeling, level } = params;
  
  const stories = {
    adventure: {
      optimistic: {
        excited: `Sarah had always dreamed of discovering hidden treasures. One sunny morning, she found an old map in her grandmother's attic. The map showed a path through the nearby forest to a mysterious cave. With her backpack ready and her heart full of excitement, Sarah began her adventure. She followed the winding path, listening to birds singing and feeling the warm sunshine on her face. When she finally reached the cave, she discovered something even better than treasure - a family of friendly animals who had been waiting for someone kind like her to visit them.`,
        hopeful: `Tom looked at the mountain ahead of him. He had been training for months to climb it. Today was the day. Step by step, he made his way up the rocky path. Sometimes it was difficult, but Tom never stopped believing in himself. When he reached the top, he could see the beautiful valley below. He felt proud and happy. This adventure taught him that with hope and hard work, any dream can come true.`
      }
    },
    mystery: {
      intriguing: {
        curious: `Detective Emma noticed something strange about the old library. Every night at midnight, a soft light appeared in one of the windows. She decided to investigate. With her flashlight and notebook, she carefully entered the building after closing time. As she explored the quiet halls filled with books, she discovered a secret room behind a moving bookshelf. Inside, she found an ancient journal that told the story of the library's founder and his hidden collection of rare books.`
      }
    }
  };

  // サンプルストーリーから選択、または汎用的なストーリー生成
  let story = "A young person embarked on a wonderful journey. Along the way, they met interesting people and learned valuable lessons about life, friendship, and following their dreams. Through challenges and discoveries, they grew stronger and wiser, finally achieving their goal and finding happiness.";
  
  if (stories[genre as keyof typeof stories]) {
    const genreStories = stories[genre as keyof typeof stories];
    if (genreStories[tone as keyof typeof genreStories]) {
      const toneStories = genreStories[tone as keyof typeof genreStories];
      if (toneStories[feeling as keyof typeof toneStories]) {
        story = toneStories[feeling as keyof typeof toneStories];
      }
    }
  }

  const title = `${genre.charAt(0).toUpperCase() + genre.slice(1)} Story: A ${feeling.charAt(0).toUpperCase() + feeling.slice(1)} ${tone} Tale`;
  
  const themes = [
    "Following Your Dreams", 
    "Overcoming Challenges", 
    "The Power of Friendship",
    "Discovering Inner Strength",
    "Finding Hope in Difficult Times"
  ];

  return {
    story,
    themes: themes.slice(0, 3), // Return 3 themes
    title,
    genre,
    tone,
    feeling,
    level
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[create-story] 受信パラメータ (フォールバックモード):", body);

    const { genre, tone, feeling, level }: StoryParameters = body;

    // パラメータ必須チェック
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

    console.log('[create-story] フォールバックストーリー生成リクエスト:', { genre, tone, feeling, level });

    // フォールバックストーリー生成
    const response = generateFallbackStory({ genre, tone, feeling, level });

    console.log('✅ フォールバックストーリー生成完了:', {
      title: response.title,
      storyLength: response.story.length,
      themesCount: response.themes.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("[create-story] エラー内容:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json({ 
      error: "ストーリーの生成に失敗しました", 
      detail: error instanceof Error ? error.message : 'Unknown error',
      story: "Sorry, we couldn't generate your story at this time. Please try again later.",
      themes: ["Overcoming Challenges", "New Beginnings", "Personal Growth"],
      title: "Sample Story"
    }, { status: 500 });
  }
}