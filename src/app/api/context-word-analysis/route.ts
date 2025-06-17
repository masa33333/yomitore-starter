import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  let word = 'word';
  let contextSentence = 'No context available';
  let outputLanguage = 'japanese';
  
  try {
    const requestData = await req.json();
    word = requestData.word || 'word';
    contextSentence = requestData.contextSentence || 'No context available';
    outputLanguage = requestData.outputLanguage || 'japanese';

    if (!word || !contextSentence) {
      return NextResponse.json({ error: '単語と文脈が必要です' }, { status: 400 });
    }

    console.log('🔍 文脈ベース語義分析リクエスト:', { word, contextSentence, outputLanguage });

    const languageInstruction = outputLanguage === 'japanese' 
      ? '意味は日本語で出力してください。' 
      : '意味は英語で出力してください。';

    const userPrompt = `単語の文脈分析とJSON形式出力
以下の条件に基づき、指定のJSON形式で語彙情報を出力してください。

【入力】
単語：${word}
出現文：${contextSentence}

【出力形式】
以下のJSON形式で出力してください：

{
  "word": "実際の単語（元の形）",
  "base": "原形（動詞・形容詞・副詞の場合のみ、名詞の複数形も含む）",
  "pos": "品詞（英語1語：n, v, adj, adv, prep, conj, etc.）",
  "meaning_en": "英語での意味（簡潔に）",
  "meaning_ja": "日本語での意味（簡潔に）",
  "example_en": "英語例文（読み物内と同じ語形・品詞で使用）",
  "example_ja": "日本語訳（自然な表現）"
}

【重要なルール】
1. 品詞は必ず英語1語の略語で（n=名詞, v=動詞, adj=形容詞, adv=副詞, prep=前置詞, conj=接続詞, etc.）
2. example_en内のその単語は、読み物内での語形・品詞と完全一致させる（例：reading → readingで使う）
3. 意味は簡潔に（meaning_en, meaning_jaともに1文程度）
4. 例文は文法的に自然で、その語の使い方がよく分かる短文
5. 文脈に基づいた自然な語義（辞書的定義は避ける）
6. baseは語形変化がある場合のみ（known→know, running→run, books→book等）

【品詞略語リスト】
- n: noun（名詞）
- v: verb（動詞）  
- adj: adjective（形容詞）
- adv: adverb（副詞）
- prep: preposition（前置詞）
- conj: conjunction（接続詞）
- pron: pronoun（代名詞）
- interj: interjection（間投詞）
- det: determiner（限定詞）

【出力例】
{
  "word": "known",
  "base": "know",
  "pos": "adj",
  "meaning_en": "famous or recognized by many people",
  "meaning_ja": "知られている、よく知られた",
  "example_en": "He is known for his kindness.",
  "example_ja": "彼は親切で知られている。"
}

出力はJSONのみ。説明文は不要です。`;

    console.log('📤 OpenAIに送信する文脈分析プロンプト');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a professional linguist and dictionary expert specializing in contextual word analysis. Analyze words precisely based on their usage in given sentences. Follow the exact format requested with no additional text." 
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 600,
    });

    const rawResponse = completion.choices[0].message.content?.trim() ?? "";
    console.log('📥 OpenAIからの文脈分析応答:', rawResponse);

    // JSONレスポンスを解析
    let parsedData;
    try {
      // JSONとして直接パースを試行
      parsedData = JSON.parse(rawResponse);
    } catch (jsonError) {
      console.log('直接JSON解析失敗、文字列から抽出を試行');
      
      // JSON部分を抽出してパースを試行
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.error('JSON抽出も失敗:', extractError);
          throw new Error('Invalid JSON response');
        }
      } else {
        throw new Error('No JSON found in response');
      }
    }

    // 必要なフィールドの検証とデフォルト値設定
    const result = {
      word: parsedData.word || word,
      base: parsedData.base || undefined,
      pos: parsedData.pos || 'n',
      meaning_en: parsedData.meaning_en || 'Definition not available',
      meaning_ja: parsedData.meaning_ja || '定義を取得できませんでした',
      example_en: parsedData.example_en || contextSentence,
      example_ja: parsedData.example_ja || 'Translation not available'
    };

    console.log('✅ 文脈分析完了:', result);

    return NextResponse.json(result);

  } catch (err) {
    console.error("context word analysis error:", err);
    
    return NextResponse.json({ 
      error: "文脈分析に失敗しました",
      word: word,
      base: undefined,
      pos: 'n',
      meaning_en: 'Analysis failed',
      meaning_ja: '分析に失敗しました',
      example_en: contextSentence,
      example_ja: '分析に失敗しました。'
    }, { status: 500 });
  }
}