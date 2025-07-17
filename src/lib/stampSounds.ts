/**
 * スタンプ獲得時のファンファーレ音楽生成
 */

// 音量設定（0.0 - 1.0）
const VOLUME_SETTINGS = {
  single: 0.25,    // 1個獲得時
  double: 0.3,     // 2個獲得時  
  special: 0.35,   // 3個以上獲得時
  complete: 0.4,   // カード完成時
  coin: 0.45,      // コイン獲得時
  trophy: 0.5      // トロフィー獲得時
};

export function playStampFanfare(stampCount: number = 1): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 複数スタンプ獲得時は特別なファンファーレ
    if (stampCount >= 3) {
      playSpecialFanfare(audioContext);
    } else if (stampCount === 2) {
      playDoubleFanfare(audioContext);
    } else {
      playSingleStampFanfare(audioContext);
    }
  } catch (error) {
    console.log('🔇 Audio playback not supported:', error);
  }
}

/**
 * 1個スタンプ獲得時のファンファーレ
 */
function playSingleStampFanfare(audioContext: AudioContext): void {
  // C5 → E5 → G5 → C6 (ドミソド)
  const notes = [
    { freq: 523.25, time: 0.0 },  // C5
    { freq: 659.25, time: 0.15 }, // E5
    { freq: 783.99, time: 0.3 },  // G5
    { freq: 1046.5, time: 0.45 }  // C6
  ];
  
  playMelody(audioContext, notes, VOLUME_SETTINGS.single, 0.8);
}

/**
 * 2個スタンプ獲得時のファンファーレ
 */
function playDoubleFanfare(audioContext: AudioContext): void {
  // C5 → E5 → G5 → C6 → E6 (ドミソドミ)
  const notes = [
    { freq: 523.25, time: 0.0 },   // C5
    { freq: 659.25, time: 0.12 },  // E5
    { freq: 783.99, time: 0.24 },  // G5
    { freq: 1046.5, time: 0.36 },  // C6
    { freq: 1318.5, time: 0.48 }   // E6
  ];
  
  playMelody(audioContext, notes, VOLUME_SETTINGS.double, 0.95);
}

/**
 * 3個以上スタンプ獲得時の特別ファンファーレ
 */
function playSpecialFanfare(audioContext: AudioContext): void {
  // C5 → E5 → G5 → C6 → E6 → G6 → C7 (上昇アルペジオ)
  const notes = [
    { freq: 523.25, time: 0.0 },   // C5
    { freq: 659.25, time: 0.1 },   // E5
    { freq: 783.99, time: 0.2 },   // G5
    { freq: 1046.5, time: 0.3 },   // C6
    { freq: 1318.5, time: 0.4 },   // E6
    { freq: 1567.98, time: 0.5 },  // G6
    { freq: 2093.0, time: 0.6 }    // C7
  ];
  
  playMelody(audioContext, notes, VOLUME_SETTINGS.special, 1.2);
}

/**
 * メロディを再生する共通関数
 */
function playMelody(
  audioContext: AudioContext, 
  notes: { freq: number; time: number }[], 
  volume: number,
  totalDuration: number
): void {
  notes.forEach((note, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 音色を設定（暖かみのある音）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.time);
    
    // 音量エンベロープ（アタック→ディケイ）
    const noteStart = audioContext.currentTime + note.time;
    const noteDuration = 0.25;
    
    gainNode.gain.setValueAtTime(0, noteStart);
    gainNode.gain.linearRampToValueAtTime(volume, noteStart + 0.02); // アタック
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration); // ディケイ
    
    oscillator.start(noteStart);
    oscillator.stop(noteStart + noteDuration);
  });
  
  // 最後にリバーブ的な響きを追加
  addChimeEffect(audioContext, totalDuration);
}

/**
 * チャイム的な響きを追加
 */
function addChimeEffect(audioContext: AudioContext, delay: number): void {
  setTimeout(() => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime); // C6
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  }, delay * 1000);
}

/**
 * 20個完成時の特別ファンファーレ
 */
