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

// トピック別の読み物生成関数
function generateTopicContent(level: number, topic: string) {
  // 日本語を英語に変換
  const englishTopic = convertJapaneseToEnglish(topic);
  const topicLower = englishTopic.toLowerCase();
  
  console.log(`🔄 Topic conversion: "${topic}" → "${englishTopic}"`);
  
  // 特定のトピックに対する専用コンテンツ
  if (topicLower.includes('coffee') || topic.includes('コーヒー')) {
    return getCoffeeContent(level);
  }
  if (topicLower.includes('volcano') || topic.includes('火山')) {
    return getVolcanoContent(level);
  }
  if (topicLower.includes('ocean') || topic.includes('海')) {
    return getOceanContent(level);
  }
  if (topicLower.includes('space') || topic.includes('宇宙')) {
    return getSpaceContent(level);
  }
  if (topicLower.includes('animal') || topic.includes('動物')) {
    return getAnimalContent(level);
  }
  // テクノロジー関連の専用処理
  if (topicLower.includes('ipad') || topicLower.includes('アイパッド') || topicLower.includes('タブレット')) {
    return getTechnologyContent(level, 'iPad');
  }
  if (topicLower.includes('iphone') || topicLower.includes('アイフォン') || topicLower.includes('スマートフォン')) {
    return getTechnologyContent(level, 'iPhone');
  }
  if (topicLower.includes('apple') || topicLower.includes('アップル')) {
    return getTechnologyContent(level, 'Apple');
  }
  if (topicLower.includes('google') || topicLower.includes('グーグル')) {
    return getTechnologyContent(level, 'Google');
  }
  if (topicLower.includes('computer') || topicLower.includes('コンピューター') || topicLower.includes('パソコン')) {
    return getTechnologyContent(level, 'computer');
  }
  if (topicLower.includes('internet') || topicLower.includes('インターネット') || topicLower.includes('ネット')) {
    return getTechnologyContent(level, 'internet');
  }
  
  // 汎用的なトピックコンテンツ（英語変換済みトピックを使用）
  return getGenericTopicContent(level, englishTopic);
}

