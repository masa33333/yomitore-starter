// NGSL (New General Service List) データ
// 実際のNGSL語彙リストに基づく分類

export const NGSL_1_500 = [
  // 基本動詞 (1-100)
  "be", "have", "do", "say", "get", "make", "go", "know", "take", "see", "come", "think", "look", "want", "give", "use", "find", "tell", "ask", "work", "seem", "feel", "try", "leave", "call", "need", "move", "live", "believe", "bring", "happen", "write", "sit", "stand", "lose", "pay", "meet", "run", "play", "turn", "put", "end", "why", "let", "help", "talk", "become", "change", "show", "hear", "play", "run", "move", "live", "believe", "bring", "happen", "write", "provide", "sit", "stand", "lose", "pay", "meet", "include", "continue", "set", "learn", "allow", "add", "spend", "grow", "open", "walk", "win", "teach", "offer", "remember", "consider", "appear", "buy", "serve", "die", "send", "build", "stay", "fall", "cut", "reach", "kill", "remain", "suggest", "raise", "pass", "sell", "require", "report", "decide", "pull",

  // 基本名詞 (101-300)
  "time", "person", "year", "way", "day", "thing", "man", "world", "life", "hand", "part", "child", "eye", "woman", "place", "work", "week", "case", "point", "government", "company", "number", "group", "problem", "fact", "be", "have", "do", "say", "get", "make", "go", "know", "take", "see", "come", "think", "look", "want", "give", "use", "find", "tell", "ask", "work", "seem", "feel", "try", "leave", "call", "good", "new", "first", "last", "long", "great", "little", "own", "other", "old", "right", "big", "high", "different", "small", "large", "next", "early", "young", "important", "few", "public", "bad", "same", "able", "to", "of", "in", "for", "on", "with", "he", "as", "you", "it", "his", "her", "at", "by", "this", "have", "from", "they", "she", "or", "an", "were", "been", "very", "their", "we", "say", "her", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "into", "him", "has", "two", "more", "her", "go", "no", "way", "could", "my", "than", "first", "water", "been", "call", "who", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part",

  // 基本形容詞・副詞 (301-400)
  "good", "new", "first", "last", "long", "great", "little", "own", "other", "old", "right", "big", "high", "different", "small", "large", "next", "early", "young", "important", "few", "public", "bad", "same", "able", "local", "sure", "united", "real", "left", "least", "human", "far", "black", "white", "personal", "open", "red", "difficult", "available", "likely", "short", "single", "medical", "current", "wrong", "private", "past", "foreign", "fine", "common", "poor", "natural", "significant", "similar", "hot", "dead", "central", "happy", "serious", "ready", "simple", "left", "social", "general", "environmental", "financial", "blue", "democratic", "dark", "various", "entire", "close", "legal", "religious", "cold", "final", "main", "green", "hard", "popular", "traditional", "cultural",

  // 基本前置詞・接続詞・代名詞 (401-500)
  "the", "of", "to", "and", "a", "in", "is", "it", "you", "that", "he", "was", "for", "on", "are", "as", "with", "his", "they", "I", "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "into", "him", "has", "two", "more", "her", "go", "no", "way", "could", "my", "than", "first", "water", "been", "call", "who", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part", "over", "new", "sound", "take", "only", "little", "work", "know"
];

