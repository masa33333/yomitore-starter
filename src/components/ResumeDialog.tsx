'use client';

import { useRouter } from 'next/navigation';

interface ResumeDialogProps {
  isOpen: boolean;
  onResume: () => void;
}

export function ResumeDialog({ isOpen, onResume }: ResumeDialogProps) {
  const router = useRouter();

  const handleResume = () => {
    console.log('🔄 ResumeDialog handleResume called');
    
    // しおりを削除
    localStorage.removeItem('reading_bookmark');
    
    // URLからresume=1パラメータを削除
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('resume');
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    router.replace(newUrl, { scroll: false });
    
    // 再開処理を実行
    onResume();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">
          読書を再開しますか？
        </h2>
        <p className="text-gray-600 mb-6">
          ブックマークした位置から読書を続けることができます。
        </p>
        <div className="flex justify-center">
          <button
            onClick={handleResume}
            className="px-8 py-3 text-lg bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors font-bold"
          >
            読書を再開する
          </button>
        </div>
      </div>
    </div>
  );
}