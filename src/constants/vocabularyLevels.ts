// 語彙レベル定義 - CLAUDE.mdの仕様を厳密に実装

export interface VocabularyLevel {
  level: number;
  name: string;
  cefr: string;
  vocabularySize: string;
  wordCountTarget: string;
  minWords: number;
  maxWords: number;
  grammarConstraints: string[];
  forbiddenGrammar: string[];
  sentenceStructure: string;
  maxWordsPerSentence: number;
  examples: string[];
  strictRules: string[];
}

export const VOCABULARY_LEVELS: Record<number, VocabularyLevel> = {
  1: {
    level: 1,
    name: "初級",
    cefr: "A1",
    vocabularySize: "500-800語程度",
    wordCountTarget: "80-120語",
    minWords: 80,
    maxWords: 120,
    grammarConstraints: [
      "現在形のみ (am/is/are, do/does)",
      "be動詞の肯定文・否定文・疑問文",
      "基本的な疑問詞 (what, who, where, when)",
      "単数・複数の基本形"
    ],
    forbiddenGrammar: [
      "過去形 (was/were, -ed)",
      "未来形 (will, going to)",
      "進行形 (-ing)",
      "完了形 (have/has + 過去分詞)",
      "関係代名詞 (that, which, who)",
      "接続詞による複文 (because, although, if)",
      "受動態 (be + 過去分詞)",
      "仮定法",
      "分詞構文"
    ],
    sentenceStructure: "単文のみ。主語+動詞または主語+be動詞+補語",
    maxWordsPerSentence: 8,
    examples: [
      "I am happy.",
      "The cat is cute.", 
      "Do you like cats?",
      "She has a book.",
      "This is my house."
    ],
    strictRules: [
      "最低80語、最大120語を厳守",
      "1文の最大語数: 8語",
      "複文禁止 - 1文に動詞は1つのみ",
      "現在形以外の時制は一切使用禁止",
      "関係代名詞・接続詞による文の結合禁止",
      "基本語彙800語以内の単語のみ使用"
    ]
  },
  
  2: {
    level: 2,
    name: "初中級",
    cefr: "A2", 
    vocabularySize: "800-1200語程度",
    wordCountTarget: "110-150語",
    minWords: 110,
    maxWords: 150,
    grammarConstraints: [
      "過去形 (was/were, -ed)",
      "未来形 (will, going to)",
      "現在進行形 (am/is/are + -ing)",
      "基本的な接続詞 (and, but, or)"
    ],
    forbiddenGrammar: [
      "完了形",
      "関係代名詞",
      "受動態",
      "仮定法",
      "分詞構文",
      "複雑な従属節"
    ],
    sentenceStructure: "単文と簡単な等位接続詞による複文",
    maxWordsPerSentence: 12,
    examples: [
      "Yesterday I went to Tokyo.",
      "I will study tomorrow.",
      "She is reading a book.",
      "I like cats and dogs."
    ],
    strictRules: [
      "最低110語、最大150語を厳守",
      "1文の最大語数: 12語",
      "等位接続詞(and, but, or)のみ使用可",
      "従属節禁止"
    ]
  },

  3: {
    level: 3,
    name: "中級",
    cefr: "B1",
    vocabularySize: "1200-2000語程度",
    wordCountTarget: "140-200語",
    minWords: 140,
    maxWords: 200, 
    grammarConstraints: [
      "関係代名詞 (that, which, who)",
      "完了形 (have/has + 過去分詞)",
      "受動態 (be + 過去分詞)",
      "基本的な複合文"
    ],
    forbiddenGrammar: [
      "仮定法",
      "分詞構文",
      "高度な修辞技法"
    ],
    sentenceStructure: "複文可。関係代名詞を使った修飾",
    maxWordsPerSentence: 18,
    examples: [
      "The book that I read yesterday was interesting.",
      "I have lived here for five years.",
      "The letter was written by my friend."
    ],
    strictRules: [
      "最低140語、最大200語を厳守",
      "1文の最大語数: 18語",
      "関係代名詞節は1つまで",
      "日常語彙中心"
    ]
  },

  4: {
    level: 4,
    name: "中上級", 
    cefr: "B2",
    vocabularySize: "2000-3500語程度",
    wordCountTarget: "170-250語",
    minWords: 170,
    maxWords: 250,
    grammarConstraints: [
      "複雑な時制",
      "仮定法 (if I were, if I had)",
      "分詞構文",
      "抽象的表現"
    ],
    forbiddenGrammar: [
      "極度に専門的な学術用語",
      "古語・雅語"
    ],
    sentenceStructure: "複雑な複文と重文",
    maxWordsPerSentence: 25,
    examples: [
      "Having finished the project, she felt a sense of accomplishment.",
      "If I were you, I would consider the alternatives.",
      "The concept underlying this theory is quite complex."
    ],
    strictRules: [
      "最低170語、最大250語を厳守",
      "1文の最大語数: 25語",
      "抽象概念の使用可",
      "学術的でない範囲の語彙"
    ]
  },

  5: {
    level: 5,
    name: "上級",
    cefr: "C1+", 
    vocabularySize: "3500語以上",
    wordCountTarget: "200-300語",
    minWords: 200,
    maxWords: 300,
    grammarConstraints: [
      "高度な構文",
      "学術的表現",
      "専門用語",
      "修辞技法"
    ],
    forbiddenGrammar: [],
    sentenceStructure: "学術論文レベルの複雑な構文",
    maxWordsPerSentence: 35,
    examples: [
      "The phenomenon demonstrates the intricate relationship between cognitive processes and behavioral outcomes.",
      "Notwithstanding the methodological limitations, the findings constitute a significant contribution to the field."
    ],
    strictRules: [
      "最低200語、最大300語を厳守",
      "学術的語彙・専門用語の使用可",
      "複雑な修辞技法の使用可"
    ]
  }
};

// レベル1の基本語彙リスト（厳選800語）
export const LEVEL_1_BASIC_VOCABULARY = [
  // 基本動詞
  "am", "is", "are", "have", "has", "do", "does", "like", "want", "need", "see", "look", "go", "come", "eat", "drink", "live", "work", "play", "read", "write", "know", "think", "say", "tell", "give", "take", "make", "get", "put",
  
  // 基本名詞
  "cat", "dog", "book", "house", "car", "food", "water", "person", "man", "woman", "child", "family", "friend", "school", "home", "work", "day", "time", "year", "money", "name", "place", "thing", "way", "life", "hand", "eye", "head",
  
  // 基本形容詞
  "good", "bad", "big", "small", "new", "old", "happy", "sad", "hot", "cold", "easy", "hard", "fast", "slow", "nice", "beautiful", "cute", "red", "blue", "green", "black", "white",
  
  // 基本副詞・前置詞
  "very", "really", "now", "today", "here", "there", "in", "on", "at", "with", "for", "to", "from", "of", "about",
  
  // 数詞・その他
  "one", "two", "three", "four", "five", "this", "that", "my", "your", "his", "her", "what", "who", "where", "when", "how", "yes", "no", "and", "or", "but"
];

export function getVocabularyLevel(level: number): VocabularyLevel | null {
  return VOCABULARY_LEVELS[level] || null;
}

export function isValidVocabularyLevel(level: number): boolean {
  return level >= 1 && level <= 5 && VOCABULARY_LEVELS[level] !== undefined;
}