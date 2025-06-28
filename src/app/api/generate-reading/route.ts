import { OpenAI } from "openai";
import { NextResponse } from "next/server";
// 旧vocabularyDataは使用せず、新しいNGSLシステムを使用
import { getAllowedWords, analyzeVocabulary } from "@/constants/ngslData";
import { findForbiddenWords } from "@/constants/forbiddenWords";
import { getPromptTemplate } from "@/constants/promptTemplates";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const { contentType = 'reading', level, isMailGeneration = false, prompt } = requestData;

    // メール生成の場合は特別処理
    if (isMailGeneration && prompt) {
      console.log('📧 Mail generation request received');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a travel-loving cat who writes emails. Always respond with valid JSON containing 'jp' and 'en' fields. Make the content engaging and personal." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const raw = completion.choices[0].message.content ?? "";
      console.log('📧 Mail API response:', raw);

      return NextResponse.json({ content: raw });
    }

    if (!level || level < 1 || level > 5) {
      console.log('❌ 不正なレベル:', level);
      return NextResponse.json({ error: '語彙レベルが不正です (1-5)' }, { status: 400 });
    }

    // デバッグ用ログ
    console.log('📝 生成リクエスト:', requestData);

    // ---- 1. NGSL語彙リスト取得 ----
    const allowedWordsArray = getAllowedWords(level);
    const allowedWords = allowedWordsArray.join(", ");
    
    console.log(`✅ Level ${level} 許可語彙数:`, allowedWordsArray.length);

    // ---- 2. コンテンツタイプ別プロンプト生成 ----
    let userPrompt = '';

    if (contentType === 'story') {
      // ストーリー用プロンプト
      const { storyData } = requestData;
      
      if (
        !storyData ||
        !storyData.protagonistType ||
        !storyData.settingType
      ) {
        console.error('❌ ストーリー設定が不完全です');
        return NextResponse.json({ error: 'ストーリー設定が不完全です' }, { status: 400 });
      }
      
      const { protagonistType, protagonistFeature, genre, situation, feeling } = storyData;

      // ジャンル・トーン変換
      const genreMap = {
        'comedy': 'humorous and light-hearted',
        'serious': 'serious and meaningful',
        'suspense': 'suspenseful with mystery and tension',
        'fantasy': 'fantasy with magical elements'
      };

      // 読後感変換
      const feelingMap = {
        'moved': 'emotionally touching',
        'surprise': 'surprising twist',
        'thrilling': 'thrilling and exciting',
        'courage': 'inspiring and empowering'
      };

      const character = `${protagonistType}${protagonistFeature ? ` ${protagonistFeature}` : ''} protagonist`;
      const tone = genreMap[genre as keyof typeof genreMap] || 'engaging';
      const emotion = feelingMap[feeling as keyof typeof feelingMap] || 'satisfying';

      // NGSLテンプレートを使用
      const promptTemplate = getPromptTemplate(level);
      
      // 許可語彙リストを取得
      const allowedWords = getAllowedWords(level);
      const vocabularyConstraint = allowedWords.slice(0, 50).join(', '); // 最初の50語を例として提示
      
      userPrompt = `${promptTemplate}

Story Requirements:
- Main character: ${character}
- Genre/tone: ${tone}
- Conflict or situation: ${situation}
- Emotional effect at the end: ${emotion}

CRITICAL VOCABULARY CONSTRAINT: Only use Level ${level} vocabulary and below. 
Example allowed words: ${vocabularyConstraint}...
ABSOLUTELY FORBIDDEN: Any words above Level ${level}. Every word must comply with NGSL Level 1-${level} classification.

Output format:
【英語】
<English story>

【日本語】
<Japanese translation>
      `.trim();

    } else {
      // 読み物用プロンプト（既存の処理）
      const { theme, topic, subTopic, style } = requestData;

      // topicをthemeとして使用（フロントエンドからtopicで送信される）
      const actualTheme = theme || topic;
      const actualStyle = style || '専門家がやさしく説明'; // デフォルトスタイル

      // バリデーション
      if (!actualTheme || actualTheme.trim() === '') {
        console.log('❌ theme/topic が空です:', { theme, topic });
        return NextResponse.json({ error: 'テーマが指定されていません' }, { status: 400 });
      }

      let styleInstruction = '';
      switch (actualStyle) {
        case '専門家がやさしく説明':
          styleInstruction = 'Write in an expert tone but make it accessible and easy to understand. Use clear, simple explanations while maintaining authority and accuracy.';
          break;
        case '対話形式':
          styleInstruction = 'Write in a conversational dialogue format. Include questions and answers, or discussions between people to make the content engaging and interactive.';
          break;
        case '物語風':
          styleInstruction = 'Write in a narrative story style. Create an engaging story with characters, setting, and plot while incorporating the factual information naturally.';
          break;
        default:
          styleInstruction = 'Write in an informative and engaging tone.';
      }

      // NGSLテンプレートを使用
      const promptTemplate = getPromptTemplate(level);
      
      // 許可語彙リストを取得
      const allowedWords = getAllowedWords(level);
      const vocabularyConstraint = allowedWords.slice(0, 50).join(', '); // 最初の50語を例として提示
      
      userPrompt = `${promptTemplate}

Topic: ${actualTheme}${subTopic ? ` (focus: ${subTopic})` : ""}
Style: ${styleInstruction}

CRITICAL VOCABULARY CONSTRAINT: Only use Level ${level} vocabulary and below.
Example allowed words: ${vocabularyConstraint}...
ABSOLUTELY FORBIDDEN: Any words above Level ${level}. Every word must comply with NGSL Level 1-${level} classification.

Requirements:
- Structure: 3-4 paragraphs with logical development
- Include one surprising but verifiable fact
- Translation: After each English paragraph, provide Japanese translation
- NO labels like "【English】" or "【Japanese】"

Output format:
English paragraph 1
Japanese translation 1

English paragraph 2  
Japanese translation 2

English paragraph 3
Japanese translation 3
      `.trim();
    }

    console.log('📤 【GPT-3.5-turbo】送信するプロンプト:', userPrompt.substring(0, 200) + '...');
    console.log('🤖 【モデル情報】使用モデル: gpt-3.5-turbo, max_tokens: 2000');

    // Level別システムメッセージ
    let systemMessage = "You are an educational writer. Follow instructions strictly. Always write exactly 220-260 words in at least 3 paragraphs. Do not include any labels or headers. COUNT YOUR WORDS before finishing - you must reach at least 220 words.";
    
    if (level <= 3) {
      systemMessage = `CRITICAL: You are writing for 10-year-old children. You MUST use ONLY the simplest English words. Any word longer than 5 letters is FORBIDDEN (except: people, mother, father, sister, brother, family, house, water, today). Use only words that appear in beginner children's books. Write exactly 140-200 words in 3 paragraphs. EVERY word must be simple and basic.`;
    } else if (level === 4) {
      systemMessage = `You are writing for intermediate English learners (B2 level). CRITICAL: You MUST write exactly 200-240 words. COUNT your words carefully - you must reach at least 200 words. Write in at least 3 paragraphs. Include complex sentence structures and intermediate vocabulary. Do not include any labels or headers. WORD COUNT IS CRITICAL.`;
    } else if (level >= 5) {
      systemMessage = `You are writing for advanced English learners (C1+ level). CRITICAL: You MUST write exactly 240-280 words. COUNT your words carefully - you must reach at least 240 words. Write in at least 3 paragraphs. Use sophisticated vocabulary, complex sentence structures, nuanced expressions, and varied sentence patterns. Do not include any labels or headers. WORD COUNT IS CRITICAL.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user",    content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // ---- 3. 出力パース ----
    const raw = completion.choices[0].message.content ?? "";
    console.log('📥 【GPT-3.5-turbo】応答受信:', {
      responseLength: raw.length,
      model: completion.model,
      usage: completion.usage,
      preview: raw.substring(0, 200) + '...'
    });
    
    // 語数カウント用関数
    const countWords = (text: string): number => {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    let eng, jp;

    if (contentType === 'story') {
      // ストーリーの場合も日本語翻訳付きで処理
      [eng, jp] = raw
        .split(/【日本語】/i)
        .map(part => part.replace(/【英語】/i, "").trim());
    } else {
      // 🔧 読み物の場合: 新しい段落ごと翻訳形式をパース（改良版）
      const lines = raw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      const englishParagraphs: string[] = [];
      const japaneseParagraphs: string[] = [];
      
      console.log('📝 パース対象行数:', lines.length);
      console.log('📝 最初の5行:', lines.slice(0, 5));
      
      // 英語・日本語判定の改良（文字種による判定）
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 日本語文字（ひらがな、カタカナ、漢字）が含まれているかチェック
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(line);
        
        if (hasJapanese) {
          japaneseParagraphs.push(line);
          console.log(`📝 日本語段落 ${japaneseParagraphs.length}:`, line.substring(0, 50) + '...');
        } else {
          englishParagraphs.push(line);
          console.log(`📝 英語段落 ${englishParagraphs.length}:`, line.substring(0, 50) + '...');
        }
      }
      
      // 英語は段落をまとめて、日本語も段落をまとめて
      eng = englishParagraphs.join('\n\n');
      jp = japaneseParagraphs.join('\n\n');
      
      console.log('📊 パース結果:', {
        englishParagraphs: englishParagraphs.length,
        japaneseParagraphs: japaneseParagraphs.length,
        engLength: eng.length,
        jpLength: jp.length
      });
      
      // フォールバック: 段落が十分でない場合の補正
      if (englishParagraphs.length < 3 && eng && !eng.includes('\n\n')) {
        const sentences = eng.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        if (sentences.length >= 3) {
          const para1End = Math.floor(sentences.length / 3);
          const para2End = Math.floor(sentences.length * 2 / 3);
          
          const para1 = sentences.slice(0, para1End).join(' ');
          const para2 = sentences.slice(para1End, para2End).join(' ');
          const para3 = sentences.slice(para2End).join(' ');
          
          eng = [para1, para2, para3].join('\n\n');
          console.log('🔧 段落分割を自動補正しました');
        }
      }
    }
    
    // レベル別語数チェック
    if (eng) {
      const wordCount = countWords(eng);
      console.log('📊 生成された語数:', wordCount);
      
      let minWords, maxWords, targetRange;
      if (level <= 3) {
        minWords = 140;
        maxWords = 200;
        targetRange = '140-200語';
      } else if (level === 4) {
        minWords = 200;
        maxWords = 240;
        targetRange = '200-240語';
      } else {
        minWords = 240;
        maxWords = 280;
        targetRange = '240-280語';
      }
      
      if (wordCount < minWords) {
        console.error(`❌ 語数不足: ${wordCount} < ${minWords}語`);
        console.error(`❌ 要求: ${targetRange}, 実際: ${wordCount}語`);
        console.error(`❌ 不足分: ${minWords - wordCount}語`);
      } else if (wordCount > maxWords) {
        console.warn(`⚠️ 語数超過: ${wordCount} > ${maxWords}語`);
      } else {
        console.log(`✅ 語数適正: ${wordCount}語 (${targetRange}範囲内)`);
      }
      
      // 🆕 語彙レベル分析
      const vocabAnalysis = analyzeVocabulary(eng);
      console.log('📚 語彙レベル分析 (Level:', level, '):', {
        総語数: vocabAnalysis.totalWords,
        'Level 1': `${vocabAnalysis.levelCounts[1]}語 (${vocabAnalysis.percentages[1]}%)`,
        'Level 2': `${vocabAnalysis.levelCounts[2]}語 (${vocabAnalysis.percentages[2]}%)`,
        'Level 3': `${vocabAnalysis.levelCounts[3]}語 (${vocabAnalysis.percentages[3]}%)`,
        'Level 4': `${vocabAnalysis.levelCounts[4]}語 (${vocabAnalysis.percentages[4]}%)`,
        'Level 5': `${vocabAnalysis.levelCounts[5]}語 (${vocabAnalysis.percentages[5]}%)`
      });
      
      // レベル適合性チェック
      if (level <= 3) {
        const hasLevel4Plus = vocabAnalysis.percentages[4] > 0 || vocabAnalysis.percentages[5] > 0;
        if (hasLevel4Plus) {
          console.error(`❌ Level ${level} 違反: Level 4/5語彙が含まれています`, {
            'Level 4': vocabAnalysis.percentages[4] + '%',
            'Level 5': vocabAnalysis.percentages[5] + '%'
          });
        } else {
          console.log(`✅ Level ${level} 適合: 上位レベル語彙なし`);
        }
        
        // 🆕 禁止語彙チェック
        const forbiddenWords = findForbiddenWords(eng, level);
        if (forbiddenWords.length > 0) {
          console.error(`❌ Level ${level} 禁止語彙検出:`, forbiddenWords);
          console.error(`   禁止語彙数: ${forbiddenWords.length}個`);
        } else {
          console.log(`✅ Level ${level} 禁止語彙チェック: クリア`);
        }
      }
    }

    if (!eng || eng.trim() === '') {
      console.log('❌ 英語テキストが生成されませんでした');
      return NextResponse.json({ error: '英語テキストの生成に失敗しました' }, { status: 500 });
    }

    // 語彙レベル検証
    const vocabularyAnalysis = analyzeVocabulary(eng);
    console.log('📊 語彙レベル分析:', {
      level: level,
      totalWords: vocabularyAnalysis.totalWords,
      levelPercentages: vocabularyAnalysis.percentages,
      isCompliant: level === 1 ? vocabularyAnalysis.isLevel1Compliant :
                   level === 2 ? vocabularyAnalysis.isLevel2Compliant :
                   level === 3 ? vocabularyAnalysis.isLevel3Compliant : true
    });

    // レベル3での高次語彙使用をチェック
    if (level === 3) {
      const level4Plus = vocabularyAnalysis.percentages[4] + vocabularyAnalysis.percentages[5];
      if (level4Plus > 5) {
        console.warn(`⚠️ Level 3 制約違反: Level 4-5 語彙が ${level4Plus}% 使用されています (許可: 5%以下)`);
      }
    }

    console.log('✅ 【GPT-3.5-turbo】読み物生成成功:', { 
      englishLength: eng.length, 
      japaneseLength: jp?.length || 0,
      model: 'gpt-3.5-turbo',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ english: eng, japanese: jp || '' });
  } catch (err) {
    console.error("generate-reading error:", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}
