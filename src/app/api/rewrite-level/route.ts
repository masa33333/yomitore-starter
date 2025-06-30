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
    
    const systemMessage = `You are an expert English rewriter specializing in NGSL vocabulary control. CRITICAL: Always ensure the rewritten text meets the exact word count requirements for the target level. Count your words carefully and add more details, examples, or descriptions if needed to reach the minimum word count.`;
    
    // レベル別の語数要求を明確化
    const wordCountRequirements = {
      1: "80-120 words exactly",
      2: "110-150 words exactly (CRITICAL: Must reach at least 110 words)",
      3: "140-200 words exactly (CRITICAL: Must reach at least 140 words)",
      4: "200-240 words exactly (CRITICAL: Must reach at least 200 words)",
      5: "240-280 words exactly (CRITICAL: Must reach at least 240 words)"
    };

    const userPrompt = `${promptTemplate}

TASK: Rewrite the following text to match Level ${targetLevel} vocabulary constraints while keeping the same meaning and story.

Original text:
"${originalText}"

🚨 CRITICAL WORD COUNT EMERGENCY 🚨
ABSOLUTE REQUIREMENT: ${wordCountRequirements[targetLevel as keyof typeof wordCountRequirements] || wordCountRequirements[3]}

⚠️ WARNING: Your rewrite will be REJECTED if it has fewer than the minimum word count.
⚠️ You MUST expand the content to reach the required word count.
⚠️ Count your words as you write.

CRITICAL REQUIREMENTS:
- Keep the EXACT same story and meaning
- Follow ALL NGSL vocabulary constraints from the template above
- Every word must be within the specified NGSL range

EXPANSION STRATEGIES (MANDATORY if text is too short):
- Add detailed background information and context
- Include specific examples and illustrations
- Expand character descriptions and motivations
- Add sensory details and environmental descriptions
- Include dialogue and character interactions
- Add step-by-step explanations of processes
- Provide historical or cultural context
- Include comparisons and analogies
- Add "what happened next" details
- Expand emotional descriptions and reactions

IMPORTANT: You MUST add enough content to reach the minimum word count. Be comprehensive and detailed.

Output only the rewritten text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2, // 語数制御のため温度をさらに下げる
      max_tokens: 2500, // より多くのトークンを許可
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