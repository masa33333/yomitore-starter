'use client';

import Player from 'react-lottie-player';
import { useEffect, useState } from 'react';
import { preloadCatAnimation, getCachedCatAnimation } from '@/lib/animationCache';

export default function CatLoader() {
  const [animationData, setAnimationData] = useState(() => {
    // 初期化時にキャッシュされたアニメーションがあれば即座に使用
    return getCachedCatAnimation();
  });

  useEffect(() => {
    // キャッシュからアニメーションを取得、なければ読み込み
    const cachedData = getCachedCatAnimation();
    if (cachedData) {
      setAnimationData(cachedData);
    } else {
      preloadCatAnimation()
        .then(data => setAnimationData(data))
        .catch(error => {
          console.error('Failed to load animation:', error);
        });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-[#F6F0E9]/80 backdrop-blur-sm">
      {animationData ? (
        // Lottieアニメーション
        <Player 
          play 
          loop 
          animationData={animationData} 
          style={{ width: 200, height: 200 }} 
        />
      ) : (
        // 即座に表示される猫アニメーション（Lottie読み込み待ちなし）
        <div className="size-[200px] bg-[#FFB86C]/20 rounded-full flex items-center justify-center relative overflow-hidden">
          {/* 複数の猫が動き回るアニメーション */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl animate-bounce" style={{animationDelay: '0s'}}>🐱</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl animate-ping" style={{animationDelay: '0.5s'}}>💭</div>
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="text-xl animate-pulse">✍️</div>
          </div>
          {/* 背景の回転要素 */}
          <div className="absolute inset-4 border-2 border-[#FFB86C]/30 border-dashed rounded-full animate-spin" style={{animationDuration: '3s'}}></div>
        </div>
      )}
      <p className="text-sm text-[#7E6944] animate-pulse">Generating your story…</p>
    </div>
  );
}