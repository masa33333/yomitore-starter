import { describe, it, expect } from 'vitest';
import { addWords, getInitialRewardState } from '@/utils/rewardUtils';

describe('rewardUtils', () => {
  describe('addWords', () => {
    it('should convert 2,000 words to 1 coin', () => {
      const initial = getInitialRewardState();
      const result = addWords(initial, 2000);
      
      expect(result).toEqual({
        words: 2000,
        stamps: 0,
        coin: 1,
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0
      });
    });

    it('should convert 10,000 words to 1 bronze', () => {
      const initial = getInitialRewardState();
      const result = addWords(initial, 10000);
      
      expect(result).toEqual({
        words: 10000,
        stamps: 0,
        coin: 0,
        bronze: 1,
        silver: 0,
        gold: 0,
        platinum: 0
      });
    });

    it('should convert 60,000 words to 1 silver and 1 bronze', () => {
      const initial = getInitialRewardState();
      const result = addWords(initial, 60000);
      
      expect(result).toEqual({
        words: 60000,
        stamps: 0,
        coin: 0,
        bronze: 1,
        silver: 1,
        gold: 0,
        platinum: 0
      });
    });

    it('should convert 1,000,000 words to 1 platinum with all others at 0', () => {
      const initial = getInitialRewardState();
      const result = addWords(initial, 1000000);
      
      expect(result).toEqual({
        words: 1000000,
        stamps: 0,
        coin: 0,
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 1
      });
    });

    it('should handle incremental additions correctly', () => {
      let state = getInitialRewardState();
      
      // Add 500 words (5 stamps)
      state = addWords(state, 500);
      expect(state.stamps).toBe(5);
      expect(state.coin).toBe(0);
      
      // Add 1500 more words (15 more stamps = 20 total = 1 coin)
      state = addWords(state, 1500);
      expect(state.stamps).toBe(0);
      expect(state.coin).toBe(1);
      expect(state.words).toBe(2000);
    });

    it('should handle partial conversions correctly', () => {
      const initial = getInitialRewardState();
      const result = addWords(initial, 1550);
      
      expect(result).toEqual({
        words: 1550,
        stamps: 15,
        coin: 0,
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0
      });
    });

    it('should preserve existing state when adding words', () => {
      const existingState = {
        words: 1000,
        stamps: 5,
        coin: 2,
        bronze: 1,
        silver: 0,
        gold: 0,
        platinum: 0
      };
      
      const result = addWords(existingState, 1000);
      
      expect(result).toEqual({
        words: 2000,
        stamps: 0,
        coin: 0,
        bronze: 2,
        silver: 0,
        gold: 0,
        platinum: 0
      });
    });
  });

  describe('getInitialRewardState', () => {
    it('should return initial state with all values at 0', () => {
      const result = getInitialRewardState();
      
      expect(result).toEqual({
        words: 0,
        stamps: 0,
        coin: 0,
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0
      });
    });
  });
});