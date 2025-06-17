export function saveLetterToStorage(letter: {
  type: "letter" | "mail";
  jp: string;
  en: { [level: number]: string };
  city?: string;         // letter用
  fromCity?: string;     // mail用
  catName?: string;      // メールタイトル用
}) {
  localStorage.setItem("letterText", JSON.stringify(letter));
}

export function getLetterFromStorage(): ReturnType<typeof saveLetterToStorage> | null {
  const raw = localStorage.getItem("letterText");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse letterText:", e);
    return null;
  }
}