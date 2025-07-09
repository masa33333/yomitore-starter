'use client';

import { useEffect } from 'react';

/**
 * 旧5段階レベルシステムから新3段階レベルシステムへの移行処理
 * 起動時に毎回実行されるが、処理コストは無視できる
 */
export default function LevelMigration() {
  useEffect(() => {
    // サーバーサイドレンダリング時はスキップ
    if (typeof window === 'undefined') return;

    try {
      // 現在のレベルを取得
      const currentLevel = localStorage.getItem('vocabLevel');
      
      if (currentLevel) {
        const levelNum = Number(currentLevel);
        
        // 旧レベル4/5は新レベル3に丸める
        if (levelNum > 3) {
          localStorage.setItem('vocabLevel', '3');
          console.log(`📊 レベル移行: ${levelNum} → 3`);
        }
        // レベル1未満は1に修正
        else if (levelNum < 1) {
          localStorage.setItem('vocabLevel', '1');
          console.log(`📊 レベル修正: ${levelNum} → 1`);
        }
      } else {
        // 初回訪問時はレベル1に設定
        localStorage.setItem('vocabLevel', '1');
        console.log('📊 初回設定: レベル1');
      }
    } catch (error) {
      console.error('❌ レベル移行エラー:', error);
      // エラー時はレベル1にフォールバック
      localStorage.setItem('vocabLevel', '1');
    }
  }, []);

  return null; // UIを持たないコンポーネント
}