import { NextResponse } from "next/server";

// 文章を適切な段落に分割する関数
function addParagraphBreaks(englishText: string, japaneseText: string, level: number): { english: string, japanese: string } {
  // 英語文章の段落分割
  let englishParagraphs: string[] = [];
  let japaneseParagraphs: string[] = [];
  
  // レベル1-2: 短い文章なので2段落に分割
  if (level <= 2) {
    const englishSentences = englishText.split(/(?<=[.!?])\s+/);
    const japaneseSentences = japaneseText.split(/(?<=[。！？])\s*/);
    
    const sentencesPerParagraph = Math.ceil(englishSentences.length / 2);
    
    for (let i = 0; i < englishSentences.length; i += sentencesPerParagraph) {
      englishParagraphs.push(englishSentences.slice(i, i + sentencesPerParagraph).join(' '));
    }
    
    for (let i = 0; i < japaneseSentences.length; i += sentencesPerParagraph) {
      japaneseParagraphs.push(japaneseSentences.slice(i, i + sentencesPerParagraph).join(''));
    }
  }
  // レベル3-4: 中程度の文章なので3段落に分割
  else if (level <= 4) {
    const englishSentences = englishText.split(/(?<=[.!?])\s+/);
    const japaneseSentences = japaneseText.split(/(?<=[。！？])\s*/);
    
    const paragraphCount = 3;
    const sentencesPerParagraph = Math.ceil(englishSentences.length / paragraphCount);
    
    for (let i = 0; i < englishSentences.length; i += sentencesPerParagraph) {
      englishParagraphs.push(englishSentences.slice(i, i + sentencesPerParagraph).join(' '));
    }
    
    for (let i = 0; i < japaneseSentences.length; i += sentencesPerParagraph) {
      japaneseParagraphs.push(japaneseSentences.slice(i, i + sentencesPerParagraph).join(''));
    }
  }
  // レベル5: より長い文章なので4段落に分割
  else {
    const englishSentences = englishText.split(/(?<=[.!?])\s+/);
    const japaneseSentences = japaneseText.split(/(?<=[。！？])\s*/);
    
    const paragraphCount = 4;
    const sentencesPerParagraph = Math.ceil(englishSentences.length / paragraphCount);
    
    for (let i = 0; i < englishSentences.length; i += sentencesPerParagraph) {
      englishParagraphs.push(englishSentences.slice(i, i + sentencesPerParagraph).join(' '));
    }
    
    for (let i = 0; i < japaneseSentences.length; i += sentencesPerParagraph) {
      japaneseParagraphs.push(japaneseSentences.slice(i, i + sentencesPerParagraph).join(''));
    }
  }
  
  return {
    english: englishParagraphs.join('\n\n'),
    japanese: japaneseParagraphs.join('\n\n')
  };
}

// 語彙レベルに基づく語数範囲
const getWordCountRange = (level: number): { min: number, max: number } => {
  switch (level) {
    case 1: return { min: 80, max: 120 };   // A1 - 短め
    case 2: return { min: 110, max: 150 };  // A2 - 基本
    case 3: return { min: 140, max: 200 };  // B1 - 中級
    case 4: return { min: 180, max: 250 };  // B2 - 中上級
    case 5: return { min: 220, max: 300 };  // C1+ - 上級
    default: return { min: 140, max: 200 };
  }
};

// 語彙レベルに基づく制約
const getVocabularyConstraints = (level: number): string => {
  switch (level) {
    case 1: return "Use ONLY the most basic English words (NGSL 1-500). Simple present tense, basic vocabulary only.";
    case 2: return "Use basic English words (NGSL 1-1000). Simple past and future tense allowed.";
    case 3: return "Use intermediate vocabulary (NGSL 1-1500). Complex sentences with relative clauses allowed.";
    case 4: return "Use upper-intermediate vocabulary (NGSL 1-2500). Complex grammar structures allowed.";
    case 5: return "Use advanced vocabulary (NGSL 1-3500+). Academic and sophisticated language allowed.";
    default: return "Use appropriate vocabulary for the level.";
  }
};

// 翻訳機能（内部用）
async function translateToEnglish(text: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang: 'ja', targetLang: 'en' })
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('❌ Translation error:', error);
    return text; // フォールバック：そのまま返す
  }
}

