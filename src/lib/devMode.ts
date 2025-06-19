/**
 * 開発・テスト用のモード設定
 * 語数や時間を直接指定してテストできる
 */

interface DevModeConfig {
  enabled: boolean;
  overrideWordCount?: number;
  overrideReadingTime?: number; // milliseconds
  forceLetter?: string; // city name
  forceMail?: string; // route like "Tokyo-Seoul"
  debugLogging?: boolean;
}

/**
 * Dev mode設定を取得
 */
export function getDevModeConfig(): DevModeConfig {
  if (typeof window === 'undefined') {
    return { enabled: false };
  }
  
  try {
    const devConfig = localStorage.getItem('devModeConfig');
    if (devConfig) {
      return JSON.parse(devConfig);
    }
  } catch (error) {
    console.warn('Failed to parse dev mode config:', error);
  }
  
  // Check URL parameters for quick dev mode
  const urlParams = new URLSearchParams(window.location.search);
  const devMode = urlParams.get('dev');
  
  if (devMode === 'true') {
    return {
      enabled: true,
      overrideWordCount: parseInt(urlParams.get('words') || '0', 10) || undefined,
      overrideReadingTime: parseInt(urlParams.get('time') || '0', 10) * 60000 || undefined, // convert minutes to ms
      forceLetter: urlParams.get('letter') || undefined,
      forceMail: urlParams.get('mail') || undefined,
      debugLogging: urlParams.get('debug') === 'true'
    };
  }
  
  return { enabled: false };
}

/**
 * Dev mode設定を保存
 */
export function setDevModeConfig(config: DevModeConfig): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('devModeConfig', JSON.stringify(config));
  console.log('🛠️ Dev mode config saved:', config);
}

/**
 * Dev mode用の語数取得（オーバーライド対応）
 */
export function getWordCountForDev(): number {
  const devConfig = getDevModeConfig();
  
  if (devConfig.enabled && devConfig.overrideWordCount) {
    console.log(`🛠️ DEV MODE: Using override word count: ${devConfig.overrideWordCount}`);
    return devConfig.overrideWordCount;
  }
  
  return parseInt(localStorage.getItem('wordCountTotal') || '0', 10);
}

/**
 * Dev mode用の読書時間取得（オーバーライド対応）
 */
export function getReadingTimeForDev(): number {
  const devConfig = getDevModeConfig();
  
  if (devConfig.enabled && devConfig.overrideReadingTime) {
    console.log(`🛠️ DEV MODE: Using override reading time: ${devConfig.overrideReadingTime}ms`);
    return devConfig.overrideReadingTime;
  }
  
  return parseInt(localStorage.getItem('elapsedReadingTime') || '0', 10);
}

/**
 * Dev mode無効化
 */
export function disableDevMode(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('devModeConfig');
  console.log('🛠️ Dev mode disabled');
}

/**
 * Dev mode UI コンポーネント用のヘルパー
 */
export function createDevModePanel(): string {
  return `
    <div id="dev-mode-panel" style="
      position: fixed; 
      top: 10px; 
      right: 10px; 
      background: #1a1a1a; 
      color: white; 
      padding: 15px; 
      border-radius: 8px; 
      z-index: 9999;
      font-family: monospace;
      font-size: 12px;
      max-width: 300px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    ">
      <h3 style="margin: 0 0 10px 0; color: #ffa500;">🛠️ Dev Mode</h3>
      <div>
        <label>Word Count Override:</label><br>
        <input type="number" id="dev-word-count" placeholder="e.g. 5000" style="width: 100%; margin: 5px 0;">
      </div>
      <div>
        <label>Reading Time (minutes):</label><br>
        <input type="number" id="dev-reading-time" placeholder="e.g. 30" style="width: 100%; margin: 5px 0;">
      </div>
      <div>
        <label>Force Letter (city):</label><br>
        <select id="dev-force-letter" style="width: 100%; margin: 5px 0;">
          <option value="">None</option>
          <option value="Seoul">Seoul</option>
          <option value="Beijing">Beijing</option>
        </select>
      </div>
      <div>
        <label>Force Mail (route):</label><br>
        <select id="dev-force-mail" style="width: 100%; margin: 5px 0;">
          <option value="">None</option>
          <option value="Tokyo-Seoul">Tokyo-Seoul</option>
          <option value="Seoul-Beijing">Seoul-Beijing</option>
        </select>
      </div>
      <div style="margin-top: 10px;">
        <button id="dev-apply" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; margin-right: 5px; border-radius: 4px; cursor: pointer;">Apply</button>
        <button id="dev-clear" style="background: #f44336; color: white; border: none; padding: 5px 10px; margin-right: 5px; border-radius: 4px; cursor: pointer;">Clear</button>
        <button id="dev-close" style="background: #999; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
      <div style="margin-top: 10px; font-size: 10px; color: #ccc;">
        Current: ${getWordCountForDev()} words, ${Math.round(getReadingTimeForDev() / 60000)} min
      </div>
    </div>
  `;
}

/**
 * Dev mode パネルを表示
 */
export function showDevModePanel(): void {
  if (typeof window === 'undefined') return;
  
  // Remove existing panel if any
  const existing = document.getElementById('dev-mode-panel');
  if (existing) {
    existing.remove();
  }
  
  // Create and insert panel
  const panel = document.createElement('div');
  panel.innerHTML = createDevModePanel();
  document.body.appendChild(panel);
  
  // Add event listeners
  document.getElementById('dev-apply')?.addEventListener('click', () => {
    const wordCount = (document.getElementById('dev-word-count') as HTMLInputElement)?.value;
    const readingTime = (document.getElementById('dev-reading-time') as HTMLInputElement)?.value;
    const forceLetter = (document.getElementById('dev-force-letter') as HTMLSelectElement)?.value;
    const forceMail = (document.getElementById('dev-force-mail') as HTMLSelectElement)?.value;
    
    const config: DevModeConfig = {
      enabled: true,
      overrideWordCount: wordCount ? parseInt(wordCount, 10) : undefined,
      overrideReadingTime: readingTime ? parseInt(readingTime, 10) * 60000 : undefined,
      forceLetter: forceLetter || undefined,
      forceMail: forceMail || undefined,
      debugLogging: true
    };
    
    setDevModeConfig(config);
    alert('Dev mode config applied! Refresh page to see effects.');
  });
  
  document.getElementById('dev-clear')?.addEventListener('click', () => {
    disableDevMode();
    document.getElementById('dev-mode-panel')?.remove();
    alert('Dev mode cleared!');
  });
  
  document.getElementById('dev-close')?.addEventListener('click', () => {
    document.getElementById('dev-mode-panel')?.remove();
  });
}

/**
 * Dev mode quick access (Ctrl+D)
 */
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      showDevModePanel();
    }
  });
}