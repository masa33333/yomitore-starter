import { NextResponse } from "next/server";

// 文章を適切な段落に分割する関数
function addParagraphBreaks(englishText: string, japaneseText: string, level: number): { english: string, japanese: string } {
  // 英語文章の段落分割
  let englishParagraphs: string[] = [];
  let japaneseParagraphs: string[] = [];
  
  // レベル1-2: 短い文章なので2-3段落に分割
  if (level <= 2) {
    const englishSentences = englishText.split(/(?<=[.!?])\s+/);
    const japaneseSentences = japaneseText.split(/(?<=[。！？])\s*/);
    
    const sentencesPerParagraph = Math.ceil(englishSentences.length / 2);
    
    for (let i = 0; i < englishSentences.length; i += sentencesPerParagraph) {
      englishParagraphs.push(englishSentences.slice(i, i + sentencesPerParagraph).join(' '));
    }
    
    for (let i = 0; i < japaneseSentences.length; i += sentencesPerParagraph) {
      japaneseParagraphs.push(japaneseSentences.slice(i, i + sentencesPerParagraph).join(''));
    }
  }
  // レベル3-5: より長い文章なので3-4段落に分割
  else {
    const englishSentences = englishText.split(/(?<=[.!?])\s+/);
    const japaneseSentences = japaneseText.split(/(?<=[。！？])\s*/);
    
    const paragraphCount = level >= 4 ? 4 : 3;
    const sentencesPerParagraph = Math.ceil(englishSentences.length / paragraphCount);
    
    for (let i = 0; i < englishSentences.length; i += sentencesPerParagraph) {
      englishParagraphs.push(englishSentences.slice(i, i + sentencesPerParagraph).join(' '));
    }
    
    for (let i = 0; i < japaneseSentences.length; i += sentencesPerParagraph) {
      japaneseParagraphs.push(japaneseSentences.slice(i, i + sentencesPerParagraph).join(''));
    }
  }
  
  return {
    english: englishParagraphs.join('\n\n'),
    japanese: japaneseParagraphs.join('\n\n')
  };
}


