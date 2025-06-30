import { OpenAI } from "openai";
import { NextResponse } from "next/server";
// 旧vocabularyDataは使用せず、新しいNGSLシステムを使用
import { getAllowedWords, analyzeVocabulary } from "@/constants/ngslData";
import { findForbiddenWords } from "@/constants/forbiddenWords";
import { getPromptTemplate } from "@/constants/promptTemplates";
import { mapQuizLevelToGenerationLevel } from "@/utils/getEnglishText";

// カタカナを英語/ローマ字に変換する関数
function convertKatakanaToEnglish(text: string): string {
  if (!text) return text;

  // カタカナ→英語の変換マップ（優先度：固有名詞 → 一般名詞）
  const katakanaToEnglish: { [key: string]: string } = {
    // 🎵 音楽・アーティスト（最優先）
    'ビートルズ': 'The Beatles',
    'マイケル・ジャクソン': 'Michael Jackson',
    'マイケルジャクソン': 'Michael Jackson',
    'ジョン・レノン': 'John Lennon',
    'ジョンレノン': 'John Lennon',
    'ポール・マッカートニー': 'Paul McCartney',
    'ポールマッカートニー': 'Paul McCartney',
    'ジョージ・ハリスン': 'George Harrison',
    'ジョージハリスン': 'George Harrison',
    'リンゴ・スター': 'Ringo Starr',
    'リンゴスター': 'Ringo Starr',
    'エルヴィス・プレスリー': 'Elvis Presley',
    'エルヴィス': 'Elvis Presley',
    'マドンナ': 'Madonna',
    'レディー・ガガ': 'Lady Gaga',
    'レディーガガ': 'Lady Gaga',
    'テイラー・スウィフト': 'Taylor Swift',
    'テイラースウィフト': 'Taylor Swift',
    'アデル': 'Adele',
    'エド・シーラン': 'Ed Sheeran',
    'エドシーラン': 'Ed Sheeran',
    'クイーン': 'Queen',
    'ローリング・ストーンズ': 'The Rolling Stones',
    'ローリングストーンズ': 'The Rolling Stones',
    'ピンク・フロイド': 'Pink Floyd',
    'ピンクフロイド': 'Pink Floyd',
    'レッド・ツェッペリン': 'Led Zeppelin',
    'レッドツェッペリン': 'Led Zeppelin',
    'ニルヴァーナ': 'Nirvana',
    'コールドプレイ': 'Coldplay',
    'ラジオヘッド': 'Radiohead',
    
    // 🎬 映画・ドラマ
    'ハリー・ポッター': 'Harry Potter',
    'ハリーポッター': 'Harry Potter',
    'スター・ウォーズ': 'Star Wars',
    'スターウォーズ': 'Star Wars',
    'アベンジャーズ': 'Avengers',
    'スパイダーマン': 'Spider-Man',
    'バットマン': 'Batman',
    'スーパーマン': 'Superman',
    'ワンダーウーマン': 'Wonder Woman',
    'アイアンマン': 'Iron Man',
    'トイ・ストーリー': 'Toy Story',
    'トイストーリー': 'Toy Story',
    'ファインディング・ニモ': 'Finding Nemo',
    'アナと雪の女王': 'Frozen',
    'ライオン・キング': 'The Lion King',
    'ライオンキング': 'The Lion King',
    'ジュラシック・パーク': 'Jurassic Park',
    'ジュラシックパーク': 'Jurassic Park',
    'ターミネーター': 'Terminator',
    'インディ・ジョーンズ': 'Indiana Jones',
    'インディジョーンズ': 'Indiana Jones',
    
    // 👤 有名人・歴史人物
    'アインシュタイン': 'Einstein',
    'ガリレオ': 'Galileo',
    'ナポレオン': 'Napoleon',
    'シェイクスピア': 'Shakespeare',
    'ピカソ': 'Picasso',
    'ダ・ヴィンチ': 'Da Vinci',
    'ダヴィンチ': 'Da Vinci',
    'モーツァルト': 'Mozart',
    'ベートーヴェン': 'Beethoven',
    'ベートーベン': 'Beethoven',
    'バッハ': 'Bach',
    'ショパン': 'Chopin',
    
    // 🇯🇵 日本の著名人・作家
    '村上春樹': 'Haruki Murakami',
    '夏目漱石': 'Natsume Soseki',
    '芥川龍之介': 'Akutagawa Ryunosuke',
    '川端康成': 'Kawabata Yasunari',
    '三島由紀夫': 'Mishima Yukio',
    '太宰治': 'Dazai Osamu',
    '宮沢賢治': 'Miyazawa Kenji',
    '谷崎潤一郎': 'Tanizaki Junichiro',
    
    // 🏢 企業・ブランド
    'アップル': 'Apple',
    'マイクロソフト': 'Microsoft',
    'グーグル': 'Google',
    'フェイスブック': 'Facebook',
    'ツイッター': 'Twitter',
    'インスタグラム': 'Instagram',
    'ユーチューブ': 'YouTube',
    'アマゾン': 'Amazon',
    'ネットフリックス': 'Netflix',
    'ディズニー': 'Disney',
    'マクドナルド': 'McDonald\'s',
    'スターバックス': 'Starbucks',
    'コカ・コーラ': 'Coca-Cola',
    'コカコーラ': 'Coca-Cola',
    'ナイキ': 'Nike',
    'アディダス': 'Adidas',
    
    // 🌍 国・都市・地名
    'アメリカ': 'America',
    'イギリス': 'Britain',
    'フランス': 'France',
    'ドイツ': 'Germany',
    'イタリア': 'Italy',
    'スペイン': 'Spain',
    'オーストラリア': 'Australia',
    'カナダ': 'Canada',
    'ブラジル': 'Brazil',
    'インド': 'India',
    'ロシア': 'Russia',
    'トーキョー': 'Tokyo',
    'オーサカ': 'Osaka',
    'キョート': 'Kyoto',
    'ヨコハマ': 'Yokohama',
    'ニューヨーク': 'New York',
    'ロンドン': 'London',
    'パリ': 'Paris',
    'ローマ': 'Rome',
    'ベルリン': 'Berlin',
    'マドリード': 'Madrid',
    'シドニー': 'Sydney',
    'トロント': 'Toronto',
    'モスクワ': 'Moscow',
    
    // 🍕 食べ物
    'スパゲッティ': 'spaghetti',
    'パスタ': 'pasta',
    'ピザ': 'pizza',
    'ハンバーガー': 'hamburger',
    'サンドイッチ': 'sandwich',
    'ケーキ': 'cake',
    'アイスクリーム': 'ice cream',
    'コーヒー': 'coffee',
    'ティー': 'tea',
    'ジュース': 'juice',
    'ビール': 'beer',
    'ワイン': 'wine',
    'チョコレート': 'chocolate',
    'クッキー': 'cookie',
    'パン': 'bread',
    
    // 🐾 動物
    'ドッグ': 'dog',
    'キャット': 'cat',
    'バード': 'bird',
    'フィッシュ': 'fish',
    'ライオン': 'lion',
    'エレファント': 'elephant',
    'タイガー': 'tiger',
    'パンダ': 'panda',
    
    // 🚗 乗り物
    'カー': 'car',
    'バス': 'bus',
    'トレイン': 'train',
    'プレーン': 'plane',
    'バイク': 'bike',
    'タクシー': 'taxi',
    
    // ⚽ スポーツ
    'サッカー': 'soccer',
    'バスケットボール': 'basketball',
    'テニス': 'tennis',
    'ゴルフ': 'golf',
    'スイミング': 'swimming',
    'ランニング': 'running',
    
    // 色
    'ブルー': 'blue',
    'レッド': 'red',
    'グリーン': 'green',
    'イエロー': 'yellow',
    'ブラック': 'black',
    'ホワイト': 'white',
    'ピンク': 'pink',
    'オレンジ': 'orange',
    
    // 技術
    'コンピューター': 'computer',
    'インターネット': 'internet',
    'スマートフォン': 'smartphone',
    'ゲーム': 'game',
    'アプリ': 'app',
    'ソフトウェア': 'software',
    
    // 場所
    'レストラン': 'restaurant',
    'ホテル': 'hotel',
    'スーパーマーケット': 'supermarket',
    'パーク': 'park',
    'ライブラリー': 'library',
    'ミュージアム': 'museum',
    'シネマ': 'cinema',
    
    // 国・都市
    'アメリカ': 'America',
    'イギリス': 'Britain',
    'フランス': 'France',
    'ドイツ': 'Germany',
    'イタリア': 'Italy',
    'スペイン': 'Spain',
    'オーストラリア': 'Australia',
    'カナダ': 'Canada',
    'トーキョー': 'Tokyo',
    'オーサカ': 'Osaka',
    'キョート': 'Kyoto',
    'ヨコハマ': 'Yokohama',
    
    // その他一般的な単語
    'ミュージック': 'music',
    'ムービー': 'movie',
    'ブック': 'book',
    'ペン': 'pen',
    'ペーパー': 'paper',
    'タイム': 'time',
    'スペース': 'space',
    'ハウス': 'house',
    'ファミリー': 'family',
    'フレンド': 'friend',
    'ワーク': 'work',
    'スクール': 'school',
    'クラス': 'class',
    'ティーチャー': 'teacher',
    'スチューデント': 'student',
  };

  // カタカナからひらがなへの変換マップ（ローマ字変換用）
  const katakanaToHiragana: { [key: string]: string } = {
    'ア': 'あ', 'イ': 'い', 'ウ': 'う', 'エ': 'え', 'オ': 'お',
    'カ': 'か', 'キ': 'き', 'ク': 'く', 'ケ': 'け', 'コ': 'こ',
    'サ': 'さ', 'シ': 'し', 'ス': 'す', 'セ': 'せ', 'ソ': 'そ',
    'タ': 'た', 'チ': 'ち', 'ツ': 'つ', 'テ': 'て', 'ト': 'と',
    'ナ': 'な', 'ニ': 'に', 'ヌ': 'ぬ', 'ネ': 'ね', 'ノ': 'の',
    'ハ': 'は', 'ヒ': 'ひ', 'フ': 'ふ', 'ヘ': 'へ', 'ホ': 'ほ',
    'マ': 'ま', 'ミ': 'み', 'ム': 'む', 'メ': 'め', 'モ': 'も',
    'ヤ': 'や', 'ユ': 'ゆ', 'ヨ': 'よ',
    'ラ': 'ら', 'リ': 'り', 'ル': 'る', 'レ': 'れ', 'ロ': 'ろ',
    'ワ': 'わ', 'ヲ': 'を', 'ン': 'ん',
    'ガ': 'が', 'ギ': 'ぎ', 'グ': 'ぐ', 'ゲ': 'げ', 'ゴ': 'ご',
    'ザ': 'ざ', 'ジ': 'じ', 'ズ': 'ず', 'ゼ': 'ぜ', 'ゾ': 'ぞ',
    'ダ': 'だ', 'ヂ': 'ぢ', 'ヅ': 'づ', 'デ': 'で', 'ド': 'ど',
    'バ': 'ば', 'ビ': 'び', 'ブ': 'ぶ', 'ベ': 'べ', 'ボ': 'ぼ',
    'パ': 'ぱ', 'ピ': 'ぴ', 'プ': 'ぷ', 'ペ': 'ぺ', 'ポ': 'ぽ',
    'キャ': 'きゃ', 'キュ': 'きゅ', 'キョ': 'きょ',
    'シャ': 'しゃ', 'シュ': 'しゅ', 'ショ': 'しょ',
    'チャ': 'ちゃ', 'チュ': 'ちゅ', 'チョ': 'ちょ',
    'ニャ': 'にゃ', 'ニュ': 'にゅ', 'ニョ': 'にょ',
    'ヒャ': 'ひゃ', 'ヒュ': 'ひゅ', 'ヒョ': 'ひょ',
    'ミャ': 'みゃ', 'ミュ': 'みゅ', 'ミョ': 'みょ',
    'リャ': 'りゃ', 'リュ': 'りゅ', 'リョ': 'りょ',
    'ギャ': 'ぎゃ', 'ギュ': 'ぎゅ', 'ギョ': 'ぎょ',
    'ジャ': 'じゃ', 'ジュ': 'じゅ', 'ジョ': 'じょ',
    'ビャ': 'びゃ', 'ビュ': 'びゅ', 'ビョ': 'びょ',
    'ピャ': 'ぴゃ', 'ピュ': 'ぴゅ', 'ピョ': 'ぴょ',
  };

  // ひらがなからローマ字への変換マップ
  const hiraganaToRomaji: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  };

  let result = text;

  // 1. 【最優先】完全一致辞書変換
  for (const [katakana, english] of Object.entries(katakanaToEnglish)) {
    result = result.replace(new RegExp(katakana, 'g'), english);
  }

  // 2. 【推論】辞書にない場合の賢い推論変換
  const remainingKatakana = result.match(/[\u30A0-\u30FF]+/g);
  if (remainingKatakana) {
    for (const kata of remainingKatakana) {
      // 推論ロジック適用
      const inferredTranslation = inferKatakanaToEnglish(kata);
      if (inferredTranslation) {
        result = result.replace(new RegExp(kata, 'g'), inferredTranslation);
        console.log(`🧠 カタカナ推論: ${kata} → ${inferredTranslation}`);
      }
    }
  }

  // 3. 【フォールバック】残ったカタカナをローマ字に変換
  // カタカナをひらがなに変換
  for (const [katakana, hiragana] of Object.entries(katakanaToHiragana)) {
    result = result.replace(new RegExp(katakana, 'g'), hiragana);
  }

  // ひらがなをローマ字に変換
  for (const [hiragana, romaji] of Object.entries(hiraganaToRomaji)) {
    result = result.replace(new RegExp(hiragana, 'g'), romaji);
  }

  console.log('🔤 カタカナ変換:', { original: text, converted: result });
  return result;
}

