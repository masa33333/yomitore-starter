/**
 * メール・手紙ローダーシステム
 * Markdown front-matter対応、dynamic import
 */

export interface MessageMetadata {
  id: string;
  trigger: number;
  image: string;
  city?: string;
  type?: 'mail' | 'letter';
}

export interface MessageData {
  metadata: MessageMetadata;
  content: string;
}

/**
 * 簡単なfront-matter解析
 */
function parseFrontMatter(content: string): { metadata: any; content: string } {
  const lines = content.split('\n');
  
  if (lines[0] !== '---') {
    return { metadata: {}, content };
  }
  
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return { metadata: {}, content };
  }
  
  const frontMatterLines = lines.slice(1, endIndex);
  const metadata: any = {};
  
  for (const line of frontMatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      // 数値の場合は変換
      if (/^\d+$/.test(value)) {
        metadata[key] = parseInt(value, 10);
      } else {
        metadata[key] = value;
      }
    }
  }
  
  const contentLines = lines.slice(endIndex + 1);
  return {
    metadata,
    content: contentLines.join('\n').trim()
  };
}

/**
 * メッセージを読み込み
 */
export async function loadMessage(
  kind: 'mail' | 'letter', 
  fileName: string
): Promise<MessageData | null> {
  try {
    const path = `/data/messages/${kind}s/${fileName}.md`;
    const response = await fetch(path);
    
    if (!response.ok) {
      console.warn(`⚠️ Message file not found: ${path}`);
      return null;
    }
    
    const rawContent = await response.text();
    const { metadata, content } = parseFrontMatter(rawContent);
    
    // メタデータにtype情報を追加
    metadata.type = kind;
    
    // ユーザーが付けた猫の名前で <name> を置換
    const catName = getCatName();
    const processedContent = content.replace(/<name>/g, catName);
    
    return {
      metadata: metadata as MessageMetadata,
      content: processedContent
    };
  } catch (error) {
    console.error(`❌ Failed to load message: ${kind}/${fileName}`, error);
    return null;
  }
}

/**
 * 猫の名前を取得（localStorageから）
 */
function getCatName(): string {
  if (typeof window === 'undefined') return 'ネコ';
  
  try {
    return localStorage.getItem('catName') || 'ネコ';
  } catch (error) {
    console.warn('Failed to get cat name from localStorage:', error);
    return 'ネコ';
  }
}

/**
 * trigger値からメッセージを読み込み
 */
export async function loadMessageByTrigger(
  trigger: number
): Promise<MessageData | null> {
  const { getMessageType, getMessageFileName } = await import('./rewardRules');
  
  const type = getMessageType(trigger);
  const fileName = getMessageFileName(trigger);
  
  if (!type || !fileName) {
    console.warn(`⚠️ No message found for trigger: ${trigger}`);
    return null;
  }
  
  return loadMessage(type, fileName);
}

/**
 * メッセージキューシステム
 */
interface QueuedMessage {
  type: 'mail' | 'letter';
  trigger: number;
  timestamp: number;
}

const MESSAGE_QUEUE_KEY = 'messageQueue';

export function queueMessage(type: 'mail' | 'letter', trigger: number): void {
  // SSR対応: サーバーサイドでは何もしない
  if (typeof window === 'undefined') return;
  
  try {
    const queue = getMessageQueue();
    
    // 重複チェック
    const exists = queue.some(msg => 
      msg.type === type && msg.trigger === trigger
    );
    
    if (!exists) {
      queue.push({
        type,
        trigger,
        timestamp: Date.now()
      });
      
      localStorage.setItem(MESSAGE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`📬 Queued ${type} for trigger ${trigger}`);
    }
  } catch (error) {
    console.error('❌ Failed to queue message:', error);
  }
}

export function getMessageQueue(): QueuedMessage[] {
  // SSR対応: サーバーサイドでは空配列を返す
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(MESSAGE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Failed to get message queue:', error);
    return [];
  }
}

export function dequeueMessage(): QueuedMessage | null {
  // SSR対応: サーバーサイドでは何もしない
  if (typeof window === 'undefined') return null;
  
  try {
    const queue = getMessageQueue();
    if (queue.length === 0) return null;
    
    // 優先順位: LETTER > MAIL、古い順
    queue.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'letter' ? -1 : 1;
      }
      return a.timestamp - b.timestamp;
    });
    
    const message = queue.shift();
    if (message) {
      localStorage.setItem(MESSAGE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`📮 Dequeued ${message.type} for trigger ${message.trigger}`);
    }
    
    return message || null;
  } catch (error) {
    console.error('❌ Failed to dequeue message:', error);
    return null;
  }
}

export function clearMessageQueue(): void {
  // SSR対応: サーバーサイドでは何もしない
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(MESSAGE_QUEUE_KEY);
  console.log('🗑️ Message queue cleared');
}

/**
 * デバッグ用：メッセージシステムの状態確認
 */
export function debugMessageSystem() {
  // SSR対応: サーバーサイドでは空のデータを返す
  if (typeof window === 'undefined') {
    return { queue: [] };
  }
  
  const queue = getMessageQueue();
  console.log('📊 Message System Debug:', {
    queueLength: queue.length,
    queue,
    queueKey: MESSAGE_QUEUE_KEY
  });
  return { queue };
}

// 開発者コンソール用
if (typeof window !== 'undefined') {
  (window as any).messageLoader = {
    loadMessage,
    loadMessageByTrigger,
    queueMessage,
    getMessageQueue,
    dequeueMessage,
    clearMessageQueue,
    debugMessageSystem
  };
}