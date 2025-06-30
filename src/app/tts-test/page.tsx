import TTSTest from '@/components/TTSTest';

export default function TTSTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎵 Text-to-Speech Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test the TTS functionality with OpenAI TTS API and Supabase Storage integration.
            Enter any text and listen to the generated audio with caching support.
          </p>
        </div>

        <TTSTest />

        {/* Additional Info Section */}
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 Technical Details</h2>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">TTS Configuration</h3>
              <ul className="space-y-1">
                <li>• Model: OpenAI TTS-1</li>
                <li>• Voice: Alloy</li>
                <li>• Speed: 0.9x (learner-friendly)</li>
                <li>• Format: MP3</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Storage & Caching</h3>
              <ul className="space-y-1">
                <li>• Storage: Supabase Storage</li>
                <li>• Bucket: audio</li>
                <li>• Cache: MD5 hash-based</li>
                <li>• CDN: Public URLs</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>💡 Note:</strong> This test page is for development and testing purposes. 
              The TTS functionality will be integrated into the main reading experience.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <a 
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
}