'use client';

import { useState } from 'react';
import { loadMessage, queueMessage } from '@/utils/messageLoader';

export default function Test20300Letter() {
  const [letterContent, setLetterContent] = useState<string>('');
  const [userLevel, setUserLevel] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);

  // 20300語Beijing手紙を直接テスト
  const testLoadLetter = async () => {
    setLoading(true);
    try {
      // ユーザーレベルを設定
      localStorage.setItem('vocabLevel', userLevel.toString());
      localStorage.setItem('level', userLevel.toString());
      
      console.log(`📮 Testing Beijing letter loading with level: ${userLevel}`);
      
      // 手紙を読み込み
      const letterData = await loadMessage('letter', '001_beijing_arrival');
      
      if (letterData) {
        console.log('📮 Beijing letter loaded successfully:', letterData);
        setLetterContent(letterData.content);
      } else {
        setLetterContent('Beijing手紙の読み込みに失敗しました');
      }
    } catch (error) {
      console.error('❌ Beijing letter loading error:', error);
      setLetterContent('エラーが発生しました: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  // 20300語到達をシミュレート
  const simulateWordCountReach = () => {
    // ローカルストレージに20300語を設定
    localStorage.setItem('totalWordsRead', '20300');
    
    // 手紙をキューに追加
    queueMessage('letter', 20300);
    
    console.log('📮 Simulated reaching 20300 words and queued Beijing letter');
    alert('20300語到達をシミュレートしました。Beijing手紙がキューに追加されました。');
  };

  const clearData = () => {
    localStorage.removeItem('vocabLevel');
    localStorage.removeItem('level');
    localStorage.removeItem('totalWordsRead');
    localStorage.removeItem('messageQueue');
    setLetterContent('');
    console.log('🗑️ Cleared test data');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">20300語Beijing手紙テスト</h1>
      
      {/* レベル選択 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">語彙レベル選択</h2>
        <div className="flex gap-2">
          {[1, 2, 3].map(level => (
            <button
              key={level}
              onClick={() => setUserLevel(level)}
              className={`px-4 py-2 rounded ${
                userLevel === level 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Level {level}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          現在選択: Level {userLevel}
        </p>
      </div>

      {/* テストボタン */}
      <div className="mb-6 space-y-2">
        <button
          onClick={testLoadLetter}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-2 rounded mr-4 disabled:opacity-50"
        >
          {loading ? '読み込み中...' : 'Beijing手紙読み込みテスト'}
        </button>
        
        <button
          onClick={simulateWordCountReach}
          className="bg-blue-500 text-white px-6 py-2 rounded mr-4"
        >
          20300語到達シミュレート
        </button>
        
        <button
          onClick={clearData}
          className="bg-red-500 text-white px-6 py-2 rounded"
        >
          データクリア
        </button>
      </div>

      {/* 手紙内容表示 */}
      {letterContent && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Beijing手紙内容 (Level {userLevel})</h2>
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded max-h-96 overflow-y-auto text-sm">
            {letterContent}
          </div>
        </div>
      )}

      {/* デバッグ情報 */}
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">デバッグ情報</h3>
        <p className="text-sm">LocalStorage vocabLevel: {typeof window !== 'undefined' ? localStorage.getItem('vocabLevel') || 'なし' : 'サーバーサイド'}</p>
        <p className="text-sm">LocalStorage totalWordsRead: {typeof window !== 'undefined' ? localStorage.getItem('totalWordsRead') || 'なし' : 'サーバーサイド'}</p>
        <p className="text-sm">Expected trigger: 20300語でBeijing手紙配信</p>
        <p className="text-sm">Content: 北京到着、グルメ冒険、テーブルマナー、歴史・万里の長城</p>
        <div className="mt-2">
          <p className="text-xs font-semibold">Level別語数:</p>
          <p className="text-xs">Level 1: 120-150語 | Level 2: 170-200語 | Level 3: 220-270語</p>
        </div>
      </div>
    </div>
  );
}