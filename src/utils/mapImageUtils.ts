/**
 * Get the appropriate map image based on current total words read
 */
export function getCurrentMapImage(totalWords: number): string {
  // City progression based on word count
  const cityProgression = [
    { name: 'tokyo', requiredWords: 0, nextCity: 'seoul' },
    { name: 'seoul', requiredWords: 50000, nextCity: 'beijing' },
    { name: 'beijing', requiredWords: 100000, nextCity: 'beijing' } // 北京以降は後で追加
  ];

  // Find current city based on total words
  let currentCity = 'tokyo';
  let nextCity = 'seoul';
  
  for (let i = 0; i < cityProgression.length; i++) {
    const city = cityProgression[i];
    if (totalWords >= city.requiredWords) {
      currentCity = city.name;
      nextCity = city.nextCity || city.name;
    } else {
      break;
    }
  }

  // Return map image path: current-city to next-city
  return `/images/map/${currentCity}-${nextCity}.png`;
}

/**
 * Get fallback image if current map image doesn't exist
 */
export function getFallbackMapImage(): string {
  return '/images/map/tokyo-seoul.png';
}

/**
 * Get current city name based on total words
 */
export function getCurrentCity(totalWords: number): string {
  if (totalWords >= 100000) return 'Beijing';
  if (totalWords >= 50000) return 'Seoul';
  return 'Tokyo';
}