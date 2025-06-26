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

export default function ReadingClient({ searchParams, initialData, mode }: ReadingClientProps) {
  const router = useRouter();
  const { displayLang } = useLanguage();
  const { t } = useTranslation();
  const { story, updateStory } = useStory();

  // タイトル表示用のテーマ/ジャンル取得
  const displayTitle = mode === 'story' 
    ? (initialData?.title || searchParams.genre || 'ストーリー')
    : (searchParams.topic || searchParams.theme || '読み物');

  // 基本状態
  const [loading, setLoading] = useState(false);
  const [english, setEnglish] = useState<string>(initialData?.story || 'コンテンツを読み込み中...');
  const [japanese, setJapanese] = useState<string>('');
  const [storyTitle, setStoryTitle] = useState<string>(initialData?.title || '');
  const [englishParagraphs, setEnglishParagraphs] = useState<string[]>(() => {
    if (initialData?.story) {
      return initialData.story.split('\n\n').filter(p => p.trim());
    }
    return [];
  });
  const [japaneseParagraphs, setJapaneseParagraphs] = useState<string[]>([]);
  
  // 読書状態
  const [showJapanese, setShowJapanese] = useState(false);
  const [isReadingStarted, setIsReadingStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState<number>(() => {
    if (initialData?.story) {
      return initialData.story.trim().split(/\s+/).filter(w => w.length > 0).length;
    }
    return 0;
  });
  
  // 単語処理状態
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loadingWordInfo, setLoadingWordInfo] = useState(false);
  const [sessionWords, setSessionWords] = useState<WordInfo[]>([]);
  
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

  // 読書開始処理
  const handleStartReading = () => {
    setIsReadingStarted(true);
    setStartTime(Date.now());
    console.log('📖 読書開始');
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
  };

  // 単語クリック処理
  const handleWordClick = async (word: string) => {
    setSelectedWord(word);
    setLoadingWordInfo(true);
    
    try {
      const response = await fetch('/api/word-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, sentence: english })
      });
      
      if (response.ok) {
        const data = await response.json();
        setWordInfo(data);
        
        // セッション単語に追加
        const newSessionWord = {
          word: data.word,
          originalForm: word,
          partOfSpeech: data.partOfSpeech,
          meaning: data.meaning,
          japaneseMeaning: data.japaneseMeaning,
          sentence: data.sentence,
          sentenceJapanese: data.sentenceJapanese
        };
        
        setSessionWords(prev => [...prev, newSessionWord]);
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

  // 英語テキストをクリック可能な単語に分割
  const renderClickableText = (text: string) => {
    const words = text.split(/(\s+|[.!?;:,\-\u2013\u2014()"])/);
    
    return words.map((part, index) => {
      if (/^[a-zA-Z]+$/.test(part)) {
        return (
          <span
            key={index}
            onClick={() => handleWordClick(part)}
            className="cursor-pointer hover:bg-yellow-200 hover:bg-opacity-50 transition-colors duration-200 rounded"
            title="クリックして意味を調べる"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
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
              📖 読み始める
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* テキスト表示（段落ごと） */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="prose max-w-none">
              {englishParagraphs.map((paragraph, index) => (
                <div key={index} className="mb-6">
                  {/* 英語段落 */}
                  <p className="mb-3 text-base leading-relaxed text-[#1E1E1E]">
                    {renderClickableText(paragraph)}
                  </p>
                  
                  {/* 対応する日本語段落 */}
                  {showJapanese && japaneseParagraphs[index] && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-base text-[#1E1E1E] italic">
                        {japaneseParagraphs[index]}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              {!showJapanese && (
                <button
                  onClick={handleShowJapanese}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  🗾 日本語を表示
                </button>
              )}
              
              {!endTime && (
                <button
                  onClick={handleCompleteReading}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  ✅ 読書完了
                </button>
              )}
            </div>
          </div>

          {/* 単語情報 */}
          {selectedWord && wordInfo && (
            <div className="bg-yellow-50 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-3 text-[#1E1E1E]">📚 単語情報</h3>
              <div className="space-y-2">
                <p><strong>単語:</strong> {wordInfo.word}</p>
                <p><strong>品詞:</strong> {wordInfo.partOfSpeech}</p>
                <p><strong>意味:</strong> {wordInfo.meaning}</p>
                <p><strong>日本語:</strong> {wordInfo.japaneseMeaning}</p>
                <p><strong>例文:</strong> {wordInfo.sentence}</p>
                <p><strong>例文(日本語):</strong> {wordInfo.sentenceJapanese}</p>
              </div>
            </div>
          )}

          {/* 読書完了後の表示 */}
          {endTime && (
            <div className="bg-green-50 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-3 text-[#1E1E1E]">🎉 読書完了！</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">読書速度</p>
                  <p className="text-lg font-bold">{wpm} WPM</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">語数</p>
                  <p className="text-lg font-bold">{wordCount} 語</p>
                </div>
              </div>
              
              {sessionWords.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    クリックした単語: {sessionWords.length}個
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sessionWords.map((word, index) => (
                      <span key={index} className="bg-white px-2 py-1 rounded text-sm">
                        {word.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleLevelChange}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
                  >
                    📊 レベル変更
                  </button>
                  
                  <button
                    onClick={() => router.push('/choose')}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md font-medium hover:bg-green-600 transition-colors"
                  >
                    📚 他のものを読む
                  </button>
                </div>
                
                {/* レベル選択UI */}
                {showLevelSelector && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-center">語彙レベルを選択</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleRegenerateWithLevel(level)}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            selectedLevel === level 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white text-blue-600 hover:bg-blue-100'
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