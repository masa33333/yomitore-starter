'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
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
      ja: '今日の読み物を決める',
      en: 'Choose Today\'s Reading',
    },
    newJourney: {
      ja: '新たに多読の旅を始める',
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
    // 語彙レベルがない場合は先にquizに誘導
    const vocabLevel = localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || localStorage.getItem('level');
    if (!vocabLevel) {
      window.location.href = '/quiz';
    } else {
      window.location.href = '/choose';
    }
  };


  return (
    <div className="p-6 min-h-screen flex flex-col items-center justify-start pt-6 overflow-hidden">
      {/* 常に2つのボタンを表示 */}
      <div className="text-center max-w-md mt-8">
        <h1 className="text-xl text-text-primary/70 mb-8 font-bold">
          {getText('subtitle')}
        </h1>
        
        {/* メインボタン: 今日の読み物を決める */}
        <button
          onClick={handleChooseReading}
          className="w-full mb-4 bg-primary-active text-text-primary font-semibold rounded-full px-6 py-3 text-xl hover:opacity-90 transition-colors shadow-lg"
        >
          {getText('choose')}
        </button>
        
        {/* サブボタン: 新たに多読の旅を始める */}
        <button
          onClick={handleNewJourney}
          className="w-full bg-primary-inactive text-text-primary font-medium rounded-full px-6 py-3 text-base hover:opacity-80 transition-colors"
        >
          {getText('newJourney')}
        </button>
      </div>
    </div>
  );
}
