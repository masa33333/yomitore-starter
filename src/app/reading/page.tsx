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
    // ユーザーの語彙レベルを取得（デフォルト3）
    const userLevel = params.level || '3';
    
    if (genre && tone && feeling) {
      // 実際のOpenAI APIでストーリー生成を試行
      try {
        const { OpenAI } = await import('openai');
        
        if (process.env.OPENAI_API_KEY) {
          console.log('🚀 OpenAI APIでストーリー生成開始');
          
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
          
          // NGSL基準の語彙レベル制約テンプレート取得
          const { getPromptTemplate } = await import('@/constants/promptTemplates');
          const promptTemplate = getPromptTemplate(parseInt(userLevel));
          
          const systemMessage = `You are an expert English creative writer specializing in NGSL vocabulary control.`;
          
          const userPrompt = `${promptTemplate}

ジャンル: ${genre}
感情: ${feeling}
トーン: ${tone}
主人公: 女性

Create a story with the above genre/feeling/tone, following Level ${userLevel} vocabulary constraints.

Output in this exact JSON format:
{
  "title": "[Story Title]",
  "content": [
    "[Paragraph 1: Setup]",
    "[Paragraph 2: Development]",
    "[Paragraph 3: Conflict]",
    "[Paragraph 4: Resolution]",
    "[Paragraph 5: Conclusion]"
  ],
  "themes": ["[Theme 1]", "[Theme 2]", "[Theme 3]"]
}

CRITICAL: Follow ALL NGSL vocabulary constraints. Every word must be within the specified range.`;

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo-0125',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            // Markdownコードブロックを除去してから解析
            const cleanContent = content
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();
            
            const storyData = JSON.parse(cleanContent);
            
            // contentが配列の場合は結合、文字列の場合はそのまま
            const story = Array.isArray(storyData.content) 
              ? storyData.content.join('\n\n')
              : storyData.content;
            
            initialData = {
              title: storyData.title,
              story,
              themes: storyData.themes || []
            };
            
            console.log('✅ OpenAI APIストーリー生成成功:', {
              title: initialData.title,
              storyLength: initialData.story.length,
              themesCount: initialData.themes?.length || 0
            });
          }
        }
      } catch (error) {
        console.error('❌ OpenAI APIエラー、テストデータにフォールバック:', error);
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
        const { OpenAI } = await import('openai');
        
        if (process.env.OPENAI_API_KEY) {
          console.log('🚀 OpenAI APIで読み物生成開始');
          
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
          
          // NGSL基準の語彙レベル制約テンプレート取得
          const { getPromptTemplate } = await import('@/constants/promptTemplates');
          const promptTemplate = getPromptTemplate(parseInt(userLevel));
          
          const systemMessage = `You are an expert English educational content writer. Follow NGSL vocabulary guidelines exactly.`;
          
          const userPrompt = `${promptTemplate}

テーマ: ${topic}

Create reading material about "${topic}" following the Level ${userLevel} constraints above.

Output in this exact JSON format:
{
  "title": "[Title about ${topic}]",
  "content": [
    "[Paragraph 1]",
    "[Paragraph 2]", 
    "[Paragraph 3]",
    "[Paragraph 4]",
    "[Paragraph 5]"
  ],
  "themes": ["[Theme 1]", "[Theme 2]", "[Theme 3]"]
}

CRITICAL: Follow ALL vocabulary constraints. Every word must be within the specified NGSL range.`;

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo-0125',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            // Markdownコードブロックを除去してから解析
            const cleanContent = content
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();
            
            const readingData = JSON.parse(cleanContent);
            
            // contentが配列の場合は結合、文字列の場合はそのまま
            const story = Array.isArray(readingData.content) 
              ? readingData.content.join('\n\n')
              : readingData.content;
            
            initialData = {
              title: readingData.title,
              story,
              themes: readingData.themes || []
            };
            
            console.log('✅ OpenAI API読み物生成成功:', {
              title: initialData.title,
              storyLength: initialData.story.length,
              themesCount: initialData.themes?.length || 0
            });
          }
        }
      } catch (error) {
        console.error('❌ OpenAI APIエラー、テストデータにフォールバック:', error);
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