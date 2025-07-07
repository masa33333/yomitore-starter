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
             style={{ width: '200px', height: '200px', left: '-50px', top: '-50px' }} />
        
        {/* スタンプ画像 */}
        <Image
          src="/images/stamp.png"
          alt="スタンプ"
          width={100}
          height={100}
          className="relative z-10 drop-shadow-lg"
        />
        
        {/* キラキラエフェクト */}
        <div className="absolute inset-0 animate-pulse">
          <div className="absolute top-2 left-2 text-yellow-400 text-2xl animate-bounce">✨</div>
          <div className="absolute top-2 right-2 text-yellow-400 text-2xl animate-bounce delay-200">✨</div>
          <div className="absolute bottom-2 left-2 text-yellow-400 text-2xl animate-bounce delay-400">✨</div>
          <div className="absolute bottom-2 right-2 text-yellow-400 text-2xl animate-bounce delay-600">✨</div>
        </div>
        
        {/* 「スタンプ獲得！」テキスト */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-orange-400 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
            スタンプ獲得！
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampFlash;