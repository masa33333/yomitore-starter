'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [displayLang, setDisplayLang] = useState('ja');
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期化: localStorageから言語設定を読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage === 'en' || savedLanguage === 'ja') {
        setDisplayLang(savedLanguage);
      }
      setIsInitialized(true);
    }
  }, []);

  // 言語変更関数: 状態更新 + localStorage保存
  const setLanguage = (lang) => {
    setDisplayLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      displayLang, 
      setDisplayLang: setLanguage, 
      isInitialized 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}