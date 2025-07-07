/**
 * 手紙・メール表示のヘルパー関数群
 * 条件判定を明確に分離し、重複表示を防ぐ
 */

// 到着判定用語数しきい値（旧constants/progressから移行）
const ARRIVAL_WORDS: Record<string, number> = {
  'Tokyo': 0,        // 初期位置
  'Seoul': 1000,     // 1000語で到達
  'Beijing': 2000,   // 2000語で到達
  'London': 3500,    // 3500語で到達
  'NewYork': 5000,   // 5000語で到達
  'Nairobi': 7000,   // 7000語で到達
  'Sydney': 10000,   // 10000語で到達
};
// DevMode機能を簡略化（旧devModeファイルから移行）
function getWordCountForDev(): number {
  return parseInt(localStorage.getItem('totalWordsRead') || '0', 10);
}

function getReadingTimeForDev(): number {
  return parseInt(localStorage.getItem('totalReadingTime') || '0', 10);
}

function getDevModeConfig(): { enabled: boolean; forceLetter?: string; forceMail?: string } {
  try {
    const config = localStorage.getItem('devModeConfig');
    return config ? JSON.parse(config) : { enabled: false };
  } catch {
    return { enabled: false };
  }
}

interface HistoryItem {
  type?: string;
  city?: string;
  toCity?: string;
  fromCity?: string;
  title?: string;
}

/**
 * 指定都市への到着条件を満たしているかチェック
 */
export function hasArrived(city: string): boolean {
  const totalWords = getWordCountForDev();
  const requiredWords = ARRIVAL_WORDS[city as keyof typeof ARRIVAL_WORDS];
  
  if (!requiredWords) {
    console.log(`❌ hasArrived: Unknown city "${city}"`);
    return false;
  }
  
  const arrived = totalWords >= requiredWords;
  console.log(`🏙️ hasArrived(${city}): ${totalWords} >= ${requiredWords} = ${arrived}`);
  return arrived;
}

/**
 * 指定都市の手紙を既に見たことがあるかチェック
 */
export function hasSeenLetter(city: string): boolean {
  try {
    const history = JSON.parse(localStorage.getItem('readingHistory') || '[]') as HistoryItem[];
    
    const hasSeenLetterToCity = history.some(item => 
      item.type === 'letter' && 
      (item.city === city || item.toCity === city)
    );
    
    console.log(`📮 hasSeenLetter(${city}): ${hasSeenLetterToCity}`);
    console.log(`📮 History check:`, history.filter(item => item.type === 'letter'));
    
    return hasSeenLetterToCity;
  } catch (error) {
    console.error('❌ hasSeenLetter: Failed to parse history', error);
    return false;
  }
}

/**
 * 指定ルートのメールを既に受信したかチェック
 */
export function hasReceivedMail(fromCity: string, toCity: string, milestone?: number): boolean {
  try {
    const history = JSON.parse(localStorage.getItem('readingHistory') || '[]') as HistoryItem[];
    
    const hasSeenMail = history.some(item => 
      item.type === 'mail' && 
      item.fromCity === fromCity && 
      item.toCity === toCity &&
      (milestone ? item.title?.includes(`${milestone}`) : true)
    );
    
    console.log(`📧 hasReceivedMail(${fromCity}-${toCity}, milestone:${milestone}): ${hasSeenMail}`);
    return hasSeenMail;
  } catch (error) {
    console.error('❌ hasReceivedMail: Failed to parse history', error);
    return false;
  }
}

/**
 * 機内メールの条件を満たしているかチェック
 */
export function canShowInFlightMail(fromCity: string, toCity: string): boolean {
  const elapsedTime = getReadingTimeForDev();
  const elapsedMinutes = Math.floor(elapsedTime / (60 * 1000));
  
  // 最低30分の読書時間が必要
  const timeCondition = elapsedMinutes >= 30;
  
  // WPM異常値チェック（不正カウント防止）- dev modeでは無効化
  const devConfig = getDevModeConfig();
  let wpmCondition = true; // デフォルトでは通す
  
  if (!devConfig.enabled) {
    const wpmHistory = JSON.parse(localStorage.getItem('wpmHistory') || '[]');
    const averageWPM = wpmHistory.length > 0 
      ? wpmHistory.reduce((sum: number, wpm: number) => sum + wpm, 0) / wpmHistory.length 
      : 0;
    wpmCondition = averageWPM >= 50 || wpmHistory.length === 0; // WPM履歴がない場合も通す
  }
  
  // 既に同じルートのメールを受信していないかチェック
  const notReceived = !hasReceivedMail(fromCity, toCity);
  
  const result = timeCondition && wpmCondition && notReceived;
  
  console.log(`📧 canShowInFlightMail(${fromCity}-${toCity}):`, {
    timeCondition: `${elapsedMinutes}min >= 30min = ${timeCondition}`,
    wpmCondition: `WPM check = ${wpmCondition}`,
    notReceived,
    devMode: devConfig.enabled,
    result
  });
  
  return result;
}