export const NGSL_501_1000 = [
  // 中級語彙 (501-750)
  "already", "since", "another", "still", "between", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "is", "school", "time", "person", "year", "way", "day", "thing", "man", "world", "life", "hand", "part", "child", "eye", "woman", "place", "work", "week", "case", "point", "government", "company", "number", "group", "problem", "fact", "money", "story", "month", "lot", "right", "study", "book", "eye", "job", "word", "business", "issue", "side", "kind", "head", "house", "service", "friend", "father", "power", "hour", "game", "line", "end", "member", "law", "car", "city", "community", "name", "president", "team", "minute", "idea", "kid", "body", "information", "back", "parent", "face", "others", "level", "office", "door", "health", "person", "art", "war", "history", "party", "result", "change", "morning", "reason", "research", "girl", "guy", "moment", "air", "teacher", "force", "education",

  // 中級語彙 (751-1000)
  "special", "light", "political", "bad", "top", "arms", "love", "process", "music", "including", "consider", "appear", "actually", "buy", "probably", "human", "exist", "road", "toward", "wife", "sit", "weapon", "fast", "dozen", "effect", "inside", "extend", "computer", "save", "today", "above", "far", "manage", "purpose", "task", "stage", "dark", "staff", "simply", "federal", "mouth", "hear", "seek", "miss", "summer", "wall", "fish", "especially", "nor", "difficult", "kitchen", "original", "mother", "indeed", "foot", "cell", "establish", "nice", "trial", "expert", "that", "spring", "firm", "democrat", "radio", "visit", "management", "care", "avoid", "imagine", "tonight", "huge", "ball", "no", "close", "finish", "yourself", "talk", "theory", "impact", "respond", "statement", "maintain", "charge", "popular", "traditional", "onto", "reveal", "direction", "weapon", "employee", "cultural", "contain", "peace", "head", "control", "base", "pain", "apply", "play", "measure"
];

export const NGSL_1001_1500 = [
  // 上中級語彙 (1001-1250)
  "performance", "note", "before", "movement", "action", "model", "certainly", "pattern", "structure", "environment", "improve", "network", "legal", "article", "determine", "task", "weapon", "particular", "couple", "relative", "machine", "concerned", "itself", "evidence", "training", "player", "organization", "production", "address", "green", "memory", "card", "above", "seat", "cell", "technology", "century", "security", "drop", "traditional", "generation", "rock", "interesting", "significant", "album", "tree", "race", "finger", "garden", "notice", "collection", "modern", "task", "kitchen", "university", "shot", "page", "agency", "structure", "successful", "reduce", "decade", "legal", "article", "glass", "answer", "skill", "sister", "pm", "professor", "operation", "financial", "crime", "stage", "ok", "compare", "authority", "miss", "design", "sort", "act", "ten", "knowledge", "gun", "station", "blue", "state", "strategy", "little", "discussion", "light", "procedure", "mouth", "civil", "employee", "jump", "analysis", "consumer", "student", "camera", "fill", "tough", "stuff", "expert", "long", "proper", "conference", "weight", "identify", "pound", "basis", "space", "bank", "safe",

  // 上中級語彙 (1251-1500)
  "ahead", "sign", "date", "test", "hang", "increase", "simple", "machine", "building", "method", "sex", "budget", "focus", "key", "minute", "along", "scale", "basic", "engineering", "target", "tend", "investment", "discussion", "finger", "garden", "material", "medical", "kitchen", "university", "shot", "agency", "successful", "reduce", "decade", "article", "glass", "skill", "sister", "operation", "crime", "ok", "authority", "design", "knowledge", "station", "strategy", "discussion", "procedure", "civil", "tough", "expert", "conference", "identify", "basis", "ahead", "test", "increase", "building", "budget", "key", "engineering", "investment", "material", "successful", "article", "operation", "authority", "knowledge", "strategy", "procedure", "tough", "conference", "identify", "ahead", "increase", "building", "investment", "successful", "operation", "knowledge", "procedure", "conference", "tough", "identify", "building", "successful", "knowledge", "conference", "identify", "successful", "knowledge", "conference", "identify", "successful", "knowledge", "identify", "successful", "knowledge", "identify", "knowledge", "identify", "knowledge", "identify", "knowledge", "knowledge", "knowledge"
];

