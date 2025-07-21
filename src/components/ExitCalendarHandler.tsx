'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ExitCalendarHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // カレンダーページ、storiesページ、読書ページ、chooseページでは動作させない
    if (pathname === '/calendar' || pathname === '/stories' || pathname.startsWith('/reading') || pathname === '/choose') {
      return;
    }

    let isNavigatingAway = false;

    // ページ離脱・アプリ終了の検知
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // storiesページまたは読書ページへの遷移中は確認ダイアログを表示しない
      if (isNavigatingAway) {
        return;
      }
      
      e.preventDefault();
      
      // モダンブラウザでは直接リダイレクトはできないが、
      // ユーザーが離脱を確認した後にカレンダーページに移動
      setTimeout(() => {
        if (!isNavigatingAway) {
          router.push('/calendar');
        }
      }, 100);
      
      // ブラウザの確認ダイアログを表示（オプション）
      return (e.returnValue = '読書の記録を確認しますか？');
    };

    // ページの可視性変更の検知（タブ切り替え、アプリ最小化など）
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ページが非表示になった場合（タブ切り替え、アプリ最小化）
        setTimeout(() => {
          if (document.hidden && !isNavigatingAway) {
            router.push('/calendar');
          }
        }, 2000); // 2秒後に実行（短時間のタブ切り替えを除外）
      }
    };

    // 他のページへの内部ナビゲーション検知
    const handlePopState = () => {
      isNavigatingAway = true;
      // 内部ナビゲーションの場合はカレンダーを表示しない
    };

    // イベントリスナーを追加
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    // ページ内リンククリックの検知
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href');
        // 内部リンクの場合（reading、stories、calendarページへは確実に除外）
        if (href && (href.startsWith('/') || href.startsWith('#'))) {
          isNavigatingAway = true;
          // reading、stories、calendarページへの遷移では絶対にbeforeunloadを発動させない
          if (href.startsWith('/reading') || href.startsWith('/stories') || href.startsWith('/calendar')) {
            window.removeEventListener('beforeunload', handleBeforeUnload);
          }
        }
        // 外部リンクの場合はカレンダーを表示
        else if (href && (href.startsWith('http') || href.startsWith('mailto'))) {
          setTimeout(() => {
            router.push('/calendar');
          }, 100);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    // クリーンアップ
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, [router, pathname]);

  return null; // UIは表示しない
}