// カタカナから英語への変換辞書
const katakanaToEnglish: { [key: string]: string } = {
  // 人名
  'ジョン・レノン': 'John Lennon',
  'ジョンレノン': 'John Lennon',
  'ポール・マッカートニー': 'Paul McCartney',
  'ポールマッカートニー': 'Paul McCartney',
  'アインシュタイン': 'Einstein',
  'エジソン': 'Edison',
  'ナポレオン': 'Napoleon',
  'レオナルド・ダ・ヴィンチ': 'Leonardo da Vinci',
  'レオナルドダヴィンチ': 'Leonardo da Vinci',
  'モーツァルト': 'Mozart',
  'ベートーヴェン': 'Beethoven',
  'ピカソ': 'Picasso',
  'シェイクスピア': 'Shakespeare',
  'スティーブ・ジョブズ': 'Steve Jobs',
  'スティーブジョブズ': 'Steve Jobs',
  'ビル・ゲイツ': 'Bill Gates',
  'ビルゲイツ': 'Bill Gates',
  '織田信長': 'Oda Nobunaga',
  'おだのぶなが': 'Oda Nobunaga',
  '豊臣秀吉': 'Toyotomi Hideyoshi',
  '徳川家康': 'Tokugawa Ieyasu',
  '武田信玄': 'Takeda Shingen',
  '上杉謙信': 'Uesugi Kenshin',
  '村上春樹': 'Haruki Murakami',
  'むらかみはるき': 'Haruki Murakami',
  
  // 場所・国
  'アメリカ': 'America',
  'イギリス': 'Britain',
  'フランス': 'France',
  'ドイツ': 'Germany',
  'イタリア': 'Italy',
  'スペイン': 'Spain',
  'ロシア': 'Russia',
  'オーストラリア': 'Australia',
  'ブラジル': 'Brazil',
  'インド': 'India',
  'エジプト': 'Egypt',
  'ニューヨーク': 'New York',
  'ロンドン': 'London',
  'パリ': 'Paris',
  'ローマ': 'Rome',
  'ベルリン': 'Berlin',
  
  // 動物
  'ライオン': 'lions',
  'ゾウ': 'elephants',
  'キリン': 'giraffes',
  'パンダ': 'pandas',
  'ペンギン': 'penguins',
  'イルカ': 'dolphins',
  'クジラ': 'whales',
  'タイガー': 'tigers',
  'チーター': 'cheetahs',
  
  // 食べ物
  'チョコレート': 'chocolate',
  'ピザ': 'pizza',
  'パスタ': 'pasta',
  'ハンバーガー': 'hamburgers',
  'スシ': 'sushi',
  'テンプラ': 'tempura',
  
  // スポーツ
  'サッカー': 'soccer',
  'バスケットボール': 'basketball',
  'テニス': 'tennis',
  'ゴルフ': 'golf',
  
  // テクノロジー
  'アイパッド': 'iPad',
  'アイフォン': 'iPhone',
  'マック': 'Mac',
  'アップル': 'Apple',
  'グーグル': 'Google',
  'フェイスブック': 'Facebook',
  'ユーチューブ': 'YouTube',
  'ツイッター': 'Twitter',
  'インスタグラム': 'Instagram',
  'ベースボール': 'baseball',
  
  // 楽器・音楽
  'ピアノ': 'piano',
  'ギター': 'guitar',
  'バイオリン': 'violin',
  'ドラム': 'drums',
  'ビートルズ': 'The Beatles',
  
  // 技術
  'コンピューター': 'computers',
  'インターネット': 'the internet',
  'スマートフォン': 'smartphones',
  'ロボット': 'robots',
  
  // その他
  'クリスマス': 'Christmas',
  'ハロウィン': 'Halloween',
  'オリンピック': 'Olympics',
  'ユニバーサル': 'Universal',
  'ディズニー': 'Disney'
};

// 日本語を英語に変換する包括的な関数
function convertJapaneseToEnglish(topic: string): string {
  // 1. 登録済み辞書での完全一致をチェック
  if (katakanaToEnglish[topic]) {
    return katakanaToEnglish[topic];
  }
  
  // 2. 部分一致をチェック
  for (const [japanese, english] of Object.entries(katakanaToEnglish)) {
    if (topic.includes(japanese)) {
      return english;
    }
  }
  
  // 3. 日本語文字（ひらがな、カタカナ、漢字）が含まれているかチェック
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(topic);
  
  if (hasJapanese) {
    // 4. カタカナブランド名の基本的な変換
    const katakanaToRomaji = {
      'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
      'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
      'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
      'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
      'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
      'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
      'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
      'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
      'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
      'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
      'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
      'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
      'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
      'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
      'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
      'ー': '', // 長音符は無視
      '・': ' ', // 中黒は空白に
      'ッ': '' // 促音は次の子音を重ねるが、簡単化のため無視
    };
    
    // 5. 特定のブランド名や企業名の変換
    const brandMappings = {
      'グッチ': 'Gucci',
      'プラダ': 'Prada',
      'ルイヴィトン': 'Louis Vuitton',
      'ルイ・ヴィトン': 'Louis Vuitton',
      'シャネル': 'Chanel',
      'エルメス': 'Hermes',
      'ディオール': 'Dior',
      'アルマーニ': 'Armani',
      'ヴェルサーチ': 'Versace',
      'ドルチェ': 'Dolce',
      'フェラーリ': 'Ferrari',
      'ランボルギーニ': 'Lamborghini',
      'ポルシェ': 'Porsche',
      'ベンツ': 'Mercedes-Benz',
      'メルセデス': 'Mercedes',
      'BMW': 'BMW',
      'アウディ': 'Audi',
      'トヨタ': 'Toyota',
      'ホンダ': 'Honda',
      'ニッサン': 'Nissan',
      '日産': 'Nissan',
      'マツダ': 'Mazda',
      'スバル': 'Subaru',
      'スズキ': 'Suzuki',
      'ソニー': 'Sony',
      'ニンテンドー': 'Nintendo',
      '任天堂': 'Nintendo',
      'セガ': 'Sega',
      'カプコン': 'Capcom',
      'スクエア': 'Square',
      'ナイキ': 'Nike',
      'アディダス': 'Adidas',
      'プーマ': 'Puma',
      'リーボック': 'Reebok',
      'スターバックス': 'Starbucks',
      'マクドナルド': 'McDonald\'s',
      'ケンタッキー': 'KFC',
      'コカコーラ': 'Coca-Cola',
      'ペプシ': 'Pepsi',
      'サムスン': 'Samsung',
      'ヒュンダイ': 'Hyundai',
      'LG': 'LG',
      'アマゾン': 'Amazon',
      'amazon': 'Amazon'
    };
    
    // ブランド名での変換を試行
    for (const [japanese, english] of Object.entries(brandMappings)) {
      if (topic.includes(japanese)) {
        return english;
      }
    }
    
    // 6. カタカナの基本的なローマ字変換
    if (/[\u30A0-\u30FF]/.test(topic)) {
      let romanized = topic;
      for (const [katakana, romaji] of Object.entries(katakanaToRomaji)) {
        romanized = romanized.replace(new RegExp(katakana, 'g'), romaji);
      }
      // 最初の文字を大文字に
      romanized = romanized.charAt(0).toUpperCase() + romanized.slice(1);
      return romanized;
    }
    
    // 7. それでも日本語が残っている場合は、一般的な英語説明に置き換え
    return "this topic";
  }
  
  return topic; // 日本語が含まれていない場合はそのまま返す
}


