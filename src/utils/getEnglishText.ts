// utils/getEnglishText.ts
export function getEnglishText(
  enMap: Record<number, string>,
  level: number
): string {
  const availableLevels = Object.keys(enMap).map(Number).sort((a, b) => a - b)
  let selectedLevel = availableLevels[0]
  for (let l of availableLevels) {
    if (level >= l) selectedLevel = l
    else break
  }
  return enMap[selectedLevel]
}

/**
 * 10段階クイズレベルを5段階生成レベルにマッピング
 * @param quizLevel クイズで判定されたレベル（1-10）
 * @returns 生成用レベル（1-5）
 */
export function mapQuizLevelToGenerationLevel(quizLevel: number): number {
  // 10段階 → 5段階の適切な教育的マッピング
  if (quizLevel <= 2) return 1;      // Quiz 1-2  → Lv.1 (初級 A1)
  if (quizLevel <= 4) return 2;      // Quiz 3-4  → Lv.2 (初中級 A2) 
  if (quizLevel <= 6) return 3;      // Quiz 5-6  → Lv.3 (中級 B1)
  if (quizLevel <= 8) return 4;      // Quiz 7-8  → Lv.4 (中上級 B2)
  return 5;                          // Quiz 9-10 → Lv.5 (上級 C1+)
}

/**
 * 生成レベルの日本語表示名を取得
 * @param generationLevel 生成用レベル（1-5）
 * @returns 日本語レベル名
 */
export function getGenerationLevelName(generationLevel: number): string {
  const levelNames = {
    1: 'Lv.1 (初級)',
    2: 'Lv.2 (初中級)',
    3: 'Lv.3 (中級)',
    4: 'Lv.4 (中上級)',
    5: 'Lv.5 (上級)'
  };
  return levelNames[generationLevel as keyof typeof levelNames] || 'Lv.1 (初級)';
}