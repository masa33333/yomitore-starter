/**
 * メール・手紙キャッチアップシステム
 * 現在の語数に基づいて、過去に送信されるべきだったメール・手紙を遡って送信
 */

import { shouldSendMail, shouldSendLetter } from './rewardRules';
import { queueMessage, getMessageQueue } from './messageLoader';

interface CatchupResult {
  mailsSent: number;
  lettersSent: number;
  triggers: number[];
}

/**
 * 現在の語数に基づいて、送信されるべきメール・手紙をキャッチアップ
 */
export function catchupMessages(currentWords: number): CatchupResult {
  const result: CatchupResult = {
    mailsSent: 0,
    lettersSent: 0,
    triggers: []
  };

  // 既存のキューを取得して、重複を避ける
  const existingQueue = getMessageQueue();
  const existingTriggers = new Set(existingQueue.map(msg => msg.trigger));

  console.log('🔍 メール・手紙キャッチアップ開始');
  console.log('現在の語数:', currentWords);
  console.log('既存キュー:', existingTriggers);

  // 300語から現在の語数まで、すべてのしきい値をチェック
  for (let words = 300; words <= currentWords; words++) {
    // 既にキューに存在する場合はスキップ
    if (existingTriggers.has(words)) {
      continue;
    }

    // メール判定
    if (shouldSendMail(words)) {
      queueMessage('mail', words);
      result.mailsSent++;
      result.triggers.push(words);
      console.log(`📬 キャッチアップメール送信: ${words}語`);
    }

    // 手紙判定
    if (shouldSendLetter(words)) {
      queueMessage('letter', words);
      result.lettersSent++;
      result.triggers.push(words);
      console.log(`📮 キャッチアップ手紙送信: ${words}語`);
    }
  }

  console.log('✅ キャッチアップ完了:', result);
  return result;
}

/**
 * 特定の語数範囲でのメール・手紙送信リストを取得（デバッグ用）
 */
export function getExpectedMessages(startWords: number, endWords: number): Array<{
  trigger: number;
  type: 'mail' | 'letter';
}> {
  const messages = [];

  for (let words = startWords; words <= endWords; words++) {
    if (shouldSendMail(words)) {
      messages.push({ trigger: words, type: 'mail' as const });
    }
    if (shouldSendLetter(words)) {
      messages.push({ trigger: words, type: 'letter' as const });
    }
  }

  return messages.sort((a, b) => a.trigger - b.trigger);
}

/**
 * 現在の語数に基づく自動キャッチアップ（アプリ起動時などに使用）
 */
export function autoRunCatchup(): CatchupResult {
  // localStorageから現在の語数を取得
  let currentWords = 0;
  
  try {
    // userProgressを優先、なければtotalWordsReadを使用
    const userProgress = localStorage.getItem('userProgress');
    if (userProgress) {
      const parsed = JSON.parse(userProgress);
      currentWords = parsed.totalWords || 0;
    } else {
      currentWords = parseInt(localStorage.getItem('totalWordsRead') || '0', 10);
    }
  } catch (error) {
    console.error('語数取得エラー:', error);
    return { mailsSent: 0, lettersSent: 0, triggers: [] };
  }

  if (currentWords === 0) {
    console.log('📍 語数が0のため、キャッチアップをスキップ');
    return { mailsSent: 0, lettersSent: 0, triggers: [] };
  }

  return catchupMessages(currentWords);
}

// 開発者コンソール用
if (typeof window !== 'undefined') {
  (window as any).catchupMessages = {
    catchupMessages,
    getExpectedMessages,
    autoRunCatchup
  };
}