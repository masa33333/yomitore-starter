// ✅ Server Component - プリセットストーリー対応
import { Suspense } from 'react';
import ReadingClient from './ReadingClient';
import CatLoader from '@/components/CatLoader';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// フォールバック用Notting Hillストーリー
function getFallbackNotingHillStory(level: number): StoryData {
  const stories = {
    1: {
      title: "Notting Hill (Level 1)",
      story: `Anna works at a small bookstore in London. The store is on Portobello Road in Notting Hill. Every day Anna helps people find books. She likes her job very much.

One day a woman comes into the store. She wears dark glasses and a hat. The woman looks at books about Turkey. Anna thinks she looks familiar but she is not sure.

The woman buys a guidebook. She pays Anna and leaves the store with a small smile. Anna watches her walk away down the busy street.

Later that day Anna goes to buy orange juice. She walks around the corner and bumps into the same woman. The orange juice spills on the woman's white shirt.

"I'm so sorry!" Anna says. She feels very embarrassed. The woman is kind about it. Anna offers to help clean the shirt at her house nearby.

The woman agrees and they walk to Anna's house. There Anna gives her a clean shirt to wear. It says "Get Laid in Iceland" on it. The woman laughs at the funny words.

Before leaving, the woman writes her phone number on a piece of paper. "Maybe we can have coffee sometime," she says. Anna is surprised but happy.

Anna doesn't know yet that the woman is Anna Scott, one of the most famous movie stars in the world.`,
      wordCount: 196
    },
    2: {
      title: "Notting Hill (Level 2)",
      story: `Anna works at a travel bookstore in the colorful area of Notting Hill, London. She enjoys helping customers find books about different countries and cultures. Her small shop is located on the famous Portobello Road, known for its weekend market and antique dealers.

One Tuesday morning, a woman wearing sunglasses and casual clothes enters the bookstore. She browses through books about Turkey and eventually chooses a guidebook. Anna serves her politely, noticing something familiar about the customer but unable to place where she might have seen her before.

After the woman leaves, Anna decides to buy some orange juice from the corner shop. As she turns onto Portobello Road, she accidentally bumps into the same customer from earlier. The juice container bursts, soaking the woman's white blouse with orange liquid.

Feeling terribly embarrassed, Anna apologizes repeatedly and offers her nearby house so the woman can clean up and change clothes. To her surprise, the customer accepts the invitation graciously.

At Anna's modest flat, she searches through her flatmate's wardrobe and finds a clean t-shirt with "Get Laid in Iceland" printed across it. The woman finds this amusing and puts it on without complaint.

As she prepares to leave, Anna gathers her courage and asks if the woman would like to meet for coffee sometime. The visitor pauses, writes her phone number on a scrap of paper, and says "Perhaps."

Anna has no idea that she has just met Anna Scott, one of Hollywood's biggest movie stars, who is in London filming her latest romantic comedy.`,
      wordCount: 247
    },
    3: {
      title: "Notting Hill (Level 3)",
      story: `Anna manages a quaint travel bookstore nestled in the vibrant heart of Notting Hill, where the eclectic mix of antique shops, street vendors, and colorful Victorian houses creates a distinctly bohemian atmosphere. Her establishment specializes in guidebooks and travel literature, attracting adventurous souls planning expeditions to far-flung destinations.

On an unremarkable Tuesday morning, her routine is interrupted by an elegantly dressed woman who enters wearing designer sunglasses and deliberately understated clothing. The customer examines various travel guides with particular interest in Mediterranean destinations before settling on a comprehensive handbook about Turkey's cultural heritage.

Anna processes the transaction professionally, sensing something intriguingly familiar about this sophisticated visitor yet unable to pinpoint the source of recognition. The woman's demeanor suggests someone accustomed to public attention while simultaneously seeking anonymity.

Thirty minutes after the mysterious customer's departure, Anna ventures out to purchase refreshments from the local convenience store. As she navigates the bustling corner of Portobello Road, fate orchestrates an unexpected collision with the same elegantly dressed woman. The impact causes Anna's orange juice container to explode dramatically, drenching the stranger's pristine white designer blouse in sticky citrus liquid.

Mortified by this embarrassing incident, Anna offers profuse apologies and suggests her nearby residence as a solution for cleaning and changing clothes. The woman, displaying remarkable grace under circumstances that would typically provoke irritation, accepts this unusual invitation with surprising equanimity.

Inside Anna's charming but cluttered flat, she rummages through her eccentric Welsh flatmate's wardrobe, eventually locating a clean garment emblazoned with the provocative slogan "Get Laid in Iceland." The sophisticated visitor finds this incongruous fashion statement genuinely amusing and dons it without hesitation.

As the encounter concludes, Anna experiences an uncharacteristic surge of boldness and suggests they might arrange a casual coffee meeting. The woman responds by inscribing her contact information on a fragment of paper, adding cryptically, "That might be interesting."

Anna remains blissfully unaware that she has just hosted Anna Scott, arguably the most photographed actress in contemporary cinema, whose romantic comedies consistently dominate international box office receipts.`,
      wordCount: 318
    }
  };

  const selectedStory = stories[level as keyof typeof stories] || stories[1];
  
  return {
    title: selectedStory.title,
    story: selectedStory.story,
    themes: [`Level ${level}`, `${selectedStory.wordCount} words`, 'Fallback Story'],
    isPreset: true
  };
}

interface StoryData {
  title: string;
  story: string;
  themes?: string[];
  tokens?: string[];
  glossary?: any[];
  isPreset?: boolean;
}

type PageProps = {
  searchParams?: Promise<{
    slug?: string;      // プリセットストーリー用
    mode?: string;
    genre?: string;
    tone?: string;
    feeling?: string;
    level?: string;
    topic?: string;
    theme?: string;
    emotion?: string;
    style?: string;
  }>;
};