export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    console.log('📚 Reading generation request (new JP→EN flow):', requestData);

    const { 
      level = 3, 
      topic = '', 
      theme = '', 
      mode = 'reading',
      genre = '',
      tone = '',
      feeling = '',
      isMailGeneration = false,
      useNewFlow = true  // 新フローのフラグ
    } = requestData;
    
    // レベルを1-5の範囲に正規化
    const normalizedLevel = Math.max(1, Math.min(5, parseInt(level.toString())));
    
    console.log(`📝 Generating content for level ${normalizedLevel}`, {
      mode, topic, theme, genre, tone, feeling, useNewFlow
    });

    // 2段階生成フロー: 日本語生成 → 英訳
    if (topic && topic.trim()) {
      console.log('🆕 Using new JP→EN generation flow');
      const generatedContent = await generateJapaneseFirstContent(normalizedLevel, topic, mode, genre, tone, feeling);
      
      let title = `About ${convertJapaneseToEnglish(topic)}`;
      
      // メール生成の場合は短縮版
      if (isMailGeneration) {
        const shortEnglish = generatedContent.english.slice(0, 2).join(' ').split('.').slice(0, 3).join('.') + '.';
        const shortJapanese = generatedContent.japanese.slice(0, 2).join('').split('。').slice(0, 2).join('。') + '。';
        
        return NextResponse.json({
          english: shortEnglish,
          japanese: shortJapanese,
          title: `Mail: ${title}`,
          level: normalizedLevel,
          wordCount: shortEnglish.split(' ').length,
          isMailGeneration: true
        });
      }

      const response = {
        japanese: generatedContent.japanese,
        english: generatedContent.english,
        level: normalizedLevel,
        topic: topic,
        title: title,
        wordCount: generatedContent.english.join(' ').split(' ').length,
        vocabulary: `Level ${normalizedLevel} vocabulary`,
        isMailGeneration: false,
        mode: mode
      };

      console.log('✅ New flow content generated:', {
        title: response.title,
        level: response.level,
        wordCount: response.wordCount,
        englishLength: response.english.length,
        mode: response.mode
      });

      return NextResponse.json(response);
    }

    // フォールバック: トピックがない場合は汎用コンテンツ生成
    const fallbackContent = await generateJapaneseFirstContent(normalizedLevel, "general reading", mode, genre, tone, feeling);
    
    let title = "General Reading";

    // メール生成の場合は短縮版
    if (isMailGeneration) {
      const shortEnglish = fallbackContent.english.slice(0, 2).join(' ').split('.').slice(0, 3).join('.') + '.';
      const shortJapanese = fallbackContent.japanese.slice(0, 2).join('').split('。').slice(0, 2).join('。') + '。';
      
      return NextResponse.json({
        english: shortEnglish,
        japanese: shortJapanese,
        title: `Mail: ${title}`,
        level: normalizedLevel,
        wordCount: shortEnglish.split(' ').length,
        isMailGeneration: true
      });
    }

    const response = {
      japanese: fallbackContent.japanese,
      english: fallbackContent.english,
      level: normalizedLevel,
      topic: "general reading",
      title: title,
      wordCount: fallbackContent.english.join(' ').split(' ').length,
      vocabulary: `Level ${normalizedLevel} vocabulary`,
      isMailGeneration: false,
      mode: mode
    };

    console.log('✅ Fallback content generated:', {
      title: response.title,
      level: response.level,
      wordCount: response.wordCount,
      mode: response.mode
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("Reading generation error:", error);
    
    return NextResponse.json({
      error: "Reading generation temporarily unavailable",
      english: "This is a sample reading text. Reading generation is temporarily unavailable, but you can still practice with this sample content.",
      japanese: "これはサンプルの読み物です。読み物生成は一時的に利用できませんが、このサンプルコンテンツで練習できます。",
      title: "Sample Reading",
      level: 2,
      wordCount: 20
    }, { status: 500 });
  }
}

