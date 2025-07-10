#!/usr/bin/env node

/**
 * Notting Hill インポートスクリプト
 * stories/notting-hill/level1.txt, level2.txt, level3.txt を読み込み
 * Supabase stories テーブルにインポートする
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase 設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * テキストをトークンに分割
 */
function tokenizeText(text) {
  // 単語境界で分割（句読点も含む）
  return text.split(/\b/).filter(token => token.trim().length > 0);
}

/**
 * 単語数をカウント（英単語のみ）
 */
function countWords(text) {
  const words = text.match(/\b[a-zA-Z]+\b/g) || [];
  return words.length;
}

/**
 * ファイルを読み込んでデータベースにインポート
 */
async function importNottingHill() {
  console.log('📚 Notting Hill インポート開始...');

  const stories = [];
  const baseDir = join(__dirname, '..', 'stories', 'notting-hill');

  // Level 1-3のファイルを処理
  for (let level = 1; level <= 3; level++) {
    try {
      const filePath = join(baseDir, `level${level}.txt`);
      console.log(`📖 Reading: ${filePath}`);
      
      const content = readFileSync(filePath, 'utf8').trim();
      const tokens = tokenizeText(content);
      const wordCount = countWords(content);

      const story = {
        slug: 'notting-hill',
        level: level,
        title: `Notting Hill (Level ${level})`,
        tokens: tokens,
        glossary: [], // 今回は空配列
        word_count: wordCount
      };

      stories.push(story);
      console.log(`✅ Level ${level}: ${wordCount}語, ${tokens.length}トークン`);

    } catch (error) {
      console.error(`❌ Level ${level} ファイル読み込み失敗:`, error.message);
      
      // ファイルが見つからない場合はサンプルデータを作成
      if (error.code === 'ENOENT') {
        console.log(`⚠️  Level ${level} ファイルが見つからないため、サンプルデータを作成します`);
        
        const sampleContent = getSampleContent(level);
        const tokens = tokenizeText(sampleContent);
        const wordCount = countWords(sampleContent);

        const story = {
          slug: 'notting-hill',
          level: level,
          title: `Notting Hill (Level ${level})`,
          tokens: tokens,
          glossary: [],
          word_count: wordCount
        };

        stories.push(story);
        console.log(`✅ Level ${level} (サンプル): ${wordCount}語, ${tokens.length}トークン`);
      }
    }
  }

  // Supabaseにインポート
  if (stories.length > 0) {
    console.log(`\n💾 Supabaseに${stories.length}件のストーリーをインポート中...`);
    
    const { data, error } = await supabase
      .from('stories')
      .upsert(stories, {
        onConflict: 'slug,level'
      });

    if (error) {
      console.error('❌ インポート失敗:', error);
      process.exit(1);
    }

    console.log('✅ インポート完了!');
    console.log('インポートされたストーリー:');
    stories.forEach(story => {
      console.log(`  - ${story.title}: ${story.word_count}語`);
    });
  }
}

/**
 * サンプルコンテンツを生成（ファイルが見つからない場合）
 */
function getSampleContent(level) {
  const samples = {
    1: "Anna works at a bookstore. One day, a man comes to her shop. His name is William. He is very famous, but Anna does not know this. They talk about books. Anna likes William. William likes Anna too. But Anna learns William is a movie star. She feels surprised and confused.",
    
    2: "Anna Scott owns a small bookstore in London. One afternoon, William Thacker enters her shop looking for a travel book. Anna doesn't recognize him, but William is actually a famous Hollywood actor. They start talking about books and discover they have similar interests. Over several weeks, William visits the bookstore frequently and they become friends. However, when Anna discovers William's true identity, she feels betrayed and confused about their relationship.",
    
    3: "Anna Scott operates an independent bookstore in the charming neighborhood of Notting Hill, living a quiet life surrounded by literature and regular customers. When renowned Hollywood actor William Thacker unexpectedly enters her shop seeking refuge from his overwhelming celebrity status, neither anticipates the profound connection that will develop between them. Their initial encounter, marked by genuine conversation about books and shared intellectual interests, gradually evolves into a deeper relationship that challenges both their preconceptions about love, fame, and authenticity."
  };

  return samples[level] || samples[1];
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  importNottingHill().catch(console.error);
}