// 🧠 カタカナ推論変換機能
function inferKatakanaToEnglish(katakana: string): string | null {
  console.log(`🔍 推論対象: ${katakana}`);
  
  // パターン1: 音楽グループ名推論
  if (katakana.includes('ズ') && katakana.length >= 4) {
    // 「ビートルズ」「ストーンズ」のようなグループ名
    const baseSound = katakana.replace(/ズ$/, 's');
    console.log(`🎵 音楽グループ推論: ${katakana} → ${baseSound}`);
    
    if (katakana === 'ビートルズ') return 'The Beatles';
    if (katakana === 'ローリングストーンズ') return 'The Rolling Stones';
  }
  
  // パターン2: 人名推論（音韻パターン）
  if (katakana.includes('・') || katakana.length >= 5) {
    // 「ジョン・レノン」「ポール・マッカートニー」のような人名
    const romanized = convertToRomanized(katakana);
    console.log(`👤 人名推論: ${katakana} → ${romanized}`);
    return romanized;
  }
  
  // パターン3: ブランド名推論
  if (katakana.endsWith('ー') || katakana.endsWith('ル')) {
    // 「アップル」「グーグル」のようなブランド名
    const romanized = convertToRomanized(katakana);
    console.log(`🏢 ブランド推論: ${katakana} → ${romanized}`);
    return romanized;
  }
  
  // パターン4: 地名推論
  if (katakana.includes('ニュー') || katakana.includes('サン') || katakana.includes('ロス')) {
    // 「ニューヨーク」「サンフランシスコ」「ロサンゼルス」
    const romanized = convertToRomanized(katakana);
    console.log(`🌍 地名推論: ${katakana} → ${romanized}`);
    return romanized;
  }
  
  // パターン5: 一般的なカタカナ英語推論
  if (katakana.length >= 3) {
    const romanized = convertToRomanized(katakana);
    console.log(`🔤 一般推論: ${katakana} → ${romanized}`);
    return romanized;
  }
  
  return null;
}

