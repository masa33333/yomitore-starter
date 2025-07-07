// アニメーションファイルのグローバルキャッシュ
let cachedAnimationData: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

export async function preloadCatAnimation(): Promise<any> {
  // 既にキャッシュされている場合はそれを返す
  if (cachedAnimationData) {
    return cachedAnimationData;
  }

  // 既に読み込み中の場合は同じPromiseを返す
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // 新しく読み込みを開始
  isLoading = true;
  loadPromise = fetch('/lottie/cat-typing.json')
    .then(response => response.json())
    .then(data => {
      cachedAnimationData = data;
      isLoading = false;
      return data;
    })
    .catch(error => {
      console.error('Failed to load animation:', error);
      isLoading = false;
      throw error;
    });

  return loadPromise;
}

export function getCachedCatAnimation(): any {
  return cachedAnimationData;
}

// アプリ初期化時にアニメーションを事前読み込み
if (typeof window !== 'undefined') {
  // ページ読み込み完了後に事前読み込み
  window.addEventListener('load', () => {
    preloadCatAnimation().catch(() => {
      // エラーは無視（次回CatLoader使用時に再試行）
    });
  });
}