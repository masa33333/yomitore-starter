/**
 * 通知表示用ユーティリティ - 全ての通知フラグを統一管理
 */

/**
 * 条件チェック付き通知設定 - 厳密な条件を満たした場合のみ通知
 */
export function showNotificationWithConditions(type: 'letter' | 'mail'): boolean {
  const totalWords = parseInt(localStorage.getItem('wordCountTotal') || '0', 10);
  const elapsedTime = parseInt(localStorage.getItem('elapsedReadingTime') || '0', 10);
  const elapsedMinutes = Math.floor(elapsedTime / (60 * 1000));
  
  console.log('📬 Checking notification conditions:', { 
    type, 
    totalWords, 
    elapsedMinutes, 
    elapsedTime 
  });
  
  if (type === 'letter') {
    // 到着手紙の条件：語数しきい値到達
    if (totalWords >= 5000) {
      // 📮 追加チェック：Seoul手紙が実際に生成されているかを確認
      const letterText = localStorage.getItem('letterText');
      if (letterText) {
        try {
          const parsed = JSON.parse(letterText);
          if (parsed.type === 'letter' && parsed.fromCity === 'Tokyo' && parsed.toCity === 'Seoul') {
            console.log('✅ Letter notification conditions met: Seoul letter exists (Tokyo→Seoul)');
            showNotification();
            return true;
          } else {
            console.log('❌ Letter notification conditions not met: Seoul letter not found', {
              letterType: parsed.type,
              fromCity: parsed.fromCity,
              toCity: parsed.toCity
            });
            return false;
          }
        } catch (error) {
          console.log('❌ Letter notification conditions not met: Parse error', error);
          return false;
        }
      } else {
        console.log('❌ Letter notification conditions not met: No letter in storage');
        return false;
      }
    } else {
      console.log('❌ Letter notification conditions not met:', { 
        totalWords, 
        required: 5000 
      });
      return false;
    }
  }
  
  if (type === 'mail') {
    // 道中メールの条件：
    // 1. 現在のルートの最低語数 + 500語以上
    // 2. 次のメール時間（30分、60分など）に到達
    let currentRouteThreshold = 0;
    let nextMailTime = 30; // 最初のメール時間（分）
    
    if (totalWords < 5000) {
      currentRouteThreshold = 0; // Tokyo-Seoul
      nextMailTime = 30;
    } else if (totalWords < 25000) {
      currentRouteThreshold = 5000; // Seoul-Beijing
      nextMailTime = 30;
    }
    
    const wordCondition = totalWords >= currentRouteThreshold + 500;
    const timeCondition = elapsedMinutes >= nextMailTime;
    
    console.log('📧 Mail notification conditions:', {
      wordCondition: `${totalWords} >= ${currentRouteThreshold + 500}`,
      timeCondition: `${elapsedMinutes} >= ${nextMailTime}`,
      wordConditionMet: wordCondition,
      timeConditionMet: timeCondition
    });
    
    if (wordCondition && timeCondition) {
      console.log('✅ Mail notification conditions met');
      showNotification();
      return true;
    } else {
      console.log('❌ Mail notification conditions not met');
      return false;
    }
  }
  
  return false;
}

/**
 * 通知フラグを一元的に設定（全フラグを同期）- 内部使用
 */
export function showNotification(): void {
  console.log('📬 Setting all notification flags...');
  
  // 新しいメール/手紙があることを示すフラグ
  localStorage.setItem('hasNewLetter', 'true');
  // Header用の通知バッジフラグ
  localStorage.setItem('notified', 'true');
  // Reading page用のメール通知フラグ
  localStorage.setItem('mailNotified', 'true');
  
  console.log('📬 All notification flags synchronized: hasNewLetter=true, notified=true, mailNotified=true');
  
  // 通知イベントを発火（他のコンポーネントが監視できるように）
  const event = new CustomEvent('newLetterArrived', {
    detail: { 
      timestamp: Date.now(),
      flags: {
        hasNewLetter: true,
        notified: true,
        mailNotified: true
      }
    }
  });
  window.dispatchEvent(event);
  
  console.log('📬 Notification event dispatched with synchronized flags');
}

/**
 * 通知フラグを一元的にクリア（全フラグを同期）
 */
