// ✅ Server Component - プリセットストーリー対応
import { Suspense } from 'react';
import ReadingClient from './ReadingClient';
import CatLoader from '@/components/CatLoader';
import { createClient } from '@supabase/supabase-js';
import { getNotingHillStory as getStaticStory } from '@/data/nottingHillStories';

// 動的ページとして設定（searchParamsを使用するため）
export const dynamic = 'force-dynamic';

// Supabaseクライアントの初期化は実際に必要な時だけ行う
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase環境変数が設定されていません - フォールバック使用');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

// 静的データからNotting Hillストーリーを取得する関数
async function getNotingHillStory(level: number): Promise<StoryData> {
  try {
    console.log(`📖 Loading static Notting Hill story for level ${level}`);
    
    const content = getStaticStory(level);
    
    if (!content) {
      throw new Error(`No story content found for level ${level}`);
    }
    
    console.log(`✅ Static story loaded successfully (${content.length} chars)`);
    
    const formattedContent = formatChapterContent(content);
    const wordCount = content.split(/\s+/).filter(word => word.trim()).length;
    
    return {
      title: `Notting Hill (Level ${level})`,
      story: formattedContent,
      themes: [`Level ${level}`, `${wordCount} words`, 'Static Story Data'],
      isPreset: true
    };
  } catch (error) {
    console.error(`❌ Failed to load static story:`, error);
    
    return {
      title: `Notting Hill (Level ${level}) - Load Error`,
      story: `Unable to load story content. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      themes: [`Level ${level}`, 'Load Error'],
      isPreset: true
    };
  }
}

// チャプタータイトルをフォーマットする関数
function formatChapterContent(content: string): string {
  const lines = content.split('\n');
  const formattedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      formattedLines.push(''); // 空行は保持
      continue;
    }
    
    // **マーカーでチャプタータイトルを検出
    if (trimmedLine.startsWith('**')) {
      const chapterTitle = trimmedLine.substring(2); // **を削除
      formattedLines.push(`**${chapterTitle}**`); // 太字用のマークダウンとして保持
    }
    // --マーカーで本文を検出
    else if (trimmedLine.startsWith('--')) {
      const chapterContent = trimmedLine.substring(2); // --を削除
      formattedLines.push(''); // チャプタータイトルとの間に空行
      formattedLines.push(chapterContent);
    }
    // その他の行（継続する本文など）
    else {
      formattedLines.push(trimmedLine);
    }
  }
  
  return formattedLines.join('\n');
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
  searchParams?: {
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
  };
};

export default async function ReadingPage({ searchParams }: PageProps) {
  // searchParamsは同期的にアクセス
  const params = searchParams || {};
  console.log('🏗️ Server Component executing with params:', params);
  
  const { slug } = params;
  const mode = params.mode || 'reading';
  const isStoryMode = mode === 'story';
  const isPresetMode = !!slug;
  
  // サーバーサイドでデータを取得
  let initialData: StoryData | null = null;

  // プリセットストーリーの場合
  if (isPresetMode && slug) {
    // ユーザーのレベルを取得（デフォルト: 1）
    const userLevel = parseInt(params.level || '1');
    
    console.log(`📚 プリセットストーリー要求: ${slug}, Level: ${userLevel}`);
    
    // notting-hillの場合は実際のファイルから読み込み
    if (slug === 'notting-hill') {
      console.log('📖 Notting Hill 実際のファイルから読み込み');
      const storyFromFile = await getNotingHillStory(userLevel);
      initialData = storyFromFile;
    } else {
      // 他のストーリーの場合は将来的にSupabaseから取得
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        console.log('📖 Supabase利用不可 - 直接フォールバック使用');
        const fallbackStory = await getNotingHillStory(userLevel);
        initialData = fallbackStory;
      } else {
        try {
          console.log('🔍 Supabaseからストーリー取得を試行中...');
          const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('slug', slug)
            .eq('level', userLevel)
            .single();

          if (error || !data) {
            console.warn('❌ Supabase取得失敗、フォールバック使用:', error?.message);
            const fallbackStory = await getNotingHillStory(userLevel);
            initialData = fallbackStory;
          } else {
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
          console.log('📖 catchブロックからフォールバックストーリーを使用');
          
          // 例外発生時もフォールバックストーリーを使用
          const fallbackStory = await getNotingHillStory(userLevel);
          initialData = fallbackStory;
        }
      }
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