import { saveLetterToStorage } from "@/lib/letterStorage";
import { buildInFlightPrompt } from "@/lib/promptTemplates/inFlightPrompt";
import { showNotification } from "@/lib/notificationUtils";
import { countWords, calculateWPM } from "@/lib/wordCountUtils";

/**
 * 道中メール送信関数
 * @param leg 航路 (例: "Tokyo-Seoul")
 * @param minute 経過時間（分）
 */
export async function sendInFlightMail(leg: string, minute: number): Promise<void> {
  try {
    console.log(`✈️ Sending in-flight mail for ${leg} at ${minute} minutes`);
    
    // ユーザーレベル取得
    const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
    console.log(`✈️ User level: ${userLevel}`);
    
    // 航路解析
    const [fromCity, toCity] = leg.split('-');
    if (!fromCity || !toCity) {
      throw new Error(`Invalid leg format: ${leg}. Expected format: "City1-City2"`);
    }
    
    // プロンプト生成
    const prompt = buildInFlightPrompt(leg, minute, userLevel);
    console.log('✈️ Generated in-flight prompt:', prompt);
    
    // Claude API呼び出し
    console.log('✈️ Calling OpenAI API for in-flight mail...');
    const response = await fetch('/api/generate-reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        isMailGeneration: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✈️ In-flight mail API response:', data);

    let mailContent: { jp: string; en: string };

    // Parse the response
    if (data.content) {
      try {
        const parsed = JSON.parse(data.content);
        if (parsed.jp && parsed.en) {
          mailContent = {
            jp: parsed.jp,
            en: parsed.en,
          };
          console.log('✈️ Successfully parsed in-flight mail content');
        } else {
          throw new Error('Invalid JSON structure');
        }
      } catch (parseError) {
        console.log('✈️ Content is not JSON, using fallback...');
        throw parseError;
      }
    } else {
      throw new Error('No content in API response');
    }

    // メトリクス計算
    const words = countWords(mailContent.en);
    const duration = minute * 60 * 1000; // ミリ秒に変換
    const wpm = calculateWPM(words, minute);
    
    console.log('✈️ Calculated metrics:', { words, duration, wpm, minute });

    // メール保存
    saveLetterToStorage({
      type: "mail",
      fromCity,
      toCity,
      level: userLevel,
      jp: mailContent.jp,
      en: {
        [userLevel]: mailContent.en
      },
      wordCount: words,
      duration,
      wpm
    });
    
    console.log('✈️ In-flight mail saved to storage');
    
    // 送信済みフラグ更新
    const key = `inFlightSent:${leg}`;
    const sent = JSON.parse(localStorage.getItem(key) || "[]");
    const updatedSent = [...sent, minute].sort((a, b) => a - b);
    localStorage.setItem(key, JSON.stringify(updatedSent));
    
    console.log(`✈️ Updated in-flight sent flags for ${leg}:`, updatedSent);
    
    // 通知表示
    showNotification();
    
    console.log(`✅ In-flight mail sent successfully for ${leg} at ${minute} minutes`);
    
  } catch (error) {
    console.error('✈️ Error sending in-flight mail:', error);
    
    // フォールバック処理
    const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
    const [fromCity, toCity] = leg.split('-');
    const catName = localStorage.getItem('catName') || 'Your cat';
    
    const fallbackContent = {
      jp: `${fromCity}から${toCity}への飛行中です。\n\n窓の外には美しい景色が広がっています。雲の上を飛ぶのは、いつも新鮮な驚きに満ちています。\n\n${minute}分間読書を続けてくださって、ありがとうございます。あなたの努力が私の旅を支えてくれています。\n\nもうすぐ${toCity}に到着します。新しい冒険が待っているのが楽しみです！\n\n愛を込めて、\n${catName}`,
      
      en: `Flying from ${fromCity} to ${toCity} right now!\n\nThe view from the window is absolutely beautiful. Flying above the clouds always fills me with wonder and excitement.\n\nThank you for reading for ${minute} minutes! Your dedication to reading is what makes this incredible journey possible.\n\nWe'll be arriving in ${toCity} soon. I can't wait for the new adventures that await!\n\nWith love,\n${catName}`
    };
    
    // フォールバックメトリクス計算
    const words = countWords(fallbackContent.en);
    const duration = minute * 60 * 1000;
    const wpm = calculateWPM(words, minute);
    
    // フォールバックでもメール保存
    saveLetterToStorage({
      type: "mail",
      fromCity,
      toCity,
      level: userLevel,
      jp: fallbackContent.jp,
      en: {
        [userLevel]: fallbackContent.en
      },
      wordCount: words,
      duration,
      wpm
    });
    
    // 送信済みフラグ更新
    const key = `inFlightSent:${leg}`;
    const sent = JSON.parse(localStorage.getItem(key) || "[]");
    const updatedSent = [...sent, minute].sort((a, b) => a - b);
    localStorage.setItem(key, JSON.stringify(updatedSent));
    
    // 通知表示
    showNotification();
    
    console.log(`✈️ Fallback in-flight mail sent for ${leg} at ${minute} minutes`);
  }
}