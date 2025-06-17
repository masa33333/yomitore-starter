'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function Header() {
  const { displayLang, setDisplayLang } = useLanguage();
  const [hasNewLetter, setHasNewLetter] = useState(false);
  const [showMailNotification, setShowMailNotification] = useState(false);

  // 手紙通知の確認（従来のシステム）
  useEffect(() => {
    const newLetter = localStorage.getItem('newLetter');
    setHasNewLetter(!!newLetter);
  }, []);

  // 📧 新しい通知システム：reading page からの通知状態を確認
  useEffect(() => {
    const checkNotificationStatus = () => {
      const notified = localStorage.getItem('notified') === 'true';
      
      // notified が true の時のみ通知バッジを表示
      setShowMailNotification(notified);
    };

    // 初回チェック
    checkNotificationStatus();

    // localStorage の変更を監視（他のタブでの変更も検知）
    const handleStorageChange = (e) => {
      if (e.key === 'notified') {
        checkNotificationStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期的にチェック（同一タブ内での変更も検知）
    const interval = setInterval(checkNotificationStatus, 1000);

    return () => {
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
  };

  // 表示言語に応じたテキスト取得関数
  const getText = (key) => {
    return headerText[key][displayLang];
  };
  return (
    <header className="bg-header-bg text-text-primary px-4 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* 左側: ロゴ + 言語トグル + 手紙通知 */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold hover:opacity-70">
            {getText('logo')}
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
          <Link 
            href="/letter" 
            className="relative flex items-center hover:opacity-70"
          >
            {/* 📧 通知状態に応じてアイコンを切り替え */}
            {showMailNotification ? (
              // 通知あり：赤い矢印付きメール
              <span className="text-2xl">📩</span>
            ) : (
              // 通知なし：シンプルな封筒
              <span className="text-2xl">✉️</span>
            )}
            
            {/* 🔴 赤いバッジ：notified="true" の時のみ表示 */}
            {showMailNotification && (
              <>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </>
            )}
          </Link>
        </div>
        
        {/* 右側: ナビゲーションメニュー */}
        <nav className="flex gap-2 sm:gap-4">
          <Link href="/notebook" className="hover:opacity-70 text-sm sm:text-base">
            {getText('notes')}
          </Link>
          <Link href="/history" className="hover:opacity-70 text-sm sm:text-base">
            {getText('history')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
