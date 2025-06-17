import { v4 as uuidv4 } from "uuid";

export type HistoryItem = {
  id: string;
  type: "reading" | "story" | "mail" | "letter";
  title?: string;            // 読み物やメールのタイトル
  contentJP: string;
  contentEN: string;
  level?: number;            // 語彙レベル（mail, reading, story）
  wordCount?: number;        // 単語数（mail, reading, story）
  duration?: number;         // 読書にかかった時間（ms）※mail含む
  wpm?: number;              // Words Per Minute（mail, reading, story）
  fromCity?: string;         // mail専用（出発地）
  toCity?: string;           // mail専用（到着地）
  milestone?: number;        // mail専用、UI表示はしない
  city?: string;             // letter専用（到着都市）
  timestamp: string;
};

export function saveToHistory(entry: Omit<HistoryItem, "id" | "timestamp">) {
  const existing = JSON.parse(localStorage.getItem("history") || "[]");
  const newEntry: HistoryItem = {
    ...entry,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  const updated = [...existing, newEntry];
  localStorage.setItem("history", JSON.stringify(updated));
}