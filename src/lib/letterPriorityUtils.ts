/**
 * Letter Priority Management Utilities
 * 手紙・メールの優先度管理ユーティリティ
 */

type LetterData = {
  type: "letter" | "mail";
  fromCity: string;
  toCity: string;
  level: number;
  jp: string;
  en: { [level: number]: string };
  wordCount: number;
  duration: number;
  wpm: number;
  catName?: string;
  cityImage?: string;
};

/**
 * キューの次のアイテムを処理
 * Process next item in queue
 */
export function processNextInQueue(): boolean {
  try {
    console.log('📋 processNextInQueue: Checking for queued letters/mails...');
    
    // キューから次のアイテムを取得
    const queueData = localStorage.getItem('letterQueue');
    if (!queueData) {
      console.log('📋 processNextInQueue: No queue data found');
      return false;
    }
    
    const queue = JSON.parse(queueData);
    if (!Array.isArray(queue) || queue.length === 0) {
      console.log('📋 processNextInQueue: Queue is empty');
      return false;
    }
    
    // 最初のアイテムを処理
    const nextItem = queue.shift();
    localStorage.setItem('letterQueue', JSON.stringify(queue));
    
    // アイテムをストレージに保存
    localStorage.setItem('letterText', JSON.stringify(nextItem));
    console.log('📋 processNextInQueue: Processed item:', nextItem.type);
    
    return true;
  } catch (error) {
    console.error('❌ processNextInQueue error:', error);
    return false;
  }
}

/**
 * 手紙完了後の保留中メールをチェック
 * Check for pending mail after letter completion
 */
export function checkForPendingMailAfterLetterCompletion(): void {
  try {
    console.log('📬 checkForPendingMailAfterLetterCompletion: Checking for pending mails...');
    
    // 保留中のメールがあるかチェック
    const pendingMails = localStorage.getItem('pendingMails');
    if (!pendingMails) {
      console.log('📬 checkForPendingMailAfterLetterCompletion: No pending mails');
      return;
    }
    
    const mails = JSON.parse(pendingMails);
    if (!Array.isArray(mails) || mails.length === 0) {
      console.log('📬 checkForPendingMailAfterLetterCompletion: No pending mails in array');
      return;
    }
    
    // 最初のメールを処理
    const nextMail = mails.shift();
    localStorage.setItem('pendingMails', JSON.stringify(mails));
    
    // メールを即座に表示用ストレージに移動
    localStorage.setItem('letterText', JSON.stringify(nextMail));
    console.log('📬 checkForPendingMailAfterLetterCompletion: Processed mail:', nextMail.fromCity, '→', nextMail.toCity);
    
  } catch (error) {
    console.error('❌ checkForPendingMailAfterLetterCompletion error:', error);
  }
}

/**
 * 優先度付きで保存
 * Save with priority handling
 */
export function saveWithPriority(letterData: LetterData): void {
  try {
    console.log('🔄 saveWithPriority: Processing letter/mail with priority...');
    
    // 現在の手紙/メールがあるかチェック
    const currentLetter = localStorage.getItem('letterText');
    
    if (currentLetter) {
      // 既存がある場合はキューに追加
      const queueData = localStorage.getItem('letterQueue') || '[]';
      const queue = JSON.parse(queueData);
      queue.push(letterData);
      localStorage.setItem('letterQueue', JSON.stringify(queue));
      console.log('🔄 saveWithPriority: Added to queue, position:', queue.length);
    } else {
      // 既存がない場合は直接保存
      localStorage.setItem('letterText', JSON.stringify(letterData));
      console.log('🔄 saveWithPriority: Saved directly');
    }
    
  } catch (error) {
    console.error('❌ saveWithPriority error:', error);
  }
}

/**
 * キューとキャッシュをクリア
 * Clear queue and cache
 */
export function clearLetterQueue(): void {
  try {
    localStorage.removeItem('letterQueue');
    localStorage.removeItem('pendingMails');
    console.log('🧹 Letter queue and pending mails cleared');
  } catch (error) {
    console.error('❌ clearLetterQueue error:', error);
  }
}

/**
 * キューの状態を取得
 * Get queue status
 */
export function getQueueStatus(): { queueLength: number, pendingMailsLength: number } {
  try {
    const queueData = localStorage.getItem('letterQueue') || '[]';
    const pendingMails = localStorage.getItem('pendingMails') || '[]';
    
    const queue = JSON.parse(queueData);
    const mails = JSON.parse(pendingMails);
    
    return {
      queueLength: Array.isArray(queue) ? queue.length : 0,
      pendingMailsLength: Array.isArray(mails) ? mails.length : 0
    };
  } catch (error) {
    console.error('❌ getQueueStatus error:', error);
    return { queueLength: 0, pendingMailsLength: 0 };
  }
}