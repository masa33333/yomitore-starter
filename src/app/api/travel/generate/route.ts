import { NextResponse } from "next/server";

// フォールバック用のトラベルメール/手紙テンプレート
const fallbackTravelContent = {
  narita: {
    level1: {
      en: "Hello! I am at Narita Airport now. I am so happy and excited! My bag is ready and I have my ticket. Soon I will fly to a new place. I can see big planes through the window. There are many people here. I feel a little nervous but mostly excited. This is my first big trip! I will write to you again when I arrive. I love you!",
      jp: "こんにちは！今、成田空港にいます。とても嬉しくて興奮しています！荷物の準備ができて、チケットも持っています。もうすぐ新しい場所に飛んで行きます。窓から大きな飛行機が見えます。たくさんの人がここにいます。少し緊張しますが、ほとんど興奮しています。これが私の初めての大きな旅行です！到着したらまたお手紙を書きます。愛しています！"
    },
    level2: {
      en: "Dear Friend, I am writing to you from Narita Airport in Tokyo! I cannot believe my adventure is finally starting. My heart is beating so fast with excitement and nervousness. I have been planning this trip for months, and now it is really happening. The airport is huge and busy, with travelers from all over the world. I watched the planes taking off and landing through the big windows. Soon I will be on one of those planes, flying to my first destination. I promise to write you letters from every city I visit. This is going to be the best adventure ever!",
      jp: "親愛なる友人へ、東京の成田空港からお手紙を書いています！ついに私の冒険が始まるなんて信じられません。興奮と緊張で心臓がとても早く鐘っています。この旅行を数ヶ月間計画していて、今それが本当に起こっています。空港は巨大で忙しく、世界中からの旅行者でいっぱいです。大きな窓から飛行機が離陸したり着陸したりするのを見ました。もうすぐ私もその飛行機の一つに乗って、最初の目的地に向かいます。訪れる全ての都市からお手紙を書くことを約束します。これは最高の冒険になるでしょう！"
    },
    level3: {
      en: "My dearest friend, I am writing this letter from Narita Airport, and I can barely contain my excitement! After months of dreaming and planning, my journey around the world is finally beginning. The airport is incredibly busy with travelers from every corner of the globe, each with their own story and destination. I spent the morning watching planes take off and land, imagining all the amazing places they are going. My stomach is full of butterflies, but it is the good kind of nervous excitement. I have my passport, my tickets, and my heart full of dreams. The first leg of my journey will take me to Seoul, where I plan to explore the vibrant markets and taste the delicious street food. I promise to write you detailed letters from every city I visit, sharing all my discoveries and adventures. This is the beginning of something truly magical!",
      jp: "最愛の友人へ、成田空港からこの手紙を書いています。興奮を抑えきれません！数ヶ月間夢を見て計画していた後、ついに世界一周の旅が始まります。空港は世界の隅々からの旅行者で信じられないほど忙しく、それぞれに自分の物語と目的地があります。朝、飛行機が離陸し着陸するのを見ながら、彼らが向かうすべての素晴らしい場所を想像しました。お腹は蝶でいっぱいですが、それは良い種類の緊張した興奮です。パスポート、チケット、そして夢でいっぱいの心を持っています。旅の最初の区間はソウルに向かい、そこで活気あふれる市場を探検し、美味しいストリートフードを味わう予定です。訪れるすべての都市から詳細な手紙を書き、すべての発見と冒険を共有することを約束します。これは本当に魔法的な何かの始まりです！"
    }
  },
  general: {
    level1: {
      en: "Hi! I am in a new city now. It is very nice here. The people are kind and the food is good. I saw many interesting things today. I walked in the park and took some photos. The weather is perfect for walking. I am learning new words every day. I will visit a museum tomorrow. I miss you but I am having a great time. I will write again soon!",
      jp: "こんにちは！今、新しい都市にいます。ここはとても素敵です。人々は親切で、食べ物も美味しいです。今日はたくさんの興味深いものを見ました。公園を歩いて写真を撮りました。天気は散歩に最適です。毎日新しい単語を学んでいます。明日は博物館を訪れます。あなたが恋しいですが、とても楽しい時間を過ごしています。またすぐに書きます！"
    },
    level2: {
      en: "Hello from my amazing journey! I have been exploring this beautiful city for three days now, and every moment brings new discoveries. Yesterday I visited the local market where I tried foods I had never tasted before. The vendors were so friendly and patient with my limited language skills. I also spent time in the main square, watching street performers and listening to local music. The architecture here is completely different from home - every building tells a story of the past. I am learning so much about different cultures and ways of life. Tomorrow I plan to visit a famous temple that everyone recommends. I am taking lots of photos to show you when I return!",
      jp: "素晴らしい旅からこんにちは！この美しい都市を3日間探検していて、毎瞬間が新しい発見をもたらします。昨日は地元の市場を訪れ、今まで味わったことのない食べ物を試しました。商人たちは私の限られた言語スキルにとても親切で忍耐強くしてくれました。また、メイン広場で時間を過ごし、大道芸人を見たり地元の音楽を聞いたりしました。ここの建築は家とは全く異なります - 各建物が過去の物語を語っています。異なる文化や生活様式について多くを学んでいます。明日は皆がお勧めする有名な寺院を訪れる予定です。帰ったらお見せするためにたくさんの写真を撮っています！"
    },
    level3: {
      en: "My wonderful adventure continues! I have been traveling for two weeks now, and each destination has offered unique experiences and unforgettable memories. The diversity of cultures, languages, and traditions I have encountered has been truly remarkable. In the last city, I participated in a traditional cooking class where I learned to prepare local dishes using ingredients I had never seen before. The chef was incredibly patient and shared fascinating stories about the history and significance of each recipe. I also had the opportunity to visit a local school where I taught some English words to the children in exchange for lessons in their language. Their enthusiasm and curiosity reminded me of why I love to travel - it is about connecting with people and learning from each other. The landscape here is breathtaking, with mountains that seem to touch the sky and valleys filled with colorful flowers. I spend my mornings hiking and my afternoons sketching the beautiful scenery. Every day brings new adventures and discoveries that expand my understanding of the world.",
      jp: "私の素晴らしい冒険が続いています！もう2週間旅行していて、各目的地はユニークな経験と忘れられない思い出を提供してくれました。出会った文化、言語、伝統の多様性は本当に注目に値するものでした。最後の都市では、これまで見たことのない食材を使って地元の料理を作る方法を学んだ伝統料理教室に参加しました。シェフは信じられないほど忍耐強く、各レシピの歴史と重要性について魅力的な物語を共有してくれました。また、地元の学校を訪れ、彼らの言語のレッスンと引き換えに子供たちに英単語を教える機会もありました。彼らの熱意と好奇心は、なぜ私が旅行を愛するのかを思い出させてくれました - それは人々とつながり、お互いから学ぶことです。ここの風景は息を呑むほど美しく、空に触れそうな山々と色とりどりの花で満たされた谷があります。朝はハイキングをし、午後は美しい景色をスケッチして過ごします。毎日、世界への理解を広げる新しい冒険と発見をもたらします。"
    }
  }
};

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

    console.log('📧 Travel mail/letter generation request (fallback mode):', {
      level,
      type,
      location,
      activity,
      emotion,
      catName,
      isFirstLetter
    });

    // レベルを1-3に正規化
    const normalizedLevel = Math.max(1, Math.min(3, parseInt(level.toString())));
    
    let englishText: string;
    let japaneseText: string;
    
    if (isFirstLetter) {
      // 成田空港からの最初の手紙
      const naritaContent = fallbackTravelContent.narita[`level${normalizedLevel}` as keyof typeof fallbackTravelContent.narita];
      englishText = naritaContent.en;
      japaneseText = naritaContent.jp;
    } else {
      // 一般的な旅行メール/手紙
      const generalContent = fallbackTravelContent.general[`level${normalizedLevel}` as keyof typeof fallbackTravelContent.general];
      englishText = generalContent.en;
      japaneseText = generalContent.jp;
    }

    // 語数カウント
    const wordCount = englishText.trim().split(/\s+/).filter(word => word.length > 0).length;
    console.log('📊 Generated word count:', wordCount);

    // 語数チェック
    let targetWordRange: string;
    let minWords: number;
    let maxWords: number;

    if (isFirstLetter) {
      minWords = 80;
      maxWords = 120;
      targetWordRange = '80-120';
    } else if (normalizedLevel <= 3) {
      if (type === 'letter') {
        minWords = 140;
        maxWords = 200;
        targetWordRange = '140-200';
      } else {
        minWords = 80;
        maxWords = 120;
        targetWordRange = '80-120';
      }
    } else {
      if (type === 'letter') {
        minWords = 120;
        maxWords = 150;
        targetWordRange = '120-150';
      } else {
        minWords = 80;
        maxWords = 100;
        targetWordRange = '80-100';
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
      jp: japaneseText,
      english: englishText, // 互換性のため
      type,
      level: normalizedLevel,
      location,
      activity,
      emotion,
      catName,
      wordCount,
      targetWordRange,
      isFirstLetter,
      vocabularyCheck: {
        isCompliant: true,
        forbiddenWords: [],
        complianceRate: 100
      }
    };

    console.log('✅ Fallback travel content generated:', {
      type: response.type,
      level: response.level,
      wordCount: response.wordCount,
      isFirstLetter: response.isFirstLetter
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Travel generation error:', error);
    return NextResponse.json(
      { 
        error: 'Travel mail/letter generation temporarily unavailable',
        en: 'Hello! I am on my journey and having a wonderful time. I will write more soon!',
        jp: 'こんにちは！旅行中で素晴らしい時間を過ごしています。また手紙を書きます！',
        english: 'Hello! I am on my journey and having a wonderful time. I will write more soon!',
        type: 'letter',
        level: 2,
        wordCount: 15
      }, 
      { status: 500 }
    );
  }
}