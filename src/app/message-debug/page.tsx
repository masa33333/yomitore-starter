'use client';

import React, { useState, useEffect } from 'react';
import {
  shouldSendMail,
  shouldSendLetter,
  getMessageType,
  getMessageFileName,
  getNextEvents,
  getExpectedMessageCounts,
  validateSystemAt1M
} from '@/utils/rewardRules';
import {
  queueMessage,
  getMessageQueue,
  dequeueMessage,
  clearMessageQueue,
  loadMessageByTrigger,
  debugMessageSystem
} from '@/utils/messageLoader';

export default function MessageDebugPage() {
  const [totalWords, setTotalWords] = useState(0);
  const [testResults, setTestResults] = useState<any>(null);
  const [messageQueue, setMessageQueue] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loadedMessage, setLoadedMessage] = useState<any>(null);

  // キューの状態を更新
  const updateQueueStatus = () => {
    setMessageQueue(getMessageQueue());
    debugMessageSystem();
  };

  // 初回ロード
  useEffect(() => {
    updateQueueStatus();
    setValidationResult(validateSystemAt1M());
  }, []);

  // 語数をセットしてシステムをテスト
  const testSystem = () => {
    const nextEvents = getNextEvents(totalWords);
    const expectedCounts = getExpectedMessageCounts(totalWords);
    
    const mailTrigger = shouldSendMail(totalWords);
    const letterTrigger = shouldSendLetter(totalWords);
    const messageType = getMessageType(totalWords);
    const fileName = getMessageFileName(totalWords);

    setTestResults({
      totalWords,
      shouldSendMail: mailTrigger,
      shouldSendLetter: letterTrigger,
      messageType,
      fileName,
      nextEvents,
      expectedCounts
    });
  };

  // メッセージをキューに追加
  const handleQueueMessage = (type: 'mail' | 'letter', trigger: number) => {
    queueMessage(type, trigger);
    updateQueueStatus();
  };

  // メッセージを読み込み
  const handleLoadMessage = async (trigger: number) => {
    try {
      const message = await loadMessageByTrigger(trigger);
      setLoadedMessage(message);
    } catch (error) {
      console.error('Failed to load message:', error);
      setLoadedMessage({ error: error.message });
    }
  };

  // 語数を累計に反映（テスト用）
  const simulateReading = (words: number) => {
    const currentTotal = parseInt(localStorage.getItem('totalWordsRead') || '0', 10);
    const newTotal = currentTotal + words;
    localStorage.setItem('totalWordsRead', newTotal.toString());
    setTotalWords(newTotal);
    
    // 自動でメール・手紙をチェック
    if (shouldSendMail(newTotal)) {
      handleQueueMessage('mail', newTotal);
    }
    if (shouldSendLetter(newTotal)) {
      handleQueueMessage('letter', newTotal);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">メール・手紙システム デバッグ</h1>
      
      {/* システム検証結果 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">システム検証（1,000,000語時点）</h2>
        {validationResult && (
          <div className={`p-4 rounded ${validationResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-medium">
              {validationResult.success ? '✅ 正常' : '❌ 不正'}
            </p>
            <pre className="text-sm mt-2">
              {JSON.stringify(validationResult.details, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* 語数テスト */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">語数別テスト</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="number"
            value={totalWords}
            onChange={(e) => setTotalWords(parseInt(e.target.value) || 0)}
            placeholder="累計語数"
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={testSystem}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            テスト実行
          </button>
        </div>

        {/* 特定語数の簡単テスト */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[300, 5300, 10300, 15300, 20300, 25300, 30300, 35300, 40300].map(words => (
            <button
              key={words}
              onClick={() => {
                setTotalWords(words);
                setTimeout(testSystem, 100);
              }}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              {words}語
            </button>
          ))}
        </div>

        {testResults && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">テスト結果</h3>
            <pre className="text-sm">{JSON.stringify(testResults, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* 読書シミュレーション */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">読書シミュレーション</h2>
        <p className="text-sm text-gray-600 mb-4">
          現在の累計: {parseInt(localStorage.getItem('totalWordsRead') || '0', 10)}語
        </p>
        <div className="flex gap-2">
          {[100, 300, 500, 1000, 2000, 5000].map(words => (
            <button
              key={words}
              onClick={() => simulateReading(words)}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              +{words}語
            </button>
          ))}
        </div>
      </div>

      {/* メッセージキュー管理 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">メッセージキュー</h2>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleQueueMessage('mail', 300)}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            出発メール追加
          </button>
          <button
            onClick={() => handleQueueMessage('letter', 20300)}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Seoul手紙追加
          </button>
          <button
            onClick={() => {
              clearMessageQueue();
              updateQueueStatus();
            }}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            キュークリア
          </button>
          <button
            onClick={updateQueueStatus}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            更新
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">キュー内容 ({messageQueue.length}件)</h3>
          {messageQueue.map((msg, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{msg.type} - {msg.trigger}語</span>
              <button
                onClick={() => handleLoadMessage(msg.trigger)}
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
              >
                読み込み
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* メッセージ読み込み結果 */}
      {loadedMessage && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">読み込み結果</h2>
          {loadedMessage.error ? (
            <div className="p-4 bg-red-100 rounded">
              <p className="text-red-700">エラー: {loadedMessage.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded">
                <h3 className="font-medium">メタデータ</h3>
                <pre className="text-sm mt-2">{JSON.stringify(loadedMessage.metadata, null, 2)}</pre>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium">内容</h3>
                <div className="mt-2 whitespace-pre-wrap">{loadedMessage.content}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}