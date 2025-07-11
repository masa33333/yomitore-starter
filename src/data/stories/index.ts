/**
 * Stories データ統合インデックス
 */

import { bucketListStory, bucketListInfo, type StoryContent } from './bucket-list';

// 既存のNotting Hillデータとの統合を考慮した型定義
export interface StoryMetadata {
  slug: string;
  title: string;
  englishTitle: string;
  genre: string;
  year?: number;
  description: string;
  themes: string[];
}

// 利用可能なストーリー一覧
export const availableStories: StoryMetadata[] = [
  {
    slug: 'notting-hill',
    title: 'ノッティングヒルの恋人',
    englishTitle: 'Notting Hill',
    genre: 'Romance',
    year: 1999,
    description: '普通の書店員と世界的な女優の恋愛を描いたロマンティック・コメディ',
    themes: ['romance', 'comedy', 'celebrity', 'ordinary life']
  },
  bucketListInfo
];

// 新しいレベル対応ストーリーデータ
export const levelBasedStories = {
  'bucket-list': bucketListStory
};

/**
 * レベル対応ストーリーを取得
 */
export function getStoryBySlugAndLevel(slug: string, level: number): StoryContent | null {
  const stories = levelBasedStories[slug as keyof typeof levelBasedStories];
  if (!stories) return null;
  
  return stories.find(story => story.level === level) || null;
}

/**
 * ストーリーの全レベルを取得
 */
export function getAllLevelsForStory(slug: string): StoryContent[] {
  const stories = levelBasedStories[slug as keyof typeof levelBasedStories];
  return stories || [];
}

/**
 * ストーリーメタデータを取得
 */
export function getStoryMetadata(slug: string): StoryMetadata | null {
  return availableStories.find(story => story.slug === slug) || null;
}

/**
 * レベル対応ストーリーかどうかを判定
 */
export function isLevelBasedStory(slug: string): boolean {
  return slug in levelBasedStories;
}

// 旧システムとの互換性のためのエクスポート
export { bucketListStory, bucketListInfo };
export type { StoryContent };