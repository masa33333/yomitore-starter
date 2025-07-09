'use client';

import React from 'react';

export type VocabularyLevel = 'easy' | 'normal' | 'hard';

interface VocabularyLevelSelectorProps {
  currentLevel: VocabularyLevel;
  onChange: (level: VocabularyLevel) => void;
}

export default function VocabularyLevelSelector({ currentLevel, onChange }: VocabularyLevelSelectorProps) {
  const levels = [
    {
      value: 'easy' as VocabularyLevel,
      icon: '🟢',
      title: 'レベル1',
      description: 'A1+A2',
      detail: '基本語彙（0-1800語）'
    },
    {
      value: 'normal' as VocabularyLevel,
      icon: '🟠',
      title: 'レベル2',
      description: 'B1',
      detail: '中級語彙（1801-3000語）'
    },
    {
      value: 'hard' as VocabularyLevel,
      icon: '🔵',
      title: 'レベル3',
      description: 'B2',
      detail: '上級語彙（3001-3500語）'
    }
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">語彙レベルを選んでください</h3>
      
      {/* Desktop: 横並び、Mobile: 縦並び */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {levels.map((level) => {
          const isSelected = currentLevel === level.value;
          
          return (
            <button
              key={level.value}
              onClick={() => onChange(level.value)}
              className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-primary-active bg-page-bg shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="mb-2 flex items-center">
                <span className="mr-3 text-xl">{level.icon}</span>
                <div>
                  <span className={`text-lg font-semibold ${
                    isSelected ? 'text-blue-800' : 'text-gray-800'
                  }`}>
                    {level.title}
                  </span>
                  <span className={`ml-2 text-sm ${
                    isSelected ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {level.description}
                  </span>
                </div>
              </div>
              <p className={`text-sm ${
                isSelected ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {level.detail}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ヘルパー関数：UI値を数値レベルに変換（新3段階システム）
export function levelToNumber(level: VocabularyLevel): number {
  switch (level) {
    case 'easy': return 1;   // レベル1: A1+A2
    case 'normal': return 2; // レベル2: B1
    case 'hard': return 3;   // レベル3: B2
    default: return 2;
  }
}

// ヘルパー関数：数値レベルをUI値に変換（新3段階システム）
export function numberToLevel(num: number): VocabularyLevel {
  // 旧レベル4/5は新レベル3に丸める
  const normalizedNum = num > 3 ? 3 : num < 1 ? 1 : num;
  
  if (normalizedNum <= 1) return 'easy';
  if (normalizedNum <= 2) return 'normal';
  return 'hard';
}