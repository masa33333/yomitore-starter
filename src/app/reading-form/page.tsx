'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { getGenerationLevelName } from '@/utils/getEnglishText';
import CatLoader from '@/components/CatLoader';

export default function ReadingFormPage() {
  const router = useRouter();
  const { displayLang } = useLanguage();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number>(3);
  const [showLevelSelector, setShowLevelSelector] = useState<boolean>(false);

  useEffect(() => {
    // 保存されたレベルを読み込み
    try {
      const savedLevel = localStorage.getItem('level') || localStorage.getItem('fixedLevel');
      if (savedLevel) {
        const levelNumber = Number(savedLevel);
        if (!isNaN(levelNumber) && levelNumber >= 1 && levelNumber <= 3) {
          setSelectedLevel(levelNumber);
        }
      }
    } catch (error) {
      console.error('語彙レベル読み込みエラー:', error);
    }
  }, []);

  // レベル変更処理
  const handleLevelChange = (newLevel: number) => {
    setSelectedLevel(newLevel);
    
    // localStorageに保存
    localStorage.setItem('level', newLevel.toString());
    localStorage.setItem('fixedLevel', newLevel.toString());
    localStorage.setItem('vocabLevel', newLevel.toString());
    localStorage.setItem('vocabularyLevel', newLevel.toString());
    
    console.log(`📊 読み物フォーム: レベル${newLevel}に設定`);
    setShowLevelSelector(false);
  };

  // 表示テキストの定義
  const text = {
    title: {
      ja: '今日の読み物を作ろう',
      en: 'Let\'s Create Today\'s Reading!',
    },
    question1: {
      ja: '知りたいテーマ',
      en: 'What topic would you like to learn about?',
    },
    placeholder: {
      ja: '例：コーヒー、火山の仕組み、チンギスハーン など',
      en: 'e.g., Coffee, How volcanoes work, Genghis Khan',
    },
    generateButton: {
      ja: '生成',
      en: 'Generate',
    },
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // ユーザーの生成レベル（1-5）を取得
    const vocabLevel = localStorage.getItem('level') || 
                      localStorage.getItem('fixedLevel') || 
                      '3';
    console.log('📊 Reading-form: 生成レベル使用:', vocabLevel);
    
    const params = new URLSearchParams({
      mode: 'reading',
      topic,
      level: vocabLevel,
    });
    router.push(`/reading?${params.toString()}`);
  };

  if (isGenerating) {
    return <CatLoader />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-6 bg-page-bg px-4">
      <h1 className="mb-6 mt-8 text-2xl font-bold text-text-primary">{text.title[displayLang]}</h1>
      
      {/* 語彙レベル選択セクション */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6 w-full max-w-md">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-bold">
            語彙レベル：{getGenerationLevelName(selectedLevel)}
          </span>
          <button
            type="button"
            onClick={() => setShowLevelSelector(!showLevelSelector)}
            className="text-gray-800 hover:text-gray-600 underline text-sm"
          >
            レベル変更
          </button>
        </div>
        
        {/* レベル選択UI */}
        {showLevelSelector && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">語彙レベルを選択してください：</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { level: 1, label: '初級', description: '基本語彙のみ' },
                { level: 2, label: '中級', description: '日常語彙' },
                { level: 3, label: '上級', description: '幅広い語彙' }
              ].map(({ level, label, description }) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedLevel === level 
                      ? 'bg-[#FFB86C] text-[#1E1E1E]' 
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">Lv.{level}</div>
                    <div className="text-xs">{label}</div>
                    <div className="text-xs opacity-75">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            {text.question1[displayLang]}
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={text.placeholder[displayLang]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={!topic.trim()}
          className="w-full bg-[#FFB86C] text-[#1E1E1E] px-6 py-3 rounded-md font-bold hover:bg-[#e5a561] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {text.generateButton[displayLang]}
        </button>
      </form>
    </div>
  );
}
