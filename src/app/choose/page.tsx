// ✅ /choose/page.tsx（表現スタイルが選択式だった安定版）
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { mapQuizLevelToGenerationLevel, getGenerationLevelName } from '@/utils/getEnglishText';

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
  if (difficulty.includes('簡単') || difficulty.includes('A1')) {
    return 1; // 🟢 初級 (A1): 基本的な単語と現在形のみ
  }
  if (difficulty.includes('A2')) {
    return 2; // 🟡 初中級 (A2): 過去形・未来形を含む基本的な表現
  }
  if (difficulty.includes('中') || difficulty.includes('B1')) {
    return 3; // 🟠 中級 (B1): 日常会話に必要な語彙と関係代名詞
  }
  if (difficulty.includes('B2')) {
    return 4; // 🔵 中上級 (B2): 幅広い語彙と複雑な従属節
  }
  return 5; // 🟣 上級 (C1+): 学術的・専門的語彙と高度な構文
}


export default function ChoosePage() {
  const router = useRouter();
  const { displayLang } = useLanguage();
  
  // クイズレベル（1-10）と生成レベル（1-5）を分けて管理
  const [quizLevel, setQuizLevel] = useState<number>(5);
  const [generationLevel, setGenerationLevel] = useState<number>(3);

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
      // localStorageからクイズレベル（1-10）を取得
      const savedVocabLevel = localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || localStorage.getItem('level');
      if (savedVocabLevel) {
        const levelNumber = Number(savedVocabLevel);
        if (!isNaN(levelNumber) && levelNumber >= 1 && levelNumber <= 10) {
          // クイズレベルを設定
          setQuizLevel(levelNumber);
          // 生成レベルにマッピング
          const mappedLevel = mapQuizLevelToGenerationLevel(levelNumber);
          setGenerationLevel(mappedLevel);
          console.log(`📊 Choose画面: クイズLv.${levelNumber} → 生成Lv.${mappedLevel}`);
        }
      }
    } catch (error) {
      console.error('語彙レベル読み込みエラー:', error);
      // デフォルト値を保持
    }
  }, []);

  // カードクリック時の遷移処理
  const handleCardClick = (type: 'reading' | 'story') => {
    // 生成レベル（1-5）を保存 - APIがこれを使用
    localStorage.setItem('fixedLevel', generationLevel.toString());
    localStorage.setItem('level', generationLevel.toString());
    // クイズレベル（1-10）も保持（互換性のため）
    localStorage.setItem('vocabLevel', quizLevel.toString());
    localStorage.setItem('vocabularyLevel', quizLevel.toString());
    
    console.log(`📊 遷移時: 生成レベル${generationLevel}で${type}へ`);
    
    if (type === 'reading') {
      router.push('/reading-form');
    } else {
      router.push('/story-form');
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-4 min-h-screen overflow-hidden">
      <h1 className="mb-6 mt-8 text-xl font-bold">
        {text.title[displayLang]}（{getGenerationLevelName(generationLevel)}）
      </h1>
      
      {/* コンテンツタイプ選択カード */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() => handleCardClick('reading')}
          className="w-full rounded-xl bg-primary-active px-6 py-4 text-left text-text-primary transition-colors hover:bg-[#e5a561]"
        >
          <div>
            <h3 className="mb-1 text-lg font-semibold">{text.readCard.title[displayLang]}</h3>
            <p className="mt-1 text-sm text-text-primary">{text.readCard.desc[displayLang]}</p>
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