// =============================================================================
// 2段階生成システム（日本語生成 → 英訳）
// =============================================================================
async function generateJapaneseFirstContent(
  level: number, 
  topic: string, 
  mode: string = 'reading',
  genre?: string,
  tone?: string,
  feeling?: string
): Promise<{english: string[], japanese: string[]}> {
  console.log(`🇯🇵 Generating ${mode} content for topic: "${topic}"`);
  
  // モードに応じて適切な生成関数を使用
  let japaneseContent: string[];
  
  if (mode === 'story') {
    japaneseContent = await generateStoryContent(topic, genre, tone, feeling);
  } else {
    japaneseContent = await generateJapaneseContent(topic);
  }
  
  // 語彙レベル制御付き英訳
  const englishContent = await translateWithVocabularyControl(japaneseContent, level);
  
  return {
    english: englishContent,
    japanese: japaneseContent
  };
}

// 日本語コンテンツ生成関数
async function generateJapaneseContent(topic: string): Promise<string[]> {
  const japanesePrompt = `以下の条件に沿って、読み物として面白い日本語コンテンツを3段落で生成してください。

■ トピック: ${topic}
■ 想定語彙レベル: 中学生〜高校生（語彙制限なし）
■ 構成:
- 1段落目：興味を引く具体的な導入（驚き・共感）
- 2段落目：意外な事実や展開
- 3段落目：視点の転換や今に繋がる意義

■ ルール:
- 主語・視点を統一（ですます調）
- ストーリー的要素を含む（例: 実際の人物・事例）
- 専門家がわかりやすく説明しているスタイルで
- 絶対に対話形式・会話形式にしない
- 「AさんがBさんに」「〜と言いました」「〜と答えました」等の会話表現禁止
- 必ずファクトチェックを行い、事実に基づいた正確な情報のみを使用する
- 科学的根拠がない情報や推測に基づく内容は含めない

出力フォーマット：
{
  "jp_paragraphs": ["...", "...", "..."]
}`;

  console.log('🎌 Generating Japanese content with OpenAI API for topic:', topic);
  
  // API key チェック
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found, using fallback');
    const sampleContent = generateSampleJapaneseContent(topic);
    return sampleContent;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: japanesePrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // JSONレスポンスをパース
    try {
      const parsed = JSON.parse(content);
      if (parsed.jp_paragraphs && Array.isArray(parsed.jp_paragraphs)) {
        console.log('✅ Japanese content generated via OpenAI:', parsed.jp_paragraphs);
        return parsed.jp_paragraphs;
      }
    } catch (parseError) {
      console.warn('⚠️ OpenAI response parsing failed, using fallback');
    }
    
    // フォールバック: サンプルコンテンツを使用
    const sampleContent = generateSampleJapaneseContent(topic);
    console.log('✅ Japanese content generated (fallback):', sampleContent);
    return sampleContent;
    
  } catch (error) {
    console.error('❌ OpenAI API error for Japanese generation:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      topic
    });
    
    // エラー時はサンプルコンテンツを使用
    const sampleContent = generateSampleJapaneseContent(topic);
    console.log('✅ Japanese content generated (error fallback):', sampleContent);
    return sampleContent;
  }
}

