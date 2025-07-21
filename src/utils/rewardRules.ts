/**
 * 新メール・手紙・報酬システムの判定ルール
 * mail.mdの要件に基づく実装
 * 
 * 新ルール:
 * - 出発メール: 300語
 * - 以後、メール3通（+5,000語間隔）→ 次の+5,000語で手紙
 * - 例: 300, 5300, 10300でメール、20300で手紙
 * - 以降20,000語周期（メール×3 → 手紙）の繰り返し
 * - 1,000,000語で手紙50通 / メール150通
 */

export function shouldSendMail(totalWords: number): boolean {
  // ① 出発メール（300語）
  if (totalWords === 300) return true;
  
  // ② 初期メール（5300語）
  if (totalWords === 5_300) return true;
  
  // ③ 初期メール（15300語）
  if (totalWords === 15_300) return true;

  // ④ 20300語以降の周期メール：25300語から20,000語サイクル
  //     25300, 30300, 35300でメール、その後20000語毎
  if (totalWords >= 25_300) {
    const d = totalWords - 25_300;
    return d >= 0 && [0, 5_000, 10_000].includes(d % 20_000);
  }
  
  return false;
}

export function shouldSendLetter(totalWords: number): boolean {
  // ① Seoul手紙（1000語）- 旧システム復活
  if (totalWords === 1_000) return true;
  
  // ② Beijing手紙（2000語）- 旧システム復活  
  if (totalWords === 2_000) return true;
  
  // ③ Seoul手紙（10300語）- 新システム
  if (totalWords === 10_300) return true;
  
  // ④ Beijing手紙（20300語）- 新システム
  if (totalWords === 20_300) return true;
  
  // ③ 40300語以降の周期手紙：40300語から20,000語サイクル
  if (totalWords >= 40_300) {
    const d = totalWords - 40_300;
    return d >= 0 && d % 20_000 === 0;
  }
  
  // 特別ケース：1,000,000語ちょうどで手紙
  if (totalWords === 1_000_000) return true;
  
  return false;
}

// コイン：カード1枚 (2,000語) 毎
export function shouldGiveCoin(totalWords: number): boolean {
  return totalWords > 0 && totalWords % 2_000 === 0;
}

// トロフィー：累積閾値
export function getTrophyRank(totalWords: number):
  'NONE' | 'MEDAL' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (totalWords >= 1_000_000) return 'PLATINUM';
  if (totalWords >=   500_000) return 'GOLD';
  if (totalWords >=   100_000) return 'SILVER';
  if (totalWords >=    20_000) return 'BRONZE';
  if (totalWords >=     2_000) return 'MEDAL';
  return 'NONE';
}

/**
 * trigger値からメール/手紙の種類を判定
 */
export function getMessageType(trigger: number): 'mail' | 'letter' | null {
  if (shouldSendMail(trigger)) return 'mail';
  if (shouldSendLetter(trigger)) return 'letter';
  return null;
}

/**
 * trigger値からメール/手紙のファイル名を生成
 */
export function getMessageFileName(trigger: number): string | null {
  const type = getMessageType(trigger);
  if (!type) return null;
  
  if (type === 'mail') {
    // メールファイル名の生成
    if (trigger === 300) return '000_tokyo_departure';
    if (trigger === 5_300) return '001_tokyo_seoul_mail1';
    if (trigger === 15_300) return '002_seoul_beijing_mail1';
    
    // 25300語以降の周期メール
    if (trigger >= 25_300) {
      const d = trigger - 25_300;
      const cycle = Math.floor(d / 20_000);
      const position = (d % 20_000) / 5_000;
      
      if (position === 0) return `${String(cycle * 3 + 3).padStart(3, '0')}_cycle${cycle}_mail1`;
      if (position === 1) return `${String(cycle * 3 + 4).padStart(3, '0')}_cycle${cycle}_mail2`;
      if (position === 2) return `${String(cycle * 3 + 5).padStart(3, '0')}_cycle${cycle}_mail3`;
    }
  }
  
  if (type === 'letter') {
    // 手紙ファイル名の生成
    if (trigger === 1_000) return '000_seoul_arrival';    // 旧システム復活
    if (trigger === 2_000) return '001_beijing_arrival';  // 旧システム復活
    if (trigger === 10_300) return '000_seoul_arrival';   // 新システム（同じファイル）
    if (trigger === 20_300) return '001_beijing_arrival'; // 新システム（同じファイル）
    
    // 40300語以降の周期手紙
    if (trigger >= 40_300) {
      const letterIndex = Math.floor((trigger - 40_300) / 20_000) + 2; // seoul, beijingの次から
      const cities = ['shanghai', 'mumbai', 'cairo', 'london', 'paris']; // 都市を順番に割り当て
      const city = cities[(letterIndex - 2) % cities.length];
      return `${String(letterIndex).padStart(3, '0')}_${city}_arrival`;
    }
  }
  
  return null;
}