// Wikipedia検索機能（内部用）
async function searchWikipedia(query: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wikipedia-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language: 'en' })
    });

    if (!response.ok) {
      throw new Error('Wikipedia search failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Wikipedia search error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { topic, level, isMailGeneration } = await request.json();
    
    console.log(`📝 生成開始: "${topic}" (Level ${level})`);
    
    // レベル正規化
    const normalizedLevel = Math.max(1, Math.min(5, parseInt(level?.toString() || '3')));
    const wordRange = getWordCountRange(normalizedLevel);
    const vocabConstraints = getVocabularyConstraints(normalizedLevel);
    
    // Step 1: 日本語の場合は英語に翻訳
    let searchQuery = topic;
    if (/[ひらがなカタカナ漢字]/.test(topic)) {
      console.log(`🌐 日本語検出: "${topic}" を英語に翻訳中...`);
      searchQuery = await translateToEnglish(topic);
      console.log(`✅ 翻訳結果: "${searchQuery}"`);
    }
    
    // Step 2: Wikipedia検索
    console.log(`🔍 Wikipedia検索: "${searchQuery}"`);
    const wikipediaData = await searchWikipedia(searchQuery);
    
    let sourceInfo = '';
    let referenceUrl = '';
    
    if (wikipediaData && wikipediaData.content) {
      sourceInfo = wikipediaData.content.substring(0, 1000); // 最初の1000文字
      referenceUrl = wikipediaData.url;
      console.log(`📚 Wikipedia情報取得成功: ${wikipediaData.title}`);
    } else {
      console.log(`⚠️ Wikipedia情報なし、一般的な知識で生成`);
    }
    
    // Step 3: 教育的コンテンツ生成
    const systemPrompt = `You are an educational content creator. Create engaging, factual content for English learners.

CRITICAL REQUIREMENTS:
1. VOCABULARY: ${vocabConstraints}
2. WORD COUNT: ${wordRange.min}-${wordRange.max} words
3. FACTUAL ACCURACY: Use only verified information
4. EDUCATIONAL VALUE: Include interesting facts and insights
5. ENGAGING STYLE: Make it interesting and readable
6. NO TEMPLATES: Avoid generic phrases like "The history of..." or "The development of..."

${sourceInfo ? `SOURCE INFORMATION (use as reference):
${sourceInfo}

Wikipedia URL: ${referenceUrl}` : ''}

Topic: ${searchQuery}
Level: ${normalizedLevel} (${normalizedLevel <= 2 ? 'Beginner' : normalizedLevel <= 4 ? 'Intermediate' : 'Advanced'})

Create an engaging, educational passage that teaches something meaningful about this topic.`;

    const userPrompt = `Write an educational passage about "${searchQuery}" for Level ${normalizedLevel} English learners.

Requirements:
- ${wordRange.min}-${wordRange.max} words
- ${vocabConstraints}
- Include fascinating facts and insights
- Make it engaging and memorable
- Use information from reliable sources
- Avoid generic introduction phrases

Make this genuinely interesting and educational!`;

    // OpenAI API呼び出し
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let englishContent = data.choices?.[0]?.message?.content?.trim();

    if (!englishContent) {
      throw new Error('No content generated');
    }

    // 不要なラベル除去
    const labelPatterns = [
      /^(English|日本語|Japanese)\s*(Translation|翻訳)?\s*\d*:?\s*/gim,
      /^(English|日本語)\s*(Paragraph|段落)?\s*\d*:?\s*/gim,
      /^【.*?】\s*/gm,
      /^\*\*.*?\*\*\s*/gm
    ];

    labelPatterns.forEach(pattern => {
      englishContent = englishContent.replace(pattern, '');
    });

    // Step 4: 日本語翻訳生成
    const japanesePrompt = `Translate the following educational English text to natural Japanese. 
    
Requirements:
- Natural, flowing Japanese
- Educational and engaging style
- Maintain the factual accuracy
- Use appropriate Japanese vocabulary
- Make it interesting for Japanese readers

English text:
${englishContent}`;

    const japaneseResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a professional translator. Create natural, engaging Japanese translations.' },
          { role: 'user', content: japanesePrompt }
        ],
        max_tokens: 1000,
        temperature: 0.5
      })
    });

    let japaneseContent = '';
    if (japaneseResponse.ok) {
      const japaneseData = await japaneseResponse.json();
      japaneseContent = japaneseData.choices?.[0]?.message?.content?.trim() || '';
    }

    if (!japaneseContent) {
      japaneseContent = '翻訳を生成中です...';
    }

    // 段落分割
    const formattedContent = addParagraphBreaks(englishContent, japaneseContent, normalizedLevel);

    console.log(`✅ 生成完了: ${englishContent.split(' ').length}語`);

    return NextResponse.json({
      english: formattedContent.english,
      japanese: formattedContent.japanese,
      wordCount: englishContent.split(' ').filter(word => word.trim()).length,
      level: normalizedLevel,
      topic: searchQuery,
      originalTopic: topic,
      sourceUrl: referenceUrl,
      wikipediaTitle: wikipediaData?.title || null
    });

  } catch (error) {
    console.error('❌ 生成エラー:', error);
    
    // フォールバック
    const fallbackContent = `I apologize, but I cannot generate content about this topic right now. Please try again with a different topic or check your internet connection.`;
    const fallbackJapanese = `申し訳ございませんが、このトピックに関するコンテンツを現在生成できません。別のトピックでお試しいただくか、インターネット接続をご確認ください。`;
    
    return NextResponse.json({
      english: fallbackContent,
      japanese: fallbackJapanese,
      wordCount: fallbackContent.split(' ').length,
      level: 3,
      topic: topic,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}