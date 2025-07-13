'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { displayLang } = useLanguage();
  const router = useRouter();

  // ページマウント時の状態確認
  useEffect(() => {
    console.log('🏠 トップページがマウントされました');
    const vocabLevel = localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || localStorage.getItem('level');
    const catName = localStorage.getItem('catName');
    console.log('📊 現在の状態:', { vocabLevel, catName, displayLang });
  }, [displayLang]);

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
    router.push('/quiz');
  };

  const handleNewJourney = () => {
    console.log('🆕 「新たに多読の旅を始める」ボタンがクリックされました');
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
    
    console.log('🗑️ リセット対象のキー:', keysToReset);
    keysToReset.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('🔄 All data reset - starting new journey');
    console.log('➡️ /start ページに遷移します');
    router.push('/start');
  };

  const handleChooseReading = () => {
    console.log('🔽 「今日の読み物を決める」ボタンがクリックされました');
    // 語彙レベルがない場合は先にquizに誘導
    const vocabLevel = localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || localStorage.getItem('level');
    console.log('📊 語彙レベル確認:', { vocabLevel });
    
    if (!vocabLevel) {
      console.log('➡️ 語彙レベル未設定 - /quiz に誘導');
      router.push('/quiz');
    } else {
      console.log('➡️ 語彙レベル設定済み - /choose に誘導');
      router.push('/choose');
    }
  };


  return (
    <div className="p-6 min-h-screen flex flex-col items-center justify-start pt-6" style={{ position: 'relative', zIndex: 1 }}>
      {/* 常に2つのボタンを表示 */}
      <div className="text-center max-w-md mt-8" style={{ position: 'relative', zIndex: 2 }}>
        <h1 className="text-xl text-text-primary/70 mb-8 font-bold">
          {getText('subtitle')}
        </h1>
        
        {/* メインボタン: 今日の読み物を決める */}
        <button
          onClick={handleChooseReading}
          className="w-full mb-4 bg-primary-active text-text-primary font-semibold rounded-full px-6 py-3 text-xl hover:opacity-90 transition-colors shadow-lg cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
          {getText('choose')}
        </button>
        
        {/* サブボタン: 新たに多読の旅を始める */}
        <button
          onClick={handleNewJourney}
          className="w-full bg-primary-inactive text-text-primary font-medium rounded-full px-6 py-3 text-base hover:opacity-80 transition-colors cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
          {getText('newJourney')}
        </button>
      </div>
    </div>
  );
}
