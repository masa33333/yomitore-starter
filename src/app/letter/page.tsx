'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getNextCity, getNextUnreachedCity } from '@/lib/getNextCity';
import { letters } from '@/app/data/letterData';
import { getEnglishText } from '@/utils/getEnglishText';
import { getCurrentRouteLetter, saveLetterToStorage } from '@/lib/letterStorage';
import { saveToHistory } from '@/lib/saveToHistory';
// import { processNextInQueue, checkForPendingMailAfterLetterCompletion } from '@/lib/letterPriorityUtils'; // スタンプカード統合で一時停止
import '@/lib/testMailGeneration'; // テスト用ユーティリティを読み込み
// import '@/lib/forceMailDisplay'; // 緊急メール表示テスト（スタンプカード統合で一時停止）
import TTSButton from '@/components/TTSButton';

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
  const [contentDecision, setContentDecision] = useState<any>(null);

  // 📮 到着手紙専用のレンダリング関数
  const renderArrivalLetter = (letterData: any, currentUserLevel: number, paragraphs: any[]) => {
    console.log('📮 Rendering arrival letter content');
    
    // letter type content header
    const letterHeader = (
      <div className="border-l-4 border-[#FFB86C] pl-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-[#FFB86C] text-lg">📮</span>
            <span className="ml-2 text-[#1E1E1E] font-semibold">到着手紙</span>
          </div>
          {letterData?.en && (
            <TTSButton
              text={letterData.en}
              contentId={`arrival-letter-${cityName}`}
              variant="secondary"
              className="text-sm"
            />
          )}
        </div>
      </div>
    );

    // letter content validation
    if (!letterData?.en) {
      return (
        <>
          {letterHeader}
          <p className="text-red-600 text-center py-4">
            手紙の読み込みに失敗しました。
          </p>
        </>
      );
    }

    // letter content rendering
    return (
      <>
        {letterHeader}
        {paragraphs.length > 0 ? (
          paragraphs.map((pair, index) => (
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
            手紙の内容を読み込めませんでした。
          </p>
        )}
      </>
    );
  };

  // 📧 機内メール専用のレンダリング関数
  const renderInFlightMail = () => {
    console.log('📧 Rendering in-flight mail content');
    
    // mail type content header
    const mailHeader = (
      <div className="border-l-4 border-orange-500 pl-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-orange-600 text-lg">✉️</span>
            <span className="ml-2 text-orange-600 font-semibold">機内メール</span>
          </div>
          {diary?.en && (
            <TTSButton
              text={diary.en}
              contentId={`in-flight-mail-${Date.now()}`}
              variant="secondary"
              className="text-sm"
            />
          )}
        </div>
      </div>
    );

    // 📧 保存されたメールの構造に合わせて取得
    // 構造: { en: string, jp: string } (レベル別ではない)
    const mailContent = diary?.en || '';
    const mailJpContent = diary?.jp || '';
    
    console.log('📧 Mail content structure:', { 
      hasEn: !!mailContent, 
      hasJp: !!mailJpContent,
      enType: typeof mailContent,
      enLength: mailContent?.length || 0
    });
    
    if (!mailContent) {
      return (
        <>
          {mailHeader}
          <p className="text-red-600 text-center py-4">
            メールの読み込みに失敗しました。
          </p>
        </>
      );
    }

    // mail content paragraph splitting
    const mailParagraphs = mailContent.split(/\n+/).filter(p => p.trim() !== '');
    const mailJpParagraphs = mailJpContent.split(/\n+/).filter(p => p.trim() !== '');
    
    const pairedMailParagraphs = mailParagraphs.map((en, idx) => ({
      en,
      jp: mailJpParagraphs[idx] || '',
    }));

    // mail content rendering
    return (
      <>
        {mailHeader}
        {pairedMailParagraphs.length > 0 ? (
          pairedMailParagraphs.map((pair, index) => (
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
            メールの内容を読み込めませんでした。
          </p>
        )}
      </>
    );
  };

  // メール生成用のヘルパー関数
  const generateTestMail = async (fromCity: string, toCity: string) => {
    try {
      const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
      const catName = localStorage.getItem('catName') || 'Your cat';
      
      // テスト用のメールコンテンツ
      const testMailContent = {
        en: `Hello from high above the clouds!

I'm writing to you during my flight from ${fromCity} to ${toCity}. The view from up here is absolutely breathtaking! I can see the vast landscape stretching endlessly below us.

The flight attendant just served some delicious fish - exactly what a traveling cat like me needs. I've been thinking about all the reading you've been doing, and it fills my heart with joy.

Your dedication to reading is what makes this incredible journey possible. Every word you read gives me the strength to fly further and discover new places.

I can't wait to share more adventures with you from ${toCity}. Keep reading, my dear friend!

Love,
${catName}`,
        jp: `雲の上からこんにちは！

${fromCity}から${toCity}への飛行中に手紙を書いています。ここからの景色は本当に息をのむほど美しいです！眼下には果てしなく続く大地が見えます。

客室乗務員さんがおいしいお魚を出してくれました。旅するネコの私にはぴったりです。あなたがずっと読書を続けてくれていることを思うと、心が喜びでいっぱいになります。

あなたの読書への献身が、この素晴らしい旅を可能にしているのです。あなたが読む一つ一つの言葉が、私がより遠くまで飛び、新しい場所を発見する力を与えてくれます。

${toCity}からもっと多くの冒険をあなたと分かち合えるのが楽しみです。読書を続けてくださいね、親愛なる友よ！

愛を込めて、
${catName}`
      };

      const wordCount = testMailContent.en.trim().split(/\s+/).filter(word => word.length > 0).length;
      const estimatedDuration = Math.max(1800000, wordCount * 60000 / 200); // 最低30分、または200WPMでの推定時間
      const estimatedWPM = Math.round(wordCount / (estimatedDuration / 60000));

      const mailData = {
        type: "letter" as const, // スタンプカード統合でmailタイプ廃止
        jp: testMailContent.jp,
        en: {
          [userLevel]: testMailContent.en
        },
        fromCity,
        toCity,
        level: userLevel,
        wordCount: wordCount,
        duration: estimatedDuration,
        wpm: estimatedWPM,
        catName: catName,
      };

      console.log('📧 Saving test mail to storage:', mailData);
      saveLetterToStorage(mailData);
      
      return mailData;
    } catch (error) {
      console.error('❌ Failed to generate test mail:', error);
      return null;
    }
  };

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
    
    // 📧 /letter ページに遷移したら全ての通知フラグをクリア（同期）
    // 通知クリア（旧notificationUtilsから移行）
    localStorage.removeItem('hasNewLetter');
    localStorage.setItem('notified', 'false');
    localStorage.setItem('mailNotified', 'false');
    console.log('📬 Letter page notification cleared');
    console.log('📧 Letter page visited, all notification flags cleared synchronously');
  }, [searchParams]);

  useEffect(() => {
    const loadDiary = async () => {
      // Seoul手紙の事前保存チェック
      try {
        const { preloadSeoulLetter, shouldPreloadSeoulLetter, isSeoulLetterPreloaded } = await import('@/lib/preloadSeoulLetter');
        const totalWords = parseInt(localStorage.getItem('wordCountTotal') || '0', 10);
        
        console.log('📮 Seoul letter preload check:', {
          totalWords,
          shouldPreload: shouldPreloadSeoulLetter(totalWords),
          isPreloaded: isSeoulLetterPreloaded()
        });
        
        // 一時的に強制的にSeoul手紙を保存してテスト
        console.log('📮 Force preloading Seoul letter for testing...');
        await preloadSeoulLetter();
        
      } catch (error) {
        console.error('❌ Failed to preload Seoul letter:', error);
      }
      
      // URL から id を取得
      const id = searchParams.get('id');
      console.log('🔍 diary.id:', id);

      // 📧 PRIORITY SYSTEM: Determine what content to show based on conditions
      console.log('📧 Loading letter page, checking content availability...');
      
      const { determineContentToShow, debugContentState } = await import('@/lib/letterDisplayHelpers');
      debugContentState(); // デバッグ情報を表示
      const decision = determineContentToShow();
      setContentDecision(decision);
      console.log('📧 Content decision:', decision);
      
      let storedLetter = null;
      let inFlightMail = null;
      
      if (decision.type === 'letter') {
        storedLetter = getCurrentRouteLetter();
        console.log('📮 Priority 1 - Letter content:', storedLetter);
      } else if (decision.type === 'mail') {
        // 📧 メール機能はスタンプカード統合で一時停止
        // inFlightMail = getInFlightMail();
        console.log('📧 Mail functionality disabled for stamp card integration');
        inFlightMail = null;
      } else {
        console.log('❌ No content available to show:', decision.reason);
      }
      
      // 📮 Seoul letter loading handled by existing letterStorage system
      
      // 📮 Handle letter content (priority 1)
      if (storedLetter && decision.type === 'letter') {
        const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
        let contentToShow = '';
        
        if (storedLetter.en && storedLetter.en[userLevel]) {
          contentToShow = storedLetter.en[userLevel];
        } else if (storedLetter.en) {
          const availableLevels = Object.keys(storedLetter.en).map(Number);
          if (availableLevels.length > 0) {
            contentToShow = storedLetter.en[availableLevels[0]];
          }
        }
        
        console.log('📮 Using stored letter content:', { 
          type: storedLetter.type, 
          hasContent: !!contentToShow,
          contentLength: contentToShow.length 
        });
        
        setLetterText(contentToShow);
        setCityName(storedLetter.toCity || 'Tokyo');
        
        const cityImageMap: { [key: string]: string } = {
          'Tokyo': '/letters/tokyo.png',
          'Seoul': '/letters/seoul.png',
          'Beijing': '/letters/beijing.png'
        };
        const fallbackImage = cityImageMap[storedLetter.toCity] || '/letters/tokyo.png';
        setCityImage(storedLetter.cityImage || fallbackImage);
        setDiaryNotFound(false);
        
        const letterDiary = {
          id: 1,
          en: contentToShow,
          jp: storedLetter.jp,
          location: storedLetter.toCity || 'Tokyo',
          cityName: storedLetter.toCity || '東京',
          cityImage: storedLetter.cityImage || '/letters/tokyo.png',
          type: storedLetter.type
        };
        setDiary(letterDiary);
        
        const words = contentToShow.trim().split(/\s+/).filter((word: string) => word.length > 0);
        setWordCount(words.length);
        
        console.log('📮 Successfully loaded stored letter content');
        return;
      }
      
      // 📮 Fallback: Load static letter data if no stored letter found
      if (decision.type === 'letter' && decision.toCity) {
        console.log('📮 No stored letter found, loading static letter data for:', decision.toCity);
        console.log('📮 Debug: toCity lowercase:', decision.toCity.toLowerCase());
        try {
          const staticLetterData = await import(`@/app/letters/${decision.toCity.toLowerCase()}/text.json`);
          console.log('📮 Static letter data loaded successfully:', staticLetterData);
          const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
          console.log('📮 User level:', userLevel);
          console.log('📮 Available levels in static data:', Object.keys(staticLetterData.en || {}));
          
          let contentToShow = '';
          if (staticLetterData.en && staticLetterData.en[userLevel]) {
            contentToShow = staticLetterData.en[userLevel];
            console.log('📮 Using exact level match:', userLevel);
          } else if (staticLetterData.en) {
            const availableLevels = Object.keys(staticLetterData.en).map(Number);
            console.log('📮 Available levels (numbers):', availableLevels);
            if (availableLevels.length > 0) {
              contentToShow = staticLetterData.en[availableLevels[0]];
              console.log('📮 Using fallback level:', availableLevels[0]);
            }
          }
          
          if (contentToShow) {
            console.log('📮 Successfully loaded static letter:', { 
              city: decision.toCity,
              contentLength: contentToShow.length 
            });
            
            setLetterText(contentToShow);
            setCityName(decision.toCity);
            
            const cityImageMap: { [key: string]: string } = {
              'Tokyo': '/letters/tokyo.png',
              'Seoul': '/letters/seoul.png',
              'Beijing': '/letters/beijing.png'
            };
            setCityImage(cityImageMap[decision.toCity] || '/letters/tokyo.png');
            setDiaryNotFound(false);
            
            const letterDiary = {
              id: 1,
              en: contentToShow,
              jp: staticLetterData.jp || '',
              location: decision.toCity,
              cityName: decision.toCity,
              cityImage: cityImageMap[decision.toCity] || '/letters/tokyo.png',
              type: 'letter'
            };
            setDiary(letterDiary);
            
            const words = contentToShow.trim().split(/\s+/).filter((word: string) => word.length > 0);
            setWordCount(words.length);
            
            return;
          }
        } catch (error) {
          console.error('❌ Failed to load static letter data:', error);
          console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            toCity: decision.toCity,
            expectedPath: `@/app/letters/${decision.toCity.toLowerCase()}/text.json`
          });
          
          // エラーの場合は fallback content を設定
          const fallbackContent = `Hello from ${decision.toCity}!\n\nI'm writing to you from this amazing city. Unfortunately, there was a problem loading my detailed letter.\n\nI'll try to send you a proper letter next time!\n\nLove,\nYour traveling cat`;
          
          setLetterText(fallbackContent);
          setCityName(decision.toCity);
          
          const cityImageMap: { [key: string]: string } = {
            'Tokyo': '/letters/tokyo.png',
            'Seoul': '/letters/seoul.png',
            'Beijing': '/letters/beijing.png'
          };
          setCityImage(cityImageMap[decision.toCity] || '/letters/tokyo.png');
          setDiaryNotFound(false);
          
          const letterDiary = {
            id: 1,
            en: fallbackContent,
            jp: 'エラーのため手紙の読み込みに失敗しました。',
            location: decision.toCity,
            cityName: decision.toCity,
            cityImage: cityImageMap[decision.toCity] || '/letters/tokyo.png',
            type: 'letter'
          };
          setDiary(letterDiary);
          
          const words = fallbackContent.trim().split(/\s+/).filter((word: string) => word.length > 0);
          setWordCount(words.length);
          
          console.log('📮 Set fallback letter content due to loading error');
        }
      }
      
      // 📧 Handle in-flight mail content (priority 2)
      if (inFlightMail && decision.type === 'mail') {
        console.log('📧 Processing stored in-flight mail structure:', inFlightMail);
        
        // 📧 保存されたメールの構造に合わせて処理
        // 構造: { en: string, jp: string } (レベル別ではない)
        const contentToShow = inFlightMail.en || '';
        
        console.log('📧 Using stored in-flight mail content:', { 
          type: inFlightMail.type, 
          hasContent: !!contentToShow,
          contentLength: contentToShow.length,
          fromCity: inFlightMail.fromCity,
          toCity: inFlightMail.toCity
        });
        
        setLetterText(contentToShow);
        setCityName(`${inFlightMail.fromCity}-${inFlightMail.toCity}`);
        
        const cityImageMap: { [key: string]: string } = {
          'Tokyo': '/letters/tokyo.png',
          'Seoul': '/letters/seoul.png',
          'Beijing': '/letters/beijing.png'
        };
        const fallbackImage = cityImageMap[inFlightMail.toCity] || '/letters/tokyo.png';
        setCityImage(fallbackImage);
        setDiaryNotFound(false);
        
        // 📧 保存されたメール構造に合わせたmailDiary作成
        const mailDiary = {
          id: 1,
          en: contentToShow, // 直接string
          jp: inFlightMail.jp || '',
          location: `${inFlightMail.fromCity}-${inFlightMail.toCity}`,
          cityName: `${inFlightMail.fromCity}-${inFlightMail.toCity}`,
          cityImage: fallbackImage,
          type: inFlightMail.type,
          fromCity: inFlightMail.fromCity,
          toCity: inFlightMail.toCity,
          milestone: inFlightMail.milestone
        };
        setDiary(mailDiary);
        
        const words = contentToShow.trim().split(/\s+/).filter((word: string) => word.length > 0);
        setWordCount(words.length);
        
        console.log('📧 Successfully loaded stored in-flight mail content');
        return;
      }
      
      // 📧 FALLBACK: Use static pre-created letters
      console.log('📧 No stored content found, using static letter system...');
      
      const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
      
      // Try to get static letter (Tokyo first, then other cities if needed)
      try {
        const { getStaticLetter } = await import('@/data/staticLetters');
        
        // Determine which city letter to show based on user progress
        const totalWords = parseInt(localStorage.getItem('wordCountTotal') || '0', 10);
        let targetCity = 'tokyo'; // Default to Tokyo
        
        if (totalWords >= 2000) {
          targetCity = 'beijing';
        } else if (totalWords >= 1000) {
          targetCity = 'seoul';
        }
        
        const staticLetter = getStaticLetter(targetCity, userLevel);
        if (staticLetter) {
          console.log(`📧 Found static letter for ${targetCity}, level ${userLevel}`);
          
          setLetterText(staticLetter.en);
          setCityName(staticLetter.city);
          setCityImage(staticLetter.cityImage);
          setDiaryNotFound(false);
          
          const letterDiary = {
            id: 1,
            en: staticLetter.en,
            jp: staticLetter.jp,
            location: staticLetter.city,
            cityName: staticLetter.city,
            cityImage: staticLetter.cityImage,
            type: 'letter'
          };
          setDiary(letterDiary);
          
          const words = staticLetter.en.trim().split(/\s+/).filter((word: string) => word.length > 0);
          setWordCount(words.length);
          
          console.log(`📧 Successfully loaded static ${targetCity} letter`);
          return;
        }
      } catch (error) {
        console.error('❌ Failed to load static letter:', error);
      }
      
      // Last resort: Use original letterData fallback
      console.log('📧 Using original letterData as last resort fallback');
      const naritaLetter = letters[0];
      
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
      const storedLetter = getCurrentRouteLetter();
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
    const currentTotal = parseInt(localStorage.getItem('wordCountTotal') || '0', 10);
    const newTotal = currentTotal + wordCount;
    localStorage.setItem('wordCountTotal', newTotal.toString());
    
    // 新都市を取得して保存
    const nextCity = getNextCity(newTotal);
    localStorage.setItem('lastCity', nextCity.cityName);
    console.log('🗺️ 次に訪れる都市:', nextCity.cityName);

    // 📧 Save mail/letter to history with proper metrics
    const storedLetter = getCurrentRouteLetter();
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
          title: `A letter from ${storedLetter.toCity || cityName}`,
          contentJP: storedLetter.jp,
          contentEN: actualContent,
          level: userLevel,
          wordCount: actualWordCount,
          duration: duration,
          wpm: actualWPM,
          city: storedLetter.toCity || cityName,
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
      
      // ✅ 手紙読了後：ペンディングメールがあるかチェック（スタンプカード統合で一時停止）
      // console.log('📧 Letter completion - checking for pending mail...');
      // const hasPendingMail = checkForPendingMailAfterLetterCompletion();
      
      // if (hasPendingMail) {
      //   console.log('📧 Found pending mail after letter completion, processing...');
      const hasPendingMail = false; // スタンプカード統合で一時無効化
      
      if (hasPendingMail) {
        
        // ペンディングキューから次のメールを処理（スタンプカード統合で一時停止）
        // setTimeout(() => {
        //   const nextItem = processNextInQueue();
        //   if (nextItem) {
        //     console.log(`📧 ✅ Processed pending ${nextItem.type} after letter completion`);
        //     const event = new CustomEvent('pendingMailProcessed', {
        //       detail: { type: nextItem.type, reason: nextItem.reason }
        //     });
        //     window.dispatchEvent(event);
        //   }
        // }, 1000); // 1秒後に処理（手紙読了のフィードバック後）
        console.log('📧 Pending mail processing disabled for stamp card integration');
      } else {
        console.log('📧 No pending mail found after letter completion');
      }
    }
    
    // ペンディングInFlightメールもチェック（スタンプカード統合で一時停止）
    // const pendingInFlightMails = JSON.parse(localStorage.getItem('pendingInFlightMails') || '[]');
    // if (pendingInFlightMails.length > 0) {
    //   console.log('📧 Found pending in-flight mails, processing after letter completion...');
    //   setTimeout(async () => {
    //     for (const mailInfo of pendingInFlightMails) {
    //       try {
    //         const { sendInFlightMail } = await import('@/lib/sendInFlightMail');
    //         await sendInFlightMail(mailInfo.leg, mailInfo.minute);
    //         console.log(`📧 ✅ Processed pending in-flight mail: ${mailInfo.leg} at ${mailInfo.minute} minutes`);
    //       } catch (error) {
    //         console.error('📧 Failed to process pending in-flight mail:', error);
    //       }
    //     }
    //     localStorage.removeItem('pendingInFlightMails');
    //     console.log('📧 Cleared pending in-flight mails list');
    //   }, 1500);
    // }
    console.log('📧 In-flight mail processing disabled for stamp card integration');
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

  // 📧 Safe content rendering preparation
  const [userLevel, setUserLevel] = useState(1);
  
  useEffect(() => {
    const level = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
    setUserLevel(level);
  }, []);
  
  // 📧 安全なコンテンツ取得 - diary.type に基づいて処理を分岐
  let letter, englishText, pairedParagraphs = [];
  
  try {
    if (diary?.type === 'letter') {
      // 📮 Letter content handling - use diary data that was already loaded
      if (diary.en && diary.jp) {
        letter = diary;
        englishText = diary.en;
        console.log('📮 Using diary letter content:', { enLength: diary.en.length, jpLength: diary.jp.length });
      } else {
        console.error('📮 Diary letter content incomplete:', { hasEn: !!diary.en, hasJp: !!diary.jp });
        letter = null;
        englishText = '手紙の読み込みに失敗しました。';
      }
      
      // Letter paragraph splitting
      const enParagraphs = englishText ? englishText.split(/\n+/).filter(p => p.trim() !== '') : [];
      const jpParagraphs = letter && letter.jp ? letter.jp.split(/\n+/).filter(p => p.trim() !== '') : [];
      pairedParagraphs = enParagraphs.map((en, idx) => ({ en, jp: jpParagraphs[idx] || '' }));
      
    } else if (diary?.type === 'mail') {
      // 📧 Mail content handling - diary構造から直接取得
      letter = null; // mail では letter 構造を使わない
      englishText = diary?.en || '';
      
      console.log('📧 Using mail content from diary structure');
      
      // Mail では paragraph splitting は renderInFlightMail() で行う
      pairedParagraphs = [];
      
    } else {
      // 🚫 Unknown or missing type
      console.warn('⚠️ Unknown content type or missing diary:', diary?.type);
      letter = null;
      englishText = 'コンテンツタイプが不明です。';
      pairedParagraphs = [];
    }
    
    console.log('📧 Safe content preparation:', { 
      diaryType: diary?.type, 
      userLevel, 
      letterExists: !!letter, 
      englishLength: englishText?.length || 0,
      paragraphCount: pairedParagraphs.length
    });
    
  } catch (error) {
    console.error('❌ Error in content preparation:', error);
    letter = null;
    englishText = 'コンテンツの準備中にエラーが発生しました。';
    pairedParagraphs = [];
  }

  return (
    <main className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        {showNotice && (
          <div className="mb-4 p-3 bg-[#FFF9F4] border border-[#FFB86C] text-[#1E1E1E] rounded shadow animate-fade-in">
            {(() => {
              const contentType = diary?.type || 'letter';
              return contentType === 'mail' ? '✉️ 新しいメールが届きました！' : '✨ 新しい手紙が届きました！';
            })()}
          </div>
        )}
        
        {/* 🛠️ Debug info (dev mode only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            Debug: type={diary?.type}, hasEn={!!diary?.en}, hasJp={!!diary?.jp}, 
            enLength={diary?.en?.length || 0}, contentDecision={JSON.stringify(contentDecision)}
          </div>
        )}
        {/* ① 動的タイトル：手紙・メール type に応じて分岐 */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {(() => {
            // 📧 安全なタイトル表示 - diaryオブジェクトからtypeを取得
            const contentType = diary?.type || 'letter';
            const catName = localStorage.getItem("catName") || "Your cat";
            
            if (contentType === "mail") {
              const fromCity = diary?.fromCity || cityName.split('-')[0] || 'Tokyo';
              const toCity = diary?.toCity || cityName.split('-')[1] || 'Seoul';
              return `✉️ In-flight Mail from ${fromCity} to ${toCity}`;
            } else {
              const destination = diary?.toCity || diary?.location || cityName || 'Unknown';
              return `📮 A Letter from ${destination}`;
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
              {(() => {
                // 📧 安全なmailtype判定とコンテンツ表示の分離
                const contentType = diary?.type || 'letter';
                
                if (contentType === 'mail') {
                  return renderInFlightMail();
                } else if (contentType === 'letter') {
                  return renderArrivalLetter(letter, userLevel, pairedParagraphs);
                } else {
                  return (
                    <p className="text-red-600 text-center py-4">
                      コンテンツタイプが不明です: {contentType}
                    </p>
                  );
                }
              })()}
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
              <div className="bg-[#FFF9F4] border border-[#FFE1B5] rounded-xl p-6 mb-8">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">📊 読書進捗まとめ</h3>
                <div className="space-y-3 text-gray-700">
                  <p className="text-sm">今回の語数：<span className="font-semibold">{wordCount}語</span></p>
                  <p className="text-sm">今回のWPM：<span className="font-semibold">{calculatedWPM}</span></p>
                  <p className="text-sm">平均WPM（直近5回）：<span className="font-semibold">{getAverageWPM()}</span></p>
                  <p className="text-sm">これまでの合計語数：<span className="font-semibold">{(parseInt(localStorage.getItem('wordCountTotal') || '0', 10)).toLocaleString()}語</span></p>
                  {(() => {
                    const totalWords = parseInt(localStorage.getItem('wordCountTotal') || '0', 10);
                    const nextCity = getNextUnreachedCity(totalWords);
                    return nextCity ? (
                      <p className="text-sm">次の目的地：<span className="font-semibold">{nextCity.cityName}</span>（あと <span className="font-semibold text-orange-600">{(nextCity.requiredWords - totalWords).toLocaleString()}語</span>）</p>
                    ) : (
                      <p className="text-sm font-semibold text-[#FFB86C]">🎉 すべての都市に到達済みです！</p>
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
                      <h3 className="text-lg font-bold text-text-primary">📝 今日のマイノート</h3>
                    </div>
                    
                    <p className="mb-4 text-sm text-text-primary">
                      クリックした単語 {clickedWords.length}個
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      {clickedWords.map((word, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-[#C9A86C]">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-text-primary">{word.word}</span>
                                  {word.pos && (
                                    <span className="text-xs bg-[#FFE1B5] text-[#7E6944] px-2 py-1 rounded-full">
                                      {posMap[word.pos] || "不明"}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-sm text-text-primary">
                                  <p className="font-medium">意味：</p>
                                  <p>{word.jaDefinition || '定義が見つかりません'}</p>
                                </div>
                                
                                {word.enExample && (
                                  <div className="text-sm text-text-primary">
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
                      className="w-full rounded-md bg-[#FFE1B5] px-6 py-3 font-medium text-text-primary transition-colors hover:bg-[#E5C590]"
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
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
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
                    <div className="mx-auto mb-2 size-8 animate-spin rounded-full border-b-2 border-orange-400"></div>
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
                              &quot;{wordInfo.sentence}&quot;
                            </p>
                          )}
                          {wordInfo.sentenceJapanese && (
                            <p className="text-gray-600 text-sm">
                              &quot;{wordInfo.sentenceJapanese}&quot;
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