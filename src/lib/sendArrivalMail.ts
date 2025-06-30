import { saveLetterToStorage } from "@/lib/letterStorage";
import { buildArrivalPrompt } from "@/lib/promptTemplates/arrivalPrompt";
import { showNotification } from "@/lib/notificationUtils";
import { setArrivalMailFlag } from "@/lib/arrivalMailUtils";
import { mapQuizLevelToGenerationLevel } from "@/utils/getEnglishText";

/**
 * 到着メール送信関数
 * @param city 到着都市名
 */
export async function sendArrivalMail(city: string): Promise<void> {
  try {
    console.log(`📬 Sending arrival mail for ${city}`);
    
    // ユーザーレベル取得 - クイズレベル（1-10）から生成レベル（1-5）にマッピング
    const quizLevel = parseInt(localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || '5', 10);
    const userLevel = mapQuizLevelToGenerationLevel(quizLevel);
    console.log(`📬 Level mapping: Quiz Lv.${quizLevel} → Generation Lv.${userLevel}`);
    
    // プロンプト生成
    const prompt = buildArrivalPrompt(city, userLevel);
    console.log('📬 Generated arrival prompt:', prompt);
    
    // Claude API呼び出し
    console.log('📬 Calling OpenAI API for arrival mail...');
    const response = await fetch('/api/generate-reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        isMailGeneration: true, // Use mail generation endpoint
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('📬 Arrival mail API response:', data);

    let mailContent: { jp: string; en: string };

    // Parse the response
    if (data.content) {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(data.content);
        if (parsed.jp && parsed.en) {
          mailContent = {
            jp: parsed.jp,
            en: parsed.en,
          };
          console.log('📬 Successfully parsed arrival mail content');
        } else {
          throw new Error('Invalid JSON structure');
        }
      } catch (parseError) {
        console.log('📬 Content is not JSON, using fallback...');
        throw parseError;
      }
    } else {
      throw new Error('No content in API response');
    }

    // レター保存
    saveLetterToStorage({
      type: "letter",
      city,
      jp: mailContent.jp,
      en: {
        [userLevel]: mailContent.en
      },
    });
    
    console.log('📬 Arrival letter saved to storage');
    
    // 到着メールフラグ設定
    setArrivalMailFlag(city);
    
    // 通知表示
    showNotification();
    
    console.log(`✅ Arrival mail sent successfully for ${city}`);
    
  } catch (error) {
    console.error('📬 Error sending arrival mail:', error);
    
    // フォールバック処理
    const quizLevel = parseInt(localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || '5', 10);
    const userLevel = mapQuizLevelToGenerationLevel(quizLevel);
    const catName = localStorage.getItem('catName') || 'Your cat';
    
    const fallbackContent = {
      jp: `${city}に到着しました！\n\n長い旅路でしたが、ついにこの美しい街に辿り着くことができました。街の雰囲気は素晴らしく、新しい冒険への期待で胸が躍っています。\n\nあなたの読書のおかげで、この旅が実現できました。本当にありがとうございます。\n\n${city}での新しい発見を、また手紙でお知らせしますね。\n\n愛を込めて、\n${catName}`,
      
      en: `I've finally arrived in ${city}!\n\nAfter such a long journey, I've reached this beautiful city at last. The atmosphere here is wonderful, and I'm filled with excitement for new adventures ahead.\n\nThanks to your dedication to reading, this journey became possible. I'm truly grateful for your support.\n\nI'll share my new discoveries in ${city} with you in my next letter.\n\nWith love,\n${catName}`
    };
    
    // フォールバックでもレター保存
    saveLetterToStorage({
      type: "letter",
      city,
      jp: fallbackContent.jp,
      en: {
        [userLevel]: fallbackContent.en
      },
    });
    
    // 到着メールフラグ設定
    setArrivalMailFlag(city);
    
    // 通知表示
    showNotification();
    
    console.log(`📬 Fallback arrival mail sent for ${city}`);
  }
}