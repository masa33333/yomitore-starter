/**
 * プログレス管理用定数
 */

// 到着判定用語数しきい値
export const ARRIVAL_WORDS: Record<string, number> = {
  'Tokyo': 0,        // 初期位置
  'Seoul': 500,      // 500語で到達
  'Beijing': 1000,   // 1000語で到達
  'London': 2000,    // 2000語で到達
  'NewYork': 3500,   // 3500語で到達
  'Nairobi': 5000,   // 5000語で到達
  'Sydney': 7000,    // 7000語で到達
};

// 道中メール送信間隔（分）- 航路別
export const IN_FLIGHT_MINUTES: Record<string, number[]> = {
  'Tokyo-Seoul': [30, 60, 90],
  'Seoul-Beijing': [30, 60, 90, 120],
  'Beijing-London': [30, 60, 90, 120, 150],
  'London-NewYork': [30, 60, 90, 120],
  'NewYork-Nairobi': [30, 60, 90, 120, 150, 180],
  'Nairobi-Sydney': [30, 60, 90, 120, 150],
};

// デフォルトの道中メール間隔
export const DEFAULT_IN_FLIGHT_MINUTES: number[] = [30, 60, 90, 120, 150, 180];

// 都市間の航路定義
export const CITY_ROUTES: Record<string, string[]> = {
  'Tokyo': ['Seoul'],
  'Seoul': ['Beijing'],
  'Beijing': ['London'],
  'London': ['NewYork'],
  'NewYork': ['Nairobi'],
  'Nairobi': ['Sydney'],
  'Sydney': [],
};

// 航路名生成
export function getLegName(fromCity: string, toCity: string): string {
  return `${fromCity}-${toCity}`;
}

// 次の都市取得
export function getNextCity(currentCity: string): string | null {
  const routes = CITY_ROUTES[currentCity];
  return routes && routes.length > 0 ? routes[0] : null;
}