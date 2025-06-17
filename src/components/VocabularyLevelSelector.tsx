'use client';

import { useState } from 'react';

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
      title: '簡単',
      description: 'A1〜A2',
      detail: '基本的な語彙、短い文'
    },
    {
      value: 'normal' as VocabularyLevel,
      icon: '🟨',
      title: '中くらい',
      description: 'B1〜B2',
      detail: '日常語彙、中程度の文'
    },
    {
      value: 'hard' as VocabularyLevel,
      icon: '🟦',
      title: '難しい',
      description: 'C1〜',
      detail: '高度語彙、複雑な文'
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
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'bg-blue-100 border-blue-500 shadow-md'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-xl mr-3">{level.icon}</span>
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

// ヘルパー関数：UI値を数値レベルに変換
export function levelToNumber(level: VocabularyLevel): number {
  switch (level) {
    case 'easy': return 3;
    case 'normal': return 6;
    case 'hard': return 9;
    default: return 6;
  }
}

// ヘルパー関数：数値レベルをUI値に変換
export function numberToLevel(num: number): VocabularyLevel {
  if (num <= 3) return 'easy';
  if (num <= 6) return 'normal';
  return 'hard';
}