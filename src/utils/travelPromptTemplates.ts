// src/utils/travelPromptTemplates.ts
// 成功した語彙制御をベースにした手紙・メール専用プロンプト

export interface TravelPromptConfig {
  systemMessage: string;
  userPrompt: string;
  wordRange: { min: number; max: number };
  paragraphs: number;
}

// 成功した語彙リスト（wordrules.mdから抽出）
const LEVEL_3_ALLOWED_WORDS = {
  verbs: ["is", "are", "was", "were", "do", "go", "come", "get", "see", "make", "have", "take", "give", "eat", "drink", "play", "sleep", "walk", "run", "sit", "like", "love", "want", "live", "help", "buy", "use", "look", "find", "put", "call", "open", "can", "will", "visit", "enjoy", "travel", "send", "write", "learn", "know", "think", "feel", "hear", "work", "meet", "try", "show", "tell", "ask", "stop", "start", "move", "turn", "wear", "read", "speak", "cook", "build", "watch", "teach", "climb", "swim", "fly", "dance", "sing"],
  nouns: ["cat", "dog", "pet", "food", "fish", "meat", "egg", "milk", "tea", "water", "home", "house", "room", "bed", "day", "time", "man", "woman", "boy", "girl", "baby", "mom", "dad", "hand", "foot", "head", "eye", "hair", "red", "blue", "black", "white", "sun", "rain", "city", "town", "place", "friend", "letter", "photo", "gift", "trip", "bus", "train", "park", "shop", "store", "hotel", "road", "tree", "flower", "bird", "mouse", "book", "game", "music", "story", "school", "church", "bridge", "river", "mountain", "sea", "beach", "market", "temple", "castle", "garden", "festival", "dance", "song", "people", "family", "child", "party", "boat", "plane", "car", "bike", "street", "door", "window", "wall", "floor", "roof", "tower", "building", "fire", "light", "star", "moon", "snow", "wind", "world", "country", "land", "island", "hill", "field", "farm", "zoo", "museum", "library", "restaurant", "cafe", "kitchen", "bathroom", "yard", "box", "bag", "cup", "plate", "bowl", "spoon", "knife", "fork", "table", "chair", "sofa", "TV", "phone", "computer", "camera", "watch", "money", "coin", "paper", "pen", "pencil", "color", "sound", "smell", "taste", "touch", "feeling", "dream", "memory", "idea", "word", "name", "number", "year", "month", "week", "hour", "minute", "morning", "afternoon", "evening", "night", "today", "tomorrow", "yesterday"],
  adjectives: ["good", "bad", "big", "small", "new", "old", "hot", "cold", "nice", "cute", "fun", "happy", "sad", "fast", "slow", "soft", "warm", "cool", "dry", "wet", "clean", "dirty", "safe", "quiet", "loud", "busy", "free", "easy", "hard", "long", "short", "high", "low", "deep", "light", "dark", "bright", "pretty", "beautiful", "ugly", "funny", "strange", "different", "same", "special", "important", "famous", "popular", "rich", "poor", "strong", "weak", "smart", "silly", "brave", "shy", "kind", "mean", "friendly", "angry", "excited", "tired", "hungry", "full", "thirsty", "sick", "healthy", "young", "ready", "careful", "lucky", "amazing", "wonderful", "terrible", "perfect", "wrong", "right", "true", "real", "fake"],
  others: ["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "from", "of", "some", "many", "all", "my", "your", "his", "her", "they", "them", "we", "us", "this", "that", "when", "where", "what", "who", "how", "very", "so", "too", "also", "not", "yes", "no", "here", "there", "now", "then", "first", "last", "next", "before", "after", "always", "never", "sometimes", "often", "again", "more", "most", "less", "much", "little", "only", "even", "still", "just", "almost", "about", "around", "near", "far", "up", "down", "out", "off", "away", "back", "over", "under", "inside", "outside", "between", "through", "across", "along", "against", "without", "during", "until", "since", "because", "if", "than", "like", "as", "well", "better", "best", "worse", "worst", "together", "alone", "each", "every", "both", "either", "neither", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "hundred", "thousand"]
};

const formatWordList = (words: typeof LEVEL_3_ALLOWED_WORDS): string => {
  return `
Verbs: ${words.verbs.join(", ")}
Nouns: ${words.nouns.join(", ")}
Adjectives: ${words.adjectives.join(", ")}
Others: ${words.others.join(", ")}`;
};

export const TRAVEL_PROMPTS = {
  // Level 1: 最も基本的な語彙のみ
  LETTER_L1: {
    systemMessage: `CRITICAL: You MUST write exactly 80-120 words. You are writing for very young children (age 6-8). Use ONLY the most basic English words. Write exactly 3 short paragraphs. WORD COUNT IS CRITICAL.`,
    
    userPrompt: `You are writing a simple letter from a traveling cat to a very young child. Use ONLY the most basic words.

CRITICAL RULE: Use only simple words that 6-year-old children know.

BASIC WORDS TO USE:
cat, dog, food, fish, home, big, small, good, nice, fun, happy, see, go, eat, play, like, love, I, you, we, my, the, a, and, but, in, on, at, to, very, so, here, there, day, sun, water, red, blue, man, woman, boy, girl

RULES:
1. Write 80-120 words exactly
2. Make 3 very short paragraphs
3. Use only simple sentences
4. Write about basic things like food, places, people
5. Sound very friendly and simple

EXAMPLE:
"Hi! I am in a big city. The city is very nice. I see many people here. They are good to me.

I eat good fish every day. The fish is so good! I also see big houses and small shops.

I miss you very much. I love you. I will come home soon.

Love, Cat"

Write a simple letter from a cat in {LOCATION}.`,

    wordRange: { min: 80, max: 120 },
    paragraphs: 3
  },

  EMAIL_L1: {
    systemMessage: `CRITICAL: You MUST write exactly 60-100 words. You are writing for very young children (age 6-8). Use ONLY the most basic English words. Write exactly 2-3 short paragraphs. WORD COUNT IS CRITICAL.`,
    
    userPrompt: `You are writing a simple email from a traveling cat to a very young child.

CRITICAL RULE: Use only simple words that 6-year-old children know.

Write a short, simple email about {SITUATION} using only basic words.`,

    wordRange: { min: 60, max: 100 },
    paragraphs: 2
  },

  // Level 2: 基本語彙拡張
  LETTER_L2: {
    systemMessage: `CRITICAL: You MUST write exactly 120-160 words. You are writing for children (age 8-10). Use basic English words but can include some new words. Write exactly 3 paragraphs. WORD COUNT IS CRITICAL.`,
    
    userPrompt: `You are writing a letter from a traveling cat to a child friend.

Use mostly basic words but you can include some new words about travel and places.

RULES:
1. Write 120-160 words exactly
2. Make 3 paragraphs
3. Include some travel words like: trip, train, hotel, market, temple
4. Keep sentences simple but can be a bit longer
5. Sound friendly and excited

Write about the cat's experiences in {LOCATION}.`,

    wordRange: { min: 120, max: 160 },
    paragraphs: 3
  },

  EMAIL_L2: {
    systemMessage: `CRITICAL: You MUST write exactly 100-140 words. You are writing for children (age 8-10). Use basic English words but can include some new words. Write exactly 2-3 paragraphs. WORD COUNT IS CRITICAL.`,
    
    userPrompt: `You are writing an email from a traveling cat to a child friend about {SITUATION}.

Use mostly basic words but include some travel vocabulary.`,

    wordRange: { min: 100, max: 140 },
    paragraphs: 2
  },

  // Level 3: 完全語彙リスト制限（最も効果的）
  LETTER_L3: {
    systemMessage: `CRITICAL: You MUST write exactly 180-220 words. COUNT carefully - you need at least 180 words. You are writing for 10-year-old children who love adventure stories. Use ONLY the words from the allowed list. Make it exciting, fun, and full of amazing discoveries that make children want to travel and learn about the world. Write exactly 3 paragraphs. WORD COUNT IS CRITICAL - AIM FOR 200+ WORDS.`,
    
    userPrompt: `You are writing a letter from a traveling cat to a child friend. Use ONLY the words listed below. Do not use any other words.

CRITICAL RULE: You can ONLY use words from this exact list. No other words allowed.

ALLOWED WORD LIST (Use ONLY these words):
${formatWordList(LEVEL_3_ALLOWED_WORDS)}

RULES:
1. Write 180-220 words exactly - COUNT CAREFULLY!
2. Make 3 exciting paragraphs (60-80 words each)
3. Use simple sentences but PACK with amazing details
4. Write as an adventurous cat explorer
5. Use ONLY words from the list above
6. Include AMAZING discoveries and cultural wonders
7. Make children excited about travel and learning
8. Show mind-blowing differences from home
9. Include specific magical moments and fun facts
10. Build excitement and wonder in every sentence

CONTENT REQUIREMENTS (CRITICAL for excitement):
- Include jaw-dropping cultural discoveries about {LOCATION}
- Show amazing differences that surprise and delight
- Include thrilling travel adventures and magical moments
- Make it feel like a treasure hunt of discoveries
- Use simple words but create WONDER and excitement
- Include sounds, smells, colors, and feelings
- Make children dream of adventure

EXAMPLE STYLE (Follow this excitement level):
"WOW! You will not believe this place! I am in Seoul and everything here is like magic! People eat with two thin sticks like they are doing magic tricks! I watch them pick up tiny rice pieces - amazing! The food is red like fire and makes my mouth dance. At home we just use our hands but here even cats try to use sticks!

The houses here have roofs that curve up to the sky like dragon backs! I climb on them and feel like I am flying! The colors are gold and green and red - so beautiful! People here wear bright clothes and bow to each other like dancers. I see old grandmas selling fish that smell like the ocean. Children play games I never saw before!

Tonight I sleep under stars in a temple garden. The monks ring big bells that sound like thunder from heaven! I learn new cat words in Korean. Tomorrow I climb a mountain that touches clouds! I cannot wait to tell you more amazing stories when I come home!

Your excited friend, Cat"

Now write a letter from a traveling cat in {LOCATION} to their child friend, using ONLY the allowed words above.`,

    wordRange: { min: 180, max: 220 },
    paragraphs: 3
  },

  EMAIL_L3: {
    systemMessage: `CRITICAL: You MUST write exactly 180-220 words. COUNT carefully - you need at least 180 words. You are writing for 10-year-old children who love adventure stories. Use ONLY the words from the allowed list. Make it exciting, fun, and full of amazing discoveries. Write exactly 3 paragraphs. WORD COUNT IS CRITICAL - AIM FOR 200+ WORDS.`,
    
    userPrompt: `You are writing a quick email from a traveling cat to a child friend. Use ONLY the words listed below.

CRITICAL RULE: You can ONLY use words from this exact list. No other words allowed.

ALLOWED WORD LIST (Use ONLY these words):
${formatWordList(LEVEL_3_ALLOWED_WORDS)}

RULES:
1. Write 180-220 words exactly - COUNT CAREFULLY!
2. Make 3 exciting paragraphs (60-80 words each)
3. Use simple sentences packed with wonder
4. Write as an adventurous cat explorer
5. Use ONLY words from the list above
6. Sound thrilled and amazed

CONTENT REQUIREMENTS (CRITICAL for excitement):
- Amazing cultural discoveries about {LOCATION}
- Mind-blowing differences from home
- Thrilling travel moments and magical discoveries
- Make it feel like an adventure story
- Include sounds, colors, smells, feelings

EXAMPLE STYLE (Follow this excitement level):
"WOW! This plane to Seoul is like a flying house! The food comes in tiny magic boxes - each one holds different amazing things! Red soup, white rice, green things I never saw! I try everything and my mouth feels like dancing!

Look at this man next to me! He eats with two thin sticks like a magic trick! He picks up one tiny piece of rice - amazing! I try but my food flies everywhere! He laughs and shows me how. People here are so kind and patient with curious cats!

I look out the window and see clouds like white mountains! The world below looks like a toy box with tiny houses and roads! I cannot wait to explore Seoul and find more magical surprises!

Your excited friend, Cat"

Now write an email from a traveling cat about {SITUATION}, using ONLY the allowed words above.`,

    wordRange: { min: 180, max: 220 },
    paragraphs: 3
  },

  // Level 4: 中級制約
  LETTER_L4: {
    systemMessage: `You are writing for intermediate English learners (B2 level). CRITICAL: You MUST write exactly 200-240 words. COUNT your words carefully - you must reach at least 200 words. Write in exactly 3 paragraphs. Include some complex sentence structures but keep vocabulary accessible. Do not include any labels or headers. WORD COUNT IS CRITICAL.`,
    
    userPrompt: `Write a letter from a traveling cat to their human friend. The cat is sharing travel experiences from {LOCATION}.

CRITICAL REQUIREMENTS:
- Exactly 200-240 words
- Exactly 3 paragraphs
- Intermediate vocabulary (B2 level)
- Personal, friendly tone
- Include cultural observations
- Express emotions about the journey

WRITING STYLE:
- Use some complex sentences but keep them clear
- Include descriptive adjectives
- Show personality and emotions
- Sound like a real friend writing

Write about the cat's experiences in {LOCATION}, including what they've seen, eaten, and learned about the local culture.`,

    wordRange: { min: 200, max: 240 },
    paragraphs: 3
  },

  EMAIL_L4: {
    systemMessage: `You are writing for intermediate English learners (B2 level). CRITICAL: You MUST write exactly 200-240 words. COUNT your words carefully - you must reach at least 200 words. Write in exactly 3 paragraphs. Include some complex sentence structures but keep vocabulary accessible. WORD COUNT IS CRITICAL.`,
    
    userPrompt: `Write a quick email from a traveling cat to their human friend about {SITUATION}.

CRITICAL REQUIREMENTS:
- Exactly 200-240 words
- Exactly 3 paragraphs
- Intermediate vocabulary (B2 level)  
- Casual, friendly email tone
- Quick update style

WRITING STYLE:
- Conversational and immediate
- Include current feelings/experiences
- Sound like a quick travel update
- Use natural email language

Write about {SITUATION} in a casual, friendly way.`,

    wordRange: { min: 200, max: 240 },
    paragraphs: 3
  },

  // Level 5: 上級制約
  LETTER_L5: {
    systemMessage: `You are writing for advanced English learners (C1+ level). CRITICAL: You MUST write exactly 240-280 words. COUNT your words carefully - you must reach at least 240 words. Write in exactly 3 paragraphs. Use sophisticated vocabulary, complex sentence structures, nuanced expressions, and varied sentence patterns. Do not include any labels or headers. WORD COUNT IS CRITICAL.`,
    
    userPrompt: `Write an eloquent letter from a well-traveled, sophisticated cat to their dear human companion. The cat is reflecting on their journey through {LOCATION}.

CRITICAL REQUIREMENTS:
- Exactly 240-280 words
- Exactly 3 paragraphs
- Advanced vocabulary (C1+ level)
- Sophisticated, nuanced writing
- Rich cultural insights
- Emotional depth and reflection

WRITING STYLE:
- Use complex sentence structures and varied patterns
- Include sophisticated vocabulary and expressions
- Show deep cultural appreciation
- Express complex emotions and thoughts
- Sound refined but warm and personal

Write about the cat's profound experiences in {LOCATION}, including cultural discoveries, philosophical reflections, and deep emotional connections to the place and people.`,

    wordRange: { min: 240, max: 280 },
    paragraphs: 3
  },

  EMAIL_L5: {
    systemMessage: `You are writing for advanced English learners (C1+ level). CRITICAL: You MUST write exactly 240-280 words. COUNT your words carefully - you must reach at least 240 words. Write in exactly 3 paragraphs. Use sophisticated vocabulary, complex sentence structures, and nuanced expressions. WORD COUNT IS CRITICAL.`,
    
    userPrompt: `Write a refined email from a cultured, traveling cat to their human friend about {SITUATION}.

CRITICAL REQUIREMENTS:
- Exactly 240-280 words
- Exactly 3 paragraphs
- Advanced vocabulary (C1+ level)
- Sophisticated expert tone (no dialogue format)
- Articulate and expressive

WRITING STYLE:
- Use elegant but natural language
- Include nuanced observations
- Show cultural sophistication
- Express complex thoughts clearly
- Maintain warmth despite formality

Write about {SITUATION} with sophistication and insight.`,

    wordRange: { min: 240, max: 280 },
    paragraphs: 3
  }
};

// プロンプト選択ヘルパー
export const getTravelPrompt = (
  type: 'letter' | 'email',
  level: string,
  location?: string,
  situation?: string
): TravelPromptConfig => {
  const key = `${type.toUpperCase()}_L${level}` as keyof typeof TRAVEL_PROMPTS;
  const template = TRAVEL_PROMPTS[key];
  
  if (!template) {
    throw new Error(`No template found for ${type} level ${level}`);
  }

  // プレースホルダーを置換
  const userPrompt = template.userPrompt
    .replace(/\{LOCATION\}/g, location || 'a beautiful city')
    .replace(/\{SITUATION\}/g, situation || 'their travel experience');

  return {
    systemMessage: template.systemMessage,
    userPrompt,
    wordRange: template.wordRange,
    paragraphs: template.paragraphs
  };
};

// 語彙チェック用（Level 3専用）
export const validateLevel3Vocabulary = (text: string): { isValid: boolean; violations: string[] } => {
  const allAllowedWords = [
    ...LEVEL_3_ALLOWED_WORDS.verbs,
    ...LEVEL_3_ALLOWED_WORDS.nouns, 
    ...LEVEL_3_ALLOWED_WORDS.adjectives,
    ...LEVEL_3_ALLOWED_WORDS.others
  ];
  
  // 特別許可語彙
  const exceptions = ["people", "mother", "father", "sister", "brother", "family", "house", "water", "today"];
  const allowedWords = [...allAllowedWords, ...exceptions];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  const violations = words.filter(word => !allowedWords.includes(word));
  
  return {
    isValid: violations.length === 0,
    violations: [...new Set(violations)]
  };
};