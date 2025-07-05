'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// スクロールを無効化すべきページのパス
const NO_SCROLL_PAGES = [
  '/',
  '/start',
  '/tokyo',
  '/quiz',
  '/choose'
];

export function useScrollControl() {
  const pathname = usePathname();

  useEffect(() => {
    const shouldDisableScroll = NO_SCROLL_PAGES.includes(pathname);
    
    if (shouldDisableScroll) {
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // スクロールを有効化
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }

    // クリーンアップ
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [pathname]);
}