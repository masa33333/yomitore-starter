'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserProgress } from '@/lib/readingProgress';
import type { UserProgress } from '@/types/stampCard';

interface NewStampCardProps {
  filledCount?: number;
  onComplete?: () => void;
  className?: string;
}

export default function NewStampCard({ 
  filledCount: propFilledCount,
  onComplete,
  className = ''
}: NewStampCardProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [catName, setCatName] = useState('ネコ');
  const [animatingStamp, setAnimatingStamp] = useState<number | null>(null);

  // データの初期化と更新
  useEffect(() => {
    const updateData = () => {
      try {
        const userProgress = getUserProgress();
        const prevProgress = progress;
        
        setProgress(userProgress);
        
        // ネコの名前を取得
        const savedCatName = localStorage.getItem('catName');
        if (savedCatName) {
          setCatName(savedCatName);
        }
        
        // 新しいスタンプが獲得された場合のアニメーション
        if (prevProgress && userProgress.currentCardStamps > prevProgress.currentCardStamps) {
          const newStampIndex = userProgress.currentCardStamps - 1;
          setAnimatingStamp(newStampIndex);
          
          // アニメーション終了後にクリア
          setTimeout(() => {
            setAnimatingStamp(null);
          }, 600);
          
          // 20個完了時のコールバック
          if (userProgress.currentCardStamps === 20 && onComplete) {
            setTimeout(() => {
              onComplete();
            }, 1000);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load stamp card data:', error);
      }
    };

    updateData();

    // 読書完了などでデータが更新された時のリスナー
    const handleProgressUpdate = () => {
      updateData();
    };

    window.addEventListener('stampCardUpdate', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('stampCardUpdate', handleProgressUpdate);
    };
  }, [onComplete]); // progressを依存配列から削除して無限ループを防ぐ

  // スタンプ数の決定（props優先、なければprogressから）
  const currentStamps = propFilledCount !== undefined 
    ? Math.min(propFilledCount, 20) 
    : (progress?.currentCardStamps || 0);

  return (
    <div className={`new-stamp-card w-[320px] mx-auto ${className}`}>
      {/* ヘッダー部分 - オレンジ地に茶色文字 */}
      <div 
        className="header-section h-12 flex items-center justify-center rounded-t-lg"
        style={{ backgroundColor: '#FFA453' }}
      >
        <h2 
          className="text-lg font-bold"
          style={{ color: '#6E3129' }}
        >
          Stamp Card
        </h2>
      </div>

      {/* 説明部分 - ベージュ地に黒字 + ネコアイコン */}
      <div 
        className="description-section p-3 flex items-center justify-between"
        style={{ backgroundColor: '#fcd8a8' }}
      >
        <div className="flex-1 text-xs text-black leading-relaxed pr-3">
          100語読むごとにスタンプ進呈。<br/>
          20個たまると{catName}からメールが届きます。
        </div>
        
        {/* ネコアイコン円 */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#6E3129' }}
        >
          <div className="w-8 h-8 relative">
            <Image
              src="/images/cat-icon.png"
              alt="ネコアイコン"
              fill
              className="object-contain"
              sizes="32px"
            />
          </div>
        </div>
      </div>

      {/* スタンプグリッド部分 - 2列×10行（計20マス） */}
      <div 
        className="stamp-grid-section p-4 rounded-b-lg"
        style={{ backgroundColor: '#fcd8a8' }}
      >
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 20 }, (_, index) => {
            const isCompleted = index < currentStamps;
            const isAnimating = animatingStamp === index;
            
            return (
              <div
                key={index}
                className="stamp-cell w-full aspect-square relative rounded border-2 flex items-center justify-center"
                style={{ 
                  borderColor: '#6E3129',
                  backgroundColor: isCompleted ? '#fcd8a8' : 'white'
                }}
              >
                <AnimatePresence>
                  {isCompleted && (
                    <motion.div
                      initial={isAnimating ? { scale: 0, rotate: -180 } : false}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20,
                        duration: 0.6 
                      }}
                      className="w-8 h-8 relative"
                    >
                      <Image
                        src="/images/stamp.png"
                        alt="肉球スタンプ"
                        fill
                        className="object-contain"
                        sizes="32px"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* 未取得の場合は空のセル */}
                {!isCompleted && (
                  <div className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                    {index + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 進捗表示 */}
        <div className="mt-3 text-center">
          <div className="text-sm text-black font-medium">
            {currentStamps} / 20
          </div>
          <div className="text-xs text-gray-600 mt-1">
            あと {20 - currentStamps} つでメール配信
          </div>
        </div>
      </div>
    </div>
  );
}

// スタンプカード更新イベントを発火する関数（他のコンポーネントから呼び出し用）
export function notifyNewStampCardUpdate() {
  const event = new CustomEvent('stampCardUpdate');
  window.dispatchEvent(event);
}