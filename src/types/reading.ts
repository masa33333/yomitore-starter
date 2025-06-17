// src/types/reading.ts

export interface IReadingParams {
  theme: string;
  subTopic?: string; // 任意
  style: string;
  level: number; // 1〜10段階
}

export interface IReadingPayload {
  japanese: string;
  english: string;
}
