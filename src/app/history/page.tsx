'use client';

import { useEffect, useState } from 'react';
import { mapQuizLevelToGenerationLevel, getGenerationLevelName } from '@/utils/getEnglishText';

interface ReadingHistoryItem {
  id: string;
  date: string;
  title?: string; // 明示的なタイトル
  theme: string; // 後方互換性
  subTopic: string;
  style: string;
  level: number;
  wordCount: number;
  wpm: number;
  readingTime: number;
  mode?: 'reading' | 'story'; // モード識別
  content?: string; // 再読用英文コンテンツ
  translation?: string; // 再読用日本語訳
  // ストーリーモード用追加フィールド
  isStoryMode?: boolean;
  genre?: string;
  tone?: string;
  aftertaste?: string; // feeling
  timestamp?: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('readingHistory') || '[]');
    // 日付順でソート（新しい順）
    savedHistory.sort((a: ReadingHistoryItem, b: ReadingHistoryItem) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setHistory(savedHistory);
  }, []);

  const clearHistory = () => {
    if (confirm('読書履歴をすべて削除しますか？')) {
      localStorage.removeItem('readingHistory');
      setHistory([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const averageWPM = history.length > 0 
    ? Math.round(history.reduce((sum, item) => sum + item.wpm, 0) / history.length)
    : 0;

  return (
    <main className="p-4 max-w-4xl mx-auto bg-[#FFF9F4] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">読書履歴</h1>
        <button
          onClick={clearHistory}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          履歴削除
        </button>
      </div>

      {history.length > 0 && (
        <div className="bg-[#FFF3E0] border border-[#FFE1B5] rounded p-4 mb-6">
          <h2 className="font-bold text-[#1E1E1E] mb-2">統計情報</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-[#1E1E1E]">総読書回数</span>
              <p className="font-bold text-lg text-[#1E1E1E]">{history.length}回</p>
            </div>
            <div>
              <span className="text-[#1E1E1E]">平均WPM</span>
              <p className="font-bold text-lg text-[#1E1E1E]">{averageWPM}</p>
            </div>
            <div>
              <span className="text-[#1E1E1E]">総語数</span>
              <p className="font-bold text-lg text-[#1E1E1E]">{history.reduce((sum, item) => sum + item.wordCount, 0)}語</p>
            </div>
            <div>
              <span className="text-[#1E1E1E]">総読書時間</span>
              <p className="font-bold text-lg text-[#1E1E1E]">{Math.round(history.reduce((sum, item) => sum + item.readingTime, 0) / 60)}分</p>
            </div>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-8 text-[#1E1E1E]">
          <p>読書履歴がありません</p>
          <p className="text-sm mt-2">読み物を完了すると履歴が表示されます</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title || item.theme}</h3>
                  {item.mode && (
                    <span className="inline-block bg-[#FFE1B5] text-[#1E1E1E] text-xs px-2 py-1 rounded-full mr-2">
                      {item.mode === 'story' ? 'ストーリー' : '読み物'}
                    </span>
                  )}
                  {item.subTopic && (
                    <p className="text-gray-600 text-sm">{item.subTopic}</p>
                  )}
                  {/* ストーリーモード用の詳細情報 */}
                  {item.isStoryMode && (item.genre || item.tone || item.aftertaste) && (
                    <div className="flex gap-2 mt-1">
                      {item.genre && (
                        <span className="bg-[#FFF9F4] border border-[#FFB86C] text-[#1E1E1E] text-xs px-2 py-1 rounded">{item.genre}</span>
                      )}
                      {item.tone && (
                        <span className="bg-[#FFE1B5] text-[#1E1E1E] text-xs px-2 py-1 rounded">{item.tone}</span>
                      )}
                      {item.aftertaste && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">{item.aftertaste}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                  <button
                    onClick={() => window.location.href = `/reading?id=${item.id}`}
                    className="bg-[#FFB86C] text-[#1E1E1E] px-3 py-1 rounded text-sm hover:bg-[#e5a561] whitespace-nowrap"
                  >
                    もう一度読む
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">スタイル</span>
                  <p className="font-medium">{item.style}</p>
                </div>
                <div>
                  <span className="text-gray-500">レベル</span>
                  <p className="font-medium">
                    {item.level <= 10 ? 
                      `${getGenerationLevelName(mapQuizLevelToGenerationLevel(item.level))}` : 
                      `Lv.${item.level}`
                    }
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">語数</span>
                  <p className="font-medium">{item.wordCount}語</p>
                </div>
                <div>
                  <span className="text-gray-500">WPM</span>
                  <p className="font-medium text-[#1E1E1E]">{item.wpm}</p>
                </div>
                <div>
                  <span className="text-gray-500">時間</span>
                  <p className="font-medium">{item.readingTime}秒</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => window.location.href = '/choose'}
          className="bg-[#FFB86C] text-[#1E1E1E] px-6 py-2 rounded hover:bg-[#e5a561]"
        >
          新しい読み物を生成
        </button>
      </div>
    </main>
  );
}