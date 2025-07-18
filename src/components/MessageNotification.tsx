'use client';

import React, { useState, useEffect } from 'react';
import { getMessageQueue, dequeueMessage, loadMessageByTrigger } from '@/utils/messageLoader';
import type { MessageData } from '@/utils/messageLoader';
import { playNotificationSound } from '@/lib/messageNotificationSounds';

export default function MessageNotification() {
  const [currentMessage, setCurrentMessage] = useState<MessageData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // キューをチェックしてヘッダーバッジのみを更新（自動表示しない）
  const checkAndUpdateBadge = () => {
    console.log('🔍 キューをチェックしてヘッダーバッジを更新');
    updateHeaderNotificationBadge();
  };

  // ヘッダーから呼び出される：次のメッセージを表示
  const displayNextMessage = async () => {
    if (isVisible || isLoading) return; // 既に表示中またはロード中の場合はスキップ
    
    const queuedMessage = dequeueMessage();
    if (!queuedMessage) return;
    
    setIsLoading(true);
    
    try {
      console.log(`📮 Loading queued message: ${queuedMessage.type} for trigger ${queuedMessage.trigger}`);
      const messageData = await loadMessageByTrigger(queuedMessage.trigger);
      
      if (messageData) {
        setCurrentMessage(messageData);
        setIsVisible(true);
        
        // 📧 ヘッダー通知バッジを更新
        updateHeaderNotificationBadge();
        
        console.log(`✅ Message loaded and displayed: ${messageData.metadata.id}`);
      } else {
        console.warn(`⚠️ Failed to load message for trigger: ${queuedMessage.trigger}`);
      }
    } catch (error) {
      console.error('❌ Error loading message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 定期的にキューをチェック（バッジ更新のみ）
  useEffect(() => {
    const interval = setInterval(checkAndUpdateBadge, 2000); // 2秒毎にチェック
    
    // 初回チェック（即座にバッジを更新）
    checkAndUpdateBadge();
    
    return () => clearInterval(interval);
  }, []);

  // ヘッダーからの表示要求をリスンする
  useEffect(() => {
    const handleShowMessage = () => {
      console.log('📧 ヘッダーから表示要求を受信');
      displayNextMessage();
    };

    window.addEventListener('showMessageFromHeader', handleShowMessage);
    return () => window.removeEventListener('showMessageFromHeader', handleShowMessage);
  }, [isVisible, isLoading]);

  // ヘッダー通知バッジを更新
  const updateHeaderNotificationBadge = () => {
    const queue = getMessageQueue();
    const unreadCount = queue.length;
    
    // localStorageに通知カウントを保存
    localStorage.setItem('messageNotificationCount', unreadCount.toString());
    
    // カスタムイベントを発火してヘッダーに通知
    window.dispatchEvent(new CustomEvent('messageNotificationUpdate', {
      detail: { count: unreadCount }
    }));
    
    console.log(`📧 ヘッダー通知更新: ${unreadCount}件`);
  };

  // メッセージを閉じる
  const handleClose = () => {
    setIsVisible(false);
    setCurrentMessage(null);
    
    // 通知バッジを更新（1件減る）
    updateHeaderNotificationBadge();
  };

  if (!isVisible || !currentMessage) return null;

  const { metadata, content } = currentMessage;
  const isLetter = metadata.type === 'letter';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-w-md w-full max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className={`px-6 py-4 text-white ${isLetter ? 'bg-purple-600' : 'bg-blue-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{isLetter ? '📮' : '✉️'}</span>
              <h3 className="text-lg font-bold">
                {isLetter ? '手紙が届きました！' : 'メールが届きました！'}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
          {metadata.city && (
            <p className="text-sm opacity-90 mt-1">
              From: {metadata.city}
            </p>
          )}
        </div>

        {/* スクロール可能な内容 */}
        <div className="flex-1 overflow-y-auto">
          {/* 画像 */}
          {metadata.image && (
            <div className="px-6 py-4">
              <img
                src={metadata.image}
                alt={`${metadata.city || metadata.type} image`}
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          )}

          {/* メッセージ内容 */}
          <div className="px-6 py-4">
            <div className="prose prose-sm max-w-none">
              {content.split('\n').map((line, index) => (
                <p key={index} className="mb-2 text-gray-700 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 bg-gray-50 border-t flex-shrink-0">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Trigger: {metadata.trigger}語</span>
            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded text-white font-medium ${
                isLetter 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// デバッグ用: 手動でメッセージをキューに追加する関数
export function debugQueueMessage(type: 'mail' | 'letter', trigger: number) {
  const { queueMessage } = require('@/utils/messageLoader');
  queueMessage(type, trigger);
  console.log(`🧪 Debug: Queued ${type} for trigger ${trigger}`);
}