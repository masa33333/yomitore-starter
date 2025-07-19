import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface ToeicPassage {
  id: string;
  title: string;
  description: string;
  slug: string;
  level: number;
  content?: string;
  japanese?: string;
  wordCount?: number;
}

// TOEICパッセージのメタデータ
const PASSAGE_METADATA = [
  {
    id: 'toeic-passage-1',
    title: 'Green Bin Initiative',
    description: 'Oakfield city introduces new recycling program',
    slug: 'toeic/toeic-passage-1',
    filename: 'passage1'
  },
  {
    id: 'toeic-passage-2', 
    title: 'Autonomous Warehouse Robot',
    description: 'TechPulse Magazine: Innovate Robotics launches new product',
    slug: 'toeic/toeic-passage-2',
    filename: 'passage2'
  },
  {
    id: 'toeic-passage-3',
    title: 'Global Tourism Trends',
    description: 'Excerpt from Global Tourism Outlook 2025 Report',
    slug: 'toeic/toeic-passage-3', 
    filename: 'passage3'
  }
];

// パッセージファイルを読み込む関数
async function readPassageFile(filename: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'content', 'toeic', filename);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading passage file ${filename}:`, error);
    return null;
  }
}

// 語数をカウントする関数
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// レベル別JSONファイルを読み込む関数
async function readLeveledPassageFile(passageId: string, level: number): Promise<any | null> {
  try {
    const fileName = `${passageId}_level${level}.json`;
    const filePath = path.join(process.cwd(), 'content', 'toeic', fileName);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log(`Level ${level} file not found for ${passageId}, will use original or generate`);
    return null;
  }
}

// オンデマンド生成を行う関数
async function generatePassageIfNeeded(metadata: any, level: number, originalContent: string): Promise<ToeicPassage> {
  // Level 3は原文をそのまま使用
  if (level === 3) {
    return {
      ...metadata,
      level,
      content: originalContent,
      wordCount: countWords(originalContent)
    };
  }

  // レベル別ファイルの存在確認
  const existingData = await readLeveledPassageFile(metadata.id, level);
  
  if (existingData) {
    return {
      ...metadata,
      level,
      content: existingData.english,
      japanese: existingData.japanese,
      wordCount: existingData.wordCount
    };
  }

  // 生成が必要な場合は原文を返す（今後改善予定）
  console.log(`🚧 Level ${level} passage for ${metadata.id} needs generation`);
  return {
    ...metadata,
    level,
    content: originalContent,
    wordCount: countWords(originalContent)
  };
}

// レベル別のパッセージデータを取得する関数
async function getPassageData(level: number): Promise<ToeicPassage[]> {
  const passages: ToeicPassage[] = [];
  
  for (const metadata of PASSAGE_METADATA) {
    const originalContent = await readPassageFile(metadata.filename);
    
    if (!originalContent) {
      passages.push({
        ...metadata,
        level,
        content: 'Content not found',
        wordCount: 0
      });
      continue;
    }

    const passage = await generatePassageIfNeeded(metadata, level, originalContent);
    passages.push(passage);
  }
  
  return passages;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const level = parseInt(url.searchParams.get('level') || '3');

    console.log(`[TOEIC API] Requested level: ${level}`);

    // レベルの検証
    if (level < 1 || level > 3) {
      return NextResponse.json(
        { error: 'Invalid level. Must be 1, 2, or 3.' },
        { status: 400 }
      );
    }

    const passages = await getPassageData(level);
    
    console.log(`[TOEIC API] Returning ${passages.length} passages for level ${level}`);
    return NextResponse.json(passages);
  } catch (error) {
    console.error('Error in TOEIC passages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
