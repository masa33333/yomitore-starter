// ✅ /choose/page.tsx（表現スタイルが選択式だった安定版）
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

// 語彙レベルから難易度ラベルとCEFRレベルを取得する関数
function getDifficultyFromLevel(level: number, lang: 'ja' | 'en' = 'ja'): string {
  if (lang === 'en') {
    if (level <= 3) return 'Easy (A1–A2)';
    if (level <= 6) return 'Medium (B1–B2)';
    return 'Hard (C1–C2)';
  }
  if (level <= 3) return '簡単（A1〜A2）';
  if (level <= 6) return '中（B1〜B2）';
  return '難しい（C1〜C2）';
}

// 難易度ラベルから語彙レベルを取得する関数
function getLevelFromDifficulty(difficulty: string): number {
  if (difficulty.includes('簡単') || difficulty.includes('A1') || difficulty.includes('A2')) {
    return 2; // 簡単レベルの代表値
  }
  if (difficulty.includes('中') || difficulty.includes('B1') || difficulty.includes('B2')) {
    return 5; // 中レベルの代表値
  }
  return 8; // 難しいレベルの代表値
}


export default function ChoosePage() {
  const router = useRouter();
  const { displayLang } = useLanguage();
  
  // 語彙テスト結果のレベル（固定値）
  const [fixedLevel, setFixedLevel] = useState<number>(7);

  // 表示テキストの定義
  const text = {
    title: {
      ja: '何を読みますか？',
      en: 'What would you like to read?',
    },
    level: {
      ja: (label: string) => `語彙レベル：${label}`,
      en: (label: string) => `Vocabulary Level: ${label}`,
    },
    readCard: {
      title: {
        ja: '読み物を読む',
        en: 'Read a Nonfiction Passage',
      },
      desc: {
        ja: 'ノンフィクション風の説明・エッセイ',
        en: 'Essay or nonfiction-style text',
      },
    },
    storyCard: {
      title: {
        ja: 'ストーリーを読む',
        en: 'Read a Story',
      },
      desc: {
        ja: '物語形式',
        en: 'Narrative style',
      },
    },
  };

  useEffect(() => {
    try {
      // localStorageから語彙レベルを取得
      const savedVocabLevel = localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || localStorage.getItem('level');
      if (savedVocabLevel) {
        const levelNumber = Number(savedVocabLevel);
        if (!isNaN(levelNumber) && levelNumber >= 1 && levelNumber <= 10) {
          // 固定レベルを設定（語彙テスト結果）
          setFixedLevel(levelNumber);
        }
      }
    } catch (error) {
      console.error('語彙レベル読み込みエラー:', error);
      // デフォルト値を保持
    }
  }, []);

  // カードクリック時の遷移処理
  const handleCardClick = (type: 'reading' | 'story') => {
    // 実際の生成には固定レベル（語彙テスト結果）を使用
    localStorage.setItem('fixedLevel', fixedLevel.toString());
    localStorage.setItem('level', fixedLevel.toString());
    localStorage.setItem('vocabLevel', fixedLevel.toString());
    localStorage.setItem('vocabularyLevel', fixedLevel.toString());
    
    if (type === 'reading') {
      router.push('/reading-form');
    } else {
      router.push('/story-form');
    }
  };

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-6">
        {text.title[displayLang]}（{text.level[displayLang](getDifficultyFromLevel(fixedLevel, displayLang))}）
      </h1>
      
      {/* コンテンツタイプ選択カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleCardClick('reading')}
          className="w-full bg-[#FFB86C] text-[#1E1E1E] rounded-xl px-6 py-4 hover:bg-[#e5a561] transition-colors text-left"
        >
          <div>
            <h3 className="text-lg font-semibold mb-1">{text.readCard.title[displayLang]}</h3>
            <p className="text-sm text-[#1E1E1E] mt-1">{text.readCard.desc[displayLang]}</p>
          </div>
        </button>
        
        <button
          onClick={() => handleCardClick('story')}
          className="w-full bg-[#FFE1B5] text-[#1E1E1E] rounded-xl px-6 py-4 hover:bg-[#f0d1a0] transition-colors text-left"
        >
          <div>
            <h3 className="text-lg font-semibold mb-1">{text.storyCard.title[displayLang]}</h3>
            <p className="text-sm text-[#1E1E1E] mt-1">{text.storyCard.desc[displayLang]}</p>
          </div>
        </button>
      </div>
    </main>
  );
}