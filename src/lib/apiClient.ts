// src/lib/apiClient.ts

import { IReadingParams, IReadingPayload } from "@/types/reading";

const RETRY = 2;

export async function fetchReading(
  body: IReadingParams
): Promise<IReadingPayload> {
  for (let i = 0; i <= RETRY; i++) {
    try {
      const res = await fetch("/api/generate-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      // 一部のエラー（429, 500, 503）は再試行、それ以外は即 throw
      if (
        i === RETRY ||
        !["429", "500", "503"].some(code => e.message.includes(code))
      ) {
        throw e;
      }
    }
  }
  throw new Error("fetchReading: unreachable");
}
