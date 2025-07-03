type LetterData = {
  type: "letter" | "mail";
  fromCity: string;      // 出発都市（必須）
  toCity: string;        // 到着都市（必須）
  level: number;         // ユーザーレベル（必須）
  jp: string;            // 日本語内容
  en: { [level: number]: string }; // レベル別英語内容
  wordCount: number;     // 語数（必須）
  duration: number;      // 読書時間ミリ秒（必須）
  wpm: number;           // WPM（必須）
  catName?: string;      // メールタイトル用（オプション）
  cityImage?: string;    // 都市画像（オプション）
};

export function saveLetterToStorage(letter: LetterData) {
  try {
    // 必須フィールドの検証
    if (!letter.fromCity || !letter.toCity) {
      throw new Error("fromCity and toCity are required fields");
    }
    
    if (typeof letter.level !== 'number') {
      throw new Error("level must be a number");
    }
    
    if (typeof letter.wordCount !== 'number' || letter.wordCount <= 0) {
      throw new Error("wordCount must be a positive number");
    }
    
    if (typeof letter.duration !== 'number' || letter.duration <= 0) {
      throw new Error("duration must be a positive number");
    }
    
    if (typeof letter.wpm !== 'number' || letter.wpm <= 0) {
      throw new Error("wpm must be a positive number");
    }
    
    if (letter.jp === undefined || letter.jp === null) {
      console.warn("⚠️ letterStorage: jp field is missing or undefined, setting to empty string");
      letter.jp = "";
    }
    
    if (!letter.en || typeof letter.en !== "object") {
      console.warn("⚠️ letterStorage: en field is missing or invalid:", letter.en);
      letter.en = {};
    }
    
    // 📧 優先順確認ロジック: 既存のletterTextをチェック
    const existingData = localStorage.getItem('letterText');
    if (existingData) {
      try {
        const existing = JSON.parse(existingData) as LetterData;
        console.log('📧 Priority check - existing content found:', {
          existingType: existing.type,
          newType: letter.type,
          existingFromCity: existing.fromCity,
          existingToCity: existing.toCity,
          newFromCity: letter.fromCity,
          newToCity: letter.toCity
        });
        
        // 手紙が既に存在する場合、新しいメールは保存しない（手紙優先）
        if (existing.type === 'letter' && letter.type === 'mail') {
          console.log('📧 ⚠️ PRIORITY CONFLICT: Letter already exists, mail will be queued instead');
          
          // メールをペンディングキューに追加（動的インポートで循環依存を回避）
          const addToPendingQueue = async () => {
            try {
              const { saveWithPriority } = await import('./letterPriorityUtils');
              saveWithPriority(letter); // mailをキューに追加
              console.log('📧 Mail added to pending queue due to existing letter priority');
            } catch (error) {
              console.error('📧 Failed to add mail to pending queue:', error);
            }
          };
          
          addToPendingQueue();
          return; // 既存の手紙を維持、新しいメールは保存しない
        }
        
        // 同じタイプの場合は新しいもので上書き（通常の更新）
        if (existing.type === letter.type) {
          console.log(`📧 Updating existing ${letter.type} with new content`);
        }
        
        // メールが既に存在して新しい手紙が来た場合は手紙を優先（正常な更新）
        if (existing.type === 'mail' && letter.type === 'letter') {
          console.log('📧 ✅ PRIORITY UPDATE: Replacing mail with letter (letter priority)');
        }
        
      } catch (parseError) {
        console.error('📧 Failed to parse existing letterText, proceeding with save:', parseError);
      }
    }
    
    // JSON文字列化前のデバッグログ
    console.log("💾 saveLetterToStorage: Saving letter with new structure:", letter);
    
    const jsonString = JSON.stringify(letter);
    localStorage.setItem("letterText", jsonString);
    
    console.log(`✅ saveLetterToStorage: Successfully saved ${letter.type} to localStorage with new structure`);
  } catch (error) {
    console.error("❌ saveLetterToStorage: Failed to save letter:", error);
    console.error("❌ saveLetterToStorage: Letter data was:", letter);
    
    // バリデーション失敗の場合、具体的なエラー情報をログ出力
    if (error instanceof Error && error.message.includes('duration must be a positive number')) {
      console.warn("⚠️ saveLetterToStorage: Duration validation failed, attempting to fix...");
      
      // duration を修正して再試行
      const fixedLetter = {
        ...letter,
        duration: letter.duration <= 0 ? 1800000 : letter.duration, // 30分のデフォルト値
        wpm: letter.wpm <= 0 ? 100 : letter.wpm, // 100WPMのデフォルト値
        wordCount: letter.wordCount <= 0 ? 50 : letter.wordCount // 50語のデフォルト値
      };
      
      console.log("🔧 saveLetterToStorage: Attempting to save with fixed values:", fixedLetter);
      
      try {
        const jsonString = JSON.stringify(fixedLetter);
        localStorage.setItem("letterText", jsonString);
        console.log(`✅ saveLetterToStorage: Successfully saved ${fixedLetter.type} after fixing validation issues`);
        return; // 修正後の保存が成功した場合はここで終了
      } catch (retryError) {
        console.error("❌ saveLetterToStorage: Failed to save even after fixing values:", retryError);
      }
    }
    
    throw new Error(`Failed to save letter to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getLetterFromStorage(): LetterData | null {
  const raw = localStorage.getItem("letterText");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    
    // 型検証とデバッグ
    if (typeof parsed !== "object" || parsed === null) {
      console.warn("⚠️ getLetterFromStorage: Invalid parsed data type:", typeof parsed);
      return null;
    }
    
    // 必須フィールドの検証
    if (!parsed.hasOwnProperty('jp')) {
      console.warn("⚠️ getLetterFromStorage: Missing jp field in stored data");
      parsed.jp = "";
    }
    
    if (!parsed.hasOwnProperty('en') || typeof parsed.en !== "object") {
      console.warn("⚠️ getLetterFromStorage: Missing or invalid en field in stored data");
      parsed.en = {};
    }
    
    console.log("📖 getLetterFromStorage: Successfully loaded letter:", parsed);
    return parsed;
  } catch (e) {
    console.error("❌ getLetterFromStorage: Failed to parse letterText:", e);
    console.error("❌ getLetterFromStorage: Raw data was:", raw);
    return null;
  }
}

/**
 * 現在のルートに基づいて手紙を取得
 * 重要：letterタイプのみを返し、語数条件と重複チェックを実施
 */
export function getCurrentRouteLetter(): LetterData | null {
  console.log("📖 getCurrentRouteLetter: Starting letter retrieval...");
  
  const storedLetter = getLetterFromStorage();
  
  if (!storedLetter) {
    console.log("📖 getCurrentRouteLetter: No stored letter found in localStorage");
    return null;
  }
  
  console.log("📖 getCurrentRouteLetter: Found stored letter:", {
    type: storedLetter.type,
    fromCity: storedLetter.fromCity,
    toCity: storedLetter.toCity,
    level: storedLetter.level,
    hasEnContent: !!storedLetter.en,
    enKeys: Object.keys(storedLetter.en || {})
  });
  
  // 📧 mailタイプが入っている場合はnullを返す（letterページには表示しない）
  if (storedLetter.type === 'mail') {
    console.log(`📧 getCurrentRouteLetter: Found mail type, use getInFlightMail() instead`);
    return null;
  }
  
  // 📮 letterタイプの場合、語数条件と重複チェックを実施
  if (storedLetter.type === 'letter') {
    // 語数条件チェック
    const { hasArrived, hasSeenLetter } = require('./letterDisplayHelpers');
    
    if (!storedLetter.toCity) {
      console.warn("⚠️ getCurrentRouteLetter: Letter missing toCity field");
      return null;
    }
    
    // 到着条件を満たしているかチェック
    if (!hasArrived(storedLetter.toCity)) {
      console.log(`❌ getCurrentRouteLetter: Arrival conditions not met for ${storedLetter.toCity}`);
      return null;
    }
    
    // 既に同じ都市の手紙を見たことがあるかチェック
    if (hasSeenLetter(storedLetter.toCity)) {
      console.log(`❌ getCurrentRouteLetter: Letter for ${storedLetter.toCity} already seen`);
      return null;
    }
    
    console.log(`✅ getCurrentRouteLetter: RETURNING letter for ${storedLetter.toCity}`);
    return storedLetter;
  }
  
  console.warn("⚠️ getCurrentRouteLetter: Unknown content type:", storedLetter.type);
  return null;
}

/**
 * 道中メール専用の取得関数
 * 条件チェックと重複防止を実施
 */
export function getInFlightMail(): LetterData | null {
  const storedLetter = getLetterFromStorage();
  
  if (!storedLetter || storedLetter.type !== 'mail') {
    console.log('📧 getInFlightMail: No mail type content found');
    return null;
  }
  
  // 機内メール表示条件をチェック
  const { canShowInFlightMail } = require('./letterDisplayHelpers');
  
  if (!storedLetter.fromCity || !storedLetter.toCity) {
    console.warn('⚠️ getInFlightMail: Mail missing route information');
    return null;
  }
  
  // 機内メール表示条件を満たしているかチェック
  if (!canShowInFlightMail(storedLetter.fromCity, storedLetter.toCity)) {
    console.log(`❌ getInFlightMail: Conditions not met for ${storedLetter.fromCity}-${storedLetter.toCity}`);
    return null;
  }
  
  console.log(`✅ getInFlightMail: RETURNING mail for ${storedLetter.fromCity}-${storedLetter.toCity}`);
  return storedLetter;
}