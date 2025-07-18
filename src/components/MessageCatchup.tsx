'use client';

import { useEffect, useState } from 'react';
import { autoRunCatchup } from '@/utils/catchupMessages';
import { playNotificationSound } from '@/lib/messageNotificationSounds';

/**
 * メール・手紙キャッチアップコンポーネント
 * アプリ起動時に自動的に過去のメール・手紙を送信
 */
export default function MessageCatchup() {
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    // 一度だけ実行
    if (hasRun) return;
    
    // 少し遅延してから実行（他のシステムの初期化を待つ）
    const timer = setTimeout(() => {
      try {
        console.log('🚀 メール・手紙キャッチアップ開始');
        const result = autoRunCatchup();
        
        if (result.mailsSent > 0 || result.lettersSent > 0) {
          console.log('📬 キャッチアップ完了:', {
            メール: result.mailsSent,
            手紙: result.lettersSent,
            送信した語数: result.triggers
          });
          
          // 🔊 音通知を再生（メールまたは手紙）
          if (result.lettersSent > 0) {
            playNotificationSound('letter');
          } else if (result.mailsSent > 0) {
            playNotificationSound('mail');
          }
        } else {
          console.log('📍 キャッチアップ対象なし（または既に送信済み）');
        }
        
        setHasRun(true);
      } catch (error) {
        console.error('❌ キャッチアップエラー:', error);
        setHasRun(true);
      }
    }, 2000); // 2秒後に実行

    return () => clearTimeout(timer);
  }, [hasRun]);

  // このコンポーネントはUIを持たない
  return null;
}

// デバッグ用: 手動実行関数
export function runManualCatchup() {
  console.log('🔧 手動キャッチアップ実行');
  const result = autoRunCatchup();
  console.log('結果:', result);
  return result;
}