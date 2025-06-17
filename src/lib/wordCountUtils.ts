/**
 * 語数カウント用ユーティリティ
 */

export function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

export function calculateWPM(wordCount: number, durationMinutes: number): number {
  if (durationMinutes <= 0) {
    return 0;
  }
  
  return Math.round(wordCount / durationMinutes);
}

export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}分${seconds > 0 ? seconds + '秒' : ''}`;
  } else {
    return `${seconds}秒`;
  }
}