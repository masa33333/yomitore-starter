// NGSL (New General Service List) データ
// 実際のNGSL語彙リストに基づく分類

export const NGSL_1_500 = [
  // 基本動詞
  "be", "have", "do", "say", "get", "make", "go", "know", "take", "see", "come", "think", "look", "want", "give", "use", "find", "tell", "ask", "work", "seem", "feel", "try", "leave", "call", "need", "move", "live", "believe", "bring", "happen", "write", "sit", "stand", "lose", "pay", "meet", "run", "play", "turn", "put", "end", "let", "help", "talk", "become", "change", "show", "hear", "provide", "include", "continue", "set", "learn", "allow", "add", "spend", "grow", "open", "walk", "win", "teach", "offer", "remember", "consider", "appear", "buy", "serve", "die", "send", "build", "stay", "fall", "cut", "reach", "kill", "remain", "suggest", "raise", "pass", "sell", "require", "report", "decide", "pull", "start", "stop", "begin", "carry", "keep", "hold", "follow", "pick", "catch", "watch", "listen", "speak", "read", "eat", "drink", "sleep", "drive", "ride", "fly", "swim", "climb",

  // 基本名詞
  "time", "person", "year", "way", "day", "thing", "man", "world", "life", "hand", "part", "child", "eye", "woman", "place", "work", "week", "case", "point", "government", "company", "number", "group", "problem", "fact", "money", "story", "month", "lot", "right", "study", "book", "job", "word", "business", "issue", "side", "kind", "head", "house", "service", "friend", "father", "power", "hour", "game", "line", "member", "law", "car", "city", "community", "name", "president", "team", "minute", "idea", "kid", "body", "information", "back", "parent", "face", "others", "level", "office", "door", "health", "art", "war", "history", "party", "result", "morning", "reason", "research", "girl", "guy", "moment", "air", "teacher", "force", "education", "water", "food", "home", "family", "school", "room", "mother", "country", "state", "area", "street", "table", "paper", "music", "film", "foot", "phone", "cost", "market",

  // 基本形容詞・副詞
  "good", "new", "first", "last", "long", "great", "little", "own", "other", "old", "right", "big", "high", "different", "small", "large", "next", "early", "young", "important", "few", "public", "bad", "same", "able", "local", "sure", "real", "left", "human", "far", "black", "white", "personal", "open", "red", "difficult", "available", "likely", "short", "single", "medical", "current", "wrong", "private", "past", "foreign", "fine", "common", "poor", "natural", "significant", "similar", "hot", "dead", "central", "happy", "serious", "ready", "simple", "social", "general", "blue", "dark", "various", "entire", "close", "legal", "cold", "final", "main", "green", "hard", "popular", "free", "special", "full", "easy", "nice", "clear", "possible", "strong", "late", "recent", "low", "wide", "deep", "safe", "clean", "quick", "fast", "slow", "quiet",

  // 基本前置詞・接続詞・代名詞
  "the", "of", "to", "and", "a", "in", "is", "it", "you", "that", "he", "was", "for", "on", "are", "as", "with", "his", "they", "I", "at", "this", "from", "or", "one", "had", "by", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "each", "which", "she", "how", "their", "if", "will", "up", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "like", "into", "him", "has", "two", "more", "no", "way", "could", "my", "than", "who", "its", "now", "down", "did", "made", "may", "over", "sound", "only", "very", "well", "also", "through", "where", "here", "while", "after", "before", "between", "during", "under", "around", "without", "within", "against", "toward", "why", "because", "however", "although", "though", "unless", "until", "since", "whether", "either", "neither", "both", "such", "another", "any", "every", "most", "much", "enough", "several", "less", "too", "quite", "rather", "just", "still", "already", "yet", "again", "once", "never", "always", "often", "sometimes", "usually", "perhaps", "maybe", "probably", "certainly", "surely", "really", "actually", "exactly", "almost", "nearly", "finally", "especially", "particularly", "generally", "basically", "mainly", "mostly", "completely", "totally", "absolutely", "definitely"
];

export const NGSL_501_1000 = [
  // 中級語彙 (501-1000) - 重複除去、新規語彙のみ
  "political", "arms", "love", "process", "including", "exist", "road", "toward", "wife", "weapon", "dozen", "effect", "inside", "extend", "computer", "save", "above", "manage", "purpose", "stage", "staff", "simply", "federal", "seek", "miss", "summer", "wall", "fish", "nor", "kitchen", "original", "indeed", "establish", "trial", "expert", "spring", "firm", "democrat", "radio", "visit", "management", "avoid", "imagine", "tonight", "huge", "ball", "finish", "yourself", "theory", "impact", "respond", "statement", "maintain", "charge", "traditional", "onto", "reveal", "direction", "employee", "cultural", "contain", "peace", "base", "pain", "apply", "measure", "surface", "agency", "leader", "range", "senior", "picture", "return", "language", "season", "detail", "economy", "technology", "computer", "election", "customer", "material", "source", "factor", "peace", "economy", "property", "society", "military", "medical", "evidence", "Congress", "increase", "campaign", "institution", "activity", "treatment", "partner", "interview", "hope"
];