export function clearNotification(): void {
  console.log('📬 Clearing all notification flags...');
  
  // 新しいメール/手紙フラグをクリア
  localStorage.removeItem('hasNewLetter');
  // Header用の通知バッジフラグをクリア
  localStorage.setItem('notified', 'false');
  // Reading page用のメール通知フラグをクリア
  localStorage.setItem('mailNotified', 'false');
  
  console.log('📬 All notification flags synchronized: hasNewLetter=removed, notified=false, mailNotified=false');
  
  // クリアイベントを発火
  const event = new CustomEvent('notificationCleared', {
    detail: { 
      timestamp: Date.now(),
      flags: {
        hasNewLetter: false,
        notified: false,
        mailNotified: false
      }
    }
  });
  window.dispatchEvent(event);
  
  console.log('📬 Notification clear event dispatched');
}

/**
 * メール/手紙通知があるかチェック
 */
export function hasNewLetterNotification(): boolean {
  return localStorage.getItem('hasNewLetter') === 'true';
}

/**
 * Header通知バッジの状態をチェック
 */
export function hasHeaderNotification(): boolean {
  return localStorage.getItem('notified') === 'true';
}

/**
 * Reading page メール通知の状態をチェック
 */
export function hasMailNotification(): boolean {
  return localStorage.getItem('mailNotified') === 'true';
}

/**
 * 全ての通知フラグの状態を取得（デバッグ用）
 */
export function getNotificationStatus(): {
  hasNewLetter: boolean;
  notified: boolean;
  mailNotified: boolean;
  elapsedReadingTime: number;
} {
  return {
    hasNewLetter: localStorage.getItem('hasNewLetter') === 'true',
    notified: localStorage.getItem('notified') === 'true',
    mailNotified: localStorage.getItem('mailNotified') === 'true',
    elapsedReadingTime: parseInt(localStorage.getItem('elapsedReadingTime') || '0', 10)
  };
}

/**
 * 通知フラグの整合性をチェック・修正（イベント発火なし）
 */
export function syncNotificationFlags(): void {
  const hasNewLetter = localStorage.getItem('hasNewLetter') === 'true';
  const notified = localStorage.getItem('notified') === 'true';
  const mailNotified = localStorage.getItem('mailNotified') === 'true';
  
  // いずれかのフラグが true の場合、全てを true に統一（イベント発火なし）
  if (hasNewLetter || notified || mailNotified) {
    console.log('📬 Notification flags out of sync, synchronizing...');
    
    // 🚨 無限ループを防ぐため、直接localStorageを更新（showNotification()を呼ばない）
    localStorage.setItem('hasNewLetter', 'true');
    localStorage.setItem('notified', 'true');
    localStorage.setItem('mailNotified', 'true');
    
    console.log('📬 Notification flags synchronized without event dispatch');
  } else {
    // 全て false/undefined の場合、明示的に false に設定
    console.log('📬 All notification flags are clear, ensuring consistency...');
    localStorage.setItem('notified', 'false');
    localStorage.setItem('mailNotified', 'false');
    localStorage.removeItem('hasNewLetter');
  }
}

/**
 * Legacy notify() function alias - for backward compatibility
 * この関数は showNotification() のエイリアスです
 */
export function notify(): void {
  console.log('📬 Legacy notify() called, redirecting to showNotification()');
  showNotification();
}

/**
 * デバッグ用：全ての通知関連情報を表示
 */
export function debugNotificationState(): void {
  const status = getNotificationStatus();
  const legacyFlags = {
    newLetter: localStorage.getItem('newLetter'),
    lastCity: localStorage.getItem('lastCity'),
  };
  
  console.log('🔍 Notification Debug State:', {
    unified: status,
    legacy: legacyFlags,
    timestamp: new Date().toISOString()
  });
  
  if (typeof window !== 'undefined') {
    console.table({
      'hasNewLetter': status.hasNewLetter,
      'notified': status.notified,
      'mailNotified': status.mailNotified,
      'elapsedReadingTime (min)': Math.round(status.elapsedReadingTime / 60000),
      'legacy newLetter': legacyFlags.newLetter || 'null',
      'lastCity': legacyFlags.lastCity || 'null'
    });
  }
}