/**
 * デバッグ用：語数に対する次のイベントを取得
 */
export function getNextEvents(totalWords: number): Array<{type: string, trigger: number, description: string}> {
  const events = [];
  
  // 次のメール
  for (let words = totalWords + 1; words <= totalWords + 20_000; words++) {
    if (shouldSendMail(words)) {
      events.push({
        type: 'mail',
        trigger: words,
        description: `メール送信（${words}語）`
      });
      break;
    }
  }
  
  // 次の手紙
  for (let words = totalWords + 1; words <= totalWords + 20_000; words++) {
    if (shouldSendLetter(words)) {
      events.push({
        type: 'letter',
        trigger: words,
        description: `手紙送信（${words}語）`
      });
      break;
    }
  }
  
  // 次のコイン
  const nextCoin = Math.ceil(totalWords / 2_000) * 2_000;
  if (nextCoin > totalWords) {
    events.push({
      type: 'coin',
      trigger: nextCoin,
      description: `コイン獲得（${nextCoin}語）`
    });
  }
  
  // 次のトロフィー
  const trophyThresholds = [2_000, 20_000, 100_000, 500_000, 1_000_000];
  for (const threshold of trophyThresholds) {
    if (threshold > totalWords) {
      const rank = getTrophyRank(threshold);
      events.push({
        type: 'trophy',
        trigger: threshold,
        description: `${rank}トロフィー獲得（${threshold}語）`
      });
      break;
    }
  }
  
  return events.sort((a, b) => a.trigger - b.trigger);
}

/**
 * 累計語数からこれまでに送信されているべきメール・手紙数を計算
 */
export function getExpectedMessageCounts(totalWords: number): {mails: number, letters: number} {
  let mails = 0;
  let letters = 0;
  
  // 出発メール（300語）- カウントに含める
  if (totalWords >= 300) mails++;
  
  // 初期メール（5300語）
  if (totalWords >= 5_300) mails++;
  
  // Seoul手紙（10300語）
  if (totalWords >= 10_300) letters++;
  
  // 中間メール（15300語）
  if (totalWords >= 15_300) mails++;
  
  // Beijing手紙（20300語）
  if (totalWords >= 20_300) letters++;
  
  // 25300語以降の周期メール：25300, 30300, 35300でメール、その後20000語毎
  if (totalWords >= 25_300) {
    const d = totalWords - 25_300;
    const completeCycles = Math.floor(d / 20_000);
    const remainingWords = d % 20_000;
    
    // 完了した周期分のメール（各周期3通）
    mails += completeCycles * 3;
    
    // 現在の周期内のメール
    if (remainingWords >= 0) mails++; // 25300語時点
    if (remainingWords >= 5_000) mails++; // 30300語時点
    if (remainingWords >= 10_000) mails++; // 35300語時点
  }
  
  // 40300語以降の周期手紙：40300語から20,000語サイクル
  if (totalWords >= 40_300) {
    const d = totalWords - 40_300;
    const letterCycles = Math.floor(d / 20_000) + 1; // +1 for the letter at 40300
    letters += letterCycles;
  }
  
  // 特別ケース：1,000,000語ちょうどで追加の手紙
  if (totalWords === 1_000_000) {
    letters += 1;
  }
  
  return { mails, letters };
}

/**
 * デバッグ用：1,000,000語時点での検証
 */
export function validateSystemAt1M(): {success: boolean, details: any} {
  const counts = getExpectedMessageCounts(1_000_000);
  const expected = { mails: 150, letters: 50 };
  
  return {
    success: counts.mails === expected.mails && counts.letters === expected.letters,
    details: {
      calculated: counts,
      expected,
      difference: {
        mails: counts.mails - expected.mails,
        letters: counts.letters - expected.letters
      }
    }
  };
}

// 開発者コンソール用
if (typeof window !== 'undefined') {
  (window as any).rewardRules = {
    shouldSendMail,
    shouldSendLetter,
    shouldGiveCoin,
    getTrophyRank,
    getMessageFileName,
    getNextEvents,
    getExpectedMessageCounts,
    validateSystemAt1M
  };
}