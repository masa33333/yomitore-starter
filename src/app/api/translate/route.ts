import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  let text = '';
  let targetLanguage = 'Japanese';
  let isStory = false;
  
  try {
    const requestData = await req.json();
    text = requestData.text || '';
    targetLanguage = requestData.targetLanguage || 'Japanese';
    isStory = requestData.isStory || false;

    if (!text) {
      return NextResponse.json({ error: 'テキストが指定されていません' }, { status: 400 });
    }

    const userPrompt = `Translate the following English text to natural Japanese:

"${text}"

Requirements:
- Provide a natural, native-level Japanese translation
- Maintain the original meaning and tone
- Use appropriate Japanese vocabulary and grammar
- For dictionary definitions, use formal Japanese expressions
- For example sentences, use natural conversational Japanese

Output only the Japanese translation, nothing else.`;

    // ストーリーモードの場合はより多くのトークンを許可
    const maxTokens = isStory ? 8000 : 1000;
    const model = isStory ? "gpt-4o-mini" : "gpt-3.5-turbo";

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { 
          role: "system", 
          content: "You are a professional English-Japanese translator. Provide accurate, natural Japanese translations." 
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    let translation = completion.choices[0].message.content?.trim() ?? "";
    
    // 引用符を除去（文頭・文末のみ）
    translation = translation.replace(/^["'「『]/, '').replace(/["'」』]$/, '').trim();

    if (translation && translation.length > 0) {
      return NextResponse.json({ translation: translation });
    } else {
      return NextResponse.json({ translation: text }); // 元のテキストを返す
    }

  } catch (err) {
    return NextResponse.json({ 
      error: "翻訳の取得に失敗しました",
      translation: text || "翻訳に失敗しました"
    }, { status: 500 });
  }
}