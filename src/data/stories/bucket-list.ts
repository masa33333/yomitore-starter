/**
 * 「最高の人生の見つけ方」The Bucket List
 * 3段階レベル対応ストーリーデータ
 */

export interface StoryContent {
  level: number;
  title: string;
  content: string;
  wordCount: number;
  vocabularyLevel: string;
  description: string;
}

export const bucketListStory: StoryContent[] = [
  // Level 1: 100-140語 (基本語彙のみ)
  {
    level: 1,
    title: "The Bucket List (Level 1)",
    wordCount: 125,
    vocabularyLevel: "A1 (NGSL 1-500)",
    description: "幼稚園〜小学校低学年レベル。最も基本的な語彙と単文のみ使用。",
    content: `Carter and Edward are two old men. They are sick. They stay in a hospital. Carter likes to read books. Edward has lots of money. He does not like people very much.

Carter writes a list. He calls it a "bucket list." This list has things he wants to do. He wants to see beautiful places. He wants to help his family. Edward sees the list. He thinks it is good.

Edward has money. Carter has good ideas. They become friends. They leave the hospital together. They go to many places. They see mountains and oceans. They eat good food. They laugh a lot.

Carter and Edward learn important things. They learn that friendship is good. They learn that helping people makes you happy. They learn that life is short. You must do things that make you happy. The bucket list helps them find joy.`
  },

  // Level 2: 140-180語 (日常語彙)
  {
    level: 2,
    title: "The Bucket List (Level 2)",
    wordCount: 165,
    vocabularyLevel: "A2 (NGSL 1-1000)",
    description: "中学生レベル。日常的な語彙と基本的な複文を使用。",
    content: `Carter Chambers and Edward Cole are two elderly men who meet in a hospital. Carter is a mechanic who loves learning about history and culture. Edward is a wealthy businessman who owns many hospitals. Both men are fighting serious illness and don't have much time left.

Carter begins writing a "bucket list" - a collection of things he wants to experience before he dies. His list includes traveling to beautiful places, understanding different cultures, and spending quality time with family. When Edward discovers this list, he becomes interested in the idea.

Edward offers to use his money to help make Carter's dreams come true. Together, they escape from the hospital and begin an extraordinary adventure. They travel around the world, visiting famous landmarks and trying new experiences. They skydive, drive expensive cars, and eat at the best restaurants.

During their journey, both men change significantly. Carter becomes more confident and adventurous. Edward learns about friendship and kindness. They discover that the most important things in life are not money or possessions, but relationships and meaningful experiences that bring joy and purpose to life.`
  },

  // Level 3: 170-220語 (中級語彙)
  {
    level: 3,
    title: "The Bucket List (Level 3)",
    wordCount: 195,
    vocabularyLevel: "B1 (NGSL 1-2000)",
    description: "高校生レベル。幅広い語彙と複雑な文構造を使用。",
    content: `Carter Chambers and Edward Cole are two terminally ill patients who share a hospital room despite their vastly different backgrounds. Carter is a knowledgeable auto mechanic with a passion for history and trivia, while Edward is a billionaire hospital owner known for his cynical attitude and emotional isolation.

When Carter creates a "bucket list" containing experiences he wishes to accomplish before dying, Edward initially dismisses it as sentimental nonsense. However, curiosity eventually overcomes his skepticism, and he proposes using his considerable wealth to fulfill both their dreams together.

Their remarkable journey takes them across continents as they pursue extraordinary adventures. They witness breathtaking sunrises over the Himalayas, experience the thrill of skydiving, race vintage motorcycles, and savor gourmet cuisine in world-renowned restaurants. Each experience challenges their preconceptions about life and mortality.

Through their shared adventures, profound transformation occurs in both men. Carter discovers confidence he never knew he possessed and learns to embrace spontaneity. Edward gradually abandons his emotional barriers, developing genuine compassion and understanding the value of authentic human connection.

Ultimately, their bucket list becomes more than a collection of activities—it evolves into a powerful catalyst for personal growth, teaching them that life's greatest treasures are found in relationships, shared experiences, and the courage to pursue dreams regardless of circumstances or remaining time.`
  }
];

// 使用例のヘルパー関数
export function getBucketListStory(level: number): StoryContent | null {
  return bucketListStory.find(story => story.level === level) || null;
}

export function getAllBucketListStories(): StoryContent[] {
  return bucketListStory;
}

// ストーリー情報の取得
export const bucketListInfo = {
  title: "最高の人生の見つけ方",
  englishTitle: "The Bucket List",
  genre: "Drama",
  year: 2007,
  description: "余命わずかな二人の男性が、死ぬ前にやりたいことをリストにして実行していく感動的な物語",
  themes: ["friendship", "life", "dreams", "adventure", "meaning"],
  slug: "bucket-list"
};