// src/lib/prompts.ts
import type { RoutePoint } from '@/lib/types'

export function buildDiaryPrompt(waypoint: RoutePoint, level: 'A1' | 'A2' | 'B1' | 'B2') {
  const levelInstructions = {
    A1: 'Use CEFR A1 level English. Use only basic vocabulary and very short sentences.',
    A2: 'Use CEFR A2 level English. Use simple, common words and short sentences.',
    B1: 'Use CEFR B1 level English. Avoid rare or abstract words.',
    B2: 'Use CEFR B2 level English. Natural phrasing is allowed, but avoid idioms.',
  };

  return `
You are a cat traveling the world.

Write a rich, vivid diary entry (about 300 words) about your experience passing through "${waypoint.name}" in Japan.

Include:
1. Sensory descriptions (what you saw, smelled, heard)
2. Emotional reactions or small discoveries
3. Personal, warm tone

Return ONLY valid JSON like this:

{
  "en": "Paragraph 1.\\n\\nParagraph 2.\\n\\nParagraph 3.",
  "jp": "対応する日本語訳（段落ごとに改行あり）",
  "photoTier": "none"
}

${levelInstructions[level] || levelInstructions.B1}
Insert explicit line breaks (\\n\\n) between paragraphs in the "en" field. Do the same for the Japanese translation in "jp".
Translate naturally, not literally.

You MUST return your response in this exact format with markdown code block:

\`\`\`json
{
  "en": "Your English diary entry here with \\n\\n between paragraphs...",
  "jp": "Your Japanese translation here with \\n\\n between paragraphs...",
  "photoTier": "stock"
}
\`\`\`

Do NOT include any other text before or after the code block.
`.trim();
}