import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StoryData {
  // コンテンツ
  en: string;
  ja: string;
  title?: string;
  
  // 読書データ
  wpm?: number;
  wordCount: number;
  readingTime?: number;
  startTime?: number;
  endTime?: number;
  
  // セッションデータ
  words?: string[];
  sessionWords?: any[];
  
  // 表示状態
  showJapanese?: boolean;
  englishParagraphs?: string[];
  japaneseParagraphs?: string[];
  
  // メタデータ
  isStoryMode?: boolean;
  mode?: string;
  timestamp?: number;
  
  // パラメータ
  genre?: string;
  tone?: string;
  feeling?: string;
  level?: number;
}

interface StoryState {
  story?: StoryData;
  isRestored: boolean;
  setStory: (s: StoryData) => void;
  updateStory: (updates: Partial<StoryData>) => void;
  clearStory: () => void;
  setRestored: (restored: boolean) => void;
}

export const useStory = create<StoryState>()(
  persist(
    (set, get) => ({
      story: undefined,
      isRestored: false,
      
      setStory: (s: StoryData) => {
        set({ story: s });
      },
      
      updateStory: (updates: Partial<StoryData>) => {
        const current = get().story;
        if (current) {
          const updated = { ...current, ...updates };
          set({ story: updated });
        } else {
          set({ story: updates as StoryData });
        }
      },
      
      clearStory: () => {
        set({ story: undefined, isRestored: false });
      },
      
      setRestored: (restored: boolean) => {
        set({ isRestored: restored });
      }
    }),
    { 
      name: 'yomitore-story',
      // persistの設定でisRestoredは保存しない（セッション毎にリセット）
      partialize: (state) => ({ story: state.story })
    }
  )
)