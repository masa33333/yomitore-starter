import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  let word = 'word';
  let originalForm = 'word';
  let context = '';
  let detailedPos = '';
  
  try {
    const requestData = await req.json();
    word = requestData.word || 'word';
    originalForm = requestData.originalForm || 'word';
    context = requestData.context || '';
    detailedPos = requestData.detailedPos || '';

    if (!word) {
      return NextResponse.json({ error: '単語が指定されていません' }, { status: 400 });
    }

    console.log('📝 単語情報取得リクエスト:', { word, originalForm, detailedPos });

    const userPrompt = `Please provide a structured definition for the word: "${word}"

Output must include all of the following:

1. Part of speech (one only): noun / verb / adjective / adverb / etc.
2. Japanese meaning: a clear, native-level translation
3. Simple English paraphrase: 1–2 words or phrases a beginner can understand
4. Example sentence: one natural sentence using this word "${originalForm || word}"
5. Japanese translation of the example sentence

Format strictly as follows (no labels other than these):

Part of speech: ...
Japanese meaning: ...
Paraphrase: ...
Example: ...
Translation: ...

${context ? `Context: "${context}"` : ''}
${detailedPos ? `Grammar hint: ${detailedPos}` : ''}`;

    console.log('📤 OpenAIに送信するプロンプト:', userPrompt.substring(0, 200) + '...');

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a professional English-Japanese dictionary. Follow the exact format requested with no additional text." 
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const raw = completion.choices[0].message.content ?? "";
    console.log('📥 OpenAIからの応答:', raw);

    try {
      // テキスト形式のレスポンスを解析
      const lines = raw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      let partOfSpeech = 'unknown';
      let japaneseMeaning = '意味を取得できませんでした';
      let paraphrase = '';
      let exampleEnglish = `This is an example with "${word}".`;
      let exampleJapanese = `これは「${word}」を使った例文です。`;

      // 各行を解析
      for (const line of lines) {
        if (line.startsWith('Part of speech:')) {
          partOfSpeech = line.replace('Part of speech:', '').trim();
        } else if (line.startsWith('Japanese meaning:')) {
          japaneseMeaning = line.replace('Japanese meaning:', '').trim();
        } else if (line.startsWith('Paraphrase:')) {
          paraphrase = line.replace('Paraphrase:', '').trim();
        } else if (line.startsWith('Example:')) {
          exampleEnglish = line.replace('Example:', '').trim();
        } else if (line.startsWith('Translation:')) {
          exampleJapanese = line.replace('Translation:', '').trim();
        }
      }

      console.log('✅ 単語情報取得成功:', word);
      return NextResponse.json({
        japaneseMeaning: japaneseMeaning,
        exampleEnglish: exampleEnglish,
        exampleJapanese: exampleJapanese,
        partOfSpeech: partOfSpeech,
        paraphrase: paraphrase || null
      });

    } catch (parseError) {
      console.error('テキスト解析エラー:', parseError);
      
      // フォールバック: 簡易的な応答を生成
      return NextResponse.json({
        japaneseMeaning: '意味を取得できませんでした',
        exampleEnglish: `This is an example with "${word}".`,
        exampleJapanese: `これは「${word}」を使った例文です。`,
        partOfSpeech: detailedPos || 'unknown',
        paraphrase: null
      });
    }

  } catch (err) {
    console.error("word-info error:", err);
    return NextResponse.json({ 
      error: "単語情報の取得に失敗しました",
      japaneseMeaning: '意味を取得できませんでした',
      exampleEnglish: `Example sentence with "${word}".`,
      exampleJapanese: 'サンプル例文です。',
      partOfSpeech: 'unknown'
    }, { status: 500 });
  }
}
