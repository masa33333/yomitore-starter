'use client';

import { useState } from 'react';
import { loadMessage, queueMessage } from '@/utils/messageLoader';

export default function Test15300Mail() {
  const [mailContent, setMailContent] = useState<string>('');
  const [userLevel, setUserLevel] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);

  // 15300語Seoul→Beijingメールを直接テスト
  const testLoadMail = async () => {
    setLoading(true);
    try {
      // ユーザーレベルを設定
      localStorage.setItem('vocabLevel', userLevel.toString());
      localStorage.setItem('level', userLevel.toString());
      
      console.log(`📧 Testing Seoul→Beijing mail loading with level: ${userLevel}`);
      
      // メールを読み込み
      const mailData = await loadMessage('mail', '002_seoul_beijing_mail1');
      
      if (mailData) {
        console.log('📧 Seoul→Beijing mail loaded successfully:', mailData);
        setMailContent(mailData.content);
      } else {
        setMailContent('Seoul→Beijingメールの読み込みに失敗しました');
      }
    } catch (error) {
      console.error('❌ Seoul→Beijing mail loading error:', error);
      setMailContent('エラーが発生しました: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  // 15300語到達をシミュレート
  const simulateWordCountReach = () => {
    // ローカルストレージに15300語を設定
    localStorage.setItem('totalWordsRead', '15300');
    
    // メールをキューに追加
    queueMessage('mail', 15300);
    
    console.log('📬 Simulated reaching 15300 words and queued Seoul→Beijing mail');
    alert('15300語到達をシミュレートしました。Seoul→Beijingメールがキューに追加されました。');
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
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">15300語Seoul→Beijingメールテスト</h1>
      
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
          {loading ? '読み込み中...' : 'Seoul→Beijingメール読み込みテスト'}
        </button>
        
        <button
          onClick={simulateWordCountReach}
          className="bg-blue-500 text-white px-6 py-2 rounded mr-4"
        >
          15300語到達シミュレート
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
          <h2 className="text-lg font-semibold mb-3">Seoul→Beijingメール内容 (Level {userLevel})</h2>
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {mailContent}
          </div>
        </div>
      )}

      {/* デバッグ情報 */}
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">デバッグ情報</h3>
        <p className="text-sm">LocalStorage vocabLevel: {localStorage.getItem('vocabLevel') || 'なし'}</p>
        <p className="text-sm">LocalStorage totalWordsRead: {localStorage.getItem('totalWordsRead') || 'なし'}</p>
        <p className="text-sm">Expected trigger: 15300語でSeoul→Beijingメール配信</p>
        <p className="text-sm">Content: ソウル街歩き、韓国文化・マナー、明日の予定</p>
      </div>
    </div>
  );
}