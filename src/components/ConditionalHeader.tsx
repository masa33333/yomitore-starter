'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Header を非表示にするページ
  const hideHeaderPages = ['/tokyo', '/map'];
  
  // 現在のパスがHeader非表示ページに含まれている場合はnullを返す
  if (hideHeaderPages.includes(pathname)) {
    return null;
  }
  
  return <Header />;
}