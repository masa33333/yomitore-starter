'use client';

import { useState, useEffect, useCallback } from 'react';
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
      
      console.log(`🎉 報酬演出開始: ${rewardType} ×${count}`);
      
      // 演出が既に表示中かどうかをチェック
      setCurrentReward(prev => {
        
        if (prev && prev.show) {
          console.log(`⚠️ 報酬演出既に表示中のため、新しい演出をスキップ: ${rewardType} ×${count}`);
          return prev; // 既存の状態を維持
        }
        
        // 新しい演出を開始
        console.log(`✨ 新しい報酬演出を開始: ${rewardType} ×${count}`);
        
        // 音楽再生（RewardFlashManagerで一元管理）
        setTimeout(() => {
          try {
            console.log(`🎵 音声再生開始: ${rewardType}`);
            if (rewardType === 'coin') {
              playCoinFanfare();
            } else {
              playTrophyFanfare();
            }
          } catch (error) {
            console.error('🎵 報酬音声再生エラー:', error);
          }
        }, 200);
        
        return {
          show: true,
          type: rewardType,
          count: count
        };
      });
    };

    window.addEventListener('showRewardFlash', handleShowRewardFlash as EventListener);
    
    return () => {
      window.removeEventListener('showRewardFlash', handleShowRewardFlash as EventListener);
    };
  }, []); // 依存配列は空のままで初回のみ登録

  const handleFlashComplete = useCallback(() => {
    console.log('✅ 全画面報酬演出完了 - currentRewardをnullに設定');
    console.log('現在のcurrentReward:', currentReward);
    setCurrentReward(prev => {
      console.log('setCurrentReward実行: prev =', prev, '-> null');
      return null;
    });
  }, []); // useCallbackで安定した参照を作成

  // 安全機能：報酬演出が5秒以上続く場合は強制終了
  useEffect(() => {
    if (currentReward && currentReward.show) {
      console.log('🔒 報酬演出の安全タイマー開始 (5秒)');
      const safetyTimer = setTimeout(() => {
        console.warn('🚨 報酬演出安全タイマー: 5秒経過したため強制終了');
        setCurrentReward(null);
      }, 5000);

      return () => {
        console.log('🔓 報酬演出の安全タイマー解除');
        clearTimeout(safetyTimer);
      };
    }
  }, [currentReward]);

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