import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let text = '';
  let sourceLang = 'ja';
  let targetLang = 'en';
  
  try {
    const requestData = await request.json();
    text = requestData.text || '';
    sourceLang = requestData.sourceLang || 'ja';
    targetLang = requestData.targetLang || 'en';
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log(`🌐 Translating: "${text}" (${sourceLang} → ${targetLang})`);

    // OpenAI APIを使用してより正確な翻訳を実行
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text from ${sourceLang} to ${targetLang}. 
            Rules:
            1. If the text is already in ${targetLang}, return it as-is
            2. Provide only the translation, no explanations
            3. Maintain the original meaning and context
            4. Use simple, clear language
            5. For topics or concepts, provide the most commonly used English term`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error('❌ OpenAI API error:', await response.text());
      
      // フォールバック：簡単な変換
      const fallbackTranslation = performFallbackTranslation(text);
      return NextResponse.json({
        translatedText: fallbackTranslation,
        originalText: text,
        method: 'fallback'
      });
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('No translation received');
    }

    console.log(`✅ Translation: "${text}" → "${translatedText}"`);

    return NextResponse.json({
      translatedText,
      originalText: text,
      method: 'openai'
    });

  } catch (error) {
    console.error('❌ Translation error:', error);
    
    // フォールバック翻訳
    const fallbackTranslation = performFallbackTranslation(text || '');
    return NextResponse.json({
      translatedText: fallbackTranslation,
      originalText: text || '',
      method: 'fallback',
      error: error instanceof Error ? error.message : 'Translation failed'
    });
  }
}

// 簡単なフォールバック翻訳機能
function performFallbackTranslation(text: string): string {
  // 基本的な日本語→英語変換
  const basicTranslations: { [key: string]: string } = {
    'ワインの歴史': 'history of wine',
    'コーヒーの歴史': 'history of coffee',
    'お茶の歴史': 'history of tea',
    '歴史': 'history',
    '文化': 'culture',
    '技術': 'technology',
    '科学': 'science',
    '芸術': 'art',
    '音楽': 'music',
    '料理': 'cooking',
    '映画': 'movies',
    '本': 'books',
    '建築': 'architecture',
    '自然': 'nature',
    '動物': 'animals',
    '植物': 'plants',
    '天気': 'weather',
    '季節': 'seasons',
    '地理': 'geography',
    '言語': 'language'
  };

  // 完全一致を探す
  if (basicTranslations[text]) {
    return basicTranslations[text];
  }

  // 部分一致を探す
  for (const [jp, en] of Object.entries(basicTranslations)) {
    if (text.includes(jp)) {
      return text.replace(jp, en);
    }
  }

  // 何も見つからない場合はそのまま返す
  return text;
}