import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface SaveRequest {
  passageId: string;
  level: number;
  data: {
    id: string;
    level: number;
    english: string;
    japanese: string;
    wordCount: number;
    generatedAt: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: SaveRequest = await request.json();
    const { passageId, level, data } = body;

    // ファイル名を生成
    const fileName = `${passageId}_level${level}.json`;
    const filePath = path.join(process.cwd(), 'content', 'toeic', fileName);

    // ディレクトリが存在しない場合は作成
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // JSONファイルとして保存
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✅ Saved TOEIC passage: ${fileName}`);

    return NextResponse.json({ 
      success: true, 
      message: `Passage saved as ${fileName}` 
    });
  } catch (error) {
    console.error('Error saving TOEIC passage:', error);
    return NextResponse.json(
      { error: 'Failed to save passage' },
      { status: 500 }
    );
  }
}