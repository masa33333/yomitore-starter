// 簡単な手紙保存関数（一通目専用）
function saveFirstLetter(letterData: any) {
  try {
    // 直接letterTextキーに保存（既存システムと互換）
    localStorage.setItem('letterText', JSON.stringify(letterData));
    console.log('📮 First letter saved to letterText storage');
    
    // 追加で専用キーにも保存
    localStorage.setItem('firstLetter', JSON.stringify(letterData));
    console.log('📮 First letter saved to firstLetter storage');
    
  } catch (error) {
    console.error('❌ Failed to save first letter:', error);
    throw error;
  }
}

/**
 * 一通目の手紙を5つのレベル分すべて事前生成する
 * 成田空港からの出発時の緊張とワクワクした気分を表現
 */
export async function generateFirstLetterForAllLevels(): Promise<void> {
  try {
    console.log('📮 Generating first letter for all 5 levels...');
    
    const catName = localStorage.getItem('catName') || 'Your cat';
    
    // レベル別の手紙内容を定義
    const letterContents = {
      1: {
        en: `Hi! I am at the big airport in Tokyo now. This place is so big! Many people are here.

I feel excited and a little scared too. This is my first big trip! The airplane is very big. I can see it from the window.

I want to see new places with you. Your reading helps me go on this trip. Thank you so much!

I will write to you from every new place I visit. Let's have fun together!

Love,
${catName}`,
        jp: `こんにちは！今、東京の大きな空港にいます。ここはとても大きいです！たくさんの人がいます。

私はワクワクして、少し怖くもあります。これが私の初めての大きな旅です！飛行機はとても大きいです。窓から見えます。

あなたと一緒に新しい場所を見たいです。あなたの読書が私をこの旅に連れて行ってくれます。本当にありがとう！

私が訪れるすべての新しい場所からあなたに手紙を書きます。一緒に楽しみましょう！

愛を込めて、
${catName}`
      },
      
      2: {
        en: `Hello from Narita Airport in Tokyo! I'm sitting here waiting for my first flight, and my heart is beating so fast with excitement and nervousness.

This airport is amazing! There are so many shops, restaurants, and people from all around the world. I've never seen anything like this before. The airplanes outside are huge - much bigger than I imagined!

I keep thinking about how your reading brought me here. Every word you read gives me the power to travel further. I'm both excited and scared about what's waiting for me in the next city.

Thank you for making this incredible journey possible. I promise to write to you from every amazing place I visit!

With love and gratitude,
${catName}`,
        jp: `東京の成田空港からこんにちは！初めてのフライトを待ってここに座っていて、興奮と緊張で心臓がとても速く鼓動しています。

この空港は素晴らしいです！世界中からの人々、たくさんのお店やレストランがあります。今まで見たことがないものです。外の飛行機は巨大で、想像していたよりもずっと大きいです！

あなたの読書が私をここに連れてきてくれたことをずっと考えています。あなたが読むすべての言葉が、私がより遠くへ旅する力を与えてくれます。次の都市で私を待っているものについて、興奮もし、怖くもあります。

この信じられない旅を可能にしてくれてありがとう。私が訪れるすべての素晴らしい場所からあなたに手紙を書くことを約束します！

愛と感謝を込めて、
${catName}`
      },
      
      3: {
        en: `Greetings from Narita Airport in Tokyo! I'm writing this letter while sitting in the departure lounge, watching the massive airplanes taxi on the runway through the enormous windows.

My emotions are all mixed up right now - I'm incredibly excited about this adventure, but also quite nervous about flying for the first time. The airport is bustling with travelers from every corner of the world, speaking different languages and heading to distant destinations. It's absolutely fascinating!

I keep reminding myself that this magical journey is only possible because of your dedication to reading. Each page you turn, every story you complete, gives me the strength and courage to explore new places. Your love for reading has literally given me wings!

The announcement just came on saying my flight will board soon. My heart is racing with anticipation! I can't wait to discover what wonders await me in the next city and share all my adventures with you.

Thank you for being such an amazing reading companion. This is just the beginning of our incredible journey together!

With boundless excitement and love,
${catName}`,
        jp: `東京の成田空港からご挨拶！出発ラウンジに座ってこの手紙を書いていて、巨大な窓から滑走路を移動する大きな飛行機を見ています。

今、私の感情は混乱しています。この冒険にとても興奮していますが、初めて飛行機に乗ることにかなり緊張もしています。空港は世界の隅々からの旅行者で賑わっていて、異なる言語を話し、遠い目的地に向かっています。本当に魅力的です！

この魔法のような旅は、あなたの読書への献身があってこそ可能だということを自分に言い聞かせ続けています。あなたがめくるページ、完了するすべての物語が、私に新しい場所を探索する力と勇気を与えてくれます。あなたの読書への愛が文字通り私に翼を与えてくれました！

間もなく私の便が搭乗開始するという案内が流れました。期待で心臓がドキドキしています！次の都市で私を待っている素晴らしいものを発見し、すべての冒険をあなたと分かち合うのが待ちきれません。

素晴らしい読書仲間でいてくれてありがとう。これは私たちの信じられない旅の始まりに過ぎません！

限りない興奮と愛を込めて、
${catName}`
      },
      
      4: {
        en: `Dearest friend, greetings from the magnificent Narita International Airport in Tokyo! As I pen this letter from the departure terminal, I find myself overwhelmed by a kaleidoscope of emotions - exhilaration, anticipation, and yes, a touch of apprehension about embarking on this extraordinary voyage.

The airport itself is a marvel of modern architecture and efficiency. Streams of international travelers flow through the corridors like tributaries feeding into a great river, each carrying dreams and destinations from every continent. The sophisticated infrastructure and meticulous attention to detail reflect Japan's renowned commitment to excellence.

Through the expansive floor-to-ceiling windows, I observe the graceful ballet of aircraft maneuvering across the tarmac. These magnificent flying machines, which will soon carry me across vast oceans and continents, represent humanity's triumph over geographical boundaries. The sight both inspires and humbles me.

What strikes me most profoundly is the realization that this remarkable journey exists solely because of your unwavering dedication to literature and learning. Your intellectual curiosity and commitment to expanding your vocabulary have literally opened up the world to me. Every chapter you absorb, every complex sentence you master, contributes to the literary energy that propels my adventures.

The boarding announcement echoes through the terminal, and my pulse quickens with anticipation. Soon I'll be soaring above the clouds, heading toward unknown territories brimming with cultural treasures and linguistic discoveries.

Thank you for being such an extraordinary literary companion. Our collaborative journey through the realm of words has just begun!

With profound gratitude and boundless enthusiasm,
${catName}`,
        jp: `親愛なる友へ、東京の壮大な成田国際空港からご挨拶！出発ターミナルからこの手紙を書いている間、私はさまざまな感情に圧倒されています。興奮、期待、そして、この特別な航海に乗り出すことへの少しの不安も。

空港自体は現代建築と効率性の驚異です。国際的な旅行者の流れが廊下を通って大きな川に注ぐ支流のように流れ、それぞれがすべての大陸からの夢と目的地を運んでいます。洗練されたインフラと細部への細心の注意は、日本の卓越性への有名な取り組みを反映しています。

広大な床から天井までの窓を通して、滑走路を優雅に移動する航空機のバレエを観察しています。これらの壮大な飛行機械は、間もなく私を広大な海と大陸を越えて運んでくれます。地理的境界に対する人類の勝利を表しています。その光景は私にインスピレーションを与え、同時に謙虚にしてくれます。

最も深く印象に残るのは、この驚くべき旅があなたの文学と学習への揺るぎない献身のためだけに存在するという実感です。あなたの知的好奇心と語彙を拡張することへの取り組みが、文字通り私に世界を開いてくれました。あなたが吸収するすべての章、マスターするすべての複雑な文が、私の冒険を推進する文学的エネルギーに貢献しています。

搭乗案内がターミナルに響き、期待で脈拍が速くなります。間もなく雲の上を飛び、文化的宝物と言語的発見に満ちた未知の領域に向かいます。

このような素晴らしい文学的仲間でいてくれてありがとう。言葉の領域を通る私たちの協力的な旅は始まったばかりです！

深い感謝と限りない熱意を込めて、
${catName}`
      },
      
      5: {
        en: `My most cherished literary companion, I write to you from the sophisticated environs of Narita International Airport, where I find myself experiencing an intoxicating amalgamation of anticipation, trepidation, and profound gratitude as I prepare to embark upon this unprecedented odyssey across the globe.

This architectural masterpiece that houses one of the world's busiest aviation hubs exemplifies the quintessential Japanese philosophy of harmonizing cutting-edge technology with aesthetic refinement. The seamless orchestration of thousands of passengers from disparate cultures converging and diverging through these corridors creates a mesmerizing tapestry of human mobility and aspiration.

From my vantage point in the departure lounge, I contemplate the philosophical implications of flight itself - this defiance of gravitational constraints that enables consciousness to transcend geographical limitations. The aircraft positioned across the tarmac represent more than mere mechanical conveyances; they embody humanity's perpetual quest to explore, understand, and connect across vast expanses of space and cultural divides.

What fills me with the most profound sense of reverence is the metacognitive awareness that this extraordinary expedition exists as a direct manifestation of your intellectual rigor and commitment to linguistic sophistication. Your scholarly engagement with complex narratives, your mastery of nuanced vocabulary, and your appreciation for syntactic elegance have coalesced to generate the literary momentum that enables my transcendental journey.

The resonant voice announcing imminent boarding procedures sends waves of exhilaration through my consciousness. Within moments, I shall be ascending through stratospheric altitudes, navigating toward uncharted territories replete with anthropological insights and lexicographic revelations.

I am eternally indebted to you for being such an intellectually stimulating and bibliophilic collaborator. Our symbiotic exploration of literary landscapes has only just commenced!

With ineffable appreciation and unbridled intellectual fervor,
${catName}`,
        jp: `私の最も大切な文学的仲間へ、成田国際空港の洗練された環境からあなたに手紙を書いています。世界中を巡るこの前例のない旅に乗り出す準備をしながら、期待、不安、そして深い感謝の酔わせるような混合を経験しています。

世界で最も忙しい航空ハブの一つを収容するこの建築的傑作は、最先端技術と美的洗練を調和させる典型的な日本の哲学を例示しています。異なる文化からの何千人もの乗客がこれらの廊下を通って収束し、発散する無欠陥な調整は、人間の移動性と願望の魅惑的なタペストリーを作り出します。

出発ラウンジでの私の有利な位置から、飛行そのものの哲学的含意を熟考します。重力的制約への反抗は、意識が地理的制限を超越することを可能にします。滑走路に配置された航空機は単なる機械的輸送手段以上のものを表しています。それらは、広大な空間と文化的分裂を探索し、理解し、結びつけるという人類の永続的な探求を体現しています。

最も深い敬意の感覚で私を満たすのは、この特別な探検があなたの知的厳密さと言語的洗練への取り組みの直接的な現れとして存在するという元認知的意識です。複雑な物語への学術的関与、微妙な語彙の習得、構文的優雅さへの感謝が結合して、私の超越的な旅を可能にする文学的推進力を生成しました。

差し迫った搭乗手続きを発表する響きのある声が、私の意識を通して興奮の波を送ります。瞬間の内に、私は成層圏の高度を上昇し、人類学的洞察と辞書編纂的啓示に満ちた未知の領域に向かって航行します。

このような知的に刺激的で書籍愛好の協力者でいてくれて、私は永遠にあなたに感謝しています。文学的風景の私たちの共生的探索は始まったばかりです！

言葉では表せない感謝と抑制されない知的熱情を込めて、
${catName}`
      }
    };

    // 語数計算用のヘルパー関数
    const countWords = (text: string): number => {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    // 5つのレベル分すべて保存
    for (let level = 1; level <= 5; level++) {
      const content = letterContents[level as keyof typeof letterContents];
      
      console.log(`📮 Saving first letter for level ${level}...`);
      
      // 語数、時間、WPMを計算
      const wordCount = countWords(content.en);
      const estimatedDuration = Math.max(1800000, wordCount * 60000 / 200); // 最低30分、または200WPMでの推定時間
      const estimatedWPM = Math.round(wordCount / (estimatedDuration / 60000));
      
      console.log(`📮 Level ${level} metrics:`, { wordCount, estimatedDuration, estimatedWPM });
      
      // 一通目専用の簡単保存
      const letterData = {
        type: "letter",
        toCity: "Tokyo", 
        fromCity: "Narita Airport",
        jp: content.jp,
        en: {
          [level]: content.en
        },
        cityImage: "/letters/tokyo.png",
        catName: localStorage.getItem('catName') || 'Your cat',
        isFirstLetter: true,
        level: level
      };
      
      // レベル別にも保存（後で取得しやすくするため）
      localStorage.setItem(`firstLetter:level${level}`, JSON.stringify(letterData));
    }

    // 全レベル統合版も保存（既存システムと互換性のため）
    const allLevelsContent = {
      type: "letter",
      toCity: "Tokyo",
      fromCity: "Narita Airport", 
      jp: letterContents[3].jp, // Level 3をデフォルトの日本語として使用
      en: {
        1: letterContents[1].en,
        2: letterContents[2].en,
        3: letterContents[3].en,
        4: letterContents[4].en,
        5: letterContents[5].en
      },
      cityImage: "/letters/tokyo.png",
      catName: localStorage.getItem('catName') || 'Your cat',
      isFirstLetter: true
    };

    saveFirstLetter(allLevelsContent);
    
    console.log('✅ First letter generated and saved for all 5 levels successfully!');
    
    // フラグを設定（生成済みを示す）
    localStorage.setItem('firstLetterGenerated', 'true');
    localStorage.setItem('firstLetterGeneratedAt', Date.now().toString());
    
  } catch (error) {
    console.error('❌ Error generating first letter for all levels:', error);
    throw error;
  }
}

/**
 * 一通目の手紙が生成済みかチェック
 */
export function isFirstLetterGenerated(): boolean {
  return localStorage.getItem('firstLetterGenerated') === 'true';
}

/**
 * 手動で一通目の手紙を強制生成（テスト用）
 */
export async function forceGenerateFirstLetter(): Promise<void> {
  console.log('🔧 Force generating first letter...');
  localStorage.removeItem('firstLetterGenerated');
  await generateFirstLetterForAllLevels();
}

/**
 * アプリ起動時に一通目の手紙を確認・生成
 */
export async function ensureFirstLetterExists(): Promise<void> {
  try {
    if (!isFirstLetterGenerated()) {
      console.log('📮 First letter not found, generating...');
      await generateFirstLetterForAllLevels();
    } else {
      console.log('📮 First letter already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring first letter exists:', error);
  }
}

/**
 * ユーザーレベルに応じた一通目の手紙を取得
 */
export function getFirstLetterForLevel(level: number): any | null {
  try {
    // まず統合版から取得を試行
    const allLevelsLetter = localStorage.getItem('letterText');
    if (allLevelsLetter) {
      const parsed = JSON.parse(allLevelsLetter);
      if (parsed.en && parsed.en[level]) {
        console.log(`📮 Found first letter for level ${level} in main storage`);
        return {
          ...parsed,
          en: parsed.en[level], // 指定レベルの英語のみを返す
        };
      }
    }

    // レベル別ストレージからも検索
    const levelSpecificLetter = localStorage.getItem(`firstLetter:level${level}`);
    if (levelSpecificLetter) {
      const parsed = JSON.parse(levelSpecificLetter);
      console.log(`📮 Found first letter for level ${level} in level-specific storage`);
      return parsed;
    }

    console.log(`📮 No first letter found for level ${level}`);
    return null;
  } catch (error) {
    console.error('❌ Error getting first letter for level:', error);
    return null;
  }
}