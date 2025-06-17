import { NextRequest, NextResponse } from 'next/server';
import { getRoutePoints } from '@/lib/routes';
import { buildDiaryPrompt } from '@/lib/prompts';
import { callClaudeAPI } from '@/lib/claude';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const levelParam = searchParams.get('level');
  console.log('📝 Diary API - Received ID:', id, 'Level:', levelParam);

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  // レベルのバリデーション
  const validLevels: ('A1' | 'A2' | 'B1' | 'B2')[] = ['A1', 'A2', 'B1', 'B2'];
  const level = levelParam && validLevels.includes(levelParam as any) 
    ? (levelParam as 'A1' | 'A2' | 'B1' | 'B2')
    : 'B1'; // デフォルト

  try {
    const routePoints = getRoutePoints();
    const waypoint = routePoints.find(w => w.id === id);

    if (!waypoint) {
      console.error('🚨 Waypoint not found for id:', id);
      return NextResponse.json({ error: 'Waypoint not found' }, { status: 404 });
    }

    console.log('📚 Using CEFR level:', level);
    const prompt = buildDiaryPrompt(waypoint, level);
    const result = await callClaudeAPI(prompt);

    // diary オブジェクト全体を構築
    const diary = {
      id: id,
      location: waypoint.name,
      createdAt: new Date().toISOString(),
      en: result.en,
      jp: result.jp,
      photoTier: result.photoTier || 'stock'
    };

    console.log('📝 Returning diary object:', diary);

    // diary オブジェクトをラップして返す
    return NextResponse.json({ diary });
  } catch (error) {
    console.error('Diary API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to generate diary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}