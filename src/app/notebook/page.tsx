'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

// 単語情報のインターフェース
interface WordInfo {
  word: string; // 見出し語（クリックされた形、または適切な形）
  baseForm?: string; // 原形（見出し語と異なる場合のみ）
  originalForm?: string; // 元の形（クリックされたそのままの形）
  partOfSpeech: string;
  detailedPos?: string; // 詳細な品詞情報
  meaning: string; // 英語の意味（既存）
  japaneseMeaning?: string; // 日本語の意味
  sentence: string; // 英語例文
  sentenceJapanese?: string; // 日本語例文
  paraphrase?: string; // 平易な言い換え語
  // 新しいフォーマット対応
  pos?: string;
  jaDefinition?: string;
  enDefinition?: string;
  jaExample?: string;
  enExample?: string;
}

// 並び替えタイプ
type SortType = 'recent' | 'alphabetical';

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

export default function NotebookPage() {
  const router = useRouter();
  const { displayLang } = useLanguage();
  const { t } = useTranslation();
  const [words, setWords] = useState<WordInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>('recent');

  // ブラウザ戻るボタンでURLパラメータを確実に付与
  useEffect(() => {
    const handlePopState = () => {
      // ブラウザ戻る操作時にURLにfromNotebookパラメータを追加
      const currentUrl = new URL(window.location.href);
      if (currentUrl.pathname === '/reading') {
        currentUrl.searchParams.set('fromNotebook', 'true');
        window.history.replaceState(null, '', currentUrl.toString());
        console.log('📚 notebook→reading戻り検知、URLパラメータ設定');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ローカルストレージから単語リストを取得
  useEffect(() => {
    try {
      // clickedWordsを最優先で読み込み
      const clickedWordsRaw = localStorage.getItem('clickedWords');
      
      if (clickedWordsRaw) {
        try {
          const clickedWords = JSON.parse(clickedWordsRaw);
          console.log('🎯 CLICKED WORDS DATA:', clickedWords);
          
          if (Array.isArray(clickedWords)) {
            setWords(clickedWords);
            console.log('✅ Using clickedWords data:', clickedWords.length, 'items');
            return;
          }
        } catch (error) {
          console.error('clickedWords parsing error:', error);
        }
      }
      
      // フォールバック: myNotebook
      const myNotebookRaw = localStorage.getItem('myNotebook');
      if (myNotebookRaw) {
        try {
          const myNotebook = JSON.parse(myNotebookRaw);
          console.log('📚 FALLBACK: Using myNotebook data:', myNotebook);
          if (Array.isArray(myNotebook)) {
            setWords(myNotebook);
          }
        } catch (error) {
          console.error('myNotebook parsing error:', error);
          setWords([]);
        }
      } else {
        setWords([]);
      }
    } catch (error) {
      console.error('Storage loading failed:', error);
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 並び替え処理
  const sortedWords = () => {
    const wordsCopy = [...words];
    if (sortType === 'alphabetical') {
      return wordsCopy.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
    }
    // 'recent' - 配列の順序（最後に追加されたものが最後）を逆にして最新順に
    return wordsCopy.reverse();
  };

  // 全削除処理
  const handleClearAll = () => {
    if (confirm('すべての単語を削除しますか？この操作は取り消せません。')) {
      localStorage.removeItem('myNotebook');
      setWords([]);
    }
  };

  // 個別削除処理
  const handleDeleteWord = (wordToDelete: string) => {
    try {
      const updatedWords = words.filter(word => word.word !== wordToDelete);
      setWords(updatedWords);
      localStorage.setItem('myNotebook', JSON.stringify(updatedWords));
    } catch (error) {
      console.error('単語削除に失敗:', error);
    }
  };

  if (loading) {
    return (
      <main className="p-4 bg-[#FFF9F4] min-h-screen">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB86C] mx-auto"></div>
          <p className="mt-2 text-[#1E1E1E]">読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 max-w-4xl mx-auto bg-[#FFF9F4] min-h-screen">
      <div className="mb-6">
        {/* Back to Reading Button */}
        <button
          onClick={() => router.push('/reading?from=notebook')}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-[#FFE1B5] text-[#1E1E1E] rounded-md font-medium hover:bg-[#e5a561] transition-colors"
        >
          ← 読書画面へ戻る
        </button>
        
        <h1 className="text-xl font-bold text-[#1E1E1E] mb-2">{t('notebook.title')}</h1>
        <p className="text-[#1E1E1E]">
          {words.length > 0 ? (
            displayLang === 'ja' 
              ? `${words.length}${t('notebook.wordsCount')}`
              : `${words.length} ${t('notebook.wordsCount')}`
          ) : (
            displayLang === 'ja' ? '保存された単語はありません' : 'No words saved'
          )}
        </p>
      </div>

      {words.length > 0 ? (
        <>
          {/* コントロールパネル */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSortType('recent')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  sortType === 'recent'
                    ? 'bg-[#FFE1B5] text-[#1E1E1E]'
                    : 'bg-[#F6F0E9] text-[#1E1E1E]'
                }`}
              >
{t('notebook.sortRecent')}
              </button>
              <button
                onClick={() => setSortType('alphabetical')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  sortType === 'alphabetical'
                    ? 'bg-[#FFE1B5] text-[#1E1E1E]'
                    : 'bg-[#F6F0E9] text-[#1E1E1E]'
                }`}
              >
{t('notebook.sortAlphabetical')}
              </button>
            </div>
            
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-[#FFB86C] text-[#1E1E1E] rounded-md font-semibold hover:bg-[#e5a561] transition-colors"
            >
{t('notebook.deleteAll')}
            </button>
          </div>

          {/* 単語リスト */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedWords().map((word, index) => (
              <div
                key={`${word.word}-${index}`}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="space-y-2">
                      {/* 見出し語 + 原形 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-[#1E1E1E]">{word.word}</h3>
                        {word.baseForm && word.baseForm !== word.word && displayLang === 'ja' && (
                          <span className="bg-gray-100 text-[#1E1E1E] text-xs px-2 py-1 rounded-md border">
                            原形: {word.baseForm}
                          </span>
                        )}
                        {word.originalForm && word.originalForm !== word.word && (
                          <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded-md border border-yellow-200">
                            from: {word.originalForm}
                          </span>
                        )}
                      </div>
                      
                      {/* 品詞 */}
                      <div>
                        <span className="inline-block bg-[#7E6944] text-white text-xs px-2 py-1 rounded-full font-medium">
                          {posMap[word.pos] || "不明"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWord(word.word)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="削除"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* 意味 */}
                  <div>
                    <p className="text-sm text-[#1E1E1E] font-medium mb-1">意味：</p>
                    <p className="text-[#1E1E1E]">
                      {word.jaDefinition || word.japaneseMeaning || word.meaning || '意味が見つかりません'}
                    </p>
                  </div>

                  {/* 例文 */}
                  {(word.enExample || word.sentence) && (
                    <div>
                      <p className="text-sm text-[#1E1E1E] font-medium mb-1">例文：</p>
                      <p className="text-[#1E1E1E] italic">
                        {word.enExample || word.sentence}
                      </p>
                      {(word.jaExample || word.sentenceJapanese) && (
                        <p className="text-xs text-gray-600 mt-1">
                          {word.jaExample || word.sentenceJapanese}
                        </p>
                      )}
                    </div>
                  )}

                  {/* パラフレーズ（言い換え語） */}
                  {word.paraphrase && (
                    <div>
                      <p className="text-sm text-[#1E1E1E] font-medium mb-1">簡単な言い換え</p>
                      <p className="text-[#7E6944] font-medium">{word.paraphrase}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-2">まだ単語が保存されていません</h2>
          <p className="text-[#1E1E1E] mb-6">
            読み物ページで単語をクリックすると、ここに保存されます
          </p>
          <button
            onClick={() => window.location.href = '/choose'}
            className="bg-[#FFB86C] text-[#1E1E1E] px-6 py-3 rounded-md font-semibold hover:bg-[#e5a561] transition-colors"
          >
            読み物を始める
          </button>
        </div>
      )}
    </main>
  );
}