export function playCardCompleteFanfare(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 勝利のファンファーレ: C-C-C-C→G-G→C (タッタッタッタ→タータ→ターン)
    const triumphNotes = [
      { freq: 523.25, time: 0.0 },   // C5
      { freq: 523.25, time: 0.15 },  // C5
      { freq: 523.25, time: 0.3 },   // C5
      { freq: 523.25, time: 0.45 },  // C5
      { freq: 783.99, time: 0.7 },   // G5
      { freq: 783.99, time: 0.9 },   // G5
      { freq: 1046.5, time: 1.2 }    // C6 (フィナーレ)
    ];
    
    playMelody(audioContext, triumphNotes, VOLUME_SETTINGS.complete, 2.0);
    
    console.log('🎊 Card complete fanfare played!');
  } catch (error) {
    console.log('🔇 Card complete fanfare failed:', error);
  }
}

/**
 * コイン獲得時の豪華ファンファーレ（スタンプより長め）
 */
export function playCoinFanfare(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 豪華なコイン獲得メロディ: C-E-G-C-E-G-C-G-C (上昇→下降→上昇のアルペジオ)
    const coinNotes = [
      { freq: 523.25, time: 0.0 },   // C5
      { freq: 659.25, time: 0.15 },  // E5
      { freq: 783.99, time: 0.3 },   // G5
      { freq: 1046.5, time: 0.45 },  // C6
      { freq: 1318.5, time: 0.6 },   // E6
      { freq: 1567.98, time: 0.75 }, // G6
      { freq: 2093.0, time: 0.9 },   // C7
      { freq: 1567.98, time: 1.1 },  // G6 (下降開始)
      { freq: 2093.0, time: 1.3 },   // C7 (フィナーレ)
    ];
    
    playMelody(audioContext, coinNotes, VOLUME_SETTINGS.coin, 2.5);
    
    // 追加のキラキラ音効果
    setTimeout(() => {
      addMultipleChimes(audioContext, 0.3);
    }, 1000);
    
    console.log('🪙 Coin fanfare played!');
  } catch (error) {
    console.log('🔇 Coin fanfare failed:', error);
  }
}

/**
 * トロフィー獲得時の最高級ファンファーレ
 */
export function playTrophyFanfare(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 勝利のトロフィーメロディ: 壮大なアルペジオ + 勝利のコード
    const trophyNotes = [
      { freq: 261.63, time: 0.0 },   // C4
      { freq: 329.63, time: 0.1 },   // E4
      { freq: 392.00, time: 0.2 },   // G4
      { freq: 523.25, time: 0.3 },   // C5
      { freq: 659.25, time: 0.4 },   // E5
      { freq: 783.99, time: 0.5 },   // G5
      { freq: 1046.5, time: 0.6 },   // C6
      { freq: 1318.5, time: 0.7 },   // E6
      { freq: 1567.98, time: 0.8 },  // G6
      { freq: 2093.0, time: 0.9 },   // C7
      { freq: 2093.0, time: 1.2 },   // C7 (強調)
      { freq: 2093.0, time: 1.5 },   // C7 (フィナーレ)
    ];
    
    playMelody(audioContext, trophyNotes, VOLUME_SETTINGS.trophy, 3.0);
    
    // 複数のキラキラ音とコード
    setTimeout(() => {
      addMultipleChimes(audioContext, 0.5);
      addTriumphChord(audioContext);
    }, 1500);
    
    console.log('🏆 Trophy fanfare played!');
  } catch (error) {
    console.log('🔇 Trophy fanfare failed:', error);
  }
}

/**
 * 複数のキラキラ音を追加
 */
function addMultipleChimes(audioContext: AudioContext, baseVolume: number): void {
  const chimeFreqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
  
  chimeFreqs.forEach((freq, index) => {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(baseVolume * 0.6, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.0);
    }, index * 100);
  });
}

/**
 * 勝利のコード
 */
function addTriumphChord(audioContext: AudioContext): void {
  const chordFreqs = [523.25, 659.25, 783.99, 1046.5]; // C-E-G-C コード
  
  chordFreqs.forEach((freq) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2.0);
  });
}