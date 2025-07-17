/** src/types/reward.ts */
export type Reward = "coin" | "bronze" | "silver" | "gold" | "platinum";

export interface RewardState {
  words: number;   // 累計語数
  stamps: number;  // 0-19
  coin: number;    // 0-4
  bronze: number;  // 0-4
  silver: number;  // 0-4
  gold: number;    // 0-3  (4でplatinum)
  platinum: number; // 0-∞
}