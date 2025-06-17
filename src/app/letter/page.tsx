'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getNextCity, getNextUnreachedCity } from '@/lib/getNextCity';
import { letters } from '@/app/data/letterData';
import { getEnglishText } from '@/utils/getEnglishText';
import { getLetterFromStorage } from '@/lib/letterStorage';
import { saveToHistory } from '@/lib/saveToHistory';

function LetterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showNotice, setShowNotice] = useState(false);
  const [diary, setDiary] = useState<any>(null);
  const [letterText, setLetterText] = useState<string>('');
  const [cityImage, setCityImage] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [cityName, setCityName] = useState<string>('');
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [diaryNotFound, setDiaryNotFound] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [calculatedWPM, setCalculatedWPM] = useState<number>(0);
  
  // Dictionary functionality states
  const [wordInfo, setWordInfo] = useState<any>(null);
  const [loadingWordInfo, setLoadingWordInfo] = useState(false);
  const [sessionWords, setSessionWords] = useState<any[]>([]);
  const [definitionLanguage, setDefinitionLanguage] = useState<'ja' | 'en'>('ja');
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [clickedWords, setClickedWords] = useState<any[]>([]);

  // 品詞の日本語マッピング
  const posMap: Record<string, string> = {
    v: "動詞",
    n: "名詞", 
    adj: "形容詞",
    adv: "副詞",
    prep: "前置詞",
    conj: "接続詞",
    pron: "代名詞",
    int: "間投詞",
    unknown: "不明"
  };

  // Dictionary functionality functions
  const saveWordToNotebook = (wordInfo: any) => {
    try {
      const existingNotebook = JSON.parse(localStorage.getItem('myNotebook') || '[]');
      
      const isDuplicate = existingNotebook.some(
        (item: any) => item.word.toLowerCase() === wordInfo.word.toLowerCase()
      );
      
      if (!isDuplicate) {
        existingNotebook.push(wordInfo);
        localStorage.setItem('myNotebook', JSON.stringify(existingNotebook));
        console.log('📝 単語をノートブックに保存:', wordInfo.word);
        return true;
      } else {
        console.log('📝 単語は既にノートブックに存在:', wordInfo.word);
        return false;
      }
    } catch (error) {
      console.error('ノートブック保存エラー:', error);
      return false;
    }
  };

  const isWordInNotebook = (word: string): boolean => {
    try {
      const existingNotebook = JSON.parse(localStorage.getItem('myNotebook') || '[]');
      return existingNotebook.some(
        (item: any) => item.word.toLowerCase() === word.toLowerCase()
      );
    } catch (error) {
      console.error('ノートブック確認エラー:', error);
      return false;
    }
  };

  const getWordContext = (targetWord: string) => {
    const words = letterText.split(/\s+/);
    const targetIndex = words.findIndex(word => 
      word.toLowerCase().replace(/[^a-zA-Z]/g, '') === targetWord.toLowerCase()
    );
    
    if (targetIndex === -1) return letterText.slice(0, 100);
    
    const start = Math.max(0, targetIndex - 5);
    const end = Math.min(words.length, targetIndex + 6);
    return words.slice(start, end).join(' ');
  };

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (cleanWord.length === 0) return;

    const headword = cleanWord.toLowerCase();
    
    // Check if word is already saved to avoid duplicates
    const isInNotebook = isWordInNotebook(headword);
    const isInClickedWords = clickedWords.some(w => w.word.toLowerCase() === headword.toLowerCase());
    
    if (isInNotebook || isInClickedWords) {
      console.log('📝 単語は既に記録済み、処理をスキップ:', headword);
      return;
    }
    
    setSelectedWord(headword);
    
    // Visual feedback - add a subtle animation or highlight
    console.log('📖 単語をクリック:', headword);
    
    try {
      console.log('🔍 辞書情報取得開始:', headword);
      
      // Get context for the word
      const contextSentence = getWordContext(headword);
      console.log('📄 コンテキスト文:', contextSentence);
      
      let wordData = null;
      
      // Try context-word-analysis API first
      try {
        const response = await fetch('/api/context-word-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: headword,
            contextSentence: contextSentence,
            outputLanguage: 'japanese'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ 辞書API応答:', data);
          
          wordData = {
            word: data.word || headword,
            pos: data.pos || 'unknown',
            jaDefinition: data.meaning_ja || '定義が利用できません',
            enDefinition: data.meaning_en || 'Definition not available',
            jaExample: data.example_ja || '',
            enExample: data.example_en || '',
            baseForm: data.base || undefined
          };
        } else {
          console.log('❌ 辞書API失敗:', response.status);
        }
      } catch (apiError) {
        console.error('辞書API呼び出しエラー:', apiError);
      }
      
      // Fallback to simple word info if API failed
      if (!wordData) {
        console.log('⚠️ APIが利用できないため、簡易情報を作成');
        wordData = {
          word: headword,
          pos: 'unknown',
          jaDefinition: '定義が利用できません',
          enDefinition: 'Definition not available',
          jaExample: '',
          enExample: ''
        };
      }
      
      // Store in clicked words array (no modal during reading)
      setClickedWords(prev => [...prev, wordData]);
      
      // Also save to localStorage for notebook
      try {
        const existingClickedWords = JSON.parse(localStorage.getItem('clickedWords') || '[]');
        const updatedClickedWords = [...existingClickedWords, wordData];
        localStorage.setItem('clickedWords', JSON.stringify(updatedClickedWords));
        console.log('💾 単語をclickedWordsに保存:', headword);
      } catch (storageError) {
        console.error('localStorage保存エラー:', storageError);
      }
      
      // Keep existing notebook saving for compatibility
      const notebookInfo = {
        word: wordData.word,
        originalForm: cleanWord,
        partOfSpeech: wordData.pos,
        detailedPos: wordData.pos,
        meaning: wordData.enDefinition,
        japaneseMeaning: wordData.jaDefinition,
        sentence: wordData.enExample,
        sentenceJapanese: wordData.jaExample,
        baseForm: wordData.baseForm
      };
      
      saveWordToNotebook(notebookInfo);
      
      setSessionWords(prev => {
        const isDuplicate = prev.some(w => w.word.toLowerCase() === notebookInfo.word.toLowerCase());
        return isDuplicate ? prev : [...prev, notebookInfo];
      });

    } catch (error) {
      console.error('単語情報の取得に失敗:', error);
      // Create fallback word info
      const fallbackData = {
        word: headword,
        pos: 'unknown',
        jaDefinition: '定義が利用できません',
        enDefinition: 'Definition not available',
        jaExample: '',
        enExample: ''
      };
      
      setClickedWords(prev => [...prev, fallbackData]);
      
      // Save fallback to localStorage as well
      try {
        const existingClickedWords = JSON.parse(localStorage.getItem('clickedWords') || '[]');
        const updatedClickedWords = [...existingClickedWords, fallbackData];
        localStorage.setItem('clickedWords', JSON.stringify(updatedClickedWords));
      } catch (storageError) {
        console.error('localStorage保存エラー:', storageError);
      }
    }
  };

  const showDefinition = async (word: string) => {
    await handleWordClick(word);
  };

  const splitWords = (text: string) =>
    text.split(/\b/).map((w, i) => (
      <span 
        key={i} 
        onClick={() => showDefinition(w)}
        className={/\w/.test(w) ? "cursor-pointer hover:bg-yellow-200 hover:rounded transition-colors" : ""}
        style={/\w/.test(w) ? { padding: '1px 2px' } : {}}
      >
        {w}
      </span>
    ));

  const renderClickableText = (text: string) => {
    return splitWords(text);
  };

  // 都市名変換マップ
  const cityNameMap: { [key: string]: string } = {
    '東京': 'Tokyo',
    'ロンドン': 'London',
    'ニューヨーク': 'New York',
    'ナイロビ': 'Nairobi',
    'シドニー': 'Sydney',
    'Tokyo': 'Tokyo',
    'London': 'London',
    'New York': 'New York',
    'Nairobi': 'Nairobi',
    'Sydney': 'Sydney'
  };


  // 保存されている日記一覧を取得
  const getAllDiaries = () => {
    try {
      const savedDiaries = localStorage.getItem('diaries');
      return savedDiaries ? JSON.parse(savedDiaries) : [];
    } catch (error) {
      console.error('Error parsing diaries from localStorage:', error);
      return [];
    }
  };

  // LocalStorage優先の日記取得（即時表示用）
  const getDiaryFromLocalStorage = (id: string) => {
    try {
      // 1. diary:id 形式で検索
      const diaryKey = `diary:${id}`;
      const savedDiary = localStorage.getItem(diaryKey);
      
      if (savedDiary) {
        const parsedDiary = JSON.parse(savedDiary);
        console.log('⚡ Found diary in localStorage (immediate):', parsedDiary);
        return parsedDiary;
      }

      // 2. 旧形式: diaries配列から検索
      const diaries = getAllDiaries();
      const foundDiary = diaries.find((d: any) => d.id === id);
      if (foundDiary) {
        console.log('⚡ Found diary in diaries array (immediate):', foundDiary);
        return foundDiary;
      }

      console.log('❌ No diary found in localStorage for immediate display');
      return null;
    } catch (error) {
      console.error('Error getting diary from localStorage:', error);
      return null;
    }
  };

  // API取得（バックグラウンド更新用）
  const getDiaryFromAPI = async (id: string) => {
    try {
      console.log(`🌐 Background fetching from API: /api/diary?id=${id}`);
      const response = await fetch(`/api/diary?id=${id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Background API Response:', data.diary);
        
        // APIから取得した日記をlocalStorageに保存
        if (data.diary) {
          localStorage.setItem(`diary:${id}`, JSON.stringify(data.diary));
          console.log('💾 Updated localStorage with API data');
        }
        
        return data.diary;
      } else {
        console.log('❌ Background API response not ok:', response.status);
        return null;
      }
    } catch (error) {
      console.log('⚠️ Background API fetch failed:', error);
      return null;
    }
  };

  const setDiaryData = (foundDiary: any) => {
    setDiary(foundDiary);
    const content = foundDiary.en || foundDiary.letterText || '';
    setLetterText(content);
    setCityName(foundDiary.location || cityNameMap[foundDiary.cityName] || 'Unknown');
    
    // Calculate word count from actual content
    const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0);
    setWordCount(words.length);
    
    setCityImage(foundDiary.cityImage || `/letters/${foundDiary.id}.png`);
    setDiaryNotFound(false);
  };

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowNotice(true);
      const timer = setTimeout(() => setShowNotice(false), 5000);
      return () => clearTimeout(timer);
    }
    
    // 📧 /letter ページに遷移したら通知フラグをクリア
    localStorage.setItem('notified', 'false');
    console.log('📧 Letter page visited, cleared notified flag');
  }, [searchParams]);

  useEffect(() => {
    const loadDiary = async () => {
      // URL から id を取得
      const id = searchParams.get('id');
      console.log('🔍 diary.id:', id);

      // 📧 PRIORITY 1: Check for stored letter/mail content first
      const storedLetter = getLetterFromStorage();
      console.log('📧 Checking stored letter first:', storedLetter);
      
      if (storedLetter) {
        // Use stored letter/mail content
        const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
        let contentToShow = '';
        
        if (storedLetter.en && storedLetter.en[userLevel]) {
          contentToShow = storedLetter.en[userLevel];
        } else if (storedLetter.en) {
          // Use first available level if exact level not found
          const availableLevels = Object.keys(storedLetter.en).map(Number);
          if (availableLevels.length > 0) {
            contentToShow = storedLetter.en[availableLevels[0]];
          }
        }
        
        console.log('📧 Using stored letter/mail content:', { 
          type: storedLetter.type, 
          hasContent: !!contentToShow,
          contentLength: contentToShow.length 
        });
        
        setLetterText(contentToShow);
        setCityName(storedLetter.fromCity || storedLetter.city || 'Tokyo');
        setCityImage(storedLetter.cityImage || '/letters/tokyo.png');
        setDiaryNotFound(false);
        
        // Create diary structure from stored letter
        const letterDiary = {
          id: 1,
          en: contentToShow,
          jp: storedLetter.jp,
          location: storedLetter.fromCity || storedLetter.city || 'Tokyo',
          cityName: storedLetter.fromCity || storedLetter.city || '東京',
          cityImage: storedLetter.cityImage || '/letters/tokyo.png',
          type: storedLetter.type
        };
        setDiary(letterDiary);
        
        // Calculate word count
        const words = contentToShow.trim().split(/\s+/).filter((word: string) => word.length > 0);
        setWordCount(words.length);
        
        // Skip the rest if we have stored content
        console.log('📧 Successfully loaded stored letter/mail content');
        return;
      }
      
      // 📧 FALLBACK: Use letterData[0] (Narita Airport letter) only if no stored content
      console.log('📧 No stored content found, using Narita fallback');
      const naritaLetter = letters[0];
      const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
      
      // Get appropriate English content using utility function
      const englishContent = getEnglishText(naritaLetter.en, userLevel);
      
      console.log('📧 Using Narita letter as fallback with level:', { userLevel, hasLevel: !!naritaLetter.en[userLevel] });
      
      // Set letterData content as fallback
      setLetterText(englishContent);
      setCityName('Tokyo');
      setCityImage('/letters/tokyo.png');
      setDiaryNotFound(false);
      
      // Create diary structure for compatibility
      const letterDiary = {
        id: 1,
        en: englishContent,
        jp: naritaLetter.jp,
        location: 'Tokyo',
        cityName: '東京',
        cityImage: '/letters/tokyo.png'
      };
      setDiary(letterDiary);
      
      // Calculate word count
      const words = englishContent.trim().split(/\s+/).filter((word: string) => word.length > 0);
      setWordCount(words.length);

      if (id) {
        // Step 1: まず localStorage をチェック（diary:<id> 形式）
        const diaryKey = `diary:${id}`;
        const savedDiary = localStorage.getItem(diaryKey);
        
        if (savedDiary) {
          try {
            const diaryData = JSON.parse(savedDiary);
            console.log('⚡ Found in localStorage, immediate display:', diaryData);
            
            // 即座に表示データをセット
            setDiary(diaryData);
            setLetterText(diaryData.en || '');
            setCityName(diaryData.location || cityNameMap[diaryData.cityName] || 'Unknown');
            setCityImage(diaryData.cityImage || `/letters/${id}.png`);
            
            // Calculate word count
            const content = diaryData.en || '';
            const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0);
            setWordCount(words.length);
            
            setDiaryNotFound(false);
            
            // Step 2: バックグラウンドでAPI fetchを実行（非同期、ノンブロッキング）
            getDiaryFromAPI(id).then(apiDiary => {
              if (apiDiary) {
                console.log('🔄 Background update from API');
                // API データで更新（あれば）
                setDiary(apiDiary);
                setLetterText(apiDiary.en || '');
                setCityName(apiDiary.location || cityNameMap[apiDiary.cityName] || 'Unknown');
                setCityImage(apiDiary.cityImage || `/letters/${id}.png`);
                
                const newContent = apiDiary.en || '';
                const newWords = newContent.trim().split(/\s+/).filter((word: string) => word.length > 0);
                setWordCount(newWords.length);
              }
            }).catch(error => {
              console.log('Background API fetch failed, but localStorage data already displayed:', error);
            });
            
          } catch (error) {
            console.error('Error parsing localStorage diary:', error);
            // パースエラーの場合はAPI fetchにフォールバック
            await fetchFromAPIOnly(id);
          }
        } else {
          // Step 3: localStorage にない場合のみ API 取得を待機
          console.log('⏳ No localStorage data, fetching from API...');
          await fetchFromAPIOnly(id);
        }
      } else {
        // URLにidがない場合は従来のロジック
        handleNoIdCase();
      }
    };

    // API のみから取得する関数（ブロッキング）
    const fetchFromAPIOnly = async (id: string) => {
      try {
        const apiDiary = await getDiaryFromAPI(id);
        
        if (apiDiary) {
          console.log('✅ Loaded from API');
          setDiary(apiDiary);
          setLetterText(apiDiary.en || '');
          setCityName(apiDiary.location || cityNameMap[apiDiary.cityName] || 'Unknown');
          setCityImage(apiDiary.cityImage || `/letters/${id}.png`);
          
          const content = apiDiary.en || '';
          const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0);
          setWordCount(words.length);
          
          setDiaryNotFound(false);
        } else {
          console.log('❌ 日記が見つかりません for id:', id);
          setDiaryNotFound(true);
        }
      } catch (error) {
        console.error('API fetch error:', error);
        setDiaryNotFound(true);
      }
    };

    // ID がない場合の処理
    const handleNoIdCase = () => {
      // Use safe letter storage function instead of direct localStorage access
      const storedLetter = getLetterFromStorage();
      const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
      
      const savedCityImage = localStorage.getItem('cityImage') || '';
      const lastCity = localStorage.getItem('lastCity') || '';

      const fallbackLetterText = `Hello from your travel companion!

I'm writing to you from this amazing city. The culture here is fascinating and the people are incredibly welcoming.

I've been exploring the local markets and trying new foods. Every day brings a new adventure!

Looking forward to our next journey together.

Your Cat`;

      // Extract appropriate content from stored letter or use fallback
      let content = fallbackLetterText;
      if (storedLetter && storedLetter.en && storedLetter.en[userLevel]) {
        content = storedLetter.en[userLevel];
      } else if (storedLetter && storedLetter.en) {
        // Use first available level if exact level not found
        const availableLevels = Object.keys(storedLetter.en).map(Number);
        if (availableLevels.length > 0) {
          content = storedLetter.en[availableLevels[0]];
        }
      }
      setLetterText(content);
      setCityImage(savedCityImage || '/letters/tokyo.png');
      
      const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0);
      setWordCount(words.length);
      
      setCityName(cityNameMap[lastCity] || lastCity || 'Tokyo');
      setDiaryNotFound(false);
    };

    loadDiary();
  }, [searchParams]);

  // WPM履歴の保存と平均計算
  const saveWPMHistory = (wpm: number) => {
    const wpmHistory = JSON.parse(localStorage.getItem('wpmHistory') || '[]');
    wpmHistory.push(wpm);
    // 直近5回分のみ保持
    if (wpmHistory.length > 5) {
      wpmHistory.shift();
    }
    localStorage.setItem('wpmHistory', JSON.stringify(wpmHistory));
  };

  const getAverageWPM = (): number => {
    const wpmHistory = JSON.parse(localStorage.getItem('wpmHistory') || '[]');
    if (wpmHistory.length === 0) return 0;
    const sum = wpmHistory.reduce((acc: number, wpm: number) => acc + wpm, 0);
    return Math.round(sum / wpmHistory.length);
  };

  const handleStartReading = () => {
    setHasStarted(true);
    setStartTime(Date.now());
  };

  const handleComplete = () => {
    setIsCompleted(true);
    const currentTime = Date.now();
    setEndTime(currentTime);
    
    // 読書時間計算（語数に関係なく計算）
    let duration = 0;
    if (startTime) {
      duration = currentTime - startTime; // ミリ秒
      console.log('📧 Duration calculated:', { startTime, currentTime, duration, durationMinutes: duration / 60000 });
    } else {
      console.log('⚠️ startTime is null, cannot calculate duration');
    }
    
    // 語数更新
    const currentTotal = parseInt(localStorage.getItem('wordCount') || '0', 10);
    const newTotal = currentTotal + wordCount;
    localStorage.setItem('wordCount', newTotal.toString());
    
    // 新都市を取得して保存
    const nextCity = getNextCity(newTotal);
    localStorage.setItem('lastCity', nextCity.cityName);
    console.log('🗺️ 次に訪れる都市:', nextCity.cityName);

    // 📧 Save mail/letter to history with proper metrics
    const storedLetter = getLetterFromStorage();
    if (storedLetter) {
      const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
      const catName = localStorage.getItem('catName') || 'Your cat';
      
      // Calculate actual word count from displayed content
      const actualContent = storedLetter.en[userLevel] || Object.values(storedLetter.en)[0] || '';
      const actualWordCount = actualContent.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
      
      // Recalculate WPM with actual word count
      let actualWPM = 0;
      if (duration > 0 && actualWordCount > 0) {
        const timeInMinutes = duration / (1000 * 60);
        actualWPM = Math.round(actualWordCount / timeInMinutes);
        console.log('📧 WPM calculation:', { actualWordCount, duration, timeInMinutes, actualWPM });
      } else {
        console.log('⚠️ Cannot calculate WPM:', { duration, actualWordCount });
      }
      
      console.log('📧 Actual metrics calculated:', { 
        actualWordCount, 
        duration, 
        actualWPM,
        stateWordCount: wordCount 
      });
      
      if (storedLetter.type === 'mail') {
        // Save mail to history
        saveToHistory({
          type: "mail",
          title: `In-flight from ${storedLetter.fromCity || 'Tokyo'} to ${storedLetter.toCity || 'Seoul'}`,
          contentJP: storedLetter.jp,
          contentEN: actualContent,
          level: userLevel,
          wordCount: actualWordCount,
          duration: duration,
          wpm: actualWPM,
          fromCity: storedLetter.fromCity || 'Tokyo',
          toCity: storedLetter.toCity || 'Seoul',
          milestone: Math.round(parseInt(localStorage.getItem('elapsedReadingTime') || '0', 10) / 60000), // Convert to minutes
        });
        console.log('📧 Mail saved to history with metrics:', { wordCount: actualWordCount, duration, wpm: actualWPM });
      } else {
        // Save letter to history
        saveToHistory({
          type: "letter",
          title: `A letter from ${storedLetter.city || cityName}`,
          contentJP: storedLetter.jp,
          contentEN: actualContent,
          level: userLevel,
          wordCount: actualWordCount,
          duration: duration,
          wpm: actualWPM,
          city: storedLetter.city || cityName,
        });
        console.log('📧 Letter saved to history with metrics:', { wordCount: actualWordCount, duration, wpm: actualWPM });
      }
      
      // Update the displayed wordCount and WPM states with actual values
      setWordCount(actualWordCount);
      setCalculatedWPM(actualWPM);
      
      // Save WPM to history if valid
      if (actualWPM > 0) {
        saveWPMHistory(actualWPM);
        console.log('📧 WPM saved to history:', actualWPM);
      }
    }
  };

  const handleToggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  const handleReadAgain = () => {
    setHasStarted(false);
    setIsCompleted(false);
    setShowTranslation(false);
  };

  const handleChooseNext = () => {
    router.push('/choose');
  };

  // 📧 Part 3: Safe letter storage usage for display
  const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
  
  // Try to get letter from storage first, then fallback to letterData
  const storedLetter = getLetterFromStorage();
  const fallbackLetter = letters[0]; // Narita Airport letter as fallback
  
  let letter, englishText;
  
  if (storedLetter && storedLetter.en && storedLetter.en[userLevel]) {
    letter = storedLetter;
    englishText = storedLetter.en[userLevel];
    console.log('📧 Using stored letter with safe parsing');
  } else if (fallbackLetter) {
    letter = fallbackLetter;
    englishText = getEnglishText(fallbackLetter.en, userLevel);
    console.log('📧 Fallback to letterData');
  } else {
    console.error('📧 No letter available');
    letter = null;
    englishText = '手紙の読み込みに失敗しました。';
  }
  
  console.log('📧 Safe letter usage:', { userLevel, letterExists: !!letter, englishLength: englishText.length });
  
  // Split letterText into paragraphs (段落分割)
  console.log('📄 Letter page - diary:', diary);
  console.log('📄 Letter page - letterText:', letterText);
  console.log('📄 Letter page - diary?.en:', diary?.en);
  
  // Use safe letter content for display
  let contentToDisplay = englishText;
  console.log('📄 Using safe letter content');
  
  const enParagraphs = contentToDisplay
    ? contentToDisplay.split(/\n+/).filter(p => p.trim() !== '')
    : [];

  const jpParagraphs = letter && letter.jp
    ? letter.jp.split(/\n+/).filter(p => p.trim() !== '')
    : [];

  // max length に合わせてループ
  const pairedParagraphs = enParagraphs.map((en, idx) => ({
    en,
    jp: jpParagraphs[idx] || '', // 対応する日本語訳（なければ空）
  }));
    
  console.log('📄 Letter page - contentToDisplay:', contentToDisplay);
  console.log('📄 Letter page - enParagraphs:', enParagraphs);
  console.log('📄 Letter page - jpParagraphs:', jpParagraphs);
  console.log('📄 Letter page - pairedParagraphs:', pairedParagraphs);

  return (
    <main className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        {showNotice && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded shadow animate-fade-in">
            {(() => {
              const storedLetter = getLetterFromStorage();
              const isMailType = storedLetter?.type === 'mail';
              return isMailType ? '✉️ 新しいメールが届きました！' : '✨ 新しい手紙が届きました！';
            })()}
          </div>
        )}
        {/* ① 動的タイトル：手紙・メール type に応じて分岐 */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {(() => {
            const letter = getLetterFromStorage();
            const catName = localStorage.getItem("catName") || "Your cat";
            
            if (letter?.type === "letter" && letter?.city) {
              return `📮 A letter from ${letter.city}`;
            } else if (letter?.type === "mail" && letter?.fromCity) {
              return `✉️ ${catName} からの未読メール`;
            } else {
              return `📮 A Letter from ${cityName}`;
            }
          })()}
        </h1>

        {/* 日記が見つからない場合の表示 */}
        {diaryNotFound && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">😿</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">日記が見つかりません</h2>
            <p className="text-gray-600 mb-6">
              指定されたIDの日記は存在しないか、まだ作成されていません。
            </p>
            <button
              onClick={() => router.push('/choose')}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
            >
              📚 他のものを読む
            </button>
          </div>
        )}

        {/* ② 「読み始める」ボタン（初期表示のみ） */}
        {!diaryNotFound && !hasStarted && (
          <div className="text-center mb-8">
            <button
              onClick={handleStartReading}
              className="bg-orange-400 text-white py-4 px-8 rounded-xl text-lg font-medium hover:bg-orange-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              📖 読み始める
            </button>
          </div>
        )}

        {/* hasStarted = true のときに手紙内容と画像を表示 */}
        {!diaryNotFound && hasStarted && (
          <>
            {/* 手紙本文（段落分け + クリック可能な語） */}
            <div className="letter-content mb-8 space-y-6">
              {!letter?.en?.[userLevel] ? (
                <p className="text-red-600 text-center py-4">
                  手紙の読み込みに失敗しました。
                </p>
              ) : pairedParagraphs.length > 0 ? (
                pairedParagraphs.map((pair, index) => (
                  <div key={index}>
                    <p className="text-gray-700 leading-relaxed mb-1 text-lg">
                      {renderClickableText(pair.en)}
                    </p>
                    {showTranslation && (
                      <p className="text-gray-600 leading-relaxed text-sm">{pair.jp}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  No letter content available. Please check localStorage.
                </p>
              )}
            </div>

            {/* ✅ 読了ボタン（手紙と画像の間） */}
            {!isCompleted && (
              <div className="text-center mb-8">
                <button
                  onClick={handleComplete}
                  className="bg-orange-400 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  ✅ 読了
                </button>
              </div>
            )}

            {/* 📊 進捗情報まとめ（読了後に表示） */}
            {isCompleted && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">📊 読書進捗まとめ</h3>
                <div className="space-y-3 text-gray-700">
                  <p className="text-sm">今回の語数：<span className="font-semibold">{wordCount}語</span></p>
                  <p className="text-sm">今回のWPM：<span className="font-semibold">{calculatedWPM}</span></p>
                  <p className="text-sm">平均WPM（直近5回）：<span className="font-semibold">{getAverageWPM()}</span></p>
                  <p className="text-sm">これまでの合計語数：<span className="font-semibold">{(parseInt(localStorage.getItem('wordCount') || '0', 10)).toLocaleString()}語</span></p>
                  {(() => {
                    const totalWords = parseInt(localStorage.getItem('wordCount') || '0', 10);
                    const nextCity = getNextUnreachedCity(totalWords);
                    return nextCity ? (
                      <p className="text-sm">次の目的地：<span className="font-semibold">{nextCity.cityName}</span>（あと <span className="font-semibold text-orange-600">{(nextCity.requiredWords - totalWords).toLocaleString()}語</span>）</p>
                    ) : (
                      <p className="text-sm font-semibold text-green-600">🎉 すべての都市に到達済みです！</p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 都市画像（ネコ入り） - photoTierがnoneでない場合のみ表示 */}
            {cityImage && diary?.photoTier !== "none" && (
              <img 
                src={cityImage}
                alt="City illustration"
                className="w-full mt-4 rounded-xl mb-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}

            {/* 日本語訳（トグル表示） */}
          

            {/* ⑦ 読了後に表示する3つのボタン */}
            {isCompleted && (
              <>
                <div className="flex flex-col md:flex-row justify-center gap-4 mt-6 mb-8">
                  <button 
                    onClick={handleToggleTranslation}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                  >
                    🌐 日本語訳を見る
                  </button>
                  <button 
                    onClick={handleReadAgain}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                  >
                    🔁 もう一度読む
                  </button>
                  <button 
                    onClick={handleChooseNext}
                    className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                  >
                    📚 他のものを読む
                  </button>
                </div>

                {/* 今日のマイノート（読了後に表示） */}
                {clickedWords.length > 0 && (
                  <div className="bg-[#FFF9F4] border border-[#C9A86C] rounded-xl p-6 mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-[#1E1E1E] text-lg">📝 今日のマイノート</h3>
                    </div>
                    
                    <p className="text-sm text-[#1E1E1E] mb-4">
                      クリックした単語 {clickedWords.length}個
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      {clickedWords.map((word, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-[#C9A86C]">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-lg text-[#1E1E1E]">{word.word}</span>
                                  {word.pos && (
                                    <span className="text-xs bg-[#FFE1B5] text-[#7E6944] px-2 py-1 rounded-full">
                                      {posMap[word.pos] || "不明"}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-sm text-[#1E1E1E]">
                                  <p className="font-medium">意味：</p>
                                  <p>{word.jaDefinition || '定義が見つかりません'}</p>
                                </div>
                                
                                {word.enExample && (
                                  <div className="text-sm text-[#1E1E1E]">
                                    <p className="font-medium">例文：</p>
                                    <p className="italic">{word.enExample}</p>
                                    {word.jaExample && (
                                      <p className="text-xs text-gray-600 mt-1">{word.jaExample}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => window.location.href = '/notebook'}
                      className="w-full bg-[#FFE1B5] text-[#1E1E1E] px-6 py-3 rounded-md font-medium hover:bg-[#E5C590] transition-colors"
                    >
                      📚 マイノートを見る
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Dictionary Modal - Only show when not reading */}
        {showDictionaryModal && wordInfo && !hasStarted && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📖 単語の定義</h3>
                  <button
                    onClick={() => setShowDictionaryModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Loading state */}
                {loadingWordInfo && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
                    <p className="text-gray-600">定義を取得中...</p>
                  </div>
                )}

                {/* Word definition content */}
                {!loadingWordInfo && wordInfo && (
                  <div className="space-y-4">
                    {/* Word header */}
                    <div className="border-b border-gray-200 pb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-800">{wordInfo.word}</span>
                        {wordInfo.baseForm && wordInfo.baseForm !== wordInfo.word && (
                          <span className="text-sm text-gray-500">({wordInfo.baseForm})</span>
                        )}
                        {wordInfo.partOfSpeech && wordInfo.partOfSpeech !== 'unknown' && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            {wordInfo.partOfSpeech}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meaning */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">🔍 意味</h4>
                      <div className="space-y-2">
                        <p className="text-gray-800">
                          <span className="font-medium">日本語:</span> {wordInfo.japaneseMeaning}
                        </p>
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">English:</span> {wordInfo.meaning}
                        </p>
                      </div>
                    </div>

                    {/* Example sentences */}
                    {(wordInfo.sentence || wordInfo.sentenceJapanese) && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">💭 例文</h4>
                        <div className="space-y-2">
                          {wordInfo.sentence && (
                            <p className="text-gray-800 italic">
                              "{wordInfo.sentence}"
                            </p>
                          )}
                          {wordInfo.sentenceJapanese && (
                            <p className="text-gray-600 text-sm">
                              "{wordInfo.sentenceJapanese}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowDictionaryModal(false)}
                          className="flex-1 bg-orange-400 hover:bg-orange-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          ✅ OK
                        </button>
                        <button
                          onClick={() => window.location.href = '/notebook'}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          📚 ノートを見る
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reading mode: Show clicked words counter */}
        {hasStarted && !isCompleted && clickedWords.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-orange-100 border border-orange-300 rounded-lg px-4 py-2 shadow-lg">
            <div className="text-sm text-orange-700 font-medium">
              📖 保存済み単語: {clickedWords.length}個
            </div>
            <div className="text-xs text-orange-600">
              辞書は読了後に確認できます
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LetterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">読み込み中...</div>}>
      <LetterPageContent />
    </Suspense>
  );
}