import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { 
  getTravelPrompt, 
  validateLevel3Vocabulary
} from "@/utils/travelPromptTemplates";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const { 
      level = 3, 
      type = 'letter', 
      location = 'a beautiful city', 
      activity = 'exploring', 
      emotion = 'happy',
      catName = 'ネコ',
      isFirstLetter = false
    } = requestData;

    console.log('📧 Travel mail/letter generation request:', {
      level,
      type,
      location,
      activity,
      emotion,
      catName,
      isFirstLetter
    });

    // 一通目の手紙用の特別プロンプト
    let userPrompt, systemMessage;
    
    if (isFirstLetter) {
      systemMessage = `You are a travel-loving cat writing your very first letter from Narita Airport. Write in Level ${level} English vocabulary only. Keep it exciting but appropriate for the level. Include both English and Japanese versions.`;
      
      userPrompt = `Write the very first letter from a cat at Narita Airport, Tokyo, who is about to start an amazing journey around the world.

CRITICAL REQUIREMENTS:
- Use ONLY Level ${level} vocabulary (simple, everyday words)
- Write exactly 80-120 words for the English version
- Express excitement and nervousness about starting the journey
- Mention Narita Airport and departing for the first destination
- Include feelings of adventure and anticipation
- Keep the tone warm and personal, like writing to a dear friend

Content requirements:
- Setting: Narita Airport, Tokyo
- Emotion: Mix of excitement and nervous anticipation
- Activity: About to depart on first journey
- Style: Personal letter from cat to owner/friend

Output format:
English: [English letter here]
Japanese: [Japanese translation here]

Make it feel like the very beginning of an exciting adventure!`;
    } else {
      // 通常の手紙/メール生成
      const promptConfig = getTravelPrompt(
        type,
        level.toString(),
        location,
        activity
      );
      
      userPrompt = promptConfig.userPrompt;
      systemMessage = promptConfig.systemMessage;
    }

    console.log('📤 Travel prompt (first 200 chars):', userPrompt.substring(0, 200) + '...');

    // OpenAI API呼び出し
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800, // 手紙・メール用に短めに設定
    });

    const rawContent = completion.choices[0].message.content ?? "";
    console.log('📥 Travel generation response received:', {
      responseLength: rawContent.length,
      model: completion.model,
      usage: completion.usage
    });

    // 基本的なパース処理
    let englishText = rawContent.trim();
    let japaneseText = '';
    
    if (isFirstLetter) {
      // 一通目の手紙の場合は英語と日本語を分離
      const englishMatch = rawContent.match(/English:\s*(.*?)(?=Japanese:|$)/s);
      const japaneseMatch = rawContent.match(/Japanese:\s*(.*?)$/s);
      
      englishText = englishMatch ? englishMatch[1].trim() : rawContent.trim();
      japaneseText = japaneseMatch ? japaneseMatch[1].trim() : '';
    }
    
    // ラベルや余計な文字を除去
    englishText = englishText
      .replace(/【英語】/gi, '')
      .replace(/【日本語】/gi, '')
      .replace(/English:/gi, '')
      .replace(/Japanese:/gi, '')
      .trim();

    // 語数カウント
    const wordCount = englishText.trim().split(/\s+/).filter(word => word.length > 0).length;
    console.log('📊 Generated word count:', wordCount);

    // Level 3の場合は語彙チェック
    let vocabularyCheck = null;
    if (level <= 3) {
      const checkResult = validateLevel3Vocabulary(englishText);
      vocabularyCheck = {
        isCompliant: checkResult.isValid,
        forbiddenWords: checkResult.violations,
        complianceRate: Math.round(((englishText.split(/\s+/).length - checkResult.violations.length) / englishText.split(/\s+/).length) * 100)
      };
      
      console.log('📚 Level 3 vocabulary check:', {
        isCompliant: vocabularyCheck.isCompliant,
        forbiddenWords: vocabularyCheck.forbiddenWords,
        complianceRate: vocabularyCheck.complianceRate + '%'
      });

      if (!vocabularyCheck.isCompliant) {
        console.warn('⚠️ Level 3 vocabulary violations detected:', vocabularyCheck.forbiddenWords);
      }
    }

    // 語数チェック
    let targetWordRange: string;
    let minWords: number;
    let maxWords: number;

    if (isFirstLetter) {
      // 一通目の手紙は固定の語数範囲
      minWords = 80;
      maxWords = 120;
      targetWordRange = '80-120';
    } else if (level <= 3) {
      if (type === 'letter') {
        minWords = 140;
        maxWords = 200;
        targetWordRange = '140-200';
      } else {
        minWords = 80;
        maxWords = 120;
        targetWordRange = '80-120';
      }
    } else if (level === 4) {
      if (type === 'letter') {
        minWords = 120;
        maxWords = 150;
        targetWordRange = '120-150';
      } else {
        minWords = 80;
        maxWords = 100;
        targetWordRange = '80-100';
      }
    } else {
      if (type === 'letter') {
        minWords = 150;
        maxWords = 200;
        targetWordRange = '150-200';
      } else {
        minWords = 100;
        maxWords = 130;
        targetWordRange = '100-130';
      }
    }

    if (wordCount < minWords) {
      console.warn(`⚠️ Word count below target: ${wordCount} < ${minWords} (target: ${targetWordRange})`);
    } else if (wordCount > maxWords) {
      console.warn(`⚠️ Word count above target: ${wordCount} > ${maxWords} (target: ${targetWordRange})`);
    } else {
      console.log(`✅ Word count within target: ${wordCount} words (${targetWordRange})`);
    }

    // レスポンス構築
    const response = {
      en: englishText,
      jp: japaneseText || '成田空港からの手紙です。これから素晴らしい旅が始まります！',
      english: englishText, // 互換性のため
      type,
      level,
      location,
      activity,
      emotion,
      catName,
      wordCount,
      targetWordRange,
      isFirstLetter,
      ...(vocabularyCheck && {
        vocabularyCheck: {
          isCompliant: vocabularyCheck.isCompliant,
          forbiddenWords: vocabularyCheck.forbiddenWords,
          complianceRate: vocabularyCheck.complianceRate
        }
      })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Travel generation error:', error);
    return NextResponse.json(
      { error: 'Travel mail/letter generation failed' }, 
      { status: 500 }
    );
  }
}