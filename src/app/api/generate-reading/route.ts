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

// 動的なストーリー生成関数
function generateStoryContent(level: number, genre: string, tone: string, feeling: string) {
  const storyTemplates = {
    adventure: {
      exciting: {
        thrilled: getAdventureStory(level, 'exciting', 'thrilled'),
        amazed: getAdventureStory(level, 'exciting', 'amazed'),
        inspired: getAdventureStory(level, 'exciting', 'inspired')
      },
      mysterious: {
        curious: getAdventureStory(level, 'mysterious', 'curious'),
        intrigued: getAdventureStory(level, 'mysterious', 'intrigued')
      }
    },
    romance: {
      warm: {
        happy: getRomanceStory(level, 'warm', 'happy'),
        hopeful: getRomanceStory(level, 'warm', 'hopeful')
      }
    },
    mystery: {
      suspenseful: {
        curious: getMysteryStory(level, 'suspenseful', 'curious'),
        puzzled: getMysteryStory(level, 'suspenseful', 'puzzled')
      }
    }
  };

  // 該当するストーリーを取得、なければ汎用ストーリー
  if (storyTemplates[genre as keyof typeof storyTemplates]?.[tone as keyof any]?.[feeling as keyof any]) {
    return storyTemplates[genre as keyof typeof storyTemplates][tone as keyof any][feeling as keyof any];
  }
  
  return getGenericStory(level, genre, tone, feeling);
}

