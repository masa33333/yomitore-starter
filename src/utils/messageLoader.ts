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
    let processedContent = content.replace(/<name>/g, catName);
    
    // レベル別コンテンツの選択（メール・手紙の場合）
    if (kind === 'mail' || kind === 'letter') {
      const userLevel = getUserLevel();
      processedContent = selectLevelContent(processedContent, userLevel);
    }
    
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
 * ユーザーの語彙レベルを取得（localStorageから）
 */
function getUserLevel(): number {
  if (typeof window === 'undefined') return 2; // デフォルトレベル
  
  try {
    // 複数のキーから語彙レベルを探す（互換性のため）
    const level = localStorage.getItem('vocabLevel') || 
                  localStorage.getItem('vocabularyLevel') || 
                  localStorage.getItem('level') || 
                  localStorage.getItem('fixedLevel') || 
                  '2';
    
    const parsed = parseInt(level, 10);
    
    // 1-3の範囲に制限（既存のレベルシステムに合わせる）
    if (parsed >= 1 && parsed <= 3) {
      return parsed;
    }
    
    // 5段階レベルの場合は3段階に変換
    if (parsed >= 4 && parsed <= 5) {
      return 3;
    }
    
    return 2; // デフォルト
  } catch (error) {
    console.warn('Failed to get user level from localStorage:', error);
    return 2;
  }
}

/**
 * メールコンテンツからユーザーレベルに応じた内容を選択
 */
function selectLevelContent(content: string, userLevel: number): string {
  try {
    console.log(`🔍 Selecting content for level: ${userLevel}`);
    console.log(`📄 Original content length: ${content.length}`);
    
    // レベル分けがない単純なメール/手紙かチェック
    const hasLevelSections = content.includes('**Level 1') || content.includes('**Level 2') || content.includes('**Level 3');
    
    if (!hasLevelSections) {
      console.log(`📝 No level sections found - returning original content (simple mail/letter)`);
      return content;
    }
    
    // シンプルな文字列分割でレベル別コンテンツを抽出
    console.log(`🔧 Extracting level ${userLevel} content using simple string splitting`);
    
    // まず日本語セクションを分離
    const japaneseStart = content.indexOf('**日本語版:**');
    const englishPart = japaneseStart >= 0 ? content.substring(0, japaneseStart) : content;
    const japanesePart = japaneseStart >= 0 ? content.substring(japaneseStart) : '';
    
    // 日本語部分を抽出
    const japaneseMatch = japanesePart.match(/\*\*日本語版:\*\*\s*\n+([\s\S]*?)(?=\n*---|\s*$)/);
    const japaneseContent = japaneseMatch ? japaneseMatch[1].trim() : '';
    
    // 英語部分をレベル別に分割
    const targetLevel = `**Level ${userLevel}`;
    const levelStart = englishPart.indexOf(targetLevel);
    
    if (levelStart === -1) {
      console.warn(`❌ Level ${userLevel} not found, falling back to original content`);
      return content;
    }
    
    // 次のレベルの開始位置を見つける
    let nextLevelStart = englishPart.length;
    for (let i = 1; i <= 3; i++) {
      if (i !== userLevel) {
        const nextLevel = englishPart.indexOf(`**Level ${i}`, levelStart + 1);
        if (nextLevel > levelStart && nextLevel < nextLevelStart) {
          nextLevelStart = nextLevel;
        }
      }
    }
    
    // 対象レベルのセクションを抽出
    const levelSection = englishPart.substring(levelStart, nextLevelStart).trim();
    
    // ヘッダー行を除いてコンテンツを抽出
    const lines = levelSection.split('\n');
    const contentLines = [];
    let headerPassed = false;
    
    for (const line of lines) {
      if (!headerPassed && line.startsWith('**Level')) {
        headerPassed = true;
        continue;
      }
      if (headerPassed && line.trim() !== '') {
        contentLines.push(line);
      }
    }
    
    const selectedContent = contentLines.join('\n').trim();
    
    // "From <name>" を除去
    const finalContent = selectedContent.replace(/\n\s*From <name>\s*$/, '').trim();
    
    console.log(`✅ Extracted Level ${userLevel} content (${finalContent.length} chars)`);
    console.log(`📝 Content preview: ${finalContent.substring(0, 100)}...`);
    
    // 日本語版と結合
    if (japaneseContent) {
      const result = `${finalContent}\n\n---\n\n**日本語版:**\n\n${japaneseContent}`;
      console.log(`✅ Combined with Japanese version (${result.length} chars total)`);
      return result;
    } else {
      console.log(`⚠️ No Japanese version found, using English only`);
      return finalContent;
    }
    
  } catch (error) {
    console.error('❌ Error selecting level content:', error);
    console.error('❌ Falling back to original content');
    return content; // エラー時は元のコンテンツを返す
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
    debugMessageSystem,
    getUserLevel,
    selectLevelContent
  };
}