'use client';

import { useEffect } from 'react';
import { ensureFirstLetterExists } from '@/lib/generateFirstLetter';

/**
 * アプリ初期化時に必要なセットアップを実行するコンポーネント
 */
export default function AppInitializer() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // 一通目の手紙を確認・生成
        await ensureFirstLetterExists();
        
        console.log('✅ App initialization completed');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };

    // ブラウザ環境でのみ実行
    if (typeof window !== 'undefined') {
      initializeApp();
    }
  }, []);

  // このコンポーネントは何も表示しない（初期化処理のみ）
  return null;
}