export default async function ReadingPage({ searchParams }: PageProps) {
  // searchParamsはPromiseなのでawaitで解決
  const params = (await searchParams) || {};
  console.log('🏗️ Server Component executing with params:', params);
  
  const { slug } = params;
  const mode = params.mode || 'reading';
  const isStoryMode = mode === 'story';
  const isPresetMode = !!slug;
  
  // サーバーサイドでデータを取得
  let initialData: StoryData | null = null;

  // プリセットストーリーの場合
  if (isPresetMode && slug) {
    try {
      // ユーザーのレベルを取得（デフォルト: 1）
      const userLevel = parseInt(params.level || '1');
      
      console.log(`📚 プリセットストーリー取得: ${slug}, Level: ${userLevel}`);
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('slug', slug)
        .eq('level', userLevel)
        .single();

      if (error) {
        console.error('❌ プリセットストーリー取得エラー:', error);
        console.log('📖 フォールバックストーリーを使用します');
        
        // フォールバックストーリーを生成
        const fallbackStory = getFallbackNotingHillStory(userLevel);
        initialData = fallbackStory;
      } else if (data) {
        // tokensを文字列に結合してstoryとして使用
        const storyText = data.tokens.join('');
        
        initialData = {
          title: data.title,
          story: storyText,
          tokens: data.tokens,
          glossary: data.glossary || [],
          isPreset: true,
          themes: [`Level ${data.level}`]
        };
        
        console.log('✅ プリセットストーリー取得成功:', {
          title: data.title,
          level: data.level,
          wordCount: data.word_count,
          tokensLength: data.tokens.length
        });
      }
    } catch (error) {
      console.error('❌ プリセットストーリー取得失敗:', error);
      console.log('📖 catchブロックからフォールバックストーリーを使用します');
      
      // 例外発生時もフォールバックストーリーを使用
      const fallbackStory = getFallbackNotingHillStory(parseInt(params.level || '1'));
      initialData = fallbackStory;
    }
  }
  
  if (isStoryMode) {
    const { genre, tone, feeling } = params;
    
    if (genre && tone && feeling) {
      // フォールバック用テストデータ（クライアントサイドでAPI生成に置き換え）
      initialData = {
        title: `${genre} Story`,
        story: `This captivating ${genre} story unfolds with a distinctly ${tone} atmosphere, carefully crafted to evoke deep feelings of ${feeling} in every reader who embarks on this remarkable literary journey. Our protagonist begins their extraordinary adventure in a quiet, seemingly ordinary village nestled between rolling hills and ancient forests, where life moves at a peaceful pace and everyone knows their neighbors by name. However, beneath this tranquil surface lies a mysterious secret that has remained hidden for generations, waiting for the right person to uncover its truth.

As days pass and our character settles into the rhythm of village life, they begin to notice subtle signs that something extraordinary is hidden just beyond their everyday experiences. Strange sounds echo through the night, peculiar lights dance in the distant woods, and the elderly villagers speak in hushed whispers about legends that most dismiss as mere folklore. When an unexpected discovery changes everything they thought they knew about their new home, our protagonist must find the courage to investigate further, despite the warnings and fears of those around them.

The climax arrives when our hero faces their greatest challenge yet, a moment that tests not only their physical abilities but also their deepest convictions and moral compass. Through determination, clever thinking, and the support of unlikely allies they've met along the way, they navigate through seemingly impossible obstacles and emerge from this transformative experience as a completely different person. The resolution brings not only personal growth but also positive change to the entire community, proving that even the most ordinary individuals can accomplish extraordinary things when they have the courage to pursue what matters most.`,
        themes: [genre, tone, feeling]
      };
      
      console.log('✅ ストーリー用静的データ準備:', {
        title: initialData.title,
        storyLength: initialData.story.length
      });
    }
  } else {
    // 読み物モード - 静的フォールバックデータ
    const { topic } = params;
    
    if (topic) {
      initialData = {
        title: `About ${topic}`,
        story: `This comprehensive reading material explores the fascinating world of ${topic}, offering insights that will significantly expand your understanding of this important subject. In today's rapidly evolving world, knowledge about ${topic} has become increasingly valuable for both personal growth and professional development. Researchers and experts have dedicated countless hours to studying various aspects of ${topic}, uncovering remarkable discoveries that continue to shape our understanding of this field.

The historical development of ${topic} reveals a rich tapestry of innovation, breakthrough moments, and transformative changes that have influenced societies across the globe. From its early origins to modern applications, ${topic} has evolved dramatically, incorporating new technologies, methodologies, and perspectives that have revolutionized how we approach this subject. Scientists, scholars, and practitioners have contributed valuable research that has opened new possibilities and created exciting opportunities for future exploration.

Understanding ${topic} provides numerous practical benefits that extend far beyond academic interest. This knowledge empowers individuals to make informed decisions, solve complex problems, and contribute meaningfully to their communities and professional environments. As we continue to advance in the 21st century, expertise in ${topic} will become even more crucial for navigating the challenges and opportunities that lie ahead, making this an essential area of study for learners of all ages and backgrounds.`,
        themes: ['Learning', 'Knowledge', 'Education']
      };
      
      console.log('✅ 読み物用静的データ準備:', {
        title: initialData.title,
        storyLength: initialData.story.length
      });
    }
  }
  
  console.log('✅ Server Component data prepared:', {
    mode,
    hasInitialData: !!initialData,
    title: initialData?.title
  });
  
  return (
    <Suspense fallback={<CatLoader />}>
      <ReadingClient 
        searchParams={params}
        initialData={initialData}
        mode={mode}
      />
    </Suspense>
  );
}