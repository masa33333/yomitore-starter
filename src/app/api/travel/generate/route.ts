import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { 
  getTravelPrompt, 
  validateLevel3Vocabulary,
  type TravelPromptConfig 
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
      catName = 'ネコ'
    } = requestData;

    console.log('📧 Travel mail/letter generation request:', {
      level,
      type,
      location,
      activity,
      emotion,
      catName
    });

    // プロンプト取得
    const promptConfig = getTravelPrompt(
      type,
      level.toString(),
      location,
      activity
    );
    
    const userPrompt = promptConfig.userPrompt;
    const systemMessage = promptConfig.systemMessage;

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

    if (level <= 3) {
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
      english: englishText,
      type,
      level,
      location,
      activity,
      emotion,
      catName,
      wordCount,
      targetWordRange,
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