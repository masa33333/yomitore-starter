import { NextResponse } from 'next/server';
import fs from 'fs/promises'; // fs.promisesを使用
import path from 'path';

export async function GET() {
  const passagesDirectory = path.join(process.cwd(), 'content', 'toeic');
  console.log(`[API] Attempting to read directory: ${passagesDirectory}`);

  try {
    const fileNames = await fs.readdir(passagesDirectory); // awaitを追加
    console.log(`[API] Found files: ${fileNames.join(', ')}`);

    const passages = fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map((fileName) => {
        const id = fileName.replace(/\.md$/, '');
        const parts = id.split('_level');
        const baseId = parts[0];
        const level = parts.length > 1 ? parseInt(parts[1], 10) : 3; // デフォルトはレベル3

        const title = `TOEIC Passage ${baseId.replace('passage', '')} (Level ${level})`;
        const description = 'This is a TOEIC practice passage.';
        const slug = `toeic/${id}`;
        console.log(`[API] Processed passage: ${fileName} -> ${JSON.stringify({ id, title, description, slug, level })}`);
        return { id, title, description, slug, level };
      })
      .sort((a, b) => {
        // passage番号でソートし、次にレベルでソート
        const numA = parseInt(a.id.replace('passage', '').split('_level')[0], 10);
        const numB = parseInt(b.id.replace('passage', '').split('_level')[0], 10);
        if (numA !== numB) {
          return numA - numB;
        }
        return a.level - b.level;
      });

    console.log(`[API] Returning ${passages.length} passages.`);
    return NextResponse.json(passages);
  } catch (error) {
    console.error(`[API] Failed to read TOEIC passages directory: ${error}`);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
