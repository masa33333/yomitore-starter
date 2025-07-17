'use client';

import { useState, useEffect } from 'react';
import RewardFlash from './RewardFlash';
import { playCoinFanfare, playTrophyFanfare } from '@/lib/stampSounds';

interface RewardFlashManagerProps {
  className?: string;
}

export default function RewardFlashManager({ className = '' }: RewardFlashManagerProps) {
  const [currentReward, setCurrentReward] = useState<{
    show: boolean;
    type: 'coin' | 'bronze' | 'silver' | 'gold' | 'platinum';
    count: number;
  } | null>(null);

  useEffect(() => {
    const handleShowRewardFlash = (event: CustomEvent) => {
      const { rewardType, count } = event.detail;
      
      console.log(`🎉 全画面報酬演出開始: ${rewardType} ×${count}`);
      
      // 音楽再生
      if (rewardType === 'coin') {
        playCoinFanfare();
      } else {
        playTrophyFanfare();
      }
      
      // 全画面演出表示
      setCurrentReward({
        show: true,
        type: rewardType,
        count: count
      });
    };

    window.addEventListener('showRewardFlash', handleShowRewardFlash as EventListener);
    
    return () => {
      window.removeEventListener('showRewardFlash', handleShowRewardFlash as EventListener);
    };
  }, []);

  const handleFlashComplete = () => {
    console.log('✅ 全画面報酬演出完了');
    setCurrentReward(null);
  };

  return (
    <div className={className}>
      {currentReward && (
        <RewardFlash
          show={currentReward.show}
          rewardType={currentReward.type}
          count={currentReward.count}
          onComplete={handleFlashComplete}
        />
      )}
    </div>
  );
}