// サンプル日本語コンテンツ生成（実際にはAI APIを使用）
function generateSampleJapaneseContent(topic: string): string[] {
  const englishTopic = convertJapaneseToEnglish(topic);
  
  // トピック別のサンプル日本語コンテンツ
  const sampleContents: {[key: string]: string[]} = {
    'Edison': [
      '「発明王」と呼ばれるエジソンですが、実は彼の最初の発明品は大失敗でした。1868年、26歳のエジソンが開発した「電気投票記録装置」は、議会での投票を素早く集計できる画期的なシステムでした。しかし、政治家たちからは「投票に時間をかけることで裏取引ができなくなる」と猛反対され、誰も買ってくれませんでした。',
      'この失敗からエジソンは重要な教訓を学びました。「技術的に優れているだけでは意味がない。人々が本当に欲しがるものを作らなければならない」と。その後の彼の発明は、すべて市場のニーズを徹底的に調査してから開発されました。電球も蓄音機も、まず「誰がなぜそれを必要とするのか」を明確にしてから作られたのです。',
      '現在のシリコンバレーでも、エジソンの「市場ファースト」の考え方は受け継がれています。スティーブ・ジョブズは「顧客が何を欲しがっているかを聞くのではなく、彼らが知らない欲しいものを提示する」と語りましたが、これもエジソンの哲学の現代版です。失敗から学び、人々の真のニーズを見つけ出す―この姿勢こそが、時代を超えた発明家の本質なのかもしれません。'
    ],
    'Amazon': [
      '1994年、ジェフ・ベゾスはニューヨークの投資銀行で働く30歳のエリートでした。ある日、彼はインターネットの利用者が年間2300%の勢いで増加しているという統計を目にします。「これは何かが起こる前兆だ」と直感した彼は、安定した高給の仕事を辞めて、ガレージで本のオンライン販売を始めました。周囲の人々は彼を「正気を失った」と思いました。',
      'ベゾスが最初に選んだのは「本」という商品でした。なぜなら、本は種類が多く（300万種類以上）、どこで買っても同じで、軽くて配送しやすいからです。しかし、開業当初は彼自身が倉庫で本を梱包し、車で郵便局に運んでいました。机も手作りで、ドアに脚をつけただけの代物でした。「お金をかけるべきは顧客体験であって、見栄ではない」というのが彼の哲学でした。',
      '今日、アマゾンの「顧客第一主義」は多くの企業の手本となっています。会議室には必ず「顧客を代表する空の椅子」が置かれ、すべての議論で「顧客にとってどうか」が最優先されます。また、長期的視点で投資を続ける姿勢も、現在のテック企業のスタンダードになりました。ベゾスの「ガレージからスタートした本屋」は、現代のビジネスの在り方そのものを変えてしまったのです。'
    ]
  };
  
  return sampleContents[englishTopic] || [
    `${topic}について、多くの人が知らない興味深い事実があります。`,
    `実際には、${topic}にはさらに驚くべき側面があります。`,
    `このように、${topic}は現代の私たちにとって重要な意味を持っています。`
  ];
}

