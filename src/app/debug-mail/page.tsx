'use client';

import { useState, useEffect } from 'react';
import { shouldSendMail, shouldSendLetter, getMessageFileName } from '@/utils/rewardRules';
import { queueMessage, getMessageQueue, loadMessageByTrigger } from '@/utils/messageLoader';

export default function DebugMailPage() {
  const [currentWords, setCurrentWords] = useState<number>(0);
  const [queue, setQueue] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<string>('');

  // 現在の語数を取得
  useEffect(() => {
    const userProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
    const totalWordsRead = localStorage.getItem('totalWordsRead') || '0';
    const wordCountTotal = localStorage.getItem('wordCountTotal') || '0';
    
    const words = Math.max(
      userProgress.totalWords || 0,
      parseInt(totalWordsRead),
      parseInt(wordCountTotal)
    );
    
    setCurrentWords(words);
    updateQueue();
  }, []);

  const updateQueue = () => {
    const messageQueue = getMessageQueue();
    setQueue(messageQueue);
  };

  const test300Words = () => {
    // 300語に設定
    const userProgress = { totalWords: 300, totalStamps: 3 };
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
    localStorage.setItem('totalWordsRead', '300');
    localStorage.setItem('wordCountTotal', '300');
    
    // メール判定
    const shouldMail = shouldSendMail(300);
    const fileName = getMessageFileName(300);
    
    if (shouldMail) {
      queueMessage('mail', 300);
      setTestResult(`✅ 300語メール送信: ファイル名=${fileName}`);
    } else {
      setTestResult(`❌ 300語でメール送信されませんでした`);
    }
    
    setCurrentWords(300);
    updateQueue();
  };

  const test5300Words = () => {
    // 5300語に設定
    const userProgress = { totalWords: 5300, totalStamps: 53 };
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
    localStorage.setItem('totalWordsRead', '5300');
    localStorage.setItem('wordCountTotal', '5300');
    
    // メール判定
    const shouldMail = shouldSendMail(5300);
    const fileName = getMessageFileName(5300);
    
    if (shouldMail) {
      queueMessage('mail', 5300);
      setTestResult(`✅ 5300語メール送信: ファイル名=${fileName}`);
    } else {
      setTestResult(`❌ 5300語でメール送信されませんでした`);
    }
    
    setCurrentWords(5300);
    updateQueue();
  };

  const test10300Words = () => {
    // 10300語に設定
    const userProgress = { totalWords: 10300, totalStamps: 103 };
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
    localStorage.setItem('totalWordsRead', '10300');
    localStorage.setItem('wordCountTotal', '10300');
    
    // 手紙判定
    const shouldLetter = shouldSendLetter(10300);
    const fileName = getMessageFileName(10300);
    
    if (shouldLetter) {
      queueMessage('letter', 10300);
      setTestResult(`✅ 10300語手紙送信: ファイル名=${fileName}`);
    } else {
      setTestResult(`❌ 10300語で手紙送信されませんでした`);
    }
    
    setCurrentWords(10300);
    updateQueue();
  };

  const testLoadMessage = async (trigger: number) => {
    try {
      setTestResult('メッセージを読み込み中...');
      const message = await loadMessageByTrigger(trigger);
      
      if (message) {
        // ユーザーレベルとコンテンツの詳細を表示
        const userLevel = localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || '不明';
        const hasLevel1 = message.content.includes('**Level 1');
        const hasLevel2 = message.content.includes('**Level 2');
        const hasLevel3 = message.content.includes('**Level 3');
        const hasJapanese = message.content.includes('**日本語版');
        
        setTestResult(`✅ メッセージ読み込み成功: ${message.metadata.id}
📊 コンテンツ分析:
- 文字数: ${message.content.length}文字
- ユーザーレベル: ${userLevel}
- Level 1セクション: ${hasLevel1 ? '✅' : '❌'}
- Level 2セクション: ${hasLevel2 ? '✅' : '❌'}
- Level 3セクション: ${hasLevel3 ? '✅' : '❌'}
- 日本語セクション: ${hasJapanese ? '✅' : '❌'}

📝 表示内容の最初100文字:
${message.content.substring(0, 100)}...`);
      } else {
        setTestResult(`❌ メッセージ読み込み失敗: trigger=${trigger}`);
      }
    } catch (error) {
      setTestResult(`❌ エラー: ${error.message}`);
    }
  };

  const clearQueue = () => {
    localStorage.removeItem('messageQueue');
    updateQueue();
    setTestResult('✅ キューをクリアしました');
  };

  const resetData = () => {
    localStorage.removeItem('userProgress');
    localStorage.removeItem('totalWordsRead');
    localStorage.removeItem('wordCountTotal');
    localStorage.removeItem('messageQueue');
    setCurrentWords(0);
    updateQueue();
    setTestResult('✅ 全データをリセットしました');
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📬 メール・手紙システムデバッグ</h1>
      
      {/* 現在の状態 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">📊 現在の状態</h2>
        <p>現在の語数: <span className="font-bold">{currentWords}語</span></p>
        <p>メッセージキュー: <span className="font-bold">{queue.length}件</span></p>
        
        <div className="mt-2">
          <p className="text-sm">
            300語でメール: <span className={shouldSendMail(300) ? 'text-green-600' : 'text-red-600'}>
              {shouldSendMail(300) ? '✅' : '❌'}
            </span>
          </p>
          <p className="text-sm">
            5300語でメール: <span className={shouldSendMail(5300) ? 'text-green-600' : 'text-red-600'}>
              {shouldSendMail(5300) ? '✅' : '❌'}
            </span>
          </p>
          <p className="text-sm">
            10300語で手紙: <span className={shouldSendLetter(10300) ? 'text-green-600' : 'text-red-600'}>
              {shouldSendLetter(10300) ? '✅' : '❌'}
            </span>
          </p>
        </div>
      </div>

      {/* テストボタン */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">🧪 テスト</h2>
        <div className="space-y-2">
          <button
            onClick={test300Words}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            300語メールテスト
          </button>
          <button
            onClick={test5300Words}
            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          >
            5300語メールテスト
          </button>
          <button
            onClick={test10300Words}
            className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
          >
            10300語手紙テスト
          </button>
          <button
            onClick={() => testLoadMessage(300)}
            className="bg-orange-500 text-white px-4 py-2 rounded mr-2"
          >
            300語メッセージ読み込みテスト
          </button>
          <button
            onClick={() => testLoadMessage(5300)}
            className="bg-orange-600 text-white px-4 py-2 rounded mr-2"
          >
            5300語メッセージ読み込みテスト
          </button>
          <button
            onClick={() => testLoadMessage(10300)}
            className="bg-orange-700 text-white px-4 py-2 rounded mr-2"
          >
            10300語メッセージ読み込みテスト
          </button>
        </div>
        
        <div className="mt-4 space-y-2">
          <button
            onClick={clearQueue}
            className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
          >
            キュークリア
          </button>
          <button
            onClick={resetData}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            全データリセット
          </button>
        </div>
      </div>

      {/* テスト結果 */}
      {testResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">📋 テスト結果</h2>
          <p className="whitespace-pre-wrap">{testResult}</p>
        </div>
      )}

      {/* メッセージキュー */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">📮 メッセージキュー</h2>
        {queue.length === 0 ? (
          <p className="text-gray-500">キューは空です</p>
        ) : (
          <div className="space-y-2">
            {queue.map((msg, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded border">
                <p><span className="font-semibold">タイプ:</span> {msg.type}</p>
                <p><span className="font-semibold">トリガー:</span> {msg.trigger}語</p>
                <p><span className="font-semibold">タイムスタンプ:</span> {new Date(msg.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}