// カタカナから英語への変換辞書
const katakanaToEnglish: { [key: string]: string } = {
  // 人名
  'ジョン・レノン': 'John Lennon',
  'ジョンレノン': 'John Lennon',
  'ポール・マッカートニー': 'Paul McCartney',
  'ポールマッカートニー': 'Paul McCartney',
  'アインシュタイン': 'Einstein',
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

// カタカナをチェックして英語に変換する関数
function convertKatakanaToEnglish(topic: string): string {
  // 完全一致をチェック
  if (katakanaToEnglish[topic]) {
    return katakanaToEnglish[topic];
  }
  
  // 部分一致をチェック
  for (const [katakana, english] of Object.entries(katakanaToEnglish)) {
    if (topic.includes(katakana)) {
      return english;
    }
  }
  
  return topic; // 変換できない場合はそのまま返す
}

// トピック別の読み物生成関数
function generateTopicContent(level: number, topic: string) {
  // カタカナを英語に変換
  const englishTopic = convertKatakanaToEnglish(topic);
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
    console.log('📚 Reading generation request (enhanced fallback mode):', requestData);

    const { 
      level = 3, 
      topic = '', 
      theme = '', 
      mode = 'reading',
      genre = '',
      tone = '',
      feeling = '',
      isMailGeneration = false 
    } = requestData;
    
    // レベルを1-5の範囲に正規化
    const normalizedLevel = Math.max(1, Math.min(5, parseInt(level.toString())));
    
    console.log(`📝 Generating enhanced content for level ${normalizedLevel}`, {
      mode, topic, theme, genre, tone, feeling
    });

    // 動的なコンテンツ生成
    let generatedContent;
    if (mode === 'story' && genre && tone && feeling) {
      generatedContent = generateStoryContent(normalizedLevel, genre, tone, feeling);
    } else if (topic && topic.trim()) {
      generatedContent = generateTopicContent(normalizedLevel, topic);
    } else {
      // フォールバック: 固定コンテンツを使用
      generatedContent = fallbackReadings[normalizedLevel as keyof typeof fallbackReadings];
    }
    
    let title = "Generated Reading";
    if (mode === 'story' && genre) {
      title = `${genre.charAt(0).toUpperCase() + genre.slice(1)} Story`;
    } else if (topic) {
      title = `About ${topic}`;
    } else if (theme) {
      title = `Reading: ${theme}`;
    }

    // メール生成の場合は短縮版
    if (isMailGeneration) {
      const shortEnglish = generatedContent.english.split('.').slice(0, 3).join('.') + '.';
      const shortJapanese = generatedContent.japanese.split('。').slice(0, 2).join('。') + '。';
      
      return NextResponse.json({
        english: shortEnglish,
        japanese: shortJapanese,
        title: `Mail: ${title}`,
        level: normalizedLevel,
        wordCount: shortEnglish.split(' ').length,
        isMailGeneration: true
      });
    }

    // 段落分けを適用
    const paragraphedContent = addParagraphBreaks(
      generatedContent.english, 
      generatedContent.japanese, 
      normalizedLevel
    );

    const response = {
      english: paragraphedContent.english,
      japanese: paragraphedContent.japanese,
      title: title,
      level: normalizedLevel,
      wordCount: generatedContent.english.split(' ').length,
      vocabulary: `Level ${normalizedLevel} vocabulary`,
      isMailGeneration: false,
      mode: mode,
      ...(genre && { genre }),
      ...(tone && { tone }),
      ...(feeling && { feeling }),
      ...(topic && { topic })
    };

    console.log('✅ Enhanced content generated:', {
      title: response.title,
      level: response.level,
      wordCount: response.wordCount,
      englishLength: response.english.length,
      mode: response.mode,
      hasCustomContent: !!(topic || genre)
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
// コンテンツ生成関数群
// =============================================================================

// アドベンチャーストーリー生成
function getAdventureStory(level: number, tone: string, feeling: string) {
  const stories = {
    1: {
      english: "Sam loves to explore. Today he finds a big cave. He walks into the cave with his flashlight. Inside, he sees beautiful rocks that shine in the light. Sam feels very excited! He takes photos to show his friends. The cave is safe and not too deep. Sam comes out happy. He wants to explore more caves. This was the best day ever!",
      japanese: "サムは探検が大好きです。今日、彼は大きな洞窟を発見しました。フラッシュライトを持って洞窟の中に入っていきました。中で、光に照らされて輝く美しい岩を見つけました。サムはとても興奮しました！友達に見せるために写真を撮りました。洞窟は安全で、あまり深くありませんでした。サムは幸せな気持ちで出てきました。彼はもっと洞窟を探検したいと思いました。これは今までで最高の日でした！"
    },
    2: {
      english: "Maya had always wanted to climb the old mountain near her village. Last weekend, she finally decided to try it. She packed water, snacks, and her camera. The trail was steep and rocky, but Maya felt determined. After two hours of hiking, she reached a beautiful waterfall. The water was crystal clear and made a peaceful sound. Maya sat on a rock and ate her lunch while watching the water fall. She felt so proud of herself for making it this far. On the way down, she saw a family of deer drinking from the stream. It was a perfect adventure day.",
      japanese: "マヤは村の近くの古い山に登りたいといつも思っていました。先週末、ついに挑戦することにしました。水、おやつ、カメラを持って行きました。道は急で岩だらけでしたが、マヤはやる気でいっぱいでした。2時間のハイキングの後、美しい滝にたどり着きました。水は水晶のように透明で、平和な音を立てていました。マヤは岩に座って、水が落ちるのを眺めながらお弁当を食べました。ここまで来られたことをとても誇らしく思いました。帰り道で、川から水を飲んでいる鹿の家族を見ました。完璧な冒険の日でした。"
    },
    3: {
      english: `Elena had been preparing for this expedition for months. The ancient ruins hidden deep in the Amazon rainforest had fascinated archaeologists for decades, but few had managed to reach them. Armed with her GPS device, camping gear, and research notes, she set off with her experienced guide, Carlos. 

The jungle was both beautiful and challenging. Colorful birds called from the canopy above while insects buzzed constantly around them. After three days of trekking through dense vegetation, they finally discovered the entrance to the lost temple. 

Inside, Elena found intricate stone carvings that told stories of a civilization that had thrived here centuries ago. Her heart raced with excitement as she documented each discovery. This expedition would change our understanding of pre-Columbian history forever.`,
      japanese: "エレナはこの探検のために数ヶ月間準備をしていました。アマゾンの熱帯雨林の奥深くに隠された古代遺跡は、何十年もの間考古学者たちを魅了してきましたが、そこにたどり着けた人はほとんどいませんでした。GPS装置、キャンプ用品、研究ノートを持って、彼女は経験豊富なガイドのカルロスと一緒に出発しました。\n\nジャングルは美しくも挑戦的でもありました。上の樹冠からは色とりどりの鳥たちが鳴き、虫たちが絶えず彼らの周りを飛び回っていました。3日間、退い植物の中をトレッキングした後、ついに失われた寺院の入口を発見しました。\n\n内部で、エレナは何世紀も前にここで繁栄した文明の物語を語る精巧な石の彫刻を発見しました。各発見を記録しながら、彼女の心臓は興奮で高鳴りしました。この探検はコロンブス以前の歴史に対する私たちの理解を永遠に変えるでしょう。"
    },
    4: {
      english: `Dr. Sarah Mitchell had dedicated her career to understanding the complex ecosystems of remote mountain ranges. This particular expedition to the Himalayas represented the culmination of five years of research planning. Her team of international scientists was investigating how climate change was affecting high-altitude plant communities.

The journey to their research site at 4,200 meters above sea level was treacherous. Unpredictable weather patterns and thin air made every step a calculated risk. However, what they discovered exceeded all expectations. They found evidence of plant species adapting to changing conditions in ways that challenged conventional scientific understanding.

The most remarkable finding was a previously unknown flowering plant that had developed unique survival mechanisms. This discovery could revolutionize our approach to conservation biology and provide crucial insights into how life adapts to environmental pressures.`,
      japanese: "サラ・ミッチェル博士は、人里離れた山脈の複雑な生態系の理解にキャリアを捧げていました。ヒマラヤへのこの特別な探検は、5年間の研究計画の集大成でした。彼女の国際的な科学者チームは、気候変動が高山帯の植物群落にどのような影響を与えているかを調査していました。\n\n海抜4,200メートルの研究現場への旅は危険なものでした。予測不可能な気象パターンと薄い空気のため、一歩一歩が計算されたリスクでした。しかし、彼らが発見したことはすべての期待を上回りました。彼らは植物種が従来の科学的理解に挑戦する方法で変化する条件に適応している証拠を発見しました。\n\n最も注目すべき発見は、独特の生存メカニズムを発達させた、以前には知られていなかった開花植物でした。この発見は保全生物学への私たちのアプローチを革命的に変え、生命が環境圧力にどのように適応するかについての重要な洞察を提供する可能性があります。"
    },
    5: {
      english: `The philosophical implications of consciousness had always fascinated Dr. Elena Vasquez, but her latest expedition into the depths of quantum archaeology was pushing the boundaries of human understanding in unprecedented ways. Deep beneath the Antarctic ice sheet, her team had discovered structures that challenged everything we thought we knew about the relationship between mind, matter, and time.

The crystalline formations exhibited properties that seemed to respond to conscious observation, creating what could only be described as a feedback loop between the observer and the observed. These weren't merely geological anomalies; they appeared to be repositories of information encoded in ways that transcended conventional physics.

As Elena documented each phenomenon, she realized that this discovery would fundamentally reshape our understanding of consciousness itself. The structures seemed to suggest that awareness might be a fundamental property of the universe, woven into the very fabric of reality in ways that science was only beginning to comprehend.`,
      japanese: "意識の哲学的含意は常にエレナ・バスケス博士を魅了していましたが、量子考古学の深淵への彼女の最新の探検は、人類の理解の境界を前代未聞の方法で押し広げていました。南極の氷床の深くで、彼女のチームは、心、物質、時間の関係について私たちが知っていると思っていたすべてに挑戦する構造物を発見しました。\n\n結晶的な形成物は意識的な観察に反応するような性質を示し、観察者と被観察者の間のフィードバックループとしか表現できないものを作り出していました。これらは単なる地質学的異常ではありませんでした。彼らは従来の物理学を超越した方法で符号化された情報のリポジトリであるように見えました。\n\nエレナが各現象を記録していると、この発見が意識そのものに対する私たちの理解を根本的に再構築するだろうことを実感しました。構造物は、意識が宇宙の基本的な性質であり、科学が理解し始めたばかりの方法で現実の構造そのものに織り込まれている可能性を示唆しているようでした。"
    }
  };
  
  return stories[level as keyof typeof stories] || stories[3];
}

// ロマンスストーリー生成
function getRomanceStory(level: number, tone: string, feeling: string) {
  const stories = {
    1: {
      english: "Emma loves books. She goes to the library every day. Today she meets a nice boy named David. He also loves books. They sit together and read. David shows Emma his favorite book. Emma shows David her favorite book too. They talk about the stories. Both of them are very happy. They decide to meet again tomorrow. Emma can't wait to see David again!",
      japanese: "エマは本が大好きです。彼女は毎日図書館に行きます。今日、デイビッドという素敵な男の子に出会いました。彼も本が大好きです。二人は一緒に座って本を読みます。デイビッドはエマにお気に入りの本を見せます。エマもデイビッドにお気に入りの本を見せます。二人は物語について話します。二人ともとても幸せです。明日も会うことにしました。エマはデイビッドにまた会えるのが待ちきれません！"
    },
    2: {
      english: "Lily worked at a small coffee shop downtown. Every morning, a kind man named Alex came in for coffee. He always ordered the same thing and smiled at Lily. After two weeks, Alex asked Lily about her favorite books. They discovered they both loved mystery novels. Alex started bringing books for Lily to read. Soon they were having long conversations about stories and characters. One rainy afternoon, Alex asked Lily if she wanted to go to a bookstore together. Lily said yes with a big smile. It was the beginning of something beautiful.",
      japanese: "リリーはダウンタウンの小さなコーヒーショップで働いていました。毎朝、アレックスという優しい男性がコーヒーを買いに来ました。彼はいつも同じものを注文し、リリーに微笑みかけました。2週間後、アレックスはリリーの好きな本について尋ねました。二人ともミステリー小説が大好きだということが分かりました。アレックスはリリーが読むための本を持参するようになりました。すぐに二人は物語や登場人物について長い会話をするようになりました。雨の午後、アレックスはリリーに一緒に本屋に行かないかと尋ねました。リリーは大きな笑顔ではいと答えました。これは美しい何かの始まりでした。"
    },
    3: {
      english: `Sarah had never believed in chance encounters until she literally bumped into Marcus at the art museum. Her sketchbook scattered across the marble floor, and he helped her gather the drawings. When Marcus saw her artwork, his eyes lit up with genuine admiration.

"These are incredible," he said, studying her landscape sketches. "You capture light in such a unique way."

Sarah felt her cheeks flush. As an aspiring artist, she rarely received such sincere praise. They spent the next two hours walking through the galleries, discussing technique and inspiration. Marcus was a photographer, and they discovered they shared a passion for capturing the beauty of everyday moments.

When the museum closed, neither wanted the conversation to end. They found a quiet cafe nearby and continued talking until midnight, sharing dreams and creative struggles over countless cups of coffee.`,
      japanese: "サラは美術館でマーカスと文字通りぶつかるまで、偶然の出会いを信じていませんでした。彼女のスケッチブックが大理石の床に散らばり、彼が絵を集めるのを手伝いました。マーカスが彼女の作品を見たとき、彼の目は心からの称賛で輝きました。\n\n「これらは信じられないですね」と彼は彼女の風景スケッチを研究しながら言いました。「こんなに独特な方法で光を捉えているのですね。」\n\nサラは頰が熱くなるのを感じました。美術家の卵として、彼女はめったにこんなに心からの称賛を受けることはありませんでした。二人はその後2時間、ギャラリーを歩き回り、技法やインスピレーションについて話し合いました。マーカスは写真家で、二人は日常の瞬間の美しさを捉えることへの情熱を共有していることを発見しました。\n\n美術館が閉館したとき、どちらも会話を終わらせたくありませんでした。二人は近くの静かなカフェを見つけ、何杯ものコーヒーを飲みながら夢や創作の苦悩を分かち合い、真夜中まで話し続けました。"
    },
    4: {
      english: "Isabella Chen had built her reputation as one of the city's most innovative architects, but she had never expected her latest project to change her life so completely. The historic preservation committee had assigned her to restore the old Observatory Building, and that's where she met Dr. Gabriel Santos, the astrophysicist who would be using the facility. Their professional collaboration began with heated debates about structural modifications versus historical integrity. Gabriel's passion for the stars was infectious, and Isabella found herself staying late into the evening, listening to him explain constellations while she sketched renovation plans under the starlight. What started as professional disagreement slowly transformed into mutual respect, then admiration, and finally something deeper that neither had expected to find.",
      japanese: "イザベラ・チェンは市で最も革新的な建築家の一人として評判を築いていましたが、最新のプロジェクトが彼女の人生をこれほど完全に変えるとは予想していませんでした。歴史保存委員会は彼女に古い天文台ビルの修復を担当させ、そこで施設を使用する天体物理学者のガブリエル・サントス博士と出会いました。彼らの職業的協力は、構造改造と歴史的完全性に関する激しい議論から始まりました。ガブリエルの星への情熱は感染力があり、イザベラは夜遅くまで残って、星明かりの下で改修計画をスケッチしながら彼が星座を説明するのを聞いている自分に気づきました。職業的な意見の相違として始まったことが、ゆっくりと相互尊重、そして賞賛、そして最終的にどちらも見つけることを期待していなかった、より深い何かに変わっていきました。"
    },
    5: {
      english: "The convergence of Dr. Amelia Blackwood's research in quantum mechanics and Professor Marcus Delacroix's work in consciousness studies had been purely academic until their sabbatical year brought them together at the Institute for Advanced Thought in Princeton. Their intellectual discourse on the nature of reality and perception had evolved from conference room debates to late-night conversations in the campus gardens, where the boundaries between scientific collaboration and personal connection began to blur. Amelia's theories about parallel dimensions found unexpected resonance with Marcus's explorations of subjective experience, creating a synthesis of ideas that challenged both of their foundational beliefs. As their research intertwined, so did their lives, proving that sometimes the most profound discoveries happen not just in laboratories, but in the spaces between minds that dare to question everything.",
      japanese: "アメリア・ブラックウッド博士の量子力学研究とマーカス・デラクロワ教授の意識研究の収束は、プリンストンの高等思想研究所でのサバティカル年が二人を引き合わせるまで、純粋に学術的なものでした。現実と知覚の本質についての彼らの知的対話は、会議室での議論からキャンパスの庭園での深夜の会話へと発展し、そこで科学的協力と個人的つながりの境界が曖昧になり始めました。並行次元についてのアメリアの理論は、マーカスの主観的経験の探究と予期しない共鳴を見つけ、二人の基本的信念に挑戦するアイデアの統合を生み出しました。彼らの研究が絡み合うにつれて、彼らの人生も絡み合い、時として最も深い発見は実験室だけでなく、すべてに疑問を持つ勇気のある心の間のスペースで起こることを証明しました。"
    }
  };
  
  return stories[level as keyof typeof stories] || stories[2];
}

// ミステリーストーリー生成
function getMysteryStory(level: number, tone: string, feeling: string) {
  const stories = {
    1: {
      english: "Anna hears a strange noise at night. She gets up from her bed. The noise comes from the kitchen. Anna walks to the kitchen quietly. She sees a small cat by the window. The cat looks hungry. Anna gives the cat some milk. The cat is very happy. Anna opens the window for the cat. Now Anna knows what made the noise. She feels happy to help the little cat.",
      japanese: "アンナは夜に奇妙な音を聞きます。彼女はベッドから起き上がります。音はキッチンから聞こえます。アンナは静かにキッチンに歩いていきます。窓のそばに小さな猫がいるのを見ます。猫はお腹が空いているようです。アンナは猫にミルクをあげます。猫はとても幸せです。アンナは猫のために窓を開けます。今、アンナは何が音を立てたのか分かりました。小さな猫を助けることができて幸せです。"
    },
    2: {
      english: "Detective Mia noticed something strange about the old bookstore. Every Tuesday, a mysterious woman visited at exactly 3 PM. She always bought the same book and left without saying a word. Mia decided to follow her one day. The woman walked to the park and sat on a bench. She opened the book and took out a small piece of paper. Then she left the paper under the bench and walked away. Mia found the paper. It had a phone number written on it. When Mia called the number, she discovered it was a message for someone who had been missing for years.",
      japanese: "探偵のミアは古い本屋について奇妙なことに気づきました。毎週火曜日、謎めいた女性がちょうど午後3時に訪れました。彼女はいつも同じ本を買い、何も言わずに去っていきました。ミアはある日彼女を後をつけることにしました。女性は公園に歩いていき、ベンチに座りました。彼女は本を開けて小さな紙を取り出しました。そしてベンチの下に紙を置いて去っていきました。ミアはその紙を見つけました。電話番号が書いてありました。ミアがその番号に電話したとき、それが何年も行方不明だった人へのメッセージだったことを発見しました。"
    },
    3: {
      english: `Detective Rachel Park had been investigating the series of art thefts for three months, but the case seemed to get stranger with each new clue. The thief only targeted paintings from the 1920s, and always left behind a single white rose. 

Tonight, Rachel was stationed outside the Metropolitan Museum, certain that the thief would strike again. At exactly midnight, she saw a figure in dark clothing slip through a side entrance. Following quietly, she watched as the mysterious person approached a specific painting \u2013 "Midnight Garden" by Elena Vasquez.

But instead of stealing it, the figure placed a small envelope behind the frame and disappeared into the shadows. Rachel retrieved the envelope and found an old photograph inside, showing the same painting in what appeared to be someone's living room. On the back was written: "Return what was never yours to take. - E.V." 

Suddenly, Rachel realized this wasn't about theft at all. It was about justice.`,
      japanese: "レイチェル・パーク探偵は3ヶ月間一連の美術品盗難事件を捕査していましたが、新しい手がかりが見つかるたびに事件はより奇妙になっていくようでした。犯人は1920年代の絵画だけを狙い、いつも白いバラを一本残していきました。\n\n今夜、レイチェルはメトロポリタン美術館の外で待機していました。犯人が再び犯行に及ぶことを確信していたのです。ちょうど真夜中に、黒い服を着た人影が横の入口から滑り込むのを見ました。静かに後をつけ、その謎めいた人物が特定の絵画—エレナ・バスケスの「真夜中の庭」に近づくのを見守りました。\n\nしかし盗む代わりに、その人物は額縁の後ろに小さな封筒を置いて影の中に姿を消しました。レイチェルは封筒を回収し、中から古い写真を見つけました。それは誰かのリビングルームらしき場所にある同じ絵画を写したものでした。裏には「あなたが奥うべきではなかったものを返しなさい。- E.V.」と書いてありました。\n\n突然、レイチェルはこれが盗難の話では全くないことを実感しました。これは正義に関する話でした。"
    }
  };
  
  return stories[level as keyof typeof stories] || stories[2];
}

// 汎用ストーリー生成
function getGenericStory(level: number, genre: string, tone: string, feeling: string) {
  const stories = {
    1: {
      english: "Tom finds a small box in his garden. The box is very old. He opens it carefully. Inside, there are colorful stones. Tom feels excited about his discovery. He shows the stones to his mother. She says they are very beautiful. Tom decides to collect more stones. He looks in different places. Soon he has many pretty stones. Tom makes a special place for his collection.",
      japanese: "トムは庭で小さな箱を見つけます。箱はとても古いです。彼は慎重に箱を開けます。中には色とりどりの石があります。トムは発見にワクワクします。お母さんに石を見せます。お母さんはとても美しいと言います。トムはもっと石を集めることにします。いろいろな場所を探します。すぐにたくさんのきれいな石を手に入れます。トムはコレクションのための特別な場所を作ります。"
    },
    2: {
      english: "Maria discovered an old diary in her grandmother's attic. The pages were yellow with age, but the handwriting was still clear. As she read, Maria learned about her grandmother's adventures as a young woman. The diary told stories of traveling to distant cities and meeting interesting people. Maria felt amazed by how brave her grandmother had been. She spent the whole afternoon reading, feeling more connected to her family history than ever before.",
      japanese: "マリアはおばあちゃんの屋根裏部屋で古い日記を発見しました。ページは古くて黄色くなっていましたが、手書きの文字はまだはっきりと読めました。読み進めるうちに、マリアは若い頃のおばあちゃんの冒険について知りました。日記には遠い街への旅行や興味深い人々との出会いの物語が書かれていました。マリアはおばあちゃんがいかに勇敢だったかに驚きました。午後いっぱいを読書に費やし、家族の歴史をこれまで以上に身近に感じました。"
    },
    3: {
      english: "The mysterious letter arrived on a rainy Tuesday morning. Elena had never seen the elegant handwriting before, yet something about it felt strangely familiar. The envelope contained an invitation to visit a place she had only heard about in childhood stories—her great-aunt's cottage by the sea. According to the letter, Elena had inherited not just the property, but also a secret that had been kept in her family for generations. Curious and intrigued, she packed her bags that same evening, ready to uncover the truth about her family's hidden past.",
      japanese: "謎めいた手紙は雨の火曜日の朝に届きました。エレナはその優雅な手書きの文字を見たことがありませんでしたが、なぜか奇妙に親しみを感じました。封筒には、子供の頃の物語でしか聞いたことのない場所—海辺にある大叔母のコテージ—を訪れる招待状が入っていました。手紙によると、エレナは不動産だけでなく、何世代にもわたって家族に守られてきた秘密も相続したとのことでした。好奇心と興味を抱いて、彼女はその晩に荷物をまとめ、家族の隠された過去の真実を明らかにする準備を整えました。"
    },
    4: {
      english: "Dr. James Harrison had always been fascinated by the intersection of history and science, but his latest archaeological discovery in the Scottish Highlands was challenging everything he thought he knew about ancient civilizations. The stone artifacts displayed technological sophistication that shouldn't have existed two thousand years ago. Carbon dating confirmed their age, yet the precision of their construction suggested advanced knowledge of mathematics and engineering. As James documented each find, he realized this discovery could revolutionize our understanding of human development and force historians to reconsider the timeline of technological advancement.",
      japanese: "ジェームズ・ハリソン博士は常に歴史と科学の交差点に魅力を感じていましたが、スコットランド高地での彼の最新の考古学的発見は、古代文明について彼が知っていると思っていたすべてに挑戦していました。石の工芸品は2000年前には存在すべきではなかった技術的な洗練さを示していました。炭素年代測定でその年代が確認されましたが、その構造の精密さは数学と工学の高度な知識を示唆していました。ジェームズが各発見を記録していく中で、この発見が人類の発達に対する私たちの理解を革命的に変え、歴史家に技術進歩の年表を再考させる可能性があることを実感しました。"
    },
    5: {
      english: "The philosophical implications of Dr. Sophia Chen's quantum consciousness research were beginning to transcend the boundaries of conventional science. Her laboratory in Geneva had become the epicenter of a revolution in understanding the fundamental nature of awareness itself. The experimental data suggested that consciousness might not be an emergent property of complex neural networks, but rather a fundamental aspect of the universe, as basic as matter and energy. This paradigm-shifting discovery was forcing the scientific community to grapple with questions that had previously belonged to the realm of metaphysics and philosophy.",
      japanese: "ソフィア・チェン博士の量子意識研究の哲学的含意は、従来の科学の境界を超越し始めていました。ジュネーブにある彼女の研究室は、意識そのものの基本的性質の理解における革命の震源地となっていました。実験データは、意識が複雑な神経ネットワークの創発的性質ではなく、物質やエネルギーと同じくらい基本的な宇宙の根本的側面である可能性を示唆していました。このパラダイムを変える発見は、科学界に以前は形而上学と哲学の領域に属していた問題と格闘することを強いていました。"
    }
  };
  
  return stories[level as keyof typeof stories] || stories[3];
}

// =============================================================================
// トピック別コンテンツ生成関数群
// =============================================================================

// コーヒーに関するコンテンツ
function getCoffeeContent(level: number) {
  const content = {
    1: {
      english: "Coffee is a popular drink. People drink coffee in the morning. Coffee beans grow on trees. The trees grow in warm places. Workers pick the beans. Then they dry the beans in the sun. After that, they roast the beans. The roasted beans smell very good. People grind the beans to make coffee powder. Then they add hot water. Now the coffee is ready to drink. Many people love coffee!",
      japanese: "コーヒーは人気の飲み物です。人々は朝にコーヒーを飲みます。コーヒー豆は木に成ります。木は暖かい場所で育ちます。作業員が豆を摘みます。それから太陽の下で豆を乾燥させます。その後、豆を焼きます。焼いた豆はとても良い匁いがします。人々は豆を挽いてコーヒー粉を作ります。それから熱いお湯を加えます。これでコーヒーを飲む準備ができました。多くの人がコーヒーを愛しています！"
    },
    2: {
      english: "Coffee has a fascinating history that spans centuries. Originally discovered in Ethiopia, coffee beans were first used by local tribes who noticed that their goats became energetic after eating certain berries. The practice of brewing coffee spread to Yemen and then throughout the Arab world. European traders brought coffee to their continent in the 16th century. Today, coffee is grown in over 50 countries around the world. Brazil produces the most coffee, followed by Vietnam and Colombia. The process of making coffee involves harvesting, processing, roasting, and brewing. Each step affects the final taste of your morning cup.",
      japanese: "コーヒーは何世紀にもわたる魅力的な歴史を持っています。元々エチオピアで発見されたコーヒー豆は、地元の部族がヤギが特定のベリーを食べた後に元気になることに気づいたことから初めて使用されました。コーヒーを淀れる習慣はイエメンに広がり、その後アラブ世界全体に広がりました。ヨーロッパの貿易商が16世紀にコーヒーを大陸に持ち込みました。今日、コーヒーは世界50ヶ国以上で栽培されています。ブラジルが最も多くのコーヒーを生産し、ベトナム、コロンビアが続きます。コーヒーを作る過程には収穫、加工、焙煎、淀れみが含まれます。各ステップがあなたの朝の一杯の最終的な味に影響します。"
    },
    3: {
      english: "The art and science of coffee production represents one of humanity's most sophisticated agricultural achievements. From the misty highlands of Ethiopia where coffee was first discovered, to the sprawling plantations of Latin America, coffee cultivation has evolved into a complex interplay of botany, chemistry, and cultural tradition. The coffee plant, Coffea arabica, thrives in specific microclimates between the Tropics of Cancer and Capricorn, requiring precise combinations of altitude, temperature, and rainfall. Master roasters spend years perfecting their craft, understanding how heat transforms the green beans into the aromatic brown gems that define our morning rituals. Each cup tells a story of terroir, processing methods, and the skilled hands that guided its journey from farm to cup.",
      japanese: "コーヒー生産の芸術と科学は、人類の最も精巧な農業成果の一つを表しています。コーヒーが初めて発見されたエチオピアの霧のかかった高地からラテンアメリカの広大なプランテーションまで、コーヒー栽培は植物学、化学、文化的伝統の複雑な相互作用に発展してきました。コーヒーの木、コフィア・アラビカは、北回帰線と南回帰線の間の特定のミクロ気候で繁栄し、標高、温度、降水量の精密な組み合わせを必要とします。マスターロースターは、熱が生豆を私たちの朝の儿式を定義する芳香あふれる茶色の宝石に変える方法を理解し、工芸を完成させるために何年も費やします。各杯はテロワール、加工方法、そして農場からカップまでの旅を導いた熟練した手の物語を語っています。"
    }
  };
  
  return content[level as keyof typeof content] || content[2];
}

// トピックの種類を判定する関数
function getTopicType(topic: string): 'person' | 'place' | 'concept' | 'object' | 'general' {
  const topicLower = topic.toLowerCase();
  
  // 人物名のパターン
  const personPatterns = [
    'john lennon', 'einstein', 'mozart', 'beethoven', 'shakespeare', 'steve jobs', 'bill gates',
    'napoleon', 'leonardo da vinci', 'picasso', 'paul mccartney'
  ];
  
  // 場所のパターン  
  const placePatterns = [
    'japan', 'america', 'britain', 'france', 'germany', 'italy', 'spain', 'russia',
    'new york', 'london', 'paris', 'rome', 'berlin', 'tokyo', 'city', 'country'
  ];
  
  // オブジェクト/技術のパターン
  const objectPatterns = [
    'ipad', 'iphone', 'computer', 'internet', 'chocolate', 'coffee', 'car', 'phone', 'technology'
  ];
  
  // 概念のパターン
  const conceptPatterns = [
    'music', 'art', 'science', 'mathematics', 'philosophy', 'love', 'friendship', 'happiness'
  ];
  
  if (personPatterns.some(pattern => topicLower.includes(pattern))) {
    return 'person';
  } else if (placePatterns.some(pattern => topicLower.includes(pattern))) {
    return 'place';
  } else if (objectPatterns.some(pattern => topicLower.includes(pattern))) {
    return 'object';
  } else if (conceptPatterns.some(pattern => topicLower.includes(pattern))) {
    return 'concept';
  }
  
  return 'general';
}

// テーマ別の自然な書き出しを生成する関数
function getNaturalOpening(topic: string, topicType: 'person' | 'place' | 'concept' | 'object' | 'general', level: number): { english: string, japanese: string } {
  const openings = {
    person: {
      1: {
        english: `${topic} was a very special person who did amazing things.`,
        japanese: `${topic}は素晴らしいことをした特別な人でした。`
      },
      2: {
        english: `${topic} lived an extraordinary life that continues to inspire people around the world.`,
        japanese: `${topic}は世界中の人々にインスピレーションを与え続ける並外れた人生を送りました。`
      },
      3: {
        english: `${topic} remains one of history's most fascinating figures, whose life reveals surprising details that few people know.`,
        japanese: `${topic}は歴史上最も魅力的な人物の一人であり、その人生にはほとんど知られていない驚くべき詳細があります。`
      }
    },
    place: {
      1: {
        english: `${topic} is a wonderful place that many people love to visit.`,
        japanese: `${topic}は多くの人が訪れたがる素晴らしい場所です。`
      },
      2: {
        english: `${topic} has a rich history and culture that fascinates visitors from around the globe.`,
        japanese: `${topic}は世界中からの訪問者を魅了する豊かな歴史と文化を持っています。`
      },
      3: {
        english: `${topic} holds secrets and stories that reveal the incredible diversity of our world.`,
        japanese: `${topic}は私たちの世界の信じられない多様性を明らかにする秘密と物語を持っています。`
      }
    },
    object: {
      1: {
        english: `${topic} is something that has changed how people live and work.`,
        japanese: `${topic}は人々の生活や仕事の仕方を変えたものです。`
      },
      2: {
        english: `${topic} represents one of humanity's most innovative creations, transforming daily life in unexpected ways.`,
        japanese: `${topic}は人類の最も革新的な創造物の一つで、日常生活を予想外の方法で変革しています。`
      },
      3: {
        english: `${topic} embodies the remarkable intersection of technology and human creativity, revealing insights into modern innovation.`,
        japanese: `${topic}は技術と人間の創造性の注目すべき交差点を体現し、現代の革新への洞察を明らかにします。`
      }
    },
    concept: {
      1: {
        english: `${topic} is an important idea that affects everyone's life.`,
        japanese: `${topic}は誰もの人生に影響を与える重要な考えです。`
      },
      2: {
        english: `${topic} represents one of humanity's most profound concepts, shaping how we understand ourselves and our world.`,
        japanese: `${topic}は人類の最も深遠な概念の一つで、私たち自身と世界の理解を形作っています。`
      },
      3: {
        english: `${topic} encompasses ideas that have evolved throughout human history, revealing fundamental truths about existence.`,
        japanese: `${topic}は人類の歴史を通じて進化してきた考えを包含し、存在についての基本的真実を明らかにします。`
      }
    },
    general: {
      1: {
        english: `${topic} is something that many people find interesting and important.`,
        japanese: `${topic}は多くの人が興味深く重要だと感じるものです。`
      },
      2: {
        english: `${topic} offers fascinating insights that reveal the complexity and beauty of our world.`,
        japanese: `${topic}は私たちの世界の複雑さと美しさを明らかにする魅力的な洞察を提供します。`
      },
      3: {
        english: `${topic} encompasses aspects of knowledge that continue to surprise and educate curious minds.`,
        japanese: `${topic}は好奇心旺盛な心を驚かせ、教育し続ける知識の側面を包含しています。`
      }
    }
  };
  
  const levelKey = Math.min(level, 3);
  return openings[topicType][levelKey as keyof typeof openings[typeof topicType]];
}

// 汎用トピックコンテンツ（驚くべき事実を含む）
function getGenericTopicContent(level: number, topic: string) {
  // トピック別の驚くべき事実データベース
  const surprisingFacts: { [key: string]: { [key: number]: string[] } } = {
    'John Lennon': {
      1: [
        'John Lennon could not read music, but he wrote many famous songs',
        'He was afraid of the dark and always slept with a light on'
      ],
      2: [
        'John Lennon was nearly thrown out of school for poor grades, but later became one of the most successful musicians in history',
        'He once worked as a dishwasher in a restaurant before becoming famous with The Beatles'
      ],
      3: [
        'Despite being worth millions, John Lennon was known for his extreme frugality and would sometimes refuse to buy new clothes',
        'He was rejected by his own record label Decca Records in 1962, who said guitar groups were out of fashion'
      ]
    },
    'Einstein': {
      1: [
        'Einstein did not talk until he was four years old',
        'He failed his entrance exam to college the first time'
      ],
      2: [
        'Einstein received the Nobel Prize not for his famous theory of relativity, but for discovering the photoelectric effect',
        'He could have been the second president of Israel, but turned down the offer'
      ],
      3: [
        'Einstein\'s brain was stolen after his death and kept by a scientist for over 20 years without permission',
        'He predicted the existence of black holes 40 years before they were actually discovered'
      ]
    },
    'chocolate': {
      1: [
        'Chocolate was used as money by the Aztec people',
        'White chocolate is not really chocolate because it has no cocoa'
      ],
      2: [
        'The inventor of the chocolate chip cookie sold her recipe to Nestle in exchange for a lifetime supply of chocolate',
        'It takes about 400 cocoa beans to make just one pound of chocolate'
      ],
      3: [
        'Chocolate was once prescribed by doctors as medicine and was sold in pharmacies',
        'The melting point of chocolate is just below human body temperature, which is why it melts perfectly in your mouth'
      ]
    },
    'iPad': {
      1: [
        'The iPad was made in just one year by Steve Jobs and his team',
        'iPads do not get viruses like computers do'
      ],
      2: [
        'The first iPad was announced on January 27, 2010, and changed how people use computers forever',
        'Apple sold 300,000 iPads on the very first day it was available in stores'
      ],
      3: [
        'The iPad was originally going to be called the "iSlate" but Apple changed the name at the last minute',
        'Despite being incredibly thin, the iPad contains over 1,000 individual components and parts'
      ]
    },
    'iPhone': {
      1: [
        'The iPhone was the first phone that you could touch with your finger',
        'iPhones have special glass that is very hard to break'
      ],
      2: [
        'Steve Jobs kept the iPhone project so secret that Apple employees had to cover it with a cloth when moving it around',
        'The iPhone was originally designed to have a physical keyboard, but Apple removed it to make the screen bigger'
      ],
      3: [
        'The iPhone development was so secretive that Apple built fake walls in their offices to hide the project from their own employees',
        'Apple spent over 3 years and $150 million developing the iPhone before it was announced'
      ]
    },
    'Apple': {
      1: [
        'Apple was started in a garage by two friends named Steve',
        'The Apple logo used to be rainbow colored'
      ],
      2: [
        'Apple was named after Steve Jobs ate only apples for weeks and thought the name sounded friendly',
        'Apple is worth more money than many entire countries in the world'
      ],
      3: [
        'Apple almost went bankrupt in 1997 and was just 90 days away from closing down forever',
        'Apple has more cash money saved than the entire US government treasury'
      ]
    },
    'Google': {
      1: [
        'Google started in a garage just like Apple did',
        'Google gets over 8 billion searches every single day'
      ],
      2: [
        'Google was originally called "BackRub" before they changed it to Google',
        'Google owns YouTube, which has over 2 billion users watching videos every month'
      ],
      3: [
        'Google processes over 40,000 searches every second, which is more than 3.5 billion searches per day',
        'Google\'s first computer storage was made from Lego blocks to hold the hard drives'
      ]
    },
    'computer': {
      1: [
        'The first computer was as big as a whole room',
        'Computer mice were invented before computers had screens'
      ],
      2: [
        'The first computer bug was actually a real insect that got stuck inside a computer in 1947',
        'Early computers used vacuum tubes and generated so much heat they needed special cooling rooms'
      ],
      3: [
        'The password "password" is still the most commonly used password in the world, despite being extremely unsafe',
        'Your smartphone has more computing power than all of NASA had when they sent humans to the moon'
      ]
    },
    'internet': {
      1: [
        'The internet was first created by the military to send messages',
        'The first website is still working today after 30 years'
      ],
      2: [
        'The first email was sent in 1971, and it was just a test message saying "QWERTYUIOP"',
        'Over 4.6 billion people use the internet today, which is more than half of everyone on Earth'
      ],
      3: [
        'The internet weighs approximately 50 grams, which is about the same as a strawberry',
        'If the internet went down for just one day, it would cost the global economy over $50 billion'
      ]
    },
    'Steve Jobs': {
      1: [
        'Steve Jobs was adopted when he was a baby by Paul and Clara Jobs',
        'He started Apple Computer in his parents\' garage with his friend Steve Wozniak'
      ],
      2: [
        'Steve Jobs was fired from Apple, the company he started, but came back 12 years later to save it',
        'He was known for wearing the same black turtleneck, blue jeans, and sneakers every day'
      ],
      3: [
        'Steve Jobs never wrote a single line of computer code, but led teams that created revolutionary technology',
        'He was a college dropout who audited classes for free, including a calligraphy course that influenced Apple\'s focus on beautiful typography'
      ]
    }
  };

  // ファクトチェック関数
  function isFactuallyVerifiable(topic: string, topicType: string): boolean {
    const topicLower = topic.toLowerCase();
    
    // 登録済みの確認済み事実がある人物・トピック
    const verifiedTopics = Object.keys(surprisingFacts).map(key => key.toLowerCase());
    
    // 直接一致または部分一致で確認済みトピックかチェック
    const isVerified = verifiedTopics.some(verified => 
      topicLower.includes(verified) || verified.includes(topicLower)
    );
    
    return isVerified;
  }

  // 安全なフォールバック事実（人物用）
  const safePersonFacts = {
    1: [
      `${topic} was a real person who lived and worked`,
      `Many people around the world know about ${topic}`
    ],
    2: [
      `${topic} made important contributions that people still remember today`,
      `Learning about ${topic} can help us understand history and human achievement`
    ],
    3: [
      `${topic} represents an example of human creativity and determination`,
      `The life and work of ${topic} continue to influence people in many different fields`
    ]
  };

  // 安全なフォールバック事実（一般用）
  const safeGeneralFacts = {
    1: [
      `${topic} is something that many people find interesting to learn about`,
      `There are many books and articles written about ${topic}`
    ],
    2: [
      `Understanding ${topic} can help broaden our knowledge and perspective`,
      `${topic} connects to many different areas of study and interest`
    ],
    3: [
      `${topic} represents an important area of human knowledge and experience`,
      `The study of ${topic} reveals the complexity and richness of our world`
    ]
  };

  // より柔軟なトピック検索と事実選択（ファクトチェック付き）
  let facts;
  const topicLower = topic.toLowerCase();
  
  // トピックタイプを取得
  const topicType = getTopicType(topic);
  
  // 直接一致をチェック
  if (surprisingFacts[topic]?.[level]) {
    facts = surprisingFacts[topic][level];
  }
  // 部分一致をチェック（大文字小文字を無視）
  else {
    const matchedKey = Object.keys(surprisingFacts).find(key => 
      topicLower.includes(key.toLowerCase()) || key.toLowerCase().includes(topicLower)
    );
    if (matchedKey && surprisingFacts[matchedKey]?.[level]) {
      facts = surprisingFacts[matchedKey][level];
    }
    // レベルが見つからない場合、そのトピックの他のレベルを使用
    else if (matchedKey) {
      const availableLevels = Object.keys(surprisingFacts[matchedKey]).map(Number).sort();
      const closestLevel = availableLevels.reduce((prev, curr) => 
        Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev
      );
      facts = surprisingFacts[matchedKey][closestLevel];
    }
    // 何も見つからない場合はファクトチェックして安全なフォールバック使用
    else {
      // ファクトチェック: 検証可能なトピックか確認
      const isVerifiable = isFactuallyVerifiable(topic, topicType);
      
      if (!isVerifiable) {
        // 検証できない場合は安全なフォールバック事実を使用
        if (topicType === 'person') {
          facts = safePersonFacts[level] || safePersonFacts[2];
          console.log(`⚠️ Using safe fallback facts for unverified person: ${topic}`);
        } else {
          facts = safeGeneralFacts[level] || safeGeneralFacts[2];
          console.log(`⚠️ Using safe fallback facts for unverified topic: ${topic}`);
        }
      } else {
        // 検証済みだが具体的事実がない場合は汎用的だが安全な表現
        facts = safeGeneralFacts[level] || safeGeneralFacts[2];
      }
    }
  }
  
  // 自然な書き出しを取得
  const naturalOpening = getNaturalOpening(topic, topicType, level);
  
  const templates = {
    1: {
      english: `${naturalOpening.english} Here are two amazing facts: ${facts[0]}. Also, ${facts[1]}.\n\nMany people like to learn about ${topic}. You can read books about ${topic}. You can also watch videos.\n\nThe more you learn, the more surprising ${topic} becomes!`,
      japanese: `${naturalOpening.japanese} ここに2つの驚くべき事実があります：${facts[0]}。また、${facts[1]}。\n\n多くの人が${topic}について学ぶことを好みます。${topic}についての本を読むことができます。ビデオを見ることもできます。\n\n学べば学ぶほど、${topic}はより驚くべきものになります！`
    },
    2: {
      english: `${naturalOpening.english} For example, ${facts[0]}. Even more surprising is that ${facts[1]}.\n\nThese discoveries show how much there is still to learn about ${topic}. Researchers continue to uncover new information that changes our perspective.\n\nWhether you're just beginning your journey or deepening your existing knowledge, ${topic} will continue to amaze you.`,
      japanese: `${naturalOpening.japanese} 例えば、${facts[0]}。さらに驚くべきことは、${facts[1]}。\n\nこれらの発見は、${topic}についてまだ学ぶべきことがどれほど多いかを示しています。研究者たちは私たちの視点を変える新しい情報を発見し続けています。\n\n旅を始めたばかりでも、既存の知識を深めているでも、${topic}は驚かせ続けるでしょう。`
    },
    3: {
      english: `${naturalOpening.english} Consider this remarkable fact: ${facts[0]}.\n\nPerhaps even more astonishing is the revelation that ${facts[1]}. These findings demonstrate how ${topic} continues to surprise even seasoned researchers and scholars.\n\nModern investigations have uncovered connections and patterns that previous generations could never have imagined, fundamentally reshaping our understanding and opening new avenues for exploration.`,
      japanese: `${naturalOpening.japanese} この注目すべき事実を考えてみてください：${facts[0]}。\n\nおそらくさらに驚くべきことは、${facts[1]}という啓示です。これらの発見は、${topic}がベテランの研究者や学者でさえも驚かせ続けていることを示しています。\n\n現代の調査は、前の世代が想像できなかったつながりやパターンを発見し、私たちの理解を根本的に再構築し、探究の新しい道を開いています。`
    },
    4: {
      english: `${naturalOpening.english} Contemporary research has yielded discoveries that fundamentally challenge established paradigms. One particularly striking revelation is that ${facts[0]}.\n\nEqually remarkable is the finding that ${facts[1]}. These breakthroughs illustrate how ${topic} continues to evolve our understanding of complex systems and interconnected phenomena.\n\nThe implications extend far beyond academic circles, influencing practical applications and societal perspectives in ways that researchers are only beginning to comprehend.`,
      japanese: `${naturalOpening.japanese} 現代研究は、確立されたパラダイムに根本的に挑戦する発見をもたらしました。特に印象的な啓示の一つは、${facts[0]}ということです。\n\n同様に注目すべき発見は、${facts[1]}ということです。これらのブレークスルーは、${topic}が複雑なシステムと相互接続された現象に対する私たちの理解をどのように進化させ続けているかを示しています。\n\nその含意は学術界をはるかに超えて広がり、研究者たちが理解し始めたばかりの方法で実用的応用と社会的視点に影響を与えています。`
    },
    5: {
      english: `${naturalOpening.english} The epistemological implications of recent discoveries transcend traditional disciplinary boundaries and fundamentally reconceptualize our understanding. A paradigm-shifting revelation demonstrates that ${facts[0]}.\n\nThis is compounded by the equally profound discovery that ${facts[1]}. These findings necessitate a complete reexamination of theoretical frameworks and methodological approaches.\n\nSuggesting that our previous conceptions may have been merely approximations of far more complex underlying truths.`,
      japanese: `${naturalOpening.japanese} 最近の発見の認識論的含意は、従来の学問分野の境界を超越し、私たちの理解を根本的に再概念化します。パラダイムを変える啓示は、${facts[0]}ことを示しています。\n\nこれは、${facts[1]}という同様に深遠な発見によって更に複雑になります。これらの発見は、理論的枠組みと方法論的アプローチの完全な再検討を必要とします。\n\n私たちの以前の概念が、はるかに複雑な根本的真実の単なる近似であった可能性を示唆しています。`
    }
  };
  
  return templates[level as keyof typeof templates] || templates[2];
}

// 火山に関するコンテンツ
function getVolcanoContent(level: number) {
  const content = {
    1: {
      english: "Volcanoes are very hot mountains. They have fire inside them. Sometimes the fire comes out. This is called an eruption. Lava is hot, melted rock. It flows down the mountain like a river. Volcanoes can be dangerous. But they also make new land. Many animals and plants live near volcanoes. The soil is very good for growing food. People study volcanoes to stay safe.",
      japanese: "火山はとても熱い山です。中に火があります。時々火が出てきます。これを噴火と呼びます。溶岩は熱く溶けた岩です。川のように山を流れ落ちます。火山は危険な場合があります。しかし新しい土地も作ります。多くの動物や植物が火山の近くに住んでいます。土壌は食べ物を育てるのにとても良いです。人々は安全のために火山を研究しています。"
    },
    2: {
      english: "Volcanoes are fascinating geological formations that have shaped our planet for millions of years. They form when melted rock, called magma, rises from deep inside the Earth. When magma reaches the surface, it becomes lava and can create spectacular eruptions. The Ring of Fire around the Pacific Ocean contains about 75% of the world's active volcanoes. Mount Fuji in Japan and Mount Vesuvius in Italy are famous examples. Volcanoes can be destructive, but they also create fertile soil for farming and beautiful landscapes that attract tourists from around the world.",
      japanese: "火山は何百万年もの間私たちの惑星を形作ってきた魅力的な地質構造です。マグマと呼ばれる溶けた岩が地球の深部から上昇するときに形成されます。マグマが地表に達すると溶岩になり、壮観な噴火を起こすことがあります。太平洋を囲む環太平洋火山帯には世界の活火山の約75%が含まれています。日本の富士山やイタリアのベスビオ山は有名な例です。火山は破壊的な場合もありますが、農業に適した肥沃な土壌や世界中から観光客を引きつける美しい景観も作り出します。"
    },
    3: {
      english: "The study of volcanology reveals the complex processes that drive these powerful geological phenomena. Volcanoes result from the movement of tectonic plates and the circulation of magma in the Earth's mantle. Different types of volcanoes produce different kinds of eruptions, from gentle Hawaiian-style lava flows to explosive Plinian eruptions that can affect global climate. Scientists use sophisticated monitoring equipment to track seismic activity, gas emissions, and ground deformation to predict volcanic activity. Understanding volcanoes is crucial for protecting the millions of people who live in volcanic regions and for comprehending the role these features play in Earth's geological evolution.",
      japanese: "火山学の研究は、これらの強力な地質現象を駆動する複雑なプロセスを明らかにします。火山はプレートテクトニクスの動きと地球のマントル内のマグマの循環の結果として生じます。異なるタイプの火山は異なる種類の噴火を引き起こし、穏やかなハワイ式の溶岩流から地球規模の気候に影響を与える可能性のある爆発的なプリニー式噴火まで様々です。科学者は洗練された監視装置を使用して地震活動、ガス放出、地面の変形を追跡し、火山活動を予測します。火山を理解することは、火山地域に住む数百万人の人々を保護し、これらの地形が地球の地質進化において果たす役割を理解するために重要です。"
    },
    4: {
      english: "Volcanic systems represent some of the most dynamic and influential processes in Earth's geological framework, serving as conduits between the planet's interior and surface environments. The petrogenesis of magma involves complex chemical and thermal processes in the asthenosphere, where partial melting of mantle rock creates diverse magmatic compositions. Modern volcanological research employs interdisciplinary approaches, integrating geochemistry, geophysics, and remote sensing technologies to understand eruption mechanisms and hazard assessment. The relationship between volcanic activity and climate change has become increasingly important, as major eruptions can inject sulfur compounds into the stratosphere, temporarily cooling global temperatures and affecting precipitation patterns worldwide.",
      japanese: "火山系は地球の地質学的枠組みにおいて最も動的で影響力のあるプロセスの一部を表し、惑星の内部と表面環境の間の導管として機能しています。マグマの石成成因は、マントル岩の部分溶融が多様なマグマ組成を作り出すアセノスフィアにおける複雑な化学的・熱的プロセスを含みます。現代の火山学研究は学際的アプローチを採用し、地球化学、地球物理学、リモートセンシング技術を統合して噴火メカニズムとハザード評価を理解しています。火山活動と気候変動の関係は、大規模な噴火が成層圏に硫黄化合物を注入し、世界的な気温を一時的に冷却し、世界中の降水パターンに影響を与える可能性があるため、ますます重要になっています。"
    },
    5: {
      english: "The epistemological challenges in volcanic research underscore the inherent complexities of studying systems that operate across multiple temporal and spatial scales, from microsecond crystal nucleation processes to millennial-scale caldera formation cycles. Contemporary volcanological paradigms increasingly emphasize the stochastic nature of eruptive processes, recognizing that volcanic behavior emerges from nonlinear interactions between thermodynamic, rheological, and kinetic variables within magmatic systems. The integration of machine learning algorithms with traditional petrological analysis has revolutionized our understanding of magma chamber dynamics, revealing previously unrecognized patterns in crystal zonation and volatile exsolution that provide unprecedented insights into pre-eruptive processes and the temporal evolution of magmatic systems.",
      japanese: "火山研究における認識論的課題は、マイクロ秒の結晶核形成プロセスから千年規模のカルデラ形成サイクルまで、複数の時間的・空間的スケールにわたって動作するシステムを研究することの本質的な複雑さを浮き彫りにしています。現代の火山学パラダイムは噴火プロセスの確率的性質をますます強調し、火山の挙動がマグマ系内の熱力学的、流体力学的、動力学的変数間の非線形相互作用から生じることを認識しています。機械学習アルゴリズムと従来の岩石学的分析の統合は、マグマ溜まりの動力学に対する我々の理解を革命的に変え、結晶のゾーニングと揮発性成分の溶解分離における以前は認識されていなかったパターンを明らかにし、噴火前プロセスとマグマ系の時間的進化への前例のない洞察を提供しています。"
    }
  };
  
  return content[level as keyof typeof content] || content[2];
}

// 海洋に関するコンテンツ
function getOceanContent(level: number) {
  const content = {
    1: {
      english: "The ocean is very big. It covers most of our planet Earth. There are many fish in the ocean. Some fish are small, some are very big. Whales are the biggest animals in the ocean. The ocean water is salty. People cannot drink it. Waves move in the ocean. Sometimes the waves are big, sometimes small. The ocean is very important for all life on Earth.",
      japanese: "海はとても大きいです。地球のほとんどを覆っています。海にはたくさんの魚がいます。小さな魚もいれば、とても大きな魚もいます。クジラは海で一番大きな動物です。海の水は塩っぱいです。人間は飲むことができません。海では波が動いています。時々波は大きく、時々小さいです。海は地球上のすべての生命にとってとても重要です。"
    },
    2: {
      english: "The world's oceans contain 97% of all water on Earth and play a crucial role in regulating our planet's climate. Ocean currents transport warm and cold water around the globe, affecting weather patterns everywhere. The ocean is home to incredible biodiversity, from tiny plankton to massive blue whales. Coral reefs, often called the rainforests of the sea, provide shelter for countless marine species. Unfortunately, human activities like pollution and overfishing are threatening ocean ecosystems. Scientists study the ocean to better understand how we can protect this vital resource for future generations.",
      japanese: "世界の海洋は地球上の全水量の97%を含み、私たちの惑星の気候調節において重要な役割を果たしています。海流は暖かい水と冷たい水を地球全体に運び、あらゆる場所の気象パターンに影響を与えています。海洋は小さなプランクトンから巨大なシロナガスクジラまで、信じられないほどの生物多様性の宝庫です。しばしば海の熱帯雨林と呼ばれるサンゴ礁は、数え切れないほどの海洋生物に避難場所を提供しています。残念ながら、汚染や乱獲などの人間活動が海洋生態系を脅かしています。科学者たちは、将来の世代のためにこの重要な資源をどのように保護できるかをよりよく理解するために海洋を研究しています。"
    },
    3: {
      english: "Oceanography encompasses the study of physical, chemical, biological, and geological aspects of marine environments, revealing the ocean's fundamental role in Earth's interconnected systems. The thermohaline circulation, driven by differences in water density caused by temperature and salinity variations, creates a global conveyor belt that regulates climate patterns worldwide. Marine ecosystems demonstrate remarkable adaptations to extreme conditions, from hydrothermal vent communities that thrive without sunlight to organisms that have evolved to withstand crushing pressure in ocean trenches. Understanding ocean acidification, caused by increased atmospheric carbon dioxide absorption, has become critical for predicting the future health of marine food webs and the billions of people who depend on ocean resources.",
      japanese: "海洋学は海洋環境の物理的、化学的、生物学的、地質学的側面の研究を包含し、地球の相互接続されたシステムにおける海洋の基本的な役割を明らかにしています。温度と塩分の変化によって引き起こされる水の密度差によって駆動される熱塩循環は、世界中の気候パターンを調節する地球規模のコンベヤーベルトを作り出しています。海洋生態系は、太陽光なしで繁栄する熱水噴出孔群集から海溝での圧倒的な圧力に耐えるように進化した生物まで、極限条件への驚くべき適応を示しています。大気中の二酸化炭素吸収の増加によって引き起こされる海洋酸性化を理解することは、海洋食物網の将来の健全性と海洋資源に依存する数十億人の人々を予測するために重要になっています。"
    },
    4: {
      english: "Contemporary oceanographic research has revealed the ocean's role as a dynamic interface between the Earth's geosphere, atmosphere, hydrosphere, and biosphere, with implications extending far beyond marine science into climate dynamics, biogeochemical cycling, and planetary evolution. Advanced technologies such as autonomous underwater vehicles, satellite altimetry, and deep-sea observatories have unveiled previously unknown features of ocean circulation, including mesoscale eddies that transport nutrients and heat across basin scales. The discovery of vast midwater ecosystems and the quantification of marine carbon sequestration processes have fundamentally altered our understanding of global carbon cycles and the ocean's capacity to mitigate anthropogenic climate change through both biological and physical mechanisms.",
      japanese: "現代の海洋学研究は、海洋が地球の地圏、大気圏、水圏、生物圏の間の動的なインターフェースとしての役割を明らかにし、海洋科学を超えて気候力学、生物地球化学サイクル、惑星進化にまで及ぶ含意を持っています。自律型水中機、衛星高度計、深海観測所などの先進技術は、流域規模で栄養素と熱を輸送する中規模渦を含む海洋循環の以前は知られていなかった特徴を明らかにしました。広大な中層水生態系の発見と海洋炭素隔離プロセスの定量化は、地球規模炭素サイクルと生物学的・物理的メカニズムの両方を通じて人為的気候変動を緩和する海洋の能力に対する我々の理解を根本的に変えました。"
    },
    5: {
      english: "The epistemological frameworks governing contemporary oceanographic inquiry increasingly recognize the ocean as a complex adaptive system whose emergent properties arise from nonlinear interactions across multiple scales of organization, from molecular processes governing gas exchange at the air-sea interface to planetary-scale circulation patterns that modulate centennial climate variability. The integration of high-resolution numerical modeling with big data analytics has enabled unprecedented insights into the stochastic nature of marine ecosystem dynamics, revealing how microscale turbulence affects phytoplankton distribution and subsequently influences global biogeochemical fluxes. This systems-thinking approach has profound implications for understanding ocean-climate feedbacks and developing predictive frameworks for marine ecosystem responses to anthropogenic perturbations in an era of unprecedented environmental change.",
      japanese: "現代の海洋学的探究を支配する認識論的枠組みは、海洋を複雑適応系として認識することが増えており、その創発的性質は、大気海洋界面でのガス交換を支配する分子プロセスから百年規模の気候変動を調節する惑星規模の循環パターンまで、複数の組織スケールにわたる非線形相互作用から生じます。高解像度数値モデリングとビッグデータ解析の統合により、海洋生態系動力学の確率的性質への前例のない洞察が可能になり、微細スケールの乱流が植物プランクトンの分布にどのように影響し、その後地球規模の生物地球化学フラックスに影響するかが明らかになりました。このシステム思考アプローチは、海洋気候フィードバックを理解し、前例のない環境変化の時代における人為的擾乱に対する海洋生態系の応答のための予測的枠組みを開発することに深い含意を持っています。"
    }
  };
  
  return content[level as keyof typeof content] || content[2];
}

// 宇宙探査に関するコンテンツ
function getSpaceContent(level: number) {
  const content = {
    1: {
      english: "Space is very big and dark. It has many stars and planets. The Earth is our planet in space. People build rockets to go to space. Astronauts are people who travel in space. They wear special suits. The Moon is close to Earth. People have walked on the Moon. Mars is a red planet. Scientists want to send people there. Space exploration helps us learn about the universe.",
      japanese: "宇宙はとても大きくて暗いです。たくさんの星と惑星があります。地球は宇宙にある私たちの惑星です。人々は宇宙に行くためにロケットを作ります。宇宙飛行士は宇宙を旅する人たちです。彼らは特別なスーツを着ます。月は地球に近いです。人々は月を歩いたことがあります。火星は赤い惑星です。科学者たちはそこに人を送りたいと思っています。宇宙探査は宇宙について学ぶのに役立ちます。"
    },
    2: {
      english: "Space exploration has been one of humanity's greatest adventures. Since the first satellite Sputnik was launched in 1957, we have sent many missions to explore our solar system. The Apollo missions successfully landed twelve astronauts on the Moon between 1969 and 1972. Today, we have robotic probes studying Mars, Jupiter, Saturn, and other planets. The International Space Station orbits Earth, where astronauts from different countries work together. Private companies are now joining space exploration, making it more accessible. Scientists hope that space exploration will help us find answers to important questions about life and the universe.",
      japanese: "宇宙探査は人類最大の冒険の一つでした。1957年に最初の人工衛星スプートニクが打ち上げられて以来、私たちは太陽系を探査するために多くのミッションを送ってきました。アポロミッションは1969年から1972年の間に12人の宇宙飛行士を月に着陸させることに成功しました。今日、私たちは火星、木星、土星、その他の惑星を研究するロボット探査機を持っています。国際宇宙ステーションは地球を周回し、そこで異なる国の宇宙飛行士が協力して働いています。民間企業が今宇宙探査に参加し、それをより身近なものにしています。科学者たちは宇宙探査が生命と宇宙に関する重要な質問への答えを見つけるのに役立つことを期待しています。"
    },
    3: {
      english: "Modern space exploration combines cutting-edge technology with international cooperation to push the boundaries of human knowledge and capability. Robotic missions have revolutionized our understanding of planetary science, from the discovery of water on Mars to the detailed study of Saturn's moons. The James Webb Space Telescope has provided unprecedented views of distant galaxies, allowing us to observe the universe as it existed billions of years ago. Commercial spaceflight companies are developing reusable rockets and planning missions to establish permanent human settlements on Mars. These achievements represent not just technological progress, but also humanity's drive to explore the unknown and ensure our species' long-term survival.",
      japanese: "現代の宇宙探査は最先端技術と国際協力を組み合わせて、人類の知識と能力の境界を押し広げています。ロボットミッションは、火星での水の発見から土星の衛星の詳細な研究まで、惑星科学に対する我々の理解を革命的に変えました。ジェームズ・ウェッブ宇宙望遠鏡は遠方の銀河の前例のない視野を提供し、数十億年前に存在していた宇宙を観察することを可能にしました。民間宇宙飛行会社は再利用可能なロケットを開発し、火星に永続的な人間の居住地を確立するミッションを計画しています。これらの成果は技術的進歩だけでなく、未知を探求し、我々の種の長期的生存を確保する人類の衝動も表しています。"
    },
    4: {
      english: "Contemporary space exploration represents a paradigmatic shift from government-led initiatives to a complex ecosystem involving international space agencies, private aerospace companies, and academic institutions working collaboratively on increasingly ambitious projects. The emergence of commercial spaceflight has democratized access to low Earth orbit while driving down costs through innovative engineering solutions and manufacturing processes. Simultaneously, deep space missions are utilizing advanced propulsion systems, artificial intelligence, and autonomous navigation to explore previously inaccessible regions of our solar system and beyond. The search for extraterrestrial life has been reinvigorated by discoveries of potentially habitable exoplanets and subsurface oceans on moons like Europa and Enceladus, fundamentally altering our approach to astrobiology and the question of life's prevalence in the universe.",
      japanese: "現代の宇宙探査は、政府主導の取り組みから、ますます野心的なプロジェクトで協力する国際宇宙機関、民間航空宇宙企業、学術機関を含む複雑な生態系への範例的転換を表しています。商業宇宙飛行の出現は、革新的な工学ソリューションと製造プロセスを通じてコストを押し下げながら、低地球軌道へのアクセスを民主化しました。同時に、深宇宙ミッションは先進推進システム、人工知能、自律航法を利用して、我々の太陽系の以前はアクセス不可能だった領域とその先を探査しています。地球外生命の探索は、潜在的に居住可能な系外惑星と、エウロパやエンケラドゥスのような衛星の地下海洋の発見によって活性化され、宇宙生物学と宇宙における生命の普遍性の問題への我々のアプローチを根本的に変えています。"
    },
    5: {
      english: "The philosophical and scientific implications of space exploration transcend technological achievement, fundamentally challenging anthropocentric worldviews and expanding the epistemological frameworks through which we understand consciousness, life, and our place in the cosmic hierarchy. Advanced space-based observatories and interplanetary missions have revealed the universe's profound complexity and apparent fine-tuning, raising questions about the anthropic principle and the possibility of multiversal theories. The technological spinoffs from space exploration have catalyzed innovations in materials science, computing, and biotechnology that have revolutionized terrestrial applications. Moreover, the psychological and sociological effects of viewing Earth from space—the overview effect—have profoundly influenced human consciousness and our understanding of planetary stewardship, suggesting that space exploration serves not merely as scientific endeavor but as a transformative experience that reshapes humanity's collective identity and moral responsibilities.",
      japanese: "宇宙探査の哲学的・科学的含意は技術的成果を超越し、人間中心的世界観に根本的に挑戦し、意識、生命、宇宙階層における我々の位置を理解する認識論的枠組みを拡張しています。先進的な宇宙ベース観測所と惑星間ミッションは宇宙の深い複雑さと明らかな微調整を明らかにし、人間原理と多元宇宙理論の可能性について疑問を提起しています。宇宙探査からの技術的副産物は、地球上の応用を革命化した材料科学、コンピューティング、バイオテクノロジーにおけるイノベーションを触媒しました。さらに、宇宙から地球を見ることの心理的・社会学的効果—概観効果—は人間の意識と惑星管理に対する我々の理解に深く影響し、宇宙探査が単なる科学的努力としてではなく、人類の集合的アイデンティティと道徳的責任を再形成する変革的体験として機能することを示唆しています。"
    }
  };
  
  return content[level as keyof typeof content] || content[2];
}

// 動物に関するコンテンツ
function getAnimalContent(level: number) {
  const content = {
    1: {
      english: "Animals are living things that move around. They come in many different sizes and colors. Dogs and cats are pets that live with people. Wild animals live in forests, oceans, and other places. Lions are big and strong. Elephants are very large animals with long noses. Birds can fly in the sky. Fish swim in water. Some animals eat plants, some eat other animals. All animals need food, water, and a safe place to live.",
      japanese: "動物は動き回る生き物です。いろいろな大きさや色があります。犬と猫は人間と一緒に住むペットです。野生動物は森、海、その他の場所に住んでいます。ライオンは大きくて強いです。象は長い鼻を持つとても大きな動物です。鳥は空を飛ぶことができます。魚は水の中で泳ぎます。植物を食べる動物もいれば、他の動物を食べる動物もいます。すべての動物は食べ物、水、安全な住む場所が必要です。"
    },
    2: {
      english: "The animal kingdom displays incredible diversity, with millions of species adapted to virtually every environment on Earth. Animals have evolved amazing abilities to survive in their habitats. Polar bears have thick fur to stay warm in the Arctic, while camels can survive for days without water in the desert. Some animals migrate thousands of miles, like arctic terns that fly from the Arctic to Antarctica each year. Others, like chameleons, can change their color to blend in with their surroundings. Many animals communicate with each other through sounds, movements, or chemical signals. Understanding animal behavior helps us protect endangered species and maintain healthy ecosystems.",
      japanese: "動物界は信じられないほどの多様性を示し、地球上のほぼすべての環境に適応した数百万の種が存在します。動物は生息地で生き残るための驚くべき能力を進化させました。ホッキョクグマは北極で暖かく過ごすために厚い毛皮を持ち、ラクダは砂漠で何日も水なしで生き延びることができます。北極アジサシのように北極から南極まで毎年飛ぶなど、何千マイルも移動する動物もいます。カメレオンのように周囲に溶け込むために色を変えることができる動物もいます。多くの動物は音、動き、化学信号を通じて互いにコミュニケーションを取ります。動物の行動を理解することは、絶滅危惧種を保護し、健康な生態系を維持するのに役立ちます。"
    },
    3: {
      english: "Animal behavior and ecology reveal fascinating insights into evolutionary adaptations and the complex interactions that maintain ecosystem balance. Social animals like wolves and elephants demonstrate sophisticated communication systems and collaborative hunting strategies that have been refined over millions of years. The concept of biodiversity extends beyond species counts to include genetic diversity within populations and the intricate relationships between predators, prey, and their environments. Conservation biology has become increasingly important as human activities threaten natural habitats, leading to the sixth mass extinction event in Earth's history. Scientists study animal cognition and problem-solving abilities, discovering that many species possess intelligence and emotional complexity previously thought to be unique to humans.",
      japanese: "動物の行動と生態学は、進化的適応と生態系のバランスを維持する複雑な相互作用への魅力的な洞察を明らかにします。オオカミや象などの社会性動物は、何百万年にわたって洗練されてきた洗練されたコミュニケーションシステムと協力的な狩猟戦略を示しています。生物多様性の概念は種数を超えて、個体群内の遺伝的多様性と捕食者、被食者、その環境間の複雑な関係を含みます。人間の活動が自然生息地を脅かし、地球史上6番目の大量絶滅事象を引き起こしているため、保全生物学はますます重要になっています。科学者は動物の認知と問題解決能力を研究し、多くの種が以前は人間に特有だと考えられていた知性と感情的複雑さを持つことを発見しています。"
    },
    4: {
      english: "Contemporary zoological research has revealed that animal societies exhibit sophisticated organizational structures and cultural transmission mechanisms that parallel many aspects of human civilization. Primatological studies demonstrate that chimpanzees and bonobos possess distinct regional cultures, with different populations exhibiting unique tool-use patterns and social behaviors that are learned and transmitted across generations. The field of animal cognition has been revolutionized by discoveries of metacognition, self-awareness, and abstract reasoning capabilities in species ranging from dolphins and corvids to octopuses. These findings have profound implications for our understanding of consciousness and raise important ethical questions about animal welfare, rights, and the moral status of non-human species in an increasingly anthropogenic world.",
      japanese: "現代の動物学研究は、動物社会が人間の文明の多くの側面と並行する洗練された組織構造と文化伝達メカニズムを示すことを明らかにしました。霊長類学研究は、チンパンジーとボノボが異なる地域文化を持ち、異なる個体群が学習され世代を超えて伝達される独特の道具使用パターンと社会行動を示すことを実証しています。動物認知の分野は、イルカやカラス科からタコまでの種におけるメタ認知、自己認識、抽象的推論能力の発見によって革命的に変化しました。これらの発見は意識に対する我々の理解に深い含意を持ち、ますます人為的になる世界における動物の福祉、権利、非人間種の道徳的地位について重要な倫理的問題を提起しています。"
    },
    5: {
      english: "The epistemological implications of contemporary animal studies extend far beyond traditional biological frameworks, fundamentally challenging anthropocentric conceptions of intelligence, consciousness, and moral consideration. Comparative cognitive research has revealed that cognitive complexity exists across multiple evolutionary lineages, suggesting that consciousness may be a more widespread phenomenon than previously conceived. The emerging field of animal phenomenology investigates the subjective experiences of non-human species, employing interdisciplinary approaches that integrate neuroscience, ethology, and philosophy of mind. These investigations have profound implications for conservation ethics, as they suggest that biodiversity loss represents not merely the extinction of genetic resources, but the elimination of unique forms of conscious experience and potentially irreplaceable modes of being-in-the-world.",
      japanese: "現代動物研究の認識論的含意は従来の生物学的枠組みをはるかに超え、知性、意識、道徳的考慮の人間中心的概念に根本的に挑戦しています。比較認知研究は、認知的複雑さが複数の進化系統にわたって存在することを明らかにし、意識が以前考えられていたよりもより広範囲にわたる現象である可能性を示唆しています。動物現象学の新興分野は、神経科学、動物行動学、心の哲学を統合する学際的アプローチを採用して、非人間種の主観的経験を調査しています。これらの調査は保全倫理に深い含意を持ち、生物多様性の喪失が単なる遺伝的資源の絶滅ではなく、独特の意識経験の形式と潜在的に代替不可能な世界内存在の様式の排除を表すことを示唆しています。"
    }
  };
  
  return content[level as keyof typeof content] || content[2];
}

// テクノロジーに関するコンテンツ（驚くべき事実データベースを活用）
function getTechnologyContent(level: number, technology: string) {
  // surprisingFactsデータベースから事実を取得
  const techFacts: { [key: string]: { [key: number]: string[] } } = {
    'iPad': {
      1: [
        'The iPad was made in just one year by Steve Jobs and his team',
        'iPads do not get viruses like computers do'
      ],
      2: [
        'The first iPad was announced on January 27, 2010, and changed how people use computers forever',
        'Apple sold 300,000 iPads on the very first day it was available in stores'
      ],
      3: [
        'The iPad was originally going to be called the "iSlate" but Apple changed the name at the last minute',
        'Despite being incredibly thin, the iPad contains over 1,000 individual components and parts'
      ]
    },
    'iPhone': {
      1: [
        'The iPhone was the first phone that you could touch with your finger',
        'iPhones have special glass that is very hard to break'
      ],
      2: [
        'Steve Jobs kept the iPhone project so secret that Apple employees had to cover it with a cloth when moving it around',
        'The iPhone was originally designed to have a physical keyboard, but Apple removed it to make the screen bigger'
      ],
      3: [
        'The iPhone development was so secretive that Apple built fake walls in their offices to hide the project from their own employees',
        'Apple spent over 3 years and $150 million developing the iPhone before it was announced'
      ]
    },
    'Apple': {
      1: [
        'Apple was started in a garage by two friends named Steve',
        'The Apple logo used to be rainbow colored'
      ],
      2: [
        'Apple was named after Steve Jobs ate only apples for weeks and thought the name sounded friendly',
        'Apple is worth more money than many entire countries in the world'
      ],
      3: [
        'Apple almost went bankrupt in 1997 and was just 90 days away from closing down forever',
        'Apple has more cash money saved than the entire US government treasury'
      ]
    },
    'Google': {
      1: [
        'Google started in a garage just like Apple did',
        'Google gets over 8 billion searches every single day'
      ],
      2: [
        'Google was originally called "BackRub" before they changed it to Google',
        'Google owns YouTube, which has over 2 billion users watching videos every month'
      ],
      3: [
        'Google processes over 40,000 searches every second, which is more than 3.5 billion searches per day',
        'Google\'s first computer storage was made from Lego blocks to hold the hard drives'
      ]
    },
    'computer': {
      1: [
        'The first computer was as big as a whole room',
        'Computer mice were invented before computers had screens'
      ],
      2: [
        'The first computer bug was actually a real insect that got stuck inside a computer in 1947',
        'Early computers used vacuum tubes and generated so much heat they needed special cooling rooms'
      ],
      3: [
        'The password "password" is still the most commonly used password in the world, despite being extremely unsafe',
        'Your smartphone has more computing power than all of NASA had when they sent humans to the moon'
      ]
    },
    'internet': {
      1: [
        'The internet was first created by the military to send messages',
        'The first website is still working today after 30 years'
      ],
      2: [
        'The first email was sent in 1971, and it was just a test message saying "QWERTYUIOP"',
        'Over 4.6 billion people use the internet today, which is more than half of everyone on Earth'
      ],
      3: [
        'The internet weighs approximately 50 grams, which is about the same as a strawberry',
        'If the internet went down for just one day, it would cost the global economy over $50 billion'
      ]
    }
  };

  // 適切な事実を取得
  const facts = techFacts[technology]?.[level] || techFacts[technology]?.[2] || [
    `${technology} has changed the way people live and work in amazing ways`,
    `Every day, millions of people around the world use ${technology} to solve problems and connect with others`
  ];

  const templates = {
    1: {
      english: `${technology} is amazing! Here are two incredible facts about ${technology}: ${facts[0]}. Also, ${facts[1]}.\n\nPeople all over the world use ${technology} every day. It helps them do many things. You can learn more about ${technology} by reading books or watching videos.\n\nThe more you learn, the more interesting ${technology} becomes!`,
      japanese: `${technology}は素晴らしいです！${technology}について2つの信じられない事実があります：${facts[0]}。また、${facts[1]}。\n\n世界中の人々が毎日${technology}を使っています。それは多くのことをするのに役立ちます。本を読んだりビデオを見たりして${technology}についてもっと学ぶことができます。\n\n学べば学ぶほど、${technology}はより興味深くなります！`
    },
    2: {
      english: `Understanding ${technology} reveals fascinating discoveries that have revolutionized our modern world. Here's an amazing fact: ${facts[0]}. Even more surprising is that ${facts[1]}.\n\nThese innovations show how technology continues to transform human society. ${technology} represents one of the most significant technological advances of our time, affecting everything from education and business to entertainment and communication.\n\nLearning about ${technology} helps us appreciate the incredible engineering and creativity behind modern devices.`,
      japanese: `${technology}を理解することで、現代世界を革命化した魅力的な発見が明らかになります。驚くべき事実がこちらです：${facts[0]}。さらに驚くべきことは、${facts[1]}。\n\nこれらの革新は、テクノロジーがいかに人間社会を変革し続けているかを示しています。${technology}は我々の時代の最も重要な技術的進歩の一つを表し、教育やビジネスから娯楽や通信まであらゆることに影響を与えています。\n\n${technology}について学ぶことで、現代デバイスの背後にある信じられない工学と創造性を理解できます。`
    },
    3: {
      english: `The development of ${technology} represents a paradigm shift in human-computer interaction and digital innovation. Consider this remarkable revelation: ${facts[0]}.\n\nPerhaps even more astonishing is the fact that ${facts[1]}. These breakthroughs demonstrate how ${technology} has fundamentally transformed not only how we access information, but also how we think about productivity, creativity, and communication.\n\nThe impact extends far beyond individual users, influencing entire industries and reshaping educational methodologies, business practices, and social interactions in ways that continue to evolve.`,
      japanese: `${technology}の開発は、人間とコンピュータの相互作用とデジタルイノベーションのパラダイムシフトを表しています。この注目すべき啓示を考えてみてください：${facts[0]}。\n\nおそらくさらに驚くべきことは、${facts[1]}という事実です。これらのブレークスルーは、${technology}が情報へのアクセス方法だけでなく、生産性、創造性、コミュニケーションについての考え方も根本的に変革したことを示しています。\n\nその影響は個人ユーザーをはるかに超え、産業全体に影響を与え、教育方法論、ビジネス慣行、社会的相互作用を継続的に進化する方法で再構築しています。`
    }
  };
  
  return templates[level as keyof typeof templates] || templates[2];
}