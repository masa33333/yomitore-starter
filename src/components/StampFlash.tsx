'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { playStampFanfare } from '@/lib/stampSounds';

interface StampFlashProps {
  show: boolean;
  onComplete: () => void;
  stampsEarned?: number; // 獲得したスタンプ数
}

const StampFlash: React.FC<StampFlashProps> = ({ show, onComplete, stampsEarned = 1 }) => {
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (show) {
      console.log('🎊 StampFlash: 演出開始');
      // 表示開始
      setVisible(true);
      
      // スタンプ音を鳴らす（獲得数に応じて連続再生）
      console.log(`🎵 Playing stamp fanfare for ${stampsEarned} stamps`);
      try {
        // 音声重複防止のため、少し遅らせて再生
        setTimeout(() => {
          playStampFanfare(stampsEarned);
        }, 100);
      } catch (error) {
        console.error('🎵 音声再生エラー:', error);
      }
      
      // スケールアニメーション開始
      const scaleTimer = setTimeout(() => {
        setScale(1);
        console.log('🎊 StampFlash: スケールアニメーション開始 -> scale=1');
      }, 10);
      
      // 初期値を0.5に設定してテスト
      setScale(0.5);
      console.log('🎊 StampFlash: 初期scale=0.5設定');

      // 1.5秒後に非表示開始
      const hideTimer = setTimeout(() => {
        console.log('🎊 StampFlash: フェードアウト開始');
        setScale(0);
      }, 1500);

      // 1.8秒後に完全に非表示にして完了コールバック
      const completeTimer = setTimeout(() => {
        console.log('🎊 StampFlash: 演出完了、コールバック実行');
        setVisible(false);
        onComplete();
      }, 1800);

      // 緊急フォールバック: 5秒後に強制終了
      const emergencyTimer = setTimeout(() => {
        console.warn('🚨 StampFlash: 緊急フォールバック - 強制終了');
        setVisible(false);
        setScale(0);
        onComplete();
      }, 5000);

      return () => {
        console.log('🎊 StampFlash: クリーンアップ実行');
        clearTimeout(scaleTimer);
        clearTimeout(hideTimer);
        clearTimeout(completeTimer);
        clearTimeout(emergencyTimer);
      };
    } else {
      // showがfalseの場合は即座にリセット
      setVisible(false);
      setScale(0);
    }
  }, [show, onComplete, stampsEarned]);

  // 緊急脱出機能
  const handleEmergencyExit = () => {
    console.warn('🚨 StampFlash: ユーザーによる緊急脱出');
    setVisible(false);
    setScale(0);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 cursor-pointer" 
      style={{ zIndex: 9999 }}
      onClick={handleEmergencyExit}
      title="クリックして演出をスキップ"
    >
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${scale})`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景の白い円 - テスト用に青色 */}
        <div 
          className="absolute inset-0 rounded-full bg-blue-500 shadow-2xl border-4 border-yellow-400" 
          style={{ 
            width: '300px', 
            height: '300px', 
            left: '-75px', 
            top: '-75px',
            opacity: 1 
          }} 
        />
        
        {/* 「スタンプ獲得！」テキスト */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center z-30">
          <div 
            className="bg-white text-black px-8 py-3 rounded-lg font-bold shadow-lg text-xl border-2 border-yellow-400" 
            style={{ writingMode: 'horizontal-tb', minWidth: '200px' }}
          >
            スタンプ{stampsEarned > 1 ? `${stampsEarned}個` : ''}獲得！
          </div>
        </div>
        
        {/* スタンプ画像 - テスト用にテキスト表示 */}
        <div className="relative z-20">
          <div className="w-[150px] h-[150px] bg-red-500 border-4 border-white rounded-full flex items-center justify-center">
            <div className="text-white text-6xl font-bold">🏆</div>
          </div>
        </div>
        
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