// ストーリー用日本語コンテンツ生成関数
async function generateStoryContent(
  topic: string, 
  genre?: string, 
  tone?: string, 
  feeling?: string
): Promise<string[]> {
  const storyPrompt = `以下の条件に沿って、魅力的な物語を3段落で生成してください。

■ 基本設定:
- テーマ/トピック: ${topic}
- ジャンル: ${genre || '一般的な物語'}
- トーン: ${tone || '興味深い'}
- 感情: ${feeling || '楽しい'}

■ 物語の構成:
- 1段落目：主人公の紹介と状況設定（日常から非日常への転換）
- 2段落目：困難や挑戦の発生（ドラマチックな展開）
- 3段落目：解決や発見（学びや成長のある結末）

■ ストーリーの特徴:
- 具体的なキャラクター（名前と特徴）を登場させる
- 対話や会話を含める（「〜と言いました」「〜と答えました」形式OK）
- 読者が感情移入できるような人間味のある描写
- ${topic}が物語の中核となるような展開
- 読み終わった後に何か学びや気づきがある内容

■ 文体:
- ですます調で統一
- 中学生〜高校生が理解できる日本語
- 物語らしい表現を使用（「その時」「すると」「やがて」等）

■ 重要な注意事項:
- 必ずファクトチェックを行い、事実に基づいた正確な情報のみを使用する
- 科学的根拠がない情報や推測に基づく内容は含めない
- フィクションであっても、現実的で信頼できる設定にする

出力フォーマット：
{
  "jp_paragraphs": ["...", "...", "..."]
}`;

  console.log('📖 Generating story content with OpenAI API for topic:', topic);
  
  // API key チェック
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found, using fallback');
    const sampleStory = generateSampleStoryContent(topic, genre, tone, feeling);
    return sampleStory;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: storyPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📖 OpenAI story response received');
    
    const content = data.choices[0].message.content.trim();
    
    // JSONレスポンスをパース
    try {
      const parsed = JSON.parse(content);
      if (parsed.jp_paragraphs && Array.isArray(parsed.jp_paragraphs)) {
        console.log('✅ Story content generated via OpenAI:', parsed.jp_paragraphs);
        return parsed.jp_paragraphs;
      }
    } catch (parseError) {
      console.warn('⚠️ OpenAI story response parsing failed, using fallback');
    }
    
    // フォールバック: サンプルストーリーを使用
    const sampleStory = generateSampleStoryContent(topic, genre, tone, feeling);
    console.log('✅ Story content generated (fallback):', sampleStory);
    return sampleStory;
    
  } catch (error) {
    console.error('❌ OpenAI API error for story:', error);
    
    // エラー時はサンプルストーリーを使用
    const sampleStory = generateSampleStoryContent(topic, genre, tone, feeling);
    console.log('✅ Story content generated (error fallback):', sampleStory);
    return sampleStory;
  }
}

