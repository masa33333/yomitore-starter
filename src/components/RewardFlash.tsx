'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface RewardFlashProps {
  show: boolean;
  rewardType: 'coin' | 'bronze' | 'silver' | 'gold' | 'platinum';
  count: number;
  onComplete: () => void;
}

const REWARD_CONFIG = {
  coin: {
    image: '/images/coin.png',
    title: 'コイン獲得！',
    bgColor: 'from-yellow-300 to-yellow-500',
    filter: '',
    sparkleCount: 20,
    imageSize: 200,
    duration: 3000
  },
  bronze: {
    image: '/images/trophy-c.png',
    title: 'ブロンズトロフィー獲得！',
    bgColor: 'from-amber-600 via-amber-500 to-yellow-600',
    filter: '',
    sparkleCount: 30,
    imageSize: 250,
    duration: 4000
  },
  silver: {
    image: '/images/trophy-c.png',
    title: 'シルバートロフィー獲得！',
    bgColor: 'from-gray-200 via-gray-400 to-gray-600',
    filter: 'brightness(150%) saturate(0%)',
    sparkleCount: 35,
    imageSize: 280,
    duration: 4500
  },
  gold: {
    image: '/images/trophy-c.png',
    title: 'ゴールドトロフィー獲得！',
    bgColor: 'from-yellow-200 via-yellow-400 to-orange-500',
    filter: 'brightness(200%) contrast(150%)',
    sparkleCount: 40,
    imageSize: 320,
    duration: 5000
  },
  platinum: {
    image: '/images/trophy-c.png',
    title: 'プラチナトロフィー獲得！',
    bgColor: 'from-gray-100 via-white to-gray-200',
    filter: 'brightness(300%) contrast(200%) saturate(0%) drop-shadow(0 0 20px rgba(255,255,255,0.8))',
    sparkleCount: 50,
    imageSize: 350,
    duration: 6000
  }
};

