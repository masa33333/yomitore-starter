/**
 * 通知表示用ユーティリティ
 */

export function showNotification(): void {
  // 到着メール通知フラグを設定
  localStorage.setItem('hasNewLetter', 'true');
  console.log('📬 New letter notification flag set');
  
  // 通知イベントを発火（他のコンポーネントが監視できるように）
  const event = new CustomEvent('newLetterArrived', {
    detail: { timestamp: Date.now() }
  });
  window.dispatchEvent(event);
  
  console.log('📬 Letter arrival notification displayed');
}

export function clearNotification(): void {
  localStorage.removeItem('hasNewLetter');
  console.log('📬 Letter notification cleared');
}

export function hasNewLetterNotification(): boolean {
  return localStorage.getItem('hasNewLetter') === 'true';
}