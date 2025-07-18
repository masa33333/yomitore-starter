/**
 * サーバーサイド専用ストーリーローダー
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Front Matterを解析する関数
 */
function parseFrontMatter(content: string): { metadata: Record<string, any>; body: string } {
  const lines = content.split('\n');
  if (lines[0] !== '---') {
    return { metadata: {}, body: content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { metadata: {}, body: content };
  }

  const frontMatterLines = lines.slice(1, endIndex);
  const metadata: Record<string, any> = {};
  frontMatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value: any = line.substring(colonIndex + 1).trim();
      // 数値やブーリアンに変換
      if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
        value = Number(value);
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      }
      metadata[key] = value;
    }
  });

  const body = lines.slice(endIndex + 1).join('\n').trim();
  return { metadata, body };
}

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
  },
  'river_stream/ep1': {
    title: 'River Stream',
    englishTitle: 'River Stream'
  }
};

/**
 * サーバーサイドでテキストファイルからストーリーを読み込む
 */
export async function loadStoryFromFileServer(slug: string, level: number): Promise<StoryData> {
  console.log(`[loadStoryFromFileServer] Attempting to load slug: ${slug}, level: ${level}`);
  try {
    let filePath: string;
    let content: string;
    let title: string;
    let themes: string[] = [];

    if (slug.startsWith('toeic/')) {
      // TOEICパッセージの場合
      const toeicId = slug.replace('toeic/', '');
      filePath = path.join(process.cwd(), 'content', 'toeic', `${toeicId}.md`);
      console.log(`[loadStoryFromFileServer] TOEIC path constructed: ${filePath}`);
      
      content = await fs.readFile(filePath, 'utf-8');
      const { metadata, body } = parseFrontMatter(content);
      
      title = metadata.title || `TOEIC Passage ${toeicId.replace('passage', '')}`;
      content = body; // 本文のみを使用
      themes.push('TOEIC', `Passage ${toeicId.replace('passage', '')}`);

    } else {
      // 既存のストーリーの場合
      filePath = path.join(process.cwd(), 'public', 'stories', slug, `level${level}.txt`);
      console.log(`[loadStoryFromFileServer] Standard story path constructed: ${filePath}`);
      
      content = await fs.readFile(filePath, 'utf-8');
      
      // HTMLコメントを除去してフォーマット
      const cleanContent = content
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();
      
      // * と - のマーカーをフォーマット
      content = formatChapterContent(cleanContent);
      
      const metadata = storyMetadata[slug];
      title = metadata 
        ? `${metadata.title} (Level ${level})` 
        : `${slug} (Level ${level})`;
      themes.push(`Level ${level}`, slug, 'file-based');
    }
    
    if (!content || content.trim() === '') {
      throw new Error(`Story file is empty or contains only comments: ${filePath}`);
    }
    
    console.log(`[loadStoryFromFileServer] Successfully loaded story: ${title}, ${content.length} characters`);
    
    return {
      title,
      story: content,
      themes,
      isPreset: true
    };
    
  } catch (error) {
    console.error(`[loadStoryFromFileServer] Failed to load story for slug: ${slug}, level: ${level}. Raw error:`, error);
    
    // エラー時のフォールバックパスを正確に表示
    let attemptedFilePath: string;
    if (slug.startsWith('toeic/')) {
      attemptedFilePath = path.join(process.cwd(), 'content', 'toeic', `${slug.replace('toeic/', '')}.md`);
    } else {
      attemptedFilePath = path.join(process.cwd(), 'public', 'stories', slug, `level${level}.txt`);
    }

    let fallbackTitle: string;
    if (slug.startsWith('toeic/')) {
      fallbackTitle = `TOEIC Passage ${slug.replace('toeic/passage', '')} - Load Error`;
    } else {
      const metadata = storyMetadata[slug];
      fallbackTitle = metadata 
        ? `${metadata.title} (Level ${level}) - Load Error` 
        : `${slug} (Level ${level}) - Load Error`;
    }
    
    return {
      title: fallbackTitle,
      story: `ストーリーの読み込みに失敗しました。

ファイルパス: ${attemptedFilePath}
エラー詳細: ${error instanceof Error ? error.message : 'Unknown error'}

実際のテキストファイルが配置されているか確認してください。`,
      themes: ['Load Error'],
      isPreset: true
    };
  }
}