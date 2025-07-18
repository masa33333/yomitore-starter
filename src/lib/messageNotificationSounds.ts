/**
 * メール・手紙通知の音システム
 */

/**
 * メール到着音を再生
 */
export function playMailNotificationSound() {
  try {
    // システムの通知音を使用
    const audio = new Audio('/sounds/mail-notification.mp3');
    audio.volume = 0.6;
    audio.play().catch(error => {
      console.warn('メール通知音の再生に失敗:', error);
      // フォールバック: 簡易音を即座に再生
      playSimpleNotificationSound('mail');
    });
  } catch (error) {
    console.warn('メール通知音システムエラー:', error);
    // フォールバック: 簡易音を即座に再生
    playSimpleNotificationSound('mail');
  }
}

/**
 * 手紙到着音を再生
 */
export function playLetterNotificationSound() {
  try {
    // より特別な音を使用
    const audio = new Audio('/sounds/letter-notification.mp3');
    audio.volume = 0.7;
    audio.play().catch(error => {
      console.warn('手紙通知音の再生に失敗:', error);
      // フォールバック: 簡易音を即座に再生
      playSimpleNotificationSound('letter');
    });
  } catch (error) {
    console.warn('手紙通知音システムエラー:', error);
    // フォールバック: 簡易音を即座に再生
    playSimpleNotificationSound('letter');
  }
}

/**
 * 簡易音生成（音声ファイルがない場合のフォールバック）
 */
export function playSimpleNotificationSound(type: 'mail' | 'letter') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // メールと手紙で異なる音程
    if (type === 'mail') {
      // メール: 軽やかな音
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    } else {
      // 手紙: より重厚な音
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(750, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.2);
    }
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.02, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    console.log(`🔊 ${type === 'mail' ? 'メール' : '手紙'}通知音を再生しました`);
  } catch (error) {
    console.warn('簡易通知音の生成に失敗:', error);
  }
}

/**
 * 通知音の再生（メイン関数）
 */
export function playNotificationSound(type: 'mail' | 'letter') {
  console.log(`🔊 ${type === 'mail' ? 'メール' : '手紙'}通知音を再生します`);
  
  // 即座に簡易音を再生（確実に音が出るように）
  playSimpleNotificationSound(type);
  
  // 音声ファイルも試す（存在する場合）
  if (type === 'mail') {
    playMailNotificationSound();
  } else {
    playLetterNotificationSound();
  }
}

/**
 * 通知許可を要求
 */
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('通知許可:', permission);
    });
  }
}

// 開発者コンソール用
if (typeof window !== 'undefined') {
  (window as any).messageNotificationSounds = {
    playMailNotificationSound,
    playLetterNotificationSound,
    playSimpleNotificationSound,
    playNotificationSound,
    requestNotificationPermission
  };
}