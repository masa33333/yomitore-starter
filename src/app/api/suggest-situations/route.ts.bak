import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { protagonist, genre } = await req.json();

    if (!protagonist) {
      return NextResponse.json({ error: '主人公タイプが指定されていません' }, { status: 400 });
    }

    console.log('📝 状況提案リクエスト:', { protagonist, genre });

    // ジャンル別の詳細な指示
    const genreInstructions = {
      'comedy': `コメディジャンルらしく、日常的でユーモラスな状況を提案してください。
        - 学校、職場、家庭での面白いトラブル
        - 誤解やハプニングから生まれる笑える状況
        - 現実的だが少しばかばかしい困った状況
        - 恋愛での勘違いやコミュニケーションの食い違い`,
      
      'serious': `シリアスなジャンルらしく、現実的で深刻な状況を提案してください。
        - 家族の問題や人間関係の悩み
        - 仕事や学業での重要な選択や挫折
        - 社会問題や倫理的なジレンマ
        - 成長や自己発見につながる困難な状況`,
      
      'suspense': `サスペンスジャンルらしく、謎や緊張感のある現実的な状況を提案してください。
        - 失踪事件や不可解な出来事の調査
        - 秘密の発見や隠された真実の追求
        - 危険な状況からの脱出や回避
        - 裏切りや陰謀に巻き込まれる状況`,
      
      'fantasy': `ファンタジージャンルらしく、魔法的要素を含む状況を提案してください。
        - 魔法の力や不思議なアイテムとの出会い
        - 異世界への冒険や謎の生き物との遭遇  
        - 古い呪いや予言に関わる使命
        - 魔法学校や魔法使いとしての成長`
    };

    const genreInstruction = genreInstructions[genre as keyof typeof genreInstructions] || 
      '興味深く魅力的な状況を提案してください。';

    const userPrompt = `
あなたは創作のプロです。
「${protagonist}」という性格の主人公が直面する状況を3つ提案してください。

ジャンル別要件:
${genreInstruction}

提案要件:
1. それぞれ15-25文字程度の簡潔な表現
2. 主人公の性格「${protagonist}」にふさわしい状況
3. ジャンル「${genre || '一般'}」の特徴を活かした内容
4. 興味深く、読者が続きを読みたくなる状況
5. 日本語で表現

以下の形式で回答してください：
1. [状況1]
2. [状況2] 
3. [状況3]
    `.trim();

    console.log('📤 OpenAIに送信するプロンプト:', userPrompt.substring(0, 200) + '...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたは創作のエキスパートです。魅力的で具体的な状況を提案してください。" },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const raw = completion.choices[0].message.content ?? "";
    console.log('📥 OpenAIからの応答:', raw);

    // 応答を解析して状況のリストを抽出
    const lines = raw.split('\n').filter(line => line.trim());
    const suggestions = lines
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(suggestion => suggestion.length > 0);

    if (suggestions.length === 0) {
      console.log('❌ 状況提案の解析に失敗');
      return NextResponse.json({ error: '状況提案の生成に失敗しました' }, { status: 500 });
    }

    console.log('✅ 状況提案生成成功:', suggestions);
    return NextResponse.json({ suggestions });

  } catch (err) {
    console.error("suggest-situations error:", err);
    return NextResponse.json({ error: "状況提案の生成に失敗しました" }, { status: 500 });
  }
}