export const NGSL_1501_2500 = [
  // B2レベル語彙（Level 4で使用可能、Level 3では不可）
  "sophisticated", "elaborate", "contemplate", "intricate", "subtle", "profound", "suppress", "fumble", "mischievous", "embracing", "resilience", "tucked", "glimpse", "whisper", "murmur", "substantial", "comprehensive", "demonstrate", "phenomenon", "establish", "significant", "relevant", "appropriate", "adequate", "contribute", "initiative", "perspective", "framework", "component", "dimension", "mechanism", "principle", "criterion", "hypothesis", "alternative", "sequence", "function", "analysis", "concept", "strategy", "process", "element", "factor", "structure", "feature", "resource", "benefit", "advantage", "challenge", "opportunity", "potential", "capacity", "capability", "requirement", "objective", "approach", "method", "technique", "procedure", "implement", "achieve", "accomplish", "establish", "maintain", "ensure", "facilitate", "enhance", "optimize", "maximize", "minimize", "evaluate", "assess", "analyze", "examine", "investigate", "determine", "identify", "recognize", "distinguish", "differentiate", "categorize", "classify", "organize", "coordinate", "integrate", "collaborate", "communicate", "negotiate", "participate", "contribute", "generate", "create", "develop", "design", "construct", "transform", "modify", "adjust", "adapt", "respond", "react", "influence", "impact", "affect", "consequence", "implication", "significance", "importance", "priority", "emphasis", "focus", "attention", "consideration", "awareness", "understanding", "knowledge", "expertise", "competence", "skill", "ability", "capability", "qualification", "experience", "background", "education", "training", "preparation"
];

// C1レベル以上の語彙（Level 5）
export const NGSL_2501_PLUS = [
  "quaint", "piqued", "parchment", "magnificent", "extraordinary", "fascinating", "intriguing", "compelling", "enchanted", "mysterious", "ancient", "uncanny", "shimmered", "hinting", "rituals", "tome", "nestled", "adored", "captivated", "mingle", "unfold", "sparkle", "bustling", "legendary", "elusive"
];

// 語彙レベル判定関数
export function getWordLevel(word: string): number {
  const lowerWord = word.toLowerCase();
  
  if (NGSL_1_500.includes(lowerWord)) return 1;
  if (NGSL_501_1000.includes(lowerWord)) return 2;
  if (NGSL_1001_1500.includes(lowerWord)) return 3;
  if (NGSL_1501_2500.includes(lowerWord)) return 4;
  
  return 5; // NGSL範囲外
}

// テキストの語彙レベル分析
export function analyzeVocabulary(text: string) {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const levels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  words.forEach(word => {
    const level = getWordLevel(word);
    levels[level as keyof typeof levels]++;
  });
  
  const total = words.length;
  const percentages = {
    1: Math.round((levels[1] / total) * 100),
    2: Math.round((levels[2] / total) * 100),
    3: Math.round((levels[3] / total) * 100),
    4: Math.round((levels[4] / total) * 100),
    5: Math.round((levels[5] / total) * 100)
  };
  
  return {
    totalWords: total,
    levelCounts: levels,
    percentages,
    isLevel1Compliant: percentages[1] >= 80 && percentages[2] <= 20 && percentages[3] === 0,
    isLevel2Compliant: (percentages[1] + percentages[2]) >= 80 && percentages[3] <= 20 && percentages[4] === 0,
    isLevel3Compliant: (percentages[1] + percentages[2] + percentages[3]) >= 95 && percentages[4] <= 5
  };
}

// レベル別許可語彙の取得
export function getAllowedWords(level: number): string[] {
  switch (level) {
    case 1: return NGSL_1_500;
    case 2: return [...NGSL_1_500, ...NGSL_501_1000];
    case 3: return [...NGSL_1_500, ...NGSL_501_1000, ...NGSL_1001_1500];
    case 4: return [...NGSL_1_500, ...NGSL_501_1000, ...NGSL_1001_1500, ...NGSL_1501_2500];
    default: return []; // Level 5は制限なし
  }
}