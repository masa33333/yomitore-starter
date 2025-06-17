// utils/getEnglishText.ts
export function getEnglishText(
  enMap: Record<number, string>,
  level: number
): string {
  const availableLevels = Object.keys(enMap).map(Number).sort((a, b) => a - b)
  let selectedLevel = availableLevels[0]
  for (let l of availableLevels) {
    if (level >= l) selectedLevel = l
    else break
  }
  return enMap[selectedLevel]
}