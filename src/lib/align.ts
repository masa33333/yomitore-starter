import { Token, TimingsJSON } from '@/types/highlight';

// useAudioHighlighterとの互換性のための型エイリアス
export type Timings = TimingsJSON;
export type TimingItem = TimingsJSON['items'][0];

// テキスト正規化（アライメント用）
const normalizeForAlignment = (s: string): string => 
  s.toLowerCase().replace(/[^a-z0-9'']+/gi, '');

/**
 * タイミングデータとトークン配列の対応付けマップを構築
 * word粒度: 語単位での厳密マッチング
 * sentence粒度: 文頭の単語トークンへの割り当て
 */
export function buildTimingToTokenMap(
  timings: TimingsJSON | undefined, 
  tokens: Token[]
): Map<number, number> {
  const map = new Map<number, number>();
  
  if (!timings?.items?.length || !tokens.length) {
    console.log('⚠️ Empty timings or tokens for alignment');
    return map;
  }

  console.log('🔗 Building alignment map:', {
    granularity: timings.granularity,
    timingsCount: timings.items.length,
    tokensCount: tokens.length,
    wordTokensCount: tokens.filter(t => t.isWord).length
  });

  if (timings.granularity === 'word') {
    return buildWordAlignment(timings.items, tokens);
  } else {
    return buildSentenceAlignment(timings.items, tokens);
  }
}

/**
 * 語レベルアライメント
 * タイミングの各語と最も近いトークンを対応付け
 */
function buildWordAlignment(
  timingItems: Array<{ i: number; text: string; start: number; end: number }>,
  tokens: Token[]
): Map<number, number> {
  const map = new Map<number, number>();
  const wordTokens = tokens.filter(t => t.isWord);
  
  console.log('🔥🔥🔥 SIMPLIFIED ALIGNMENT: Using proportional mapping only');
  console.log('🔥🔥🔥 Timings items:', timingItems.length);
  console.log('🔥🔥🔥 Word tokens:', wordTokens.length);

  // シンプルな比例マッピング（単語飛ばしを防ぐ）
  for (let timingIndex = 0; timingIndex < timingItems.length; timingIndex++) {
    // タイミングインデックスを単語トークン範囲に比例配置
    const tokenPosition = (timingIndex / (timingItems.length - 1)) * (wordTokens.length - 1);
    const roundedTokenIndex = Math.round(tokenPosition);
    const clampedTokenIndex = Math.min(roundedTokenIndex, wordTokens.length - 1);
    
    const token = wordTokens[clampedTokenIndex];
    if (token) {
      const originalTokenIndex = tokens.findIndex(t => t === token);
      map.set(timingIndex, originalTokenIndex);
      
      if (timingIndex < 10) { // 最初の10個のみログ出力
        console.log(`🔄 Proportional: timing[${timingIndex}] "${timingItems[timingIndex].text}" → token[${originalTokenIndex}] "${token.text}"`);
      }
    }
  }

  console.log('📊 Simplified alignment stats:', {
    mappingSize: map.size,
    coverage: `${((map.size / timingItems.length) * 100).toFixed(1)}%`
  });

  return map;
}

/**
 * 文レベルアライメント
 * 各タイミングセグメントの開始位置に対応する単語トークンを割り当て
 */
function buildSentenceAlignment(
  timingItems: Array<{ i: number; text: string; start: number; end: number }>,
  tokens: Token[]
): Map<number, number> {
  const map = new Map<number, number>();
  const wordTokens = tokens.filter(t => t.isWord);
  
  // 単語トークンを文の区切りに合わせて分散配置
  const wordsPerSegment = Math.max(1, Math.floor(wordTokens.length / timingItems.length));
  
  for (let timingIndex = 0; timingIndex < timingItems.length; timingIndex++) {
    // 各セグメントの代表的な単語トークンのインデックスを計算
    const wordTokenIndex = Math.min(
      timingIndex * wordsPerSegment, 
      wordTokens.length - 1
    );
    
    const representativeToken = wordTokens[wordTokenIndex];
    if (representativeToken) {
      // 元のtokens配列でのインデックスを取得
      const originalTokenIndex = tokens.findIndex(t => t === representativeToken);
      map.set(timingIndex, originalTokenIndex);
    }
  }

  console.log('📊 Sentence alignment stats:', {
    segments: timingItems.length,
    wordsPerSegment,
    totalWordTokens: wordTokens.length,
    mappingSize: map.size
  });

  return map;
}

/**
 * アライメント品質の評価
 */
export function evaluateAlignment(
  timings: TimingsJSON,
  tokens: Token[],
  map: Map<number, number>
): {
  accuracy: number;
  coverage: number;
  issues: string[];
} {
  const issues: string[] = [];
  let accurateMatches = 0;
  
  for (const [timingIndex, tokenIndex] of map.entries()) {
    const timingItem = timings.items[timingIndex];
    const token = tokens[tokenIndex];
    
    if (!token) {
      issues.push(`Invalid token index ${tokenIndex} for timing ${timingIndex}`);
      continue;
    }
    
    if (timings.granularity === 'word') {
      const normalizedTiming = normalizeForAlignment(timingItem.text);
      const normalizedToken = normalizeForAlignment(token.text);
      
      if (normalizedTiming === normalizedToken) {
        accurateMatches++;
      } else {
        issues.push(`Mismatch: "${timingItem.text}" != "${token.text}"`);
      }
    } else {
      // 文レベルでは単語トークンであることを確認
      if (token.isWord) {
        accurateMatches++;
      }
    }
  }
  
  const accuracy = map.size > 0 ? (accurateMatches / map.size) * 100 : 0;
  const coverage = timings.items.length > 0 ? (map.size / timings.items.length) * 100 : 0;
  
  return { accuracy, coverage, issues };
}