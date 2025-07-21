'use client';

import { useState } from 'react';
import { loadMessage, queueMessage } from '@/utils/messageLoader';

export default function Test5300Mail() {
  const [mailContent, setMailContent] = useState<string>('');
  const [userLevel, setUserLevel] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);

  // 5300語メールを直接テスト
  const testLoadMail = async () => {
    setLoading(true);
    try {
      // ユーザーレベルを設定
      localStorage.setItem('vocabLevel', userLevel.toString());
      localStorage.setItem('level', userLevel.toString());
      
      console.log(`📧 Testing mail loading with level: ${userLevel}`);
      
      // メールを読み込み
      const mailData = await loadMessage('mail', '001_tokyo_seoul_mail1');
      
      if (mailData) {
        console.log('📧 Mail loaded successfully:', mailData);
        setMailContent(mailData.content);
      } else {
        setMailContent('メールの読み込みに失敗しました');
      }
    } catch (error) {
      console.error('❌ Mail loading error:', error);
      setMailContent('エラーが発生しました: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  // 5300語到達をシミュレート
  const simulateWordCountReach = () => {
    // ローカルストレージに5300語を設定
    localStorage.setItem('totalWordsRead', '5300');
    
    // メールをキューに追加
    queueMessage('mail', 5300);
    
    console.log('📬 Simulated reaching 5300 words and queued mail');
    alert('5300語到達をシミュレートしました。メールがキューに追加されました。');
  };

  const clearData = () => {
    localStorage.removeItem('vocabLevel');
    localStorage.removeItem('level');
    localStorage.removeItem('totalWordsRead');
    localStorage.removeItem('messageQueue');
    setMailContent('');
    console.log('🗑️ Cleared test data');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">5300語メールテスト</h1>
      
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
          onClick={testLoadMail}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-2 rounded mr-4 disabled:opacity-50"
        >
          {loading ? '読み込み中...' : 'メール読み込みテスト'}
        </button>
        
        <button
          onClick={simulateWordCountReach}
          className="bg-blue-500 text-white px-6 py-2 rounded mr-4"
        >
          5300語到達シミュレート
        </button>
        
        <button
          onClick={clearData}
          className="bg-red-500 text-white px-6 py-2 rounded"
        >
          データクリア
        </button>
      </div>

      {/* メール内容表示 */}
      {mailContent && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">メール内容 (Level {userLevel})</h2>
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
            {mailContent}
          </div>
        </div>
      )}

      {/* デバッグ情報 */}
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">デバッグ情報</h3>
        <p className="text-sm">LocalStorage vocabLevel: {typeof window !== 'undefined' ? localStorage.getItem('vocabLevel') || 'なし' : 'サーバーサイド'}</p>
        <p className="text-sm">LocalStorage totalWordsRead: {typeof window !== 'undefined' ? localStorage.getItem('totalWordsRead') || 'なし' : 'サーバーサイド'}</p>
      </div>
    </div>
  );
}