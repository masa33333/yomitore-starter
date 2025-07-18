'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export default function StartPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [catName, setCatName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // startページアクセス時：即座に完全リセット
    console.log('🚨 START PAGE: Immediate nuclear reset');
    
    // localStorage完全クリア
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('🔄 START PAGE: All data cleared - fresh beginning');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const englishOnly = /^[a-zA-Z0-9 ]*$/;
    
    if (value === '' || englishOnly.test(value)) {
      setCatName(value);
      setError('');
    } else {
      setError('Please enter English letters, numbers, and spaces only');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!catName.trim()) {
      setError('Please enter a name');
      return;
    }

    // 🔥 NUCLEAR RESET: 完全にlocalStorageをクリア
    console.log('🚨 NUCLEAR RESET: Clearing ALL localStorage data');
    
    // 1. 全てのlocalStorageをクリア（核兵器レベル）
    localStorage.clear();
    
    // 1.5. セッションストレージもクリア
    sessionStorage.clear();
    
    // 1.6. ページ遷移前に短時間待機（ブラウザのキャッシュを避ける）
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 2. 念のため、知られているキーを個別削除
    const allKnownKeys = [
      // 基本システム
      'catName', 'vocabLevel', 'vocabularyLevel', 'level', 'fixedLevel',
      'totalWordsRead', 'totalReadingTime', 'completedReadings',
      'currentCityIndex', 'mapIntroShown', 'language', 'displayLang',
      
      // 読書・進捗システム
      'userProgress', 'stampCard', 'dailyData', 'readingProgress',
      'currentReadingEnglish', 'currentReadingJapanese', 'currentReadingTitle',
      'currentReadingWordCount', 'currentReadingStarted', 'currentReadingEndTime',
      'currentReadingWpm', 'currentSessionWords', 'currentReadingState',
      
      // メール・手紙システム
      'letters', 'mails', 'notified', 'newLetter', 'letterText', 'messageQueue',
      
      // ノートブック・履歴
      'clickedWords', 'myNotebook', 'readingHistory',
      
      // 報酬・カレンダー
      'consecutiveReadingMessage', 'welcomeBackMessage',
      'calendarData', 'todayRecord',
      
      // RewardContext関連 (新システム & 旧システム)
      'yomitore.reward.v2', 'rewardPoints', 'rewardHistory', 'earnedRewards',
      
      // クイズシステム
      'quizCompleted', 'userLevel',
      
      // その他
      'bookmarks', 'settings', 'preferences'
    ];
    
    // 3. 各キーを強制削除
    allKnownKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key); // sessionStorageもクリア
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    });
    
    // 4. ページリロード前の最終確認
    console.log('📊 localStorage after nuclear reset:', Object.keys(localStorage));
    console.log('📊 localStorage length after reset:', localStorage.length);
    
    // 特定のキーが本当に削除されたか確認
    const criticalKeys = ['totalWordsRead', 'userProgress', 'yomitore.reward.v2', 'stampCard'];
    criticalKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`🔍 ${key}:`, value);
      if (value !== null) {
        console.error(`❌ RESET FAILED: ${key} still exists with value:`, value);
      }
    });

    // 猫の名前を設定
    localStorage.setItem('catName', catName.trim());
    
    console.log('✨ Fresh start with cat name:', catName.trim());
    console.log('📊 Final localStorage after catName set:', Object.keys(localStorage));
    
    // 5. 短い遅延後に遷移（リセットが確実に完了するため）
    setTimeout(() => {
      router.push('/tokyo');
    }, 100);
  };

  return (
    <main className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-start pt-4 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full mt-4">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          {t('start_title')}
        </h1>
        
        <div className="flex justify-center mb-6">
          <img
            src="/images/cat-icon.png"
            alt="Cat Traveler"
            className="size-24 object-contain drop-shadow-lg"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="catName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('start_placeholder')}
            </label>
            <input
              type="text"
              id="catName"
              value={catName}
              onChange={handleInputChange}
              placeholder={t('start_example')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-300 text-black py-3 px-4 rounded-xl font-medium hover:bg-orange-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            {t('start_button')}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can change this later
        </p>
      </div>
    </main>
  );
}