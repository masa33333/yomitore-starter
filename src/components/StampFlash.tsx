'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface StampFlashProps {
  show: boolean;
  onComplete: () => void;
}

const StampFlash: React.FC<StampFlashProps> = ({ show, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (show) {
      // 表示開始
      setVisible(true);
      
      // スケールアニメーション開始
      const scaleTimer = setTimeout(() => {
        setScale(1);
      }, 10);

      // 1.5秒後に非表示
      const hideTimer = setTimeout(() => {
        setScale(0);
        const completeTimer = setTimeout(() => {
          setVisible(false);
          onComplete();
        }, 300);
        return () => clearTimeout(completeTimer);
      }, 1500);

      return () => {
        clearTimeout(scaleTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {/* 背景の白い円 */}
        <div className="absolute inset-0 rounded-full bg-white shadow-2xl opacity-90" 
             style={{ width: '300px', height: '300px', left: '-75px', top: '-75px' }} />
        
        {/* 「スタンプ獲得！」テキスト */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center z-20">
          <div className="bg-white text-black px-6 py-3 rounded-lg font-bold shadow-lg text-xl" style={{ writingMode: 'horizontal-tb' }}>
            スタンプ獲得！
          </div>
        </div>
        
        {/* スタンプ画像 */}
        <Image
          src="/images/stamp.png"
          alt="スタンプ"
          width={150}
          height={150}
          className="relative z-10 drop-shadow-lg"
        />
        
        {/* キラキラエフェクト */}
        <div className="absolute inset-0 animate-pulse">
          <div className="absolute -top-4 -left-4 text-yellow-400 text-3xl animate-bounce">✨</div>
          <div className="absolute -top-4 -right-4 text-yellow-400 text-3xl animate-bounce delay-200">✨</div>
          <div className="absolute -bottom-4 -left-4 text-yellow-400 text-3xl animate-bounce delay-400">✨</div>
          <div className="absolute -bottom-4 -right-4 text-yellow-400 text-3xl animate-bounce delay-600">✨</div>
        </div>
      </div>
    </div>
  );
};

export default StampFlash;