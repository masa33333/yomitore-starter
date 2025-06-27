import { saveLetterToStorage } from "@/lib/letterStorage";

/**
 * Seoul手紙を事前にlocalStorageに保存する関数
 * アプリケーション起動時や進捗に応じて呼び出される
 */
export async function preloadSeoulLetter(): Promise<void> {
  try {
    console.log('📮 Preloading Seoul letter...');
    
    // Seoul手紙の静的データを読み込み
    const seoulLetterData = await import('@/app/letters/seoul/text.json');
    console.log('📮 Seoul letter data loaded:', seoulLetterData);
    
    const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
    const catName = localStorage.getItem('catName') || 'Your cat';
    
    // 英語コンテンツを取得（ユーザーレベルに応じて）
    let englishContent = '';
    if (seoulLetterData.en && seoulLetterData.en[userLevel]) {
      englishContent = seoulLetterData.en[userLevel];
    } else if (seoulLetterData.en) {
      // フォールバック: 利用可能な最初のレベルを使用
      const availableLevels = Object.keys(seoulLetterData.en).map(Number);
      if (availableLevels.length > 0) {
        englishContent = seoulLetterData.en[availableLevels[0]];
      }
    }
    
    if (!englishContent) {
      throw new Error('No English content found for Seoul letter');
    }
    
    // 語数とWPMを計算
    const wordCount = englishContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    const estimatedDuration = Math.max(120000, wordCount * 60000 / 200); // 最低2分、または200WPMでの推定時間
    const estimatedWPM = Math.round(wordCount / (estimatedDuration / 60000));
    
    // Seoul手紙データを準備
    const seoulLetter = {
      type: "letter" as const,
      fromCity: "Tokyo",
      toCity: "Seoul", 
      level: userLevel,
      jp: seoulLetterData.jp || '',
      en: {
        [userLevel]: englishContent
      },
      wordCount: wordCount,
      duration: estimatedDuration,
      wpm: estimatedWPM,
      catName: catName,
      cityImage: '/letters/seoul.png'
    };
    
    // localStorageに保存
    console.log('📮 Saving Seoul letter to localStorage:', seoulLetter);
    saveLetterToStorage(seoulLetter);
    
    console.log('✅ Seoul letter preloaded successfully');
    
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Failed to preload Seoul letter:', error);
    return Promise.reject(error);
  }
}

/**
 * ユーザーの読書進捗に基づいてSeoul手紙の保存タイミングを判定
 * @param totalWords 現在の総読書語数
 * @returns Seoul手紙を保存すべきかどうか
 */
export function shouldPreloadSeoulLetter(totalWords: number): boolean {
  // Seoul到達に必要な語数の90%に達したら事前保存
  const SEOUL_REQUIRED_WORDS = 2000; // Seoul到達に必要な語数
  const PRELOAD_THRESHOLD = SEOUL_REQUIRED_WORDS * 0.9; // 90%
  
  return totalWords >= PRELOAD_THRESHOLD;
}

/**
 * Seoul手紙が既に保存されているかチェック
 * @returns 保存済みかどうか
 */
export function isSeoulLetterPreloaded(): boolean {
  try {
    const savedLetter = localStorage.getItem('letterText');
    if (savedLetter) {
      const letter = JSON.parse(savedLetter);
      return letter.type === 'letter' && letter.toCity === 'Seoul';
    }
    return false;
  } catch (error) {
    console.error('Error checking Seoul letter preload status:', error);
    return false;
  }
}