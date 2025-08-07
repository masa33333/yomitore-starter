import { TimingsJSON } from '@/types/highlight';

/**
 * タイミングデータからテキストを復元する
 * word粒度: 単語をスペースで結合、句読点の前のスペースを除去
 * sentence粒度: セグメントをそのまま結合
 */
export function textFromTimings(timings?: TimingsJSON): string {
  if (!timings?.items?.length) {
    return '';
  }

  if (timings.granularity === 'word') {
    // 単語を空白で結合し、句読点の前のスペースを除去
    const rawText = timings.items.map(item => item.text).join(' ');
    
    // 句読点の前のスペースを除去（英語の句読点ルール適用）
    return rawText
      .replace(/\s+([.,!?;:])/g, '$1')  // 句読点前のスペース除去
      .replace(/\s{2,}/g, ' ')         // 連続スペースを単一に
      .trim();
  } else {
    // 文単位の場合はそのまま結合
    return timings.items
      .map(item => item.text.trim())
      .filter(text => text.length > 0)
      .join(' ');
  }
}

/**
 * デバッグ用：復元テキストの統計情報
 */
export function getRestorationStats(timings?: TimingsJSON): {
  granularity: string;
  itemsCount: number;
  totalLength: number;
  restoredText: string;
  preview: string;
} | null {
  if (!timings?.items?.length) {
    return null;
  }

  const restoredText = textFromTimings(timings);
  
  return {
    granularity: timings.granularity,
    itemsCount: timings.items.length,
    totalLength: restoredText.length,
    restoredText,
    preview: restoredText.substring(0, 100) + (restoredText.length > 100 ? '...' : '')
  };
}

/**
 * 復元テキストと元テキストの類似度チェック（デバッグ用）
 */
export function compareTexts(
  originalText: string, 
  restoredText: string
): {
  similarity: number;
  lengthDiff: number;
  issues: string[];
} {
  const normalize = (text: string) => 
    text.toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, '')  // 句読点・記号除去
        .replace(/\s+/g, ' ')             // 複数スペース正規化
        .trim();

  const normalizedOriginal = normalize(originalText);
  const normalizedRestored = normalize(restoredText);
  
  // 簡易類似度計算（文字レベル）
  const maxLength = Math.max(normalizedOriginal.length, normalizedRestored.length);
  if (maxLength === 0) return { similarity: 1, lengthDiff: 0, issues: [] };
  
  let matches = 0;
  const minLength = Math.min(normalizedOriginal.length, normalizedRestored.length);
  
  for (let i = 0; i < minLength; i++) {
    if (normalizedOriginal[i] === normalizedRestored[i]) {
      matches++;
    }
  }
  
  const similarity = matches / maxLength;
  const lengthDiff = normalizedRestored.length - normalizedOriginal.length;
  
  const issues: string[] = [];
  if (similarity < 0.9) issues.push('Low text similarity');
  if (Math.abs(lengthDiff) > normalizedOriginal.length * 0.1) issues.push('Significant length difference');
  if (normalizedRestored.length === 0) issues.push('Empty restored text');
  
  return { similarity, lengthDiff, issues };
}