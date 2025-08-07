import { Token } from '@/types/highlight';

// テキスト正規化関数
const normalize = (s: string): string => 
  s.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * 読書用統一トークナイザ
 * 既存のrenderClickableTextの分割ロジックに基づいて実装
 * 単語、句読点、空白を個別のトークンとして扱う
 */
export function tokenizeForReading(text: string): Token[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Unicode対応の正規表現で分割
  // - 単語: 文字・数字・アポストロフィ
  // - 非単語: 句読点・記号
  // - 空白: スペース・タブ・改行
  const regex = /[\p{L}\p{N}'']+|[^\s\p{L}\p{N}'']+|\s+/gu;
  const rawTokens = text.match(regex) || [];

  const tokens: Token[] = rawTokens.map((tokenText, i) => {
    // 単語判定：文字・数字・アポストロフィが含まれるか
    const isWord = /[\p{L}\p{N}'']+/u.test(tokenText);
    
    // 正規化：単語のみ処理、非単語は空文字
    const normalizedText = isWord 
      ? normalize(tokenText.replace(/[^\p{L}\p{N}'']+/gu, ''))
      : '';

    return {
      i,
      text: tokenText,
      norm: normalizedText,
      isWord,
    };
  });

  console.log('🔤 Tokenization result:', {
    originalLength: text.length,
    tokensCount: tokens.length,
    wordsCount: tokens.filter(t => t.isWord).length,
    firstTokens: tokens.slice(0, 5).map(t => ({ text: t.text, isWord: t.isWord }))
  });

  return tokens;
}

/**
 * デバッグ用：トークン化結果の可視化
 */
export function debugTokens(tokens: Token[]): void {
  console.group('🔍 Token Debug');
  tokens.forEach((token, index) => {
    console.log(`${index}: ${token.isWord ? '📝' : '⚪'} "${token.text}" (norm: "${token.norm}")`);
  });
  console.groupEnd();
}

/**
 * 統計情報取得
 */
export function getTokenStats(tokens: Token[]) {
  const words = tokens.filter(t => t.isWord);
  const punctuation = tokens.filter(t => !t.isWord && !/\s/.test(t.text));
  const whitespace = tokens.filter(t => !t.isWord && /\s/.test(t.text));

  return {
    total: tokens.length,
    words: words.length,
    punctuation: punctuation.length,
    whitespace: whitespace.length,
    avgWordLength: words.length > 0 
      ? words.reduce((sum, t) => sum + t.text.length, 0) / words.length 
      : 0
  };
}