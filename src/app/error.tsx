'use client';

export default function Error({ 
  error,
  reset 
}: { 
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          エラーが発生しました
        </h2>
        <p className="text-red-600 mb-4">
          {error.message || 'アプリケーションで予期しないエラーが発生しました'}
        </p>
        <button
          onClick={reset}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  );
}