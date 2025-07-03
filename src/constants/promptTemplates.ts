// promptTemplates.ts - NGSL基準の語彙レベル制御
import { NGSL_1_500 } from './ngslData';

export const promptTemplates = {
  level1: `You are creating educational content for English learners.

CRITICAL REQUIREMENTS:
- Target Level: Level 1 (NGSL 1-500 vocabulary ONLY)
- Vocabulary Constraint: Use ONLY NGSL 1-500 words (99%+ compliance)
- Word Count: 80-120 words exactly
- Content: Simple, everyday topics that children can relate to
- Writing Style: Very simple and short English sentences

GRAMMAR CONSTRAINTS (Level 1 ONLY):
- Structure: Simple sentences only (Subject + Verb basic patterns)
- Tenses: Present tense and past tense only
- FORBIDDEN: Relative pronouns, conjunctions, complex sentences, compound sentences
- Examples: "I like cats. Cats are cute. My cat is black."

ALLOWED VOCABULARY (Use ONLY these words):
${NGSL_1_500.join(', ')}

OUTPUT FORMAT:
Write 3 short paragraphs using ONLY the vocabulary listed above. Count your words carefully to stay within 80-120 words.`,

  level2: `You are creating educational content for English learners.

CRITICAL REQUIREMENTS:
- Target Level: Level 2 (NGSL 1-1000 vocabulary focus)
- Vocabulary Constraint: 
  * Use NGSL 1-1000 words for 90%+ of content
  * NGSL 1001-1500 words maximum 10%
  * ABSOLUTELY FORBIDDEN: Any words beyond NGSL 1500
- Word Count: 110-150 words exactly
- Content: Slightly deeper topics (hobbies, memories, habits)
- Writing Style: Middle school level English

GRAMMAR CONSTRAINTS (Level 2):
- Structure: Simple sentences with light compound sentences (and, but only)
- Tenses: Present, past, future (will)
- Allowed: Basic modals (can, will, should)
- FORBIDDEN: Relative pronouns, passive voice, perfect tenses
- Examples: "I went to school. I can play tennis. It was fun and I liked it."

STRICTLY FORBIDDEN WORDS (NEVER use in Level 2):
❌ crucial, advocating, fairness, inspire, freed, separation, prominent, pivotal, unwavering, sophisticated, elaborate, contemplate, intricate, subtle, profound

OUTPUT FORMAT:
Write 3-4 paragraphs using appropriate vocabulary. Count your words to stay within 110-150 words.`,

  level3: `You are writing for 10-year-old children. Use ONLY basic English words that children know.

CRITICAL REQUIREMENTS:
- Target Level: Level 3 (NGSL 1-1500 vocabulary)
- Vocabulary Constraint: Use ONLY words from NGSL 1-1500 list
- Word Count: 140-200 words exactly
- Content: Engaging topics suitable for children
- Writing Style: Simple but interesting sentences

GRAMMAR CONSTRAINTS (Level 3):
- Structure: Simple and compound sentences
- Basic relative pronouns allowed (that, which, who)
- Tenses: Present, past, future, present perfect (basic)
- Examples: "The cat that lives next door is very friendly. I have seen many cats in my life."

FORBIDDEN VOCABULARY (NEVER use these words):
❌ sophisticated, elaborate, contemplate, intricate, subtle, profound, magnificent, extraordinary, exceptional, comprehensive, fascinating, incredible, astonishing, remarkable, spectacular, overwhelming, tremendous, substantial, significant, considerable

ALLOWED VOCABULARY FOCUS:
Use words from NGSL 1-1500 that children would know: animals, family, school, home, food, colors, feelings, basic activities, simple adjectives.

OUTPUT FORMAT:
Write exactly 3 paragraphs using appropriate Level 3 vocabulary. Count your words to stay within 140-200 words.`,

  level4: `You are creating educational content for intermediate English learners.

CRITICAL REQUIREMENTS:
- Target Level: Level 4 (B2 level)
- Vocabulary Constraint:
  * Focus on NGSL 1-2500 vocabulary
  * Specialized vocabulary allowed up to 10% (in natural context)
- Word Count: 200-240 words exactly (CRITICAL: Must reach at least 200 words)
- Content: Educational topics with international perspective (education systems, climate change, work culture changes)
- Writing Style: Somewhat academic but prioritizing readability
- Grammar: Advanced structures allowed, but avoid redundant expressions

IMPORTANT: Include detailed examples and additional paragraphs to reach at least 200 words.

OUTPUT FORMAT:
Write 3-4 well-developed paragraphs with sophisticated but accessible language.`,

  level5: `You are creating advanced educational content for English learners.

CRITICAL REQUIREMENTS:
- Target Level: Level 5 (Advanced/Near-native level)
- Vocabulary Constraint: No restrictions (but avoid excessive technical jargon)
- Word Count: 240-280 words exactly (CRITICAL: Must reach at least 240 words)
- Content: Intellectually stimulating, abstract themes or complex social issues (AI ethics, identity diversity, urban loneliness)
- Writing Style: Essay/editorial style acceptable. Reference English-speaking newspapers and columns
- Grammar: Completely natural English. Natural inversion, ellipsis, metaphorical expressions allowed

IMPORTANT: Include detailed analysis, specific examples, and additional paragraphs to reach at least 240 words.

OUTPUT FORMAT:
Write sophisticated, well-structured content with advanced vocabulary and complex sentence structures.`
};

export function getPromptTemplate(level: number): string {
  const levelKey = `level${level}` as keyof typeof promptTemplates;
  return promptTemplates[levelKey] || promptTemplates.level3;
}