export const NGSL_1001_1500 = [
  // 上中級語彙 (1001-1500) - クリーンアップ済み
  "performance", "note", "movement", "action", "model", "pattern", "structure", "environment", "improve", "network", "article", "determine", "task", "weapon", "particular", "couple", "relative", "machine", "concerned", "itself", "evidence", "training", "player", "organization", "production", "address", "memory", "card", "above", "seat", "cell", "technology", "century", "security", "drop", "generation", "rock", "interesting", "album", "tree", "race", "finger", "garden", "notice", "collection", "modern", "kitchen", "university", "shot", "page", "agency", "successful", "reduce", "decade", "glass", "answer", "skill", "sister", "professor", "operation", "financial", "crime", "stage", "compare", "authority", "miss", "design", "sort", "act", "ten", "knowledge", "gun", "station", "state", "strategy", "discussion", "light", "procedure", "mouth", "civil", "employee", "jump", "analysis", "consumer", "student", "camera", "fill", "tough", "stuff", "expert", "proper", "conference", "weight", "identify", "pound", "basis", "space", "bank", "safe", "ahead", "sign", "date", "test", "hang", "increase", "building", "method", "sex", "budget", "focus", "key", "along", "scale", "basic", "engineering", "target", "tend", "investment", "material", "medical"
];

export const NGSL_1501_2500 = [
  // B2レベル語彙（Level 4で使用可能）- 語学的に正確な分類
  "crucial", "inspire", "separation", "prominent", "substantial", "comprehensive", "demonstrate", "phenomenon", "relevant", "appropriate", "adequate", "contribute", "initiative", "perspective", "framework", "component", "dimension", "mechanism", "principle", "criterion", "hypothesis", "alternative", "sequence", "function", "concept", "element", "factor", "feature", "resource", "benefit", "advantage", "challenge", "opportunity", "potential", "capacity", "capability", "requirement", "objective", "approach", "technique", "procedure", "implement", "achieve", "accomplish", "ensure", "facilitate", "enhance", "optimize", "maximize", "minimize", "evaluate", "assess", "examine", "investigate", "recognize", "distinguish", "differentiate", "categorize", "classify", "organize", "coordinate", "integrate", "collaborate", "negotiate", "participate", "generate", "create", "develop", "design", "construct", "transform", "modify", "adjust", "adapt", "influence", "affect", "consequence", "implication", "significance", "importance", "priority", "emphasis", "consideration", "awareness", "understanding", "expertise", "competence", "qualification", "experience", "background", "preparation", "delivery", "establishment", "implementation", "participation", "construction", "transformation", "modification", "adaptation", "collaboration", "negotiation", "generation", "development", "coordination", "integration", "optimization", "evaluation", "assessment", "investigation", "recognition", "distinction", "categorization", "classification", "organization",
  
  // Level 3で誤用された語彙をLevel 4に移動
  "fascinating", "creatures", "independent", "solitary", "agile", "excellent", "households", "surprising", "communicate", "vocalizations", "specifically", "interacting", "indicate", "attention", "communication", "strengthen"
];

// C1レベル以上の語彙（Level 5）
export const NGSL_2501_PLUS = [
  // Level 3で誤用された高次語彙をここに正しく分類
  "quaint", "piqued", "parchment", "advocating", "fairness", "freed", "pivotal", "unwavering", "sophisticated", "elaborate", "contemplate", "intricate", "subtle", "profound", "suppress", "fumble", "mischievous", "embracing", "resilience", "tucked", "glimpse", "whisper", "murmur",
  
  // その他のC1+語彙
  "magnificent", "extraordinary", "fascinating", "intriguing", "compelling", "enchanted", "mysterious", "ancient", "uncanny", "shimmered", "hinting", "rituals", "tome", "nestled", "adored", "captivated", "mingle", "unfold", "sparkle", "bustling", "legendary", "elusive", "exquisite", "sublime", "ethereal", "whimsical", "melancholy", "serendipity", "ephemeral", "luminous", "transcendent", "profound", "enigmatic", "quintessential", "labyrinthine", "kaleidoscopic", "ineffable", "ubiquitous", "juxtaposition", "dichotomy", "paradigm", "metamorphosis", "catalyst", "epiphany", "renaissance", "zeitgeist", "aesthetic", "euphemism", "hyperbole", "metaphor", "allegory", "paradox", "irony", "ambiguity", "nuance", "connotation", "denotation", "syntax", "semantics", "etymology", "lexicon", "vernacular", "dialect", "colloquialism", "idiom", "vernacular"
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
    case 5: return [...NGSL_1_500, ...NGSL_501_1000, ...NGSL_1001_1500, ...NGSL_1501_2500, ...NGSL_2501_PLUS];
    default: return NGSL_1_500; // フォールバック
  }
}