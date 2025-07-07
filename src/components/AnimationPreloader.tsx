'use client';

import { useEffect } from 'react';
import { preloadCatAnimation } from '@/lib/animationCache';

export default function AnimationPreloader() {
  useEffect(() => {
    // アプリ起動時にLottieアニメーションを事前読み込み
    const preload = async () => {
      try {
        await preloadCatAnimation();
        console.log('✅ Cat animation preloaded successfully');
      } catch (error) {
        console.log('⚠️ Cat animation preload failed (will retry when needed)');
      }
    };

    // 少し遅延させてから事前読み込み（初期レンダリングに影響しないように）
    const timer = setTimeout(preload, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return null; // UI要素は表示しない
}