import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { originalText, targetLevel, title } = await req.json();

    if (!originalText || !targetLevel) {
      return NextResponse.json({ error: 'originalText and targetLevel are required' }, { status: 400 });
    }

    console.log('🔄 レベル変換リクエスト:', { targetLevel, textLength: originalText.length });

    const systemMessage = `You are a professional English educational content writer specializing in rewriting content for different vocabulary levels.`;

    const userPrompt = `
Rewrite the following English text to match vocabulary level ${targetLevel} (1=beginner, 5=advanced).

Original text:
"${originalText}"

Requirements:
- Keep the EXACT same story, plot, and meaning
- Keep the same number of paragraphs and overall structure  
- Only change vocabulary difficulty to match level ${targetLevel}
- Maintain the same tone and style
- For level 1-2: Use simple, basic vocabulary and simple sentence structures
- For level 3: Use intermediate vocabulary with some complex sentences
- For level 4-5: Use advanced vocabulary and complex sentence structures

Output only the rewritten text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const rewrittenText = completion.choices[0].message.content?.trim() ?? "";
    
    if (rewrittenText && rewrittenText.length > 0) {
      console.log('✅ レベル変換成功:', { targetLevel, originalLength: originalText.length, newLength: rewrittenText.length });
      return NextResponse.json({ rewrittenText });
    } else {
      console.log('⚠️ レベル変換結果が空');
      return NextResponse.json({ error: 'レベル変換に失敗しました' }, { status: 500 });
    }

  } catch (err) {
    console.error("Level rewrite error:", err);
    return NextResponse.json({ 
      error: "レベル変換に失敗しました",
      rewrittenText: ""
    }, { status: 500 });
  }
}