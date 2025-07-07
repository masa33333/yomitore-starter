/**
 * 旧メール送信システムのlocalStorageキーをクリーンアップする関数
 * スタンプカードシステム実装前の準備として実行
 */
export function cleanupOldMailSystem(): void {
  const keysToClean = [
    // 到着メール関連
    'arrivalMail:tokyo',
    'arrivalMail:seoul', 
    'arrivalMail:Seoul',
    'arrivalMail:beijing',
    'arrivalMail:Beijing',
    
    // 道中メール関連
    'inFlightSent:tokyo-seoul',
    'inFlightSent:Tokyo-Seoul',
    'inFlightSent:seoul-beijing',
    'inFlightSent:Seoul-Beijing',
    'inFlightSent:beijing-shanghai',
    'inFlightSent:Beijing-Shanghai',
    
    // 通知関連
    'hasNewLetter',
    'notified',
    'mailNotified',
    
    // 進捗管理関連（現在のシステムで使用されていない可能性）
    'elapsedReadingTime'
  ];
  
  let cleanedCount = 0;
  let totalChecked = 0;
  
  console.log('🧹 Starting cleanup of old mail system localStorage keys...');
  
  // 具体的なキーをクリーンアップ
  keysToClean.forEach(key => {
    totalChecked++;
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      cleanedCount++;
      console.log(`🗑️ Removed: ${key}`);
    }
  });
  
  // パターンマッチングでさらにクリーンアップ
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('arrivalMail:') || key.startsWith('inFlightSent:')) {
      if (!keysToClean.includes(key)) {
        localStorage.removeItem(key);
        cleanedCount++;
        console.log(`🗑️ Removed (pattern match): ${key}`);
      }
    }
  });
  
  console.log(`✅ Cleanup complete: ${cleanedCount} keys removed out of ${totalChecked} checked`);
  console.log('🚀 System ready for new stamp card implementation');
}

/**
 * 必要に応じて手動でクリーンアップを実行
 * 開発者コンソールで cleanupOldMailSystem() を実行可能
 */
if (typeof window !== 'undefined') {
  (window as any).cleanupOldMailSystem = cleanupOldMailSystem;
}