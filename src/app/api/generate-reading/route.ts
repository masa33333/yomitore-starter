import { OpenAI } from "openai";
import { NextResponse } from "next/server";
// 旧vocabularyDataは使用せず、新しいNGSLシステムを使用
import { getAllowedWords, analyzeVocabulary } from "@/constants/ngslData";
import { findForbiddenWords } from "@/constants/forbiddenWords";
import { getPromptTemplate } from "@/constants/promptTemplates";

// カタカナを英語/ローマ字に変換する関数
function convertKatakanaToEnglish(text: string): string {
  if (!text) return text;

  // カタカナ→英語の変換マップ
  const katakanaToEnglish: { [key: string]: string } = {
    // 食べ物
    'スパゲッティ': 'spaghetti',
    'パスタ': 'pasta',
    'ピザ': 'pizza',
    'ハンバーガー': 'hamburger',
    'サンドイッチ': 'sandwich',
    'ケーキ': 'cake',
    'アイスクリーム': 'ice cream',
    'コーヒー': 'coffee',
    'ティー': 'tea',
    'ジュース': 'juice',
    'ビール': 'beer',
    'ワイン': 'wine',
    'チョコレート': 'chocolate',
    'クッキー': 'cookie',
    'パン': 'bread',
    
    // 動物
    'ドッグ': 'dog',
    'キャット': 'cat',
    'バード': 'bird',
    'フィッシュ': 'fish',
    'ライオン': 'lion',
    'エレファント': 'elephant',
    'タイガー': 'tiger',
    'パンダ': 'panda',
    
    // 乗り物
    'カー': 'car',
    'バス': 'bus',
    'トレイン': 'train',
    'プレーン': 'plane',
    'バイク': 'bike',
    'タクシー': 'taxi',
    
    // スポーツ
    'サッカー': 'soccer',
    'バスケットボール': 'basketball',
    'テニス': 'tennis',
    'ゴルフ': 'golf',
    'スイミング': 'swimming',
    'ランニング': 'running',
    
    // 色
    'ブルー': 'blue',
    'レッド': 'red',
    'グリーン': 'green',
    'イエロー': 'yellow',
    'ブラック': 'black',
    'ホワイト': 'white',
    'ピンク': 'pink',
    'オレンジ': 'orange',
    
    // 技術
    'コンピューター': 'computer',
    'インターネット': 'internet',
    'スマートフォン': 'smartphone',
    'ゲーム': 'game',
    'アプリ': 'app',
    'ソフトウェア': 'software',
    
    // 場所
    'レストラン': 'restaurant',
    'ホテル': 'hotel',
    'スーパーマーケット': 'supermarket',
    'パーク': 'park',
    'ライブラリー': 'library',
    'ミュージアム': 'museum',
    'シネマ': 'cinema',
    
    // 国・都市
    'アメリカ': 'America',
    'イギリス': 'Britain',
    'フランス': 'France',
    'ドイツ': 'Germany',
    'イタリア': 'Italy',
    'スペイン': 'Spain',
    'オーストラリア': 'Australia',
    'カナダ': 'Canada',
    'トーキョー': 'Tokyo',
    'オーサカ': 'Osaka',
    'キョート': 'Kyoto',
    'ヨコハマ': 'Yokohama',
    
    // その他一般的な単語
    'ミュージック': 'music',
    'ムービー': 'movie',
    'ブック': 'book',
    'ペン': 'pen',
    'ペーパー': 'paper',
    'タイム': 'time',
    'スペース': 'space',
    'ハウス': 'house',
    'ファミリー': 'family',
    'フレンド': 'friend',
    'ワーク': 'work',
    'スクール': 'school',
    'クラス': 'class',
    'ティーチャー': 'teacher',
    'スチューデント': 'student',
  };

  // カタカナからひらがなへの変換マップ（ローマ字変換用）
  const katakanaToHiragana: { [key: string]: string } = {
    'ア': 'あ', 'イ': 'い', 'ウ': 'う', 'エ': 'え', 'オ': 'お',
    'カ': 'か', 'キ': 'き', 'ク': 'く', 'ケ': 'け', 'コ': 'こ',
    'サ': 'さ', 'シ': 'し', 'ス': 'す', 'セ': 'せ', 'ソ': 'そ',
    'タ': 'た', 'チ': 'ち', 'ツ': 'つ', 'テ': 'て', 'ト': 'と',
    'ナ': 'な', 'ニ': 'に', 'ヌ': 'ぬ', 'ネ': 'ね', 'ノ': 'の',
    'ハ': 'は', 'ヒ': 'ひ', 'フ': 'ふ', 'ヘ': 'へ', 'ホ': 'ほ',
    'マ': 'ま', 'ミ': 'み', 'ム': 'む', 'メ': 'め', 'モ': 'も',
    'ヤ': 'や', 'ユ': 'ゆ', 'ヨ': 'よ',
    'ラ': 'ら', 'リ': 'り', 'ル': 'る', 'レ': 'れ', 'ロ': 'ろ',
    'ワ': 'わ', 'ヲ': 'を', 'ン': 'ん',
    'ガ': 'が', 'ギ': 'ぎ', 'グ': 'ぐ', 'ゲ': 'げ', 'ゴ': 'ご',
    'ザ': 'ざ', 'ジ': 'じ', 'ズ': 'ず', 'ゼ': 'ぜ', 'ゾ': 'ぞ',
    'ダ': 'だ', 'ヂ': 'ぢ', 'ヅ': 'づ', 'デ': 'で', 'ド': 'ど',
    'バ': 'ば', 'ビ': 'び', 'ブ': 'ぶ', 'ベ': 'べ', 'ボ': 'ぼ',
    'パ': 'ぱ', 'ピ': 'ぴ', 'プ': 'ぷ', 'ペ': 'ぺ', 'ポ': 'ぽ',
    'キャ': 'きゃ', 'キュ': 'きゅ', 'キョ': 'きょ',
    'シャ': 'しゃ', 'シュ': 'しゅ', 'ショ': 'しょ',
    'チャ': 'ちゃ', 'チュ': 'ちゅ', 'チョ': 'ちょ',
    'ニャ': 'にゃ', 'ニュ': 'にゅ', 'ニョ': 'にょ',
    'ヒャ': 'ひゃ', 'ヒュ': 'ひゅ', 'ヒョ': 'ひょ',
    'ミャ': 'みゃ', 'ミュ': 'みゅ', 'ミョ': 'みょ',
    'リャ': 'りゃ', 'リュ': 'りゅ', 'リョ': 'りょ',
    'ギャ': 'ぎゃ', 'ギュ': 'ぎゅ', 'ギョ': 'ぎょ',
    'ジャ': 'じゃ', 'ジュ': 'じゅ', 'ジョ': 'じょ',
    'ビャ': 'びゃ', 'ビュ': 'びゅ', 'ビョ': 'びょ',
    'ピャ': 'ぴゃ', 'ピュ': 'ぴゅ', 'ピョ': 'ぴょ',
  };

  // ひらがなからローマ字への変換マップ
  const hiraganaToRomaji: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  };

  let result = text;

  // 1. まず英語変換マップで直接変換を試行
  for (const [katakana, english] of Object.entries(katakanaToEnglish)) {
    result = result.replace(new RegExp(katakana, 'g'), english);
  }

  // 2. 残ったカタカナをローマ字に変換
  // カタカナをひらがなに変換
  for (const [katakana, hiragana] of Object.entries(katakanaToHiragana)) {
    result = result.replace(new RegExp(katakana, 'g'), hiragana);
  }

  // ひらがなをローマ字に変換
  for (const [hiragana, romaji] of Object.entries(hiraganaToRomaji)) {
    result = result.replace(new RegExp(hiragana, 'g'), romaji);
  }

  console.log('🔤 カタカナ変換:', { original: text, converted: result });
  return result;
}

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
      let actualTheme = theme || topic;
      const actualStyle = style || '専門家がやさしく説明'; // デフォルトスタイル

      // カタカナを英語/ローマ字に変換
      actualTheme = convertKatakanaToEnglish(actualTheme);

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
- Include TWO surprising but verifiable facts or fascinating episodes that will amaze readers
- These facts should be unexpected, memorable, and educationally valuable
- Make sure these surprising elements are woven naturally into the content
- Translation: After each English paragraph, provide Japanese translation
- NO labels, headers, or numbering of any kind