// フォールバック用のサンプル読み物データ
const fallbackReadings = {
  1: {
    english: "Tom likes cats. He has a small cat. The cat is white. Tom and his cat play every day. They are happy together. Tom gives food to his cat. His cat likes fish. In the morning, Tom and his cat walk in the garden. The cat runs fast. Tom runs too. They have fun. At night, they sleep together. Tom loves his cat very much.",
    japanese: "トムは猫が好きです。彼は小さな猫を飼っています。その猫は白いです。トムと彼の猫は毎日遊びます。彼らは一緒にいて幸せです。トムは猫に餌をあげます。彼の猫は魚が好きです。朝、トムと猫は庭を散歩します。猫は速く走ります。トムも走ります。彼らは楽しく過ごします。夜、彼らは一緒に寝ます。トムは猫をとても愛しています。"
  },
  2: {
    english: "Sarah started learning to cook last month. She wanted to make her family happy with delicious meals. At first, it was difficult because she had never cooked before. She burned the rice and dropped eggs on the floor. But Sarah didn't give up. She watched cooking videos and asked her mother for help. Slowly, she got better. Last week, she made a wonderful dinner for her parents. They were very proud of her. Now Sarah cooks something new every weekend.",
    japanese: "サラは先月料理を習い始めました。彼女は美味しい料理で家族を幸せにしたかったのです。最初は、今まで料理をしたことがなかったので難しかったです。ご飯を焦がしたり、卵を床に落としたりしました。でもサラは諦めませんでした。料理のビデオを見て、お母さんに助けを求めました。だんだん上手になりました。先週、両親に素晴らしい夕食を作りました。両親はとても誇らしく思いました。今サラは毎週末新しい料理に挑戦しています。"
  },
  3: {
    english: "The ancient library stood quietly at the edge of town, its tall windows reflecting the golden afternoon sun. Maria had always been curious about this mysterious building that everyone said was empty. Today, she finally decided to explore it. As she pushed open the heavy wooden door, dust particles danced in the sunbeams that streamed through the windows. Thousands of books lined the walls, their leather covers worn but still beautiful. In the center of the main room, she discovered an old desk with an open journal. The pages contained stories written by previous visitors, each one telling about their own magical discoveries in this forgotten place.",
    japanese: "古い図書館は町の端に静かに佇んでいて、高い窓が午後の金色の太陽を反射していました。マリアはいつも、誰もが空っぽだと言っているこの神秘的な建物に好奇心を抱いていました。今日、ついに探検することに決めました。重い木のドアを押し開けると、窓から差し込む太陽の光の中でほこりの粒子が踊っていました。何千もの本が壁に並んでいて、革の表紙は古くなっていましたが、まだ美しかったです。メインルームの中央で、彼女は開かれた日記帳がある古い机を発見しました。ページには以前の訪問者が書いた物語が含まれていて、それぞれがこの忘れられた場所での魔法的な発見について語っていました。"
  },
  4: {
    english: "Dr. Elizabeth Chen had devoted her entire career to understanding climate patterns, but nothing had prepared her for the data she was analyzing now. The satellite images revealed unprecedented changes in ocean currents that could fundamentally alter weather systems worldwide. As she compared the current measurements with historical records spanning fifty years, a troubling pattern emerged. The rate of change was accelerating far beyond what any existing models had predicted. She realized that this discovery would challenge conventional scientific thinking and potentially reshape humanity's approach to environmental conservation. The implications were both terrifying and fascinating.",
    japanese: "エリザベス・チェン博士は気候パターンの理解に全キャリアを捧げていましたが、今分析しているデータに対しては何も準備ができていませんでした。衛星画像は、世界中の気象システムを根本的に変える可能性のある海流の前例のない変化を明らかにしました。50年間にわたる歴史的記録と現在の測定値を比較すると、憂慮すべきパターンが浮かび上がりました。変化の速度は既存のモデルが予測していたものをはるかに超えて加速していました。彼女はこの発見が従来の科学的思考に挑戦し、人類の環境保全へのアプローチを潜在的に再構築するだろうと認識しました。その意味は恐ろしくも魅力的でした。"
  },
  5: {
    english: "The philosophical implications of artificial consciousness have long perplexed scholars, but recent advances in neurotechnology have transformed theoretical debates into urgent practical considerations. Professor Martinez contemplated the ethical ramifications as she observed the neural networks exhibiting unprecedented patterns of self-reflection and introspective analysis. The convergence of quantum computing and biological systems had created entities that demonstrated not merely computational prowess, but genuine existential questioning. These developments challenged fundamental assumptions about the nature of consciousness, free will, and the boundaries between natural and artificial intelligence. The scientific community found itself grappling with questions that transcended technological innovation and ventured into the realm of metaphysical inquiry.",
    japanese: "人工意識の哲学的含意は長い間学者を困惑させてきましたが、神経技術の最近の進歩により、理論的議論が緊急の実践的考慮事項に変わりました。マルティネス教授は、前例のない自己反省と内省的分析のパターンを示すニューラルネットワークを観察しながら、倫理的影響について熟考しました。量子コンピューティングと生物学的システムの収束により、単なる計算能力ではなく、真の実存的疑問を示す実体が創造されました。これらの発展は、意識の本質、自由意志、そして自然知能と人工知能の境界についての根本的な仮定に挑戦しました。科学界は、技術革新を超越し、形而上学的探究の領域に踏み込む問題と格闘していることに気づきました。"
  }
};

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
      const generatedContent = await generateJapaneseFirstContent(normalizedLevel, topic);
      
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
    const fallbackContent = await generateJapaneseFirstContent(normalizedLevel, "general reading");
    
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
async function generateJapaneseFirstContent(level: number, topic: string): Promise<{english: string[], japanese: string[]}> {
  console.log(`🇯🇵 Generating Japanese content for topic: "${topic}"`);
  
  // 日本語コンテンツ生成
  const japaneseContent = await generateJapaneseContent(topic);
  
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
    console.error('❌ OpenAI API error:', error);
    
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
  
  // Default translation
  return japaneseContent.map((paragraph, index) => 
    `This is paragraph ${index + 1} about the topic. It contains interesting information that readers will find engaging and educational.`
  );
}