// カタカナを賢くローマ字変換（音韻ルール適用）
function convertToRomanized(katakana: string): string {
  let result = katakana;
  
  // 特殊音韻変換ルール
  const phoneticRules: { [key: string]: string } = {
    // 長音処理
    'ー': '',
    'ウ': 'u',
    'ー$': '',
    
    // 音楽業界でよくある音韻
    'ビート': 'Beat',
    'ル': 'le',
    'ルズ': 'les',
    'トル': 'tol',
    'トルズ': 'tles',
    
    // 二重音韻処理
    'ッ': '',
    'ツ': 'ts',
    'ャ': 'ya',
    'ュ': 'yu',
    'ョ': 'yo',
    
    // 語尾処理
    'ズ$': 's',
    'ス$': 's',
    'ン$': 'n'
  };
  
  // 特殊ルール適用
  for (const [pattern, replacement] of Object.entries(phoneticRules)) {
    result = result.replace(new RegExp(pattern, 'g'), replacement);
  }
  
  // 基本的なカタカナ→ローマ字変換
  const basicKanaMap: { [key: string]: string } = {
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
    'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n'
  };
  
  for (const [kana, roman] of Object.entries(basicKanaMap)) {
    result = result.replace(new RegExp(kana, 'g'), roman);
  }
  
  return result;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const { contentType = 'reading', level, isMailGeneration = false, prompt } = requestData;

    // メール生成の場合は特別処理
    if (isMailGeneration && prompt) {
      console.log('📧 Mail generation request received');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a travel-loving cat who writes emails. Always respond with valid JSON containing 'jp' and 'en' fields. Make the content engaging and personal." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const raw = completion.choices[0].message.content ?? "";
      console.log('📧 Mail API response:', raw);

      return NextResponse.json({ content: raw });
    }

    // レベル検証と調整
    let adjustedLevel = level;
    
    // レベルが1-5の範囲外の場合のみマッピングを適用（クイズレベルの可能性）
    if (level > 5) {
      adjustedLevel = mapQuizLevelToGenerationLevel(level);
      console.log(`📊 クイズレベル→生成レベル: ${level} → ${adjustedLevel}`);
    } else {
      console.log(`📊 生成レベルそのまま使用: ${level}`);
    }
    
    if (!adjustedLevel || adjustedLevel < 1 || adjustedLevel > 5) {
      console.log('❌ 不正なレベル:', adjustedLevel);
      return NextResponse.json({ error: '語彙レベルが不正です (1-5)' }, { status: 400 });
    }

    // デバッグ用ログ
    console.log('📝 生成リクエスト:', requestData);

    // ---- 1. NGSL語彙リスト取得 ----
    const allowedWordsArray = getAllowedWords(adjustedLevel);
    const allowedWords = allowedWordsArray.join(", ");
    
    console.log(`✅ Level ${adjustedLevel} 許可語彙数:`, allowedWordsArray.length);

    // ---- 2. コンテンツタイプ別プロンプト生成 ----
    let userPrompt = '';

    if (contentType === 'story') {
      // ストーリー用プロンプト
      const { storyData } = requestData;
      
      if (
        !storyData ||
        (!storyData.genre && !storyData.protagonistType) ||
        (!storyData.tone && !storyData.settingType)
      ) {
        console.error('❌ ストーリー設定が不完全です');
        return NextResponse.json({ error: 'ストーリー設定が不完全です' }, { status: 400 });
      }
      
      // UI側パラメータ（genre/tone/feeling）をAPI側パラメータに変換
      const { protagonistType, protagonistFeature, genre, tone, situation, feeling } = storyData;
      
      // UI側からの新形式パラメータ対応
      const actualGenre = genre || 'adventure';
      const actualTone = tone || 'serious';
      const actualFeeling = feeling || 'satisfying';
      
      // protagonistType/settingTypeが未指定の場合、genreから推定
      const inferredProtagonist = protagonistType || 'young person';
      const inferredSetting = storyData.settingType || 'mysterious place';

      // ジャンル・トーン変換（UI側パラメータ対応）
      const genreMap = {
        'Adventure': 'adventure with exciting journeys',
        'Romance': 'romantic with emotional connections',
        'Mystery': 'mysterious with puzzles to solve',
        'Fantasy': 'fantasy with magical elements',
        'Science Fiction': 'science fiction with futuristic elements',
        'Drama': 'dramatic with meaningful relationships',
        'Comedy': 'humorous and light-hearted',
        'Thriller': 'thrilling with suspense and tension'
      };

      // トーン変換
      const toneMap = {
        'Lighthearted': 'lighthearted and fun',
        'Serious': 'serious and meaningful',
        'Mysterious': 'mysterious and intriguing',
        'Romantic': 'romantic and emotional',
        'Suspenseful': 'suspenseful with tension',
        'Humorous': 'humorous and entertaining',
        'Melancholic': 'melancholic and thoughtful',
        'Inspiring': 'inspiring and uplifting'
      };

      // 読後感変換
      const feelingMap = {
        'Hope': 'hopeful and optimistic',
        'Satisfaction': 'satisfying resolution',
        'Wonder': 'sense of wonder and amazement',
        'Empowerment': 'empowering and inspiring',
        'Reflection': 'thoughtful and reflective',
        'Joy': 'joyful and uplifting',
        'Melancholy': 'bittersweet and contemplative',
        'Terrifying': 'thrilling with unexpected twists'
      };

      const character = `${inferredProtagonist}${protagonistFeature ? ` ${protagonistFeature}` : ''}`;
      const storyGenre = genreMap[actualGenre as keyof typeof genreMap] || 'engaging adventure';
      const storyTone = toneMap[actualTone as keyof typeof toneMap] || 'engaging';
      const emotion = feelingMap[actualFeeling as keyof typeof feelingMap] || 'satisfying';

      // NGSLテンプレートを使用
      const promptTemplate = getPromptTemplate(adjustedLevel);
      
      // 許可語彙リストを取得
      const allowedWords = getAllowedWords(adjustedLevel);
      const vocabularyConstraint = allowedWords.slice(0, 50).join(', '); // 最初の50語を例として提示
      
      // レベル別語数要求を明確化
      const wordCountByLevel = {
        1: "80-120 words exactly",
        2: "110-150 words exactly (CRITICAL: Must reach at least 110 words)",
        3: "140-200 words exactly (CRITICAL: Must reach at least 140 words)",
        4: "200-240 words exactly (CRITICAL: Must reach at least 200 words)",
        5: "240-280 words exactly (CRITICAL: Must reach at least 240 words)"
      };

      userPrompt = `${promptTemplate}

Story Requirements:
- Main character: ${character}
- Genre: ${storyGenre}
- Tone: ${storyTone}
- Setting: ${inferredSetting}
- Conflict or situation: ${situation || 'a meaningful challenge that tests the character'}
- Emotional effect at the end: ${emotion}
- MANDATORY PLOT TWIST: Include a surprising plot twist or revelation at the end that completely changes how the reader understands the story. The twist should be unexpected but make sense when looking back at earlier clues.

CRITICAL VOCABULARY CONSTRAINT: Only use Level ${adjustedLevel} vocabulary and below. 
Example allowed words: ${vocabularyConstraint}...
ABSOLUTELY FORBIDDEN: Any words above Level ${adjustedLevel}. Every word must comply with NGSL Level 1-${adjustedLevel} classification.

🚨 CRITICAL WORD COUNT EMERGENCY 🚨
ABSOLUTE REQUIREMENT: ${wordCountByLevel[adjustedLevel as keyof typeof wordCountByLevel] || wordCountByLevel[3]}

⚠️ WARNING: Your story will be REJECTED if it has fewer than the minimum word count.
⚠️ You MUST write enough content to reach the required word count.
⚠️ Count your words as you write. Stop when you reach the target range.

EXPANSION STRATEGIES FOR STORIES:
- Add detailed character descriptions and backgrounds
- Include detailed setting descriptions with sensory details
- Expand dialogue and character interactions
- Add internal thoughts and emotions of characters
- Include detailed action sequences
- Add backstory and character motivations
- Expand the plot with subplots or complications
- Include detailed descriptions of scenes and environments

CRITICAL OUTPUT REQUIREMENTS:
- First line: Write a compelling English title (3-8 words)
- Second line: Leave blank
- Third line onward: Write the English story (3-4 paragraphs)
- After English story: Leave one blank line
- Then write the Japanese translation (3-4 paragraphs)
- NO labels, headers, or placeholders anywhere
- ABSOLUTELY NO decorative lines, borders, or symbols like ──── or ═══
- NO asterisks, stars, or any visual separators

Example format:
The Secret Garden Adventure

Once upon a time, there was a girl...

昔々、少女がいました...
      `.trim();

    } else {
      // 読み物用プロンプト（既存の処理）
      const { theme, topic, subTopic, style } = requestData;

      // topicをthemeとして使用（フロントエンドからtopicで送信される）
      let actualTheme = theme || topic;
      const actualStyle = style || '専門家がやさしく説明'; // デフォルトスタイル

      // カタカナを英語/ローマ字に変換
      actualTheme = convertKatakanaToEnglish(actualTheme);

      // バリデーション
      if (!actualTheme || actualTheme.trim() === '') {
        console.log('❌ theme/topic が空です:', { theme, topic });
        return NextResponse.json({ error: 'テーマが指定されていません' }, { status: 400 });
      }

      let styleInstruction = '';
      switch (actualStyle) {
        case '専門家がやさしく説明':
          styleInstruction = 'Write in an expert tone but make it accessible and easy to understand. Use clear, simple explanations while maintaining authority and accuracy.';
          break;
        case '対話形式':
          styleInstruction = 'Write in a conversational dialogue format. Include questions and answers, or discussions between people to make the content engaging and interactive.';
          break;
        case '物語風':
          styleInstruction = 'Write in a narrative story style. Create an engaging story with characters, setting, and plot while incorporating the factual information naturally.';
          break;
        default:
          styleInstruction = 'Write in an informative and engaging tone.';
      }

      // NGSLテンプレートを使用
      const promptTemplate = getPromptTemplate(adjustedLevel);
      
      // 許可語彙リストを取得
      const allowedWords = getAllowedWords(adjustedLevel);
      const vocabularyConstraint = allowedWords.slice(0, 50).join(', '); // 最初の50語を例として提示
      
      // レベル別語数要求を明確化
      const wordCountByLevel = {
        1: "80-120 words exactly",
        2: "110-150 words exactly (CRITICAL: Must reach at least 110 words)",
        3: "140-200 words exactly (CRITICAL: Must reach at least 140 words)", 
        4: "200-240 words exactly (CRITICAL: Must reach at least 200 words)",
        5: "240-280 words exactly (CRITICAL: Must reach at least 240 words)"
      };

      userPrompt = `${promptTemplate}

Topic: ${actualTheme}${subTopic ? ` (focus: ${subTopic})` : ""}
Style: ${styleInstruction}

CRITICAL VOCABULARY CONSTRAINT: Only use Level ${adjustedLevel} vocabulary and below.
Example allowed words: ${vocabularyConstraint}...
ABSOLUTELY FORBIDDEN: Any words above Level ${adjustedLevel}. Every word must comply with NGSL Level 1-${adjustedLevel} classification.

🚨 CRITICAL WORD COUNT EMERGENCY 🚨
ABSOLUTE REQUIREMENT: ${wordCountByLevel[adjustedLevel as keyof typeof wordCountByLevel] || wordCountByLevel[3]}

⚠️ WARNING: Your response will be REJECTED if it has fewer than the minimum word count.
⚠️ You MUST write enough content to reach the required word count.
⚠️ Count your words as you write. Stop when you reach the target range.

EXPANSION STRATEGIES (use these to reach word count):
- Add detailed background information and context
- Include specific examples and real-world applications  
- Provide step-by-step explanations
- Add historical context or cultural information
- Include quotes, statistics, or expert opinions
- Expand descriptions with sensory details
- Add comparisons and contrasts
- Include "what if" scenarios or hypothetical examples

Requirements:
- Structure: 4-6 paragraphs (more paragraphs = more words)
- MANDATORY SURPRISING FACTS: Include exactly TWO amazing, surprising, and verifiable facts
- Translation: After each English paragraph, provide Japanese translation  
- NO labels, headers, or numbering of any kind

WORD COUNT VERIFICATION:
After writing, count your words like this:
"Dogs are amazing animals. They can learn many tricks and help people in different ways. [Count: 1,2,3...15 words so far]"

Continue writing until you reach AT LEAST the minimum word count for Level ${adjustedLevel}.

REMINDER: Write detailed, comprehensive content. Be thorough and expansive in your explanations.

Output format:
English paragraph

Japanese paragraph

English paragraph

Japanese paragraph

English paragraph

Japanese paragraph
      `.trim();
    }

    console.log('📤 【GPT-3.5-turbo】送信するプロンプト:', userPrompt.substring(0, 200) + '...');
    console.log('🤖 【モデル情報】使用モデル: gpt-3.5-turbo, max_tokens: 2000');

    // Level別システムメッセージ（コンテンツタイプ別）
    let systemMessage;
    
    if (contentType === 'story') {
      // ストーリー用システムメッセージ - 正しい語数制御
      if (adjustedLevel === 1) {
        systemMessage = `You are a children's story writer. Write a complete story for young children using ONLY the simplest English words. CRITICAL FORMAT: First line = English title (3-8 words), blank line, then English story (80-120 words exactly), blank line, then Japanese translation. MANDATORY: Include a simple plot twist. NO labels or decorative lines.`;
      } else if (adjustedLevel === 2) {
        systemMessage = `You are a children's story writer. Write a complete story using basic English. CRITICAL FORMAT: First line = English title (3-8 words), blank line, then English story (110-150 words exactly - MUST reach at least 110 words), blank line, then Japanese translation. MANDATORY: Include a surprising plot twist. NO labels or decorative lines.`;
      } else if (adjustedLevel === 3) {
        systemMessage = `You are a story writer for children. Write a complete story using simple but engaging English. CRITICAL FORMAT: First line = English title (3-8 words), blank line, then English story (140-200 words exactly - MUST reach at least 140 words), blank line, then Japanese translation. MANDATORY: Include a plot twist. NO labels or decorative lines.`;
      } else if (adjustedLevel === 4) {
        systemMessage = `You are a story writer for intermediate English learners. Write a complete story using intermediate vocabulary. CRITICAL FORMAT: First line = English title (3-8 words), blank line, then English story (200-240 words exactly - MUST reach at least 200 words), blank line, then Japanese translation. MANDATORY: Include a clever plot twist. NO labels or decorative lines.`;
      } else {
        systemMessage = `You are a story writer for advanced English learners. Write a sophisticated story with complex vocabulary. CRITICAL FORMAT: First line = English title (3-8 words), blank line, then English story (240-280 words exactly - MUST reach at least 240 words), blank line, then Japanese translation. MANDATORY: Include a sophisticated plot twist. NO labels or decorative lines.`;
      }
    } else {
      // 読み物用システムメッセージ - 正しい語数制御
      if (adjustedLevel === 1) {
        systemMessage = `You are an educational writer for young children. CRITICAL: Write exactly 80-120 words using ONLY the simplest English words. MANDATORY: Include TWO amazing facts that will surprise children. NEVER include any labels or numbering. COUNT YOUR WORDS carefully.`;
      } else if (adjustedLevel === 2) {
        systemMessage = `STOP. READ THIS CAREFULLY. You are an educational writer. CRITICAL REQUIREMENT: Your response MUST contain exactly 110-150 words. NO EXCEPTIONS. Count each word as you write. If you write fewer than 110 words, you FAIL. Write at least 4 paragraphs with detailed explanations, examples, and descriptions. MANDATORY: Include TWO surprising facts. Add more details, background information, specific examples, and elaborate descriptions to reach the word count. NEVER include any labels or numbering.`;
      } else if (adjustedLevel === 3) {
        systemMessage = `STOP. READ THIS CAREFULLY. You are an educational writer. CRITICAL REQUIREMENT: Your response MUST contain exactly 140-200 words. NO EXCEPTIONS. Count each word as you write. If you write fewer than 140 words, you FAIL. Write at least 4-5 paragraphs with detailed explanations, examples, context, and background information. MANDATORY: Include TWO amazing facts. Add more details, elaborate descriptions, specific examples, and comprehensive explanations to reach the word count. NEVER include any labels or numbering.`;
      } else if (adjustedLevel === 4) {
        systemMessage = `STOP. READ THIS CAREFULLY. You are an educational writer. CRITICAL REQUIREMENT: Your response MUST contain exactly 200-240 words. NO EXCEPTIONS. Count each word as you write. If you write fewer than 200 words, you FAIL. Write at least 5-6 detailed paragraphs with comprehensive explanations, multiple examples, background context, and thorough analysis. MANDATORY: Include TWO shocking facts. Add extensive details, elaborate descriptions, specific examples, and comprehensive coverage to reach the word count. NEVER include any labels or numbering.`;
      } else {
        systemMessage = `You are an educational writer for advanced English learners. CRITICAL: Write exactly 240-280 words (MUST reach at least 240 words). Write sophisticated content with detailed analysis. MANDATORY: Include TWO mind-blowing facts. NEVER include any labels or numbering. COUNT YOUR WORDS carefully.`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user",    content: userPrompt }
      ],
      temperature: 0.3, // 語数制御のため温度を下げる
      max_tokens: 2500, // より多くのトークンを許可
    });

    // ---- 3. 出力パース ----
    const raw = completion.choices[0].message.content ?? "";
    console.log('📥 【GPT-3.5-turbo】応答受信:', {
      responseLength: raw.length,
      model: completion.model,
      usage: completion.usage,
      preview: raw.substring(0, 200) + '...'
    });
    
    // 語数カウント用関数
    const countWords = (text: string): number => {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    let eng, jp, title = '';

    if (contentType === 'story') {
      // ストーリーの場合: プレーンテキスト形式をパース
      // 英語段落と日本語段落が空行で分かれている形式
      const cleanedRaw = raw
        .replace(/<English story>/gi, '')
        .replace(/<Japanese translation>/gi, '')
        .replace(/【英語】/gi, '')
        .replace(/【日本語】/gi, '')
        // 罫線・装飾文字の除去
        .replace(/[─━═══─_-]{3,}/g, '')  // 罫線（3文字以上の連続）
        .replace(/[※＊★☆◆◇■□▲△]/g, '') // 装飾記号
        .replace(/^[-=_]{3,}$/gm, '')      // 行全体が罫線の場合
        .replace(/^\s*[─━═_-]{3,}\s*$/gm, '') // 空白+罫線+空白の行
        .trim();
      
      console.log('🎭 ストーリー生成後のクリーンアップ:', { 
        originalLength: raw.length, 
        cleanedLength: cleanedRaw.length,
        preview: cleanedRaw.substring(0, 200) + '...'
      });
      
      // 新形式: タイトル + 空行 + 英語ストーリー + 空行 + 日本語翻訳
      const lines = cleanedRaw.split('\n');
      
      // タイトルを抽出（1行目）
      let storyStartIndex = 0;
      
      if (lines.length > 0 && lines[0].trim().length > 0 && !/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(lines[0])) {
        title = lines[0].trim();
        storyStartIndex = 1;
        console.log('🎭 タイトル抽出:', title);
      }
      
      // 残りの部分を英語・日本語に分離
      const remainingText = lines.slice(storyStartIndex).join('\n');
      const sections = remainingText.split(/\n\s*\n/);
      
      if (sections.length >= 2) {
        // 英語部分（前半）と日本語部分（後半）を分離
        const englishSections = [];
        const japaneseSections = [];
        
        for (const section of sections) {
          if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(section)) {
            // 日本語文字が含まれている場合
            japaneseSections.push(section.trim());
          } else if (section.trim().length > 0) {
            // 英語のみの場合
            englishSections.push(section.trim());
          }
        }
        
        eng = englishSections.join('\n\n');
        jp = japaneseSections.join('\n\n');
        
        console.log('🎭 ストーリーパース結果:', {
          title: title,
          englishSections: englishSections.length,
          japaneseSections: japaneseSections.length,
          engLength: eng.length,
          jpLength: jp.length
        });
      } else {
        // フォールバック: 単一セクションの場合
        eng = remainingText.trim();
        jp = '';
        console.log('🎭 ストーリーフォールバック: 英語のみ');
      }
    } else {
      // 🔧 読み物の場合: 新しい段落ごと翻訳形式をパース（改良版）
      const lines = raw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      const englishParagraphs: string[] = [];
      const japaneseParagraphs: string[] = [];
      
      console.log('📝 パース対象行数:', lines.length);
      console.log('📝 最初の5行:', lines.slice(0, 5));
      
      // 英語・日本語判定の改良（文字種による判定）
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // ラベル・装飾除去: 「Japanese Translation 1」「English paragraph 2」「罫線」などを除去
        const labelPatterns = [
          /^Japanese [Tt]ranslation \d+:?/i,
          /^English [Pp]aragraph \d+:?/i,
          /^【日本語】/,
          /^【英語】/,
          /^English:/i,
          /^Japanese:/i,
          /^\d+\./,  // 番号付きリストの除去
          /^[─━═_-]{3,}$/,  // 罫線（行全体）
          /^[※＊★☆◆◇■□▲△]+$/,  // 装飾記号のみの行
          /^\s*[─━═_-]{3,}\s*$/  // 空白+罫線+空白
        ];
        
        let isLabel = false;
        for (const pattern of labelPatterns) {
          if (pattern.test(line)) {
            console.log('🗑️ ラベル除去:', line);
            isLabel = true;
            break;
          }
        }
        
        // ラベル行はスキップ
        if (isLabel) continue;
        
        // 日本語文字（ひらがな、カタカナ、漢字）が含まれているかチェック
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(line);
        
        if (hasJapanese) {
          japaneseParagraphs.push(line);
          console.log(`📝 日本語段落 ${japaneseParagraphs.length}:`, line.substring(0, 50) + '...');
        } else {
          englishParagraphs.push(line);
          console.log(`📝 英語段落 ${englishParagraphs.length}:`, line.substring(0, 50) + '...');
        }
      }
      
      // 英語は段落をまとめて、日本語も段落をまとめて
      eng = englishParagraphs.join('\n\n');
      jp = japaneseParagraphs.join('\n\n');
      
      console.log('📊 パース結果:', {
        englishParagraphs: englishParagraphs.length,
        japaneseParagraphs: japaneseParagraphs.length,
        engLength: eng.length,
        jpLength: jp.length
      });
      
      // フォールバック: 段落が十分でない場合の補正
      if (englishParagraphs.length < 3 && eng && !eng.includes('\n\n')) {
        const sentences = eng.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        if (sentences.length >= 3) {
          const para1End = Math.floor(sentences.length / 3);
          const para2End = Math.floor(sentences.length * 2 / 3);
          
          const para1 = sentences.slice(0, para1End).join(' ');
          const para2 = sentences.slice(para1End, para2End).join(' ');
          const para3 = sentences.slice(para2End).join(' ');
          
          eng = [para1, para2, para3].join('\n\n');
          console.log('🔧 段落分割を自動補正しました');
        }
      }
    }
    
    // レベル別語数チェック
    if (eng) {
      const wordCount = countWords(eng);
      console.log('📊 生成された語数:', wordCount);
      
      let minWords, maxWords, targetRange;
      if (level <= 3) {
        minWords = 140;
        maxWords = 200;
        targetRange = '140-200語';
      } else if (level === 4) {
        minWords = 260;
        maxWords = 320;
        targetRange = '260-320語';
      } else {
        minWords = 300;
        maxWords = 380;
        targetRange = '300-380語';
      }
      
      if (wordCount < minWords) {
        console.error(`❌ 語数不足: ${wordCount} < ${minWords}語`);
        console.error(`❌ 要求: ${targetRange}, 実際: ${wordCount}語`);
        console.error(`❌ 不足分: ${minWords - wordCount}語`);
      } else if (wordCount > maxWords) {
        console.warn(`⚠️ 語数超過: ${wordCount} > ${maxWords}語`);
      } else {
        console.log(`✅ 語数適正: ${wordCount}語 (${targetRange}範囲内)`);
      }
      
      // 🆕 語彙レベル分析
      const vocabAnalysis = analyzeVocabulary(eng);
      console.log('📚 語彙レベル分析 (Level:', level, '):', {
        総語数: vocabAnalysis.totalWords,
        'Level 1': `${vocabAnalysis.levelCounts[1]}語 (${vocabAnalysis.percentages[1]}%)`,
        'Level 2': `${vocabAnalysis.levelCounts[2]}語 (${vocabAnalysis.percentages[2]}%)`,
        'Level 3': `${vocabAnalysis.levelCounts[3]}語 (${vocabAnalysis.percentages[3]}%)`,
        'Level 4': `${vocabAnalysis.levelCounts[4]}語 (${vocabAnalysis.percentages[4]}%)`,
        'Level 5': `${vocabAnalysis.levelCounts[5]}語 (${vocabAnalysis.percentages[5]}%)`
      });
      
      // レベル適合性チェック
      if (adjustedLevel <= 3) {
        const hasLevel4Plus = vocabAnalysis.percentages[4] > 0 || vocabAnalysis.percentages[5] > 0;
        if (hasLevel4Plus) {
          console.error(`❌ Level ${adjustedLevel} 違反: Level 4/5語彙が含まれています`, {
            'Level 4': vocabAnalysis.percentages[4] + '%',
            'Level 5': vocabAnalysis.percentages[5] + '%'
          });
        } else {
          console.log(`✅ Level ${adjustedLevel} 適合: 上位レベル語彙なし`);
        }
        
        // 🆕 禁止語彙チェック
        const forbiddenWords = findForbiddenWords(eng, adjustedLevel);
        if (forbiddenWords.length > 0) {
          console.error(`❌ Level ${adjustedLevel} 禁止語彙検出:`, forbiddenWords);
          console.error(`   禁止語彙数: ${forbiddenWords.length}個`);
        } else {
          console.log(`✅ Level ${adjustedLevel} 禁止語彙チェック: クリア`);
        }
      }
    }

    if (!eng || eng.trim() === '') {
      console.log('❌ 英語テキストが生成されませんでした');
      return NextResponse.json({ error: '英語テキストの生成に失敗しました' }, { status: 500 });
    }

    // 🧹 最終クリーンアップ: 全ての罫線・装飾文字を除去
    const finalCleanup = (text: string): string => {
      return text
        .replace(/[─━═══─_-]{3,}/g, '')  // 罫線（3文字以上の連続）
        .replace(/[※＊★☆◆◇■□▲△]/g, '') // 装飾記号
        .replace(/^[-=_]{3,}$/gm, '')      // 行全体が罫線
        .replace(/^\s*[─━═_-]{3,}\s*$/gm, '') // 空白+罫線+空白の行
        .replace(/\n{3,}/g, '\n\n')       // 3行以上の空行を2行に
        .trim();
    };

    eng = finalCleanup(eng);
    if (jp) jp = finalCleanup(jp);

    console.log('🧹 最終クリーンアップ完了:', {
      englishLength: eng.length,
      japaneseLength: jp?.length || 0
    });

    // 語彙レベル検証
    const vocabularyAnalysis = analyzeVocabulary(eng);
    console.log('📊 語彙レベル分析:', {
      level: adjustedLevel,
      totalWords: vocabularyAnalysis.totalWords,
      levelPercentages: vocabularyAnalysis.percentages,
      isCompliant: adjustedLevel === 1 ? vocabularyAnalysis.isLevel1Compliant :
                   adjustedLevel === 2 ? vocabularyAnalysis.isLevel2Compliant :
                   adjustedLevel === 3 ? vocabularyAnalysis.isLevel3Compliant : true
    });

    // レベル3での高次語彙使用をチェック
    if (adjustedLevel === 3) {
      const level4Plus = vocabularyAnalysis.percentages[4] + vocabularyAnalysis.percentages[5];
      if (level4Plus > 5) {
        console.warn(`⚠️ Level 3 制約違反: Level 4-5 語彙が ${level4Plus}% 使用されています (許可: 5%以下)`);
      }
    }

    console.log('✅ 【GPT-3.5-turbo】読み物生成成功:', { 
      englishLength: eng.length, 
      japaneseLength: jp?.length || 0,
      model: 'gpt-3.5-turbo',
      timestamp: new Date().toISOString()
    });
    
    // ストーリーの場合はタイトルも含めてレスポンス
    const response: any = { english: eng, japanese: jp || '' };
    if (contentType === 'story' && title) {
      response.title = title;
      console.log('🎭 ストーリータイトル付きレスポンス:', title);
    }
    
    return NextResponse.json(response);
  } catch (err) {
    console.error("generate-reading error:", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}
