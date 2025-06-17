import { buildLetterPrompt } from './buildLetterPrompt';

export async function generateLetter(city: string, level: string): Promise<{ title: string; body: string }> {
  const prompt = buildLetterPrompt(city, level);

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  const text = await response.text();

  // JSON形式だけを抽出
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON response not found in Claude output');

  try {
    const json = JSON.parse(jsonMatch[0]);
    return {
      title: json.title || `A Letter from ${city}`,
      body: json.body || ''
    };
  } catch (e) {
    console.error('JSON parse error:', e);
    throw new Error('Invalid JSON format from Claude');
  }
}