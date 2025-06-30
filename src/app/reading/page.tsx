// ✅ Server Component - まずはシンプルな構造でテスト
import { Suspense } from 'react';
import ReadingClient from './ReadingClient';
import CatLoader from '@/components/CatLoader';

interface StoryData {
  title: string;
  story: string;
  themes?: string[];
}

interface ReadingPageProps {
  searchParams: {
    mode?: string;
    genre?: string;
    tone?: string;
    feeling?: string;
    level?: string;
    topic?: string;
    emotion?: string;
    style?: string;
  };
}

export default async function ReadingPage({ searchParams }: ReadingPageProps) {
  // Next.js 15対応: searchParamsをawait
  const params = await searchParams;
  console.log('🏗️ Server Component executing with params:', params);
  
  const mode = params.mode || 'reading';
  const isStoryMode = mode === 'story';
  
  // まずはテスト用のダミーデータで動作確認
  let initialData: StoryData | null = null;
  
  if (isStoryMode) {
    const { genre, tone, feeling } = params;
    // ユーザーの語彙レベルを取得（デフォルト3）- 生成レベル（1-5）を使用
    const userLevel = params.level || '3';
    
    if (genre && tone && feeling) {
      // 専用のストーリー生成APIを使用
      try {
        console.log('🚀 ストーリー生成API呼び出し開始');
        console.log('📊 Server Component: 生成レベル使用:', userLevel);
        
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-reading`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentType: 'story',
            level: parseInt(userLevel), // これは既に生成レベル（1-5）のはず
            storyData: {
              genre: genre,
              tone: tone,
              feeling: feeling
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`API response not ok: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 ストーリー生成API応答:', data);

        if (data.english) {
          // APIからタイトルが返された場合はそれを使用、なければフォールバック
          const storyTitle = data.title || `${genre} Story`;
          
          initialData = {
            title: storyTitle,
            story: data.english,
            themes: [genre, tone, feeling]
          };
          
          console.log('✅ ストーリー生成成功:', {
            title: initialData.title,
            storyLength: initialData.story.length,
            hasJapanese: !!data.japanese
          });
        }
      } catch (error) {
        console.error('❌ ストーリー生成APIエラー、テストデータにフォールバック:', error);
      }
      
      // OpenAI失敗時またはAPI未設定時のフォールバック
      if (!initialData) {
        initialData = {
          title: `Test Story: ${genre} ${tone}`,
          story: `This is a test story about ${genre} with a ${tone} tone that should evoke ${feeling}. The character begins their journey in a small village. Soon, they discover something unexpected that changes everything. They must overcome challenges and face their fears. The climax brings the most difficult moment. Finally, they emerge transformed and stronger than before.`,
          themes: ['Adventure', 'Growth', 'Discovery']
        };
        
        console.log('✅ フォールバック用テストデータ準備:', {
          title: initialData.title,
          storyLength: initialData.story.length
        });
      }
    }
  } else {
    // 読み物モード - 実際のコンテンツ生成
    const { topic } = params;
    // ユーザーの語彙レベルを取得（デフォルト3）
    const userLevel = params.level || '3';
    
    if (topic) {
      try {
        console.log('🚀 読み物生成API呼び出し開始');
        
        // 専用の読み物生成APIを使用
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-reading`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentType: 'reading',
            level: parseInt(userLevel),
            topic: topic,
            style: '専門家がやさしく説明'
          }),
        });

        if (!response.ok) {
          throw new Error(`API response not ok: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 読み物生成API応答:', data);

        if (data.english) {
          initialData = {
            title: `About ${topic}`,
            story: data.english,
            themes: ['Learning', 'Knowledge', 'Education']
          };
          
          console.log('✅ 読み物生成成功:', {
            title: initialData.title,
            storyLength: initialData.story.length,
            hasJapanese: !!data.japanese
          });
        }
      } catch (error) {
        console.error('❌ 読み物生成APIエラー、テストデータにフォールバック:', error);
      }
    }
    
    // OpenAI失敗時またはAPI未設定時のフォールバック
    if (!initialData) {
      initialData = {
        title: `About ${topic || 'General Reading'}`,
        story: `This reading material covers important aspects of ${topic || 'general topics'}. Understanding this subject can help improve your knowledge and broaden your perspective. There are many interesting facts and practical applications to explore. Learning about different topics helps develop critical thinking skills. Reading diverse materials is an excellent way to expand your vocabulary and comprehension abilities.`,
        themes: ['Learning', 'Knowledge', 'Education']
      };
      
      console.log('✅ フォールバック用読み物データ準備:', {
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