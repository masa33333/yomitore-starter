/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    TTS_VOICE: process.env.TTS_VOICE,
  },
  eslint: {
    // Build時にESLint warnings無視
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
