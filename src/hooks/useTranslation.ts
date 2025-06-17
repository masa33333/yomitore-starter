import { useLanguage } from '@/context/LanguageContext';
import { useMemo } from 'react';

// 翻訳データの型定義
type TranslationData = {
  [key: string]: string;
};

// 翻訳ファイルをインポート
import enTranslations from '@/locales/en.json';
import jaTranslations from '@/locales/ja.json';

const translations: { [key: string]: TranslationData } = {
  en: enTranslations,
  ja: jaTranslations,
};

export function useTranslation() {
  const { displayLang, isInitialized } = useLanguage();

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      // 初期化が完了するまではfallbackまたはkeyを返す
      if (!isInitialized) {
        return fallback || key;
      }
      
      const currentTranslations = translations[displayLang] || translations.ja;
      return currentTranslations[key] || fallback || key;
    };
  }, [displayLang, isInitialized]);

  return { t, currentLang: displayLang, isInitialized };
}