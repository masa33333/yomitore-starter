/**
 * ストーリーテキストファイル読み込みシステム
 * public/stories/{slug}/level{N}.txt からストーリーを読み込む
 */

export interface StoryData {
  title: string;
  story: string;
  themes?: string[];
  isPreset?: boolean;
}

/**
 * ストーリーメタデータ
 */
export const storyMetadata: Record<string, { title: string; englishTitle: string }> = {
  'notting-hill': {
    title: 'ノッティングヒルの恋人',
    englishTitle: 'Notting Hill'
  },
  'bucket-list': {
    title: '最高の人生の見つけ方',
    englishTitle: 'The Bucket List'
  }
};

/**
 * テキストファイルからストーリーを読み込む
 * @param slug ストーリーのスラッグ (例: 'bucket-list')
 * @param level レベル (1, 2, 3)
 */
export async function loadStoryFromFile(slug: string, level: number): Promise<StoryData> {
  try {
    const filePath = `/stories/${slug}/level${level}.txt`;
    console.log(`📁 Loading story from file: ${filePath}`);
    
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load story file: ${response.status} ${response.statusText}`);
    }
    
    const content = await response.text();
    
    // HTMLコメントを除去
    const cleanContent = content
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    
    if (!cleanContent) {
      throw new Error(`Story file is empty or contains only comments: ${filePath}`);
    }
    
    const metadata = storyMetadata[slug];
    const title = metadata 
      ? `${metadata.title} (Level ${level})` 
      : `${slug} (Level ${level})`;
    
    console.log(`✅ Successfully loaded story: ${title}, ${cleanContent.length} characters`);
    
    return {
      title,
      story: cleanContent,
      themes: [`Level ${level}`, slug, 'file-based'],
      isPreset: true
    };
    
  } catch (error) {
    console.error(`❌ Failed to load story ${slug} level ${level}:`, error);
    
    // エラー時のフォールバック
    const metadata = storyMetadata[slug];
    const title = metadata 
      ? `${metadata.title} (Level ${level}) - Load Error` 
      : `${slug} (Level ${level}) - Load Error`;
    
    return {
      title,
      story: `ストーリーの読み込みに失敗しました。\n\nファイルパス: /public/stories/${slug}/level${level}.txt\nエラー: ${error instanceof Error ? error.message : 'Unknown error'}\n\n実際のテキストファイルが配置されているか確認してください。`,
      themes: [`Level ${level}`, 'Load Error'],
      isPreset: true
    };
  }
}

/**
 * ストーリーファイルが存在するかチェック
 * @param slug ストーリーのスラッグ
 * @param level レベル
 */
export async function checkStoryFileExists(slug: string, level: number): Promise<boolean> {
  try {
    const filePath = `/stories/${slug}/level${level}.txt`;
    const response = await fetch(filePath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 利用可能なストーリー一覧を取得
 */
export function getAvailableStories() {
  return Object.entries(storyMetadata).map(([slug, meta]) => ({
    slug,
    title: `${meta.title} (${meta.englishTitle})`,
    englishTitle: meta.englishTitle,
    japaneseTitle: meta.title
  }));
}