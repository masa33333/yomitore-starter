const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY!;

export async function callClaudeAPI(prompt: string) {
  console.log('📨 Prompt sent to Claude:\n', prompt);

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        }
      ]
    })
  });

  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';
  console.log('🪵 Claude raw response:\n', rawText);

  const match = rawText.match(/```json\s*({[\s\S]*?})\s*```/);
  if (!match) throw new Error('Claude did not return valid JSON inside a code block');

  const jsonString = match[1];
  console.log('🔧 Raw JSON string:\n', jsonString);
  
  try {
    const parsedResult = JSON.parse(jsonString);
    console.log('✅ Parsed JSON result:', parsedResult);
    console.log('✅ parsedResult.en:', parsedResult.en);
    console.log('✅ parsedResult.jp:', parsedResult.jp);
    console.log('✅ en に \\n\\n が含まれているか:', parsedResult.en?.includes('\n\n'));
    console.log('✅ jp に \\n\\n が含まれているか:', parsedResult.jp?.includes('\n\n'));
    console.log('✅ en の文字列表現:', JSON.stringify(parsedResult.en));
    console.log('✅ jp の文字列表現:', JSON.stringify(parsedResult.jp));
    return parsedResult;
  } catch (parseError) {
    console.error('❌ JSON Parse Error:', parseError);
    console.error('❌ Failed JSON content:', JSON.stringify(jsonString));
    
    // フォールバック1: 制御文字を置換して再試行
    try {
      const cleanedJson = jsonString
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 制御文字を削除
        .replace(/\\n/g, '\\\\n')  // 既にエスケープされた改行を保持
        .replace(/\\"/g, '\\\\"'); // 既にエスケープされたクォートを保持
      
      console.log('🔧 Cleaned JSON attempt:\n', cleanedJson);
      return JSON.parse(cleanedJson);
    } catch (secondError) {
      console.error('❌ Second JSON Parse Error:', secondError);
      
      // フォールバック2: マークダウンコードブロックなしでJSONを探す
      const fallbackMatch = rawText.match(/{[\s\S]*}/);
      if (fallbackMatch) {
        console.log('🔄 Trying fallback JSON extraction');
        return JSON.parse(fallbackMatch[0]);
      }
      
      throw new Error('Could not parse JSON from Claude response');
    }
  }
}