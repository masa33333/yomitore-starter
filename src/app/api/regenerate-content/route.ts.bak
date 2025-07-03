import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { 
  generateStoryPrompt, 
  parseStoryResponse, 
  validateStoryParameters,
  STORY_SYSTEM_MESSAGE
} from "@/lib/storyPrompt";
import { vocabularyData } from "@/data/vocabularyData";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const { contentType, newLevel, originalParams } = requestData;

    console.log('🔄 コンテンツ再生成リクエスト:', { contentType, newLevel, originalParams });

    if (contentType === 'story') {
      // ストーリーのパラフレーズ処理
      const { genre, tone, feeling, existingStory, existingThemes } = originalParams;
      
      // バリデーション
      const validationError = validateStoryParameters({ genre, tone, feeling, level: newLevel });
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      // 既存ストーリーの確認
      if (!existingStory) {
        return NextResponse.json({ error: '既存のストーリー内容が見つかりません' }, { status: 400 });
      }

      // パラフレーズ処理：既存ストーリーを基に語彙レベルのみ調整
      const basePrompt = generateStoryPrompt({ genre, tone, feeling, level: newLevel });
      
      const enhancedPrompt = `=== 【最重要指示】これは既存ストーリーのパラフレーズ処理です ===

以下の既存ストーリーを、語彙レベル${newLevel}に合わせて **パラフレーズ（言い換え）** してください。
これは新しいストーリーの「生成」ではなく、既存ストーリーの「語彙・構文のみの調整」です。

【既存のストーリー内容】
${existingStory}

【既存のテーマ】
${existingThemes ? existingThemes.join(', ') : 'なし'}

**同じ話の語彙・構文レベル別バージョン**を作成してください。以下を**絶対に**守ってください：

【🔒 変更禁止事項（絶対に変更してはいけません）】
❌ 主人公の名前・性格・職業を変更すること
❌ 舞台設定・時代・場所を変更すること  
❌ ストーリーの展開・イベント・結末を変更すること
❌ テーマや物語構造を変更すること
❌ 登場人物の関係性を変更すること
❌ 別の話にすることは絶対禁止

【✅ 変更可能事項（これのみ調整可能）】
✅ 語彙の難易度レベルのみ
✅ 文の構造・長さのみ  
✅ 表現の抽象度のみ

【必須要件】
1. **完全に同じストーリー**（登場人物・背景・展開）をベースにする
2. 語彙・文構造・表現の抽象度のみを指定されたLevel ${newLevel}に調整する
3. 同じ場面・同じ展開で、表現方法のみをレベルに応じて変更する
4. これは「同じストーリーの語彙レベル別バージョン」として機能させる

【🚨 特に重要な制約】
⚠️ **物語の導入文（最初の2〜3文）では特に平易な語彙と構文で書くこと**
・例：長く複雑な「関係詞による場所の説明」などは禁止
・初級者が最初で挫折しないよう配慮

【レベル別書き換え例】
- Easy: "Tom lived in Tokyo. He was a student. He liked books." (SVO構文のみ、禁止語なし)
- Normal: "Tom was a university student who lived in Tokyo because he enjoyed city life."
- Hard: "Tom was an enigmatic scholar nestled in the bustling metropolis of Tokyo, captivated by its literary treasures."

【Easy レベル（初級・語彙レベル1-3、CEFR A1-A2）のパラフレーズ基準】
- **語彙制限**：CEFR A1-A2程度の語彙のみ
- **禁止語リスト**：bustling, legendary, elusive, long for, captivated, stumble upon, peek, shrouded, nestled, adored, mingle, unfold, sparkle, shrug, crack, curious, peculiar, ancient, mysterious, enchanted, beneath, whisper, glimmer, shimmer, treasure, adventure, journey, discover, wonder, magical, spellbinding, breathtaking, magnificent, extraordinary, remarkable, incredible, astonishing, fascinating, intriguing, compelling, delightful, charming, elegant, graceful, sophisticated, complex, intricate, elaborate, detailed, comprehensive, thorough, extensive, vast, enormous, immense, tremendous, gigantic, colossal, massive, substantial, significant, considerable, noteworthy, outstanding, exceptional, unique, rare, precious, valuable, priceless, invaluable, worthwhile, beneficial, advantageous, favorable, positive, optimistic, confident, determined, persistent, resilient, courageous, brave, bold, daring, adventurous, ambitious, enthusiastic, passionate, dedicated, committed, devoted, loyal, faithful, reliable, trustworthy, honest, sincere, genuine, authentic, original, creative, innovative, imaginative, artistic, beautiful, gorgeous, stunning, attractive, appealing, lovely, pleasant, delightful, enjoyable, entertaining, amusing, funny, hilarious, witty, clever, intelligent, brilliant, genius, talented, skilled, capable, competent, proficient, expert, professional, experienced, knowledgeable, wise, smart, quick, fast, rapid, swift, speedy, efficient, effective, successful, accomplished, achieved, attained, reached, obtained, acquired, gained, earned, deserved, merited, worthy
- **推奨代替語**：busy (bustling), famous (legendary), find (discover), great (magnificent), very good (extraordinary), look (peek), covered (shrouded)
- **構文制限**：SVのみの短い文で構成。関係詞や複文は禁止
- **特別制約**：**物語の導入文（最初の2-3文）では特に平易な語彙と構文を使用**
- **抽象語・比喩禁止**：long for, captivated等の抽象語は避ける
- **難解な句動詞禁止**：stumble upon, peek, shrouded等は使わない

目標：読者が「同じ話だが、語彙・文体の難易度が明確に変わった」と感じられること

【🚨 最終確認チェックリスト】
出力前に以下を確認してください：
✓ 主人公・登場人物は前回と同じか？
✓ 舞台・設定は前回と同じか？
✓ ストーリー展開・結末は前回と同じか？
✓ 語彙・構文のみが変更されているか？
上記すべてが「はい」でない場合は、出力を修正してください。`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: STORY_SYSTEM_MESSAGE },
          { role: "user", content: enhancedPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const rawResponse = completion.choices[0].message.content?.trim() ?? "";
      const { story, themes } = parseStoryResponse(rawResponse);

      console.log('✅ ストーリー再生成完了:', { storyLength: story.length, level: newLevel });
      
      return NextResponse.json({ 
        story, 
        themes,
        level: newLevel
      });

    } else {
      // 読み物のパラフレーズ処理
      const { theme, subTopic, style, existingEnglish, existingJapanese } = originalParams;
      
      if (!newLevel || newLevel < 1 || newLevel > 10) {
        return NextResponse.json({ error: '語彙レベルが不正です (1-10)' }, { status: 400 });
      }

      // 既存読み物の確認
      if (!existingEnglish) {
        return NextResponse.json({ error: '既存の読み物内容が見つかりません' }, { status: 400 });
      }

      // 語彙リスト取得
      const levelKey = `level${newLevel}` as keyof typeof vocabularyData;
      const words = vocabularyData[levelKey];
      if (!words) {
        return NextResponse.json({ error: `Invalid level: ${newLevel}` }, { status: 400 });
      }
      
      const allowedWords = Array.isArray(words) && typeof words[0] === 'object' 
        ? words.map((item: any) => item.word).join(", ")
        : words.join(", ");

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

      const userPrompt = `
=== 【最重要指示】これは既存読み物のパラフレーズ処理です ===

以下の既存読み物を、語彙レベル${newLevel}に合わせて **パラフレーズ（言い換え）** してください。
これは新しい読み物の「生成」ではなく、既存読み物の「語彙・構文のみの調整」です。

【既存の読み物内容（英語）】
${existingEnglish}

【既存の読み物内容（日本語）】
${existingJapanese || '日本語版なし'}

<allowed>
${allowedWords}
</allowed>

You are a master educational content creator for English learners.
**パラフレーズ（言い換え）** して、既存の内容と同じ情報・構成で語彙レベルのみを調整してください。

=== 【最重要指示】コンテンツ内容の完全一致を保証 ===
このリクエストは「語彙レベル変更による再構成」です。以下を**絶対に**守ってください：

【🔒 変更禁止事項（絶対に変更してはいけません）】
❌ テーマ・主題を変更すること
❌ 扱う情報・概念・事実を変更すること
❌ 内容の構成・流れを変更すること
❌ 取り上げる要素・ポイントを変更すること
❌ 別の内容にすることは絶対禁止

【✅ 変更可能事項（これのみ調整可能）】
✅ 語彙の難易度レベルのみ
✅ 文の構造・長さのみ
✅ 表現の抽象度のみ

【必須要件】
1. **完全に同じ内容・テーマ・情報**をベースにする
2. 語彙・文構造・表現の抽象度のみを指定されたLevel ${newLevel}に調整する
3. 同じ情報・同じ概念で、説明方法のみをレベルに応じて変更する
4. これは「同じ内容の語彙レベル別バージョン」として機能させる

【🚨 特に重要な制約】
⚠️ **物語の導入文（最初の2〜3文）では特に平易な語彙と構文で書くこと**
・例：長く複雑な「関係詞による場所の説明」などは禁止
・初級者が最初で挫折しないよう配慮

【レベル別書き換え例】
- Easy: "Coffee is popular. People drink it every day. It comes from plants." (SVO構文のみ、禁止語なし)
- Normal: "Coffee has become a global phenomenon because it provides energy and people enjoy its taste."
- Hard: "The ubiquitous consumption of coffee transcends cultural boundaries, driven by its stimulating properties and the ritualistic comfort it affords."

【Easy レベル（初級・語彙レベル1-3、CEFR A1-A2）のパラフレーズ基準】
- **語彙制限**：CEFR A1-A2程度の語彙のみ
- **禁止語リスト**：bustling, legendary, elusive, long for, captivated, stumble upon, peek, shrouded, nestled, adored, mingle, unfold, sparkle, shrug, crack, curious, peculiar, ancient, mysterious, enchanted, beneath, whisper, glimmer, shimmer, treasure, adventure, journey, discover, wonder, magical, spellbinding, breathtaking, magnificent, extraordinary, remarkable, incredible, astonishing, fascinating, intriguing, compelling, delightful, charming, elegant, graceful, sophisticated, complex, intricate, elaborate, detailed, comprehensive, thorough, extensive, vast, enormous, immense, tremendous, gigantic, colossal, massive, substantial, significant, considerable, noteworthy, outstanding, exceptional, unique, rare, precious, valuable, priceless, invaluable, worthwhile, beneficial, advantageous, favorable, positive, optimistic, confident, determined, persistent, resilient, courageous, brave, bold, daring, adventurous, ambitious, enthusiastic, passionate, dedicated, committed, devoted, loyal, faithful, reliable, trustworthy, honest, sincere, genuine, authentic, original, creative, innovative, imaginative, artistic, beautiful, gorgeous, stunning, attractive, appealing, lovely, pleasant, delightful, enjoyable, entertaining, amusing, funny, hilarious, witty, clever, intelligent, brilliant, genius, talented, skilled, capable, competent, proficient, expert, professional, experienced, knowledgeable, wise, smart, quick, fast, rapid, swift, speedy, efficient, effective, successful, accomplished, achieved, attained, reached, obtained, acquired, gained, earned, deserved, merited, worthy
- **推奨代替語**：busy (bustling), famous (legendary), find (discover), great (magnificent), very good (extraordinary), look (peek), covered (shrouded)
- **構文制限**：SVのみの短い文で構成。関係詞や複文は禁止
- **特別制約**：**物語の導入文（最初の2-3文）では特に平易な語彙と構文を使用**
- **抽象語・比喩禁止**：long for, captivated等の抽象語は避ける
- **難解な句動詞禁止**：stumble upon, peek, shrouded等は使わない

目標：読者が「同じ内容だが、語彙・文体の難易度が明確に変わった」と感じられること

【🚨 最終確認チェックリスト】
出力前に以下を確認してください：
✓ テーマ・主題は前回と同じか？
✓ 扱う情報・概念は前回と同じか？
✓ 内容の構成・流れは前回と同じか？
✓ 語彙・構文のみが変更されているか？
上記すべてが「はい」でない場合は、出力を修正してください。

1. **Vocabulary**: use **ONLY** the words in <allowed>. However, keep all grammar accurate and natural. 
Do not use childish, broken, or ungrammatical English.
2. **Structure**:
   - Introduction → 1st Turning Point → Development → 2nd Turning Point
   - Insert **ONE surprising fact** that is *real and verifiable* (no fiction).
   - Show clear **cause-and-effect** links.
3. **Style**: ${styleInstruction}
4. **Topic**: ${theme}${subTopic ? ` (focus: ${subTopic})` : ""}
5. **Length**: 220–260 words.
6. **Accuracy**: Do **NOT** invent fictional people, places, or events. All facts must be true.
7. After the English passage, provide its **natural Japanese translation**.

=== 語彙レベル制御ガイドライン（必ず厳守） ===

ユーザーの語彙レベル（vocabLevel: ${newLevel}）に応じて、使用語・文構造・文体・表現の抽象度を必ず調整してください。

🟦 vocabLevel = "easy" または Level 1〜3（初級学習者）
- 語彙：CEFR A1〜A2（最頻出1000語内）
- 禁止語：nestled, adored, captivated, long for, mingle, unfold, sparkle, shrug, bustling, legendary, crack, elusive
- 推奨代替語：busy (bustling), famous (legendary), sound/break (crack), hard to find (elusive)
- 構文：冒頭2文は必ず「1文 = 主語 + 動詞（S＋V）」のみ。関係詞禁止
- 表現：比喩・抽象表現は禁止。すべて具体的に。
- 例：He opened the book. He saw a strange drawing.

🟩 中間レベル（中級・語彙レベル4-6、CEFR B1）のパラフレーズ基準
- **語彙制限**：CEFR B1程度の語彙まで許容
- **使用可能語**：mingle, sparkle, unfold, shrug等（文脈で意味が推測できる場合）
- **構文**：複文や接続詞を使った表現はOK、ただし**一文が長くなりすぎないよう注意**
- **読みやすさ重視**：自然な言い換えや描写の追加も可
- **特別制約**：物語の導入文（最初の2-3文）では特に平易な語彙と構文で書くこと
- 例：He opened the old book and saw something strange. It looked like a secret code.

🟥 難しいレベル（上級・語彙レベル7-10、CEFR B2+）のパラフレーズ基準
- **語彙制限**：CEFR B2以上の語彙も使用可能
- **使用可能語**：unfathomable, elusive, intrigued, sophisticated, elaborate, magnificent, extraordinary, fascinating, intriguing, compelling, enchanted, mysterious, ancient等
- **比喩・抽象表現**：OK、ただし**内容が伝わるように文脈で補足すること**
- **構文注意**：**一文内の主語と述語の対応に注意**し、意味の取りにくい文にならないようにする
- **特別制約**：物語の導入文（最初の2-3文）では特に平易な語彙と構文で書くこと
- 例：The moment he opened the tome, an uncanny symbol shimmered on the page, hinting at forgotten rituals.

=== 全体の注意点 ===
・同じストーリー構成でも、語彙レベルが変われば **語彙・文体・構文** を必ず変化させてください。
・語彙レベルを変更した場合でも、ストーリーの**内容・構成・登場人物は一切変更しない**でください。
・同じストーリーのまま、語彙・構文のレベルのみを変更してください。
・特に冒頭（最初の2段落）は、選ばれたレベルの中でも「最も簡単」にすること。
・レベル指定がある場合、それに**完全に準拠**した語彙・文体で書いてください。

Return your answer **exactly** in this template:

【英語】
<English passage>

【日本語】
<Japanese translation>
      `.trim();

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an educational writer. Follow instructions strictly." },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const raw = completion.choices[0].message.content ?? "";
      const [eng, jp] = raw
        .split(/【日本語】/i)
        .map(part => part.replace(/【英語】/i, "").trim());

      if (!eng || eng.trim() === '') {
        return NextResponse.json({ error: '英語テキストの生成に失敗しました' }, { status: 500 });
      }

      console.log('✅ 読み物再生成完了:', { englishLength: eng.length, level: newLevel });
      return NextResponse.json({ 
        english: eng, 
        japanese: jp || '',
        level: newLevel
      });
    }

  } catch (err) {
    console.error("regenerate content error:", err);
    return NextResponse.json({ 
      error: "コンテンツの再生成に失敗しました" 
    }, { status: 500 });
  }
}