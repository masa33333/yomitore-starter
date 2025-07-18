'use client';

import React, { useState, useEffect } from 'react';
import { getMessageQueue, loadMessageByTrigger } from '@/utils/messageLoader';
import type { MessageData } from '@/utils/messageLoader';

interface MessageViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageViewModal({ isOpen, onClose }: MessageViewModalProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(false);

  // メッセージリストを読み込み
  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const queue = getMessageQueue();
      const loadedMessages: MessageData[] = [];
      
      for (const queueItem of queue) {
        const messageData = await loadMessageByTrigger(queueItem.trigger);
        if (messageData) {
          loadedMessages.push(messageData);
        }
      }
      
      setMessages(loadedMessages);
    } catch (error) {
      console.error('メッセージ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-w-2xl w-full max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📬</span>
              <h3 className="text-xl font-bold">メール・手紙ボックス</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm opacity-90 mt-1">
            {messages.length}件のメッセージがあります
          </p>
        </div>

        {/* メッセージリスト */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">読み込み中...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📭</span>
              <p>新しいメッセージはありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MessageCard key={index} message={message} />
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              猫と一緒に世界を旅しよう！
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 個別メッセージカード
function MessageCard({ message }: { message: MessageData }) {
  const { metadata, content } = message;
  const isLetter = metadata.type === 'letter';

  return (
    <div className={`border rounded-lg p-4 ${isLetter ? 'border-purple-200 bg-purple-50' : 'border-blue-200 bg-blue-50'}`}>
      {/* メッセージヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{isLetter ? '📮' : '✉️'}</span>
          <span className={`text-sm font-medium ${isLetter ? 'text-purple-600' : 'text-blue-600'}`}>
            {isLetter ? '手紙' : 'メール'}
          </span>
          {metadata.city && (
            <span className="text-sm text-gray-500">from {metadata.city}</span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {metadata.trigger}語達成
        </span>
      </div>

      {/* 画像 */}
      {metadata.image && (
        <div className="mb-3">
          <img
            src={metadata.image}
            alt={`${metadata.city || metadata.type} image`}
            className="w-full h-24 object-cover rounded"
          />
        </div>
      )}

      {/* メッセージ内容（最初の3行のみ表示） */}
      <div className="prose prose-sm max-w-none">
        {content.split('\n').slice(0, 3).map((line, index) => (
          <p key={index} className="mb-1 text-gray-700 text-sm leading-relaxed">
            {line}
          </p>
        ))}
        {content.split('\n').length > 3 && (
          <p className="text-xs text-gray-500 mt-2">...</p>
        )}
      </div>
    </div>
  );
}