// サンプルストーリーコンテンツ生成
function generateSampleStoryContent(
  topic: string,
  genre?: string, 
  tone?: string, 
  feeling?: string
): string[] {
  const englishTopic = convertJapaneseToEnglish(topic);
  
  // トピック別のサンプルストーリー
  const sampleStories: {[key: string]: string[]} = {
    'cats': [
      '小さな町に住む少女ユイは、毎朝学校に向かう途中で一匹の野良猫に出会っていました。その猫は人懐っこく、いつもユイの後をついてきます。「この子にミルクをあげたいな」とユイは思いましたが、両親は「野良猫にエサをあげてはいけない」と言っていました。',
      'ある雨の日、その猫が道端で震えているのを見つけたユイは、迷わず自分の傘で猫を守りました。「大丈夫だよ、一緒にいるからね」と声をかけると、猫は安心したように鳴きました。その時、近くのペットショップの店主が現れて「この子は昨日迷子になった子猫です。飼い主さんが探しています」と教えてくれました。',
      'ユイは飼い主のおばあさんと猫を再会させることができました。おばあさんは涙を流して感謝し、「優しい心を持った子ですね。よかったら時々この子に会いに来てください」と言いました。それからユイは週末になると猫に会いに行くようになり、動物の大切さと思いやりの心の大切さを学びました。'
    ],
    'adventure': [
      '冒険好きの少年タクマは、祖父から古い地図を受け取りました。「この地図に描かれた場所には、昔の探検家が隠した宝物があるらしい」と祖父は言いました。タクマは親友のリナと一緒に、夏休みを使ってその場所を探すことにしました。',
      '地図を頼りに山奥を歩いていると、大きな岩で道が塞がれていました。「どうしよう、進めないよ」とリナが言うと、タクマは「みんなで力を合わせれば動かせるかもしれない」と提案しました。二人は諦めずに岩を押し続け、ついにそれを動かすことができました。その先には美しい湖が広がっていました。',
      '湖のほとりで宝箱を発見した二人でしたが、中に入っていたのは金銀財宝ではありませんでした。それは探検家が書いた手紙で、「真の宝物は冒険を通じて得られる友情と勇気である」と書かれていました。タクマとリナは顔を見合わせて笑い、この冒険で得た絆こそが最高の宝物だと実感しました。'
    ]
  };
  
  return sampleStories[englishTopic] || [
    `${topic}をテーマにした物語が始まります。主人公は新しい発見をしようとしていました。`,
    `困難に直面した主人公でしたが、諦めずに挑戦を続けました。`,
    `最終的に主人公は大切なことを学び、成長することができました。`
  ];
}

// Step 2: 語彙レベル制御付き英訳
async function translateWithVocabularyControl(japaneseContent: string[], level: number): Promise<string[]> {
  console.log(`🔤 Translating to English with Level ${level} vocabulary control`);
  
  // NGSL語彙レベル範囲の設定
  const vocabularyRanges = {
    1: { rangeStart: 1, rangeMid: 500, rangeEnd: 800 },
    2: { rangeStart: 1, rangeMid: 750, rangeEnd: 1200 },
    3: { rangeStart: 1, rangeMid: 1000, rangeEnd: 1500 },
    4: { rangeStart: 1, rangeMid: 1500, rangeEnd: 2500 },
    5: { rangeStart: 1, rangeMid: 2000, rangeEnd: 4000 }
  };
  
  const range = vocabularyRanges[level as keyof typeof vocabularyRanges];
  
  const translationPrompt = `次の日本語3段落を、指定の語彙レベル（NGSL）に基づいて英訳してください。

■ 日本語本文:
${japaneseContent[0]}
${japaneseContent[1]}
${japaneseContent[2]}

■ 語彙レベル: Level ${level}（NGSL ${range.rangeStart}–${range.rangeEnd}）

■ 指示:
- 使用語彙の80%以上を ${range.rangeStart}–${range.rangeMid} の範囲から選ぶこと
- 難語の多用を避け、自然な英文にすること
- 各段落の長さ・雰囲気を保持
- 専門家がわかりやすく説明しているスタイルを維持
- 絶対に対話形式・会話形式にしない
- "said", "asked", "replied", "A told B"等の会話表現禁止
- 翻訳時も必ずファクトチェックを行い、事実に基づいた正確な情報のみを使用する
- 科学的根拠がない情報や推測に基づく内容は含めない
- 出力は JSON 形式で、各段落を配列に：

出力例：
{
  "en_paragraphs": ["...", "...", "..."]
}`;

  console.log('🔤 Translating to English with OpenAI API');
  
  // API key チェック
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found for translation, using fallback');
    const sampleTranslation = generateSampleEnglishTranslation(japaneseContent, level);
    return sampleTranslation;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: translationPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // JSONレスポンスをパース
    try {
      const parsed = JSON.parse(content);
      if (parsed.en_paragraphs && Array.isArray(parsed.en_paragraphs)) {
        console.log('✅ English translation generated via OpenAI:', parsed.en_paragraphs);
        return parsed.en_paragraphs;
      }
    } catch (parseError) {
      console.warn('⚠️ OpenAI translation response parsing failed, using fallback');
    }
    
    // フォールバック: サンプル翻訳を使用
    const sampleTranslation = generateSampleEnglishTranslation(japaneseContent, level);
    console.log('✅ English translation generated (fallback):', sampleTranslation);
    return sampleTranslation;
    
  } catch (error) {
    console.error('❌ OpenAI translation API error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // エラー時はサンプル翻訳を使用
    const sampleTranslation = generateSampleEnglishTranslation(japaneseContent, level);
    console.log('✅ English translation generated (error fallback):', sampleTranslation);
    return sampleTranslation;
  }
}

