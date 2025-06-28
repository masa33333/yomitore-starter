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
  verbs: ["is", "are", "was", "were", "do", "go", "come", "get", "see", "make", "have", "take", "give", "eat", "drink", "play", "sleep", "walk", "run", "sit", "like", "love", "want", "live", "help", "buy", "use", "look", "find", "put", "call", "open", "can", "will"],
  nouns: ["cat", "dog", "pet", "food", "fish", "meat", "egg", "milk", "tea", "water", "home", "house", "room", "bed", "day", "time", "man", "woman", "boy", "girl", "baby", "mom", "dad", "hand", "foot", "head", "eye", "hair", "red", "blue", "black", "white", "sun", "rain"],
  adjectives: ["good", "bad", "big", "small", "new", "old", "hot", "cold", "nice", "cute", "fun", "happy", "sad", "fast", "slow", "soft"],
  others: ["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "from", "of", "some", "many", "all", "my", "your", "his", "her", "they", "them", "we", "us", "this", "that", "when", "where", "what", "who", "how", "very", "so", "too", "also", "not", "yes", "no"]
};

const formatWordList = (words: typeof LEVEL_3_ALLOWED_WORDS): string => {
  return `
Verbs: ${words.verbs.join(", ")}
Nouns: ${words.nouns.join(", ")}
Adjectives: ${words.adjectives.join(", ")}
Others: ${words.others.join(", ")}`;
};

export const TRAVEL_PROMPTS = {
  // Level 1-3: 完全語彙リスト制限（最も効果的）
  LETTER_L3: {
    systemMessage: `CRITICAL: You are writing for 10-year-old children. You MUST use ONLY the simplest English words. Any word longer than 5 letters is FORBIDDEN (except: people, mother, father, sister, brother, family, house, water, today). Use only words that appear in beginner children's books. Write exactly 140-200 words in 3 paragraphs. EVERY word must be simple and basic.`,
    
    userPrompt: `You are writing a letter from a traveling cat to a child friend. Use ONLY the words listed below. Do not use any other words.

CRITICAL RULE: You can ONLY use words from this exact list. No other words allowed.

ALLOWED WORD LIST (Use ONLY these words):
${formatWordList(LEVEL_3_ALLOWED_WORDS)}

RULES:
1. Write 140-200 words exactly
2. Make 3 short paragraphs  
3. Use simple sentences only
4. Write as a cat writing to a friend
5. Use ONLY words from the list above
6. Include travel experiences and cultural discoveries
7. Sound friendly and excited about new experiences
8. Show differences from home/Japan
9. Include specific local details and fun facts

CONTENT REQUIREMENTS (Very Important):
- Include interesting cultural facts about {LOCATION}
- Show differences from Japan/home
- Include specific travel experiences and episodes
- Make it entertaining and educational
- Use simple words but rich content

EXAMPLE STYLE (Follow this pattern exactly):
"Hi! I am in Seoul now. People here eat with two sticks! It is very fun but hard for cats. They put red food on rice. It is hot but so good! At home we eat fish with hands.

I see big houses with pretty roofs. The roofs go up like this! People here love cats too. They give me fish and say nice words. But they talk so fast! Not like home at all.

I walk on old roads made of big rocks. Some roads are 500 years old! Can you think? I will come home soon with many stories.

Love, Cat"

Now write a letter from a traveling cat in {LOCATION} to their child friend, using ONLY the allowed words above.`,

    wordRange: { min: 140, max: 200 },
    paragraphs: 3
  },

  EMAIL_L3: {
    systemMessage: `CRITICAL: You are writing for 10-year-old children. You MUST use ONLY the simplest English words. Any word longer than 5 letters is FORBIDDEN (except: people, mother, father, sister, brother, family, house, water, today). Use only words that appear in beginner children's books. Write exactly 140-200 words in 3 paragraphs. EVERY word must be simple and basic.`,
    
    userPrompt: `You are writing a quick email from a traveling cat to a child friend. Use ONLY the words listed below.

CRITICAL RULE: You can ONLY use words from this exact list. No other words allowed.

ALLOWED WORD LIST (Use ONLY these words):
${formatWordList(LEVEL_3_ALLOWED_WORDS)}

RULES:
1. Write 140-200 words exactly
2. Make 3 paragraphs
3. Use simple sentences only  
4. Write as a cat sending a quick update
5. Use ONLY words from the list above
6. Sound casual and friendly

CONTENT REQUIREMENTS (Very Important):
- Quick cultural observation about {LOCATION} 
- Compare to home/Japan
- Specific travel moment or discovery
- Make it immediate and engaging

EXAMPLE STYLE (Follow this pattern exactly):
"Hi! I am on a plane to Seoul! The food here is in small boxes. Each box has many little foods! So nice but so small for cats.

I see a man eat with two sticks. He is very good at it! I try but all my food goes on the floor. People here are so nice about it.

Love, Cat"

Now write an email from a traveling cat about {SITUATION}, using ONLY the allowed words above.`,

    wordRange: { min: 140, max: 200 },
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
- Sophisticated yet conversational tone
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