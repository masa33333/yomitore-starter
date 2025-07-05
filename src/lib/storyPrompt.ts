// ストーリー生成のためのプロンプトテンプレート生成ユーティリティ

export interface StoryParameters {
  genre: string;
  tone: string;
  feeling: string;
  level?: number; // 語彙レベル（オプション）
}

// 利用可能な選択肢の定義（日本語＋英語対応）
export const STORY_OPTIONS = {
  genres: [
    { value: 'Adventure', ja: '冒険', en: 'Adventure' },
    { value: 'Romance', ja: 'ロマンス', en: 'Romance' },
    { value: 'Mystery', ja: 'ミステリー', en: 'Mystery' },
    { value: 'Fantasy', ja: 'ファンタジー', en: 'Fantasy' },
    { value: 'Science Fiction', ja: 'SF', en: 'Science Fiction' },
    { value: 'Drama', ja: 'ドラマ', en: 'Drama' },
    { value: 'Comedy', ja: 'コメディ', en: 'Comedy' },
    { value: 'Thriller', ja: 'スリラー', en: 'Thriller' }
  ],
  tones: [
    { value: 'Lighthearted', ja: '軽快', en: 'Lighthearted' },
    { value: 'Serious', ja: 'シリアス', en: 'Serious' },
    { value: 'Mysterious', ja: '神秘的', en: 'Mysterious' },
    { value: 'Romantic', ja: 'ロマンチック', en: 'Romantic' },
    { value: 'Suspenseful', ja: 'サスペンス', en: 'Suspenseful' },
    { value: 'Humorous', ja: 'ユーモラス', en: 'Humorous' },
    { value: 'Melancholic', ja: '憂鬱', en: 'Melancholic' },
    { value: 'Inspiring', ja: '感動的', en: 'Inspiring' }
  ],
  feelings: [
    { value: 'Hope', ja: '希望', en: 'Hope' },
    { value: 'Satisfaction', ja: '満足感', en: 'Satisfaction' },
    { value: 'Wonder', ja: '驚き', en: 'Wonder' },
    { value: 'Empowerment', ja: '勇気をもらえる', en: 'Empowerment' },
    { value: 'Reflection', ja: '内省', en: 'Reflection' },
    { value: 'Joy', ja: '喜び', en: 'Joy' },
    { value: 'Melancholy', ja: '憂愁', en: 'Melancholy' },
    { value: 'Terrifying', ja: 'ゾッとするような', en: 'Terrifying' }
  ]
} as const;

/**
 * ストーリー生成のプロンプトテンプレートを生成
 */
export function generateStoryPrompt({ genre, tone, feeling, level = 3 }: StoryParameters): string {
  // ランダムに主人公の性別を選択
  const genders = ['男性', '女性'];
  const randomGender = genders[Math.floor(Math.random() * genders.length)];
  
  return `
語彙レベル: ${level}
テーマ: ${genre}
得たい感情: ${feeling}
表現スタイル: ${tone}
主人公の性別: ${randomGender}

この条件に基づいて英語の読み物を1つ作成し、以下のstrict JSON形式で出力してください：

{
  "title": "[Your Story Title Here]",
  "content": [
    "[First paragraph: Setup - introduce character and setting]",
    "[Second paragraph: Inciting incident - something changes]", 
    "[Third paragraph: Rising action - conflict develops]",
    "[Fourth paragraph: Climax - main conflict peaks]",
    "[Fifth paragraph: Resolution - conclusion and outcome]"
  ]
}

【必須要件】
🔸 コードブロック（\`\`\`json）を含めず、JSONオブジェクトのみを返す
🔸 "title" は1文の自然な英語タイトル（最大10語）
🔸 "content" は各段落を1つの文字列として配列にする
🔸 改行記号（\\n）やマークダウン記号（**など）を含めない
🔸 最終出力は純粋なJSONのみ（前後に説明や補足も不要）

【タイトル例】
- Fantasy + Bittersweet → "The Girl Who Couldn't Cast Spells"
- Sci-Fi + Uplifting → "Hope Among the Ruins"  
- Mystery + Suspenseful → "The Vanished Letter"
- Adventure + Melancholic → "The Lonely Samurai"

【ストーリー作成ルール】
1. ストーリー全体で約500語前後になるよう構成（B1-B2レベルに適切）
2. 5段階構成を必ず維持（Setup → Inciting Incident → Rising Action → Climax → Resolution）
3. 各段落は十分な長さ（4〜6文程度）で詳細に描写
4. HTMLタグや構造用語（Setup, Climax等）の表記は一切使用しない
5. 太字（**）や番号（1. 2.）などの構造表現も使用しない
6. 普通の文章のみで構成（必ず5段落）
7. 主人公は指定された性別（${randomGender}）で作成
8. 語彙レベル${level}に適した英語で作成
9. 内容が浅くならないよう、感情・状況・行動を具体的に描写
10. 舞台と登場人物はアメリカ、イギリス、カナダ、オーストラリアなどの英語圏に設定
11. 最後の段落（Resolution）で必ず読者が驚くようなドンデン返しを用意する

出力は純粋なJSONオブジェクトのみ。
`;
}

