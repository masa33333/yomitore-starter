'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useStory } from '@/lib/store/story';
import MailNotification from '@/components/MailNotification';

// 単語情報のインターフェース
interface WordInfo {
  word: string;
  originalForm: string;
  partOfSpeech: string;
  meaning: string;
  japaneseMeaning: string;
  sentence: string;
  sentenceJapanese: string;
}

// 初期データの型定義
interface InitialData {
  title: string;
  story: string;
  themes?: string[];
}

interface ReadingClientProps {
  searchParams: any;
  initialData: InitialData | null;
  mode: string;
}

// 品詞の英語→日本語変換
const posToJapanese: { [key: string]: string } = {
  'noun': '名詞',
  'verb': '動詞',
  'adjective': '形容詞',
  'adverb': '副詞',
  'pronoun': '代名詞',
  'conjunction': '接続詞',
  'preposition': '前置詞',
  'interjection': '間投詞',
  'determiner': '限定詞',
  'unknown': '不明'
};

export default function ReadingClient({ searchParams, initialData, mode }: ReadingClientProps) {
  const router = useRouter();
  const { displayLang } = useLanguage();
  const { t } = useTranslation();
  const { story, updateStory } = useStory();

  // タイトル表示用のテーマ/ジャンル取得
  const displayTitle = mode === 'story' 
    ? (initialData?.title || searchParams.genre || 'ストーリー')
    : (searchParams.topic || searchParams.theme || '読み物');

  // notebookからの戻りかどうかを初期化時に判定
  const isFromNotebook = () => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('fromNotebook') === 'true' || urlParams.get('from') === 'notebook';
  };

  // 基本状態
  const [loading, setLoading] = useState(false);
  const [english, setEnglish] = useState<string>(() => {
    // notebookから戻った場合はlocalStorageから復元、そうでなければinitialDataを使用
    if (isFromNotebook() && typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentReadingEnglish');
      return saved || 'コンテンツを読み込み中...';
    }
    return initialData?.story || 'コンテンツを読み込み中...';
  });
  
  // クライアントサイドでの状態復元フラグ
  const [isClientRestored, setIsClientRestored] = useState(false);
  const [japanese, setJapanese] = useState<string>('');
  const [storyTitle, setStoryTitle] = useState<string>(() => {
    if (isFromNotebook() && typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentReadingTitle');
      return saved || '';
    }
    return initialData?.title || '';
  });
  const [englishParagraphs, setEnglishParagraphs] = useState<string[]>(() => {
    if (isFromNotebook() && typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentReadingEnglish');
      if (saved) {
        return saved.split('\n\n').filter(p => p.trim());
      }
    }
    if (initialData?.story) {
      return initialData.story.split('\n\n').filter(p => p.trim());
    }
    return [];
  });
  const [japaneseParagraphs, setJapaneseParagraphs] = useState<string[]>([]);
  
  // 読書状態
  const [showJapanese, setShowJapanese] = useState(false);
  const [isReadingStarted, setIsReadingStarted] = useState(() => {
    if (isFromNotebook() && typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentReadingStarted');
      return saved === 'true';
    }
    return false;
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState<number>(() => {
    if (isFromNotebook() && typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentReadingWordCount');
      if (saved) return parseInt(saved, 10);
    }
    if (initialData?.story) {
      return initialData.story.trim().split(/\s+/).filter(w => w.length > 0).length;
    }
    return 0;
  });
  
  // 単語処理状態
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loadingWordInfo, setLoadingWordInfo] = useState(false);
  const [sessionWords, setSessionWords] = useState<WordInfo[]>(() => {
    if (isFromNotebook() && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('currentSessionWords');
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Error parsing saved session words:', error);
        return [];
      }
    }
    return [];
  });
  
  // 通知状態
  const [showMailNotification, setShowMailNotification] = useState(false);
  
  // レベル変更状態
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(3);

  console.log('🎨 ReadingClient rendered with:', {
    mode,
    hasInitialData: !!initialData,
    title: storyTitle,
    englishLength: english.length,
    paragraphCount: englishParagraphs.length,
    isReadingStarted,
    wordCount,
    firstParagraphPreview: englishParagraphs[0]?.substring(0, 100) + '...'
  });

  // コンポーネントマウント時にテストログ出力とデータ統一
  React.useEffect(() => {
    console.log('🚀 ReadingClient mounted!');
    console.log('📋 English paragraphs:', englishParagraphs);
    console.log('📊 Word count:', wordCount);
    
    // URLパラメータをチェックしてnotebookからの戻りかどうかを判定
    const urlParams = new URLSearchParams(window.location.search);
    const fromNotebook = urlParams.get('fromNotebook') === 'true' || urlParams.get('from') === 'notebook';
    console.log('📚 From notebook?', fromNotebook);
    console.log('📚 URL params:', {
      fromNotebook: urlParams.get('fromNotebook'),
      from: urlParams.get('from'),
      allParams: Object.fromEntries(urlParams.entries())
    });
    
    // notebookから戻った場合の完全な状態復元処理
    if (fromNotebook) {
      console.log('📚 Complete restoration for notebook return...');
      try {
        const savedEnglish = localStorage.getItem('currentReadingEnglish');
        const savedTitle = localStorage.getItem('currentReadingTitle');
        const savedWordCount = localStorage.getItem('currentReadingWordCount');
        const savedReadingStarted = localStorage.getItem('currentReadingStarted');
        const savedJapanese = localStorage.getItem('currentReadingJapanese');
        const savedEndTime = localStorage.getItem('currentReadingEndTime');
        const savedWpm = localStorage.getItem('currentReadingWpm');
        const savedSessionWords = localStorage.getItem('currentSessionWords');
        
        console.log('📚 Saved data check:', {
          hasEnglish: !!savedEnglish,
          englishLength: savedEnglish?.length || 0,
          hasTitle: !!savedTitle,
          hasWordCount: !!savedWordCount,
          hasReadingStarted: !!savedReadingStarted,
          hasJapanese: !!savedJapanese,
          hasEndTime: !!savedEndTime,
          hasWpm: !!savedWpm,
          hasSessionWords: !!savedSessionWords
        });
        
        // 英語テキストの復元（最重要）
        if (savedEnglish && savedEnglish.trim() !== '') {
          console.log('🔄 Restoring English text from localStorage...');
          setEnglish(savedEnglish);
          setEnglishParagraphs(savedEnglish.split('\n\n').filter(p => p.trim()));
        }
        
        // タイトルの復元
        if (savedTitle) {
          setStoryTitle(savedTitle);
        }
        
        // 語数の復元
        if (savedWordCount) {
          setWordCount(parseInt(savedWordCount, 10));
        }
        
        // 読書開始状態の復元
        if (savedReadingStarted === 'true') {
          setIsReadingStarted(true);
        }
        
        // 日本語翻訳の復元
        if (savedJapanese) {
          setJapanese(savedJapanese);
          setJapaneseParagraphs(savedJapanese.split('\n\n').filter(p => p.trim()));
          setShowJapanese(true);
        }
        
        // 読書完了状態の復元
        if (savedEndTime) {
          setEndTime(parseInt(savedEndTime, 10));
        }
        
        if (savedWpm) {
          setWpm(parseInt(savedWpm, 10));
        }
        
        // セッション単語の復元
        if (savedSessionWords) {
          try {
            const words = JSON.parse(savedSessionWords);
            setSessionWords(words);
            console.log('📝 Session words restored:', words.length);
          } catch (error) {
            console.error('❌ Error parsing session words:', error);
          }
        }
        
        setIsClientRestored(true);
        console.log('✅ Complete reading state restored from localStorage');
      } catch (error) {
        console.error('❌ Error with complete restoration:', error);
        setIsClientRestored(true);
      }
    } else {
      setIsClientRestored(true);
    }
    
    // localStorage の単語データを統一
    try {
      const myNotebookData = JSON.parse(localStorage.getItem('myNotebook') || '[]');
      const clickedWordsData = JSON.parse(localStorage.getItem('clickedWords') || '[]');
      
      console.log('📝 Data sync check:', {
        myNotebookCount: myNotebookData.length,
        clickedWordsCount: clickedWordsData.length
      });
      
      // myNotebookにデータがあってclickedWordsが空の場合、データを移行
      if (myNotebookData.length > 0 && clickedWordsData.length === 0) {
        localStorage.setItem('clickedWords', JSON.stringify(myNotebookData));
        console.log('📝 Migrated myNotebook data to clickedWords:', myNotebookData.length, 'items');
      }
    } catch (error) {
      console.error('❌ Data sync error:', error);
    }
  }, []);

  // 読書状態をlocalStorageに保存する関数
  const saveCurrentReadingState = () => {
    try {
      localStorage.setItem('currentReadingEnglish', english);
      localStorage.setItem('currentReadingJapanese', japanese);
      localStorage.setItem('currentReadingTitle', storyTitle);
      localStorage.setItem('currentReadingWordCount', wordCount.toString());
      localStorage.setItem('currentReadingStarted', isReadingStarted.toString());
      if (endTime) localStorage.setItem('currentReadingEndTime', endTime.toString());
      if (wpm) localStorage.setItem('currentReadingWpm', wpm.toString());
      localStorage.setItem('currentSessionWords', JSON.stringify(sessionWords));
      console.log('📚 Reading state saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving reading state:', error);
    }
  };

  // 読書開始処理
  const handleStartReading = () => {
    setIsReadingStarted(true);
    setStartTime(Date.now());
    console.log('📖 読書開始');
    
    // 読書状態をlocalStorageに保存
    saveCurrentReadingState();
  };

  // 読書完了処理
  const handleCompleteReading = () => {
    if (!startTime) return;
    
    const endTimeValue = Date.now();
    setEndTime(endTimeValue);
    
    const timeInMinutes = (endTimeValue - startTime) / 60000;
    const calculatedWpm = Math.round(wordCount / timeInMinutes);
    setWpm(calculatedWpm);
    
    console.log('✅ 読書完了:', {
      wordCount,
      timeInMinutes: timeInMinutes.toFixed(1),
      wpm: calculatedWpm
    });
    
    // 読了回数をカウント
    const completedReadings = parseInt(localStorage.getItem('completedReadings') || '0', 10);
    const newCompletedReadings = completedReadings + 1;
    localStorage.setItem('completedReadings', newCompletedReadings.toString());
    
    console.log('📚 読了回数:', newCompletedReadings);
    
    // 2回目の読了完了時に一通目の手紙を送信
    if (newCompletedReadings === 2) {
      sendFirstLetter();
    }
    
    // 読書完了状態を保存
    setTimeout(() => {
      saveCurrentReadingState();
    }, 100);
  };

  // 一通目の手紙を送信する関数
  const sendFirstLetter = async () => {
    try {
      console.log('📮 一通目の手紙を生成中...');
      
      // ユーザーの語彙レベルを取得
      const userVocabLevel = parseInt(localStorage.getItem('vocabLevel') || '3', 10);
      
      // 一通目の手紙コンテンツ生成
      const response = await fetch('/api/travel/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'departure',
          city: 'Tokyo',
          level: userVocabLevel,
          isFirstLetter: true
        })
      });
      
      if (response.ok) {
        const letterData = await response.json();
        console.log('📮 API レスポンス:', letterData);
        
        // letterページが読み込む形式でlocalStorageに保存
        const letterText = {
          type: 'letter',
          jp: letterData.jp || '成田空港からの手紙です。これから素晴らしい旅が始まります！',
          en: letterData.en || letterData.english || 'A letter from Narita Airport.',
          city: 'Tokyo',
          image: '/letters/tokyo.png',
          catName: localStorage.getItem('catName') || 'ネコ',
          isFirstLetter: true
        };
        
        // letterページが期待する形式で保存
        localStorage.setItem('letterText', JSON.stringify(letterText));
        
        // 既存の手紙リストにも追加（履歴用）
        const existingLetters = JSON.parse(localStorage.getItem('letters') || '[]');
        existingLetters.push({
          id: existingLetters.length + 1,
          ...letterText,
          sentAt: Date.now()
        });
        localStorage.setItem('letters', JSON.stringify(existingLetters));
        
        // 通知フラグを設定
        localStorage.setItem('notified', 'true');
        localStorage.setItem('newLetter', 'true');
        
        console.log('📮 手紙保存完了:', letterText);
        
        console.log('✅ 一通目の手紙送信完了');
        
        // 通知を表示
        setShowMailNotification(true);
        
        // 3秒後に通知を非表示
        setTimeout(() => {
          setShowMailNotification(false);
        }, 3000);
      } else {
        console.error('❌ 手紙生成エラー:', response.statusText);
      }
    } catch (error) {
      console.error('❌ 手紙送信エラー:', error);
    }
  };

  // 単語クリック処理
  const handleWordClick = async (word: string) => {
    console.log('🔍 handleWordClick called with:', word);
    setSelectedWord(word);
    setLoadingWordInfo(true);
    
    try {
      const response = await fetch('/api/word-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word: word,
          originalForm: word, 
          sentence: english 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setWordInfo(data);
        
        // セッション単語に追加
        const newSessionWord = {
          word: word, // クリックした単語を見出し語として使用
          originalForm: word,
          partOfSpeech: data.partOfSpeech || 'unknown',
          meaning: data.meaning || data.paraphrase || '',
          japaneseMeaning: data.japaneseMeaning || '意味不明',
          sentence: data.sentence || data.exampleEnglish || '',
          sentenceJapanese: data.sentenceJapanese || data.exampleJapanese || ''
        };
        
        setSessionWords(prev => [...prev, newSessionWord]);
        
        // localStorageにも保存してnotebookページで確認できるように
        try {
          // notebookページが優先的に読み込むclickedWordsに保存
          const existingClickedWords = JSON.parse(localStorage.getItem('clickedWords') || '[]');
          const clickedWordExists = existingClickedWords.some((w: any) => w.word === newSessionWord.word);
          
          console.log('📝 保存しようとする単語:', newSessionWord);
          console.log('📝 既存のclickedWords数:', existingClickedWords.length);
          console.log('📝 clickedWordsに単語存在チェック:', clickedWordExists);
          
          if (!clickedWordExists) {
            const updatedClickedWords = [...existingClickedWords, newSessionWord];
            localStorage.setItem('clickedWords', JSON.stringify(updatedClickedWords));
            console.log('✅ 単語をclickedWordsに保存完了:', newSessionWord.word);
            console.log('📝 clickedWords保存後の単語数:', updatedClickedWords.length);
          }
          
          // 互換性のためmyNotebookにも保存
          const existingMyNotebook = JSON.parse(localStorage.getItem('myNotebook') || '[]');
          const myNotebookExists = existingMyNotebook.some((w: WordInfo) => w.word === newSessionWord.word);
          
          if (!myNotebookExists) {
            const updatedMyNotebook = [...existingMyNotebook, newSessionWord];
            localStorage.setItem('myNotebook', JSON.stringify(updatedMyNotebook));
            console.log('✅ 単語をmyNotebookにも保存完了:', newSessionWord.word);
          }
          
          // 単語追加後に読書状態を保存
          setTimeout(() => {
            saveCurrentReadingState();
          }, 100);
        } catch (error) {
          console.error('❌ マイノート保存エラー:', error);
        }
      }
    } catch (error) {
      console.error('❌ 単語情報取得エラー:', error);
    } finally {
      setLoadingWordInfo(false);
    }
  };

  // 日本語翻訳取得
  const handleShowJapanese = async () => {
    if (japanese) {
      setShowJapanese(true);
      return;
    }
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: english })
      });
      
      if (response.ok) {
        const data = await response.json();
        setJapanese(data.translation);
        setJapaneseParagraphs(data.translation.split('\n\n'));
        setShowJapanese(true);
        
        // 翻訳取得後に状態を保存
        setTimeout(() => {
          saveCurrentReadingState();
        }, 100);
      }
    } catch (error) {
      console.error('❌ 翻訳エラー:', error);
    }
  };

  // レベル変更処理
  const handleLevelChange = () => {
    setShowLevelSelector(!showLevelSelector);
  };
  
  // レベル再生成処理
  const handleRegenerateWithLevel = async (newLevel: number) => {
    setLoading(true);
    setShowLevelSelector(false);
    
    try {
      // 現在の英語テキストを新しいレベルで書き直し
      const response = await fetch('/api/rewrite-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          originalText: english,
          targetLevel: newLevel,
          title: storyTitle || displayTitle
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 新しいレベルのテキストで更新
        setEnglish(data.rewrittenText);
        setEnglishParagraphs(data.rewrittenText.split('\n\n').filter(p => p.trim()));
        
        // 日本語翻訳をリセット（必要に応じて再翻訳）
        setJapanese('');
        setJapaneseParagraphs([]);
        setShowJapanese(false);
        
        // 語数を再計算
        const words = data.rewrittenText.trim().split(/\s+/).filter(w => w.length > 0);
        setWordCount(words.length);
        
        // 読書状態をリセット
        setIsReadingStarted(false);
        setStartTime(null);
        setEndTime(null);
        setWpm(null);
        setSessionWords([]);
        
        console.log('✅ レベル変換完了:', { newLevel, newWordCount: words.length });
      } else {
        console.error('❌ レベル変換エラー');
        alert('レベル変換に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('❌ レベル変換エラー:', error);
      alert('レベル変換に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 親要素のクリックハンドラー（Event Delegation）
  const handleTextClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    console.log('🖱️ 段落がクリックされました');
    const target = e.target as HTMLElement;
    console.log('🎯 クリックされた要素:', target);
    console.log('🎯 要素のクラス:', target.className);
    console.log('🎯 要素のテキスト:', target.textContent);
    
    // クリックされた要素が単語要素か確認
    if (target.classList.contains('clickable-word')) {
      const word = target.textContent || '';
      console.log('🖱️ Event Delegation: 単語クリック検出:', word);
      e.preventDefault();
      e.stopPropagation();
      handleWordClick(word);
    }
  };

  // 英語テキストをクリック可能な単語に分割
  const renderClickableText = (text: string) => {
    console.log('🎨 renderClickableText called with:', text.substring(0, 100) + '...');
    const words = text.split(/(\s+|[.!?;:,\-\u2013\u2014()"])/);
    
    let clickableWordCount = 0;
    const result = words.map((part, index) => {
      if (/^[a-zA-Z]+$/.test(part)) {
        clickableWordCount++;
        console.log(`✨ クリック可能な単語 ${clickableWordCount}:`, part);
        return (
          <span
            key={index}
            className="clickable-word cursor-pointer hover:bg-yellow-200 hover:bg-opacity-50 transition-colors duration-200"
            title="クリックして意味を調べる"
            data-word={part}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
    
    console.log(`🎯 この段落のクリック可能単語数: ${clickableWordCount}`);
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="p-4 bg-[#FFF9F4] min-h-screen">
      {/* ページタイトル */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">
          {mode === 'story' ? (initialData?.title || displayTitle) : displayTitle}
        </h1>
        {mode === 'story' && searchParams.genre && (
          <p className="text-sm text-gray-600">ジャンル: {searchParams.genre}</p>
        )}
        {mode !== 'story' && searchParams.topic && (
          <p className="text-sm text-gray-600">テーマ: {searchParams.topic}</p>
        )}
      </div>

      {/* コンテンツ表示 */}
      {!isReadingStarted ? (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold mb-2">読書を開始しますか？</h2>
            <p className="text-gray-600 mb-4">語数: {wordCount}語</p>
            
            
            <button
              onClick={handleStartReading}
              className="bg-[#FFB86C] text-[#1E1E1E] px-6 py-3 rounded-md font-medium hover:bg-[#e5a561] transition-colors"
            >
              読み始める
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* テキスト表示（段落ごと） */}
          <div className="bg-white rounded-lg p-6 shadow-sm" style={{ pointerEvents: 'auto' }}>
            <div className="max-w-none" style={{ pointerEvents: 'auto' }}>
              {englishParagraphs.map((paragraph, index) => {
                console.log(`📝 段落 ${index + 1}:`, paragraph.substring(0, 50) + '...');
                return (
                <div key={index} className="mb-6">
                  {/* 英語段落 */}
                  <p 
                    className="mb-3 text-base leading-relaxed text-[#1E1E1E]"
                    onClick={handleTextClick}
                    style={{ 
                      pointerEvents: 'auto',
                      userSelect: 'auto'
                    }}
                  >
                    {renderClickableText(paragraph)}
                  </p>
                  
                  {/* 対応する日本語段落 */}
                  {showJapanese && japaneseParagraphs[index] && (
                    <div className="bg-[#FFF9F4] border border-[#FFE1B5] p-4 rounded-lg">
                      <p className="text-base text-[#1E1E1E] italic">
                        {japaneseParagraphs[index]}
                      </p>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              {!showJapanese && (
                <button
                  onClick={handleShowJapanese}
                  className="bg-[#FFB86C] text-[#1E1E1E] px-4 py-2 rounded-md hover:bg-[#e5a561] transition-colors"
                >
                  日本語を表示
                </button>
              )}
              
              {!endTime && (
                <button
                  onClick={handleCompleteReading}
                  className="bg-[#FFE1B5] text-[#1E1E1E] px-4 py-2 rounded-md hover:bg-[#f0d1a0] transition-colors font-medium"
                >
                  読書完了
                </button>
              )}
            </div>
          </div>


          {/* 読書完了後の表示 */}
          {endTime && (
            <div className="bg-[#FFF9F4] border border-[#FFE1B5] rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-3 text-[#1E1E1E]">読書完了！</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">語数</p>
                  <p className="text-lg font-bold">{wordCount} 語</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">読書時間</p>
                  <p className="text-lg font-bold">
                    {startTime && endTime ? 
                      `${Math.floor((endTime - startTime) / 60000)}分${Math.floor(((endTime - startTime) % 60000) / 1000)}秒` : 
                      '計測なし'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">語彙レベル</p>
                  <p className="text-lg font-bold">
                    Lv.{localStorage.getItem('vocabLevel') || '3'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">読書速度</p>
                  <p className="text-lg font-bold">{wpm} WPM</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">合計読書時間</p>
                  <p className="text-lg font-bold">
                    {(() => {
                      const totalReadingTime = parseInt(localStorage.getItem('totalReadingTime') || '0', 10);
                      const currentSessionTime = startTime && endTime ? (endTime - startTime) : 0;
                      const newTotalTime = totalReadingTime + currentSessionTime;
                      
                      // 新しい合計時間をlocalStorageに保存
                      if (currentSessionTime > 0) {
                        localStorage.setItem('totalReadingTime', newTotalTime.toString());
                      }
                      
                      const hours = Math.floor(newTotalTime / 3600000);
                      const minutes = Math.floor((newTotalTime % 3600000) / 60000);
                      
                      if (hours > 0) {
                        return `${hours}時間${minutes}分`;
                      } else {
                        return `${minutes}分`;
                      }
                    })()}
                  </p>
                </div>
              </div>
              
              {/* 今日のマイノート */}
              {sessionWords.length > 0 && (
                <div className="bg-[#FFF9F4] border border-[#C9A86C] rounded p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#1E1E1E]">今日のマイノート</h3>
                  </div>
                  
                  <p className="text-sm text-[#1E1E1E] mb-3">
                    クリックした単語: {sessionWords.length}個
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    {sessionWords.map((word, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-[#C9A86C]">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="space-y-2">
                              {/* 見出し語 */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xl text-[#1E1E1E]">{word.word}</span>
                                {word.originalForm && word.originalForm !== word.word && (
                                  <span className="font-semibold text-lg text-gray-600">
                                    {word.originalForm}
                                  </span>
                                )}
                              </div>
                              
                              {/* 品詞 */}
                              <div className="flex items-center gap-2">
                                <span className="bg-[#FFE1B5] text-[#1E1E1E] text-xs px-2 py-1 rounded-md font-medium">
                                  {posToJapanese[word.partOfSpeech] || word.partOfSpeech}
                                </span>
                              </div>
                              
                              {/* 意味 */}
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700">英語:</span>
                                  <span className="ml-2">{word.meaning}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700">日本語:</span>
                                  <span className="ml-2">{word.japaneseMeaning}</span>
                                </div>
                              </div>
                              
                              {/* 例文 */}
                              {(word.sentence || word.sentenceJapanese) && (
                                <div className="space-y-1">
                                  <div className="text-sm bg-gray-50 p-2 rounded border-l-4 border-[#FFB86C]">
                                    {word.sentence && (
                                      <div className="italic text-gray-800">{word.sentence}</div>
                                    )}
                                    {word.sentenceJapanese && (
                                      <div className="text-gray-600 mt-1">{word.sentenceJapanese}</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => router.push('/notebook')}
                      className="bg-[#FFB86C] text-[#1E1E1E] px-4 py-2 rounded text-sm hover:bg-[#e5a561] transition-colors"
                    >
                      マイノートを見る
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleLevelChange}
                    className="flex-1 bg-[#FFB86C] text-[#1E1E1E] px-4 py-2 rounded-md font-medium hover:bg-[#e5a561] transition-colors"
                  >
                    レベル変更
                  </button>
                  
                  <button
                    onClick={() => router.push('/choose')}
                    className="flex-1 bg-[#FFE1B5] text-[#1E1E1E] px-4 py-2 rounded-md font-medium hover:bg-[#f0d1a0] transition-colors"
                  >
                    他のものを読む
                  </button>
                </div>
                
                {/* レベル選択UI */}
                {showLevelSelector && (
                  <div className="bg-[#FFF9F4] border border-[#FFE1B5] p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-center">語彙レベルを選択</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleRegenerateWithLevel(level)}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            selectedLevel === level 
                              ? 'bg-[#FFB86C] text-[#1E1E1E]' 
                              : 'bg-white text-[#1E1E1E] hover:bg-[#FFF9F4] border border-[#FFE1B5]'
                          }`}
                        >
                          Lv.{level}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      選択したレベルで同じ内容を再生成します
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* メール通知 */}
      <MailNotification show={showMailNotification} />
    </main>
  );
}