/**
 * 現在表示すべきコンテンツを決定する
 * 優先順位: 未見の到着手紙 > 機内メール > なし
 */
export function determineContentToShow(): {
  type: 'letter' | 'mail' | null;
  fromCity?: string;
  toCity?: string;
  reason: string;
} {
  const devConfig = getDevModeConfig();
  
  // Dev mode force overrides
  if (devConfig.enabled && devConfig.forceLetter) {
    console.log(`🛠️ DEV MODE: Forcing letter for ${devConfig.forceLetter}`);
    return {
      type: 'letter',
      toCity: devConfig.forceLetter,
      reason: `DEV MODE: Forced letter for ${devConfig.forceLetter}`
    };
  }
  
  if (devConfig.enabled && devConfig.forceMail) {
    const [fromCity, toCity] = devConfig.forceMail.split('-');
    console.log(`🛠️ DEV MODE: Forcing mail for ${devConfig.forceMail}`);
    
    // Dev modeの場合、メールコンテンツが存在しなければ生成する（スタンプカード統合で一時停止）
    // try {
    //   const { generateTestMailForRoute } = require('./testMailGeneration');
    //   generateTestMailForRoute(fromCity, toCity);
    //   console.log(`🛠️ DEV MODE: Generated test mail for ${fromCity}-${toCity}`);
    // } catch (error) {
    //   console.error('🛠️ DEV MODE: Failed to generate test mail:', error);
    // }
    console.log(`🛠️ DEV MODE: Test mail generation disabled for stamp card integration`);
    
    return {
      type: 'mail',
      fromCity,
      toCity,
      reason: `DEV MODE: Forced mail for ${devConfig.forceMail}`
    };
  }
  
  const totalWords = getWordCountForDev();
  
  // Priority 1: 到着手紙（語数条件満たし、かつ未見）
  for (const [city, requiredWords] of Object.entries(ARRIVAL_WORDS)) {
    if (city === 'Tokyo') continue; // 東京は出発地なのでスキップ
    
    const arrived = hasArrived(city);
    const seen = hasSeenLetter(city);
    
    console.log(`🏙️ Letter check for ${city}: arrived=${arrived}, seen=${seen}, words=${totalWords}>=${requiredWords}`);
    
    if (arrived && !seen) {
      console.log(`✅ determineContentToShow: Showing letter for ${city}`);
      return {
        type: 'letter',
        toCity: city,
        reason: `Arrived at ${city} (${totalWords} >= ${requiredWords} words) and letter not seen`
      };
    }
  }
  
  // Priority 2: 機内メール（時間条件満たし、かつ未受信）
  let currentRoute = { from: 'Tokyo', to: 'Seoul' };
  if (totalWords >= 5000) {
    currentRoute = { from: 'Seoul', to: 'Beijing' };
  }
  
  const canShowMail = canShowInFlightMail(currentRoute.from, currentRoute.to);
  console.log(`📧 Mail check for ${currentRoute.from}-${currentRoute.to}: canShow=${canShowMail}`);
  
  if (canShowMail) {
    console.log(`✅ determineContentToShow: Showing mail for ${currentRoute.from}-${currentRoute.to}`);
    return {
      type: 'mail',
      fromCity: currentRoute.from,
      toCity: currentRoute.to,
      reason: `In-flight mail available for route ${currentRoute.from}-${currentRoute.to}`
    };
  }
  
  // Priority 3: 何も表示しない
  console.log(`❌ determineContentToShow: No content to show`);
  return {
    type: null,
    reason: 'No arrival letters or in-flight mails available'
  };
}

/**
 * デバッグ用：現在の状態を詳細表示
 */
export function debugContentState(): void {
  const totalWords = getWordCountForDev();
  const elapsedTime = getReadingTimeForDev();
  const elapsedMinutes = Math.floor(elapsedTime / (60 * 1000));
  const devConfig = getDevModeConfig();
  
  console.log('🔍 Content State Debug:', {
    devMode: devConfig,
    totalWords,
    elapsedMinutes,
    arrivals: {
      Seoul: { required: 5000, arrived: hasArrived('Seoul'), seen: hasSeenLetter('Seoul') },
      Beijing: { required: 25000, arrived: hasArrived('Beijing'), seen: hasSeenLetter('Beijing') }
    },
    mails: {
      'Tokyo-Seoul': { canShow: canShowInFlightMail('Tokyo', 'Seoul'), received: hasReceivedMail('Tokyo', 'Seoul') },
      'Seoul-Beijing': { canShow: canShowInFlightMail('Seoul', 'Beijing'), received: hasReceivedMail('Seoul', 'Beijing') }
    },
    recommendation: determineContentToShow()
  });
}