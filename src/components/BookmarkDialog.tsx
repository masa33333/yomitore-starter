'use client';

interface BookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  word: string;
  conflictLevel?: number;
  currentLevel?: number;
}

export function BookmarkDialog({
  isOpen,
  onClose,
  onConfirm,
  word,
  conflictLevel,
  currentLevel
}: BookmarkDialogProps) {
  const isLevelConflict = conflictLevel !== undefined && currentLevel !== undefined;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isLevelConflict ? 'しおりの上書き確認' : 'しおり作成'}
        </h2>
        <p className="text-gray-600 mb-6">
          {isLevelConflict ? (
            <>
              この作品には以前 <strong>Level {conflictLevel}</strong> のしおりがあります。
              <br />
              新しい <strong>Level {currentLevel}</strong> で上書きしますか？
            </>
          ) : (
            <>
              「<strong>{word}</strong>」の位置でしおりを作成します。
              <br />
              ここで一時中断しますか？
            </>
          )}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            いいえ
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            {isLevelConflict ? '上書きする' : 'はい'}
          </button>
        </div>
      </div>
    </div>
  );
}