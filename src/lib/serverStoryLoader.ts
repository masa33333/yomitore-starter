/**
 * サーバーサイド専用ストーリーローダー
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * チャプタータイトルをフォーマットする関数
 * * マーカーはチャプタータイトル、- マーカーは本文開始
 */
function formatChapterContent(content: string): string {
  const lines = content.split('\n');
  const formattedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      formattedLines.push(''); // 空行は保持
      continue;
    }
    
    // * マーカーでチャプタータイトルを検出
    if (trimmedLine.startsWith('*')) {
      const chapterTitle = trimmedLine.substring(1).trim(); // * を削除
      formattedLines.push(`**${chapterTitle}**`); // 太字用のマークダウンとして保持
    }
    // - マーカーで本文を検出
    else if (trimmedLine.startsWith('-')) {
      const chapterContent = trimmedLine.substring(1).trim(); // - を削除
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
 * サーバーサイドでテキストファイルからストーリーを読み込む
 */
export async function loadStoryFromFileServer(slug: string, level: number): Promise<StoryData> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'stories', slug, `level${level}.txt`);
    console.log(`📁 Loading story from server file system: ${filePath}`);
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    // HTMLコメントを除去してフォーマット
    const cleanContent = content
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    
    // * と - のマーカーをフォーマット
    const formattedContent = formatChapterContent(cleanContent);
    
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
      story: formattedContent,
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
      story: `ストーリーの読み込みに失敗しました。\n\nファイルパス: ${path.join(process.cwd(), 'public', 'stories', slug, `level${level}.txt`)}\nエラー: ${error instanceof Error ? error.message : 'Unknown error'}\n\n実際のテキストファイルが配置されているか確認してください。`,
      themes: [`Level ${level}`, 'Load Error'],
      isPreset: true
    };
  }
}