/**
 * ストーリー生成システムメッセージ
 */
export const STORY_SYSTEM_MESSAGE = "You are a professional English creative writer specializing in educational content for intermediate English learners (CEFR B1-B2). You create engaging, well-structured stories that help students improve their reading comprehension while enjoying compelling narratives. CRITICAL: Output ONLY pure JSON object as specified. No code blocks, no explanations, no additional text before or after the JSON. The output will be directly parsed by JSON.parse().";

/**
 * レスポンスからストーリー、タイトル、テーマを抽出（エラーハンドリング強化版）
 */
export function parseStoryResponse(rawResponse: string): { story: string; themes: string[]; title?: string; genre?: string; tone?: string; feeling?: string } {
  // 🔧 全体をtry-catchで囲んで予期せぬエラーをキャッチ
  try {
    console.log('[parseStoryResponse] 解析開始:', {
      responseLength: rawResponse?.length || 0,
      responseType: typeof rawResponse,
      isEmpty: !rawResponse || rawResponse.trim() === ''
    });

    if (!rawResponse || rawResponse.trim() === '') {
      console.error('[parseStoryResponse] 空のレスポンス');
      throw new Error('Empty response received');
    }

    let story = rawResponse.trim();
    let themes: string[] = [];
    let title: string | undefined;
    let genre: string | undefined;
    let tone: string | undefined;
    let feeling: string | undefined;

    try {
      // 🔧【修正】strict JSON形式の場合
      console.log('[parseStoryResponse] JSON解析試行1: 直接解析');
      const jsonResponse = JSON.parse(rawResponse);
      
      console.log('[parseStoryResponse] JSON解析成功:', {
        hasTitle: !!jsonResponse.title,
        hasContent: !!jsonResponse.content,
        contentType: typeof jsonResponse.content,
        isContentArray: Array.isArray(jsonResponse.content)
      });
      
      if (jsonResponse.title && jsonResponse.content) {
        // content配列を\n\nで結合してstory文字列に変換
        const storyContent = Array.isArray(jsonResponse.content) 
          ? jsonResponse.content.join('\n\n')
          : jsonResponse.content;
          
        return {
          story: storyContent,
          themes: jsonResponse.themes || ["A Second Chance at Dreams", "Finding Light in Dark Times", "The Power of Unexpected Friendship"],
          title: jsonResponse.title,
          genre: jsonResponse.genre,
          tone: jsonResponse.tone,
          feeling: jsonResponse.feeling
        };
      } else {
        console.warn('[parseStoryResponse] JSON解析成功だが必須フィールドが不足');
      }
    } catch (jsonError) {
      console.log('[parseStoryResponse] JSON解析失敗、クリーンアップ後に再試行:', {
        error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
        responseStart: rawResponse.substring(0, 100)
      });
      
      // 🔧【修正】JSONパース失敗時の前後余計な文字列除去
      console.log('[parseStoryResponse] JSON解析試行2: クリーンアップ後');
      const cleanedResponse = rawResponse
        .replace(/^```json\s*/i, '') // コードブロック開始を除去
        .replace(/\s*```$/i, '') // コードブロック終了を除去
        .replace(/^[^{]*({.*})[^}]*$/, '$1') // JSON以外の前後文字列を除去
        .trim();
      
      console.log('[parseStoryResponse] クリーンアップ結果:', {
        originalLength: rawResponse.length,
        cleanedLength: cleanedResponse.length,
        cleanedStart: cleanedResponse.substring(0, 100)
      });
      
      try {
        const jsonResponse = JSON.parse(cleanedResponse);
        console.log('[parseStoryResponse] クリーンアップ後JSON解析成功');
        
        if (jsonResponse.title && jsonResponse.content) {
          const storyContent = Array.isArray(jsonResponse.content) 
            ? jsonResponse.content.join('\n\n')
            : jsonResponse.content;
            
          return {
            story: storyContent,
            themes: jsonResponse.themes || ["A Second Chance at Dreams", "Finding Light in Dark Times", "The Power of Unexpected Friendship"],
            title: jsonResponse.title,
            genre: jsonResponse.genre,
            tone: jsonResponse.tone,
            feeling: jsonResponse.feeling
          };
        } else {
          console.warn('[parseStoryResponse] クリーンアップ後でも必須フィールドが不足');
        }
      } catch (secondJsonError) {
        console.log('[parseStoryResponse] クリーンアップ後のJSON解析も失敗、従来形式として処理します:', {
          error: secondJsonError instanceof Error ? secondJsonError.message : 'Unknown error'
        });
      }
    }

    // 従来形式（Title: 形式）の場合
    console.log('[parseStoryResponse] 従来形式での解析を試行');
    const titleMatch = story.match(/^Title:\s*(.+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      // ストーリー部分からタイトル行を除去
      story = story.replace(/^Title:\s*.+\n\n?/i, '').trim();
      console.log('[parseStoryResponse] 従来形式でタイトル発見:', title);
    }

    // Related Themes部分を抽出して分離
    const themesMatch = rawResponse.match(/===\s*Related Themes\s*===\s*([\s\S]*)/);
    if (themesMatch) {
      const themesText = themesMatch[1].trim();
      themes = themesText
        .split('\n')
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 3); // 最大3件

      // ストーリー部分からテーマ部分を除去
      story = story.replace(/===\s*Related Themes\s*===[\s\S]*/, '').trim();
      console.log('[parseStoryResponse] 従来形式でテーマ発見:', themes.length, '件');
    }

    // STORYプレフィックスがある場合は除去
    story = story.replace(/^STORY:\s*/i, '').trim();

    // フォールバック処理
    if (themes.length === 0) {
      themes = [
        "A Second Chance at Dreams",
        "Finding Light in Dark Times", 
        "The Power of Unexpected Friendship"
      ];
    }

    console.log('[parseStoryResponse] 従来形式解析完了:', {
      hasTitle: !!title,
      storyLength: story.length,
      themesCount: themes.length
    });

    return { story, themes, title, genre, tone, feeling };
    
  } catch (globalError) {
    // 🔧 全体のエラーハンドリング
    console.error('[parseStoryResponse] 予期しないエラー:', {
      error: globalError,
      message: globalError instanceof Error ? globalError.message : 'Unknown global error',
      stack: globalError instanceof Error ? globalError.stack : undefined,
      rawResponseSample: rawResponse?.substring(0, 200) || 'No response'
    });
    
    // 最後のフォールバック: エラー時でも最低限のレスポンスを返す
    return {
      story: rawResponse || "エラーが発生しました。ストーリーを生成できませんでした。",
      themes: ["Error Recovery", "Technical Difficulties", "Please Try Again"],
      title: "Error: Story Generation Failed",
      genre: undefined,
      tone: undefined,
      feeling: undefined
    };
  }
}

/**
 * ストーリーパラメータのバリデーション
 */
export function validateStoryParameters({ genre, tone, feeling, level }: StoryParameters): string | null {
  const validGenres = STORY_OPTIONS.genres.map(g => g.value) as string[];
  const validTones = STORY_OPTIONS.tones.map(t => t.value) as string[];
  const validFeelings = STORY_OPTIONS.feelings.map(f => f.value) as string[];

  if (!genre || !validGenres.includes(genre)) {
    return `Invalid genre. Must be one of: ${validGenres.join(', ')}`;
  }
  if (!tone || !validTones.includes(tone)) {
    return `Invalid tone. Must be one of: ${validTones.join(', ')}`;
  }
  if (!feeling || !validFeelings.includes(feeling)) {
    return `Invalid feeling. Must be one of: ${validFeelings.join(', ')}`;
  }
  if (level && (level < 1 || level > 5)) {
    return `Invalid level. Must be between 1 and 5`;
  }

  return null; // バリデーション成功
}