// タイムスタンプアイテムの型定義
export type TimingItem = {
  i: number;      // インデックス
  text: string;   // テキスト内容
  start: number;  // 開始時刻（秒）
  end: number;    // 終了時刻（秒）
};

// OpenAI Transcriptions APIからの生の単語データ
export type WordItem = {
  text: string;
  start: number;
  end: number;
};

// OpenAI Transcriptions APIからの生のセグメントデータ
export type SegmentItem = {
  text: string;
  start: number;
  end: number;
};

// タイムスタンプJSONの最終形式
export type TimingsJSON = {
  granularity: "word" | "sentence";
  items: TimingItem[];
  // メタデータ
  source: "openai-transcribe" | "fallback" | "fallback-adjusted";
  model: string;
  createdAt: string;
};

// トークンの型定義
export type Token = {
  i: number;          // インデックス
  text: string;       // 元のテキスト
  norm: string;       // 正規化されたテキスト
  isWord: boolean;    // 単語かどうか（空白・句読点以外）
};