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
    // startページに来た時点でデータを完全リセット（念のため）
    const keysToReset = [
      'catName',
      'vocabLevel', 
      'vocabularyLevel',
      'level',
      'fixedLevel',
      'totalWordsRead',
      'totalReadingTime',
      'completedReadings',
      'currentCityIndex',
      'mapIntroShown',
      'letters',
      'mails',
      'clickedWords',
      'myNotebook',
      'readingHistory',
      'currentReadingEnglish',
      'currentReadingJapanese',
      'currentReadingTitle',
      'currentReadingWordCount',
      'currentReadingStarted',
      'currentReadingEndTime',
      'currentReadingWpm',
      'currentSessionWords',
      'notified',
      'newLetter',
      'letterText'
    ];
    
    keysToReset.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('🔄 Data reset on start page - fresh beginning');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!catName.trim()) {
      setError('Please enter a name');
      return;
    }

    localStorage.setItem('catName', catName.trim());
    router.push('/tokyo');
  };

  return (
    <main className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
          {t('start_title')}
        </h1>
        
        <div className="flex justify-center mb-8">
          <img
            src="/images/cat-icon.png"
            alt="Cat Traveler"
            className="size-32 object-contain drop-shadow-lg"
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