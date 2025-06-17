/**
 * プログレス監視用ユーティリティ
 */

export function getTotalWords(): number {
  const totalWords = localStorage.getItem('wordCount');
  return totalWords ? parseInt(totalWords, 10) : 0;
}

export function getTotalMinutes(): number {
  const elapsedTime = localStorage.getItem('elapsedReadingTime');
  if (!elapsedTime) return 0;
  
  const milliseconds = parseInt(elapsedTime, 10);
  return Math.floor(milliseconds / (60 * 1000)); // ミリ秒を分に変換
}

export function getCurrentLeg(): { fromCity: string; toCity: string } {
  // 現在の都市を取得
  const currentCity = getCurrentCity();
  const nextCity = getNextCityFromProgress();
  
  return {
    fromCity: currentCity,
    toCity: nextCity || 'Unknown'
  };
}

export function getCurrentCity(): string {
  // 累計語数から現在位置を判定
  const totalWords = getTotalWords();
  
  if (totalWords >= 7000) return 'Sydney';
  if (totalWords >= 5000) return 'Nairobi';
  if (totalWords >= 3500) return 'NewYork';
  if (totalWords >= 2000) return 'London';
  if (totalWords >= 1000) return 'Beijing';
  if (totalWords >= 500) return 'Seoul';
  
  return 'Tokyo'; // 初期位置
}

export function getNextCityFromProgress(): string | null {
  const totalWords = getTotalWords();
  
  if (totalWords < 500) return 'Seoul';
  if (totalWords < 1000) return 'Beijing';
  if (totalWords < 2000) return 'London';
  if (totalWords < 3500) return 'NewYork';
  if (totalWords < 5000) return 'Nairobi';
  if (totalWords < 7000) return 'Sydney';
  
  return null; // 最終目的地到達
}

export function hasReachedCity(city: string, words: number): boolean {
  const thresholds: Record<string, number> = {
    'Tokyo': 0,
    'Seoul': 500,
    'Beijing': 1000,
    'London': 2000,
    'NewYork': 3500,
    'Nairobi': 5000,
    'Sydney': 7000,
  };
  
  return words >= (thresholds[city] || 0);
}

export function getProgressPercentage(): number {
  const totalWords = getTotalWords();
  const maxWords = 7000; // Sydney到達語数
  
  return Math.min(Math.round((totalWords / maxWords) * 100), 100);
}