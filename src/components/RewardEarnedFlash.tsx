'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RewardState } from '@/types/reward';
import Image from 'next/image';

interface RewardEarnedFlashProps {
  className?: string;
}

const REWARD_ICONS = {
  coin: '/images/coin.png',
  bronze: '/images/trophy-c.png',
  silver: '/images/trophy-c.png', // 暫定的に同じ画像を使用
  gold: '/images/trophy-c.png',   // 暫定的に同じ画像を使用
  platinum: '/images/trophy-c.png' // 暫定的に同じ画像を使用
};

const REWARD_NAMES = {
  coin: 'コイン',
  bronze: 'ブロンズトロフィー',
  silver: 'シルバートロフィー',
  gold: 'ゴールドトロフィー',
  platinum: 'プラチナトロフィー'
};

export default function RewardEarnedFlash({ className = '' }: RewardEarnedFlashProps) {
  const [earnedRewards, setEarnedRewards] = useState<Array<{
    type: keyof typeof REWARD_ICONS;
    count: number;
    id: string;
  }>>([]);

  const getFilterClass = (type: keyof typeof REWARD_ICONS) => {
    switch (type) {
      case 'bronze': return '';
      case 'silver': return 'brightness-150 saturate-0';
      case 'gold': return 'hue-rotate-45 saturate-150';
      case 'platinum': return 'brightness-200 contrast-150';
      default: return '';
    }
  };

  useEffect(() => {
    const handleRewardEarned = (event: CustomEvent) => {
      const { newReward, oldReward } = event.detail as { 
        newReward: RewardState; 
        oldReward: RewardState 
      };

      const newEarnedRewards = [];
      
      // 各報酬タイプの増加をチェック
      const rewardTypes = ['coin', 'bronze', 'silver', 'gold', 'platinum'] as const;
      
      for (const type of rewardTypes) {
        const increase = newReward[type] - oldReward[type];
        if (increase > 0) {
          newEarnedRewards.push({
            type,
            count: increase,
            id: `${type}-${Date.now()}-${Math.random()}`
          });
        }
      }

      if (newEarnedRewards.length > 0) {
        setEarnedRewards(prev => [...prev, ...newEarnedRewards]);
        
        // 3秒後に自動的に消去
        setTimeout(() => {
          setEarnedRewards(prev => 
            prev.filter(reward => 
              !newEarnedRewards.some(newReward => newReward.id === reward.id)
            )
          );
        }, 3000);
      }
    };

    window.addEventListener('rewardEarned', handleRewardEarned as EventListener);
    
    return () => {
      window.removeEventListener('rewardEarned', handleRewardEarned as EventListener);
    };
  }, []);

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      <AnimatePresence>
        {earnedRewards.map((reward) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-3 rounded-lg shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="text-2xl">
                {REWARD_ICONS[reward.type].startsWith('/images/') ? (
                  <Image 
                    src={REWARD_ICONS[reward.type]} 
                    alt={reward.type}
                    width={32}
                    height={32}
                    className={`inline-block ${getFilterClass(reward.type)}`}
                  />
                ) : (
                  <span>{REWARD_ICONS[reward.type]}</span>
                )}
              </div>
              <div>
                <div className="font-bold text-sm">
                  {REWARD_NAMES[reward.type]}獲得！
                </div>
                <div className="text-xs opacity-90">
                  {reward.count > 1 ? `×${reward.count}` : ''}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}