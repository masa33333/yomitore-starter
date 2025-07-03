import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const word = requestData.word || 'word';
    const contextSentence = requestData.contextSentence || 'No context available';
    
    console.log('📝 Context word analysis request (fallback mode):', { word, contextSentence });

    // Return a simple fallback response without external dependencies
    const result = {
      word: word,
      base: undefined,
      pos: 'n',
      meaning_en: 'Definition analysis temporarily unavailable',
      meaning_ja: '定義の分析は一時的に利用できません',
      example_en: contextSentence,
      example_ja: '例文の翻訳は一時的に利用できません'
    };

    console.log('✅ Context analysis fallback result:', result);
    return NextResponse.json(result);

  } catch (err) {
    console.error("Context word analysis error:", err);
    
    return NextResponse.json({ 
      error: "Context analysis temporarily unavailable",
      word: 'unknown',
      base: undefined,
      pos: 'n',
      meaning_en: 'Analysis failed',
      meaning_ja: '分析に失敗しました',
      example_en: 'No context available',
      example_ja: '分析に失敗しました。'
    }, { status: 500 });
  }
}