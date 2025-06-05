import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { topic, emotion, style, level } = await req.json();

    // 🧠 日本語で構造的・感情的に優れた読み物をまず生成
    const japanesePrompt = `
以下の条件に基づいて、800文字程度の日本語の読み物を作成してください。

【テーマ】
- 「${topic}」について書いてください。
- 初心者でも理解できるよう、噛み砕いた表現を使ってください。

【目的の感情】
- 読者が「${emotion}」を感じられるように内容を構成してください。
- 感情を引き起こすエピソードや比喩、問いかけなどを用いてください。

【文体スタイル】
- 「${style}」の形式で書いてください。
  - 例:
    - 「対話形式」の場合：登場人物のやりとりで説明してください。
    - 「専門家による解説」の場合：読者に語りかけるように丁寧に解説してください。
    - 「物語風」の場合：ストーリー仕立てで展開してください（登場人物や場面描写を含めるとよい）。

【制約】
- 単なる事実説明で終わらず、読者の心に残るような結びの一文を文末に入れてください。

    const jpResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: japanesePrompt }
      ],
      temperature: 0.9,
    });

    const japanese = jpResponse.choices[0]?.message?.content?.trim();

    if (!japanese) {
      return NextResponse.json({ error: '日本語生成に失敗しました。' }, { status: 500 });
    }

    // 🌍 NGSL語彙レベルに配慮して英語翻訳（レベル変数を活用）
    const englishPrompt = `
以下の日本語の内容を、語彙レベル${level}に合わせて簡単な英語に翻訳してください。
- 必要に応じて表現を言い換えてもOK
- 小学生〜中学生レベルで理解できる自然な英語にしてください
- 内容の感動・驚き・面白さを損なわないように配慮してください

-----
${japanese}
-----
`; 

    const enResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: englishPrompt }
      ],
      temperature: 0.7,
    });

    const english = enResponse.choices[0]?.message?.content?.trim();

    return NextResponse.json({ japanese, english });
  } catch (error) {
    console.error('Error generating reading:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
