/**
 * 事前生成済みの手紙データ（Tokyo, Seoul, Beijing）
 * 各都市・各レベルの手紙内容を静的に保存
 */

export const staticLetters = {
  tokyo: {
    type: "letter",
    city: "Tokyo", 
    cityImage: "/letters/tokyo.png",
    jp: "東京の成田空港からこんにちは！初めてのフライトを待ってここに座っていて、興奮と緊張で心臓がとても速く鼓動しています。\n\nこの空港は素晴らしいです！世界中からの人々、たくさんのお店やレストランがあります。今まで見たことがないものです。外の飛行機は巨大で、想像していたよりもずっと大きいです！\n\nあなたの読書が私をここに連れてきてくれたことをずっと考えています。あなたが読むすべての言葉が、私がより遠くへ旅する力を与えてくれます。次の都市で私を待っているものについて、興奮もし、怖くもあります。\n\nこの信じられない旅を可能にしてくれてありがとう。私が訪れるすべての素晴らしい場所からあなたに手紙を書くことを約束します！\n\n愛と感謝を込めて、\nあなたのネコ",
    en: {
      1: `Hi! I am at the big airport in Tokyo now. This place is so big! Many people are here.

I feel excited and a little scared too. This is my first big trip! The airplane is very big. I can see it from the window.

I want to see new places with you. Your reading helps me go on this trip. Thank you so much!

I will write to you from every new place I visit. Let's have fun together!

Love,
Your Cat`,

      2: `Hello from Narita Airport in Tokyo! I'm sitting here waiting for my first flight, and my heart is beating so fast with excitement and worry.

This airport is great! There are so many shops, restaurants, and people from all around the world. I've never seen anything like this before. The airplanes outside are huge - much bigger than I thought!

I keep thinking about how your reading brought me here. Every word you read gives me the power to travel further. I'm both excited and scared about what's waiting for me in the next city.

Thank you for making this wonderful trip possible. I promise to write to you from every great place I visit!

With love and thanks,
Your Cat`,

      3: `Dear friend, greetings from the impressive Narita International Airport in Tokyo! As I write this letter from the departure terminal, I find myself filled with mixed emotions - excitement, anticipation, and yes, some nervousness about starting this remarkable journey.

The airport itself is a wonder of modern design and organization. Crowds of international travelers move through the hallways like streams flowing into a great river, each carrying dreams and destinations from every continent. The advanced systems and careful attention to detail show Japan's famous dedication to quality.

Through the large floor-to-ceiling windows, I watch the smooth movement of aircraft moving across the runway. These impressive flying machines, which will soon carry me across vast oceans and continents, represent humanity's success over geographical limits. The sight both inspires and amazes me.

What strikes me most deeply is the understanding that this remarkable journey exists only because of your strong dedication to reading and learning. Your intellectual curiosity and commitment to expanding your vocabulary have literally opened up the world to me. Every chapter you read, every complex sentence you understand, contributes to the reading energy that drives my adventures.

The boarding announcement sounds through the terminal, and my heart beats faster with excitement. Soon I'll be flying above the clouds, heading toward unknown places full of cultural treasures and language discoveries.

Thank you for being such a wonderful reading companion. Our shared journey through the world of words has just begun!

With deep appreciation and endless enthusiasm,
Your Cat`
    }
  },

  seoul: {
    type: "letter",
    city: "Seoul",
    cityImage: "/letters/seoul.png", 
    jp: "ソウルに到着しました！この活気に満ちた都市は、私の期待をはるかに上回っています。街の至る所にある美しい古い建物と、きらめく現代的な高層ビルが見事に調和しています。\n\n韓国の人々はとても親切で、美味しい食べ物がたくさんあります。特に魚市場では素晴らしい新鮮な魚を見つけました！街を歩いていると、あちこちから音楽や笑い声が聞こえてきます。\n\nあなたの継続的な読書のおかげで、私はここまで来ることができました。毎日の読書習慣が、文字通り私に新しい地平線を開いてくれています。次の目的地への旅路も楽しみです。\n\nソウルでの発見をもっと詳しくお話ししたいのですが、次の冒険が待っています！\n\n愛を込めて、\nあなたのネコ",
    en: {
      1: `I am in Seoul now! This city is so big and fun. There are many tall buildings and old temples too.

The people here are very nice. I found good fish at the market! The streets have music and many lights.

Your reading helps me travel here. I am happy to see this new place. The food smells good everywhere!

I want to tell you more about Seoul. But I must go to my next trip soon.

Thank you for reading every day!

Love,
Your Cat`,

      2: `Hello from Seoul! I have arrived in this great city, and it's even better than I expected. There are beautiful old buildings mixed with shiny new tall buildings everywhere I look.

The Korean people are so kind and helpful. I found a good fish market with the freshest fish I've ever seen! Walking through the streets, I can hear music and happy sounds coming from every direction.

Thanks to your daily reading, I was able to make this trip. Your reading every day is really opening new places for me. I'm already excited about going to our next place.

I wish I could tell you more about what I found in Seoul, but another trip is waiting for me!

With love and excitement,
Your Cat`,

      3: `My dear reading companion, I write to you from the exciting and culturally rich city of Seoul, where East meets West in the most amazing way possible. This remarkable city has shown itself to be a beautiful combination of ancient Korean heritage and modern innovation.

The architectural landscape presents a fascinating contrast - centuries-old palaces and temples stand proudly alongside shining glass towers that reach the sky. I've walked through traditional markets where vendors sell everything from handmade ceramics to the most excellent fresh seafood, while modern shopping districts buzz with technological wonders that seem to come from science fiction.

The Korean people have a unique combination of deep respect for tradition and enthusiastic acceptance of progress. Their concept of "jeong" - a deep sense of attachment and affection - fills every social interaction. I've experienced this warmth personally as locals have gone out of their way to help a curious traveling cat explore their impressive city.

Your intellectual dedication to literature continues to amaze me. The vocabulary you've learned, the complex stories you've read, and the cultural understanding you've gained through reading have created the energy that carries me from one incredible place to another. Each book becomes a ticket to a new adventure, each page becomes a step forward on this journey.

Seoul has taught me that true beauty lies in the balance between preservation and innovation. As I prepare for the next part of our reading voyage, I carry with me the important lessons this city has shared.

Until our paths meet again through the written word!

With great appreciation and travel excitement,
Your Cat`
    }
  },

  beijing: {
    type: "letter", 
    city: "Beijing",
    cityImage: "/letters/beijing.png",
    jp: "北京に到着しました！この古代と現代が共存する壮大な都市で、私は歴史の重みと未来への希望を同時に感じています。万里の長城、紫禁城、天安門広場など、教科書でしか見たことのない場所を実際に歩いているなんて信じられません。\n\n中国の文化は本当に奥深く、何千年もの知恵と伝統が街のあらゆる場所に息づいています。美味しい北京ダックや点心を味わい、胡同（古い路地）を散策し、現地の人々の温かさに触れています。\n\nあなたの読書への情熱がここまで私を運んでくれました。一冊一冊の本、一つ一つの単語が、この素晴らしい旅の原動力となっています。学ぶことの喜び、新しい文化に触れる興奮を、あなたと分かち合えることが何よりも嬉しいです。\n\nこの旅はまだ続きますが、今この瞬間の感動をあなたに伝えたくて筆を取りました。\n\n無限の愛と感謝を込めて、\nあなたのネコ",
    en: {
      1: `I am in Beijing now! This old city is very big. I can see old buildings and new buildings together.

I saw the Great Wall! It is so long and high. The Forbidden City has many red buildings. They are very pretty.

People here eat good food. I like the fish and soup. The streets have many bikes and cars.

Your reading brought me to this special place. I am happy to see so many new things here!

Beijing teaches me that old and new can be friends.

Love,
Your Cat`,

      2: `Hello from Beijing! I have arrived in this great old city, and I'm surprised by how old history and modern life exist together so well.

I visited the Great Wall of China today - it's even more amazing than the pictures! The Forbidden City is like going into a different time with its beautiful red buildings and golden roofs. Tiananmen Square is so huge that I felt very small standing in the middle.

The Chinese people are very friendly, and the food is very good. I especially love the Peking duck and meat dishes! Walking through the old streets feels like going back in time.

Your love for reading has brought me to this great place. Every book you finish becomes a step forward in my trip. I'm learning that history and new things can work together well.

This trip continues to surprise me, but I wanted to share this special moment with you!

With love and wonder,
Your Cat`,

      3: `My dear reading friend, I write to you from the historic and culturally rich city of Beijing, where I find myself thinking about the amazing meeting of imperial history and modern development that defines this impressive Chinese capital.

The building story of this city reads like an epic novel covering thousands of years. The Forbidden City stands as proof of the advanced beauty and complex political systems of imperial China, its red walls and golden rooftops creating a visual display that speaks to the artistic success of many generations. The Great Wall, visible from various points throughout the city, serves as a powerful symbol for human determination and the lasting nature of human goals.

What strikes me most deeply is the smooth combination of traditional ideas with practical modernization. Confucian principles of harmony and balance appear not only in the careful protection of historical sites but also in the careful urban planning that allows ancient hutongs to exist alongside modern building projects. The food landscape reflects this same combination - traditional cooking methods produce flavors that honor old recipes while modern presentations introduce new visual elements.

Your strong commitment to reading exploration continues to serve as the driving force for these life-changing experiences. The depth of vocabulary you've built, the story complexity you've learned, and the cultural understanding you've developed through extensive reading have created the foundation for meaningful cross-cultural understanding. Each page you've read has contributed to the knowledge passport that enables this impressive journey.

Beijing has strengthened my belief that true wisdom comes from the respectful conversation between tradition and innovation. As I prepare for the next chapter of our reading journey, I carry with me the deep insights this ancient yet active city has shared.

Until our next letter through the medium of shared reading adventure!

With deep cultural appreciation and continued travel spirit,
Your Cat`
    }
  }
};

/**
 * ユーザーの語彙レベルに応じた手紙を取得（新3段階システム対応）
 */
export function getStaticLetter(city: string, level: number): any | null {
  const cityLower = city.toLowerCase();
  
  if (!staticLetters[cityLower as keyof typeof staticLetters]) {
    console.warn(`No static letter found for city: ${city}`);
    return null;
  }
  
  const letterData = staticLetters[cityLower as keyof typeof staticLetters];
  
  // レベルを1-3の範囲に正規化（旧レベル4/5は新レベル3に丸める）
  const normalizedLevel = level > 3 ? 3 : level < 1 ? 1 : level;
  
  // レベルに対応する英語コンテンツを取得
  const englishContent = letterData.en[normalizedLevel] || letterData.en[1]; // フォールバック: Level 1
  
  return {
    type: letterData.type,
    city: letterData.city,
    cityImage: letterData.cityImage,
    jp: letterData.jp,
    en: englishContent,
    level: normalizedLevel
  };
}

/**
 * 利用可能な都市一覧を取得
 */
export function getAvailableCities(): string[] {
  return Object.keys(staticLetters);
}