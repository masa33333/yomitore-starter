// 語彙レベル検証ツール
import { analyzeVocabulary, getWordLevel, getAllowedWords } from '@/constants/ngslData';

export interface VocabularyValidationResult {
  isValid: boolean;
  analysis: ReturnType<typeof analyzeVocabulary>;
  violations: {
    word: string;
    level: number;
    position: number;
  }[];
  suggestions: string[];
}

// テキストが指定レベルの語彙制約を満たしているかチェック
export function validateVocabularyLevel(text: string, targetLevel: number): VocabularyValidationResult {
  const analysis = analyzeVocabulary(text);
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const allowedWords = getAllowedWords(targetLevel);
  const violations: { word: string; level: number; position: number }[] = [];
  
  // 違反語彙の特定
  words.forEach((word, index) => {
    const wordLevel = getWordLevel(word);
    const isAllowed = allowedWords.includes(word);
    
    if (!isAllowed && wordLevel > targetLevel) {
      violations.push({
        word,
        level: wordLevel,
        position: index
      });
    }
  });
  
  // レベル別適合性チェック
  let isValid = false;
  switch (targetLevel) {
    case 1:
      isValid = analysis.isLevel1Compliant && violations.length === 0;
      break;
    case 2:
      isValid = analysis.isLevel2Compliant && violations.length === 0;
      break;
    case 3:
      isValid = analysis.isLevel3Compliant && violations.length === 0;
      break;
    case 4:
      isValid = violations.filter(v => v.level > 4).length === 0;
      break;
    case 5:
      isValid = true; // Level 5は制限なし
      break;
  }
  
  // 改善提案
  const suggestions = generateSuggestions(violations, targetLevel);
  
  return {
    isValid,
    analysis,
    violations,
    suggestions
  };
}

// 違反語彙に対する代替案を生成
function generateSuggestions(violations: any[], targetLevel: number): string[] {
  const suggestions: string[] = [];
  
  violations.forEach(violation => {
    const replacement = getSimpleReplacement(violation.word, targetLevel);
    if (replacement) {
      suggestions.push(`"${violation.word}" → "${replacement}"`);
    }
  });
  
  return suggestions;
}

// 簡単な語彙への置換提案
function getSimpleReplacement(word: string, targetLevel: number): string | null {
  const replacements: Record<string, string> = {
    // Level 3→2への置換
    'sophisticated': 'advanced',
    'elaborate': 'detailed', 
    'contemplate': 'think about',
    'mischievous': 'playful',
    'fumble': 'drop',
    'suppress': 'stop',
    'glimpse': 'look',
    'whisper': 'speak quietly',
    'murmur': 'say softly',
    'intricate': 'complex',
    'subtle': 'small',
    'profound': 'deep',
    'comprehensive': 'complete',
    'demonstrate': 'show',
    'phenomenon': 'event',
    
    // Level 2→1への置換
    'advanced': 'good',
    'detailed': 'full',
    'complex': 'hard',
    'complete': 'all',
    'event': 'thing'
  };
  
  return replacements[word] || null;
}

// リアルタイム語彙チェック（ReadingClient用）
export function checkWordLevel(word: string): { level: number; isBasic: boolean } {
  const level = getWordLevel(word);
  return {
    level,
    isBasic: level <= 2
  };
}