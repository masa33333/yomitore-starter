// Level 3で絶対に使用禁止の語彙リスト
export const LEVEL3_FORBIDDEN_WORDS = [
  // 6文字以上の複雑語彙
  'wonderful', 'amazing', 'incredible', 'fantastic', 'excellent', 'perfect', 'beautiful', 
  'popular', 'famous', 'special', 'different', 'important', 'interesting', 'exciting',
  
  // 抽象的概念
  'loyalty', 'companionship', 'relationship', 'friendship', 'communication', 'emotion',
  'personality', 'character', 'behavior', 'attitude', 'feeling', 'experience',
  
  // 専門・技術用語
  'detect', 'diseases', 'cancer', 'medical', 'scientific', 'technology', 'equipment',
  'professional', 'specialist', 'expert', 'training', 'educated', 'qualified',
  
  // 複雑動作・状態
  'communicate', 'demonstrate', 'recognize', 'identify', 'discover', 'explore',
  'investigate', 'examine', 'analyze', 'consider', 'appreciate', 'understand',
  
  // 高次形容詞
  'fascinating', 'remarkable', 'outstanding', 'exceptional', 'extraordinary', 'magnificent',
  'incredible', 'amazing', 'wonderful', 'fantastic', 'marvelous', 'spectacular',
  
  // 複雑名詞
  'companions', 'creatures', 'abilities', 'disabilities', 'protection', 'security',
  'opportunity', 'possibility', 'responsibility', 'achievement', 'improvement',
  
  // 文語・古語
  'ancient', 'historical', 'traditional', 'cultural', 'worshipped', 'mummified',
  'preserved', 'blessing', 'valuable', 'precious', 'sacred', 'divine',
  
  // 長い語彙（基本語彙以外）
  'independent', 'themselves', 'everything', 'something', 'everyone', 'someone',
  'anywhere', 'everywhere', 'whenever', 'however', 'whatever', 'whoever',
  
  // 学術語彙
  'conclusion', 'introduction', 'explanation', 'description', 'information',
  'education', 'knowledge', 'wisdom', 'intelligence', 'creativity', 'imagination'
];

// Level 3で使用可能な基本語彙のみ
export const LEVEL3_ALLOWED_WORDS = [
  // 基本動詞
  'is', 'are', 'was', 'were', 'do', 'did', 'go', 'went', 'come', 'came', 'get', 'got',
  'see', 'saw', 'make', 'made', 'have', 'had', 'take', 'took', 'give', 'gave',
  'eat', 'ate', 'drink', 'play', 'work', 'study', 'learn', 'read', 'write', 'help',
  'buy', 'use', 'live', 'stay', 'sleep', 'walk', 'run', 'sit', 'stand', 'open', 'close',
  'start', 'stop', 'like', 'love', 'want', 'need', 'think', 'know', 'tell', 'say',
  'ask', 'talk', 'listen', 'hear', 'watch', 'look', 'find', 'keep', 'put', 'call',
  'wait', 'meet', 'visit', 'cook', 'clean', 'wash', 'swim', 'fly', 'drive', 'ride',
  
  // 基本名詞
  'cat', 'dog', 'bird', 'fish', 'food', 'rice', 'bread', 'meat', 'egg', 'milk',
  'tea', 'water', 'apple', 'home', 'house', 'room', 'school', 'class', 'book',
  'pen', 'desk', 'chair', 'door', 'car', 'bus', 'bike', 'park', 'shop', 'store',
  'city', 'town', 'man', 'woman', 'boy', 'girl', 'baby', 'family', 'friend',
  'name', 'face', 'hand', 'foot', 'head', 'eye', 'hair', 'day', 'week', 'month',
  'year', 'time', 'job', 'money', 'game', 'sport', 'music', 'movie', 'TV',
  'color', 'red', 'blue', 'green', 'black', 'white', 'tree', 'flower', 'sun',
  'moon', 'rain', 'snow', 'wind', 'hot', 'cold', 'warm', 'cool',
  
  // 基本形容詞
  'good', 'bad', 'big', 'small', 'new', 'old', 'hot', 'cold', 'long', 'short',
  'tall', 'fast', 'slow', 'easy', 'hard', 'nice', 'cute', 'fun', 'happy',
  'sad', 'angry', 'tired', 'busy', 'free', 'clean', 'dirty', 'safe', 'quiet', 'loud',
  
  // 基本副詞・前置詞
  'very', 'much', 'many', 'some', 'all', 'no', 'not', 'yes', 'here', 'there',
  'where', 'when', 'how', 'why', 'what', 'who', 'now', 'then', 'today', 'every',
  'always', 'never', 'often', 'maybe', 'really', 'only', 'also', 'too', 'well',
  'in', 'on', 'at', 'to', 'from', 'with', 'for', 'by', 'about', 'under', 'over',
  'up', 'down', 'out', 'into', 'near', 'far', 'left', 'right', 'front', 'back'
];

// 語彙チェック関数
export function isLevel3Forbidden(word: string): boolean {
  return LEVEL3_FORBIDDEN_WORDS.includes(word.toLowerCase());
}

export function isLevel3Allowed(word: string): boolean {
  return LEVEL3_ALLOWED_WORDS.includes(word.toLowerCase());
}

// テキスト内の禁止語彙を検出
export function findForbiddenWords(text: string, level: number): string[] {
  if (level > 3) return []; // Level 4以上は制限なし
  
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const forbidden: string[] = [];
  
  words.forEach(word => {
    if (isLevel3Forbidden(word)) {
      forbidden.push(word);
    }
    // 6文字以上の語彙もチェック（例外語彙以外）
    else if (word.length > 5 && !isLevel3Allowed(word)) {
      const exceptions = ['people', 'school', 'animal', 'mother', 'father', 'sister', 'brother', 'friend', 'family', 'house', 'money', 'water', 'color', 'music', 'movie', 'flower', 'today', 'happy', 'study', 'little', 'before', 'after', 'other', 'first', 'around', 'under', 'never', 'always', 'really', 'there', 'where', 'right', 'about', 'think', 'work', 'year', 'time', 'make', 'come', 'look', 'take', 'help', 'like', 'want', 'know'];
      if (!exceptions.includes(word)) {
        forbidden.push(word);
      }
    }
  });
  
  return [...new Set(forbidden)]; // 重複除去
}