Output format:
English paragraph

Japanese paragraph

English paragraph

Japanese paragraph

English paragraph

Japanese paragraph
      `.trim();
    }

    console.log('📤 【GPT-3.5-turbo】送信するプロンプト:', userPrompt.substring(0, 200) + '...');
    console.log('🤖 【モデル情報】使用モデル: gpt-3.5-turbo, max_tokens: 2000');

    // Level別システムメッセージ
    let systemMessage = "You are an educational writer. Follow instructions strictly. Always write exactly 220-260 words in at least 3 paragraphs. NEVER include any labels, headers, numbering, or section markers like 'Japanese Translation 1' or 'English paragraph 1'. Write only the content itself. COUNT YOUR WORDS before finishing - you must reach at least 220 words.";
    
    if (level <= 3) {
      systemMessage = `CRITICAL: You are writing for 10-year-old children. You MUST use ONLY the simplest English words. Any word longer than 5 letters is FORBIDDEN (except: people, mother, father, sister, brother, family, house, water, today). Use only words that appear in beginner children's books. Write exactly 140-200 words in 3 paragraphs. EVERY word must be simple and basic. NEVER include any labels or numbering.`;
    } else if (level === 4) {
      systemMessage = `You are writing for intermediate English learners (B2 level). CRITICAL: You MUST write exactly 200-240 words. COUNT your words carefully - you must reach at least 200 words. Write in at least 3 paragraphs. Include complex sentence structures and intermediate vocabulary. NEVER include any labels, headers, or numbering. Write only the content itself. WORD COUNT IS CRITICAL.`;
    } else if (level >= 5) {
      systemMessage = `You are writing for advanced English learners (C1+ level). CRITICAL: You MUST write exactly 240-280 words. COUNT your words carefully - you must reach at least 240 words. Write in at least 3 paragraphs. Use sophisticated vocabulary, complex sentence structures, nuanced expressions, and varied sentence patterns. NEVER include any labels, headers, or numbering. Write only the content itself. WORD COUNT IS CRITICAL.`;
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
        let line = lines[i];
        
        // ラベル除去: 「Japanese Translation 1」「English paragraph 2」などを除去
        const labelPatterns = [
          /^Japanese [Tt]ranslation \d+:?/i,
          /^English [Pp]aragraph \d+:?/i,
          /^【日本語】/,
          /^【英語】/,
          /^English:/i,
          /^Japanese:/i,
          /^\d+\./  // 番号付きリストの除去
        ];
        
        let isLabel = false;
        for (const pattern of labelPatterns) {
          if (pattern.test(line)) {
            console.log('🗑️ ラベル除去:', line);
            isLabel = true;
            break;
          }
        }
        
        // ラベル行はスキップ
        if (isLabel) continue;
        
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
