/**
 * メール生成テスト用ユーティリティ
 */

import { saveLetterToStorage } from './letterStorage';

export function generateTestMailForRoute(fromCity: string, toCity: string) {
  const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
  const catName = localStorage.getItem('catName') || 'Your cat';
  
  const testMailContent = {
    en: `Hello from high above the clouds!

I'm writing to you during my flight from ${fromCity} to ${toCity}. The view from up here is absolutely breathtaking! I can see the vast landscape stretching endlessly below us.

The flight attendant just served some delicious fish - exactly what a traveling cat like me needs. I've been thinking about all the reading you've been doing, and it fills my heart with joy.

Your dedication to reading is what makes this incredible journey possible. Every word you read gives me the strength to fly further and discover new places.

I can't wait to share more adventures with you from ${toCity}. Keep reading, my dear friend!

Love,
${catName}`,
    jp: `雲の上からこんにちは！

${fromCity}から${toCity}への飛行中に手紙を書いています。ここからの景色は本当に息をのむほど美しいです！眼下には果てしなく続く大地が見えます。

客室乗務員さんがおいしいお魚を出してくれました。旅するネコの私にはぴったりです。あなたがずっと読書を続けてくれていることを思うと、心が喜びでいっぱいになります。

あなたの読書への献身が、この素晴らしい旅を可能にしているのです。あなたが読む一つ一つの言葉が、私がより遠くまで飛び、新しい場所を発見する力を与えてくれます。

${toCity}からもっと多くの冒険をあなたと分かち合えるのが楽しみです。読書を続けてくださいね、親愛なる友よ！

愛を込めて、
${catName}`
  };

  const wordCount = testMailContent.en.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedDuration = Math.max(1800000, wordCount * 60000 / 200); // 最低30分、または200WPMでの推定時間
  const estimatedWPM = Math.round(wordCount / (estimatedDuration / 60000));

  const mailData = {
    type: "letter" as const, // スタンプカード統合でmailタイプ廃止
    jp: testMailContent.jp,
    en: {
      [userLevel]: testMailContent.en
    },
    fromCity,
    toCity,
    level: userLevel,
    wordCount: wordCount,
    duration: estimatedDuration,
    wpm: estimatedWPM,
    catName: catName,
  };

  console.log('📧 Generating test mail:', mailData);
  saveLetterToStorage(mailData);
  
  // 通知を表示
  // 通知表示（旧notificationUtilsから移行）
  localStorage.setItem('hasNewLetter', 'true');
  localStorage.setItem('notified', 'true');
  localStorage.setItem('mailNotified', 'true');
  console.log('📧 Test mail notification set');
  
  return mailData;
}

/**
 * 即時検証用の暫定テストデータ生成
 */
export function createQuickTestMail(fromCity: string = "Tokyo", toCity: string = "Seoul", milestone: number = 30) {
  // 📧 実際の保存構造に合わせたテストメール
  const testMail = {
    type: "letter", // スタンプカード統合でmailタイプ廃止
    fromCity: fromCity,
    toCity: toCity,
    milestone: milestone,
    wordCount: 150,
    duration: 1800000, // 30分
    wpm: 300,
    jp: `${milestone}分の読書、ありがとう！ 

${fromCity}から${toCity}への機内より。雲の上は美しいです。あなたの読書のおかげで、私はこの素晴らしい旅を続けることができます。

愛を込めて、
あなたのネコ`,
    en: `Thank you for reading for ${milestone} minutes!

I'm writing this from high above the clouds during my flight from ${fromCity} to ${toCity}. The scenery up here is absolutely breathtaking, and I wanted to share this moment with you.

Your commitment to reading makes this incredible journey possible. Every word you read gives me the energy to soar through the skies and explore new destinations.

With love and gratitude,
Your traveling companion`
  };

  console.log('📧 Creating quick test mail with correct structure:', testMail);
  localStorage.setItem("letterText", JSON.stringify(testMail));
  
  // 通知も設定
  // 通知表示（旧notificationUtilsから移行）
  localStorage.setItem('hasNewLetter', 'true');
  localStorage.setItem('notified', 'true');
  localStorage.setItem('mailNotified', 'true');
  console.log('📧 Test mail notification set');
  
  console.log('✅ Quick test mail saved to localStorage');
  return testMail;
}

/**
 * ブラウザコンソールから直接実行可能な関数
 */
if (typeof window !== 'undefined') {
  (window as any).generateTestMail = generateTestMailForRoute;
  (window as any).createQuickTestMail = createQuickTestMail;
  (window as any).debugMail = () => {
    const { debugContentState } = require('./letterDisplayHelpers');
    debugContentState();
  };
  
  console.log('🛠️ Test utilities loaded:');
  console.log('  - generateTestMail("Tokyo", "Seoul")');
  console.log('  - createQuickTestMail("Tokyo", "Seoul", 30)');
  console.log('  - debugMail()');
}