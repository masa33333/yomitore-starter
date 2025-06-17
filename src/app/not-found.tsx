export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-500 text-6xl mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          ページが見つかりません
        </h2>
        <p className="text-gray-600 mb-4">
          お探しのページは存在しないか、移動された可能性があります
        </p>
        <a
          href="/"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors inline-block"
        >
          ホームに戻る
        </a>
      </div>
    </div>
  );
}