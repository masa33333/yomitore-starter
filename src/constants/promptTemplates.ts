// promptTemplates.ts - NGSL基準の語彙レベル制御
import { NGSL_1_500, NGSL_501_1000, getAllowedWords } from './ngslData';

export const promptTemplates = {
  level1: `あなたは英語学習者のための文章を作成するAIです。

【条件】
・対象レベル：Level 1（NGSL 1–500 の語彙のみ使用）
・語彙制限：
  - NGSL 1–500 の語彙のみ使用（99%以上）
  - NGSL 501番以降の語彙は原則使用禁止
・語数：80-120語
・内容：親しみやすく、日常的な話題
・文体：超簡単で短い英語

【文法制約（Level 1専用）】
・構文：単文のみ（主語＋動詞の基本文型）
・時制：現在形と過去形のみ
・禁止：関係代名詞、接続詞、複文、重文
・例：I like cats. Cats are cute. My cat is black.

【NGSL 1-500基本語彙例】
${NGSL_1_500.slice(0, 100).join(', ')}

【使用可能語彙リスト】
Level 1 words ONLY: ${NGSL_1_500.join(', ')}

【出力】
・本文（単文のみで段落構成）
・語彙使用比率（NGSL 1–500：◯語、501以降：◯語、割合：◯%）`,

  level2: `あなたは英語学習者のための文章を作成するAIです。

【条件】
・対象レベル：Level 2（NGSL 1–1000 の語彙中心使用）
・語彙制限：
  - NGSL 1–1000 の語彙を全体の90%以上使用
  - NGSL 1001–1500 の語彙は全体の10%以内
  - NGSL 1501番以降の語彙は使用禁止
・語数：110-150語
・内容：少し深みのある内容（例：趣味、思い出、習慣）
・文体：中学生レベルの英語

【文法制約（Level 2専用）】
・構文：単文中心、軽い複文のみ（andやbut程度）
・時制：現在形、過去形、未来形（will）
・使用可：基本的な助動詞（can, will, should）
・禁止：関係代名詞、受動態、完了形
・例：I went to school. I can play tennis. It was fun and I liked it.

【厳格禁止語彙（Level 2では絶対に使用しない）】
❌ crucial, advocating, fairness, inspire, freed, separation, prominent, pivotal, unwavering, sophisticated, elaborate, contemplate, intricate, subtle, profound

【出力】
・本文（段落をつけて）
・語彙使用比率（1–1000：◯語、1001–1500：◯語、割合：◯%）`,

  level3: `You must write for 10-year-old children. Use ONLY the words listed below. Do not use any other words.

CRITICAL RULE: You can ONLY use words from this exact list. No other words allowed.

ALLOWED WORD LIST (Use ONLY these words):
Verbs: is, are, was, were, do, go, come, get, see, make, have, take, give, eat, drink, play, sleep, walk, run, sit, like, love, want, live, help, buy, use, look, find, put, call, open, can, will
Nouns: cat, dog, pet, food, fish, meat, egg, milk, tea, water, home, house, room, bed, day, time, man, woman, boy, girl, baby, mom, dad, hand, foot, head, eye, hair, red, blue, black, white, sun, rain
Adjectives: good, bad, big, small, new, old, hot, cold, nice, cute, fun, happy, sad, fast, slow, soft
Others: a, an, the, and, or, but, in, on, at, to, for, with, from, of, some, many, all, my, your, his, her, they, them, we, us, this, that, when, where, what, who, how, very, so, too, also, not, yes, no

RULES:
1. Write 150-180 words exactly
2. Make 3 short paragraphs
3. Use simple sentences only
4. Write about cats or dogs as pets
5. Use ONLY words from the list above

EXAMPLE (Follow this style exactly):
"Cats are good pets. Many people love cats. Cats are small and soft. They like to eat fish and meat. Cats drink milk and water. Cats sleep a lot in the day.

Cats can run very fast. They like to play with toys. Cats use their feet to walk on trees. Some cats are black. Some cats are white. All cats are cute and nice.

People like cats at home. Cats make people happy. They are good pets for all family. This is why many people have cats. Cats are the best pets."

Now write about the given topic using ONLY the allowed words above. Do not use any word not in the list.

【出力】
・本文（段落をつけて）
・語彙使用比率（NGSL 1–1500内の語彙：◯%、超過語彙：◯%、語数）`,

  level4: `あなたは英語学習者のための文章を作成するAIです。

【条件】
・対象レベル：Level 4（B2レベル）
・語彙制限：
  - NGSL 1–2500 の語彙を中心に構成
  - NGSL以外の語彙や専門語彙も最大10%までなら使用可（自然な文脈で）
・語数：200-240語（CRITICAL: 必ず200語以上書くこと）
・内容：教養や国際的視点を含んだ、読後に学びがあるテーマ（例：教育制度の違い、気候変動、働き方の変化）
・文体：ややアカデミックだが読みやすさ重視
・文法：高度な構文も可。ただし冗長な表現は避ける

【重要】最終的に200語以上になるよう、詳細な例や追加の段落を含めて書くこと

【出力】
・本文（段落あり）
・語彙使用比率（NGSL 1–2500：◯%、NGSL以外：◯%、語数）`,

  level5: `あなたは英語学習者のための文章を作成するAIです。

【条件】
・対象レベル：Level 5（上級者・準ネイティブレベル）
・語彙制限：なし（ただし、意味の取りづらい専門用語の多用は避ける）
・語数：240-280語（CRITICAL: 必ず240語以上書くこと）
・内容：知的好奇心を刺激する、抽象的なテーマや複雑な社会問題（例：AIと倫理、アイデンティティの多様性、都市と孤独）
・文体：論説・エッセイ風の構成もOK。英語圏の新聞・コラムを参考に
・文法：完全に自然な英語として成立するもの。自然な倒置・省略・比喩表現なども可

【重要】最終的に240語以上になるよう、詳細な分析、具体例、追加の段落を含めて書くこと

【出力】
・本文（段落つき）
・語彙難易度に応じたハイライト単語の提示（5〜10語）
・それらの単語について簡単な英語定義を併記`
};

export function getPromptTemplate(level: number): string {
  const levelKey = `level${level}` as keyof typeof promptTemplates;
  return promptTemplates[levelKey] || promptTemplates.level3;
}