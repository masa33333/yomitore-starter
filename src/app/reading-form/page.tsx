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
        if (!isNaN(levelNumber) && levelNumber >= 1 && levelNumber <= 5) {
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
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(level => (
                <label key={level} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="vocabularyLevel"
                    value={level}
                    checked={selectedLevel === level}
                    onChange={() => handleLevelChange(level)}
                    className="mr-3"
                  />
                  <span className={`${selectedLevel === level ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
                    {getGenerationLevelName(level)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 機能無効化の通知 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 w-full max-w-md">
        <div className="flex items-center">
          <div className="text-yellow-400 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-yellow-800 font-medium">機能一時停止中</h3>
            <p className="text-yellow-700 text-sm mt-1">
              この機能は現在メンテナンス中です。代わりに<strong>プリセットストーリー</strong>をご利用ください。
            </p>
          </div>
        </div>
      </div>

      {/* 戻るボタン */}
      <div className="text-center mb-6">
        <button
          onClick={() => router.push('/choose')}
          className="bg-[#FFB86C] text-[#1E1E1E] px-6 py-3 rounded-md font-semibold hover:bg-[#e5a561] transition-colors"
        >
          ← 選択画面に戻る
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6" style={{ display: 'none' }}>
        <div>
          <label className="mb-2 block font-semibold text-text-primary">
            {text.question1[displayLang]}
          </label>
          <input
            type="text"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder={text.placeholder[displayLang]}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-[#1E1E1E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB86C]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#FFB86C] hover:bg-[#e5a561] text-[#1E1E1E] font-semibold py-3 px-6 rounded-md transition"
        >
          {text.generateButton[displayLang]}
        </button>
      </form>
    </div>
  );
}
