import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { getPromptTemplate } from "@/constants/promptTemplates";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { originalText, targetLevel, title } = await req.json();

    if (!originalText || !targetLevel) {
      return NextResponse.json({ error: 'originalText and targetLevel are required' }, { status: 400 });
    }

    console.log('🔄 レベル変換リクエスト:', { targetLevel, textLength: originalText.length });

    const promptTemplate = getPromptTemplate(targetLevel);
    
    const systemMessage = `You are an expert English rewriter specializing in NGSL vocabulary control.`;
    
    const userPrompt = `${promptTemplate}

TASK: Rewrite the following text to match Level ${targetLevel} vocabulary constraints while keeping the same meaning and story.

Original text:
"${originalText}"

REQUIREMENTS:
- Keep the EXACT same story and meaning
- Keep the same number of paragraphs
- Follow ALL NGSL vocabulary constraints from the template above
- Ensure proper word count as specified in the template
- Every word must be within the specified NGSL range

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