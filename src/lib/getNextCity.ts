import cities from '@/data/cities.json';

export function getNextCity(wordCount: number) {
  // 語数の降順でソートされた都市から、現在の語数に応じた都市を取得
  for (let i = cities.length - 1; i >= 0; i--) {
    if (wordCount >= cities[i].requiredWords) {
      return cities[i];
    }
  }
  // 語数が0未満のときは最初の都市（東京）
  return cities[0];
}

export function getNextUnreachedCity(wordCount: number) {
  // 現在の語数より多い必要語数を持つ最初の都市を返す
  for (let i = 0; i < cities.length; i++) {
    if (wordCount < cities[i].requiredWords) {
      return cities[i];
    }
  }
  // すべての都市に到達済みの場合はnullを返す
  return null;
}