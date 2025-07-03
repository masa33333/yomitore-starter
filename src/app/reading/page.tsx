// ✅ Server Component - まずはシンプルな構造でテスト
import { Suspense } from 'react';
import ReadingClient from './ReadingClient';
import CatLoader from '@/components/CatLoader';

interface StoryData {
  title: string;
  story: string;
  themes?: string[];
}

type PageProps = {
  searchParams?: Promise<{
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
  
  const mode = params.mode || 'reading';
  const isStoryMode = mode === 'story';
  
  // サーバーサイドでは静的データのみ使用、API呼び出しはクライアントサイドで実行
  let initialData: StoryData | null = null;
  
  if (isStoryMode) {
    const { genre, tone, feeling } = params;
    
    if (genre && tone && feeling) {
      // フォールバック用テストデータ（クライアントサイドでAPI生成に置き換え）
      initialData = {
        title: `${genre} Story`,
        story: `This is a ${genre} story with a ${tone} tone that should evoke ${feeling}. The character begins their journey in a small village. Soon, they discover something unexpected that changes everything. They must overcome challenges and face their fears. The climax brings the most difficult moment. Finally, they emerge transformed and stronger than before.`,
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
        story: `This reading material covers important aspects of ${topic}. Understanding this subject can help improve your knowledge and broaden your perspective. There are many interesting facts and practical applications to explore. Learning about different topics helps develop critical thinking skills. Reading diverse materials is an excellent way to expand your vocabulary and comprehension abilities.`,
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