/** src/utils/rewardUtils.ts */
import { RewardState } from "@/types/reward";

export const addWords = (state: RewardState, delta: number): RewardState => {
  const newState = { ...state };
  newState.words += delta;
  newState.stamps += Math.floor(delta / 100);

  if (newState.stamps >= 20) {
    newState.coin += Math.floor(newState.stamps / 20);
    newState.stamps %= 20;
  }
  if (newState.coin >= 5) {
    newState.bronze += Math.floor(newState.coin / 5);
    newState.coin %= 5;
  }
  if (newState.bronze >= 5) {
    newState.silver += Math.floor(newState.bronze / 5);
    newState.bronze %= 5;
  }
  if (newState.silver >= 5) {
    newState.gold += Math.floor(newState.silver / 5);
    newState.silver %= 5;
  }
  if (newState.gold >= 4) {
    newState.platinum += Math.floor(newState.gold / 4);
    newState.gold %= 4;
  }
  return newState;
};

export const getInitialRewardState = (): RewardState => ({
  words: 0,
  stamps: 0,
  coin: 0,
  bronze: 0,
  silver: 0,
  gold: 0,
  platinum: 0
});

export const saveRewardState = (state: RewardState): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yomitore.reward.v2', JSON.stringify(state));
  }
};

export const loadRewardState = (): RewardState => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('yomitore.reward.v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing reward state:', error);
      }
    }
  }
  return getInitialRewardState();
};