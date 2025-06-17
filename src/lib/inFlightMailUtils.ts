/**
 * 道中メールフラグ管理ユーティリティ
 * localStorage キー: inFlightSent:<leg>
 * 値: 送信済みminutes配列をJSON.stringify [30,60,90]
 */

export function addInFlightMail(leg: string, minutes: number): void {
  const key = `inFlightSent:${leg}`;
  const existing = getInFlightMailMinutes(leg);
  
  // 重複チェック
  if (!existing.includes(minutes)) {
    const updated = [...existing, minutes].sort((a, b) => a - b);
    localStorage.setItem(key, JSON.stringify(updated));
    console.log(`✅ In-flight mail added for ${leg} at ${minutes} minutes:`, updated);
  } else {
    console.log(`⚠️ In-flight mail already sent for ${leg} at ${minutes} minutes`);
  }
}

export function getInFlightMailMinutes(leg: string): number[] {
  const key = `inFlightSent:${leg}`;
  const value = localStorage.getItem(key);
  
  if (!value) {
    return [];
  }
  
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`❌ Failed to parse in-flight mail data for ${leg}:`, error);
    return [];
  }
}

export function hasInFlightMail(leg: string, minutes: number): boolean {
  const sentMinutes = getInFlightMailMinutes(leg);
  return sentMinutes.includes(minutes);
}

export function clearInFlightMail(leg: string): void {
  const key = `inFlightSent:${leg}`;
  localStorage.removeItem(key);
  console.log(`🗑️ In-flight mail cleared for ${leg}`);
}

export function getAllInFlightMailFlags(): Record<string, number[]> {
  const inFlightMails: Record<string, number[]> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('inFlightSent:')) {
      const leg = key.replace('inFlightSent:', '');
      inFlightMails[leg] = getInFlightMailMinutes(leg);
    }
  }
  
  return inFlightMails;
}

export function clearAllInFlightMailFlags(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('inFlightSent:')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${keysToRemove.length} in-flight mail flags`);
}

export function getNextInFlightMilestone(leg: string, currentMinutes: number): number | null {
  const milestones = [30, 60, 90, 120, 150, 180]; // 30分間隔
  const sentMinutes = getInFlightMailMinutes(leg);
  
  for (const milestone of milestones) {
    if (currentMinutes >= milestone && !sentMinutes.includes(milestone)) {
      return milestone;
    }
  }
  
  return null;
}

export function shouldSendInFlightMail(leg: string, currentMinutes: number): boolean {
  const nextMilestone = getNextInFlightMilestone(leg, currentMinutes);
  return nextMilestone !== null;
}