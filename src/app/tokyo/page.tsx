'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export default function TokyoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showButton, setShowButton] = useState(false);
  const [catName, setCatName] = useState<string>('Your cat');
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // 猫の名前と言語を取得
    const savedCatName = localStorage.getItem('catName') || 'Your cat';
    const savedLang = localStorage.getItem('language') || 'en';
    setCatName(savedCatName);
    setCurrentLang(savedLang);

    // 0.5秒後にメッセージをフェードイン
    const messageTimer = setTimeout(() => {
      setShowMessage(true);
    }, 500);

    // 2秒後にボタンを表示
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const handleNext = () => {
    router.push('/map');
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4">
      {/* 背景画像 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/cat_japan.png')",
        }}
      >
        {/* 半透明オーバーレイ */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* コンテンツ */}
      <div className="relative z-10 bg-white/15 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-lg w-full text-center mt-32">
        {/* セリフ表示エリア */}
        <div className="min-h-[80px] flex flex-col justify-center space-y-4 mb-6">
          <p
            className={`text-lg text-white font-semibold leading-relaxed transition-all duration-1000 drop-shadow-lg ${
              showMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ whiteSpace: 'pre-line' }}
          >
            {currentLang === 'ja' 
              ? `${catName}：${t('tokyo_message')}` 
              : `${catName}: ${t('tokyo_message')}`}
          </p>
        </div>

        {/* 次に進むボタン - 固定の高さを確保 */}
        <div className="h-[60px] flex items-center justify-center">
          {showButton && (
            <button
              onClick={handleNext}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 animate-pulse hover:animate-none"
            >
              {t('tokyo_button')}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}