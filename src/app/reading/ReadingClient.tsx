'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useStory } from '@/lib/store/story';
import MailNotification from '@/components/MailNotification';
import TTSButton from '@/components/TTSButton';

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
  searchParams: {
    mode?: string;
    genre?: string;
    tone?: string;
    feeling?: string;
    level?: string;
    topic?: string;
    theme?: string;
    emotion?: string;
    style?: string;
  };
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

  // 新しいコンテンツを生成する関数
  const generateNewContent = async () => {
    try {
      setLoading(true);
      console.log('🚀 Generating new content with params:', searchParams);

      const currentLevel = parseInt(localStorage.getItem('level') || localStorage.getItem('fixedLevel') || '3', 10);
      
      const requestBody = {
        level: currentLevel,
        mode: mode,
        ...searchParams
      };

      console.log('📡 API request body:', requestBody);

      const response = await fetch('/api/generate-reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API response received:', data);

      if (data.english && data.japanese) {
        // 配列形式のレスポンスに対応
        const englishText = Array.isArray(data.english) ? data.english.join('\n\n') : data.english;
        const japaneseText = Array.isArray(data.japanese) ? data.japanese.join('\n\n') : data.japanese;
        
        setEnglish(englishText);
        setJapanese(japaneseText);
        setStoryTitle(data.title || displayTitle);
        
        // 段落に分割（配列形式の場合はそのまま使用）
        const englishParagraphs = Array.isArray(data.english) ? data.english : englishText.split('\n\n').filter((p: string) => p.trim());
        const japaneseParagraphs = Array.isArray(data.japanese) ? data.japanese : japaneseText.split('\n\n').filter((p: string) => p.trim());
        
        setEnglishParagraphs(englishParagraphs);
        setJapaneseParagraphs(japaneseParagraphs);
        
        // 語数を計算
        const words = englishText.trim().split(/\s+/).filter((w: string) => w.length > 0);
        setWordCount(words.length);

        console.log('✅ Content successfully updated:', {
          title: data.title,
          englishLength: data.english.length,
          japaneseLength: data.japanese.length,
          wordCount: words.length,
          paragraphs: englishParagraphs.length
        });
      }
    } catch (error) {
      console.error('❌ Error generating content:', error);
      // エラーの場合は初期データをそのまま使用
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にテストログ出力とデータ統一
  React.useEffect(() => {
    console.log('🚀 ReadingClient mounted!');
    console.log('📋 English paragraphs:', englishParagraphs);
    console.log('📊 Word count:', wordCount);
    
    // 初期化時に正しい生成レベルをselectedLevelに設定
    const currentLevel = parseInt(localStorage.getItem('level') || localStorage.getItem('fixedLevel') || '3', 10);
    setSelectedLevel(currentLevel);
    console.log('📊 Initial selectedLevel set to:', currentLevel);
    
    // URLパラメータをチェックしてnotebookからの戻りかどうかを判定
    const urlParams = new URLSearchParams(window.location.search);
    const fromNotebook = urlParams.get('fromNotebook') === 'true' || urlParams.get('from') === 'notebook';
    console.log('📚 From notebook?', fromNotebook);
    console.log('📚 URL params:', {
      fromNotebook: urlParams.get('fromNotebook'),
      from: urlParams.get('from'),
      allParams: Object.fromEntries(urlParams.entries())
    });

    // notebookから戻っていない場合は新しいコンテンツを生成
    if (!fromNotebook && !isClientRestored) {
      generateNewContent();
    }
    
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
  }, [englishParagraphs, wordCount]);

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
      
      // ユーザーの生成レベル（1-5）を取得
      const userVocabLevel = parseInt(localStorage.getItem('level') || localStorage.getItem('fixedLevel') || '3', 10);
      console.log('📊 ReadingClient: 生成レベル使用:', userVocabLevel);
      
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

  // 日本語翻訳表示/非表示切り替え
  const handleShowJapanese = async () => {
    // 既に日本語が表示されている場合は非表示にする
    if (showJapanese) {
      setShowJapanese(false);
      return;
    }
    
    // 日本語翻訳が既にある場合は表示するだけ
    if (japanese) {
      setShowJapanese(true);
      return;
    }
    
    // 日本語翻訳がない場合は取得してから表示
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
          currentLevel: selectedLevel,
          title: storyTitle || displayTitle
        })
      });
      
      console.log('🔍 Level conversion response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Level conversion response data:', data);
        
        if (data.rewrittenText) {
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
          
          // 現在のレベルを更新
          setSelectedLevel(newLevel);
          
          // localStorageの生成レベルも更新
          localStorage.setItem('level', newLevel.toString());
          localStorage.setItem('fixedLevel', newLevel.toString());
          console.log('📊 localStorage updated: level =', newLevel);
          
          // 読書状態をリセット
          setIsReadingStarted(false);
          setStartTime(null);
          setEndTime(null);
          setWpm(null);
          setSessionWords([]);
          
          console.log('✅ レベル変換完了:', { newLevel, newWordCount: words.length, selectedLevel: newLevel });
        } else {
          console.error('❌ rewrittenText not found in response:', data);
          alert('レベル変換に失敗しました。もう一度お試しください。');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ レベル変換エラー:', response.status, errorData);
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
            className="clickable-word cursor-pointer hover:bg-yellow-200/50 transition-colors duration-200"
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-page-bg p-4">
      {/* ページタイトル */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-text-primary">
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
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">読書を開始しますか？</h2>
            <p className="mb-4 text-gray-600">語数: {wordCount}語</p>
            
            <button
              onClick={handleStartReading}
              className="mb-4 rounded-md bg-primary-active px-6 py-3 font-bold text-text-primary transition-colors hover:bg-[#e5a561]"
            >
              読み始める
            </button>
            
            {/* TTS Button for full content */}
            <div>
              <TTSButton
                text={english}
                contentId="reading-full-content"
                variant="secondary"
                className="px-4 py-2"
              />
            </div>
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
                    className="mb-3 text-base leading-relaxed text-text-primary"
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
                    <div className="rounded-lg border border-[#FFE1B5] bg-page-bg p-4">
                      <p className="text-base italic text-text-primary">
                        {japaneseParagraphs[index]}
                      </p>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              {/* 全体音声再生ボタン */}
              <TTSButton
                text={english}
                contentId="reading-full-content"
                variant="secondary"
                className="px-4 py-2"
              />
              
              <button
                onClick={handleShowJapanese}
                className="rounded-md bg-primary-active px-4 py-2 font-bold text-text-primary transition-colors hover:bg-[#e5a561]"
              >
                {showJapanese ? '日本語を隠す' : '日本語を表示'}
              </button>
              
              {!endTime && (
                <button
                  onClick={handleCompleteReading}
                  className="rounded-md bg-[#FFE1B5] px-4 py-2 font-bold text-text-primary transition-colors hover:bg-[#f0d1a0]"
                >
                  読書完了
                </button>
              )}
            </div>
          </div>


          {/* 読書完了後の表示 */}
          {endTime && (
            <div className="rounded-lg border border-[#FFE1B5] bg-page-bg p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-text-primary">読書完了！</h3>
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3">
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
                    Lv.{selectedLevel}
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
                <div className="mb-4 rounded border border-[#C9A86C] bg-page-bg p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-text-primary">今日のマイノート</h3>
                  </div>
                  
                  <p className="mb-3 text-sm text-text-primary">
                    クリックした単語: {sessionWords.length}個
                  </p>
                  
                  <div className="mb-4 space-y-3">
                    {sessionWords.map((word, index) => (
                      <div key={index} className="rounded-lg border border-[#C9A86C] bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="space-y-2">
                              {/* 見出し語 */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xl font-bold text-text-primary">{word.word}</span>
                                {word.originalForm && word.originalForm !== word.word && (
                                  <span className="text-lg font-semibold text-gray-600">
                                    {word.originalForm}
                                  </span>
                                )}
                              </div>
                              
                              {/* 品詞 */}
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-[#FFE1B5] px-2 py-1 text-xs font-medium text-text-primary">
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
                                  <div className="rounded border-l-4 border-primary-active bg-gray-50 p-2 text-sm">
                                    {word.sentence && (
                                      <div className="italic text-gray-800">{word.sentence}</div>
                                    )}
                                    {word.sentenceJapanese && (
                                      <div className="mt-1 text-gray-600">{word.sentenceJapanese}</div>
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
                      className="rounded bg-primary-active px-4 py-2 text-sm text-text-primary transition-colors hover:bg-[#e5a561]"
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
                    className="flex-1 rounded-md bg-primary-active px-4 py-2 font-medium text-text-primary transition-colors hover:bg-[#e5a561]"
                  >
                    レベル変更
                  </button>
                  
                  <button
                    onClick={() => router.push('/choose')}
                    className="flex-1 rounded-md bg-[#FFE1B5] px-4 py-2 font-medium text-text-primary transition-colors hover:bg-[#f0d1a0]"
                  >
                    他のものを読む
                  </button>
                </div>
                
                {/* レベル選択UI */}
                {showLevelSelector && (
                  <div className="rounded-lg border border-[#FFE1B5] bg-page-bg p-4">
                    <h4 className="mb-3 text-center font-medium">語彙レベルを選択</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleRegenerateWithLevel(level)}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            selectedLevel === level 
                              ? 'bg-primary-active text-text-primary' 
                              : 'border border-[#FFE1B5] bg-white text-text-primary hover:bg-page-bg'
                          }`}
                        >
                          Lv.{level}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-center text-xs text-gray-600">
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