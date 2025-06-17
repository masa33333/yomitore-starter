/**
 * 到着メールフラグ管理ユーティリティ
 * localStorage キー: arrivalMail:<city>
 * 値: "true" (到着済み) / undefined (未到着)
 */

export function setArrivalMailFlag(city: string): void {
  const key = `arrivalMail:${city}`;
  localStorage.setItem(key, "true");
  console.log(`✅ Arrival mail flag set for ${city}`);
}

export function hasArrivalMail(city: string): boolean {
  const key = `arrivalMail:${city}`;
  const value = localStorage.getItem(key);
  return value === "true";
}

export function clearArrivalMailFlag(city: string): void {
  const key = `arrivalMail:${city}`;
  localStorage.removeItem(key);
  console.log(`🗑️ Arrival mail flag cleared for ${city}`);
}

export function getAllArrivalMailFlags(): string[] {
  const arrivalCities: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('arrivalMail:')) {
      const city = key.replace('arrivalMail:', '');
      const value = localStorage.getItem(key);
      if (value === "true") {
        arrivalCities.push(city);
      }
    }
  }
  
  return arrivalCities;
}

export function clearAllArrivalMailFlags(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('arrivalMail:')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${keysToRemove.length} arrival mail flags`);
}