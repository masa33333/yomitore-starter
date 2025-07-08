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
  const [showLevelSelector, setShowLevelSelector] = useState<boolean>(false);

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
      // 現在の語彙システムは1-5レベル直接使用
      // まず生成レベル（1-5）を優先して取得
      const savedLevel = localStorage.getItem('level') || localStorage.getItem('fixedLevel');
      const savedVocabLevel = localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel');
      
      if (savedLevel) {
        const levelNumber = Number(savedLevel);
        if (!isNaN(levelNumber) && levelNumber >= 1 && levelNumber <= 5) {
          // 1-5レベルをそのまま使用（マッピング不要）
          setGenerationLevel(levelNumber);
          setQuizLevel(levelNumber); // 表示用も同じに
          console.log(`📊 Choose画面: 生成レベル Lv.${levelNumber} (直接使用)`);
        }
      } else if (savedVocabLevel) {
        const levelNumber = Number(savedVocabLevel);
        if (!isNaN(levelNumber) && levelNumber >= 1 && levelNumber <= 5) {
          // 1-5の範囲内ならそのまま使用
          setGenerationLevel(levelNumber);
          setQuizLevel(levelNumber);
          console.log(`📊 Choose画面: 語彙レベル Lv.${levelNumber} (直接使用)`);
        } else if (levelNumber >= 6 && levelNumber <= 10) {
          // 6-10の場合のみマッピング（古いデータ対応）
          const mappedLevel = mapQuizLevelToGenerationLevel(levelNumber);
          setGenerationLevel(mappedLevel);
          setQuizLevel(levelNumber);
          console.log(`📊 Choose画面: 旧クイズLv.${levelNumber} → 生成Lv.${mappedLevel} (互換性)`);
        }
      }
    } catch (error) {
      console.error('語彙レベル読み込みエラー:', error);
      // デフォルト値を保持
    }
  }, []);

  // レベル変更処理
  const handleLevelChange = (newLevel: number) => {
    setGenerationLevel(newLevel);
    setQuizLevel(newLevel); // 表示用も同じに
    
    // localStorageに即座に保存
    localStorage.setItem('level', newLevel.toString());
    localStorage.setItem('fixedLevel', newLevel.toString());
    localStorage.setItem('vocabLevel', newLevel.toString());
    localStorage.setItem('vocabularyLevel', newLevel.toString());
    
    console.log(`📊 レベル変更: Lv.${newLevel}に設定`);
    setShowLevelSelector(false); // 選択後は閉じる
  };

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
    <main className="mx-auto max-w-4xl p-4 min-h-screen">
      <div className="mb-6 mt-8">
        <h1 className="text-xl font-bold mb-4">
          {text.title[displayLang]}
        </h1>
        
        {/* 語彙レベル表示・変更セクション */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">
              現在：{getGenerationLevelName(generationLevel)}
            </span>
            <button
              onClick={() => setShowLevelSelector(!showLevelSelector)}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              レベル変更
            </button>
          </div>
          
          {/* レベル選択UI */}
          {showLevelSelector && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">語彙レベルを選択してください：</p>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <label key={level} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="vocabularyLevel"
                      value={level}
                      checked={generationLevel === level}
                      onChange={() => handleLevelChange(level)}
                      className="mr-3"
                    />
                    <span className={`${generationLevel === level ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
                      {getGenerationLevelName(level)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
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