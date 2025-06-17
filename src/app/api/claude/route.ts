// app/api/claude/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { buildLetterPrompt } from '@/utils/buildLetterPrompt';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY as string;

export async function POST(req: NextRequest) {
  const { city, level } = await req.json();
  
  if (!city || !level) {
    return NextResponse.json({ error: 'Missing city or level' }, { status: 400 });
  }

  try {
    const prompt = buildLetterPrompt(city, level); // 事前に整備したプロンプト関数

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    // Claudeは content = text（JSONではない）を返す → 中のJSONだけを抽出
    const rawText = data.content?.[0]?.text || '';

    // 手紙のJSON文字列をパース
    const parsed = JSON.parse(rawText);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Claude API error:', err);
    return NextResponse.json({ error: 'Failed to generate letter' }, { status: 500 });
  }
}