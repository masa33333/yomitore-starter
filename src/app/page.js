'use client';

import { useEffect, useState } from "react";
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const [hasVocabLevel, setHasVocabLevel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { displayLang } = useLanguage();

  // 表示テキストの定義
  const text = {
    title: {
      ja: '多読トレーニング',
      en: 'Tadoku Training',
    },
    subtitle: {
      ja: '今日は何を読みましょうか？',
      en: 'What would you like to read today?',
    },
    choose: {
      ja: '読み物を選ぶ',
      en: 'Choose Reading',
    },
    retest: {
      ja: '多読の旅を新たに始める',
      en: 'Start a New Reading Journey',
    },
    firstTime: {
      ja: 'まずはあなたの語彙レベルをチェックしましょう！',
      en: 'Let\'s check your vocabulary level first!',
    },
    checkLevel: {
      ja: '語彙レベルをチェックする',
      en: 'Check Vocabulary Level',
    },
    loading: {
      ja: '読み込み中...',
      en: 'Loading...',
    },
  };

  // 表示言語に応じたテキスト取得関数
  const getText = (key) => {
    return text[key][displayLang];
  };

  useEffect(() => {
    // localStorageから語彙レベルをチェック
    const checkVocabLevel = () => {
      const vocabLevel = localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || localStorage.getItem('level');
      setHasVocabLevel(!!vocabLevel);
      setIsLoading(false);
    };

    checkVocabLevel();
  }, []);

  const handleQuizStart = () => {
    window.location.href = '/quiz';
  };

  const handleNewJourney = () => {
    // 全てのlocalStorageデータをリセット
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
    
    console.log('🔄 All data reset - starting new journey');
    window.location.href = '/start';
  };

  const handleChooseReading = () => {
    window.location.href = '/choose';
  };

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p className="text-lg text-text-primary animate-pulse">{getText('loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen flex flex-col items-center justify-start pt-6">
      
      {!hasVocabLevel ? (
        // 初回ユーザー向け - 語彙レベルチェックのみ
        <div className="text-center max-w-md mt-8">
          <p className="text-lg text-text-primary mb-8">
            {getText('firstTime')}
          </p>
          <button
            onClick={handleQuizStart}
            className="bg-primary-active text-text-primary font-semibold rounded-full px-6 py-3 text-xl hover:opacity-90 transition-colors shadow-lg"
          >
            {getText('checkLevel')}
          </button>
        </div>
      ) : (
        // 既存ユーザー向け - 読み物選択 + 再測定オプション
        <div className="text-center max-w-md mt-8">
          <h1 className="text-xl text-text-primary/70 mb-8 font-bold">
            {getText('subtitle')}
          </h1>
          <button
            onClick={handleChooseReading}
            className="bg-primary-active text-text-primary font-semibold rounded-full px-6 py-3 text-xl hover:opacity-90 transition-colors shadow-lg"
          >
            {getText('choose')}
          </button>
          
          <div className="mt-6">
            <button
              onClick={handleNewJourney}
              className="bg-primary-inactive text-text-primary font-medium rounded-full px-6 py-3 text-sm hover:opacity-80 transition-colors"
            >
              {getText('retest')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
