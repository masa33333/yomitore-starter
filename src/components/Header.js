'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';
import { getMessageQueue } from '@/utils/messageLoader';
import MessageViewModal from './MessageViewModal';

export default function Header() {
  const { displayLang, setDisplayLang } = useLanguage();
  const [hasNewLetter, setHasNewLetter] = useState(false);
  const [showMailNotification, setShowMailNotification] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // 手紙通知の確認（従来のシステム）
  useEffect(() => {
    const newLetter = localStorage.getItem('newLetter');
    setHasNewLetter(!!newLetter);
  }, []);

  // 📧 新しいメール・手紙通知システム
  useEffect(() => {
    const updateNotificationCount = () => {
      const queue = getMessageQueue();
      const count = queue.length;
      setNotificationCount(count);
      setShowMailNotification(count > 0);
    };

    // 初回チェック
    updateNotificationCount();

    // カスタムイベントリスナー（MessageNotificationからの通知）
    const handleNotificationUpdate = (event) => {
      const count = event.detail.count;
      setNotificationCount(count);
      setShowMailNotification(count > 0);
    };

    window.addEventListener('messageNotificationUpdate', handleNotificationUpdate);

    // localStorage の変更を監視（他のタブでの変更も検知）
    const handleStorageChange = (e) => {
      if (e.key === 'messageQueue') {
        updateNotificationCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期的にチェック（同一タブ内での変更も検知）
    const interval = setInterval(updateNotificationCount, 2000);

    return () => {
      window.removeEventListener('messageNotificationUpdate', handleNotificationUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // ヘッダーテキストの定義
  const headerText = {
    logo: {
      ja: '多読トレーニング',
      en: 'Tadoku Training',
    },
    generate: {
      ja: '読み物生成',
      en: 'Generate Reading',
    },
    notes: {
      ja: 'マイノート',
      en: 'My Notes',
    },
    history: {
      ja: '履歴',
      en: 'History',
    },
    map: {
      ja: '地図',
      en: 'Map',
    },
  };

  // 表示言語に応じたテキスト取得関数
  const getText = (key) => {
    return headerText[key][displayLang];
  };

  // 手紙アイコンクリック処理
  const handleMessageIconClick = () => {
    setIsMessageModalOpen(true);
  };
  return (
    <header className="bg-header-bg text-text-primary px-4 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* 左側: ロゴ + 言語トグル + 手紙通知 */}
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:opacity-70">
            <Image 
              src="/images/logo.png" 
              alt="読みトレ" 
              width={120} 
              height={40}
              className="object-contain"
            />
          </Link>
          
          {/* Language Toggle */}
          <select
            value={displayLang}
            onChange={(e) => setDisplayLang(e.target.value)}
            className="px-2 py-1 bg-primary-inactive border border-text-primary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary"
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>

          {/* ネコからの手紙通知 */}
          <div className="relative flex items-center">
            {/* 📧 通知状態に応じてアイコンを切り替え */}
            {showMailNotification ? (
              // 通知あり：赤い矢印付きメール
              <span 
                className="text-2xl cursor-pointer hover:opacity-70"
                onClick={handleMessageIconClick}
              >
                📩
              </span>
            ) : (
              // 通知なし：シンプルな封筒
              <span 
                className="text-2xl cursor-pointer hover:opacity-70"
                onClick={handleMessageIconClick}
              >
                ✉️
              </span>
            )}
            
            {/* 🔴 通知バッジ：件数を表示 */}
            {showMailNotification && notificationCount > 0 && (
              <>
                <div className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* 右側: 空のスペース */}
        <div></div>
      </div>
      
      {/* メッセージビューモーダル */}
      <MessageViewModal 
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
      />
    </header>
  );
}
