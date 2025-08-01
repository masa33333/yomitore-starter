'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RewardState } from '@/types/reward';
import { addWords, getInitialRewardState, saveRewardState, loadRewardState } from '@/utils/rewardUtils';

interface RewardContextType {
  reward: RewardState;
  addWordsToReward: (wordCount: number) => void;
  isInitialized: boolean;
  onRewardChange?: (newReward: RewardState, oldReward: RewardState) => void;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export function RewardProvider({ children }: { children: ReactNode }) {
  const [reward, setReward] = useState<RewardState>(getInitialRewardState());
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期化: localStorageから報酬状態を読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedReward = loadRewardState();
      setReward(savedReward);
      setIsInitialized(true);
    }
  }, []);

  // 語数追加関数
  const addWordsToReward = (wordCount: number) => {
    if (wordCount <= 0) return;
    
    const oldReward = { ...reward };
    
    // ステップごとに報酬変化を追跡
    let currentReward = { ...oldReward };
    currentReward.words += wordCount;
    
    // スタンプ獲得を計算
    const newStamps = Math.floor(wordCount / 100);
    if (newStamps > 0) {
      currentReward.stamps += newStamps;
    }
    
    // コイン獲得チェック（スタンプ20個 = コイン1個）
    if (currentReward.stamps >= 20) {
      const newCoins = Math.floor(currentReward.stamps / 20);
      currentReward.coin += newCoins;
      currentReward.stamps %= 20;
      
      
      // コイン5個でブロンズトロフィーに変換チェック
      if (currentReward.coin >= 5) {
        const newBronze = Math.floor(currentReward.coin / 5);
        currentReward.bronze += newBronze;
        currentReward.coin %= 5;
        
        
        // ブロンズ5個でシルバーに変換チェック
        if (currentReward.bronze >= 5) {
          const newSilver = Math.floor(currentReward.bronze / 5);
          currentReward.silver += newSilver;
          currentReward.bronze %= 5;
          
          
          // シルバー5個でゴールドに変換チェック
          if (currentReward.silver >= 5) {
            const newGold = Math.floor(currentReward.silver / 5);
            currentReward.gold += newGold;
            currentReward.silver %= 5;
            
            
            // ゴールド4個でプラチナに変換チェック
            if (currentReward.gold >= 4) {
              const newPlatinum = Math.floor(currentReward.gold / 4);
              currentReward.platinum += newPlatinum;
              currentReward.gold %= 4;
              
              
              // プラチナトロフィー演出を表示
              window.dispatchEvent(new CustomEvent('showRewardFlash', {
                detail: { 
                  rewardType: 'platinum', 
                  count: newPlatinum,
                  newReward: currentReward, 
                  oldReward 
                }
              }));
              
              setReward(currentReward);
              saveRewardState(currentReward);
              return;
            }
            
            // ゴールドトロフィー演出を表示
            window.dispatchEvent(new CustomEvent('showRewardFlash', {
              detail: { 
                rewardType: 'gold', 
                count: newGold,
                newReward: currentReward, 
                oldReward 
              }
            }));
            
            setReward(currentReward);
            saveRewardState(currentReward);
            return;
          }
          
          // シルバートロフィー演出を表示
          window.dispatchEvent(new CustomEvent('showRewardFlash', {
            detail: { 
              rewardType: 'silver', 
              count: newSilver,
              newReward: currentReward, 
              oldReward 
            }
          }));
          
          setReward(currentReward);
          saveRewardState(currentReward);
          return;
        }
        
        // ブロンズトロフィー演出を表示
        window.dispatchEvent(new CustomEvent('showRewardFlash', {
          detail: { 
            rewardType: 'bronze', 
            count: newBronze,
            newReward: currentReward, 
            oldReward 
          }
        }));
        
        setReward(currentReward);
        saveRewardState(currentReward);
        return;
      }
      
      // コイン獲得のみの場合の演出
      window.dispatchEvent(new CustomEvent('showRewardFlash', {
        detail: { 
          rewardType: 'coin', 
          count: newCoins,
          newReward: currentReward, 
          oldReward 
        }
      }));
      
      // 従来の小さな通知も表示
      window.dispatchEvent(new CustomEvent('rewardEarned', {
        detail: { newReward: currentReward, oldReward }
      }));
      
      setReward(currentReward);
      saveRewardState(currentReward);
      return;
    }
    
    // 最終的な報酬状態を計算（トロフィー変換込み）
    const finalReward = addWords(oldReward, wordCount);
    
    // 他の報酬変化をチェック（bronze, silver, gold, platinum）
    const rewardTypes = ['bronze', 'silver', 'gold', 'platinum'] as const;
    
    for (const type of rewardTypes) {
      if (finalReward[type] > oldReward[type]) {
        const count = finalReward[type] - oldReward[type];
        
        
        // トロフィー演出を表示
        window.dispatchEvent(new CustomEvent('showRewardFlash', {
          detail: { 
            rewardType: type, 
            count,
            newReward: finalReward, 
            oldReward 
          }
        }));
        
        // 従来の小さな通知も表示
        window.dispatchEvent(new CustomEvent('rewardEarned', {
          detail: { newReward: finalReward, oldReward }
        }));
        
        break; // 最初のトロフィーのみ演出
      }
    }
    
    setReward(finalReward);
    saveRewardState(finalReward);
  };

  return (
    <RewardContext.Provider value={{ 
      reward, 
      addWordsToReward, 
      isInitialized 
    }}>
      {children}
    </RewardContext.Provider>
  );
}

export function useReward() {
  const context = useContext(RewardContext);
  if (context === undefined) {
    throw new Error('useReward must be used within a RewardProvider');
  }
  return context;
}