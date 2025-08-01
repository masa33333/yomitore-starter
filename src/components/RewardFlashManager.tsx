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
      console.log('🎊 RECEIVED showRewardFlash EVENT:', { rewardType, count, currentReward });
      
      // 演出が既に表示中の場合はスキップ
      if (currentReward && currentReward.show) {
        console.log('🚫 Skipping animation - already showing:', currentReward);
        return;
      }
      
      // 音楽再生
      setTimeout(() => {
        if (rewardType === 'coin') {
          playCoinFanfare();
        } else {
          playTrophyFanfare();
        }
      }, 100);
      
      // 演出表示
      const newReward = {
        show: true,
        type: rewardType,
        count: count
      };
      console.log('🎊 Setting currentReward to:', newReward);
      setCurrentReward(newReward);
    };

    window.addEventListener('showRewardFlash', handleShowRewardFlash as EventListener);
    
    return () => {
      window.removeEventListener('showRewardFlash', handleShowRewardFlash as EventListener);
    };
  }, [currentReward]);

  const handleFlashComplete = () => {
    setCurrentReward(null);
  };

  return (
    <div className={className}>
      {currentReward ? (
        <RewardFlash
          show={currentReward.show}
          rewardType={currentReward.type}
          count={currentReward.count}
          onComplete={handleFlashComplete}
        />
      ) : null}
    </div>
  );
}