/**
 * 緊急テスト用：メール表示を強制する
 */

export function forceMailDisplay() {
  console.log('🚨 FORCE MAIL DISPLAY: Creating test mail...');
  
  const testMail = {
    type: "mail",
    fromCity: "Tokyo",
    toCity: "Seoul", 
    milestone: 30,
    wordCount: 120,
    duration: 1800000,
    wpm: 240,
    jp: `30分の読書、ありがとう！

東京からソウルへの機内より。雲の上から見る景色は本当に美しいです。

あなたの読書のおかげで、私はこの素晴らしい旅を続けることができています。

愛を込めて、
あなたのネコ`,
    en: `Thank you for reading for 30 minutes!

I'm writing from the flight between Tokyo and Seoul. The view from above the clouds is truly magnificent.

Thanks to your reading, I can continue this wonderful journey.

With love,
Your Cat`
  };

  // 1. letterTextに保存
  localStorage.setItem("letterText", JSON.stringify(testMail));
  console.log('📧 Test mail saved to letterText');

  // 2. 通知を安全に設定（無限ループ回避）
  localStorage.setItem('hasNewLetter', 'true');
  localStorage.setItem('notified', 'true');
  localStorage.setItem('mailNotified', 'true');
  console.log('📧 Notification flags set safely');

  // 3. Dev modeを有効にしてmail強制表示
  const devConfig = {
    enabled: true,
    forceMail: "Tokyo-Seoul",
    overrideReadingTime: 1800000, // 30分
    debugLogging: true
  };
  localStorage.setItem('devModeConfig', JSON.stringify(devConfig));
  console.log('🛠️ Dev mode enabled with forced mail');

  console.log('✅ FORCE MAIL SETUP COMPLETE. Navigate to /letter to see mail.');
  
  return testMail;
}

export function checkCurrentLetterStorage() {
  const rawData = localStorage.getItem('letterText');
  console.log('📧 Current letterText:', rawData);
  
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      console.log('📧 Parsed letterText:', parsed);
      console.log('📧 Type:', parsed.type);
      console.log('📧 From-To:', `${parsed.fromCity}-${parsed.toCity}`);
      return parsed;
    } catch (error) {
      console.error('📧 Failed to parse letterText:', error);
    }
  } else {
    console.log('📧 No letterText in localStorage');
  }
  return null;
}

export function clearAllNotifications() {
  localStorage.removeItem('hasNewLetter');
  localStorage.setItem('notified', 'false');
  localStorage.setItem('mailNotified', 'false');
  console.log('📧 All notifications cleared');
}

// ブラウザコンソールからアクセス可能
if (typeof window !== 'undefined') {
  (window as any).forceMailDisplay = forceMailDisplay;
  (window as any).checkCurrentLetterStorage = checkCurrentLetterStorage;
  (window as any).clearAllNotifications = clearAllNotifications;
  console.log('🚨 Emergency functions loaded:');
  console.log('  - forceMailDisplay()');
  console.log('  - checkCurrentLetterStorage()');
  console.log('  - clearAllNotifications()');
}