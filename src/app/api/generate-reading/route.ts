// ✅ /api/generate-reading/route.ts（正常動作していた復元版）
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { theme, subTopic, style, level } = await req.json();

  const systemPrompt = `あなたは "Storyteller AI" です。以下の指示に従って、日本語と英語の読み物を出力してください。`;

  const userPrompt = `
■テーマ
${theme}

${subTopic ? `■特に知りたいこと\n${subTopic}` : ''}

■スタイル
${style}

---
【出力形式】
- 最初に【日本語】という見出しをつけて本文を出力
- 空行（1行以上）を挟んで、次に【英語】という見出しをつけて本文を出力
- 出力の長さや内容を要約しないこと

【内容条件】
- 読者が驚くような事実（数値や意外な比較）を最低1つ含める
- 転機を2回描写し、因果関係を明確に示す
- 抽象的修辞を避け、事実に基づいた具体的描写を用いる
- 架空の人物・逸話は禁止。不明な情報は「確認できませんでした」と記述する
- 英語は日本語と同等の情報量であり、自然な語彙・構文で構成（目安：200〜400語）
- 翻訳ではなく、各言語で自然に読み物として成立させること
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';
  const [jpBlock, enBlock] = raw.split(/【英語】/);

  return new Response(
    JSON.stringify({
      japanese: jpBlock.replace(/【日本語】/, '').trim(),
      english: enBlock?.trim() || '',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
