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
    // ブランド・企業名
    'ブルガリの歴史': 'history of Bulgari',
    'ブルガリ': 'Bulgari',
    'ルイヴィトンの歴史': 'history of Louis Vuitton',
    'ルイヴィトン': 'Louis Vuitton',
    'シャネルの歴史': 'history of Chanel',
    'シャネル': 'Chanel',
    'エルメスの歴史': 'history of Hermes',
    'エルメス': 'Hermes',
    'グッチの歴史': 'history of Gucci',
    'グッチ': 'Gucci',
    'プラダの歴史': 'history of Prada',
    'プラダ': 'Prada',
    
    // 一般的なトピック
    'ワインの歴史': 'history of wine',
    'コーヒーの歴史': 'history of coffee',
    'お茶の歴史': 'history of tea',
    'チョコレートの歴史': 'history of chocolate',
    'パンの歴史': 'history of bread',
    
    // 歴史的イベント
    'フランス革命': 'French Revolution',
    'アメリカ独立戦争': 'American Revolutionary War',
    '第二次世界大戦': 'World War II',
    '第一次世界大戦': 'World War I',
    '産業革命': 'Industrial Revolution',
    
    // 基本語彙
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
    '言語': 'language',
    'エベレスト': 'Mount Everest',
    '富士山': 'Mount Fuji'
  };

  console.log(`🔄 Fallback translation lookup for: "${text}"`);

  // 完全一致を探す
  if (basicTranslations[text]) {
    console.log(`✅ Fallback found exact match: "${text}" → "${basicTranslations[text]}"`);
    return basicTranslations[text];
  }

  // 部分一致を探す（長いものから順番に）
  const sortedKeys = Object.keys(basicTranslations).sort((a, b) => b.length - a.length);
  for (const jp of sortedKeys) {
    if (text.includes(jp)) {
      const result = text.replace(jp, basicTranslations[jp]);
      console.log(`✅ Fallback found partial match: "${jp}" → "${basicTranslations[jp]}" in "${text}" → "${result}"`);
      return result;
    }
  }

  // 何も見つからない場合はそのまま返す
  console.log(`⚠️ Fallback: No translation found for "${text}", returning as-is`);
  return text;
}