import { getWordLevel, getAllowedWords } from '@/constants/ngslData';

interface ToeicGenerationOptions {
  level: 1 | 2 | 3;
  originalText: string;
  title: string;
  description: string;
}

interface ToeicGenerationResult {
  english: string;
  japanese: string;
  wordCount: number;
  level: number;
}

// TOEIC専用のプロンプトテンプレート
const TOEIC_PROMPTS = {
  1: `You are a TOEIC content adapter. Rewrite the following passage for Level 1 (CEFR A1) learners.

CRITICAL REQUIREMENTS:
- Use ONLY NGSL 1-500 vocabulary (most basic English words)
- Keep sentences SHORT and SIMPLE (subject + verb + object)
- Use ONLY present tense, past tense, and basic future (will)
- NO complex grammar: no relative clauses, no passive voice, no complex conjunctions
- Word count: 80-120 words
- Maintain the core meaning and factual information
- Write in active voice only
- Use common, everyday words that A1 learners know

FORBIDDEN WORDS (too advanced): utilize, implement, significantly, initiative, sustainability, etc.
ALLOWED PATTERN: "The city will start a new program. People can put food waste in green bins."

Original passage to adapt:`,

  2: `You are a TOEIC content adapter. Rewrite the following passage for Level 2 (CEFR A2) learners.

CRITICAL REQUIREMENTS:
- Use ONLY NGSL 1-1000 vocabulary (basic + common everyday words)
- Use simple and compound sentences (can use "and", "but", "because")
- Grammar: present, past, future, present perfect, basic modals (can, will, should)
- Word count: 120-160 words
- Maintain factual accuracy and key information
- Can use simple relative clauses with "that" and "which"
- Can use basic passive voice occasionally

VOCABULARY LEVEL: Basic business and daily life vocabulary
FORBIDDEN: Technical jargon, academic terms, complex business terminology
ALLOWED PATTERN: "The company announced a new product that will help workers in warehouses."

Original passage to adapt:`,

  3: `This is Level 3 (upper-intermediate). Return the original text as-is, as it's already appropriate for this level.

Original passage:`
};

// OpenAI APIを使ってパッセージを生成
async function generateLeveledPassage(options: ToeicGenerationOptions): Promise<string> {
  const { level, originalText, title } = options;
  
  if (level === 3) {
    return originalText; // Level 3は原文をそのまま使用
  }

  const prompt = TOEIC_PROMPTS[level];
  
  try {
    const response = await fetch('/api/generate-reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        topic: title,
        customPrompt: `${prompt}\n\n${originalText}`,
        isToeicGeneration: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.english || originalText;
  } catch (error) {
    console.error('Error generating leveled passage:', error);
    return originalText; // フォールバック
  }
}

// 日本語訳を生成
async function generateJapaneseTranslation(englishText: string): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: englishText,
        targetLanguage: 'ja'
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.translation || '翻訳に失敗しました。';
  } catch (error) {
    console.error('Error generating Japanese translation:', error);
    return '翻訳に失敗しました。';
  }
}

// 語数をカウント
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}


// 語彙レベルを検証
function validateVocabulary(text: string, level: number): boolean {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const allowedWords = getAllowedWords(level);
  
  for (const word of words) {
    if (!allowedWords.includes(word)) {
      const wordLevel = getWordLevel(word);
      if (wordLevel > level) {
        console.warn(`Word "${word}" (level ${wordLevel}) exceeds target level ${level}`);
        return false;
      }
    }
  }
  
  return true;
}

// メイン生成関数
export async function generateToeicPassage(options: ToeicGenerationOptions): Promise<ToeicGenerationResult> {
  const { level, originalText } = options;
  
  console.log(`🎯 Generating TOEIC passage for level ${level}`);
  
  // パッセージ生成
  const english = await generateLeveledPassage(options);
  
  // 日本語訳生成
  const japanese = await generateJapaneseTranslation(english);
  
  // 語数カウント
  const wordCount = countWords(english);
  
  // 語彙レベル検証（Level 3以外）
  if (level < 3) {
    const isValid = validateVocabulary(english, level);
    if (!isValid) {
      console.warn(`⚠️ Generated passage contains words above level ${level}`);
    }
  }
  
  console.log(`✅ Generated TOEIC passage: ${wordCount} words, level ${level}`);
  
  return {
    english,
    japanese,
    wordCount,
    level
  };
}

// パッセージをファイルに保存
export async function saveToeicPassage(
  passageId: string, 
  level: number, 
  result: ToeicGenerationResult
): Promise<void> {
  try {
    const data = {
      id: passageId,
      level,
      ...result,
      generatedAt: new Date().toISOString()
    };
    
    // サーバーサイドでファイル保存APIを呼び出し
    const response = await fetch('/api/save-toeic-passage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        passageId,
        level,
        data
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }
    
    console.log(`💾 Saved TOEIC passage: ${passageId}_level${level}`);
  } catch (error) {
    console.error('Error saving TOEIC passage:', error);
  }
}

export default {
  generateToeicPassage,
  saveToeicPassage
};