import { NextResponse } from "next/server";

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
    console.log('📚 Reading generation request (fallback mode):', requestData);

    const { level = 3, topic = '', theme = '', isMailGeneration = false } = requestData;
    
    // レベルを1-5の範囲に正規化
    const normalizedLevel = Math.max(1, Math.min(5, parseInt(level.toString())));
    
    console.log(`📝 Generating fallback reading for level ${normalizedLevel}`);

    // フォールバック読み物の選択
    const selectedReading = fallbackReadings[normalizedLevel as keyof typeof fallbackReadings];
    
    let title = "Sample Reading";
    if (topic) {
      title = `Reading about ${topic}`;
    } else if (theme) {
      title = `Reading: ${theme}`;
    }

    // メール生成の場合は短縮版
    if (isMailGeneration) {
      const shortEnglish = selectedReading.english.split('.').slice(0, 3).join('.') + '.';
      const shortJapanese = selectedReading.japanese.split('。').slice(0, 2).join('。') + '。';
      
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
      english: selectedReading.english,
      japanese: selectedReading.japanese,
      title: title,
      level: normalizedLevel,
      wordCount: selectedReading.english.split(' ').length,
      vocabulary: `Level ${normalizedLevel} vocabulary`,
      isMailGeneration: false
    };

    console.log('✅ Fallback reading generated:', {
      title: response.title,
      level: response.level,
      wordCount: response.wordCount,
      englishLength: response.english.length
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