// サンプル英訳生成（実際にはAI APIを使用）
function generateSampleEnglishTranslation(japaneseContent: string[], level: number): string[] {
  // Level 3 Edison example
  if (japaneseContent[0].includes('エジソン') || japaneseContent[0].includes('発明王')) {
    return [
      'Edison is known as the "Invention King," but his first invention was actually a big failure. In 1868, when he was 26 years old, Edison created an "electric vote recording machine." This system could count votes in Congress very quickly. However, politicians strongly opposed it because they said "if voting becomes too fast, we cannot make secret deals." Nobody wanted to buy it.',
      'From this failure, Edison learned an important lesson. He realized that "being technically excellent is not enough. You must create what people really want." After that, all of his inventions were developed only after carefully studying what the market needed. Both the light bulb and the phonograph were created after first clearly understanding "who needs this and why."',
      'Today in Silicon Valley, Edison\'s "market first" thinking continues to live on. Steve Jobs once said "Don\'t ask customers what they want. Show them what they didn\'t know they wanted." This is a modern version of Edison\'s philosophy. Learning from failure and finding people\'s true needs—this attitude might be the essence of inventors across all times.'
    ];
  }
  
  // Amazon example
  if (japaneseContent[0].includes('ベゾス') || japaneseContent[0].includes('Amazon')) {
    return [
      'In 1994, Jeff Bezos was a 30-year-old elite working at an investment bank in New York. One day, he saw statistics showing that internet users were growing at a rate of 2,300% per year. "This is a sign that something big is about to happen," he thought. He quit his stable, high-paying job and started selling books online from his garage. People around him thought he had "lost his mind."',
      'The first product Bezos chose was "books." This was because books come in many varieties (over 3 million types), they are the same no matter where you buy them, and they are light and easy to ship. However, in the early days, he personally packed books in the warehouse and drove them to the post office. Even his desk was handmade—just a door with legs attached. "Money should be spent on customer experience, not on showing off," was his philosophy.',
      'Today, Amazon\'s "customer first" principle has become a model for many companies. Every meeting room has an "empty chair representing the customer," and "what is best for the customer" is always the top priority in all discussions. Also, the attitude of continuing to invest with a long-term perspective has become the standard for today\'s tech companies. Bezos\'s "bookstore that started in a garage" has changed the very way modern business works.'
    ];
  }
  
  // Default translation with proper length
  const defaultTranslations = [
    `Today we will explore an interesting topic that many people find fascinating. Learning about different subjects helps us understand the world around us better. This particular topic has many surprising facts that most people don't know about. When we study these details carefully, we can discover amazing connections between different ideas and concepts.`,
    `There are many important aspects to consider when discussing this subject. Scientists and researchers have spent years studying these phenomena to understand how they work. The results of their investigations have revealed unexpected patterns and relationships. These discoveries have changed the way we think about many things in our daily lives.`,
    `Understanding this topic can help us make better decisions in our personal and professional lives. The knowledge we gain from studying these concepts applies to many different situations. By learning about these ideas, we become more informed citizens and better problem solvers. This kind of education is valuable for people of all ages and backgrounds.`
  ];
  
  return defaultTranslations;
}