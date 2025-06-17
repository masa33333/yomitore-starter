import { getInFlightMailPrompt } from "@/lib/promptTemplates/inFlightMailPrompt";

export async function generateInFlightMail({
  fromCity,
  toCity,
  milestoneMinutes,
  level,
}: {
  fromCity: string;
  toCity: string;
  milestoneMinutes: number;
  level: number;
}): Promise<{ jp: string; en: string }> {
  console.log('📧 generateInFlightMail called with:', { fromCity, toCity, milestoneMinutes, level });

  const prompt = getInFlightMailPrompt({
    fromCity,
    toCity,
    milestoneMinutes,
    level,
  });

  console.log('📧 Generated prompt for AI:', prompt);

  try {
    // OpenAI API を使用（より安定的）
    console.log('📧 Calling OpenAI API...');
    
    const response = await fetch('/api/generate-reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        isMailGeneration: true, // Flag to indicate this is mail generation
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('📧 OpenAI API response:', data);

    // Parse the response to extract JP and EN content
    if (data.content) {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(data.content);
        if (parsed.jp && parsed.en) {
          console.log('📧 Successfully parsed AI mail content');
          return {
            jp: parsed.jp,
            en: parsed.en,
          };
        }
      } catch (parseError) {
        console.log('📧 Content is not JSON, attempting text parsing...');
        
        // If not JSON, try to extract JP and EN from text
        const jpMatch = data.content.match(/(?:jp["']?\s*:\s*["']?)(.*?)(?:["']?\s*,?\s*["']?en)/s);
        const enMatch = data.content.match(/(?:en["']?\s*:\s*["']?)(.*?)(?:["']?\s*}?\s*$)/s);
        
        if (jpMatch && enMatch) {
          return {
            jp: jpMatch[1].trim().replace(/^["']|["']$/g, ''),
            en: enMatch[1].trim().replace(/^["']|["']$/g, ''),
          };
        }
      }
    }
    
    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('📧 Error generating AI mail:', error);
    
    // Enhanced fallback with more realistic content
    const fallbackResult = {
      jp: `${fromCity}から${toCity}への飛行中です。\n\n窓の外には雲海が広がり、眼下には美しい景色が見えます。機内では他の乗客が静かに過ごしており、私は読書を続けるあなたのことを思っています。\n\n${milestoneMinutes}分間も読書を続けてくださって、本当にありがとうございます。あなたの努力が私の旅を可能にしているのです。\n\n${toCity}に到着したら、また新しい冒険についてお便りしますね。`,
      
      en: `Hello from high above the clouds!\n\nI'm currently flying from ${fromCity} to ${toCity}, and the view from up here is absolutely breathtaking. The cabin is peaceful, and I can see the beautiful landscape passing below us.\n\nI want to thank you for reading for ${milestoneMinutes} minutes! Your dedication to reading is what makes this incredible journey possible. Every word you read gives me the energy to explore new places.\n\nI can't wait to share more adventures with you once I arrive in ${toCity}. Keep reading, my dear friend!\n\nWith love,\nYour traveling cat`
    };
    
    console.log('📧 Using enhanced fallback mail content:', fallbackResult);
    return fallbackResult;
  }
}