'use client';

import React, { useState, useEffect } from 'react';
import { getStampCardDisplay, getUserProgress } from '@/lib/readingProgress';
import type { StampCardDisplay, UserProgress } from '@/types/stampCard';

interface StampCardProps {
  className?: string;
  showTitle?: boolean;
  onStampClick?: (stampIndex: number) => void;
}

export default function StampCard({ 
  className = '', 
  showTitle = true,
  onStampClick 
}: StampCardProps) {
  const [display, setDisplay] = useState<StampCardDisplay | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [newStampIndex, setNewStampIndex] = useState(-1);
  const [animatingStamps, setAnimatingStamps] = useState<Set<number>>(new Set());
  const [footstepTrail, setFootstepTrail] = useState<number[]>([]);

  // データの初期化と更新
  useEffect(() => {
    const updateData = () => {
      try {
        const prevProgress = progress;
        const stampDisplay = getStampCardDisplay();
        const userProgress = getUserProgress();
        
        // 新しいスタンプが獲得された場合のお祝い表示
        if (prevProgress && userProgress.totalStamps > prevProgress.totalStamps) {
          const newStamp = userProgress.totalStamps - 1; // 0-indexed
          const cardPosition = newStamp % 50; // 現在のカード内での位置
          setNewStampIndex(cardPosition);
          
          // 足跡アニメーション
          const newAnimatingStamps = new Set(animatingStamps);
          newAnimatingStamps.add(cardPosition);
          setAnimatingStamps(newAnimatingStamps);
          
          // 足跡の軌跡を更新
          setFootstepTrail(prev => {
            const newTrail = [...prev, cardPosition];
            // 最新の5つの足跡のみを保持
            return newTrail.slice(-5);
          });
          
          // お祝いメッセージの設定
          const isMilestone = userProgress.totalStamps % 10 === 0;
          if (isMilestone) {
            setCelebrationMessage(`🎉 すごい！${userProgress.totalStamps}個目のスタンプ獲得！名所に到達しました！`);
          } else {
            const messages = [
              '🌟 素晴らしい！新しいスタンプを獲得しました！',
              '🎊 おめでとう！読書の旅が続いています！',
              '✨ やったね！また一歩前進しました！',
              '🎯 がんばりました！旅路を進んでいます！',
              '🚀 読書の力で前へ進んでいます！',
              '🌈 新しい世界への扉が開きました！'
            ];
            setCelebrationMessage(messages[Math.floor(Math.random() * messages.length)]);
          }
          
          setShowCelebration(true);
          
          // アニメーション終了後にスタンプを非アニメーション状態に戻す
          setTimeout(() => {
            setAnimatingStamps(prev => {
              const newSet = new Set(prev);
              newSet.delete(cardPosition);
              return newSet;
            });
          }, 600);
          
          // 3秒後に自動で非表示
          setTimeout(() => {
            setShowCelebration(false);
            setNewStampIndex(-1);
          }, 3000);
        }
        
        setDisplay(stampDisplay);
        setProgress(userProgress);
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
  }, [progress]);

  // ゲーミフィケーション設定の確認
  useEffect(() => {
    const gamificationEnabled = localStorage.getItem('gamificationEnabled');
    if (gamificationEnabled === 'false') {
      setIsVisible(false);
    }
  }, []);

  // 表示制御
  if (!isVisible || !display || !progress) {
    return null;
  }

  const handleStampClick = (index: number) => {
    if (onStampClick) {
      onStampClick(index);
    }
  };

  const handleToggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('gamificationEnabled', newVisibility.toString());
  };

  return (
    <div className={`stamp-card-container ${className}`}>
      {showTitle && (
        <div className="stamp-card-header mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              🗺️ 読書の旅路
            </h2>
            <button
              onClick={handleToggleVisibility}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              title="スタンプカード表示をON/OFF"
            >
              ⚙️
            </button>
          </div>
          
          {/* 進捗サマリー */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>🏆 総スタンプ: {progress.totalStamps}</span>
              <span>📚 総語数: {progress.totalWords.toLocaleString()}</span>
              <span>🃏 完成カード: {progress.completedCards}</span>
            </div>
            
            {/* 次のマイルストーン */}
            <div className="text-sm text-blue-600">
              {display.nextMilestone.description}
            </div>
          </div>
        </div>
      )}

      {/* メインスタンプカード */}
      <div className="stamp-card-main bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        {/* 進捗バー */}
        <div className="progress-bar mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>現在のカード進捗</span>
            <span>{display.progress.current}/50</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${display.progress.percentage}%` }}
            />
          </div>
        </div>

        {/* 旅ルートマップ - スタンプグリッド (10x5 = 50マス) */}
        <div className="travel-route-map relative mb-4">
          {/* 背景の旅ルート線 */}
          <div className="route-path absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 640 200" preserveAspectRatio="none">
              {/* 蛇行するルートパス */}
              <path
                d="M 10 180 Q 80 160 160 170 Q 240 180 320 150 Q 400 120 480 140 Q 560 160 630 130"
                stroke="#e5e7eb"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
                className="route-line"
              />
              {/* 完了した部分のルート */}
              <path
                d="M 10 180 Q 80 160 160 170 Q 240 180 320 150 Q 400 120 480 140 Q 560 160 630 130"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
                strokeDashoffset="0"
                className="completed-route"
                style={{
                  strokeDasharray: `${(display.progress.current / 50) * 100}% 100%`,
                  transition: 'stroke-dasharray 0.5s ease-in-out'
                }}
              />
            </svg>
          </div>

          {/* スタンプグリッド */}
          <div className="stamp-grid grid grid-cols-10 gap-1 relative z-10">
            {Array.from({ length: 50 }, (_, index) => {
              const isCompleted = index < display.progress.current;
              const isCurrent = index === display.progress.current;
              const isMilestone = (index + 1) % 10 === 0; // 10マス毎にマイルストーン
              const isAnimating = animatingStamps.has(index);
              const isInFootstepTrail = footstepTrail.includes(index);
              const trailPosition = footstepTrail.indexOf(index);
              
              // 旅の名所アイコン (マイルストーン用)
              const getMilestoneIcon = (stampNumber: number) => {
                const milestones = ['🗼', '🏯', '🎡', '🌸', '⛩️']; // 東京タワー、城、観覧車、桜、鳥居
                return milestones[Math.floor((stampNumber - 1) / 10)] || '🏞️';
              };

              const getTravelIcon = (stampNumber: number) => {
                // 通常のスタンプ用旅アイコン
                const icons = ['🐾', '✈️', '🚂', '🗺️', '🎒', '📸', '🧭', '🌟', '🏔️', '🌊'];
                return icons[stampNumber % icons.length];
              };
              
              return (
                <div
                  key={index}
                  onClick={() => handleStampClick(index)}
                  className={`
                    stamp-cell w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-300 transform hover:scale-110 relative
                    ${isCompleted 
                      ? isMilestone 
                        ? `bg-gradient-to-br from-yellow-200 to-yellow-400 border-yellow-500 text-yellow-800 shadow-lg ${isCompleted && isMilestone ? 'animate-milestone-glow' : ''}`
                        : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400 text-blue-700 shadow-md'
                      : isCurrent 
                      ? 'bg-gradient-to-br from-orange-200 to-orange-300 border-orange-500 text-orange-800 ring-2 ring-orange-400 shadow-lg animate-pulse' 
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 text-gray-500 hover:from-gray-100 hover:to-gray-200 hover:border-gray-400'
                    }
                    ${isMilestone && !isCompleted ? 'border-dashed border-2 border-yellow-400' : ''}
                    ${isAnimating ? 'animate-footstep' : ''}
                    ${isInFootstepTrail && trailPosition >= 0 ? `opacity-${Math.max(20, 100 - trailPosition * 20)}` : ''}
                  `}
                  title={`
                    ${isMilestone ? '🎯 マイルストーン' : '📍 スタンプ'} ${index + 1}
                    ${isCompleted ? ' (完了)' : isCurrent ? ' (次の目標)' : ''}
                    ${isMilestone && isCompleted ? ' - 名所到達!' : ''}
                  `}
                >
                  {isCompleted 
                    ? isMilestone 
                      ? getMilestoneIcon(index + 1)
                      : getTravelIcon(index + 1)
                    : isCurrent 
                    ? '🎯'
                    : isMilestone 
                    ? '⭐'
                    : (index + 1)
                  }
                  
                  {/* 足跡エフェクト */}
                  {isCompleted && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
                  )}
                  
                  {/* 現在地点の光るエフェクト */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-orange-300 opacity-30 animate-ping"></div>
                  )}
                  
                  {/* 新しいスタンプの祝福エフェクト */}
                  {index === newStampIndex && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-50 animate-bounce"></div>
                      {/* スパークル効果 */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 animate-sparkle">✨</div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 text-yellow-500 animate-sparkle" style={{animationDelay: '0.5s'}}>✨</div>
                    </>
                  )}
                  
                  {/* マイルストーン到達時の特別エフェクト */}
                  {isMilestone && isCompleted && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-500 text-xs animate-bounce">
                      🎯
                    </div>
                  )}
                  
                  {/* 足跡の軌跡エフェクト */}
                  {isInFootstepTrail && trailPosition >= 0 && (
                    <div 
                      className="absolute -bottom-2 -right-2 text-xs animate-pulse"
                      style={{
                        opacity: Math.max(0.3, 1 - trailPosition * 0.2),
                        animationDelay: `${trailPosition * 0.2}s`
                      }}
                    >
                      👣
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 旅の進捗説明 */}
          <div className="travel-info mt-3 text-xs text-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-400 rounded-full"></div>
                <span>通過した道のり</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gradient-to-br from-yellow-200 to-yellow-400 border border-yellow-500 rounded-full"></div>
                <span>名所 (10マス毎)</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gradient-to-br from-orange-200 to-orange-300 border border-orange-500 rounded-full animate-pulse"></div>
                <span>現在地</span>
              </span>
            </div>
            <div className="text-right">
              <div className="font-medium text-blue-600">
                {display.progress.current > 0 && `${Math.floor(display.progress.current / 10)}個の名所を通過`}
              </div>
            </div>
          </div>
        </div>

        {/* マイルストーン表示 */}
        <div className="milestones flex items-center justify-between text-xs text-gray-500">
          <div className="flex space-x-4">
            <span className={progress.bronzeCoins > 0 ? 'text-orange-600' : ''}>
              🥉 {progress.bronzeCoins}
            </span>
            <span className={progress.bronzeTrophies > 0 ? 'text-orange-600' : ''}>
              🏆 {progress.bronzeTrophies}
            </span>
            <span className={progress.silverTrophies > 0 ? 'text-gray-600' : ''}>
              🥈 {progress.silverTrophies}
            </span>
            <span className={progress.goldTrophies > 0 ? 'text-yellow-600' : ''}>
              🥇 {progress.goldTrophies}
            </span>
          </div>
          
          <div className="text-right">
            <div>連続ログイン: {progress.consecutiveLoginDays}日</div>
            <div>今日の読書: {progress.dailyStoriesRead}話</div>
          </div>
        </div>
      </div>

      {/* デイリー目標表示 */}
      {progress.dailyStoriesRead > 0 && (
        <div className="daily-goals mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-green-600">📈 今日の進捗:</span>
            <span className={progress.dailyFirstStoryBonus ? 'text-green-700' : 'text-gray-500'}>
              {progress.dailyFirstStoryBonus ? '✅' : '◯'} 最初の1話
            </span>
            <span className={progress.dailyGoalAchieved ? 'text-green-700' : 'text-gray-500'}>
              {progress.dailyGoalAchieved ? '✅' : '◯'} 3話達成
            </span>
          </div>
        </div>
      )}

      {/* 祝福オーバーレイ */}
      {showCelebration && (
        <div className="celebration-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="celebration-modal bg-gradient-to-br from-white to-blue-50 rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl transform animate-bounce border-2 border-blue-200">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <div className="text-xl font-bold text-gray-800 mb-3">
              {celebrationMessage}
            </div>
            <div className="text-sm text-gray-600 mb-6 leading-relaxed">
              読書を続けて、さらに遠くの世界へ旅しましょう！<br/>
              {progress && progress.totalStamps % 10 === 0 && (
                <span className="text-yellow-600 font-medium">🏆 マイルストーン達成！特別な名所に到着しました！</span>
              )}
            </div>
            
            {/* 進捗サマリー */}
            {progress && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>総スタンプ:</span>
                  <span className="font-medium">{progress.totalStamps}個</span>
                </div>
                <div className="flex justify-between">
                  <span>総語数:</span>
                  <span className="font-medium">{progress.totalWords.toLocaleString()}語</span>
                </div>
                <div className="flex justify-between">
                  <span>今日の読書:</span>
                  <span className="font-medium">{progress.dailyStoriesRead}話</span>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowCelebration(false)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              旅を続ける ✈️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// スタンプカード更新イベントを発火する関数（他のコンポーネントから呼び出し用）
export function notifyStampCardUpdate() {
  const event = new CustomEvent('stampCardUpdate');
  window.dispatchEvent(event);
}