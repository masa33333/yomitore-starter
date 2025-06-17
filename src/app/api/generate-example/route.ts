import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  let word = 'word';
  let partOfSpeech = 'noun';
  let level = 'B1';
  let context = '';
  
  try {
    const requestData = await req.json();
    word = requestData.word || 'word';
    partOfSpeech = requestData.partOfSpeech || 'noun';
    level = requestData.level || 'B1';
    context = requestData.context || '';

    if (!word) {
      return NextResponse.json({ error: '単語が指定されていません' }, { status: 400 });
    }

    console.log('🔄 例文生成リクエスト:', { word, partOfSpeech, level, context: context ? 'あり' : 'なし' });

    const contextInfo = context ? `\n- 文脈：「${context}」（この文脈に適した用法で例文を作ってください）` : '';
    
    const userPrompt = `語彙レベルに応じた例文の自動生成（英語＋日本語訳）
次の単語について、語彙学習用に適した例文を1つ英語で作り、日本語訳も付けてください：

- 単語：${word}
- 品詞：${partOfSpeech}
- CEFRレベル：${level || 'B1'}（例：A2, B1）${contextInfo}

条件：
1. 単語の意味が自然に伝わる簡潔な文にしてください（辞書っぽさはNG）
2. 構文はシンプルに（中学生〜高校生が理解できる程度）
3. ${context ? 'コンテキストで使われている意味に合わせた例文を作ってください' : '一般的で分かりやすい用法の例文を作ってください'}
4. 日本語訳は自然で読みやすい表現にしてください
5. 英文1文＋日本語訳1文、以下の形式で：

英文:
...

日本語訳:
...`;

    console.log('📤 OpenAIに送信する例文生成プロンプト');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a professional English language teacher specializing in vocabulary learning. Create natural, level-appropriate example sentences that help students understand word meanings in context." 
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    let response = completion.choices[0].message.content?.trim() ?? "";
    console.log('📥 OpenAIからの例文生成応答:', response);
    
    // レスポンスから英文と日本語訳を抽出
    const englishMatch = response.match(/英文:\s*(.+)/);
    const japaneseMatch = response.match(/日本語訳:\s*(.+)/);
    
    const exampleEnglish = englishMatch ? englishMatch[1].trim() : `The ${word} was important in the situation.`;
    const exampleJapanese = japaneseMatch ? japaneseMatch[1].trim() : `その${word}は状況において重要でした。`;
    
    console.log('✅ 例文生成成功:', { exampleEnglish, exampleJapanese });
    
    return NextResponse.json({ 
      exampleEnglish: exampleEnglish,
      exampleJapanese: exampleJapanese
    });

  } catch (err) {
    console.error("example generation error:", err);
    return NextResponse.json({ 
      error: "例文の生成に失敗しました",
      exampleEnglish: `This is an example with "${word}".`,
      exampleJapanese: "例文の生成に失敗しました。"
    }, { status: 500 });
  }
}