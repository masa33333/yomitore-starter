'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useReward } from '@/context/RewardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useStory } from '@/lib/store/story';
import { completeReading, getUserProgress } from '@/lib/readingProgress';
import type { ReadingCompletionData } from '@/types/stampCard';
import { notifyNewStampCardUpdate } from '@/components/NewStampCard';
import NewStampCard from '@/components/NewStampCard';
import RewardDisplay from '@/components/RewardDisplay';
import RewardEarnedFlash from '@/components/RewardEarnedFlash';
import RewardFlashManager from '@/components/RewardFlashManager';
import TTSButton from '@/components/TTSButton';
import CatLoader from '@/components/CatLoader';
import StampFlash from '@/components/StampFlash';
import { BookmarkDialog } from '@/components/BookmarkDialog';
import { ResumeDialog } from '@/components/ResumeDialog';
import { analyzeVocabulary } from '@/constants/ngslData';
import { playStampFanfare, playCardCompleteFanfare } from '@/lib/stampSounds';
import { updateTodayRecord } from '@/lib/calendarData';
import { shouldSendMail, shouldSendLetter } from '@/utils/rewardRules';
import { queueMessage } from '@/utils/messageLoader';

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
    slug?: string;
    resume?: string;
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
  const { addWordsToReward, reward } = useReward();
  const { t } = useTranslation();
  const { story, updateStory } = useStory();

  // タイトル表示用のテーマ/ジャンル取得
  const displayTitle = initialData?.title 
    ? initialData.title  // プリセットストーリーのタイトルを優先
    : mode === 'story' 
      ? (searchParams.genre || 'ストーリー')
      : (searchParams.topic || searchParams.theme || '読み物');

  // notebookからの戻りかどうかを初期化時に判定
  const isFromNotebook = () => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('fromNotebook') === 'true' || urlParams.get('from') === 'notebook';
  };

  // 基本状態
  const [loading, setLoading] = useState(false);
  
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readingTextSize') as 'small' | 'medium' | 'large';
      return saved || 'small'; // 現状を小とする
    }
    return 'small';
  });
  const [english, setEnglish] = useState<string>(() => {
    // notebookから戻った場合はlocalStorageから復元、そうでなければinitialDataを使用
    if (isFromNotebook() && typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentReadingEnglish');
      return saved || '';
    }
    return initialData?.story || '';
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
    if (typeof window !== 'undefined') {
      // Check if this is a resume mode
      const urlParams = new URLSearchParams(window.location.search);
      const resumeMode = urlParams.get('resume') === '1';
      
      console.log('🔄 isReadingStarted INITIALIZATION:', {
        url: window.location.href,
        resumeParam: urlParams.get('resume'),
        resumeMode: resumeMode,
        willSetReadingStarted: resumeMode
      });
      
      // If resume mode, reading should be started
      if (resumeMode) {
        console.log('🔄 Resume mode detected - setting isReadingStarted to true');
        return true;
      }
      
      // Check saved state for notebook returns
      if (isFromNotebook()) {
        const saved = localStorage.getItem('currentReadingStarted');
        console.log('🔄 Notebook return detected - saved state:', saved);
        return saved === 'true';
      }
    }
    console.log('🔄 Default isReadingStarted: false');
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
  
  // 読書開始時の総語数を記録（スタンプ進捗表示用）
  const [readingStartWordsRead, setReadingStartWordsRead] = useState<number | null>(null);
  
  // 単語処理状態
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loadingWordInfo, setLoadingWordInfo] = useState(false);
  
  // ブックマーク機能用ステート
  const [bookmarkTokenIndex, setBookmarkTokenIndex] = useState<number | null>(null);
  // 読書開始位置（再開時は前回のブックマーク位置）
  const [readingStartTokenIndex, setReadingStartTokenIndex] = useState<number>(0);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const [bookmarkDialog, setBookmarkDialog] = useState<{
    isOpen: boolean;
    word: string;
    tokenIndex: number;
    conflictLevel?: number;
  }>({
    isOpen: false,
    word: '',
    tokenIndex: 0
  });

  // ブックマーク統計表示用の状態
  const [bookmarkStats, setBookmarkStats] = useState<{
    isVisible: boolean;
    element: HTMLElement | null;
    stats: {
      wordsRead: number;
      readingTime: string;
      wpm: number;
    } | null;
  }>({
    isVisible: false,
    element: null,
    stats: null
  });

  // ページ読み込み時に統計状態をクリア
  useEffect(() => {
    setBookmarkStats({
      isVisible: false,
      element: null,
      stats: null
    });
    // 長押しフラグもリセット
    isLongPressRef.current = false;
    // タイマーもクリア
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    console.log('🔄 ブックマーク統計状態初期化');
  }, []);
  const [isResumeMode, setIsResumeMode] = useState(() => {
    // 初期化時にURL パラメータをチェック
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const resumeMode = urlParams.get('resume') === '1';
      console.log('🔧 isResumeMode 初期化:', resumeMode ? 'true (resume detected)' : 'false');
      return resumeMode;
    }
    return false;
  });
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  
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
  const [showStampFlash, setShowStampFlash] = useState(false);
  const [earnedStampsCount, setEarnedStampsCount] = useState(1);
  
  // レベル変更状態
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(3);
  const [actualLevel, setActualLevel] = useState<number | null>(null);

  console.log('🎨 ReadingClient rendered with:', {
    mode,
    hasInitialData: !!initialData,
    title: storyTitle,
    englishLength: english.length,
    paragraphCount: englishParagraphs.length,
    isReadingStarted: isReadingStarted,
    isResumeMode: isResumeMode,
    wordCount,
    firstParagraphPreview: englishParagraphs[0]?.substring(0, 100) + '...'
  });
  
  // 📊 CRITICAL DEBUG: Check rendering condition
  console.log('🚨 RENDERING CONDITION CHECK:', {
    'isReadingStarted': isReadingStarted,
    'willShowText': isReadingStarted,
    'willShowStartButton': !isReadingStarted,
    'englishParagraphs.length': englishParagraphs.length
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
    console.log('📋 Initial data:', initialData);
    console.log('📋 English paragraphs:', englishParagraphs);
    console.log('📊 Word count:', wordCount);
    
    // 🔥 EMERGENCY SCROLL FIX: Force enable scrolling immediately on page load
    console.log('🔥 EMERGENCY: Enabling scrolling immediately on page load');
    const forceEnableScrolling = () => {
      // Remove any blocking overflow styles
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.documentElement.style.pointerEvents = 'auto';
      
      // Force with !important
      document.body.style.setProperty('overflow-y', 'auto', 'important');
      document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
      
      console.log('✅ Emergency scrolling enablement completed');
    };
    
    // Execute immediately
    forceEnableScrolling();
    
    // Execute again after a short delay to override any conflicting styles
    setTimeout(forceEnableScrolling, 100);
    setTimeout(forceEnableScrolling, 500);
    setTimeout(forceEnableScrolling, 1000);
    
    // 初期化時に正しい生成レベルをselectedLevelに設定
    const currentLevel = parseInt(localStorage.getItem('level') || localStorage.getItem('fixedLevel') || '3', 10);
    setSelectedLevel(currentLevel);
    console.log('📊 Initial selectedLevel set to:', currentLevel);
    
    // URLパラメータをチェックしてnotebookからの戻りかどうかを判定
    const urlParams = new URLSearchParams(window.location.search);
    const fromNotebook = urlParams.get('fromNotebook') === 'true' || urlParams.get('from') === 'notebook';
    const resumeMode = urlParams.get('resume') === '1';
    console.log('📚 From notebook?', fromNotebook);
    console.log('📖 Resume mode?', resumeMode);
    console.log('📚 URL params:', {
      fromNotebook: urlParams.get('fromNotebook'),
      from: urlParams.get('from'),
      resume: urlParams.get('resume'),
      allParams: Object.fromEntries(urlParams.entries())
    });

    // ブックマーク再開モードの処理
    console.log('🔍 CHECKING RESUME MODE:', { resumeMode });
    
    if (resumeMode) {
      console.log('📖 Resume mode detected, setting up bookmark restoration...');
      
      // CRITICAL FIX: Force isReadingStarted to true for resume mode
      console.log('🔥 FORCING isReadingStarted to true for resume mode');
      setIsReadingStarted(true);
      
      setIsResumeMode(true);
      const bookmarkData = localStorage.getItem('reading_bookmark');
      if (bookmarkData) {
        try {
          const bookmark = JSON.parse(bookmarkData);
          const currentSlug = searchParams.slug || `${searchParams.mode || 'default'}-${searchParams.genre || 'general'}-${searchParams.topic || 'default'}`;
          console.log('📖 読み込んだブックマークデータ:', bookmarkData);
          console.log('📖 パースされたブックマーク:', bookmark);
          console.log('📖 現在のslug:', currentSlug);
          console.log('📖 ブックマークのslug:', bookmark.slug);
          console.log('📖 tokenIndex:', bookmark.tokenIndex);
          
          // ブックマーク位置保存（後でスクロールに使用）
          setBookmarkTokenIndex(bookmark.tokenIndex);
          // 読書開始位置をブックマーク位置に設定（語数カウント用）
          setReadingStartTokenIndex(bookmark.tokenIndex);
          console.log('📊 読書開始位置設定:', bookmark.tokenIndex);
          
          // ダイアログを即座に表示（スクロールは再開時に実行）
          setShowResumeDialog(true);
        } catch (error) {
          console.error('❌ Error parsing bookmark:', error);
        }
      } else {
        console.log('❌ No bookmark data found in localStorage');
      }
    } else if (resumeMode) {
      console.log('🔄 Resume mode detected but bookmark already processed (sessionStorage flag exists)');
    }

    // notebookから戻っていない場合、かつプリセットストーリーでない場合のみ新しいコンテンツを生成
    if (!fromNotebook && !isClientRestored && !initialData) {
      console.log('🔧 No initial data, generating new content...');
      generateNewContent();
    } else if (initialData) {
      console.log('📖 Initial data exists (preset story), skipping generation');
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

  // URLパラメータの変更を監視してisResumeModeを更新
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const resumeMode = urlParams.get('resume') === '1';
      setIsResumeMode(resumeMode);
      console.log('🔄 URL changed - isResumeMode updated to:', resumeMode);
    }
  }, [searchParams]);

  // ページ読み込み時に即座にスクロールを確保
  useEffect(() => {
    const ensureScrollingImmediately = () => {
      // 最強レベルのスクロール確保 - cssTextでの完全上書き
      const bodyStyle = `
        overflow: visible !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        pointer-events: auto !important;
        position: relative !important;
        height: auto !important;
        max-height: none !important;
        min-height: 100vh !important;
      `;
      
      document.body.setAttribute('style', bodyStyle);
      document.documentElement.setAttribute('style', bodyStyle);
      
      // 全ての要素からスクロールを阻害するクラスを除去
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        el.classList.remove('blur-reading', 'overflow-hidden', 'h-screen', 'max-h-screen', 'min-h-screen');
        const style = el as HTMLElement;
        if (style.style.overflow === 'hidden') {
          style.style.overflow = 'visible';
        }
        if (style.style.overflowY === 'hidden') {
          style.style.overflowY = 'auto';
        }
        if (style.style.height === '100vh' || style.style.height === '100%') {
          style.style.height = 'auto';
        }
      });
      
      // layout.tsxのmainタグも修正
      const mainElements = document.querySelectorAll('main');
      mainElements.forEach(el => {
        const element = el as HTMLElement;
        element.classList.remove('min-h-screen');
        element.style.setProperty('height', 'auto', 'important');
        element.style.setProperty('max-height', 'none', 'important');
        element.style.setProperty('min-height', 'auto', 'important');
      });
      
      console.log('✅ setAttribute方式スクロール確保完了 - height:', document.body.scrollHeight, 'client:', document.body.clientHeight);
    };
    
    ensureScrollingImmediately();
    
    // 複数回実行で確実性を高める
    setTimeout(ensureScrollingImmediately, 100);
    setTimeout(ensureScrollingImmediately, 500);
    setTimeout(ensureScrollingImmediately, 1000);
    setTimeout(ensureScrollingImmediately, 2000);
    setTimeout(ensureScrollingImmediately, 3000);
  }, []);

  // 英語テキストが変更されたら語彙レベルを自動判定
  useEffect(() => {
    if (english && english.trim().length > 50) { // 50文字以上の場合のみ判定
      const detectedLevel = analyzeTextLevel(english);
      setActualLevel(detectedLevel);
      console.log('📊 Auto-detected vocabulary level:', detectedLevel, 'Selected level:', selectedLevel);
    }
  }, [english, selectedLevel]);

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
    
    // 読書開始時にresumeモード解除＆スクロール確保
    setIsResumeMode(false);
    setShowResumeDialog(false);
    
    // 核兵器級スクロール有効化（予防措置）
    const ensureScrolling = () => {
      // body/htmlの強制設定
      [document.body, document.documentElement].forEach(el => {
        el.style.cssText = `
          overflow: visible !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          pointer-events: auto !important;
          position: relative !important;
          height: auto !important;
          max-height: none !important;
          min-height: 100vh !important;
        `;
      });
      
      // 全要素のスクロール阻害を解除
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        el.classList.remove('blur-reading', 'overflow-hidden', 'h-screen', 'max-h-screen');
        const style = el as HTMLElement;
        if (style.style.overflow === 'hidden') {
          style.style.overflow = 'visible';
        }
      });
      
      console.log('🔧 読書開始時核兵器級スクロール確保 - scrollHeight:', document.body.scrollHeight);
    };
    
    ensureScrolling();
    // 3回実行で確実性を高める
    setTimeout(ensureScrolling, 100);
    setTimeout(ensureScrolling, 500);
    
    // 読書開始時の総語数を記録（スタンプ進捗表示用）
    const progress = getUserProgress();
    const currentWordsRead = progress.totalWords;
    setReadingStartWordsRead(currentWordsRead);
    
    console.log('📊 読書開始時の語数記録:', {
      progressTotalWords: progress.totalWords,
      legacyTotalWords: parseInt(localStorage.getItem('totalWordsRead') || '0', 10),
      currentWordsRead
    });
    
    console.log('📖 読書開始 + 超強力スクロール確保', { readingStartWordsRead: currentWordsRead });
    
    // 読書状態をlocalStorageに保存
    saveCurrentReadingState();
  };

  // 読書完了処理（スタンプカード統合版）
  const handleCompleteReading = () => {
    if (!startTime) return;
    
    const endTimeValue = Date.now();
    setEndTime(endTimeValue);
    
    const duration = endTimeValue - startTime; // ミリ秒
    const timeInMinutes = duration / 60000;
    
    // 読書開始位置から最後までの実際の語数を計算
    const allTokens = english.split(/(\s+|[.!?;:,\-\u2013\u2014()"])/);
    const complexActualWordsRead = allTokens.slice(readingStartTokenIndex).filter(token => /^[A-Za-z-]+$/.test(token) && token !== '-').length;
    
    // 🔧 修正: wordCount を使用（一貫性のため）
    const actualWordsRead = wordCount;
    const calculatedWpm = Math.round(actualWordsRead / timeInMinutes);
    
    // Debug logging removed - problem resolved
    setWpm(calculatedWpm);
    
    console.log('✅ 読書完了:', {
      totalWordCount: wordCount,
      actualWordsRead: actualWordsRead,
      readingStartIndex: readingStartTokenIndex,
      timeInMinutes: timeInMinutes.toFixed(1),
      wpm: calculatedWpm,
      duration
    });
    
    // カード完成判定のための事前計算
    const userProgressData = localStorage.getItem('userProgress');
    const currentTotal = userProgressData ? JSON.parse(userProgressData).totalWords : 0;
    const newTotal = currentTotal + wordCount;
    const previousStampCount = Math.floor(currentTotal / 100);
    const newStampCount = Math.floor(newTotal / 100);
    const stampsEarned = newStampCount - previousStampCount;
    
    // カード完成チェック（20個に到達したかどうか）
    const cardsBeforeReading = Math.floor(previousStampCount / 20);
    const cardsAfterReading = Math.floor(newStampCount / 20);
    const newCardsCompleted = cardsAfterReading - cardsBeforeReading;
    
    // カード完成時はスタンプ演出をスキップ、通常時は表示
    if (newCardsCompleted === 0 && stampsEarned > 0) {
      console.log(`📮 通常スタンプ演出を表示（ReadingClient）: ${stampsEarned}個`);
      setEarnedStampsCount(stampsEarned);
      setShowStampFlash(true);
    } else if (newCardsCompleted > 0) {
      console.log('🎊 カード完成時のため、ReadingClientでスタンプ演出をスキップ');
      // スタンプ演出はスキップ
    }
    
    // スタンプカード統合システムで進捗更新
    const currentLevel = parseInt(localStorage.getItem('level') || localStorage.getItem('fixedLevel') || '3', 10);
    const completionData: ReadingCompletionData = {
      wordCount: actualWordsRead, // 実際に読んだ語数を使用
      duration: duration,
      wpm: calculatedWpm,
      level: currentLevel,
      title: storyTitle || initialData?.title || displayTitle || '読み物',
      contentType: 'reading'
    };
    
    // Debug logging removed - problem resolved
    
    try {
      // Debug logging removed - problem resolved
      
      // Debug logging removed - problem resolved
      
      const updatedProgress = completeReading(completionData);
      console.log('🎆 スタンプカード更新完了:', updatedProgress);
      
      // カレンダーデータを更新
      updateTodayRecord(
        1, // 1話読了
        wordCount,
        endTime && startTime ? (endTime - startTime) : 0,
        wpm || 0,
        selectedLevel
      );
      console.log('📅 カレンダーデータ更新完了');
      
      // スタンプ獲得時のファンファーレ再生
      if (stampsEarned > 0) {
        setTimeout(() => {
          playStampFanfare(stampsEarned);
          console.log(`🎵 ${stampsEarned}個スタンプファンファーレ再生`);
        }, 500); // スタンプフラッシュ後に再生
      }
      
      // 20個完成時の特別ファンファーレ + コイン獲得
      if (updatedProgress.currentCardStamps === 0 && updatedProgress.totalStamps > 0 && stampsEarned > 0) {
        setTimeout(() => {
          playCardCompleteFanfare();
          console.log('🎊 カード完成ファンファーレ再生');
          
          // RewardSystemにコイン獲得演出追加（20スタンプ = 2000語相当）
          addWordsToReward(2000);
          console.log('🪙 スタンプカード完成でコイン獲得！');
        }, 1500); // スタンプファンファーレ後に再生
      }
      
      // 新しいスタンプカードに更新通知
      notifyNewStampCardUpdate();
      
      // RewardSystemに語数を追加 - 削除（重複加算を防ぐため）
      // console.log('🚨 DEBUG: Adding words to RewardContext:', actualWordsRead);
      // console.log('🚨 DEBUG: Current reward state before:', reward);
      // addWordsToReward(actualWordsRead);  // ← readingProgress.ts で既に処理済み
      // console.log('🚨 DEBUG: Current reward state after:', reward);
      
      // 2回目の読了完了時に一通目の手紙を送信（既存ロジック維持）
      if (updatedProgress.totalStamps === 2) {
        sendFirstLetter();
      }
      
      // 🔥 新メール・手紙システム: 語数しきい値チェック
      const totalWordsAfterReading = updatedProgress.totalWords;
      
      // 🔍 DEBUG: 詳細ログ開始
      console.log('=== MAIL/LETTER DEBUG START ===');
      console.log(`📊 Current totalWordsAfterReading: ${totalWordsAfterReading}`);
      
      // 🧪 Test known values to verify functions work
      console.log('🧪 Testing shouldSendMail with known values:');
      console.log(`  shouldSendMail(300): ${shouldSendMail(300)}`);
      console.log(`  shouldSendMail(5300): ${shouldSendMail(5300)}`);
      console.log(`  shouldSendMail(10300): ${shouldSendMail(10300)}`);
      
      console.log('🧪 Testing shouldSendLetter with known values:');
      console.log(`  shouldSendLetter(10300): ${shouldSendLetter(10300)}`);
      console.log(`  shouldSendLetter(20300): ${shouldSendLetter(20300)}`);
      console.log(`  shouldSendLetter(40300): ${shouldSendLetter(40300)}`);
      
      // 🎯 Actual checks with current word count
      const shouldSendMailResult = shouldSendMail(totalWordsAfterReading);
      const shouldSendLetterResult = shouldSendLetter(totalWordsAfterReading);
      
      console.log('🎯 Actual results for current word count:');
      console.log(`  shouldSendMail(${totalWordsAfterReading}): ${shouldSendMailResult}`);
      console.log(`  shouldSendLetter(${totalWordsAfterReading}): ${shouldSendLetterResult}`);
      
      // メール送信チェック（300語、5300語、10300語、15300語...）
      if (shouldSendMailResult) {
        console.log(`📬 ✅ メール送信トリガー: ${totalWordsAfterReading}語 - queueMessage('mail') を呼び出し`);
        queueMessage('mail', totalWordsAfterReading);
        console.log(`📬 ✅ queueMessage('mail', ${totalWordsAfterReading}) 完了`);
      } else {
        console.log(`📬 ❌ メール送信なし: ${totalWordsAfterReading}語 - しきい値に達していません`);
      }
      
      // 手紙送信チェック（20300語、40300語、60300語...）
      if (shouldSendLetterResult) {
        console.log(`📮 ✅ 手紙送信トリガー: ${totalWordsAfterReading}語 - queueMessage('letter') を呼び出し`);
        queueMessage('letter', totalWordsAfterReading);
        console.log(`📮 ✅ queueMessage('letter', ${totalWordsAfterReading}) 完了`);
      } else {
        console.log(`📮 ❌ 手紙送信なし: ${totalWordsAfterReading}語 - しきい値に達していません`);
      }
      
      console.log('=== MAIL/LETTER DEBUG END ===');
      
    } catch (error) {
      console.error('❌ スタンプカード更新エラー:', error);
      
      // フォールバック: 既存システムで更新
      const completedReadings = parseInt(localStorage.getItem('completedReadings') || '0', 10);
      const newCompletedReadings = completedReadings + 1;
      localStorage.setItem('completedReadings', newCompletedReadings.toString());
      
      if (newCompletedReadings === 2) {
        sendFirstLetter();
      }
    }
    
    // 読書完了状態を保存
    setTimeout(() => {
      saveCurrentReadingState();
    }, 100);
    
    // 読書分析結果が見えるように自動スクロール
    setTimeout(() => {
      console.log('📜 読書分析結果表示エリアに自動スクロール');
      // 「日本語を表示」ボタンが画面の一番上に見える位置にスクロール
      const scrollTarget = document.documentElement.scrollHeight - window.innerHeight - 200;
      window.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
    }, 1000); // スタンプ演出後にスクロール
  };

  // 一通目の手紙を送信する関数
  const sendFirstLetter = async () => {
    try {
      console.log('📮 一通目の手紙を生成中...');
    console.log('🎆 スタンプカード統合: 初回手紙送信トリガー');
      
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
        
      } else {
        console.error('❌ 手紙生成エラー:', response.statusText);
      }
    } catch (error) {
      console.error('❌ 手紙送信エラー:', error);
    }
  };

  // 長押し処理（ブックマーク機能）
  const handleLongPress = (target: HTMLElement | string, tokenIndex?: number) => {
    let word: string;
    let actualTokenIndex: number;
    
    if (typeof target === 'string') {
      // デバッグボタンからの呼び出し
      word = target;
      actualTokenIndex = tokenIndex || 0;
    } else {
      // 通常の要素からの呼び出し
      actualTokenIndex = parseInt(target.dataset.idx || '0', 10);
      word = target.textContent || '';
    }
    
    console.log('🎯 handleLongPress実行開始:', {
      word,
      tokenIndex: actualTokenIndex,
      target: typeof target === 'string' ? 'debug call' : target.dataset.idx,
      classList: typeof target === 'string' ? 'debug call' : Array.from(target.classList)
    });
    
    // 長押しフラグを設定
    isLongPressRef.current = true;
    console.log('🔵 長押しフラグ設定: true');
    
    // 黄色ハイライトをクリア（単語クリック機能と競合回避）
    setHighlightedWord('');
    console.log('🟡 黄色ハイライトクリア');
    
    // ブックマーク作成時はオレンジでハイライト（要素の場合のみ、重複を防ぐ）
    if (typeof target !== 'string') {
      // 既にオレンジハイライトされていない場合のみ適用
      if (target.style.backgroundColor !== 'rgb(249, 115, 22)') {
        target.style.setProperty('background-color', '#f97316', 'important'); // orange-500
        target.style.setProperty('color', 'white', 'important');
        target.style.setProperty('padding', '2px 4px', 'important');
        target.style.setProperty('border-radius', '4px', 'important');
      }
    }
    console.log('🟠 長押し成功 - オレンジでハイライト:', word);
    
    
    // 現在の読み物を識別するためのslugを取得/生成
    const currentSlug = searchParams.slug || `${searchParams.mode || 'default'}-${searchParams.genre || 'general'}-${searchParams.topic || 'default'}`;
    
    // 既存のブックマークチェック
    const existingBookmark = localStorage.getItem('reading_bookmark');
    if (existingBookmark) {
      const bookmark = JSON.parse(existingBookmark);
      console.log('📖 既存ブックマーク確認:', { bookmark, currentSlug, selectedLevel });
      
      if (bookmark.slug === currentSlug) {
        if (bookmark.level !== selectedLevel) {
          // レベル競合確認ダイアログ表示
          console.log('⚠️ レベル競合検出:', bookmark.level, '→', selectedLevel);
          setBookmarkDialog({
            isOpen: true,
            word,
            tokenIndex: actualTokenIndex,
            conflictLevel: bookmark.level
          });
          return;
        } else {
          // 同じレベルの場合は上書き確認ダイアログ表示
          console.log('⚠️ 同レベル上書き確認:', actualTokenIndex);
          setBookmarkDialog({
            isOpen: true,
            word,
            tokenIndex: actualTokenIndex,
            conflictLevel: undefined // レベル競合なし
          });
          return;
        }
      }
    }
    
    // 中断確認ダイアログ表示
    console.log('💬 BookmarkDialog表示開始:', { word, tokenIndex: actualTokenIndex });
    console.log('💬 setBookmarkDialogを呼び出し中...');
    setBookmarkDialog({
      isOpen: true,
      word,
      tokenIndex: actualTokenIndex
    });
    console.log('💬 BookmarkDialog状態設定完了');
    
    // スクロール確保: ダイアログ表示時もスクロール可能にする
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    console.log('📜 ダイアログ表示時スクロール確保');
    
    // デバッグ: 状態が正しく設定されたかを確認
    setTimeout(() => {
      console.log('🔍 BookmarkDialog状態確認:', {
        isOpen: bookmarkDialog.isOpen,
        word: bookmarkDialog.word,
        tokenIndex: bookmarkDialog.tokenIndex
      });
    }, 100);
  };

  // ブックマーク保存処理
  const saveBookmark = (tokenIndex: number, word: string, targetElement?: HTMLElement) => {
    console.log('🔥 saveBookmark関数実行開始:', { tokenIndex, word, startTime });
    
    if (!startTime) {
      console.log('⚠️ 読書開始時間がnull、現在時刻で設定');
      // 再開時など、startTimeが設定されていない場合は現在時刻を使用
      setStartTime(Date.now());
      // 少し待ってから再実行
      setTimeout(() => saveBookmark(tokenIndex, word), 100);
      return;
    }

    // 中断時の統計計算
    const currentTime = Date.now();
    const readingTime = currentTime - startTime;
    const timeInMinutes = readingTime / 60000;
    
    // レンダリング時と同じ方法で実際の英単語をカウント
    // globalTokenIndexRefを使って実際にレンダリングされた単語のみをカウント
    const actualWordsInRange = [];
    let tempIndex = 0;
    
    for (const paragraph of englishParagraphs) {
      const parts = paragraph.split(/(\*\*[^*]+\*\*)/);
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          continue; // 太字部分はスキップ
        }
        const words = part.split(/(\s+|[.!?;:,\-\u2013\u2014()"])/);
        for (const word of words) {
          if (/^[a-zA-Z-]+$/.test(word) && word !== '-') {
            if (tempIndex >= readingStartTokenIndex && tempIndex < tokenIndex) {
              actualWordsInRange.push(word);
            }
            tempIndex++;
          }
        }
      }
    }
    
    const wordsReadCount = actualWordsInRange.length;
    
    console.log('🔍 正確な語数カウント:', {
      readingStartIndex: readingStartTokenIndex,
      currentTokenIndex: tokenIndex,
      actualWordsInRange,
      wordsReadCount
    });
    const wpmCalculated = Math.round(wordsReadCount / timeInMinutes);
    
    // ブックマーク時は下部統計表示ではなく、インライン統計表示を使用
    // setEndTime(currentTime); // 下部統計表示を無効化
    setWpm(wpmCalculated);
    
    // 中断時は実際に読んだ語数を表示用に設定（元に戻さない）
    setWordCount(wordsReadCount);
    
    console.log('📊 ブックマーク時統計設定完了:', {
      endTime: currentTime,
      wpm: wpmCalculated,
      wordsRead: wordsReadCount,
      displayWordCount: wordsReadCount
    });

    // 長押しした要素の位置にブックマーク統計を表示
    const readingTimeStr = `${Math.floor(readingTime / 60000)}分${Math.floor((readingTime % 60000) / 1000)}秒`;
    console.log('📊 ブックマーク統計設定:', {
      targetElement,
      readingTimeStr,
      wordsReadCount,
      wpmCalculated
    });
    
    setBookmarkStats({
      isVisible: true,
      element: targetElement || null,
      stats: {
        wordsRead: wordsReadCount,
        readingTime: readingTimeStr,
        wpm: wpmCalculated
      }
    });
    
    console.log('📊 ブックマーク統計状態設定完了');
    
    // 統計表示時もスクロールを確保
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    console.log('📜 統計表示時スクロール確保');
    
    // 中断時の読書データを保存（ProgressServiceに保存）
    console.log('📊 中断時統計:', {
      wordsRead: wordsReadCount,
      totalWords: wordCount,
      timeInMinutes: timeInMinutes.toFixed(1),
      wpm: wpmCalculated,
      progress: `${Math.round((wordsReadCount / wordCount) * 100)}%`
    });

    // completeReading関数で中断時の統計を保存
    const completionData: ReadingCompletionData = {
      wordCount: wordsReadCount,
      duration: Math.round(readingTime / 1000), // 秒単位
      wpm: wpmCalculated,
      level: selectedLevel,
      title: displayTitle,
      contentType: mode === 'story' ? 'story' : 'reading',
      completionDate: new Date().toISOString()
    };

    try {
      completeReading(completionData);
      console.log('✅ 中断時統計をProgressServiceに保存完了');
    } catch (error) {
      console.error('❌ 中断時統計保存エラー:', error);
    }

    // ブックマークデータを保存
    const currentSlug = searchParams.slug || `${searchParams.mode || 'default'}-${searchParams.genre || 'general'}-${searchParams.topic || 'default'}`;
    console.log('📖 ブックマーク保存時のslug:', currentSlug);
    console.log('📖 ブックマーク保存時のsearchParams:', searchParams);
    // 古いブックマークを確認
    const oldBookmark = localStorage.getItem('reading_bookmark');
    console.log('📖 古いブックマーク:', oldBookmark);
    
    const bookmarkData = {
      slug: currentSlug,
      level: selectedLevel,
      tokenIndex: tokenIndex
    };
    
    localStorage.setItem('reading_bookmark', JSON.stringify(bookmarkData));
    
    // 保存されたかを確認
    const savedBookmark = localStorage.getItem('reading_bookmark');
    console.log('📖 新しいブックマーク保存完了:', bookmarkData);
    console.log('📖 実際に保存された内容:', savedBookmark);
    
    // 次回の読書開始位置を現在のブックマーク位置に更新
    setReadingStartTokenIndex(tokenIndex);
    console.log('📊 次回読書開始位置更新:', tokenIndex);
    
    // 読書状態を保存（次回復元用）
    saveCurrentReadingState();
    
    // ブックマーク完了メッセージを表示
    console.log('✅ ブックマーク保存完了 - 統計表示中...');
    
    // 注意: 自動遷移は行わず、ユーザーが「他のものを読む」ボタンを押すまで統計を表示
  };

  // 単語クリック処理
  const handleWordClick = async (word: string) => {
    console.log('🔍 handleWordClick called with:', word);
    console.log('📱 現在のsessionWords数:', sessionWords.length);
    
    // デバッグ: 特定の単語クリックでしおり情報を表示
    if (word.toLowerCase() === 'the' || word.toLowerCase() === 'and' || word.toLowerCase() === 'to') {
      const urlParams = new URLSearchParams(window.location.search);
      const resumeParam = urlParams.get('resume');
      const hasBookmark = !!localStorage.getItem('reading_bookmark');
      const bookmarkData = localStorage.getItem('reading_bookmark');
      
      return;
    }
    
    setSelectedWord(word);
    setLoadingWordInfo(true);
    
    // 単語をハイライト
    setHighlightedWord(word);
    console.log('🟡 ハイライト開始:', word);
    
    // 1秒後にハイライトを消す
    setTimeout(() => {
      setHighlightedWord('');
      console.log('⚫ ハイライト解除:', word);
      
      // 全ての単語要素から強制的にアクティブ状態を除去（モバイル対応）
      const allWords = document.querySelectorAll('.clickable-word');
      allWords.forEach(element => {
        const el = element as HTMLElement;
        // 全てのCSSクラスを除去
        el.classList.remove('active', 'bg-yellow-300', 'bg-yellow-200', 'bg-yellow-100', 'bg-purple-500', 'bg-purple-400', 'border-purple-500');
        // 全てのインラインスタイルを完全除去
        el.style.backgroundColor = '';
        el.style.background = '';
        el.style.border = '';
        el.style.borderColor = '';
        el.style.borderStyle = '';
        el.style.borderWidth = '';
        el.style.outline = '';
        el.style.outlineColor = '';
        el.style.boxShadow = '';
        el.style.color = '';
        // removePropertyで確実に削除
        ['background-color', 'background', 'border', 'border-color', 'border-style', 'border-width', 'outline', 'outline-color', 'box-shadow', 'color'].forEach(prop => {
          el.style.removeProperty(prop);
        });
        // cssTextを完全にクリーンアップ
        el.style.cssText = el.style.cssText
          .replace(/background[^;]*;?/g, '')
          .replace(/border[^;]*;?/g, '')
          .replace(/outline[^;]*;?/g, '')
          .replace(/box-shadow[^;]*;?/g, '')
          .replace(/color[^;]*;?/g, '');
      });
    }, 1000);
    
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
        
        setSessionWords(prev => {
          const updated = [...prev, newSessionWord];
          console.log('📝 sessionWords更新:', {
            before: prev.length,
            after: updated.length,
            newWord: newSessionWord.word,
            allWords: updated.map(w => w.word)
          });
          return updated;
        });
        
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
    
    // 保存済み翻訳をチェック
    const currentSlug = searchParams.slug || `${searchParams.mode || 'default'}-${searchParams.genre || 'general'}-${searchParams.topic || 'default'}`;
    const translationKey = `translation_${currentSlug}_${selectedLevel}`;
    const savedTranslation = localStorage.getItem(translationKey);
    
    if (savedTranslation) {
      try {
        const parsed = JSON.parse(savedTranslation);
        if (parsed.english === english && parsed.translation) {
          console.log('📚 保存済み翻訳を使用:', translationKey);
          setJapanese(parsed.translation);
          setJapaneseParagraphs(parsed.translation.split('\n\n'));
          setShowJapanese(true);
          return;
        }
      } catch (error) {
        console.error('❌ 保存済み翻訳の読み込みエラー:', error);
      }
    }
    
    // 日本語翻訳がない場合は取得してから表示
    try {
      console.log('🔄 翻訳リクエスト送信中:', {
        textLength: english.length,
        textPreview: english.substring(0, 200) + '...',
        isStory: mode === 'story',
        mode
      });
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: english,
          isStory: mode === 'story'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 翻訳レスポンス受信:', {
          translationLength: data.translation?.length || 0,
          translationPreview: data.translation?.substring(0, 200) + '...' || 'No translation',
          hasTranslation: !!data.translation
        });
        setJapanese(data.translation);
        setJapaneseParagraphs(data.translation.split('\n\n'));
        setShowJapanese(true);
        
        // 翻訳を永続保存（みんなで使えるように）
        try {
          const translationData = {
            english: english,
            translation: data.translation,
            timestamp: Date.now(),
            isStory: mode === 'story'
          };
          localStorage.setItem(translationKey, JSON.stringify(translationData));
          console.log('💾 翻訳を永続保存しました:', translationKey);
        } catch (error) {
          console.error('❌ 翻訳保存エラー:', error);
        }
        
        // 翻訳取得後に状態を保存
        setTimeout(() => {
          saveCurrentReadingState();
        }, 100);
      } else {
        console.error('❌ 翻訳APIレスポンスエラー:', {
          status: response.status,
          statusText: response.statusText
        });
        const errorData = await response.json().catch(() => null);
        if (errorData) {
          console.error('❌ エラー詳細:', errorData);
        }
      }
    } catch (error) {
      console.error('❌ 翻訳エラー:', error);
    }
  };

  // レベル変更処理
  // 語彙レベル自動判定関数
  const analyzeTextLevel = (text: string): number => {
    if (!text || text.trim().length === 0) return 3; // デフォルト
    
    const analysis = analyzeVocabulary(text);
    console.log('📊 Vocabulary Analysis:', analysis);
    
    // レベル判定ロジック（厳格）
    if (analysis.isLevel1Compliant) return 1;
    if (analysis.isLevel2Compliant) return 2;
    if (analysis.isLevel3Compliant) return 3;
    
    // Level 4/5の判定
    const { percentages } = analysis;
    const level4Plus = percentages[4] + percentages[5];
    const level3Minus = percentages[1] + percentages[2] + percentages[3];
    
    if (level4Plus >= 20) return 5; // Level 4-5語彙が20%以上
    if (level4Plus >= 10) return 4; // Level 4-5語彙が10%以上
    if (level3Minus >= 90) return 3; // Level 1-3語彙が90%以上
    
    return 4; // その他はLevel 4と判定
  };

  const handleLevelChange = () => {
    console.log('🔄 レベル変更ボタンがクリックされました');
    console.log('現在のshowLevelSelector:', showLevelSelector);
    const newShowState = !showLevelSelector;
    setShowLevelSelector(newShowState);
    console.log('変更後のshowLevelSelector:', newShowState);
    
    // レベル選択UIが表示される場合のみスクロール
    if (newShowState) {
      setTimeout(() => {
        // レベル選択UIまでスムーズにスクロール
        const levelSelectorElement = document.querySelector('[data-level-selector]');
        if (levelSelectorElement) {
          levelSelectorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100); // DOMの更新を待つため少し遅延
    }
  };

  // もう一度読む処理（読書状態をリセットして読み始める画面に戻る）
  const handleReadAgain = () => {
    console.log('🔄 もう一度読むボタンがクリックされました');
    
    // 読書状態をリセット
    setIsReadingStarted(false);
    setStartTime(null);
    setEndTime(null);
    setWpm(null);
    setSessionWords([]);
    setWordInfo(null);
    setSelectedWord('');
    setLoadingWordInfo(false);
    setHighlightedWord('');
    setShowJapanese(false);
    setShowLevelSelector(false);
    
    // 状態保存をクリア
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentReadingStarted');
      localStorage.removeItem('currentSessionWords');
      localStorage.removeItem('currentReadingState');
    }
    
    console.log('✅ 読書状態リセット完了 - 読み始める画面に戻りました');
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
        console.log('🔍 data.rewrittenText exists:', !!data.rewrittenText);
        console.log('🔍 data.rewrittenText type:', typeof data.rewrittenText);
        console.log('🔍 data.rewrittenText length:', data.rewrittenText?.length);
        console.log('🔍 data keys:', Object.keys(data));
        console.log('🔍 Full response structure:', JSON.stringify(data, null, 2));
        
        if (data.rewrittenText && data.rewrittenText.trim()) {
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
          
          // レベル変更時は読書開始時の語数は変更しない（スタンプ計算の整合性を保つため）
          // readingStartWordsRead は読書セッション開始時の累計語数を保持し続ける
          
          console.log('🔄 レベル変更時のスタンプ進捗リセット:', {
            oldWordCount: wordCount,
            newWordCount: words.length,
            readingStartWordsRead
          });
          
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
          console.error('❌ rewrittenText not found or empty in response:', data);
          console.error('❌ data.rewrittenText:', data.rewrittenText);
          console.error('❌ Available keys:', Object.keys(data));
          alert('レベル変換に失敗しました: レスポンスデータが不正です。もう一度お試しください。');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ レベル変換エラー:', response.status, errorData);
        const errorMessage = errorData.error || `API エラー (${response.status})`;
        alert(`レベル変換に失敗しました: ${errorMessage}\nもう一度お試しください。`);
      }
    } catch (error) {
      console.error('❌ レベル変換エラー:', error);
      alert('レベル変換に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // マウス長押し検知用のref
  const mouseDownTimeRef = useRef<number>(0);
  const mouseDownTargetRef = useRef<HTMLElement | null>(null);

  // タッチデバイス検出
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  // マウスダウンハンドラー（デスクトップ版長押し対応）
  const handleTextMouseDown = (e: React.MouseEvent<HTMLParagraphElement>) => {
    // タッチデバイスではマウスイベントを無視
    if (isTouchDevice()) {
      console.log('🚫 タッチデバイス検出 - マウスイベント無効化');
      return;
    }

    const target = e.target as HTMLElement;
    
    // 単語要素の場合のみ長押しタイマーを開始
    if (target.classList.contains('clickable-word')) {
      const word = target.textContent || '';
      
      console.log('🖱️ MouseDown発火:', {
        target: target.tagName,
        word: word,
        isClickableWord: target.classList.contains('clickable-word')
      });
      
      mouseDownTimeRef.current = Date.now();
      mouseDownTargetRef.current = target;
      isLongPressRef.current = false;
      
      console.log('🔵 マウス長押しタイマー開始:', word);
      
      // 長押しタイマー（600ms）
      longPressTimeoutRef.current = setTimeout(() => {
        console.log('⏰ マウス長押しタイマー発火:', word);
        if (!isLongPressRef.current && mouseDownTargetRef.current === target) {
          console.log('🔗 マウス長押し検出:', word);
          handleLongPress(target);
        }
      }, 600);
    }
  };

  // マウスアップハンドラー
  const handleTextMouseUp = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const target = e.target as HTMLElement;
    
    if (target.classList.contains('clickable-word')) {
      const mouseUpTime = Date.now();
      const pressDuration = mouseUpTime - mouseDownTimeRef.current;
      
      console.log('🖱️ MouseUp発火:', {
        target: target.tagName,
        word: target.textContent,
        duration: pressDuration,
        isLongPress: isLongPressRef.current
      });
      
      // 長押しタイマーをクリア
      if (longPressTimeoutRef.current) {
        console.log('🛑 マウス長押しタイマークリア');
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      
      
      // 長押しが実行された場合は、通常のクリック処理をスキップ
      if (isLongPressRef.current) {
        console.log('✅ 長押しが実行済み、通常クリック処理をスキップ');
        setTimeout(() => {
          isLongPressRef.current = false;
        }, 100);
        return;
      }
      
      // 短時間のクリック（600ms未満）の場合は単語意味表示
      if (pressDuration < 600 && mouseDownTargetRef.current === target) {
        const word = target.textContent || '';
        console.log('👆 短いクリック:', word, pressDuration + 'ms');
        handleWordClick(word);
      }
      
      // リセット
      mouseDownTimeRef.current = 0;
      mouseDownTargetRef.current = null;
    }
  };

  // 親要素のクリックハンドラー（Event Delegation）- 既存の単語クリック処理と競合回避
  const handleTextClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const target = e.target as HTMLElement;
    
    // 長押し処理が既に実行されている場合はスキップ
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // マウスダウン/アップで処理済みの場合はスキップ
    if (mouseDownTargetRef.current === target) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  // タッチ開始時間を記録するためのref
  const touchStartTimeRef = useRef<number>(0);
  const touchStartPositionRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  
  // 単語ハイライト状態を管理
  const [highlightedWord, setHighlightedWord] = useState<string>('');
  
  
  // ブックマーク機能用のグローバルトークンインデックス
  const globalTokenIndexRef = useRef<number>(0);

  // タッチ開始ハンドラー（長押し対応）
  const handleTextTouchStart = (e: React.TouchEvent<HTMLParagraphElement>) => {
    const target = e.target as HTMLElement;
    const touch = e.touches[0];
    
    console.log('🟢 TouchStart発火:', {
      target: target.tagName,
      classList: Array.from(target.classList),
      word: target.textContent,
      isClickableWord: target.classList.contains('clickable-word')
    });
    
    touchStartTimeRef.current = Date.now();
    touchStartPositionRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressRef.current = false;
    
    // 単語要素の場合、長押しタイマーを開始
    if (target.classList.contains('clickable-word')) {
      const word = target.textContent || '';
      
      
      // 長押しタイマー（800ms）- モバイル用に調整
      longPressTimeoutRef.current = setTimeout(() => {
        if (!isLongPressRef.current) {
          console.log('🔗 長押し検出:', word);
          handleLongPress(target);
        }
      }, 800);
    }
  };

  // タッチ終了ハンドラー（長押し対応）
  const handleTextTouch = (e: React.TouchEvent<HTMLParagraphElement>) => {
    const target = e.target as HTMLElement;
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTimeRef.current;
    
    console.log('🔴 TouchEnd発火:', {
      target: target.tagName,
      word: target.textContent,
      duration: touchDuration,
      isLongPress: isLongPressRef.current,
      hasTimer: !!longPressTimeoutRef.current
    });
    
    // 長押しタイマーをクリア
    if (longPressTimeoutRef.current) {
      console.log('🛑 タイマークリア');
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    
    // 長押しが実行された場合は、通常のタップ処理をスキップ
    if (isLongPressRef.current) {
      console.log('✅ 長押しが実行済み、通常タップ処理をスキップ');
      // Reset long press flag for next interaction
      setTimeout(() => {
        isLongPressRef.current = false;
        console.log('🔄 長押しフラグリセット');
      }, 100);
      return;
    }
    
    // タッチ終了位置を取得
    const touch = e.changedTouches[0];
    const touchEndPosition = { x: touch.clientX, y: touch.clientY };
    
    // 移動距離を計算
    const moveDistance = Math.sqrt(
      Math.pow(touchEndPosition.x - touchStartPositionRef.current.x, 2) + 
      Math.pow(touchEndPosition.y - touchStartPositionRef.current.y, 2)
    );
    
    // タッチ時間が短すぎる（100ms未満）または移動距離が大きい（15px以上）場合は無視
    if (touchDuration < 100 || moveDistance > 15) {
      return;
    }
    
    // タッチされた要素が単語要素か確認
    if (target.classList.contains('clickable-word')) {
      const word = target.textContent || '';
      e.preventDefault();
      e.stopPropagation();
      
      
      // web版と同じ動作：濃い黄色ハイライト + 単語クリック処理
      setHighlightedWord(word);
      console.log('🟡 モバイルタップ - 濃い黄色ハイライト:', word);
      
      // 単語クリック処理を即座に実行
      handleWordClick(word);
    }
  };

  // テキストサイズ変更
  const handleTextSizeChange = (size: 'small' | 'medium' | 'large') => {
    setTextSize(size);
    localStorage.setItem('readingTextSize', size);
  };

  // 読書再開処理（ブックマーク機能）
  const handleResumeReading = () => {
    console.log('🔄 handleResumeReading 開始 - isResumeMode:', isResumeMode);
    
    // 読書再開完了フラグを設定（ページリロード対策） - 削除
    // sessionStorage.setItem('bookmark_resumed', 'true');
    
    setShowResumeDialog(false);
    setIsResumeMode(false);
    console.log('🔄 setIsResumeMode(false) + sessionStorage設定完了');
    
    // 再開時の核兵器級スクロール確保
    const ensureScrollOnResume = () => {
      [document.body, document.documentElement].forEach(el => {
        el.style.cssText = `
          overflow: visible !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          pointer-events: auto !important;
          position: relative !important;
          height: auto !important;
          max-height: none !important;
          min-height: 100vh !important;
        `;
      });
      
      // 全要素のスクロール阻害を解除
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        el.classList.remove('blur-reading', 'overflow-hidden', 'h-screen', 'max-h-screen');
        const style = el as HTMLElement;
        if (style.style.overflow === 'hidden') {
          style.style.overflow = 'visible';
        }
      });
      
      console.log('🔧 再開時核兵器級スクロール確保 - scrollHeight:', document.body.scrollHeight);
    };
    
    ensureScrollOnResume();
    setTimeout(ensureScrollOnResume, 100);
    setTimeout(ensureScrollOnResume, 500);
    
    // 再開時のstartTime設定（ブックマーク保存のため）
    if (!startTime) {
      setStartTime(Date.now());
      console.log('🔄 再開時startTime設定:', Date.now());
    }
    
    // ブックマーク位置へ自動スクロール
    if (bookmarkTokenIndex !== null) {
      const savedBookmarkIndex = bookmarkTokenIndex; // スクロール用に保存
      console.log('🔍 ブックマーク位置スクロール開始 (index:', savedBookmarkIndex, ')');
      
      // Enhanced approach with retry mechanism for robust DOM element detection
      const attemptBookmarkScroll = (attempt = 1, maxAttempts = 10) => {
        console.log(`🔍 BOOKMARK SCROLL ATTEMPT ${attempt}/${maxAttempts}:`, {
          savedBookmarkIndex,
          domElementsCount: document.querySelectorAll('[data-idx]').length,
          targetExists: !!document.querySelector(`[data-idx="${savedBookmarkIndex}"]`)
        });
        
        const targetElement = document.querySelector(`[data-idx="${savedBookmarkIndex}"]`) as HTMLElement;
        
        if (targetElement) {
          console.log('✅ ブックマーク位置にスクロール開始');
          console.log('📍 Target element:', {
            word: targetElement.textContent,
            index: savedBookmarkIndex,
            position: targetElement.getBoundingClientRect()
          });
          
          // Scroll to bookmark position
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
          
          // Highlight the bookmarked word in red - 超強力な設定で確実に表示
          targetElement.classList.add('bookmark-highlight');
          
          // 最も単純なアプローチ: 直接テキストを変更
          const originalText = targetElement.textContent;
          
          // 元の要素を完全に削除して新しい要素に置き換え
          const newElement = document.createElement('span');
          newElement.textContent = originalText;
          newElement.className = 'bookmark-temp-highlight';
          newElement.setAttribute('data-idx', targetElement.getAttribute('data-idx') || '');
          
          // 絶対確実なスタイル設定
          newElement.style.cssText = `
            background: #f97316 !important;
            color: white !important;
            font-weight: bold !important;
            padding: 2px 4px !important;
            border-radius: 4px !important;
            display: inline !important;
          `;
          
          // 元の要素を新しい要素で置き換え
          if (targetElement.parentNode) {
            targetElement.parentNode.replaceChild(newElement, targetElement);
            
            // 3秒後に元に戻す
            setTimeout(() => {
              if (newElement.parentNode) {
                const restoreElement = document.createElement('span');
                restoreElement.textContent = originalText;
                restoreElement.className = 'clickable-word';
                restoreElement.setAttribute('data-idx', newElement.getAttribute('data-idx') || '');
                newElement.parentNode.replaceChild(restoreElement, newElement);
              }
            }, 3000);
          }
          
          console.log('🟠 強制オレンジハイライト適用:', targetElement.textContent);
          
          console.log('📖 ブックマーク復帰完了:', targetElement.textContent);
          
          // ブックマーク復帰後のスクロール確保
          setTimeout(() => {
            [document.body, document.documentElement].forEach(el => {
              el.style.setProperty('overflow', 'visible', 'important');
              el.style.setProperty('overflow-y', 'auto', 'important');
              el.style.setProperty('pointer-events', 'auto', 'important');
            });
            console.log('🔧 ブックマーク復帰後スクロール確保完了');
          }, 100);
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            targetElement.classList.remove('bookmark-highlight', 'bookmark-active-highlight');
            // ハイライトのプロパティを個別に除去
            targetElement.style.removeProperty('background-color');
            targetElement.style.removeProperty('background');
            targetElement.style.removeProperty('color');
            targetElement.style.removeProperty('font-weight');
            targetElement.style.removeProperty('padding');
            targetElement.style.removeProperty('border-radius');
            targetElement.style.removeProperty('box-shadow');
            console.log('✨ ブックマークハイライト終了');
          }, 3000);
          
        } else {
          console.log(`❌ ブックマーク位置が見つかりません (attempt ${attempt}/${maxAttempts})`);
          const allElements = document.querySelectorAll('[data-idx]');
          console.log('- 全要素数:', allElements.length);
          console.log('- 探している位置:', savedBookmarkIndex);
          
          if (attempt < maxAttempts && allElements.length === 0) {
            // DOM elements not ready yet, retry after 500ms
            console.log(`🔄 DOM要素未準備、${attempt + 1}回目を500ms後に実行`);
            setTimeout(() => attemptBookmarkScroll(attempt + 1, maxAttempts), 500);
            return;
          } else if (attempt < maxAttempts) {
            // Elements exist but target not found, retry with shorter delay
            console.log(`🔄 対象要素未発見、${attempt + 1}回目を200ms後に実行`);
            setTimeout(() => attemptBookmarkScroll(attempt + 1, maxAttempts), 200);
            return;
          } else {
            console.log('❌ 最大試行回数に達しました - 詳細調査:');
            console.log('- 最初の5つの要素:', Array.from(allElements).slice(0, 5).map(el => 
              `idx=${el.getAttribute('data-idx')}: "${el.textContent}"`
            ));
          }
        }
        
        // DON'T clear bookmark data - keep for multiple resume attempts
        // setBookmarkTokenIndex(null);
        // globalTokenIndexRef.current = 0;
      };
      
      // Start the scroll attempt after 800ms delay
      setTimeout(() => attemptBookmarkScroll(), 800);
      
    } else {
      console.warn('⚠️ bookmarkTokenIndex が null です - ブックマークデータを再読み込み');
      
      // ブックマークデータを再度確認
      const bookmarkData = localStorage.getItem('reading_bookmark');
      if (bookmarkData) {
        try {
          const bookmark = JSON.parse(bookmarkData);
          console.log('🔍 再読み込みブックマーク:', bookmark);
          setBookmarkTokenIndex(bookmark.tokenIndex);
          
          // リトライ
          setTimeout(() => {
            const attemptBookmarkScrollAgain = (attempt = 1, maxAttempts = 5) => {
              const targetElement = document.querySelector(`[data-idx="${bookmark.tokenIndex}"]`);
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetElement.classList.add('bookmark-highlight', 'bookmark-active-highlight');
                console.log('🔄 ブックマーク再試行成功');
              } else if (attempt < maxAttempts) {
                setTimeout(() => attemptBookmarkScrollAgain(attempt + 1, maxAttempts), 500);
              }
            };
            attemptBookmarkScrollAgain();
          }, 1000);
        } catch (error) {
          console.error('❌ ブックマーク再読み込みエラー:', error);
        }
      }
    }
    
    console.log('🔄 読書再開: ぼかし解除、通常の読書モードに移行');
    
    // FORCE ENABLE SCROLLING - Ultimate comprehensive fix
    const enableScrolling = () => {
      console.log('🔧 FORCE ENABLING SCROLLING - ULTIMATE FIX');
      
      // Remove ALL scroll blocking from root elements
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('pointer-events');
      document.documentElement.style.removeProperty('pointer-events');
      
      // Force enable with important declarations
      document.body.style.setProperty('overflow', 'auto', 'important');
      document.documentElement.style.setProperty('overflow', 'auto', 'important');
      document.body.style.setProperty('pointer-events', 'auto', 'important');
      document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
      
      // Remove blur-reading class from ALL elements
      const blurElements = document.querySelectorAll('.blur-reading');
      blurElements.forEach(el => el.classList.remove('blur-reading'));
      
      // Remove scroll blocking from problematic elements
      const problematicSelectors = ['main', '[data-blur]', '.fixed', '.absolute'];
      problematicSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const element = el as HTMLElement;
          if (element.style) {
            element.style.removeProperty('overflow');
            element.style.removeProperty('pointer-events');
            element.style.setProperty('pointer-events', 'auto', 'important');
          }
        });
      });
      
      console.log('✅ Ultimate scrolling enablement completed');
    };
    
    // Enable scrolling immediately
    enableScrolling();
    
    // Re-enable scrolling every 2 seconds to prevent blocking
    const scrollInterval = setInterval(() => {
      enableScrolling();
    }, 2000);
    
    // Stop recurring check after 10 seconds
    setTimeout(() => {
      clearInterval(scrollInterval);
      console.log('🔧 停止recurring scroll check');
    }, 10000);
    
    // Test scroll immediately
    setTimeout(() => {
      console.log('🧪 Testing scroll capability...');
      const canScroll = document.body.scrollHeight > window.innerHeight;
      console.log('📏 Scroll test:', {
        bodyScrollHeight: document.body.scrollHeight,
        windowHeight: window.innerHeight,
        canScroll: canScroll,
        currentScrollY: window.scrollY
      });
      
      // Force a small test scroll
      window.scrollBy(0, 10);
      setTimeout(() => {
        window.scrollBy(0, -10);
        console.log('✅ Scroll test completed');
      }, 100);
    }, 500);
  };

  // テキストサイズのCSSクラス
  const getTextSizeClass = () => {
    switch (textSize) {
      case 'small': return 'text-base'; // 16px (現状維持)
      case 'medium': return 'text-lg';  // 18px
      case 'large': return 'text-xl';   // 20px
      default: return 'text-base';
    }
  };

  // 英語テキストをクリック可能な単語に分割（マークダウン太字対応）
  const renderClickableText = (text: string, paragraphIndex: number) => {
    console.log('🎨 renderClickableText called with:', text.substring(0, 100) + '...');
    
    // 段落開始時にインデックスを初期化（最初の段落のみ）
    if (paragraphIndex === 0) {
      globalTokenIndexRef.current = 0;
    }
    
    // マークダウンの太字(**text**)を最初に処理
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    
    return parts.map((part, partIndex) => {
      // 太字部分の処理
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2); // **を削除
        console.log('📖 チャプタータイトル検出:', boldText);
        return (
          <strong key={partIndex} className="font-bold text-text-primary block mb-3 text-lg">
            {boldText}
          </strong>
        );
      }
      
      // 通常テキストの単語分割とクリック可能処理
      const words = part.split(/(\s+|[.!?;:,\-\u2013\u2014()"])/);
      
      let clickableWordCount = 0;
      const result = words.map((word, wordIndex) => {
        if (/^[a-zA-Z-]+$/.test(word) && word !== '-') {
          clickableWordCount++;
          const tokenIndex = globalTokenIndexRef.current++;
          return (
            <span
              key={`${partIndex}-${wordIndex}`}
              className={`clickable-word ${
                highlightedWord === word ? 'bg-yellow-300' : ''
              } ${
                bookmarkTokenIndex === tokenIndex ? 'bg-red-400 text-white font-bold' : ''
              }`}
              data-word={word}
              data-idx={tokenIndex}
              style={{
                outline: '0',
                border: '0',
                boxShadow: 'none',
                WebkitTapHighlightColor: 'rgba(0,0,0,0)',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                // 最強レベルの紫色阻止
                backgroundColor: highlightedWord === word ? '#fde047' : 
                                bookmarkTokenIndex === tokenIndex ? '#f87171' : 'transparent',
                borderStyle: 'none',
                borderWidth: '0',
                borderColor: 'transparent',
                outlineStyle: 'none',
                outlineWidth: '0',
                outlineColor: 'transparent',
                // ブラウザ固有の無効化
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              {word}
            </span>
          );
        } else {
          return <span key={`${partIndex}-${wordIndex}`}>{word}</span>;
        }
      });
      
      if (clickableWordCount > 0) {
        console.log(`🎯 パート ${partIndex}: ${clickableWordCount}個の単語を検出`);
      }
      return result;
    });
  };

  if (loading) {
    return <CatLoader />;
  }

  return (
    <main 
      className="min-h-screen bg-page-bg p-2 sm:p-4"
      style={{ 
        overflow: 'auto',
        pointerEvents: 'auto',
        height: 'auto',
        minHeight: '100vh'
      }}
    >
      {/* 報酬獲得演出 */}
      <RewardEarnedFlash />
      <RewardFlashManager />
      {/* ページタイトル */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-text-primary">
            {mode === 'story' ? (initialData?.title || displayTitle) : displayTitle}
          </h1>
          
          {/* 文字サイズ変更コントロール & 音声再生 */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-600 mb-1">文字サイズ</div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleTextSizeChange('small')}
                  className={`px-3 py-1 text-sm font-bold rounded-l-md transition-colors ${
                    textSize === 'small' 
                      ? 'bg-primary-active text-text-primary' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  小
                </button>
                <button
                  onClick={() => handleTextSizeChange('medium')}
                  className={`px-3 py-1 text-sm font-bold transition-colors ${
                    textSize === 'medium' 
                      ? 'bg-primary-active text-text-primary' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  中
                </button>
                <button
                  onClick={() => handleTextSizeChange('large')}
                  className={`px-3 py-1 text-sm font-bold rounded-r-md transition-colors ${
                    textSize === 'large' 
                      ? 'bg-primary-active text-text-primary' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  大
                </button>
              </div>
            </div>
            
            {/* 音声再生ボタン */}
            {english && english.trim() && (
              <TTSButton
                text={english}
                contentId="reading-title-audio"
                variant="secondary"
                className="text-sm px-3 py-1"
              />
            )}
            
            {/* 日本語訳表示ボタン */}
            {isReadingStarted && (
              <button
                onClick={handleShowJapanese}
                className="text-sm px-3 py-1 font-bold rounded-md transition-colors bg-primary-inactive text-text-primary hover:bg-primary-active"
              >
                {showJapanese ? '日本語を隠す' : '日本語を表示'}
              </button>
            )}
          </div>
        </div>
        
        {mode === 'story' && searchParams.genre && (
          <p className="text-sm text-gray-600">ジャンル: {searchParams.genre}</p>
        )}
      </div>

      {/* コンテンツ表示 */}
      {(() => {
        console.log('🔥 RENDER DECISION:', {
          isReadingStarted,
          decision: !isReadingStarted ? 'SHOW_START_BUTTON' : 'SHOW_TEXT_CONTENT'
        });
        return !isReadingStarted;
      })() ? (
        <div className="rounded-lg bg-white p-3 sm:p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">
              {isResumeMode ? '前回の続きを読みますか？' : '読書を開始しますか？'}
            </h2>
            <p className="mb-4 text-gray-600">語数: {wordCount}語</p>
            
            <button
              onClick={handleStartReading}
              className="mb-4 rounded-md bg-primary-active px-6 py-3 font-bold text-text-primary transition-colors hover:bg-[#e5a561]"
            >
              {isResumeMode ? '前回の続きを読む' : '読み始める'}
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
          <div 
            className="bg-white rounded-lg p-3 sm:p-6 shadow-sm"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="max-w-none">
              {englishParagraphs.map((paragraph, index) => {
                console.log(`📝 段落 ${index + 1}:`, paragraph.substring(0, 50) + '...');
                return (
                <div key={index} className="mb-6">
                  {/* 英語段落 */}
                  <p 
                    className={`mb-3 ${getTextSizeClass()} leading-relaxed text-text-primary`}
                    onClick={handleTextClick}
                    onMouseDown={handleTextMouseDown}
                    onMouseUp={handleTextMouseUp}
                    onTouchStart={handleTextTouchStart}
                    onTouchEnd={handleTextTouch}
                    style={{ 
                      pointerEvents: 'auto',
                      userSelect: 'auto',
                      touchAction: 'manipulation'
                    }}
                  >
                    {renderClickableText(paragraph, index)}
                  </p>
                  
                  {/* 対応する日本語段落 */}
                  {showJapanese && japaneseParagraphs[index] && (
                    <div className="rounded-lg border border-[#FFE1B5] bg-page-bg p-4">
                      <p className={`${getTextSizeClass()} text-text-primary`}>
                        {japaneseParagraphs[index]}
                      </p>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              {!endTime ? (
                // 読書完了前：読書完了ボタンのみ表示（中央配置・オレンジ色）
                <div className="w-full flex justify-center">
                  <button
                    onClick={handleCompleteReading}
                    className="rounded-md bg-orange-400 px-6 py-3 font-bold text-black transition-colors hover:bg-orange-500 text-lg"
                  >
                    読書完了
                  </button>
                </div>
              ) : (
                // 読書完了後：日本語表示と音声再生ボタンを表示
                <>
                  <button
                    onClick={() => setShowJapanese(!showJapanese)}
                    className="rounded-md bg-primary-active px-4 py-2 font-bold text-text-primary transition-colors hover:bg-[#e5a561]"
                  >
                    {showJapanese ? '日本語を隠す' : '日本語を表示'}
                  </button>
                  
                  <TTSButton
                    text={english}
                    contentId="reading-full-content"
                    variant="secondary"
                    className="px-4 py-2"
                  />
                </>
              )}
            </div>
          </div>


          {/* 読書完了後の表示 */}
          {endTime && (
            <div className="rounded-lg border border-[#FFE1B5] bg-page-bg p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-text-primary">読書完了！</h3>
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                    {actualLevel !== null ? (
                      actualLevel === selectedLevel ? (
                        `Lv.${selectedLevel}`
                      ) : (
                        <span>
                          Lv.{selectedLevel} 
                          <span className="text-sm text-black ml-1">
                            (判定レベル: Lv.{actualLevel})
                          </span>
                        </span>
                      )
                    ) : (
                      `Lv.${selectedLevel}`
                    )}
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
                <div>
                  <p className="text-sm text-gray-600">累計語数</p>
                  <p className="text-lg font-bold">
                    {(() => {
                      // 読書開始前の語数がnullの場合は現在の進捗から取得
                      const startWords = readingStartWordsRead ?? getUserProgress().totalWords;
                      const newTotal = startWords + wordCount;
                      console.log('📊 累計語数表示:', { 
                        readingStartWordsRead, 
                        startWords,
                        wordCount, 
                        newTotal 
                      });
                      return `${newTotal.toLocaleString()} 語`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">スタンプ進捗</p>
                  <p className="text-lg font-bold">
                    {(() => {
                      // 読書開始前の語数がnullの場合は現在の進捗から取得
                      const startWords = readingStartWordsRead ?? getUserProgress().totalWords;
                      const newTotal = startWords + wordCount;
                      const stampsEarned = Math.floor(newTotal / 100) - Math.floor(startWords / 100);
                      const totalStamps = Math.floor(newTotal / 100);
                      const nextStampAt = ((Math.floor(newTotal / 100) + 1) * 100) - newTotal;
                      
                      console.log('📊 スタンプ進捗計算（修正版）:', {
                        readingStartWordsRead,
                        startWords,
                        wordCount,
                        newTotal,
                        stampsEarned,
                        totalStamps,
                        nextStampAt
                      });
                      
                      if (stampsEarned > 0) {
                        return `+${stampsEarned}個獲得！（累計${totalStamps}個）`;
                      } else {
                        return `あと${nextStampAt}語で+1個`;
                      }
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">報酬</p>
                  <p className="text-lg font-bold">
                    <RewardDisplay name="" reward={reward} />
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
              
              {/* スタンプカード表示 */}
              <div className="my-6 flex justify-center">
                <NewStampCard 
                  onComplete={() => {
                    console.log('🎉 スタンプカード20個完成！');
                  }}
                />
              </div>
              
              

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleReadAgain}
                    className="rounded-md bg-orange-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-700"
                  >
                    もう一度読む
                  </button>
                  
                  <button
                    onClick={handleLevelChange}
                    className="rounded-md bg-primary-active px-4 py-2 font-medium text-text-primary transition-colors hover:bg-[#e5a561]"
                  >
                    レベル変更
                  </button>
                  
                  <button
                    onClick={() => router.push('/choose')}
                    className="rounded-md bg-[#FFE1B5] px-4 py-2 font-medium text-text-primary transition-colors hover:bg-[#f0d1a0]"
                  >
                    他のものを読む
                  </button>
                </div>
                
                {/* レベル選択UI */}
                {showLevelSelector && (
                  <div 
                    data-level-selector
                    className="rounded-lg border-2 border-orange-400 bg-white p-4 shadow-lg"
                  >
                    <h4 className="mb-3 text-center font-bold text-lg text-black">語彙レベルを選択</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { level: 1, label: '初級', description: '基本語彙のみ' },
                        { level: 2, label: '中級', description: '日常語彙' },
                        { level: 3, label: '上級', description: '幅広い語彙' }
                      ].map(({ level, label, description }) => (
                        <button
                          key={level}
                          onClick={() => handleRegenerateWithLevel(level)}
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedLevel === level 
                              ? 'bg-[#FFB86C] text-[#1E1E1E]' 
                              : 'border border-[#FFE1B5] bg-white text-text-primary hover:bg-page-bg'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-bold">Lv.{level}</div>
                            <div className="text-xs">{label}</div>
                            <div className="text-xs text-gray-600">{description}</div>
                          </div>
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

      {/* スタンプフラッシュ表示 */}
      <StampFlash 
        show={showStampFlash} 
        stampsEarned={earnedStampsCount}
        onComplete={() => setShowStampFlash(false)} 
      />



      {/* ブックマーク機能のダイアログ */}
      <BookmarkDialog
        isOpen={bookmarkDialog.isOpen}
        onClose={() => {
          // オレンジハイライトをクリア
          const targetElement = document.querySelector(`[data-idx="${bookmarkDialog.tokenIndex}"]`) as HTMLElement;
          if (targetElement) {
            targetElement.style.removeProperty('background-color');
            targetElement.style.removeProperty('color');
            targetElement.style.removeProperty('padding');
            targetElement.style.removeProperty('border-radius');
            console.log('🧹 オレンジハイライトクリア:', bookmarkDialog.word);
          }
          // 長押しフラグをリセット
          isLongPressRef.current = false;
          setBookmarkDialog({...bookmarkDialog, isOpen: false});
        }}
        onConfirm={() => {
          console.log('🔥 BookmarkDialog onConfirm実行:', bookmarkDialog);
          console.log('🛑 ダイアログを閉じる前に遷移阻止設定');
          
          // 遷移を阻止してから統計処理実行
          console.log('🔥 saveBookmark呼び出し開始:', { tokenIndex: bookmarkDialog.tokenIndex, word: bookmarkDialog.word });
          
          // 長押しした要素を取得
          const targetElement = document.querySelector(`[data-idx="${bookmarkDialog.tokenIndex}"]`) as HTMLElement;
          console.log('🎯 長押し要素取得:', {
            tokenIndex: bookmarkDialog.tokenIndex,
            selector: `[data-idx="${bookmarkDialog.tokenIndex}"]`,
            targetElement,
            found: !!targetElement
          });
          saveBookmark(bookmarkDialog.tokenIndex, bookmarkDialog.word, targetElement);
          
          // saveBookmark完了後にダイアログを閉じる
          setTimeout(() => {
            console.log('🛑 ダイアログを閉じる');
            setBookmarkDialog({...bookmarkDialog, isOpen: false});
          }, 500);
        }}
        word={bookmarkDialog.word}
        conflictLevel={bookmarkDialog.conflictLevel}
        currentLevel={selectedLevel}
      />

      {/* 読書再開ダイアログ */}
      <ResumeDialog
        isOpen={showResumeDialog}
        onResume={handleResumeReading}
      />

      {/* ブックマーク統計表示 */}
      {(() => {
        console.log('📊 ブックマーク統計表示判定:', {
          isVisible: bookmarkStats.isVisible,
          hasStats: !!bookmarkStats.stats,
          stats: bookmarkStats.stats,
          element: bookmarkStats.element
        });
        return bookmarkStats.isVisible && bookmarkStats.stats;
      })() && (
        <>
          {/* 統計表示 */}
          <div 
            className="fixed rounded-lg p-4 shadow-lg z-50"
          style={(() => {
            if (bookmarkStats.element) {
              // getBoundingClientRect()でビューポート基準の位置を取得
              const rect = bookmarkStats.element.getBoundingClientRect();
              const top = rect.bottom + window.scrollY + 10;
              const left = rect.left + window.scrollX;
              
              console.log('📊 統計表示位置計算:', {
                element: bookmarkStats.element,
                rect,
                scrollY: window.scrollY,
                scrollX: window.scrollX,
                calculatedTop: top,
                calculatedLeft: left
              });
              
              return {
                top: '20px', // テスト用：画面上部に固定
                left: '20px', // テスト用：画面左に固定
                maxWidth: '280px',
                minWidth: '200px',
                backgroundColor: '#f5f5dc', // ベージュ
                pointerEvents: 'auto' // この要素だけでイベントを処理
              };
            } else {
              return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '280px',
                minWidth: '200px'
              };
            }
          })()}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-orange-600">ブックマーク完了</h3>
            <button
              onClick={() => {
                setBookmarkStats(prev => ({ ...prev, isVisible: false }));
                // 長押しフラグをリセット
                isLongPressRef.current = false;
                // スクロール確保
                document.body.style.setProperty('overflow', 'auto', 'important');
                document.documentElement.style.setProperty('overflow', 'auto', 'important');
                console.log('🔄 統計閉じる: フラグリセット');
              }}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ×
            </button>
          </div>
          
          {/* シンプルな統計表示 */}
          <div className="text-xs space-y-1 mb-3">
            <div className="flex justify-between">
              <span className="text-gray-600">読了:</span>
              <span className="font-bold">{bookmarkStats.stats?.wordsRead || 100} 語</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">時間:</span>
              <span className="font-bold">{bookmarkStats.stats?.readingTime || '2分30秒'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">速度:</span>
              <span className="font-bold">{bookmarkStats.stats?.wpm || 125} WPM</span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                // 詳細統計エリアにスクロール
                setEndTime(Date.now()); // 詳細統計を表示
                setBookmarkStats(prev => ({ ...prev, isVisible: false }));
                // 長押しフラグをリセット
                isLongPressRef.current = false;
                
                // スクロール確保
                document.body.style.setProperty('overflow', 'auto', 'important');
                document.documentElement.style.setProperty('overflow', 'auto', 'important');
                
                // 統計エリアにスクロール
                setTimeout(() => {
                  const statsElement = document.querySelector('[class*="rounded-lg"][class*="border-[#FFE1B5]"]');
                  if (statsElement) {
                    statsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-2 rounded-md transition-colors text-sm"
            >
              詳しい情報を見る
            </button>
            <button
              onClick={() => {
                setBookmarkStats(prev => ({ ...prev, isVisible: false }));
                // 長押しフラグをリセット
                isLongPressRef.current = false;
                // スクロール確保
                document.body.style.setProperty('overflow', 'auto', 'important');
                document.documentElement.style.setProperty('overflow', 'auto', 'important');
                router.push('/choose');
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md transition-colors text-sm"
            >
              他のものを読む
            </button>
          </div>
          </div>
        </>
      )}

    </main>
  );
}