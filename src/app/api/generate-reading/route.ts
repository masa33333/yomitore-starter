import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { vocabularyData } from "@/data/vocabularyData"; // ← NGSL Lv1-7 が入った TS

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

    // ---- 1. 語彙リスト取得 ----
    const levelKey = `level${level}` as keyof typeof vocabularyData;
    const words = vocabularyData[levelKey];
    if (!words) {
      console.log('❌ 語彙データが見つかりません:', levelKey);
      return NextResponse.json({ error: `Invalid level: ${level}` }, { status: 400 });
    }
    
    // 新しいデータ構造に対応
    const allowedWords = Array.isArray(words) && typeof words[0] === 'object' 
      ? words.map((item: any) => item.word).join(", ")
      : words.join(", ");

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

      userPrompt = `
You are an English writer for language learners.

Please create a short story in English based on the following conditions:

- Target vocabulary level: ${level}
- Structure: 3–5 paragraphs
- Story content:
  - Main character: ${character}
  - Genre/tone: ${tone}
  - Conflict or situation: ${situation}
  - Emotional effect at the end: ${emotion}
- Use natural English for learners at this level.

Vocabulary constraints:
${allowedWords}

Write a story that uses primarily these vocabulary words while maintaining natural, grammatically correct English.

After the English story, provide its **natural Japanese translation**.

=== 語彙レベル制御ガイドライン（必ず厳守） ===

ユーザーの語彙レベル（vocabLevel: ${level}）に応じて、使用語・文構造・文体・表現の抽象度を必ず調整してください。

🟦 vocabLevel = "easy" または Level 1〜3（初級学習者）
- 語彙：CEFR A1〜A2（最頻出1000語内）
- 禁止語：nestled, adored, captivated, long for, mingle, unfold, sparkle, shrug, bustling, legendary, crack, elusive
- 推奨代替語：busy (bustling), famous (legendary), sound/break (crack), hard to find (elusive)
- 構文：冒頭2文は必ず「1文 = 主語 + 動詞（S＋V）」のみ。関係詞禁止
- 表現：比喩・抽象表現は禁止。すべて具体的に。
- 例：He opened the book. He saw a strange drawing.

🟩 vocabLevel = "normal" または Level 4〜6（中級学習者）
- 語彙：B1〜B2レベル
- 禁止語リストの語彙はなるべく避ける（低頻度なら可）
- 構文：関係詞・接続詞使用可。ただし1文に1つまで
- 表現：軽い比喩は可。ただし文脈で明確に理解できること。
- 例：He opened the old book and saw something strange. It looked like a secret code.

🟥 vocabLevel = "hard" または Level 7〜10（上級学習者 CEFR B1-B2）
- 語彙：CEFR B1-B2レベル（C1レベルまで使用可、ただしC2/ネイティブレベルは避ける）
- 使用可能語：sophisticated, elaborate, magnificent, extraordinary, fascinating, intriguing, compelling, enchanted, mysterious, ancient等
- 構文：複文・重文使用可。関係詞の連続使用も可
- 文長：制限なし（ただし理解可能な範囲で）
- 表現：比喩・抽象表現・文学的表現使用可
- 注意：意味が文脈から推測できるよう工夫すること
- 例：The moment he opened the tome, an uncanny symbol shimmered on the page, hinting at forgotten rituals.

=== 【最重要指示】語彙レベル変更時の内容一貫性 ===

【🔒 絶対に変更してはいけない要素】
❌ 主人公の名前・性格・職業を変更すること
❌ 舞台設定・時代・場所を変更すること
❌ ストーリーの展開・イベント・結末を変更すること
❌ テーマや物語構造を変更すること
❌ 登場人物の関係性を変更すること
❌ 新しい話を作ることは絶対禁止

【✅ 変更可能な要素（これのみ調整）】
✅ 語彙の難易度レベルのみ
✅ 文の構造・長さのみ
✅ 表現の抽象度のみ

【全体の注意点】
・同じストーリー構成でも、語彙レベルが変われば **語彙・文体・構文** を必ず変化させてください。
・語彙レベルを変更した場合でも、ストーリーの**内容・構成・登場人物は一切変更しない**でください。
・同じストーリーのまま、語彙・構文のレベルのみを変更してください。
・特に冒頭（最初の2段落）は、選ばれたレベルの中でも「最も簡単」にすること。
・レベル指定がある場合、それに**完全に準拠**した語彙・文体で書いてください。

Return your answer **exactly** in this template:

【英語】
<English story>

【日本語】
<Japanese translation>
      `.trim();

    } else {
      // 読み物用プロンプト（既存の処理）
      const { theme, subTopic, style } = requestData;

      // バリデーション
      if (!theme || theme.trim() === '') {
        console.log('❌ theme が空です:', theme);
        return NextResponse.json({ error: 'テーマが指定されていません' }, { status: 400 });
      }

      if (!style || style.trim() === '') {
        console.log('❌ style が空です:', style);
        return NextResponse.json({ error: 'スタイルが指定されていません' }, { status: 400 });
      }

      let styleInstruction = '';
      switch (style) {
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

      userPrompt = `
<allowed>
${allowedWords}
</allowed>

You are a master educational content creator for English learners.
Write an ORIGINAL English passage that satisfies **ALL** of the following rules.

1. **Vocabulary**: use **ONLY** the words in <allowed>. However, keep all grammar accurate and natural. 
Do not use childish, broken, or ungrammatical English.
2. **Structure**: Write at least 3 paragraphs with logical development. Separate each paragraph with a blank line.
   - Introduction → 1st Turning Point → Development → 2nd Turning Point
   - Insert **ONE surprising fact** that is *real and verifiable* (no fiction).
   - Show clear **cause-and-effect** links.
3. **Style**: ${styleInstruction}
4. **Topic**: ${theme}${subTopic ? ` (focus: ${subTopic})` : ""}
5. **Length**: Write between 220 and 260 English words. Do NOT stop before reaching 220 words. If you write less than 220 words, you have failed the task.
6. **Accuracy**: Do **NOT** invent fictional people, places, or events. All facts must be true.
7. **Translation**: After each English paragraph, provide its Japanese translation. Do not place all translations at the end. Format as: English paragraph → Japanese translation → English paragraph → Japanese translation, etc.
8. **Formatting**: Do NOT include any labels like "【English】" or "【Japanese】". Only the text itself should be shown.
9. **Pre-check**: Before completing your output, count your own word total. If it is less than 220, continue writing until you meet the requirement.

=== 語彙レベル制御ガイドライン（必ず厳守） ===

ユーザーの語彙レベル（vocabLevel: ${level}）に応じて、使用語・文構造・文体・表現の抽象度を必ず調整してください。

🟦 vocabLevel = "easy" または Level 1〜3（初級学習者）
- 語彙：CEFR A1〜A2（最頻出1000語内）
- 禁止語：nestled, adored, captivated, long for, mingle, unfold, sparkle, shrug, bustling, legendary, crack, elusive
- 推奨代替語：busy (bustling), famous (legendary), sound/break (crack), hard to find (elusive)
- 構文：冒頭2文は必ず「1文 = 主語 + 動詞（S＋V）」のみ。関係詞禁止
- 表現：比喩・抽象表現は禁止。すべて具体的に。
- 例：He opened the book. He saw a strange drawing.

🟩 vocabLevel = "normal" または Level 4〜6（中級学習者）
- 語彙：B1〜B2レベル
- 禁止語リストの語彙はなるべく避ける（低頻度なら可）
- 構文：関係詞・接続詞使用可。ただし1文に1つまで
- 表現：軽い比喩は可。ただし文脈で明確に理解できること。
- 例：He opened the old book and saw something strange. It looked like a secret code.

🟥 vocabLevel = "hard" または Level 7〜10（上級学習者 CEFR B1-B2）
- 語彙：CEFR B1-B2レベル（C1レベルまで使用可、ただしC2/ネイティブレベルは避ける）
- 使用可能語：sophisticated, elaborate, magnificent, extraordinary, fascinating, intriguing, compelling, enchanted, mysterious, ancient等
- 構文：複文・重文使用可。関係詞の連続使用も可
- 文長：制限なし（ただし理解可能な範囲で）
- 表現：比喩・抽象表現・文学的表現使用可
- 注意：意味が文脈から推測できるよう工夫すること
- 例：The moment he opened the tome, an uncanny symbol shimmered on the page, hinting at forgotten rituals.

=== 【最重要指示】語彙レベル変更時の内容一貫性 ===

【🔒 絶対に変更してはいけない要素】
❌ 主人公の名前・性格・職業を変更すること
❌ 舞台設定・時代・場所を変更すること
❌ ストーリーの展開・イベント・結末を変更すること
❌ テーマや物語構造を変更すること
❌ 登場人物の関係性を変更すること
❌ 新しい話を作ることは絶対禁止

【✅ 変更可能な要素（これのみ調整）】
✅ 語彙の難易度レベルのみ
✅ 文の構造・長さのみ
✅ 表現の抽象度のみ

【全体の注意点】
・同じストーリー構成でも、語彙レベルが変われば **語彙・文体・構文** を必ず変化させてください。
・語彙レベルを変更した場合でも、ストーリーの**内容・構成・登場人物は一切変更しない**でください。
・同じストーリーのまま、語彙・構文のレベルのみを変更してください。
・特に冒頭（最初の2段落）は、選ばれたレベルの中でも「最も簡単」にすること。
・レベル指定がある場合、それに**完全に準拠**した語彙・文体で書いてください。

Return your answer in this exact format (TOTAL ENGLISH WORDS MUST BE 220-260):

<English paragraph 1>

<Japanese translation of paragraph 1>

<English paragraph 2>

<Japanese translation of paragraph 2>

<English paragraph 3>

<Japanese translation of paragraph 3>

Remember: Count all English words across all paragraphs. Total must be 220-260 words.
      `.trim();
    }

    console.log('📤 【GPT-3.5-turbo】送信するプロンプト:', userPrompt.substring(0, 200) + '...');
    console.log('🤖 【モデル情報】使用モデル: gpt-3.5-turbo, max_tokens: 2000');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an educational writer. Follow instructions strictly. Always write exactly 220-260 words in at least 3 paragraphs. Do not include any labels or headers. COUNT YOUR WORDS before finishing - you must reach at least 220 words." },
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
    
    // 語数チェック
    if (eng) {
      const wordCount = countWords(eng);
      console.log('📊 生成された語数:', wordCount);
      if (wordCount < 220) {
        console.error('❌ 語数不足:', wordCount, '< 220語');
        console.error('❌ 要求: 220-260語, 実際:', wordCount, '語');
        console.error('❌ 不足分:', 220 - wordCount, '語');
      } else if (wordCount > 260) {
        console.warn('⚠️ 語数超過:', wordCount, '> 260語');
      } else {
        console.log('✅ 語数適正:', wordCount, '語 (220-260語範囲内)');
      }
    }

    if (!eng || eng.trim() === '') {
      console.log('❌ 英語テキストが生成されませんでした');
      return NextResponse.json({ error: '英語テキストの生成に失敗しました' }, { status: 500 });
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
