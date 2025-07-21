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
    
    // デバッグ: レベルヘッダーの検索
    console.log(`🔍 Level headers found:`, {
      level1Found: content.includes('**Level 1'),
      level2Found: content.includes('**Level 2'),
      level3Found: content.includes('**Level 3'),
      level1Index: content.indexOf('**Level 1'),
      level2Index: content.indexOf('**Level 2'),
      level3Index: content.indexOf('**Level 3')
    });
    
    // デバッグ: 実際のヘッダー文字列を確認
    const level1Index = content.indexOf('**Level 1');
    const level2Index = content.indexOf('**Level 2');
    const level3Index = content.indexOf('**Level 3');
    if (level1Index >= 0) {
      console.log(`🔍 Level 1 section:`, JSON.stringify(content.substring(level1Index, level1Index + 200)));
    }
    if (level2Index >= 0) {
      console.log(`🔍 Level 2 section:`, JSON.stringify(content.substring(level2Index, level2Index + 200)));
    }
    if (level3Index >= 0) {
      console.log(`🔍 Level 3 section:`, JSON.stringify(content.substring(level3Index, level3Index + 200)));
    }
    
    // デバッグ: 手動で簡単な正規表現テスト
    const simpleLevel1Test = /\*\*Level 1/.test(content);
    const simpleLevel2Test = /\*\*Level 2/.test(content);
    console.log(`🧪 Simple regex tests:`, { level1: simpleLevel1Test, level2: simpleLevel2Test });
    
    // 直接的な文字列操作でLevel 1-3のセクションを抽出
    let level1Match = null, level2Match = null, level3Match = null;
    
    // Level 1 抽出
    const level1Start = content.indexOf('**Level 1');
    const level2Start = content.indexOf('**Level 2');
    if (level1Start >= 0 && level2Start > level1Start) {
      const level1Section = content.substring(level1Start, level2Start);
      const headerEnd = level1Section.indexOf('\n\n');
      if (headerEnd >= 0) {
        const level1Content = level1Section.substring(headerEnd + 2);
        const fromIndex = level1Content.lastIndexOf('From <name>');
        if (fromIndex >= 0) {
          level1Match = [null, level1Content.substring(0, fromIndex).trim()];
        }
      }
    }
    
    // Level 2 抽出
    const level3Start = content.indexOf('**Level 3');
    if (level2Start >= 0 && level3Start > level2Start) {
      const level2Section = content.substring(level2Start, level3Start);
      const headerEnd = level2Section.indexOf('\n\n');
      if (headerEnd >= 0) {
        const level2Content = level2Section.substring(headerEnd + 2);
        const fromIndex = level2Content.lastIndexOf('From <name>');
        if (fromIndex >= 0) {
          level2Match = [null, level2Content.substring(0, fromIndex).trim()];
        }
      }
    }
    
    // Level 3 抽出
    const japaneseStart = content.indexOf('**日本語版');
    if (level3Start >= 0 && japaneseStart > level3Start) {
      const level3Section = content.substring(level3Start, japaneseStart);
      const headerEnd = level3Section.indexOf('\n\n');
      if (headerEnd >= 0) {
        const level3Content = level3Section.substring(headerEnd + 2);
        const fromIndex = level3Content.lastIndexOf('From <name>');
        if (fromIndex >= 0) {
          level3Match = [null, level3Content.substring(0, fromIndex).trim()];
        }
      }
    }
    const japaneseMatch = content.match(/\*\*日本語版:\*\*\s*\n+([\s\S]*?)(?=\n+---|\s*$)/);
    
    console.log(`📊 Match results:`, {
      level1: !!level1Match,
      level2: !!level2Match,
      level3: !!level3Match,
      japanese: !!japaneseMatch
    });
    
    // デバッグ: マッチした内容の詳細表示
    if (level1Match) {
      console.log(`🔍 Level 1 match preview:`, level1Match[1]?.substring(0, 100) + '...');
      console.log(`🔍 Level 1 match length:`, level1Match[1]?.length);
    } else {
      console.log(`❌ Level 1 regex failed`);
    }
    if (level2Match) {
      console.log(`🔍 Level 2 match preview:`, level2Match[1]?.substring(0, 100) + '...');
      console.log(`🔍 Level 2 match length:`, level2Match[1]?.length);
    } else {
      console.log(`❌ Level 2 regex failed`);
    }
    if (level3Match) {
      console.log(`🔍 Level 3 match preview:`, level3Match[1]?.substring(0, 100) + '...');
      console.log(`🔍 Level 3 match length:`, level3Match[1]?.length);
    } else {
      console.log(`❌ Level 3 regex failed`);
    }
    if (japaneseMatch) console.log(`🔍 Japanese match preview:`, japaneseMatch[1]?.substring(0, 100) + '...');
    
    let selectedContent = '';
    
    // ユーザーレベルに応じて英語コンテンツを選択
    switch (userLevel) {
      case 1:
        selectedContent = level1Match?.[1]?.trim() || '';
        console.log(`📝 Selected Level 1 content (${selectedContent.length} chars)`);
        break;
      case 2:
        selectedContent = level2Match?.[1]?.trim() || '';
        console.log(`📝 Selected Level 2 content (${selectedContent.length} chars)`);
        break;
      case 3:
        selectedContent = level3Match?.[1]?.trim() || '';
        console.log(`📝 Selected Level 3 content (${selectedContent.length} chars)`);
        break;
      default:
        selectedContent = level2Match?.[1]?.trim() || '';
        console.log(`📝 Selected default Level 2 content (${selectedContent.length} chars)`);
    }
    
    // 日本語版を追加
    const japaneseContent = japaneseMatch?.[1]?.trim() || '';
    console.log(`🇯🇵 Japanese content (${japaneseContent.length} chars)`);
    
    if (selectedContent && japaneseContent) {
      const result = `${selectedContent}\n\n---\n\n**日本語版:**\n\n${japaneseContent}`;
      console.log(`✅ Combined content ready (${result.length} chars)`);
      return result;
    } else if (selectedContent) {
      console.log(`⚠️ Using English only (no Japanese found)`);
      return selectedContent;
    } else {
      // フォールバック: 元のコンテンツをそのまま返す
      console.warn(`❌ Could not extract level ${userLevel} content, using original`);
      console.warn(`🔍 Debug info:`, {
        userLevel,
        selectedContentLength: selectedContent.length,
        japaneseContentLength: japaneseContent.length,
        hasLevel1: !!level1Match,
        hasLevel2: !!level2Match,
        hasLevel3: !!level3Match,
        contentPreview: content.substring(0, 200)
      });
      return content;
    }
    
  } catch (error) {
    console.error('❌ Error selecting level content:', error);
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