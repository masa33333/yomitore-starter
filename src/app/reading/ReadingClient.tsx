'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useStory } from '@/lib/store/story';
import { completeReading } from '@/lib/readingProgress';
import type { ReadingCompletionData } from '@/types/stampCard';
import { notifyNewStampCardUpdate } from '@/components/NewStampCard';
import NewStampCard from '@/components/NewStampCard';
import TTSButton from '@/components/TTSButton';
import CatLoader from '@/components/CatLoader';
import StampFlash from '@/components/StampFlash';
import { BookmarkDialog } from '@/components/BookmarkDialog';
import { ResumeDialog } from '@/components/ResumeDialog';
import { analyzeVocabulary } from '@/constants/ngslData';
import { playStampFanfare, playCardCompleteFanfare } from '@/lib/stampSounds';
import { updateTodayRecord } from '@/lib/calendarData';

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
  
  // 読書開始時の総語数を記録（スタンプ進捗表示用）
  const [readingStartWordsRead, setReadingStartWordsRead] = useState<number | null>(null);
  
  // 単語処理状態
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loadingWordInfo, setLoadingWordInfo] = useState(false);
  
  // しおり機能用ステート
  const [bookmarkTokenIndex, setBookmarkTokenIndex] = useState<number | null>(null);
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
  const [isResumeMode, setIsResumeMode] = useState(false);
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
    console.log('📋 Initial data:', initialData);
    console.log('📋 English paragraphs:', englishParagraphs);
    console.log('📊 Word count:', wordCount);
    
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

    // しおり再開モードの処理
    if (resumeMode) {
      console.log('📖 Resume mode detected, setting up bookmark restoration...');
      setIsResumeMode(true);
      const bookmarkData = localStorage.getItem('reading_bookmark');
      if (bookmarkData) {
        try {
          const bookmark = JSON.parse(bookmarkData);
          setBookmarkTokenIndex(bookmark.tokenIndex);
          console.log('📖 Bookmark restored:', bookmark);
          // しおり位置へのスクロールとぼかし表示はコンテンツ読み込み後に実行
          setTimeout(() => {
            const targetElement = document.querySelector(`[data-idx="${bookmark.tokenIndex}"]`);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              console.log('📖 Scrolled to bookmark position');
            }
            setShowResumeDialog(true);
          }, 1000);
        } catch (error) {
          console.error('❌ Error parsing bookmark:', error);
        }
      }
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
    
    // 読書開始時の総語数を記録（スタンプ進捗表示用）
    const currentWordsRead = parseInt(localStorage.getItem('totalWordsRead') || '0', 10);
    setReadingStartWordsRead(currentWordsRead);
    
    console.log('📖 読書開始', { readingStartWordsRead: currentWordsRead });
    
    // 読書状態をlocalStorageに保存
    saveCurrentReadingState();
  };

  // 読書完了処理（スタンプカード統合版）
  const handleCompleteReading = () => {
    if (!startTime) return;
    
    // まずスタンプフラッシュを表示
    setShowStampFlash(true);
    
    const endTimeValue = Date.now();
    setEndTime(endTimeValue);
    
    const duration = endTimeValue - startTime; // ミリ秒
    const timeInMinutes = duration / 60000;
    const calculatedWpm = Math.round(wordCount / timeInMinutes);
    setWpm(calculatedWpm);
    
    console.log('✅ 読書完了:', {
      wordCount,
      timeInMinutes: timeInMinutes.toFixed(1),
      wpm: calculatedWpm,
      duration
    });
    
    // スタンプカード統合システムで進捗更新
    const currentLevel = parseInt(localStorage.getItem('level') || localStorage.getItem('fixedLevel') || '3', 10);
    const completionData: ReadingCompletionData = {
      wordCount: wordCount,
      duration: duration,
      wpm: calculatedWpm,
      level: currentLevel,
      title: storyTitle || initialData?.title || displayTitle || '読み物',
      contentType: 'reading'
    };
    
    try {
      // スタンプ獲得数を事前計算（ファンファーレ用）
      const currentTotal = parseInt(localStorage.getItem('totalWordsRead') || '0', 10);
      const newTotal = currentTotal + wordCount;
      const stampsEarned = Math.floor(newTotal / 100) - Math.floor(currentTotal / 100);
      
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
      
      // 20個完成時の特別ファンファーレ
      if (updatedProgress.currentCardStamps === 0 && updatedProgress.totalStamps > 0 && stampsEarned > 0) {
        setTimeout(() => {
          playCardCompleteFanfare();
          console.log('🎊 カード完成ファンファーレ再生');
        }, 1500); // スタンプファンファーレ後に再生
      }
      
      // 新しいスタンプカードに更新通知
      notifyNewStampCardUpdate();
      
      // 2回目の読了完了時に一通目の手紙を送信（既存ロジック維持）
      if (updatedProgress.totalStamps === 2) {
        sendFirstLetter();
      }
      
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

  // 長押し処理（しおり機能）
  const handleLongPress = (target: HTMLElement) => {
    const tokenIndex = parseInt(target.dataset.idx || '0', 10);
    const word = target.textContent || '';
    
    console.log('🎯 handleLongPress実行:', word, 'tokenIndex:', tokenIndex);
    
    // 長押しフラグを設定
    isLongPressRef.current = true;
    
    // 視覚的フィードバック：紫色ハイライト（長押し）
    target.style.backgroundColor = '#8b5cf6';
    target.style.color = 'white';
    setTimeout(() => {
      target.style.backgroundColor = '';
      target.style.color = '';
    }, 1500);
    
    // モバイル表示：長押し成功メッセージ
    setDebugInfo(prev => prev + `\n\n🎯 長押し成功！\nしおり作成中...`);
    
    // 現在の読み物を識別するためのslugを取得/生成
    const currentSlug = searchParams.slug || `${searchParams.mode || 'default'}-${searchParams.genre || 'general'}-${searchParams.topic || 'default'}`;
    
    // 既存のしおりチェック
    const existingBookmark = localStorage.getItem('reading_bookmark');
    if (existingBookmark) {
      const bookmark = JSON.parse(existingBookmark);
      if (bookmark.slug === currentSlug && bookmark.level !== selectedLevel) {
        // レベル競合確認ダイアログ表示
        setBookmarkDialog({
          isOpen: true,
          word,
          tokenIndex,
          conflictLevel: bookmark.level
        });
        return;
      }
    }
    
    // 中断確認ダイアログ表示
    console.log('💬 BookmarkDialog表示:', { word, tokenIndex });
    setBookmarkDialog({
      isOpen: true,
      word,
      tokenIndex
    });
  };

  // しおり保存処理
  const saveBookmark = (tokenIndex: number, word: string) => {
    // 現在の読み物を識別するためのslugを取得/生成
    const currentSlug = searchParams.slug || `${searchParams.mode || 'default'}-${searchParams.genre || 'general'}-${searchParams.topic || 'default'}`;
    
    const bookmarkData = {
      slug: currentSlug,
      level: selectedLevel,
      tokenIndex: tokenIndex
    };
    
    localStorage.setItem('reading_bookmark', JSON.stringify(bookmarkData));
    setBookmarkTokenIndex(tokenIndex);
    
    console.log('📖 しおり保存:', bookmarkData);
    
    // 中断時の統計計算処理
    const currentTime = Date.now();
    const readingTime = currentTime - (startTime || currentTime);
    
    // tokenIndexまでの英単語数を計算
    const allTokens = english.split(/(\s+|[.!?;:,\-\u2013\u2014()"])/);
    const wordsRead = allTokens.slice(0, tokenIndex).filter(token => /^[A-Za-z]+$/.test(token)).length;
    const wpmCalculated = wordsRead / (readingTime / 60000);
    
    // 統計データを保存（中断でも進捗に反映）
    const progressData = {
      wordsRead,
      readingTime,
      wpm: wpmCalculated,
      date: new Date().toISOString(),
      interrupted: true
    };
    
    console.log('📊 中断時統計:', progressData);
    
    // 選択ページに戻る
    router.push('/choose');
  };

  // 単語クリック処理
  const handleWordClick = async (word: string) => {
    console.log('🔍 handleWordClick called with:', word);
    console.log('📱 現在のsessionWords数:', sessionWords.length);
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
        // CSSクラスを除去
        el.classList.remove('active', 'bg-yellow-300', 'bg-yellow-200', 'bg-yellow-100');
        // インラインスタイルを除去
        el.style.backgroundColor = '';
        el.style.background = '';
        el.style.removeProperty('background-color');
        el.style.removeProperty('background');
        // 追加でCSSリセット
        el.style.cssText = el.style.cssText.replace(/background[^;]*;?/g, '');
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

  // 親要素のクリックハンドラー（Event Delegation）
  const handleTextClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const target = e.target as HTMLElement;
    
    // タッチイベントで既に処理された場合はスキップ
    if ((target as any)._touchHandled) {
      return;
    }
    
    // クリックされた要素が単語要素か確認
    if (target.classList.contains('clickable-word')) {
      const word = target.textContent || '';
      e.preventDefault();
      e.stopPropagation();
      handleWordClick(word);
    }
  };

  // タッチ開始時間を記録するためのref
  const touchStartTimeRef = useRef<number>(0);
  const touchStartPositionRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  
  // 単語ハイライト状態を管理
  const [highlightedWord, setHighlightedWord] = useState<string>('');
  
  // デバッグ情報を画面に表示（モバイル用）
  const [debugInfo, setDebugInfo] = useState<string>('');
  const tapCountRef = useRef<number>(0);

  // タッチ開始ハンドラー（長押し対応）
  const handleTextTouchStart = (e: React.TouchEvent<HTMLParagraphElement>) => {
    const target = e.target as HTMLElement;
    const touch = e.touches[0];
    
    touchStartTimeRef.current = Date.now();
    touchStartPositionRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressRef.current = false;
    
    // 単語要素の場合、長押しタイマーを開始
    if (target.classList.contains('clickable-word')) {
      const word = target.textContent || '';
      
      // デバッグ情報更新
      tapCountRef.current += 1;
      setDebugInfo(`【タップ #${tapCountRef.current}】\nタップ開始: ${word}\n長押し判定中...`);
      
      // 長押しタイマー（800ms）
      longPressTimeoutRef.current = setTimeout(() => {
        if (!isLongPressRef.current) {
          console.log('🔗 長押し検出:', word);
          setDebugInfo(prev => prev + `\n\n🔗 長押し検出！\n800ms経過`);
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
    
    // 長押しタイマーをクリア
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    
    // 長押しが実行された場合は、通常のタップ処理をスキップ
    if (isLongPressRef.current) {
      console.log('長押しが実行済み、通常タップ処理をスキップ');
      setDebugInfo(prev => prev + `\n\n📝 長押し実行済み\n通常タップはスキップ`);
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
    
    // タッチ時間が短すぎる（100ms未満）または移動距離が大きい（10px以上）場合は無視
    if (touchDuration < 100 || moveDistance > 10) {
      console.log(`タッチ無視: 時間=${touchDuration}ms, 移動=${moveDistance.toFixed(1)}px`);
      setDebugInfo(prev => prev + `\n\nタッチ無視:\n時間=${touchDuration}ms\n移動=${moveDistance.toFixed(1)}px`);
      return;
    }
    
    // タッチされた要素が単語要素か確認
    if (target.classList.contains('clickable-word')) {
      const word = target.textContent || '';
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`📱 通常タップ: ${word} (時間=${touchDuration}ms)`);
      
      // デバッグ表示更新
      setDebugInfo(prev => prev + `\n\n📱 通常タップ: ${word}\n時間: ${touchDuration}ms\n→ マイノート追加`);
      
      // 視覚的フィードバック：青色ハイライト（通常タップ）
      target.style.backgroundColor = '#3b82f6';
      target.style.color = 'white';
      setTimeout(() => {
        target.style.backgroundColor = '';
        target.style.color = '';
      }, 500);
      
      // 単語クリック処理を即座に実行
      handleWordClick(word);
    }
  };

  // テキストサイズ変更
  const handleTextSizeChange = (size: 'small' | 'medium' | 'large') => {
    setTextSize(size);
    localStorage.setItem('readingTextSize', size);
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
  const renderClickableText = (text: string) => {
    console.log('🎨 renderClickableText called with:', text.substring(0, 100) + '...');
    
    // しおり機能用のglobalTokenIndex（全体を通した連番）
    let globalTokenIndex = 0;
    
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
        if (/^[a-zA-Z]+$/.test(word)) {
          clickableWordCount++;
          const tokenIndex = globalTokenIndex++;
          return (
            <span
              key={`${partIndex}-${wordIndex}`}
              className={`clickable-word cursor-pointer hover:bg-yellow-200/50 transition-colors duration-200 select-none ${
                highlightedWord === word ? 'bg-yellow-300' : ''
              } ${bookmarkTokenIndex === tokenIndex ? 'bookmark-token' : ''}`}
              title="タップ: 意味を調べる / 長押し: しおり作成"
              data-word={word}
              data-idx={tokenIndex}
              style={{
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation'
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
    <main className="min-h-screen bg-page-bg p-2 sm:p-4">
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
          </div>
        </div>
        
        {mode === 'story' && searchParams.genre && (
          <p className="text-sm text-gray-600">ジャンル: {searchParams.genre}</p>
        )}
      </div>

      {/* コンテンツ表示 */}
      {!isReadingStarted ? (
        <div className="rounded-lg bg-white p-3 sm:p-6 shadow-sm">
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
          <div 
            className={`bg-white rounded-lg p-3 sm:p-6 shadow-sm ${
              isResumeMode ? 'blur-reading' : ''
            }`} 
            style={{ pointerEvents: isResumeMode ? 'none' : 'auto' }}
          >
            <div className="max-w-none" style={{ pointerEvents: isResumeMode ? 'none' : 'auto' }}>
              {englishParagraphs.map((paragraph, index) => {
                console.log(`📝 段落 ${index + 1}:`, paragraph.substring(0, 50) + '...');
                return (
                <div key={index} className="mb-6">
                  {/* 英語段落 */}
                  <p 
                    className={`mb-3 ${getTextSizeClass()} leading-relaxed text-text-primary`}
                    onClick={handleTextClick}
                    onTouchStart={handleTextTouchStart}
                    onTouchEnd={handleTextTouch}
                    style={{ 
                      pointerEvents: 'auto',
                      userSelect: 'auto',
                      touchAction: 'manipulation'
                    }}
                  >
                    {renderClickableText(paragraph)}
                  </p>
                  
                  {/* 対応する日本語段落 */}
                  {showJapanese && japaneseParagraphs[index] && (
                    <div className="rounded-lg border border-[#FFE1B5] bg-page-bg p-4">
                      <p className={`${getTextSizeClass()} italic text-text-primary`}>
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
                      const currentTotal = parseInt(localStorage.getItem('totalWordsRead') || '0', 10);
                      const newTotal = currentTotal + wordCount;
                      // 表示のみ - localStorage は更新しない（読了処理で更新される）
                      return `${newTotal.toLocaleString()} 語`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">スタンプ進捗</p>
                  <p className="text-lg font-bold">
                    {(() => {
                      // 現在の累計語数（読書完了処理前の値）
                      const currentTotal = parseInt(localStorage.getItem('totalWordsRead') || '0', 10);
                      const newTotal = currentTotal + wordCount;
                      const stampsEarned = Math.floor(newTotal / 100) - Math.floor(currentTotal / 100);
                      // 重要: totalStampsは現在の累計から計算（二重加算を防ぐ）
                      const totalStamps = Math.floor(currentTotal / 100) + stampsEarned;
                      const nextStampAt = ((Math.floor(newTotal / 100) + 1) * 100) - newTotal;
                      
                      console.log('📊 スタンプ進捗計算（修正版）:', {
                        currentTotal,
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
                    className="rounded-md bg-green-500 px-4 py-2 font-medium text-white transition-colors hover:bg-green-600"
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
        onComplete={() => setShowStampFlash(false)} 
      />

      {/* モバイル用デバッグ情報表示 */}
      {debugInfo && (
        <div className="fixed top-4 right-4 bg-black text-white p-3 rounded-lg text-xs max-w-sm z-50 opacity-90">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold">デバッグ情報</span>
            <button
              onClick={() => setDebugInfo('')}
              className="text-red-400 ml-2"
            >
              ×
            </button>
          </div>
          <pre className="whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}

      {/* しおり機能のダイアログ */}
      <BookmarkDialog
        isOpen={bookmarkDialog.isOpen}
        onClose={() => setBookmarkDialog({...bookmarkDialog, isOpen: false})}
        onConfirm={() => saveBookmark(bookmarkDialog.tokenIndex, bookmarkDialog.word)}
        word={bookmarkDialog.word}
        conflictLevel={bookmarkDialog.conflictLevel}
        currentLevel={selectedLevel}
      />

      {/* 読書再開ダイアログ */}
      <ResumeDialog
        isOpen={showResumeDialog}
        onResume={() => {
          setShowResumeDialog(false);
          setIsResumeMode(false);
        }}
      />

    </main>
  );
}