const RewardFlash: React.FC<RewardFlashProps> = ({ show, rewardType, count, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0);
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  useEffect(() => {
    if (show) {
      const config = REWARD_CONFIG[rewardType];
      
      // デバッグ: 使用中の画像パスと設定を表示
      console.log(`🎨 ${rewardType}報酬表示開始:`);
      console.log(`  - 画像パス: ${config.image}`);
      console.log(`  - フィルター: ${config.filter}`);
      console.log(`  - サイズ: ${config.imageSize}px`);
      console.log(`  - コンフィグ全体:`, config);
      
      // 表示開始
      setVisible(true);
      
      // キラキラエフェクト用の座標生成（報酬グレードに応じて数を調整）
      const newSparkles = Array.from({ length: config.sparkleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 600 - 300,
        y: Math.random() * 600 - 300,
        delay: Math.random() * 3
      }));
      setSparkles(newSparkles);
      
      // スケールアニメーション開始
      const scaleTimer = setTimeout(() => {
        setScale(1);
      }, 10);

      // 報酬グレードに応じて表示時間を調整
      const hideTimer = setTimeout(() => {
        setScale(0);
        const completeTimer = setTimeout(() => {
          setVisible(false);
          onComplete();
        }, 500);
        return () => clearTimeout(completeTimer);
      }, config.duration);

      return () => {
        clearTimeout(scaleTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, onComplete, rewardType]);

  if (!visible) return null;

  const config = REWARD_CONFIG[rewardType];
  const isTrophy = rewardType !== 'coin';
  const backgroundSize = config.imageSize + 200;
  const mainBgSize = config.imageSize + 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <motion.div
        initial={{ scale: 0, rotate: isTrophy ? -360 : -180 }}
        animate={{ scale: scale, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: isTrophy ? 150 : 200, 
          damping: isTrophy ? 12 : 15,
          duration: isTrophy ? 1.0 : 0.6
        }}
        className="relative"
      >
        {/* 最外層の爆発エフェクト（トロフィーのみ） */}
        {isTrophy && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 2, 1],
              opacity: [0, 0.8, 0.3]
            }}
            transition={{ 
              duration: 2,
              times: [0, 0.3, 1],
              repeat: Infinity,
              repeatDelay: 1
            }}
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.bgColor}`}
            style={{ 
              width: `${backgroundSize + 200}px`, 
              height: `${backgroundSize + 200}px`, 
              left: `-${(backgroundSize + 200) / 2 - config.imageSize / 2}px`, 
              top: `-${(backgroundSize + 200) / 2 - config.imageSize / 2}px`,
              filter: 'blur(30px)'
            }} 
          />
        )}
        
        {/* 背景の光る円 */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 1.5 }}
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.bgColor} shadow-2xl opacity-90`}
          style={{ 
            width: `${backgroundSize}px`, 
            height: `${backgroundSize}px`, 
            left: `-${backgroundSize / 2 - config.imageSize / 2}px`, 
            top: `-${backgroundSize / 2 - config.imageSize / 2}px`,
            filter: 'blur(20px)',
            animation: isTrophy ? 'pulse 1s ease-in-out infinite' : 'pulse 2s ease-in-out infinite'
          }} 
        />
        
        {/* メインの背景円 */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="absolute inset-0 rounded-full bg-white shadow-2xl opacity-95" 
          style={{ 
            width: `${mainBgSize}px`, 
            height: `${mainBgSize}px`, 
            left: `-${mainBgSize / 2 - config.imageSize / 2}px`, 
            top: `-${mainBgSize / 2 - config.imageSize / 2}px` 
          }} 
        />
        
        {/* タイトルテキスト */}
        <div className="absolute -top-28 left-1/2 transform -translate-x-1/2 text-center z-20">
          <motion.div 
            initial={{ y: -30, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className={`bg-white text-black px-8 py-4 rounded-lg font-bold shadow-lg whitespace-nowrap border-4 ${
              isTrophy ? 'text-3xl border-purple-500' : 'text-2xl border-yellow-400'
            }`}
          >
            {config.title}
            {count > 1 && <span className="ml-2 text-purple-600">×{count}</span>}
          </motion.div>
        </div>
        
        {/* 報酬画像 */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 50 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
            rotate: 0
          }}
          transition={{ 
            delay: 0.3, 
            duration: isTrophy ? 1.5 : 0.8,
            type: "spring"
          }}
          className="relative z-10"
        >
          <div style={{ position: 'relative', width: config.imageSize, height: config.imageSize }}>
            {/* 背景として表示される絵文字 */}
            <div 
              className="absolute inset-0 flex items-center justify-center text-6xl opacity-20"
              style={{ fontSize: config.imageSize / 4 }}
            >
              {rewardType === 'coin' ? '🪙' : '🏆'}
            </div>
            
            {/* 実際の画像 */}
            <Image
              src={config.image}
              alt={rewardType}
              width={config.imageSize}
              height={config.imageSize}
              className="drop-shadow-2xl relative z-10"
              style={{ filter: config.filter }}
              priority
              onError={(e) => {
                console.error(`❌ 画像読み込みエラー: ${config.image} (${rewardType})`, e);
                console.error('エラー詳細:', e.currentTarget);
              }}
              onLoad={() => {
                console.log(`✅ 画像読み込み成功: ${config.image} (${rewardType})`);
              }}
            />
          </div>
          
          {/* トロフィー専用の追加エフェクト */}
          {isTrophy && (
            <>
              {/* 光る縁取り */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: 1
                }}
                className="absolute inset-0 rounded-full border-4 border-yellow-400"
                style={{
                  filter: 'blur(4px)',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.8)'
                }}
              />
              
              {/* 回転する光のリング */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${config.bgColor.includes('purple') ? '#8B5CF6' : '#FFD700'}, transparent)`,
                  filter: 'blur(2px)'
                }}
              />
            </>
          )}
        </motion.div>
        
        {/* 複数獲得時の追加画像 */}
        {count > 1 && (
          <motion.div
            initial={{ scale: 0, x: 60, y: 60 }}
            animate={{ 
              scale: isTrophy ? 0.9 : 0.8, 
              x: isTrophy ? 50 : 40, 
              y: isTrophy ? 50 : 40 
            }}
            transition={{ delay: 0.6 }}
            className="absolute top-8 right-8 z-15"
          >
            <Image
              src={config.image}
              alt={rewardType}
              width={isTrophy ? 150 : 120}
              height={isTrophy ? 150 : 120}
              className="drop-shadow-xl opacity-80"
              style={{ filter: config.filter }}
              priority
            />
          </motion.div>
        )}
        
        {/* キラキラエフェクト */}
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360],
                y: [0, -20, 0]
              }}
              transition={{ 
                duration: isTrophy ? 3 : 2,
                delay: sparkle.delay,
                repeat: Infinity,
                repeatDelay: isTrophy ? 0.5 : 1
              }}
              className={`absolute pointer-events-none ${
                isTrophy ? 'text-yellow-300' : 'text-yellow-400'
              }`}
              style={{
                left: `${sparkle.x}px`,
                top: `${sparkle.y}px`,
                fontSize: (Math.random() * (isTrophy ? 30 : 20) + (isTrophy ? 25 : 20)) + 'px'
              }}
            >
              {isTrophy ? 
                (Math.random() > 0.7 ? '🏆' : Math.random() > 0.5 ? '✨' : '⭐') :
                (Math.random() > 0.5 ? '✨' : '⭐')
              }
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* トロフィー専用の花火エフェクト */}
        {isTrophy && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 0] }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              delay: 1
            }}
            className="absolute inset-0 pointer-events-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: [0, Math.cos(i * 30 * Math.PI / 180) * 200],
                  y: [0, Math.sin(i * 30 * Math.PI / 180) * 200]
                }}
                transition={{ 
                  duration: 2,
                  delay: 1 + i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="absolute left-1/2 top-1/2 text-yellow-400 text-3xl"
              >
                🎆
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* 追加の光エフェクト */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, isTrophy ? 2.0 : 1.5, 0] }}
          transition={{ 
            duration: isTrophy ? 4 : 3,
            repeat: Infinity,
            repeatDelay: isTrophy ? 1 : 0.5
          }}
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.bgColor} opacity-30`}
          style={{ 
            width: `${backgroundSize + 100}px`, 
            height: `${backgroundSize + 100}px`, 
            left: `-${(backgroundSize + 100) / 2 - config.imageSize / 2}px`, 
            top: `-${(backgroundSize + 100) / 2 - config.imageSize / 2}px` 
          }}
        />
      </motion.div>
    </div>
  );
};

export default RewardFlash;