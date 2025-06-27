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

【出力】
・本文（段落をつけて）
・語彙使用比率（1–1000：◯語、1001–1500：◯語、割合：◯%）`,

  level3: `あなたは英語学習者のための文章を作成するAIです。

【条件】
・対象レベル：Level 3（B1レベル）
・語彙制限：
  - NGSL 1–1500 までの語彙のみ使用（95%以上）
  - NGSL 1501番以降は使用禁止
・語数：140-200語
・内容：文化、習慣、発見など（興味深いが複雑すぎない話題）
・文体：自然で読みやすい英語

【文法制約（Level 3専用）】
・構文：複文使用可、関係詞も軽く使用可
・時制：現在完了、過去完了も使用可
・使用可：受動態、比較級、仮定法（基本的なもの）
・例：People who live in Japan often eat rice. This has been a tradition for many years.

【使用可能語彙リスト】
NGSL 1-1500: ${getAllowedWords(3).slice(0, 200).join(', ')}...

【厳格禁止語彙（NGSL 1501以降）】
❌ quaint, piqued, parchment, tucked, resilience, embracing, suppress, elaborate, contemplate, sophisticated, mischievous, fumble, glimpse, whisper, murmur, intricate, subtle, profound, comprehensive, demonstrate, phenomenon

【出力】
・本文（段落をつけて）
・語彙使用比率（NGSL 1–1500内の語彙：◯%、超過語彙：◯%、語数）`,

  level4: `あなたは英語学習者のための文章を作成するAIです。

【条件】
・対象レベル：Level 4
・語彙制限：
  - NGSL 1–2500 の語彙を中心に構成
  - NGSL以外の語彙や専門語彙も最大10%までなら使用可（自然な文脈で）
・語数：170-250語
・内容：教養や国際的視点を含んだ、読後に学びがあるテーマ（例：教育制度の違い、気候変動、働き方の変化）
・文体：ややアカデミックだが読みやすさ重視
・文法：高度な構文も可。ただし冗長な表現は避ける

【出力】
・本文（段落あり）
・語彙使用比率（NGSL 1–2500：◯%、NGSL以外：◯%、語数）`,

  level5: `あなたは英語学習者のための文章を作成するAIです。

【条件】
・対象レベル：Level 5（上級者・準ネイティブレベル）
・語彙制限：なし（ただし、意味の取りづらい専門用語の多用は避ける）
・語数：200-300語
・内容：知的好奇心を刺激する、抽象的なテーマや複雑な社会問題（例：AIと倫理、アイデンティティの多様性、都市と孤独）
・文体：論説・エッセイ風の構成もOK。英語圏の新聞・コラムを参考に
・文法：完全に自然な英語として成立するもの。自然な倒置・省略・比喩表現なども可

【出力】
・本文（段落つき）
・語彙難易度に応じたハイライト単語の提示（5〜10語）
・それらの単語について簡単な英語定義を併記`
};

export function getPromptTemplate(level: number): string {
  const levelKey = `level${level}` as keyof typeof promptTemplates;
  return promptTemplates[levelKey] || promptTemplates.level3;
}