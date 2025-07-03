'use client';

import React, { useState, useEffect } from 'react';

interface TypingCatProps {
  className?: string;
}

export default function TypingCat({ className = '' }: TypingCatProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "現在なるはやで作成中にゃ…もうちょっと待っててにゃ！",
    "一生懸命タイピングしているにゃ〜",
    "良い読み物を作るから待っててにゃ！",
    "世界中の知識を集めているにゃ〜",
    "もうすぐ完成にゃ！頑張ってるにゃ〜"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000); // 3秒ごとにメッセージを変更

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
        {/* ネコのGIFアニメーション部分 */}
        <div className="text-center mb-6">
          {/* 仮のネコアニメーション - 実際のGIFに置き換え予定 */}
          <div className="size-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-orange-300 shadow-md">
            <div className="text-4xl animate-bounce">🐱</div>
          </div>
          
          {/* タイピングエフェクト */}
          <div className="flex justify-center space-x-1 mb-4">
            <div className="size-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="size-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="size-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* メッセージ部分 */}
        <div className="text-center">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 relative">
            {/* 吹き出しの三角形 */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 size-4 bg-blue-50 border-l-2 border-t-2 border-blue-200 rotate-45"></div>
            
            <p className="text-blue-800 font-medium text-sm leading-relaxed">
              {messages[messageIndex]}
            </p>
          </div>
        </div>

        {/* 進捗インジケーター */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">世界を旅するネコが頑張っています...</p>
        </div>
      </div>
    </div>
  );
}