// ✅ /reading/page.tsx（英語を常時表示 + 日本語はボタンで表示 + 見出し削除 + WPM計算）
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CatLoader from '@/components/CatLoader';
import VocabularyLevelSelector, { levelToNumber, numberToLevel } from '@/components/VocabularyLevelSelector';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getNextUnreachedCity } from '@/lib/getNextCity';
import MailNotification from '@/components/MailNotification';
import { getLetterFromStorage } from '@/lib/letterStorage';

// 構造見出しを除去する関数
const filterStructuralHeadings = (paragraphs: string[]): string[] => {
  return paragraphs.filter(paragraph => {
    const trimmed = paragraph.trim();
    // **Setup**, **Inciting Incident** などの構造見出しを除去
    const structuralPattern = /^\*\*(Setup|Inciting Incident|Rising Actions?|Climax|Resolution)\*\*$/i;
    return !structuralPattern.test(trimmed) && trimmed.length > 0;
  });
};

// 🔧 修正③: AI指示用タグ除去関数
const removeAITags = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // AI指示用タグを正規表現で除去
  return text
    .replace(/<allowed>[\s\S]*?<\/allowed>/gi, '') // <allowed>...</allowed>
    .replace(/<instructions>[\s\S]*?<\/instructions>/gi, '') // <instructions>...</instructions>
    .replace(/<system>[\s\S]*?<\/system>/gi, '') // <system>...</system>
    .replace(/<prompt>[\s\S]*?<\/prompt>/gi, '') // <prompt>...</prompt>
    .replace(/<template>[\s\S]*?<\/template>/gi, '') // <template>...</template>
    .replace(/<context>[\s\S]*?<\/context>/gi, '') // <context>...</context>
    .replace(/<guidelines>[\s\S]*?<\/guidelines>/gi, '') // <guidelines>...</guidelines>
    .replace(/<rules>[\s\S]*?<\/rules>/gi, '') // <rules>...</rules>
    .replace(/<format>[\s\S]*?<\/format>/gi, '') // <format>...</format>
    .replace(/<example>[\s\S]*?<\/example>/gi, '') // <example>...</example>
    .replace(/<note>[\s\S]*?<\/note>/gi, '') // <note>...</note>
    .replace(/```[\s\S]*?```/g, '') // コードブロック
    .replace(/^#+\s+.*$/gm, '') // マークダウン見出し
    .replace(/^\s*[\*\-\+]\s+.*$/gm, '') // リスト項目
    .replace(/^\s*\d+\.\s+.*$/gm, '') // 番号付きリスト
    .replace(/\n\s*\n\s*\n/g, '\n\n') // 複数の空行を2行に統一
    .trim();
};

// 単語情報のインターフェース
interface WordInfo {
  word: string; // 見出し語（クリックされた形、または適切な形）
  baseForm?: string; // 原形（見出し語と異なる場合のみ）
  originalForm: string; // 元の形（クリックされたそのままの形）
  partOfSpeech: string;
  detailedPos: string; // 詳細な品詞情報
  pos?: string; // 英語品詞（noun, verb, adjective など）
  meaning: string; // 英語の意味（既存）
  japaneseMeaning: string; // 日本語の意味
  sentence: string; // 英語例文
  sentenceJapanese: string; // 日本語例文
  paraphrase?: string; // 平易な言い換え語
  englishDefinition?: string; // 英語の定義（Free Dictionary API）
  japaneseDefinition?: string; // 日本語の定義（翻訳済み）
  englishExample?: string; // 英語の例文（Free Dictionary API）
  japaneseExample?: string; // 日本語の例文（翻訳済み）
  // 新しいフィールド名
  meaning_en?: string; // 英語の意味
  meaning_ja?: string; // 日本語の意味
  example_en?: string; // 英語の例文
  example_ja?: string; // 日本語の例文
  paraphrase_en?: string; // 英語の言い換え
  paraphrase_ja?: string; // 日本語の言い換え
}

// ✅ 英語品詞 → 日本語品詞の変換辞書（略語対応版）
const posToJapanese: { [key: string]: string } = {
  // 略語形式（新JSON形式対応）
  'n': '名詞',
  'v': '動詞',
  'adj': '形容詞',
  'adv': '副詞',
  'prep': '前置詞',
  'conj': '接続詞',
  'pron': '代名詞',
  'interj': '間投詞',
  'det': '限定詞',
  // 完全形式（後方互換性）
  noun: '名詞',
  verb: '動詞',
  adjective: '形容詞',
  adverb: '副詞',
  pronoun: '代名詞',
  conjunction: '接続詞',
  preposition: '前置詞',
  interjection: '間投詞',
  // 文脈分析でよく出る日本語品詞もサポート
  '名詞': '名詞',
  '動詞': '動詞', 
  '形容詞': '形容詞',
  '副詞': '副詞',
  '代名詞': '代名詞',
  '接続詞': '接続詞',
  '前置詞': '前置詞',
  '間投詞': '間投詞',
  // その他の品詞
  article: '冠詞',
  determiner: '限定詞',
  modal: '法助動詞',
  particle: '助詞',
  auxiliary: '助動詞'
};

// ✅ ユーザーレベルをCEFRレベルに変換
const getCEFRLevel = (userLevel: number): string => {
  if (userLevel <= 2) return 'A1';
  if (userLevel <= 4) return 'A2';
  if (userLevel <= 6) return 'B1';
  if (userLevel <= 8) return 'B2';
  if (userLevel <= 9) return 'C1';
  return 'C2';
};

// ✅ 語彙レベルから難易度ラベルとCEFRレベルを取得する関数
const getDifficultyFromLevel = (level: number): string => {
  if (level <= 3) return '簡単（A1〜A2）';
  if (level <= 6) return '中（B1〜B2）';
  return '難しい（C1〜C2）';
};

// ✅ 難易度ラベルから語彙レベルを取得する関数
const getLevelFromDifficulty = (difficulty: string): number => {
  if (difficulty.includes('簡単') || difficulty.includes('A1') || difficulty.includes('A2')) {
    return 2; // 簡単レベルの代表値
  }
  if (difficulty.includes('中') || difficulty.includes('B1') || difficulty.includes('B2')) {
    return 5; // 中レベルの代表値
  }
  return 8; // 難しいレベルの代表値
};

// ✅ 効果的な語彙レベルを取得する関数
const getEffectiveLevel = (): number => {
  if (typeof window === 'undefined') return 7;
  
  const selectedDifficulty = localStorage.getItem('selectedDifficulty');
  if (selectedDifficulty) {
    return getLevelFromDifficulty(selectedDifficulty);
  }
  
  // selectedDifficultyがない場合は固定レベルを使用
  const fixedLevel = Number(localStorage.getItem('fixedLevel')) || 
                    Number(localStorage.getItem('vocabularyLevel')) || 
                    Number(localStorage.getItem('level')) || 7;
  return fixedLevel;
};

// ✅ 正規の原形変換関数（より正確な原形取得）
const getProperBaseForm = (word: string): string => {
  const cleanWord = word.toLowerCase().trim();
  
  // 基本的な不規則動詞辞書
  const irregularVerbs: { [key: string]: string } = {
    'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
    'had': 'have', 'has': 'have', 'having': 'have',
    'did': 'do', 'does': 'do', 'done': 'do', 'doing': 'do',
    'went': 'go', 'gone': 'go', 'going': 'go', 'goes': 'go',
    'came': 'come', 'coming': 'come', 'comes': 'come',
    'took': 'take', 'taken': 'take', 'taking': 'take', 'takes': 'take',
    'got': 'get', 'gotten': 'get', 'getting': 'get', 'gets': 'get',
    'made': 'make', 'making': 'make', 'makes': 'make',
    'said': 'say', 'saying': 'say', 'says': 'say',
    'thought': 'think', 'thinking': 'think', 'thinks': 'think',
    'found': 'find', 'finding': 'find', 'finds': 'find',
    'knew': 'know', 'known': 'know', 'knowing': 'know', 'knows': 'know',
    'felt': 'feel', 'feeling': 'feel', 'feels': 'feel',
    'left': 'leave', 'leaving': 'leave', 'leaves': 'leave',
    'gave': 'give', 'given': 'give', 'giving': 'give', 'gives': 'give',
    'told': 'tell', 'telling': 'tell', 'tells': 'tell',
    'kept': 'keep', 'keeping': 'keep', 'keeps': 'keep',
    'held': 'hold', 'holding': 'hold', 'holds': 'hold',
    'brought': 'bring', 'bringing': 'bring', 'brings': 'bring',
    'wrote': 'write', 'written': 'write', 'writing': 'write', 'writes': 'write',
    'read': 'read', 'reading': 'read', 'reads': 'read',
    'heard': 'hear', 'hearing': 'hear', 'hears': 'hear',
    'saw': 'see', 'seen': 'see', 'seeing': 'see', 'sees': 'see',
    'ran': 'run', 'running': 'run', 'runs': 'run',
    'met': 'meet', 'meeting': 'meet', 'meets': 'meet',
    'put': 'put', 'putting': 'put', 'puts': 'put',
    'let': 'let', 'letting': 'let', 'lets': 'let',
    'cut': 'cut', 'cutting': 'cut', 'cuts': 'cut',
    'hit': 'hit', 'hitting': 'hit', 'hits': 'hit',
    'set': 'set', 'setting': 'set', 'sets': 'set',
    'bet': 'bet', 'betting': 'bet', 'bets': 'bet',
    'cost': 'cost', 'costing': 'cost', 'costs': 'cost',
    'hurt': 'hurt', 'hurting': 'hurt', 'hurts': 'hurt',
    'shut': 'shut', 'shutting': 'shut', 'shuts': 'shut'
  };

  // 不規則動詞の場合
  if (irregularVerbs[cleanWord]) {
    return irregularVerbs[cleanWord];
  }

  // 規則変化の処理
  // -ing形の処理
  if (cleanWord.endsWith('ing')) {
    const stem = cleanWord.slice(0, -3);
    
    // aiming -> aim のような場合
    if (stem.length >= 2) {
      // 二重子音の場合 (running -> run)
      if (stem.length >= 3 && stem[stem.length-1] === stem[stem.length-2] && 
          !/[aeiou]/.test(stem[stem.length-1])) {
        return stem.slice(0, -1);
      }
      // -ying -> -ie (lying -> lie)
      if (stem.endsWith('y')) {
        return stem.slice(0, -1) + 'ie';
      }
      // 通常の場合は-eを追加してみる
      return stem + 'e';
    }
  }

  // -ed形の処理
  if (cleanWord.endsWith('ed')) {
    const stem = cleanWord.slice(0, -2);
    if (stem.length >= 2) {
      // 二重子音の場合 (stopped -> stop)
      if (stem.length >= 3 && stem[stem.length-1] === stem[stem.length-2] && 
          !/[aeiou]/.test(stem[stem.length-1])) {
        return stem.slice(0, -1);
      }
      // -ied -> -y (studied -> study)
      if (stem.endsWith('i')) {
        return stem.slice(0, -1) + 'y';
      }
      return stem;
    }
  }

  // -s形の処理
  if (cleanWord.endsWith('s') && cleanWord.length > 2) {
    const stem = cleanWord.slice(0, -1);
    // -ies -> -y (studies -> study)
    if (stem.endsWith('ie')) {
      return stem.slice(0, -2) + 'y';
    }
    // -es -> -e または原形 (watches -> watch, goes -> go)
    if (cleanWord.endsWith('es')) {
      const estem = cleanWord.slice(0, -2);
      if (estem.endsWith('ch') || estem.endsWith('sh') || estem.endsWith('s') || 
          estem.endsWith('x') || estem.endsWith('z')) {
        return estem;
      }
      return estem;
    }
    return stem;
  }

  // そのまま返す
  return cleanWord;
};

function ReadingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { displayLang } = useLanguage();
  const { t } = useTranslation();
  // 📧 Mail notification states - improved system
  const [showMailNotification, setShowMailNotification] = useState(false);
  const [readDuration, setReadDuration] = useState<number>(0);
  const [isReading, setIsReading] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  // 🔧 修正1: mode パラメータの明示的な取得
  const mode = searchParams.get('mode');
  console.log('🔍 モード判定: mode =', mode);
  
  // 明示的なモード判定: "story" のみストーリーモード、それ以外（"reading", null, undefined等）は読み物モード
  const isStoryMode = mode === 'story';
  const isReadingMode = !isStoryMode; // "reading" または null/undefined
  
  console.log('📝 モード決定:', { 
    mode, 
    isStoryMode, 
    isReadingMode,
    'mode === "story"': mode === 'story',
    'mode === null': mode === null,
    'mode === undefined': mode === undefined
  });
  
  // 【デバッグ】コンポーネント初期状態ログ
  console.log('🚀 ReadingPage コンポーネント レンダリング開始');
  console.log('🚀 searchParams 存在確認:', !!searchParams);
  if (typeof window !== 'undefined') {
    console.log('🚀 現在のURL:', window.location.href);
    console.log('🚀 検索パラメータ文字列:', window.location.search);
  }
  
  // ① useRef を使って「初回かどうか」を明示的に管理
  const hasLoadedOnce = useRef(false);
  
  // searchParams個別値の取得と変化検知
  const level = searchParams.get('level');
  const topic = searchParams.get('topic');
  const emotion = searchParams.get('emotion');
  const style = searchParams.get('style');
  const historyId = searchParams.get('id'); // 履歴からの再読用ID
  const previousParams = useRef<string | null>(null);
  
  // 履歴復元時はローディングをスキップ、新規生成時のみローディング表示
  const [loading, setLoading] = useState<boolean>(!historyId);
  const [japanese, setJapanese] = useState('');
  const [english, setEnglish] = useState('');
  const [showJapanese, setShowJapanese] = useState(false);
  const [showTranslationButton, setShowTranslationButton] = useState(false);
  const [englishParagraphs, setEnglishParagraphs] = useState<string[]>([]);
  const [japaneseParagraphs, setJapaneseParagraphs] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loadingWordInfo, setLoadingWordInfo] = useState(false);
  const [loadingParaphrase, setLoadingParaphrase] = useState(false);
  const [sessionWords, setSessionWords] = useState<WordInfo[]>([]);
  const [definitionLanguage, setDefinitionLanguage] = useState<'ja' | 'en'>('ja');
  const [displayLanguage, setDisplayLanguage] = useState<'ja' | 'en'>('ja');
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [loadingStoryTranslation, setLoadingStoryTranslation] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [isReadingStarted, setIsReadingStarted] = useState(false);
  const [storyTitle, setStoryTitle] = useState<string>(''); // ストーリータイトル用state
  
  // 読み物生成パラメータの監視用
  const [currentLevel, setCurrentLevel] = useState<number>(7);
  const [currentTheme, setCurrentTheme] = useState<string>('');
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [currentStyle, setCurrentStyle] = useState<string>('');
  const [effectiveLevel, setEffectiveLevel] = useState<number>(7);
  const [hasError, setHasError] = useState(false);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  
  // ストーリーモード用state
  const [storyData, setStoryData] = useState<{
    story: string;
    themes: string[];
    genre?: string;
    tone?: string;
    feeling?: string;
  } | null>(null);
  
  // 前回のストーリーを記録して重複検知用
  const [previousStory, setPreviousStory] = useState<string>('');

  // 多言語テキストの定義
  const text = {
    pageTitle: {
      ja: '今日の読み物',
      en: 'Today\'s Reading',
    },
    startReading: {
      ja: '読み始める',
      en: 'Start Reading',
    },
    readingComplete: {
      ja: '読書完了！',
      en: 'Reading Complete!',
    },
    readingSpeed: {
      ja: 'あなたの読書速度:',
      en: 'Your reading speed:',
    },
    readingTime: {
      ja: '読書時間:',
      en: 'Reading Time:',
    },
    wordCount: {
      ja: '語数:',
      en: 'Word Count:',
    },
    seconds: {
      ja: '秒',
      en: 'sec',
    },
    words: {
      ja: '語',
      en: 'words',
    },
    changeLevel: {
      ja: 'レベル変更',
      en: 'Change Level',
    },
    readAgain: {
      ja: 'もう一度読む',
      en: 'Read Again',
    },
    next: {
      ja: '次へ',
      en: 'Next',
    },
    myNotesTitle: {
      ja: '今日のマイノート',
      en: 'Today\'s My Note',
    },
    clickedWords: {
      ja: (count: number) => `読書中にクリックした単語: ${count}個`,
      en: (count: number) => `Words clicked during reading: ${count}`,
    },
    displayLanguage: {
      ja: '表示言語：',
      en: 'Display Language: ',
    },
    japanese: {
      ja: '日本語',
      en: 'Japanese',
    },
    english: {
      ja: 'English',
      en: 'English',
    },
    viewMyNotes: {
      ja: 'マイノートを見る',
      en: 'View My Notes',
    },
    rootForm: {
      ja: '原形:',
      en: 'Root:',
    },
    partOfSpeech: {
      ja: '品詞:',
      en: 'Part of Speech:',
    },
    meaning: {
      ja: '意味:',
      en: 'Meaning:',
    },
    example: {
      ja: '例文:',
      en: 'Example:',
    },
  };

  // 読み物生成専用関数（毎回Claude APIに新規リクエスト）
  // 🔧 修正1: 生成ガード用のref
  const isGeneratingReading = useRef(false);
  
  // 🔧 修正②: リトライ機能付きの読み物生成関数
  const generateReading = async (retryCount: number = 0, maxRetries: number = 3) => {
    console.log('🔁 generateReading triggered (retry:', retryCount, '/', maxRetries, ')');
    if (typeof window === 'undefined') return;
    
    // 🔧 修正1: 複数回生成防止ガード
    if (isGeneratingReading.current && retryCount === 0) {
      console.log('🚫 generateReading already in progress, skipping');
      return;
    }
    
    if (retryCount === 0) {
      isGeneratingReading.current = true;
      console.log('🔒 【致命的同期不全修正2】generateReading ロック開始 - UI更新制御開始');
      
      // 🔧 致命的同期不全修正2: 生成中はUI表示を空にして描画を防ぐ
      setLoading(true);
      setEnglish(''); // 空にしてボタン表示を防ぐ
      setJapanese('');
      setStoryTitle('');
      setStoryData(null);
      setEnglishParagraphs([]);
      setJapaneseParagraphs([]);
      setHasError(false);
      setWordCount(0);
      
      console.log('🚫 【UI制御】生成中のためコンテンツを全クリア - ボタン非表示制御');
    }
    
    // 前回のストーリー/読み物データをクリア
    localStorage.removeItem('lastStory');
    
    const searchParams = new URLSearchParams(window.location.search);
    const queryType = searchParams.get('type');
    
    // ストーリーモードの場合はスキップ
    if (queryType === 'story') {
      return;
    }
    
    console.log('🔄 新規読み物生成開始 (試行', retryCount + 1, '回目)');
    setLoading(true);
    setHasError(false);
    
    try {
      // レベル取得：語彙テスト結果 > 選択された難易度 > 固定レベル の優先順
      const vocabLevel = Number(localStorage.getItem('vocabLevel'));
      const fixedLevel = Number(localStorage.getItem('fixedLevel')) || 7;
      const selectedDifficulty = localStorage.getItem('selectedDifficulty');
      
      let level;
      if (vocabLevel && vocabLevel > 0) {
        // 語彙テスト結果がある場合は最優先
        level = vocabLevel;
      } else if (selectedDifficulty) {
        // 難易度選択がある場合
        level = getLevelFromDifficulty(selectedDifficulty);
      } else {
        // デフォルト値
        level = fixedLevel;
      }
      
      console.log('📊 レベル決定:', { vocabLevel, fixedLevel, selectedDifficulty, finalLevel: level });
      
      const theme = searchParams.get('topic') || localStorage.getItem('theme') || '';
      const emotion = searchParams.get('emotion') || '';
      const style = searchParams.get('style') || localStorage.getItem('style') || '';
      
      const requestData = {
        contentType: 'reading',
        theme,
        emotion,
        style,
        level,
        // 強制的に新規生成させるためのタイムスタンプ
        timestamp: Date.now(),
        retryCount // リトライ回数を追加
      };
      
      console.log('📋 新規読み物リクエストデータ:', requestData);
      
      // バリデーション
      if (!theme || !theme.trim()) {
        setEnglish('テーマが設定されていません。読み物設定画面から開始してください。');
        setHasError(true);
        return;
      }
      if (!emotion || !emotion.trim()) {
        setEnglish('得たい感情が設定されていません。読み物設定画面から開始してください。');
        setHasError(true);
        return;
      }
      if (!style || !style.trim()) {
        setEnglish('表現スタイルが設定されていません。読み物設定画面から開始してください。');
        setHasError(true);
        return;
      }
      
      // Claude APIに新規リクエスト送信
      const res = await fetch('/api/generate-reading', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // キャッシュを無効化するヘッダー
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(requestData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ API エラー:', errorData);
        throw new Error(errorData.error || 'Failed to generate reading');
      }
      
      const data = await res.json();
      
      // 🔧 修正③: AI指示用タグ除去
      if (data.english) {
        data.english = removeAITags(data.english);
        console.log('🔧 英語コンテンツからAI指示タグを除去');
      }
      if (data.japanese) {
        data.japanese = removeAITags(data.japanese);
        console.log('🔧 日本語コンテンツからAI指示タグを除去');
      }
      
      // 🔧 修正5: データ検証 - undefined/null/空データの上書きを防止
      if (!data || typeof data !== 'object') {
        console.error('❌ 無効なレスポンスデータ:', data);
        throw new Error('APIから無効なデータが返されました');
      }
      
      if (!data.english || data.english.trim() === '') {
        console.error('❌ 英語コンテンツが空です:', data);
        throw new Error('英語コンテンツの生成に失敗しました');
      }
      
      console.log('✅ データ検証通過:', {
        hasEnglish: !!data.english,
        hasJapanese: !!data.japanese,
        englishLength: (data.english || '').length,
        japaneseLength: (data.japanese || '').length
      });
      
      // 🔧 修正3: 開発用ログ強化 - 生成結果の詳細検証
      const words = (data.english || '').split(/\s+/).filter(word => word.trim().length > 0);
      const rawEngParagraphs = (data.english || '').split('\n\n').filter((p: string) => p.trim().length > 0);
      const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
      
      const generationResult = {
        timestamp: new Date().toISOString(),
        wordCount: words.length,
        paragraphCount: filteredEngParagraphs.length,
        hasEnglish: !!data.english,
        hasJapanese: !!data.japanese,
        englishLength: (data.english || '').length,
        japaneseLength: (data.japanese || '').length,
        meetsWordRequirement: words.length >= 220,
        meetsParagraphRequirement: filteredEngParagraphs.length >= 3
      };
      
      console.log('📊 【生成結果検証】', generationResult);
      
      // 🔧 修正retry: 条件を満たさない場合のリトライロジック（緩和条件追加）
      const isLastRetry = retryCount >= maxRetries;
      const forceSave = isLastRetry; // 最後のretryでは強制保存
      
      // 🔧 修正retry: 最後のretryでは条件を緩和（200語以上、2段落以上で保存可能）
      const relaxedWordRequirement = forceSave ? (generationResult.wordCount >= 200) : generationResult.meetsWordRequirement;
      const relaxedParagraphRequirement = forceSave ? (generationResult.paragraphCount >= 2) : generationResult.meetsParagraphRequirement;
      
      if (!relaxedWordRequirement || !relaxedParagraphRequirement) {
        console.error('❌ 【生成結果不採用】条件を満たしていません:', {
          wordCount: generationResult.wordCount,
          paragraphCount: generationResult.paragraphCount,
          wordRequirement: forceSave ? '200語以上（緩和）' : '220語以上',
          paragraphRequirement: forceSave ? '2段落以上（緩和）' : '3段落以上',
          currentRetry: retryCount,
          maxRetries,
          forceSave
        });
        
        // 最大リトライ回数に達していない場合は再試行
        if (retryCount < maxRetries) {
          console.log('🔄 条件未達のため再試行します (', retryCount + 1, '/', maxRetries, ')');
          // 少し待ってからリトライ
          setTimeout(() => {
            generateReading(retryCount + 1, maxRetries);
          }, 1000);
          return;
        } else {
          // 最大リトライ回数に達した場合はエラー終了
          console.error('❌ 最大リトライ回数に達しました。生成を終了します。');
          isGeneratingReading.current = false;
          console.log('🔓 generateReading ロック解除（リトライ上限到達）');
          setLoading(false);
          setHasError(true);
          setEnglish('条件を満たす読み物の生成に失敗しました。設定を変更して再度お試しください。');
          return;
        }
      }
      
      console.log('✅ 【生成結果採用】条件を満たしています', {
        wordCount: generationResult.wordCount,
        paragraphCount: generationResult.paragraphCount,
        forceSave,
        retryCount
      });
      
      // 段落分割と構造見出し除去
      const rawJpnParagraphs = (data.japanese || '').split('\n\n').filter((p: string) => p.trim().length > 0);
      const filteredJpnParagraphs = filterStructuralHeadings(rawJpnParagraphs);
      
      // 🔧 修正2: パラメータ確認（既に宣言済みのtheme, emotion, styleを使用）
      const topic = theme; // theme変数をtopicとして使用
      
      console.log('📋 保存対象パラメータ確認:', { topic, emotion, style });
      
      // 🔧 致命的同期不全修正1: 配列長一致検証
      if (filteredEngParagraphs.length !== filteredJpnParagraphs.length) {
        console.error('❌ 【致命的】英語・日本語段落数不一致:', {
          englishParagraphs: filteredEngParagraphs.length,
          japaneseParagraphs: filteredJpnParagraphs.length,
          englishPreview: filteredEngParagraphs.slice(0, 2),
          japanesePreview: filteredJpnParagraphs.slice(0, 2)
        });
        // 不一致の場合は保存・表示を中止
        setHasError(true);
        setEnglish('英語と日本語の段落数が一致しません。再度生成してください。');
        return;
      }
      
      // 🔧 修正2: 状態更新（条件を満たす場合のみ）
      setEnglish(data.english || '');
      setJapanese(data.japanese || '');
      setEnglishParagraphs(filteredEngParagraphs);
      setJapaneseParagraphs(filteredJpnParagraphs);
      setWordCount(words.length);
      
      // 🔧 修正retry: setEnglish()等完了後の明示的保存
      const finalResultIsValid = true; // 条件チェック済みのため常にtrue
      if (finalResultIsValid) {
        const title = `${topic}についての読み物`;
        localStorage.setItem("lastReading", JSON.stringify({
          title,
          english: filteredEngParagraphs,
          japanese: filteredJpnParagraphs,
          topic,
          emotion,
          style,
          timestamp: Date.now()
        }));
        console.log("[保存] lastReading 保存完了:", title);
        
        // 🔧 修正④: ボタン状態を即座に更新
        setReadAgainAvailable(true);
      }
      
      // 🔧 修正retry: React状態更新完了後の後方互換性保存（既にメイン保存済み）
      setTimeout(() => {
        console.log('💾 【後方互換性】後方互換性保存開始（メイン保存は既に完了）');
        
        // 🔧 後方互換性のみ: 既存形式保存（メイン保存は上記で完了済み）
        const lastReadingData = {
          title: `${topic}についての読み物`,
          english: filteredEngParagraphs,
          japanese: filteredJpnParagraphs,
          timestamp: Date.now(),
          topic,
          emotion,
          style
        };
        
        console.log('💾 【新形式lastReading保存準備】', {
          title: lastReadingData.title,
          englishParagraphs: lastReadingData.english.length,
          japaneseParagraphs: lastReadingData.japanese.length,
          topic: lastReadingData.topic,
          emotion: lastReadingData.emotion,
          style: lastReadingData.style,
          timestamp: new Date(lastReadingData.timestamp).toLocaleString()
        });
        
        // 🔧 修正2: 後方互換性のためのreadingDataToSave（既存コード用）
        const readingDataToSave = {
          content: data.english || '', // content フィールドで統一
          text: data.english || '', // text フィールドも追加（後方互換性）
          english: data.english || '',
          japanese: data.japanese || '',
          theme: topic,
          emotion: emotion,
          style: style,
          level: Number(localStorage.getItem('fixedLevel')) || Number(localStorage.getItem('vocabularyLevel')) || Number(localStorage.getItem('level')) || 7,
          timestamp: lastReadingData.timestamp
        };
        
        // 🔧 修正retry: メイン保存は既に完了（重複回避）
        // localStorage.setItem('lastReading', JSON.stringify(lastReadingData)); // ← 重複のため削除
        
        // 🔧 後方互換性: 既存のキーも維持
        localStorage.setItem('currentReadingData', JSON.stringify(readingDataToSave));
        localStorage.setItem('readingSaved', 'true');
        localStorage.setItem('readingContent', JSON.stringify(readingDataToSave));
        
        // 🔧 修正②: 保存確認ログ追加
        console.log('💾 【保存確認】lastReading保存完了:', {
          title: lastReadingData.title,
          topic: lastReadingData.topic,
          emotion: lastReadingData.emotion,
          style: lastReadingData.style,
          englishParagraphs: lastReadingData.english.length,
          japaneseParagraphs: lastReadingData.japanese.length,
          timestamp: new Date(lastReadingData.timestamp).toLocaleString(),
          '実際の保存データ': JSON.parse(localStorage.getItem('lastReading') || '{}'),
          '🚫 Honda検証': lastReadingData.topic !== 'Honda' ? '✅ Honda以外' : '❌ Hondaが検出されました！'
        });
        
        // 追加検証: 保存直後の検証
        const savedVerification = localStorage.getItem('lastReading');
        if (!savedVerification) {
          console.error('🚨 【致命的エラー】localStorage保存に失敗しました！');
        } else {
          console.log('✅ 【保存検証完了】localStorage正常保存確認');
          // 🔧 修正④: 保存完了時にボタン状態を即座に更新
          setReadAgainAvailable(true);
        }
        
        // 追加検証: Hondaの内容で上書きされていないか確認
        if (lastReadingData.topic.includes('Honda') || lastReadingData.title.includes('Honda')) {
          console.error('🚨 【緊急】Hondaの内容が保存されています！', {
            topic: lastReadingData.topic,
            title: lastReadingData.title,
            shouldBe: { topic, emotion, style }
          });
        }
        
        // 🔧 致命的同期不全修正2: localStorage保存完了後にUI表示制御を解除
        setTimeout(() => {
          console.log('🔓 【UI制御解除】localStorage保存完了 - UI表示制御を解除');
          setLoading(false); // ローディング解除でUI表示開始
          
          // 読書状態と翻訳状態をリセット
          setIsReadingStarted(false);
          setStartTime(null);
          setEndTime(null);
          setWpm(null);
          setShowJapanese(false);
          
          // hasLoadedOnceフラグを設定
          hasLoadedOnce.current = true;
          
          console.log('✅ 【読み物生成完了】全データ準備完了・UI表示開始');
        }, 50);
        
      }, 100); // React state更新完了を待機
      
    } catch (error) {
      console.error('❌ 読み物生成エラー:', error);
      setEnglish('読み物の生成に失敗しました。しばらく待ってから再試行してください。');
      setHasError(true);
    } finally {
      // 🔧 修正1: ガード解除を必ずfinally句で実行
      isGeneratingReading.current = false;
      console.log('🔓 【致命的同期不全修正2】generateReading ロック解除');
      // setLoading(false)は成功時の完了処理で実行するため、ここでは削除
    }
  };

  // 🔧 修正1: モード判定に基づくデータクリア処理
  useEffect(() => {
    console.log('🔍 useEffect [モード別データクリア] triggered');
    console.log('🎭 mode パラメータ:', mode);
    console.log('🎭 isStoryMode:', isStoryMode);
    console.log('🎭 isReadingMode:', isReadingMode);
    
    if (isStoryMode) {
      console.log('🧹 ストーリーモード: 読み物データを除去');
      localStorage.removeItem('lastReading');
      localStorage.removeItem('readingContent');
      localStorage.removeItem('currentReadingData');
    } else {
      console.log('🧹 読み物モード: ストーリーデータを除去');
      localStorage.removeItem('storyData');
      localStorage.removeItem('storyInput');
      localStorage.removeItem('lastStory');
      localStorage.removeItem('storyParams');
    }
  }, [mode, isStoryMode, isReadingMode]);

  // 🧪 Debug function to reset notification system (development only)
  const resetNotificationSystem = () => {
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('hasReadBefore');
      localStorage.removeItem('mailNotified');
      localStorage.removeItem('elapsedReadingTime');
      localStorage.removeItem('notified');
      console.log('🔄 Notification system reset for development');
      window.location.reload();
    }
  };

  // 🧪 Debug function to set elapsedReadingTime for testing
  const setTestReadingTime = (minutes: number) => {
    if (process.env.NODE_ENV === 'development') {
      const ms = minutes * 60 * 1000;
      localStorage.setItem('elapsedReadingTime', ms.toString());
      console.log(`🧪 Set elapsedReadingTime to ${minutes} minutes (${ms}ms)`);
    }
  };

  // 🧪 Debug function to check current state
  const checkNotificationState = () => {
    if (process.env.NODE_ENV === 'development') {
      const elapsedMs = parseInt(localStorage.getItem('elapsedReadingTime') || '0', 10);
      const elapsedMinutes = Math.round(elapsedMs / 60000);
      const mailNotified = localStorage.getItem('mailNotified') === 'true';
      
      console.log('📊 Current Notification State:', {
        elapsedReadingTime: `${elapsedMs}ms (${elapsedMinutes} minutes)`,
        mailNotified: mailNotified,
        isReading: isReading,
        sessionStartTime: sessionStartTime,
        threshold: '30 minutes (1800000ms)',
        readyForNotification: elapsedMs >= 1800000 && !mailNotified
      });
    }
  };

  // 📧 Initialize notification system on component mount
  useEffect(() => {
    // 🧪 Debug: Log all notification-related localStorage values
    console.log('📧 LocalStorage Debug:', {
      hasReadBefore: localStorage.getItem('hasReadBefore'),
      mailNotified: localStorage.getItem('mailNotified'),
      elapsedReadingTime: localStorage.getItem('elapsedReadingTime'),
      notified: localStorage.getItem('notified')
    });

    // 🔧 Initialize elapsedReadingTime if it doesn't exist
    if (!localStorage.getItem('elapsedReadingTime')) {
      localStorage.setItem('elapsedReadingTime', '0');
      console.log('📧 Initialized elapsedReadingTime to 0');
    }

    // 🧪 Add debug functions to window for easy debugging
    if (process.env.NODE_ENV === 'development') {
      (window as any).resetNotifications = resetNotificationSystem;
      (window as any).setTestReadingTime = setTestReadingTime;
      (window as any).checkNotificationState = checkNotificationState;
      console.log('🧪 Development mode debug functions:');
      console.log('  - window.resetNotifications() - Reset notification system');
      console.log('  - window.setTestReadingTime(28) - Set elapsedReadingTime to 28 minutes');
      console.log('  - window.checkNotificationState() - Check current notification state');
    }

    // Check if user is first-time and hasn't been notified yet
    const isFirstTime = !localStorage.getItem('hasReadBefore');
    const hasBeenNotified = localStorage.getItem('mailNotified') === 'true';
    const savedElapsed = parseInt(localStorage.getItem('elapsedReadingTime') || '0', 10);
    
    console.log('📧 Notification system init:', { isFirstTime, hasBeenNotified, savedElapsed, savedMinutes: Math.round(savedElapsed / 60000) });
    
    // 🧪 If savedElapsed is already >= 30 minutes, show debug info
    if (savedElapsed >= 30 * 60 * 1000) {
      console.log('⚠️ Saved elapsed time is already >= 30 minutes:', Math.round(savedElapsed / 60000), 'minutes');
    }
    
    // Start reading tracking for all users (not just first-time)
    if (!hasBeenNotified) {
      setIsReading(true);
      setSessionStartTime(Date.now());
      
      // Mark that user has started reading (for future visits)
      localStorage.setItem('hasReadBefore', 'true');
      
      console.log('📧 Starting duration tracking (hasBeenNotified:', hasBeenNotified, ')');
    } else {
      console.log('📧 Already notified, skipping notification system');
    }
  }, []);

  // 📧 Track reading duration (cumulative, persistent) - Fixed to use elapsedReadingTime
  useEffect(() => {
    if (!isReading || !sessionStartTime) return;

    // 初期化：セッション内の経過時間を保持
    let sessionElapsed = 0;

    const interval = setInterval(() => {
      sessionElapsed += 1000; // 1秒（1000ms）ずつ増加

      // elapsedReadingTime から過去の累計読書時間を取得（ms）
      const savedElapsed = parseInt(localStorage.getItem("elapsedReadingTime") || "0", 10);
      const totalElapsed = savedElapsed + sessionElapsed;

      console.log('📧 Duration tracking:', { 
        sessionElapsed: sessionElapsed,
        savedElapsed: savedElapsed, 
        totalElapsed: totalElapsed,
        totalMinutes: Math.round(totalElapsed / 60000),
        threshold: '30 minutes (1800000ms)'
      });
      
      // Save current total to elapsedReadingTime every second
      localStorage.setItem('elapsedReadingTime', totalElapsed.toString());
      
      // Check if notification should be triggered (30分 = 1800000ms)
      const hasNotified = localStorage.getItem("mailNotified") === "true";
      if (totalElapsed >= 30 * 60 * 1000 && !hasNotified) {
        console.log('📧 30 minutes reached! Showing notification');
        setShowMailNotification(true);
        localStorage.setItem("mailNotified", "true");
        localStorage.setItem('notified', 'true'); // 📧 Header用の通知フラグ
        setIsReading(false); // Stop tracking
      }
    }, 1000); // Check every 1 second

    return () => clearInterval(interval);
  }, [isReading, sessionStartTime]);

  // 📧 Save current session duration when component unmounts or user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReading && sessionStartTime) {
        const currentSessionDuration = Date.now() - sessionStartTime; // ms単位
        const savedElapsed = parseInt(localStorage.getItem("elapsedReadingTime") || "0", 10);
        const totalElapsed = savedElapsed + currentSessionDuration;
        localStorage.setItem('elapsedReadingTime', totalElapsed.toString());
        console.log('📧 Saving elapsedReadingTime on page leave:', totalElapsed);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Also save when component unmounts
    };
  }, [isReading, sessionStartTime]);

  useEffect(() => {
    console.log('🔍 useEffect [初期パラメータ設定] triggered');
    // クライアントサイドでクエリパラメータをチェック
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      const typeParam = urlParams.get('type');
      const genreParam = urlParams.get('genre');
      const toneParam = urlParams.get('tone');
      const feelingParam = urlParams.get('feeling');
      
      console.log('🔍 【初期パラメータ設定】URL解析結果:');
      console.log('  - mode param:', modeParam);
      console.log('  - type param:', typeParam);
      console.log('  - genre param:', genreParam);
      console.log('  - tone param:', toneParam);
      console.log('  - feeling param:', feelingParam);
      
      // 初期パラメータを設定
      const level = Number(localStorage.getItem('fixedLevel')) || Number(localStorage.getItem('vocabularyLevel')) || Number(localStorage.getItem('level')) || 7;
      const theme = urlParams.get('topic') || localStorage.getItem('theme') || '';
      const emotion = urlParams.get('emotion') || '';
      const style = urlParams.get('style') || localStorage.getItem('style') || '';
      const initialEffectiveLevel = getEffectiveLevel();
      
      setCurrentLevel(level);
      setCurrentTheme(theme);
      setCurrentEmotion(emotion);
      setCurrentStyle(style);
      setEffectiveLevel(initialEffectiveLevel);
    }
  }, []);

  // 古いストーリー生成useEffect - 新しいメインuseEffectで置き換えられた
  /* useEffect(() => {
    console.log('🔍 useEffect [ストーリーモード用データ取得] triggered');
    const fetchData = async () => {
      try {
        // ストーリーモードの場合は生成済みストーリーを表示
        if (isStoryMode) {
          const savedStoryData = localStorage.getItem('storyData');
          if (savedStoryData) {
            const parsedStoryData = JSON.parse(savedStoryData);
            const currentEffectiveLevel = getEffectiveLevel();
            const storedLevel = parsedStoryData.level || 7;
            
            // ストーリーのレベルが現在的レベルと一致しない場合は再生成が必要
            if (storedLevel !== currentEffectiveLevel && parsedStoryData.genre) {
              console.log('🔄 ストーリーレベル不一致により再生成必要:', { storedLevel, currentEffectiveLevel });
              // loading状態を維持して再生成を待つ
              // useEffectがeffectiveLevel変更を検知して再生成する
              return;
            }

            // タイトルが空または未定義の場合は再生成が必要
            if (!parsedStoryData.title || parsedStoryData.title.trim() === '') {
              console.warn('title が空です。生成失敗と見なします');
              console.log('🔄 タイトルが空のため再生成必要');
              localStorage.removeItem('storyData'); // 不正なデータを削除
              return;
            }
            
            setStoryData(parsedStoryData);
            setEnglish(parsedStoryData.story);
            setJapanese(''); // ストーリーモードでは日本語訳なし
            setStoryTitle(parsedStoryData.title || 'Untitled Story'); // タイトルを設定
            
            // 段落分割と構造見出し除去
            const rawEngParagraphs = parsedStoryData.story.split('\n\n').filter((p: string) => p.trim().length > 0);
            const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
            setEnglishParagraphs(filteredEngParagraphs);
            
            // 語数カウント
            const words = parsedStoryData.story.trim().split(/\s+/).filter((word: string) => word.length > 0);
            setWordCount(words.length);
            
            setLoading(false);
            return;
          } else {
            // ストーリーデータがない場合、storyParams をチェック
            const storyParams = localStorage.getItem('storyParams');
            if (storyParams) {
              // story-form から遷移してきた場合、ストーリーを生成
              const params = JSON.parse(storyParams);
              console.log('📝 ストーリー生成開始:', params);
              
              try {
                const response = await fetch('/api/create-story', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(params),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || `サーバーエラー (${response.status})`);
                }

                const data = await response.json();
                console.log('✅ ストーリー生成完了:', data);

                if (!data.story) {
                  throw new Error('ストーリーデータが正しく生成されませんでした');
                }

                // タイトルが空または未定義の場合も生成失敗として扱う
                if (!data.title || data.title.trim() === '') {
                  console.warn('title が空です。生成失敗と見なします');
                  throw new Error('ストーリータイトルの生成に失敗しました。再度お試しください。');
                }
                
                // 前回と同じ内容が生成された場合の検知
                if (previousStory && data.story && data.story === previousStory) {
                  console.warn('前回と同じストーリーが生成されました。再生成をお勧めします');
                  throw new Error('前回と同じ内容が生成されました。再度お試しください。');
                }

                // ストーリーデータをローカルストレージに保存
                const storyDataToSave = {
                  story: data.story,
                  themes: data.themes,
                  title: data.title, // タイトル情報を追加
                  genre: params.genre,
                  tone: params.tone,
                  feeling: params.feeling,
                  level: params.level,
                  generatedAt: new Date().toISOString()
                };
                
                localStorage.setItem('contentType', 'story');
                localStorage.setItem('storyData', JSON.stringify(storyDataToSave));
                localStorage.removeItem('storyParams'); // 使用済みパラメータを削除
                
                // 前回のストーリーを記録
                setPreviousStory(data.story);
                
                // 生成されたストーリーを表示
                setStoryData(storyDataToSave);
                setEnglish(data.story);
                setJapanese('');
                setStoryTitle(data.title || 'Untitled Story'); // タイトルを設定
                
                // 段落分割と構造見出し除去
                const rawEngParagraphs = data.story.split('\n\n').filter((p: string) => p.trim().length > 0);
                const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
                setEnglishParagraphs(filteredEngParagraphs);
                
                // 語数カウント
                const words = data.story.trim().split(/\s+/).filter((word: string) => word.length > 0);
                setWordCount(words.length);
                
                // アニメーションを最低3秒表示してから完了
                setTimeout(() => {
                  setLoading(false);
                }, 3000);
                return;
                
              } catch (error) {
                console.error('❌ ストーリー生成エラー:', error);
                setEnglish('ストーリーの生成に失敗しました。しばらく待ってから再試行してください。');
                setHasError(true);
                setLoading(false);
                return;
              }
            } else {
              // パラメータもない場合は/story-formにリダイレクト
              window.location.href = '/story-form';
              return;
            }
          }
        }
        
        // クエリパラメータから type を取得し、読み物とストーリーを明確に分離
        const urlParams = new URLSearchParams(window.location.search);
        const queryType = urlParams.get('type');
        
        // type が明示的に 'story' の場合のみストーリー、それ以外は読み物
        const contentType = queryType === 'story' ? 'story' : 'reading';
        
        console.log('🔍 コンテンツタイプ判定:', { queryType, contentType });
        // レベル取得：初回は固定レベル、再読時は選択された難易度から取得
        const fixedLevel = Number(localStorage.getItem('fixedLevel')) || Number(localStorage.getItem('vocabularyLevel')) || Number(localStorage.getItem('level')) || 7;
        const selectedDifficulty = localStorage.getItem('selectedDifficulty');
        const level = selectedDifficulty ? getLevelFromDifficulty(selectedDifficulty) : fixedLevel;

        let requestData;

        if (contentType === 'story') {
          // ストーリー用のデータを取得
          const storyData = JSON.parse(localStorage.getItem('storyData') || '{}');
          requestData = {
            contentType: 'story',
            storyData,
            level
          };
          console.log('📋 ストーリー生成リクエストデータ:', requestData);
        } else {
          // 読み物用のデータを取得（クエリパラメータ優先）
          const theme = urlParams.get('topic') || localStorage.getItem('theme') || '';
          const emotion = urlParams.get('emotion') || '';
          const style = urlParams.get('style') || localStorage.getItem('style') || '';
          requestData = {
            contentType: 'reading',
            theme,
            emotion,
            style,
            level
          };
          console.log('📋 読み物生成リクエストデータ:', requestData);
        }

        // バリデーション - typeによる分岐
        if (contentType === 'story') {
          if (!requestData.storyData || 
              !requestData.storyData.protagonistType || 
              !requestData.storyData.genre || 
              !requestData.storyData.situation || 
              !requestData.storyData.feeling) {
            console.error('❌ ストーリー設定が不完全です');
            setEnglish('ストーリーの設定が不完全です。ストーリー設定画面から開始してください。');
            setHasError(true);
            setLoading(false);
            return;
          }
        } else {
          // 読み物用のバリデーション
          if (!requestData.theme || !requestData.theme.trim()) {
            console.error('❌ テーマが空です。読み物設定画面から設定してください');
            setEnglish('テーマが設定されていません。読み物設定画面から開始してください。');
            setHasError(true);
            setLoading(false);
            return;
          }

          if (!requestData.emotion || !requestData.emotion.trim()) {
            console.error('❌ 感情が空です。読み物設定画面から設定してください');
            setEnglish('得たい感情が設定されていません。読み物設定画面から開始してください。');
            setHasError(true);
            setLoading(false);
            return;
          }

          if (!requestData.style || !requestData.style.trim()) {
            console.error('❌ スタイルが空です。読み物設定画面から設定してください');
            setEnglish('表現スタイルが設定されていません。読み物設定画面から開始してください。');
            setHasError(true);
            setLoading(false);
            return;
          }
        }

        const res = await fetch('/api/generate-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('❌ API エラー:', errorData);
          throw new Error(errorData.error || 'Failed to generate reading');
        }

        const data = await res.json();
        console.log('✅ API レスポンス受信:', { hasEnglish: !!data.english, hasJapanese: !!data.japanese });
        
        // 英語エラーメッセージを日本語に変換
        let englishText = data.english || '';
        let japaneseText = data.japanese || '';
        let isError = false;
        
        if (englishText) {
          // 特定の英語エラーメッセージを検知して日本語化
          if (englishText.includes("I'm unable to fulfill this request") || 
              englishText.includes("not possible within the constraints") ||
              englishText.includes("allowed vocabulary")) {
            englishText = '単語のしばりがキツすぎて作れなかったにゃ';
            japaneseText = '';
            isError = true;
          } else if (englishText.includes("I'm sorry, but I cannot comply") ||
                     englishText.includes("cannot comply with that request")) {
            englishText = 'ごめんなさい、うまく作れませんでした。他のものでトライしてみてください。';
            japaneseText = '';
            isError = true;
          } else if (englishText.includes("I cannot") || 
                     englishText.includes("I can't") ||
                     englishText.includes("unable to") ||
                     englishText.includes("not able to")) {
            englishText = 'ごめんなさい、うまく作れませんでした。他のものでトライしてみてください。';
            japaneseText = '';
            isError = true;
          } else if (englishText.length < 50) {
            // テキストが短すぎる場合もエラーとみなす
            englishText = 'ごめんなさい、うまく作れませんでした。他のものでトライしてみてください。';
            japaneseText = '';
            isError = true;
          }
        } else {
          // 英語テキストが空の場合
          englishText = 'ごめんなさい、うまく作れませんでした。他のものでトライしてみてください。';
          isError = true;
        }
        
        setJapanese(japaneseText);
        setEnglish(englishText);
        setHasError(isError);
        
        // 段落ごとに分割
        if (englishText && !isError) {
          const engParagraphs = englishText.split('\n\n').filter(p => p.trim().length > 0);
          const jpParagraphs = japaneseText ? japaneseText.split('\n\n').filter(p => p.trim().length > 0) : [];
          setEnglishParagraphs(engParagraphs);
          setJapaneseParagraphs(jpParagraphs);
        }
        
        // 英語テキストの語数をカウント（エラーでない場合のみ）
        if (englishText && !isError) {
          const words = englishText.trim().split(/\s+/).filter((word: string) => word.length > 0);
          setWordCount(words.length);
          console.log(`📊 語数カウント: ${words.length}語`);
        }

        // 現在のレベルを取得
        setCurrentLevel(level);
      } catch (err) {
        console.error('❌ 読み物取得エラー:', err);
        setEnglish('ごめんなさい、うまく作れませんでした。他のものでトライしてみてください。');
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isStoryMode]); */

  // パラメータ変更監視とコンテンツ再生成
  useEffect(() => {
    console.log('🔍 useEffect [パラメータ変更監視] triggered');
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryType = urlParams.get('type');
      
      // 読み物モードの場合のみ監視
      if (queryType !== 'story') {
        // レベル取得：初回は固定レベル、再読時は選択された難易度から取得
        const fixedLevel = Number(localStorage.getItem('fixedLevel')) || Number(localStorage.getItem('vocabularyLevel')) || Number(localStorage.getItem('level')) || 7;
        const selectedDifficulty = localStorage.getItem('selectedDifficulty');
        const level = selectedDifficulty ? getLevelFromDifficulty(selectedDifficulty) : fixedLevel;
        const theme = urlParams.get('topic') || localStorage.getItem('theme') || '';
        const emotion = urlParams.get('emotion') || '';
        const style = urlParams.get('style') || localStorage.getItem('style') || '';
        
        // パラメータに変更があった場合
        if (level !== currentLevel || theme !== currentTheme || emotion !== currentEmotion || style !== currentStyle) {
          console.log('📋 パラメータ変更検知:', { 
            levelChanged: level !== currentLevel,
            themeChanged: theme !== currentTheme,
            emotionChanged: emotion !== currentEmotion,
            styleChanged: style !== currentStyle
          });
          
          // 現在の状態を更新
          setCurrentLevel(level);
          setCurrentTheme(theme);
          setCurrentEmotion(emotion);
          setCurrentStyle(style);
          
          // 翻訳表示をリセット
          setShowJapanese(false);
          setJapaneseParagraphs([]);
          
          // コンテンツ再生成（全てのパラメータが揃っている場合）
          if (theme && emotion && style) {
            console.log('🔄 コンテンツ再生成開始');
            setLoading(true);
            setHasError(false);
            
            const fetchUpdatedData = async () => {
              try {
                const requestData = {
                  contentType: 'reading',
                  theme,
                  emotion,
                  style,
                  level
                };
                
                console.log('📋 更新リクエストデータ:', requestData);
                
                const res = await fetch('/api/generate-reading', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestData),
                });
                
                if (!res.ok) {
                  const errorData = await res.json();
                  console.error('❌ API エラー:', errorData);
                  throw new Error(errorData.error || 'Failed to generate reading');
                }
                
                const data = await res.json();
                console.log('✅ 更新API レスポンス受信:', { hasEnglish: !!data.english, hasJapanese: !!data.japanese });
                
                setEnglish(data.english || '');
                setJapanese(data.japanese || '');
                
                // 段落分割と構造見出し除去
                const rawEngParagraphs = (data.english || '').split('\n\n').filter((p: string) => p.trim().length > 0);
                const rawJpnParagraphs = (data.japanese || '').split('\n\n').filter((p: string) => p.trim().length > 0);
                
                const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
                const filteredJpnParagraphs = filterStructuralHeadings(rawJpnParagraphs);
                
                setEnglishParagraphs(filteredEngParagraphs);
                setJapaneseParagraphs(filteredJpnParagraphs);
                
                // 語数カウント
                const words = (data.english || '').split(/\s+/).filter(word => word.trim().length > 0);
                setWordCount(words.length);
                
                // 更新された読み物データを localStorage に保存
                const updatedReadingDataToSave = {
                  english: data.english || '',
                  japanese: data.japanese || '',
                  theme,
                  emotion,
                  style,
                  level,
                  timestamp: Date.now()
                };
                localStorage.setItem('currentReadingData', JSON.stringify(updatedReadingDataToSave));
                
                console.log('✅ コンテンツ更新完了');
              } catch (error) {
                console.error('❌ コンテンツ更新エラー:', error);
                setEnglish('コンテンツの更新に失敗しました。しばらく待ってから再試行してください。');
                setHasError(true);
              } finally {
                setLoading(false);
              }
            };
            
            fetchUpdatedData();
          }
        }
      }
    }
  }, [currentLevel, currentTheme, currentEmotion, currentStyle]);

  // 🔧 根本修正: シンプルな初回ロード制御
  useEffect(() => {
    console.log('🔍 useEffect [初回ロード制御] triggered');
    console.log('🚦 hasLoadedOnce.current:', hasLoadedOnce.current);
    console.log('🎭 mode:', mode);
    console.log('📍 historyId:', historyId);
    
    // 🚫 既にロード済みの場合は何もしない
    if (hasLoadedOnce.current) {
      console.log('✅ 既にロード済み - 処理をスキップ');
      return;
    }
    
    // 🚫 ストーリーモードの場合は何もしない
    if (mode === 'story') {
      console.log('✅ ストーリーモード - 処理をスキップ');
      return;
    }
    
    // 履歴IDがある場合の処理
    if (historyId) {
      console.log('📚 履歴から再読要求:', historyId);
      const readingHistory = JSON.parse(localStorage.getItem('readingHistory') || '[]');
      const historyItem = readingHistory.find((item: any) => item.id === historyId);
      
      if (historyItem && historyItem.content) {
        console.log('✅ 履歴データ発見、即座に表示');
        
        // ✅ ストーリータイトル復元（モードは既に判定済み）
        if (historyItem.isStoryMode && historyItem.title) {
          setStoryTitle(historyItem.title);
          console.log('📖 ストーリー履歴復元:', { title: historyItem.title, isStoryMode: historyItem.isStoryMode });
        }
        
        // 履歴データから読み物を復元
        setEnglish(historyItem.content || '');
        setJapanese(historyItem.translation || '');
        
        // 段落分割と構造見出し除去
        const rawEngParagraphs = (historyItem.content || '').split('\n\n').filter((p: string) => p.trim().length > 0);
        const rawJpnParagraphs = (historyItem.translation || '').split('\n\n').filter((p: string) => p.trim().length > 0);
        
        const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
        const filteredJpnParagraphs = filterStructuralHeadings(rawJpnParagraphs);
        
        setEnglishParagraphs(filteredEngParagraphs);
        setJapaneseParagraphs(filteredJpnParagraphs);
        
        // 語数設定
        setWordCount(historyItem.wordCount || 0);
        
        // 読書状態をリセット
        setIsReadingStarted(false);
        setStartTime(null);
        setEndTime(null);
        setWpm(null);
        setShowJapanese(false);
        
        setLoading(false);
        hasLoadedOnce.current = true;
        return;
      }
    }
    
    // localStorage からの復元を優先
    const lastReading = localStorage.getItem('lastReading');
    if (lastReading) {
      try {
        const savedData = JSON.parse(lastReading);
        console.log('✅ lastReading から復元:', savedData.theme);
        
        // 読み物データの復元
        setEnglish(savedData.english || '');
        setJapanese(savedData.japanese || '');
        
        // 段落分割と構造見出し除去
        const rawEngParagraphs = (savedData.english || '').split('\n\n').filter((p: string) => p.trim().length > 0);
        const rawJpnParagraphs = (savedData.japanese || '').split('\n\n').filter((p: string) => p.trim().length > 0);
        
        const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
        const filteredJpnParagraphs = filterStructuralHeadings(rawJpnParagraphs);
        
        setEnglishParagraphs(filteredEngParagraphs);
        setJapaneseParagraphs(filteredJpnParagraphs);
        
        // 語数カウント
        const words = (savedData.english || '').split(/\s+/).filter(word => word.trim().length > 0);
        setWordCount(words.length);
        
        // 読書状態をリセット
        setIsReadingStarted(false);
        setStartTime(null);
        setEndTime(null);
        setWpm(null);
        setShowJapanese(false);
        
        setLoading(false);
        hasLoadedOnce.current = true;
        return;
      } catch (error) {
        console.error('❌ lastReading 復元エラー:', error);
      }
    }
    
    // 新規生成が必要かチェック
    const topic = searchParams.get('topic');
    const emotion = searchParams.get('emotion');
    const style = searchParams.get('style');
    
    if (topic && emotion && style) {
      console.log('🆕 新規読み物生成:', { topic, emotion, style });
      generateReading();
      hasLoadedOnce.current = true;
    } else {
      console.log('⚠️ 読み物パラメータが不完全:', { topic, emotion, style });
      setLoading(false);
    }
  }, []);

  // 語彙レベル初期化：vocabLevelをeffectiveLevelに反映
  useEffect(() => {
    const vocabLevel = Number(localStorage.getItem('vocabLevel'));
    if (vocabLevel && vocabLevel > 0) {
      console.log('📊 語彙テスト結果をeffectiveLevelに設定:', vocabLevel);
      setEffectiveLevel(vocabLevel);
    }
  }, []);

  // メインuseEffect: パラメータ変化に応じた処理
  useEffect(() => {
    // 履歴からの再読: URLにidパラメータが存在する場合
    if (historyId) {
      console.log('📚 履歴から再読要求:', historyId);
      const readingHistory = JSON.parse(localStorage.getItem('readingHistory') || '[]');
      const historyItem = readingHistory.find((item: any) => item.id === historyId);
      
      if (historyItem && historyItem.content) {
        console.log('✅ 履歴データ発見、即座に表示');
        
        // ✅ ストーリータイトル復元（モードは既に判定済み）
        if (historyItem.isStoryMode && historyItem.title) {
          setStoryTitle(historyItem.title);
          console.log('📖 ストーリー履歴復元:', { title: historyItem.title, isStoryMode: historyItem.isStoryMode });
        }
        
        // 履歴データから読み物を復元
        setEnglish(historyItem.content || '');
        setJapanese(historyItem.translation || '');
        
        // 段落分割と構造見出し除去
        const rawEngParagraphs = (historyItem.content || '').split('\n\n').filter((p: string) => p.trim().length > 0);
        const rawJpnParagraphs = (historyItem.translation || '').split('\n\n').filter((p: string) => p.trim().length > 0);
        
        const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
        const filteredJpnParagraphs = filterStructuralHeadings(rawJpnParagraphs);
        
        setEnglishParagraphs(filteredEngParagraphs);
        setJapaneseParagraphs(filteredJpnParagraphs);
        
        // 語数設定
        setWordCount(historyItem.wordCount || 0);
        
        // 読書状態をリセット
        setIsReadingStarted(false);
        setStartTime(null);
        setEndTime(null);
        setWpm(null);
        setShowJapanese(false);
        
        setLoading(false);
        hasLoadedOnce.current = true;
        return;
      } else {
        console.log('❌ 履歴データが見つからない:', historyId);
        setLoading(false);
        return;
      }
    }
    
    // 新規ストーリー生成の場合はhasLoadedOnceをリセット
    const genre = searchParams.get('genre') || '';
    const tone = searchParams.get('tone') || '';
    const feeling = searchParams.get('feeling') || '';
    const isNewStoryGeneration = isStoryMode && genre && tone && feeling && !historyId;
    if (isNewStoryGeneration) {
      console.log('🆕 新規ストーリー生成のためキャッシュをクリア（hasLoadedOnce維持）');
      // 🔧 修正①: hasLoadedOnce.current = false を削除して重複実行を防止
      // hasLoadedOnce.current = false; // ← 削除: 重複実行の原因
      // 前回のデータをクリア
      localStorage.removeItem('readingContent');
      localStorage.removeItem('storyData');
      localStorage.removeItem('lastStory');
    }
    
    // 🔧 修正3: パラメータ変化検知の強化（文字列形式でキャッシュ比較）
    const newParams = `${genre}-${tone}-${feeling}-${effectiveLevel}`;
    const paramsChanged = previousParams.current !== newParams;
    
    console.log('🔍 【パラメータ変化検知】');
    console.log('  - 前回:', previousParams.current);
    console.log('  - 今回:', newParams);
    console.log('  - 変化:', paramsChanged);
    
    // 🔧 修正①: 読み物の不必要な再生成を防止（強化版）
    if (hasLoadedOnce.current && !isNewStoryGeneration && !paramsChanged && !historyId) {
      console.log('🚫 【二重実行防止】既にロード済みかつ新規生成ではなく、パラメータ変更もないためスキップ');
      return;
    }
    
    // 🔧 修正①: コンテンツ既存時の追加ガード
    if (hasLoadedOnce.current && (english || japanese) && !historyId) {
      console.log('🚫 【二重実行防止】コンテンツ既存のためスキップ');
      return;
    }
    
    // isGeneratingReading ガードをチェック
    if (isGeneratingReading.current) {
      console.log('🚫 generateReading実行中のためスキップ');
      return;
    }
    
    // パラメータ変更を記録
    if (paramsChanged) {
      console.log('🔄 パラメータ変更検知:', { 
        previous: previousParams.current, 
        current: newParams 
      });
      previousParams.current = newParams;
      
      // パラメータ変更時は古いデータをクリア
      if (isStoryMode && (genre || tone || feeling)) {
        console.log('🧹 ストーリーパラメータ変更のため古いデータをクリア');
        localStorage.removeItem('readingContent');
        localStorage.removeItem('storyData');
        localStorage.removeItem('lastStory');
        // 🔧 修正: hasLoadedOnceリセットを削除（ブラウザバック時の不要な再生成を防止）
      }
    }

    // 🔧 修正③: ブラウザバック時の再生成を防止 - lastReadingとlastStory両方から復元
    const lastReading = localStorage.getItem('lastReading');
    const lastStory = localStorage.getItem('lastStory');
    
    // 🔧 修正③: 強化されたブラウザバック検知（notebook専用強化）
    const isBackNavigation = typeof window !== 'undefined' && (
      document.referrer.includes(window.location.origin) || 
      window.performance?.navigation?.type === 2 || // TYPE_BACK_FORWARD
      document.referrer.includes('/notebook') || // notebookから戻る場合
      document.referrer.includes('/history') ||  // historyから戻る場合
      document.referrer.includes('/choose') ||   // chooseから戻る場合
      window.location.search === window.sessionStorage.getItem('lastReadingURL') // URL変化なし判定
    );
    
    // 🔧 修正②: fromNotebook識別の追加（最優先処理）
    const fromNotebook = document.referrer.includes('/notebook');
    if (fromNotebook) {
      console.log('📚 【修正②】notebookから戻り検知 - generateReading()完全ブロック');
      window.sessionStorage.setItem('fromNotebook', 'true');
      
      // 🚫 【最重要】notebook戻りの場合は即座にlocalStorage表示のみ実行
      if (lastReading) {
        try {
          const savedData = JSON.parse(lastReading);
          console.log('📖 【notebook戻り専用】lastReading即座復元:', savedData.title);
          
          // UI表示のみ（generateReading絶対に呼ばない）
          if (Array.isArray(savedData.english)) {
            setEnglish(savedData.english.join('\n\n'));
            setEnglishParagraphs(savedData.english);
          } else {
            setEnglish(savedData.english || '');
            setEnglishParagraphs(savedData.english ? savedData.english.split('\n\n') : []);
          }
          
          if (Array.isArray(savedData.japanese)) {
            setJapanese(savedData.japanese.join('\n\n'));
            setJapaneseParagraphs(savedData.japanese);
          } else {
            setJapanese(savedData.japanese || '');
            setJapaneseParagraphs(savedData.japanese ? savedData.japanese.split('\n\n') : []);
          }
          
          // 語数設定
          const words = (Array.isArray(savedData.english) ? savedData.english.join(' ') : savedData.english).split(/\s+/).filter(word => word.trim().length > 0);
          setWordCount(words.length);
          
          setLoading(false);
          hasLoadedOnce.current = true;
          
          console.log('✅ 【notebook戻り完了】localStorage表示のみ実行 - generateReading()未実行');
          return; // 早期リターンで以降の処理を完全にスキップ
        } catch (error) {
          console.error('❌ notebook戻り時の復元エラー:', error);
        }
      }
    }
    
    console.log('🔍 【致命的同期不全修正3】ブラウザナビゲーション検知:', { 
      isBackNavigation, 
      referrer: typeof window !== 'undefined' ? document.referrer : 'N/A',
      navigationType: typeof window !== 'undefined' ? window.performance?.navigation?.type : 'N/A',
      isNotebookBack: typeof window !== 'undefined' && document.referrer.includes('/notebook'),
      hasLoadedOnce: hasLoadedOnce.current,
      hasLastReading: !!lastReading
    });
    
    // 🔧 修正③: ブラウザバック時は絶対にgenerateReading()を実行しない（強化版）
    if (isBackNavigation && (lastReading || lastStory)) {
      console.log('🔙 【修正③】ブラウザバック検知: localStorage表示のみ実行（generateReading完全防止）');
      console.log('🚫 【重要】generateReading()は絶対に呼び出しません');
      
      try {
        const savedData = JSON.parse(lastReading);
        console.log('📖 【notebook→戻る】lastReadingから即座に復元:', {
          title: savedData.title,
          topic: savedData.topic,
          hasEnglish: !!savedData.english,
          hasJapanese: !!savedData.japanese
        });
        
        // UI表示のみ実行（generateReading()は絶対に呼ばない）
        if (Array.isArray(savedData.english)) {
          setEnglish(savedData.english.join('\n\n'));
          setEnglishParagraphs(savedData.english);
        } else {
          setEnglish(savedData.english || '');
          setEnglishParagraphs(savedData.english ? savedData.english.split('\n\n') : []);
        }
        
        if (Array.isArray(savedData.japanese)) {
          setJapanese(savedData.japanese.join('\n\n'));
          setJapaneseParagraphs(savedData.japanese);
        } else {
          setJapanese(savedData.japanese || '');
          setJapaneseParagraphs(savedData.japanese ? savedData.japanese.split('\n\n') : []);
        }
        
        setLoading(false);
        console.log('✅ 【notebook→戻る】表示のみ完了 - generateReading()回避成功');
        
      } catch (error) {
        console.error('❌ lastReading復元エラー:', error);
      }
      
      return; // 早期リターンで再生成を完全防止
    }
    
    // 🔧 修正①③: ブラウザバック時データ復元（新規生成が必要でない場合のみ）
    // 新規生成が必要かどうかの判定
    const hasNewGenerationParams = !historyId && (
      (isStoryMode && searchParams.get('genre') && searchParams.get('tone') && searchParams.get('feeling')) ||
      (!isStoryMode && searchParams.get('topic') && searchParams.get('emotion') && searchParams.get('style'))
    );
    
    console.log('🔍 新規生成判定:', { 
      hasNewGenerationParams, 
      isStoryMode, 
      hasStoryParams: !!(searchParams.get('genre') && searchParams.get('tone') && searchParams.get('feeling')),
      hasReadingParams: !!(searchParams.get('topic') && searchParams.get('emotion') && searchParams.get('style'))
    });
    
    // 新規生成が不要で、既存データがある場合は復元
    if (!hasNewGenerationParams && !historyId && (lastReading || lastStory)) {
      console.log('🔄 ブラウザバック時データ復元開始:', { hasLastReading: !!lastReading, hasLastStory: !!lastStory });
      
      try {
        let restoreData = null;
        
        // ストーリーモードの場合はlastStoryから、読み物モードの場合はlastReadingから復元
        if (isStoryMode && lastStory) {
          restoreData = JSON.parse(lastStory);
          console.log('✅ lastStoryから復元:', restoreData.title);
        } else if (!isStoryMode && lastReading) {
          restoreData = JSON.parse(lastReading);
          console.log('✅ lastReadingから復元:', restoreData.theme);
        }
        
        if (restoreData) {
          // タイトルまたはコンテンツが空の場合は復元をスキップ
          if ((!restoreData.title && !restoreData.theme) || !restoreData.english) {
            console.log('🚫 復元データが不完全のためスキップ');
            localStorage.removeItem(isStoryMode ? 'lastStory' : 'lastReading');
          } else {
            // 🔧 修正①: ローディング状態を即座に解除して復元データを表示
            setLoading(false);
            setEnglish(restoreData.english || restoreData.content || '');
            setJapanese(restoreData.japanese || restoreData.translation || '');
            
            if (isStoryMode && restoreData.title) {
              setStoryTitle(restoreData.title || '');
            }
            
            // 段落分割
            const content = restoreData.english || restoreData.content || '';
            const translation = restoreData.japanese || restoreData.translation || '';
            
            const rawEngParagraphs = content.split('\n\n').filter((p: string) => p.trim().length > 0);
            const rawJpnParagraphs = translation.split('\n\n').filter((p: string) => p.trim().length > 0);
            
            const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
            const filteredJpnParagraphs = filterStructuralHeadings(rawJpnParagraphs);
            
            setEnglishParagraphs(filteredEngParagraphs);
            setJapaneseParagraphs(filteredJpnParagraphs);
            
            // 語数カウント
            const words = content.split(/\s+/).filter(word => word.trim().length > 0);
            setWordCount(words.length);
            
            // 読書状態をリセット
            setIsReadingStarted(false);
            setStartTime(null);
            setEndTime(null);
            setWpm(null);
            setShowJapanese(false);
            
            hasLoadedOnce.current = true;
            console.log('✅ ブラウザバック時データ復元完了（新規生成回避）');
            return;
          }
        }
      } catch (error) {
        console.error('❌ ブラウザバック時データ復元エラー:', error);
        // 復元に失敗した場合は通常の処理を続行
      }
    }

    // 🔧【修正】localStorage復元はid指定時のみに限定
    const saved = localStorage.getItem('readingContent');
    console.log('🔍 【localStorage確認】readingContent存在:', !!saved, 'historyId:', historyId);
    
    if (saved && historyId) {
      console.log('🔥 【修正後】id指定時のみローカルコンテンツを復元:', historyId);
      try {
        const parsedContent = JSON.parse(saved);
        console.log('🔥 保存済みデータ検出：履歴再読での表示');
        
        // 既存データを即座に表示
        setEnglish(parsedContent.english || '');
        setJapanese(parsedContent.japanese || '');
        
        // 段落分割と構造見出し除去
        const rawEngParagraphs = (parsedContent.english || '').split('\n\n').filter((p: string) => p.trim().length > 0);
        const rawJpnParagraphs = (parsedContent.japanese || '').split('\n\n').filter((p: string) => p.trim().length > 0);
        
        const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
        const filteredJpnParagraphs = filterStructuralHeadings(rawJpnParagraphs);
        
        setEnglishParagraphs(filteredEngParagraphs);
        setJapaneseParagraphs(filteredJpnParagraphs);
        
        // 語数カウント
        const words = (parsedContent.english || '').split(/\s+/).filter(word => word.trim().length > 0);
        setWordCount(words.length);
        
        // 読書状態をリセット
        setIsReadingStarted(false);
        setStartTime(null);
        setEndTime(null);
        setWpm(null);
        setShowJapanese(false);
        
        setLoading(false);
        hasLoadedOnce.current = true;
        return;
      } catch (error) {
        console.error('❌ 保存データの復元に失敗:', error);
        localStorage.removeItem('readingContent');
      }
    } else if (saved && !historyId) {
      console.log('🔧 【修正】id未指定でlocalStorageにデータあり - 新規生成のためクリア');
      console.log('🔧 【修正】これによりストーリーモードでも毎回新規生成される');
      
      // 🔧【修正】ストーリー関連のlocalStorageもクリア
      localStorage.removeItem('readingContent');
      localStorage.removeItem('storyData');
      console.log('🧹 【クリア】readingContent と storyData をクリアしました');
    }

    // 初回：生成処理
    console.log('🆕 初回検出：新規読み物・ストーリー生成開始');
    
    if (isStoryMode) {
      console.log('🎭 【ストーリーモード判定】ストーリーモードが有効');
      // ストーリーモードの場合
      const genre = searchParams.get('genre') || '';
      const tone = searchParams.get('tone') || '';
      const feeling = searchParams.get('feeling') || '';
      
      console.log('🎭 【ストーリーパラメータ検証】', { genre, tone, feeling });
      
      if (genre && tone && feeling) {
        console.log('✅ 【ストーリー生成条件満たす】パラメータが揃っている');
        console.log('🔄 ストーリー初回生成開始:', { genre, tone, feeling });
        setLoading(true);
        // ストーリー生成処理を呼び出し
        // generateStory を呼び出すのではなく、既存のストーリー生成ロジックを実行
        const generateStoryDirectly = async () => {
          try {
            // 前回のストーリー/読み物データをクリア
            localStorage.removeItem('lastStory');
            
            // 生成開始時にストーリー状態をクリア
            setEnglish('');
            setJapanese('');
            setStoryTitle('');
            setStoryData(null);
            setEnglishParagraphs([]);
            setJapaneseParagraphs([]);
            setHasError(false);
            
            const params = {
              genre,
              tone,
              feeling: feeling,
              level: effectiveLevel
            };
            
            console.log('📝 ストーリー生成開始:', params);
            
            const res = await fetch('/api/create-story', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
            });
            
            const data = await res.json();

            console.log("✅ ストーリーデータ取得:", data);

            // 🔧 修正5: ストーリーデータ検証強化
            if (!res.ok) {
              console.error("❌ APIエラー:", data);
              setHasError(true);
              setEnglish("ストーリーの取得に失敗しました。");
              return;
            }
            
            if (!data || typeof data !== 'object' || !data.story || data.story.trim() === '') {
              console.error("❌ 無効なストーリーデータ:", data);
              setHasError(true);
              setEnglish("有効なストーリーが生成されませんでした。");
              return;
            }

            // 🔧 修正: setStory の代わりに setStoryData を使用
            setStoryData(data);

            // タイトルが空または未定義の場合も生成失敗として扱う
            if (!data.title || data.title.trim() === '') {
              throw new Error('ストーリータイトルの生成に失敗しました。再度お試しください。');
            }

            // ストーリーデータをローカルストレージに保存
            const storyDataToSave = {
              story: data.story,
              themes: data.themes,
              title: data.title,
              genre: params.genre,
              tone: params.tone,
              feeling: params.feeling,
              level: params.level,
              generatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('contentType', 'story');
            localStorage.setItem('storyData', JSON.stringify(storyDataToSave));
            localStorage.removeItem('storyParams');
            
            // 生成されたストーリーを表示
            setStoryData(storyDataToSave);
            setEnglish(data.story);
            setJapanese('');
            setStoryTitle(data.title || 'Untitled Story'); // タイトルを設定
            
            // 段落分割と構造見出し除去
            const rawEngParagraphs = data.story.split('\n\n').filter((p: string) => p.trim().length > 0);
            const filteredEngParagraphs = filterStructuralHeadings(rawEngParagraphs);
            setEnglishParagraphs(filteredEngParagraphs);
            
            // 語数カウント
            const words = data.story.trim().split(/\s+/).filter((word: string) => word.length > 0);
            setWordCount(words.length);
            
            // アニメーションを最低3秒表示してから完了
            setTimeout(() => {
              setLoading(false);
            }, 3000);
            hasLoadedOnce.current = true;
          } catch (err) {
            console.error("❌ ストーリー生成中にエラー:", err);
            setHasError(true);
            setEnglish("ストーリー生成に失敗しました。");
            setLoading(false);
            hasLoadedOnce.current = true;
          }
        };
        
        generateStoryDirectly();
      } else {
        console.log('❌ 【問題候補3】ストーリーパラメータ不足:', { genre, tone, feeling });
        console.log('❌ 【問題候補3】genre/tone/feeling が空のため生成されない');
        console.log('❌ 【問題候補3】/story-form からのパラメータ渡しに問題がある可能性');
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    } else {
      console.log('📚 【読み物モード判定】読み物モードが有効');
      // 読み物モードの場合
      const theme = searchParams.get('topic') || searchParams.get('theme') || '';
      const emotion = searchParams.get('emotion') || '';
      const style = searchParams.get('style') || '';
      
      console.log('📚 【読み物パラメータ検証】', { theme, emotion, style });
      
      if (theme && emotion && style) {
        console.log('✅ 【読み物生成条件満たす】パラメータが揃っている');
        
        // 🔧 修正③: 読み物生成前の最終ブラウザバック判定
        if (isBackNavigation && window.sessionStorage.getItem('fromNotebook')) {
          console.log('🚫 【修正③】notebook戻り検知のため generateReading() をスキップ');
          setLoading(false);
          hasLoadedOnce.current = true;
          return;
        }
        
        console.log('🔄 読み物初回生成開始: generateReading呼び出し');
        setLoading(true);
        generateReading().then(() => {
          // アニメーションを最低3秒表示してから完了
          setTimeout(() => {
            setLoading(false);
          }, 3000);
          hasLoadedOnce.current = true;
        });
      } else {
        console.log('❌ 【読み物パラメータ不足】:', { theme, emotion, style });
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    }
  }, [searchParams.get('genre'), searchParams.get('tone'), searchParams.get('feeling'), searchParams.get('topic'), searchParams.get('emotion'), searchParams.get('style'), isStoryMode, effectiveLevel, historyId]);
  
  // 【デバッグ】依存配列の値を監視
  useEffect(() => {
    console.log('🔍 【依存配列監視】useEffect依存値の変化をトラッキング:');
    console.log('  - genre:', searchParams.get('genre'));
    console.log('  - tone:', searchParams.get('tone'));
    console.log('  - feeling:', searchParams.get('feeling'));
    console.log('  - topic:', searchParams.get('topic'));
    console.log('  - emotion:', searchParams.get('emotion'));
    console.log('  - style:', searchParams.get('style'));
    console.log('  - isStoryMode:', isStoryMode);
    console.log('  - effectiveLevel:', effectiveLevel);
    console.log('  - historyId:', historyId);
  }, [searchParams.get('genre'), searchParams.get('tone'), searchParams.get('feeling'), searchParams.get('topic'), searchParams.get('emotion'), searchParams.get('style'), isStoryMode, effectiveLevel, historyId]);
  
  // 🔧【修正】ストーリーパラメータによる強制新規生成useEffect
  useEffect(() => {
    console.log('🎭 【強制ストーリー生成】useEffect triggered');
    
    const id = searchParams.get('id');
    const genre = searchParams.get('genre');
    const tone = searchParams.get('tone');
    const feeling = searchParams.get('feeling'); // aftertaste → feeling に変更
    
    console.log('🎭 【強制ストーリー生成】パラメータチェック:', { historyId, genre, tone, feeling });
    
    // 履歴ID未指定かつストーリーパラメータが揃っている場合は強制生成（履歴復元を優先）
    if (!historyId && genre && tone && feeling) {
      console.log('✅ 【強制ストーリー生成】条件満たす - キャッシュクリアのみ実行（hasLoadedOnce維持）');
      
      // 🔧 修正①: hasLoadedOnce.current = false を削除して重複実行を防止
      // hasLoadedOnce.current = false; // ← 削除: 重複実行の原因
      
      // ローカルストレージをクリアして新規生成を促す（hasLoadedOnceは維持）
      localStorage.removeItem('readingContent');
      localStorage.removeItem('storyData');
      localStorage.removeItem('lastStory');
      
      console.log('🎭 【強制ストーリー生成】キャッシュクリア完了（重複実行防止）');
    } else {
      console.log('🎭 【強制ストーリー生成】条件未満たす - スキップ');
    }
  }, [searchParams.get('genre'), searchParams.get('tone'), searchParams.get('feeling')]);

  // 英語コンテンツ変更時のステートリセット
  useEffect(() => {
    console.log('🧠 useEffect[englishContent] fired');
    console.log('englishContent:', english);
    
    // 戻る操作やlocalStorageからの読み込み時は何もしない
    const isFromStorage = hasLoadedOnce.current && localStorage.getItem('readingContent');
    const isReloading = !hasLoadedOnce.current;
    
    console.log('should reset?', !isReloading && !isFromStorage);
    console.log('hasLoadedOnce.current:', hasLoadedOnce.current);
    console.log('localStorage exists:', !!localStorage.getItem('readingContent'));
    
    // 初回生成時 or 明示的な再読時のみリセット実行
    if (!english || isReloading || isFromStorage) {
      console.log('🚫 ステートリセットをスキップ（戻る操作またはlocalStorage読み込み）');
      return;
    }
    
    console.log('🔄 ステートリセット実行（初回生成または明示的再読）');
    setIsReadingStarted(false);
    setShowJapanese(false);
    setStartTime(null);
    setEndTime(null);
    setWpm(null);
    console.log('📝 英語コンテンツ変更によるステートリセット完了');
  }, [english]);

  // タイトル検証とリダイレクト処理
  useEffect(() => {
    // ストーリーモードでローディング完了後、タイトルが空の場合はstory-formへリダイレクト
    if (isStoryMode && !loading && english && (!storyTitle || storyTitle.trim() === '')) {
      console.log('🚫 タイトルが空のためstory-formへリダイレクト');
      router.replace('/story-form');
    }
  }, [isStoryMode, loading, english, storyTitle, router]);

  // ストーリーモード用：effectiveLevel変更監視とストーリー生成
  useEffect(() => {
    console.log('🔍 useEffect [ストーリーeffectiveLevel変更監視] triggered');
    if (typeof window !== 'undefined' && isStoryMode) {
      const existingStoryData = JSON.parse(localStorage.getItem('storyData') || '{}');
      
      // ストーリーデータが存在し、レベルが変更された場合に再生成
      if (existingStoryData.genre && existingStoryData.tone && existingStoryData.feeling) {
        const currentStoredLevel = existingStoryData.level || 7;
        
        if (currentStoredLevel !== effectiveLevel) {
          console.log('🔄 ストーリー effectiveLevel 変更検知:', { 
            effectiveLevel, 
            currentStoredLevel,
            genre: existingStoryData.genre,
            tone: existingStoryData.tone,
            feeling: existingStoryData.feeling 
          });
          generateStoryWithNewLevel(effectiveLevel);
        }
      }
    }
  }, [effectiveLevel, isStoryMode]);

  // 読み物モード用：語彙レベル、テーマ、感情、スタイルの変更を監視して読み物を再生成
  useEffect(() => {
    console.log('🔍 useEffect [読み物モード用パラメータ変更監視] triggered');
    
    // searchParams個別値の組み合わせで変化を検知
    const combined = `${level}-${topic}-${emotion}-${style}`;
    
    console.log('🔍 combined params:', combined);
    console.log('🔍 previous params:', previousParams.current);
    
    if (combined === previousParams.current) {
      console.log('🔁 パラメータに変化なし。読み物生成スキップ');
      return;
    }
    
    previousParams.current = combined;
    
    // localStorageにデータがあるかチェックする別処理を優先
    if (hasLoadedOnce.current) {
      console.log('🚫 hasLoadedOnce.current is true, skipping regeneration');
      return;
    }
    
    if (typeof window !== 'undefined' && !isStoryMode) {
      const selectedDifficulty = localStorage.getItem('selectedDifficulty');
      const themeValue = topic || localStorage.getItem('theme') || '';
      const emotionValue = emotion || '';
      const styleValue = style || localStorage.getItem('style') || '';
      
      // 必要なパラメータが揃っている場合のみ再生成
      if (themeValue && emotionValue && styleValue) {
        console.log('🔄 パラメータ変更による読み物再生成:', { themeValue, emotionValue, styleValue });
        console.log('🔁 パラメータ変更からgenerateReading呼び出し');
        generateReading();
      }
    }
  }, [level, topic, emotion, style]);

  // 読書時間測定開始
  const handleStartReading = () => {
    setIsReadingStarted(true);
    setStartTime(Date.now());
  };

  // ストーリーを新しいレベルで再生成する関数（同一内容で語彙レベルのみ変更）
  const generateStoryWithNewLevel = async (effectiveLevel: number) => {
    if (typeof window === 'undefined') return;
    
    console.log('🔄 ストーリー語彙レベル変更開始:', effectiveLevel);
    setLoading(true);
    setHasError(false);
    
    // 前回のストーリー/読み物データをクリア
    localStorage.removeItem('lastStory');
    
    // 生成開始時にストーリー状態をクリア
    setEnglish('');
    setJapanese('');
    setStoryTitle('');
    setStoryData(null);
    setEnglishParagraphs([]);
    setJapaneseParagraphs([]);
    setHasError(false);
    
    try {
      // 既存のストーリーデータを取得
      const existingStoryData = JSON.parse(localStorage.getItem('storyData') || '{}');
      
      if (!existingStoryData.genre || !existingStoryData.tone || !existingStoryData.feeling || !existingStoryData.story) {
        throw new Error('ストーリーデータが不足しています');
      }
      
      // 語彙レベル変更（同一内容でパラフレーズ）のためのパラメータ
      const originalParams = {
        genre: existingStoryData.genre,
        tone: existingStoryData.tone,
        feeling: existingStoryData.feeling,
        existingStory: existingStoryData.story,
        existingThemes: existingStoryData.themes || []
      };
      
      // regenerate-content API を使用（同一内容で語彙レベルのみ変更）
      const response = await fetch('/api/regenerate-content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // キャッシュを無効化するヘッダー
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          contentType: 'story',
          newLevel: effectiveLevel,
          originalParams: originalParams
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ ストーリー語彙レベル変更エラー:', errorData);
        throw new Error(errorData.error || 'ストーリーの語彙レベル変更に失敗しました');
      }
      
      const data = await response.json();
      console.log('✅ ストーリー語彙レベル変更完了:', { hasStory: !!data.story, hasThemes: !!data.themes, level: effectiveLevel });
      
      // 同一内容・新語彙レベルのストーリーデータを更新
      const updatedStoryData = {
        ...existingStoryData,
        story: data.story,
        themes: data.themes || existingStoryData.themes || [],
        level: effectiveLevel,
        paraphrasedAt: new Date().toISOString() // 語彙レベル変更の記録
      };
      
      localStorage.setItem('storyData', JSON.stringify(updatedStoryData));
      setStoryData(updatedStoryData);
      
      // 表示コンテンツを更新（同じストーリー、新しい語彙レベル）
      setEnglish(data.story || '');
      setJapanese(''); // ストーリーモードでは日本語訳なし
      
      // 段落分割
      const engParagraphs = (data.story || '').split('\n\n').filter((p: string) => p.trim().length > 0);
      setEnglishParagraphs(engParagraphs);
      setJapaneseParagraphs([]);
      
      // 語数カウント
      const words = (data.story || '').split(/\s+/).filter(word => word.trim().length > 0);
      setWordCount(words.length);
      
      // 読書状態と翻訳状態をリセット
      setIsReadingStarted(false);
      setStartTime(null);
      setEndTime(null);
      setWpm(null);
      setShowJapanese(false);
      
      console.log('✅ ストーリー語彙レベル変更とステート初期化完了');
      
    } catch (error) {
      console.error('❌ ストーリー語彙レベル変更エラー:', error);
      setEnglish('ストーリーの語彙レベル変更に失敗しました。しばらく待ってから再試行してください。');
      setHasError(true);
    } finally {
      // アニメーションを最低3秒表示してから完了
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    }
  };

  // レベル変更処理（読了後のみ許可）
  const handleLevelChange = () => {
    setShowLevelSelection(true);
  };

  // 🔧 修正④: 「もう一度読む」ボタン表示状態
  const [readAgainAvailable, setReadAgainAvailable] = useState(false);
  
  // 🔧 修正④: localStorage保存状態チェック用ヘルパー関数（リアルタイム更新対応）
  const hasLastReadingData = (): boolean => {
    try {
      const storageKey = isStoryMode ? 'lastStory' : 'lastReading';
      const savedData = localStorage.getItem(storageKey);
      
      if (!savedData) {
        console.log('❌ 【null チェック】', storageKey, 'が null です');
        return false;
      }
      
      const parsedData = JSON.parse(savedData);
      
      // 最低限のデータ構造チェック
      const hasValidData = parsedData && 
        (parsedData.english || parsedData.content) && 
        (parsedData.topic || parsedData.title);
      
      console.log('✅ 【null チェック】', storageKey, 'データ有効性:', hasValidData);
      return hasValidData;
    } catch (error) {
      console.error('❌ 【null チェック】パースエラー:', error);
      return false;
    }
  };
  
  // 🔧 修正④: lastReading状態チェックをuseEffectに分離（同期タイミングのズレ防止）
  useEffect(() => {
    const checkLastReadingAvailability = () => {
      const storageKey = isStoryMode ? 'lastStory' : 'lastReading';
      const savedData = localStorage.getItem(storageKey);
      
      // lastReading === null のときのみ非表示
      const isAvailable = savedData !== null;
      setReadAgainAvailable(isAvailable);
      
      console.log('🔄 【修正④】lastReading状態チェック:', {
        storageKey,
        isNull: savedData === null,
        isAvailable,
        dataLength: savedData?.length || 0
      });
    };
    
    // 初回チェック
    checkLastReadingAvailability();
    
    // localStorage変更監視（同期タイミングのズレ防止）
    const interval = setInterval(checkLastReadingAvailability, 300);
    
    return () => clearInterval(interval);
  }, []); // 依存関係を最小化（マウント時のみ）
  
  // 🔧 修正④: 主要データ変更時の追加チェック
  useEffect(() => {
    if (english && japanese) {
      // データが設定された時点で再チェック
      const storageKey = isStoryMode ? 'lastStory' : 'lastReading';
      const savedData = localStorage.getItem(storageKey);
      setReadAgainAvailable(savedData !== null);
    }
  }, [english, japanese, isStoryMode]);

  // 📮 手紙・メール確認関数
  const checkForAvailableLetter = (): { hasLetter: boolean; letterType: 'letter' | 'mail' | null; catName: string } => {
    const letter = getLetterFromStorage();
    const catName = localStorage.getItem('catName') || 'あなたのネコ';
    
    if (letter) {
      return {
        hasLetter: true,
        letterType: letter.type as 'letter' | 'mail',
        catName
      };
    }
    
    return {
      hasLetter: false,
      letterType: null,
      catName
    };
  };

  // 新しい難易度を選択（読了後の再読み用）
  const handleNewDifficultySelect = async (difficulty: string) => {
    // ③ 「読み直す」「レベル変更」などのイベントでは以下を実行：
    localStorage.removeItem('readingContent');
    // 🔧 修正①: hasLoadedOnce.current = false を削除して二重実行を防止
    // hasLoadedOnce.current = false; // ← 削除: 重複実行の原因
    localStorage.removeItem('readingSaved');
    localStorage.removeItem('currentReadingData');
    
    // 選択された難易度を保存
    localStorage.setItem('selectedDifficulty', difficulty);
    setShowLevelSelection(false);
    
    // 効果的レベルを計算して状態を更新
    const newEffectiveLevel = getLevelFromDifficulty(difficulty);
    console.log('🔄 難易度変更による再生成:', { difficulty, effectiveLevel: newEffectiveLevel });
    
    // effectiveLevel状態を更新（これによりuseEffectがトリガーされる）
    setEffectiveLevel(newEffectiveLevel);
  };

  // 新しいレベルを選択（後方互換性のため残す）
  const handleNewLevelSelect = async (newLevel: number) => {
    // レベルから難易度に変換して保存
    const difficulty = getDifficultyFromLevel(newLevel);
    await handleNewDifficultySelect(difficulty);
    
    setLoading(true);
    
    try {
      // 現在のURLパラメータから type を確認し、読み物とストーリーを明確に分離
      const urlParams = new URLSearchParams(window.location.search);
      const currentType = urlParams.get('type');
      const isCurrentlyReading = currentType !== 'story';
      
      let originalParams = {};
      
      if (!isCurrentlyReading && (isStoryMode || currentType === 'story')) {
        // ストーリーモードの場合：既存のストーリー内容も送信
        const storyData = JSON.parse(localStorage.getItem('storyData') || '{}');
        originalParams = {
          genre: storyData.genre,
          tone: storyData.tone,
          feeling: storyData.feeling,
          // 🔑 重要：既存のストーリー内容を含める
          existingStory: storyData.story || english, // 既存のストーリー本文
          existingThemes: storyData.themes || []
        };
      } else {
        // 読み物モードの場合：現在のURLパラメータまたはlocalStorageから読み物情報を取得
        const theme = urlParams.get('topic') || localStorage.getItem('theme') || '';
        const emotion = urlParams.get('emotion') || '';
        const style = urlParams.get('style') || localStorage.getItem('style') || '';
        
        originalParams = {
          theme,
          emotion,
          style,
          // 🔑 重要：既存の読み物内容を含める
          existingEnglish: english, // 既存の英語本文
          existingJapanese: japanese // 既存の日本語本文
        };
      }

      console.log('🔄 レベル変更による再生成開始:', { newLevel, contentType: isCurrentlyReading ? 'reading' : 'story', originalParams });

      // 既存コンテンツの語彙レベル調整（パラフレーズ）
      const response = await fetch('/api/regenerate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: isCurrentlyReading ? 'reading' : 'story',
          newLevel,
          originalParams
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'コンテンツの再生成に失敗しました');
      }

      const data = await response.json();
      console.log('✅ レベル変更完了:', data);

      if (isStoryMode || currentType === 'story') {
        // ストーリーデータを更新
        const existingStoryData = JSON.parse(localStorage.getItem('storyData') || '{}');
        const updatedStoryData = {
          ...existingStoryData,
          story: data.story,
          themes: data.themes,
          level: newLevel,
          regeneratedAt: new Date().toISOString()
        };
        localStorage.setItem('storyData', JSON.stringify(updatedStoryData));
        
        setStoryData(updatedStoryData);
        setEnglish(data.story);
        setHasError(false); // エラー状態をリセット
        
        // 段落分割（構造タグを除去してから分割）
        let storyText = data.story;
        
        // 構造見出しを除去
        storyText = storyText
          .replace(/<h[1-6]>[^<]*(?:Setup|Inciting Incident|Rising Action|Climax|Resolution)[^<]*<\/h[1-6]>/gi, '')
          .replace(/### (?:Setup|Inciting Incident|Rising Action|Climax|Resolution)/gi, '')
          .replace(/\*\*(?:Setup|Inciting Incident|Rising Action|Climax|Resolution)\*\*/gi, '');
        
        // HTMLが含まれている場合は、pタグベースで分割
        if (storyText.includes('<p>')) {
          const engParagraphs = storyText
            .split(/<\/p>\s*<p>/)
            .map((p: string) => p.replace(/<\/?p>/g, '').replace(/<[^>]*>/g, '').trim())
            .filter((p: string) => p.length > 20); // 短すぎる段落は除外
          setEnglishParagraphs(engParagraphs);
        } else {
          // プレーンテキストの場合は改行ベースで分割
          const engParagraphs = storyText
            .split(/\n\n+/)
            .map((p: string) => p.replace(/<[^>]*>/g, '').trim())
            .filter((p: string) => p.length > 20 && !p.match(/(?:Setup|Inciting Incident|Rising Action|Climax|Resolution)/i));
          setEnglishParagraphs(engParagraphs);
        }
        
        // 語数カウント
        const words = data.story.trim().split(/\s+/).filter((word: string) => word.length > 0);
        setWordCount(words.length);
      } else {
        // 読み物データを更新
        setEnglish(data.english);
        setJapanese(data.japanese || '');
        setHasError(false); // エラー状態をリセット
        
        // 段落分割
        const engParagraphs = data.english.split('\n\n').filter((p: string) => p.trim().length > 0);
        const jpParagraphs = data.japanese ? data.japanese.split('\n\n').filter((p: string) => p.trim().length > 0) : [];
        setEnglishParagraphs(engParagraphs);
        setJapaneseParagraphs(jpParagraphs);
        
        // 語数カウント
        const words = data.english.trim().split(/\s+/).filter((word: string) => word.length > 0);
        setWordCount(words.length);
      }

      // 現在のレベルを更新
      setCurrentLevel(newLevel);
      
      // 読書状態をリセット
      setStartTime(null);
      setEndTime(null);
      setWpm(null);
      setIsReadingStarted(false);
      setShowTranslationButton(false);
      setShowJapanese(false);
      setSelectedWord(null);
      setWordInfo(null);
      setSessionWords([]);
      setHasError(false);

    } catch (err) {
      console.error('❌ レベル変更エラー:', err);
      setEnglish('レベル変更中にエラーが発生しました。ページを再読み込みしてお試しください。');
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };


  // WPM履歴の保存と平均計算
  const saveWPMHistory = (wpm: number) => {
    const wpmHistory = JSON.parse(localStorage.getItem('wpmHistory') || '[]');
    wpmHistory.push(wpm);
    // 直近5回分のみ保持
    if (wpmHistory.length > 5) {
      wpmHistory.shift();
    }
    localStorage.setItem('wpmHistory', JSON.stringify(wpmHistory));
  };

  const getAverageWPM = (): number => {
    const wpmHistory = JSON.parse(localStorage.getItem('wpmHistory') || '[]');
    if (wpmHistory.length === 0) return 0;
    const sum = wpmHistory.reduce((acc: number, wpm: number) => acc + wpm, 0);
    return Math.round(sum / wpmHistory.length);
  };

  // 読了処理とWPM計算
  const handleFinishReading = () => {
    console.log('🔄 Finish button clicked', { startTime, wordCount, hasError, isStoryMode });
    
    if (wordCount > 0) {
      let effectiveStartTime = startTime;
      
      // ストーリーモードで開始時間が設定されていない場合は、仮の開始時間を使用
      if (!startTime && isStoryMode) {
        effectiveStartTime = Date.now() - 60000; // 1分前を仮の開始時間として設定
        setStartTime(effectiveStartTime);
        console.log('⚠️ Story mode: Using default start time');
      }
      
      if (effectiveStartTime) {
        const currentTime = Date.now();
        setEndTime(currentTime);
        const timeInMinutes = (currentTime - effectiveStartTime) / (1000 * 60);
        const calculatedWPM = Math.round(wordCount / timeInMinutes);
        setWpm(calculatedWPM);
        
        // WPM履歴を保存
        saveWPMHistory(calculatedWPM);
        
        console.log('✅ Finish reading completed with WPM', { 
          wpm: calculatedWPM, 
          hasError,
          isStoryMode 
        });
        
        // 読書履歴をローカルストレージに保存（ストーリーモードも含む）
        saveReadingHistory(calculatedWPM, currentTime);
      } else {
        // 時間測定なしの場合
        setWpm(0);
        console.log('✅ Finish reading completed without WPM', { 
          hasError,
          isStoryMode 
        });
      }
      
      // いずれにしても日本語訳ボタンを表示し、エラー状態をリセット
      setShowTranslationButton(true);
      setHasError(false);
      
      // 🔧 修正: 語数の重複更新を防止
      // saveReadingHistory() → saveToHistory() で既に wordCount が更新されるため
      // ここでの手動更新は削除（重複を防ぐ）
      console.log('📊 Word count will be updated by saveToHistory() through saveReadingHistory()', { 
        wordsRead: wordCount
      });
      
    } else {
      console.log('❌ Finish reading failed: wordCount is 0');
    }
  };


  // 基本的な品詞推定関数（英語表記）
  const detectBasicPos = (word: string): string => {
    const cleanWord = word.toLowerCase();
    
    // 副詞の接尾辞
    if (cleanWord.endsWith('ly')) return 'adverb';
    if (cleanWord.endsWith('ward') || cleanWord.endsWith('wise')) return 'adverb';
    
    // 形容詞の接尾辞
    if (cleanWord.endsWith('ful') || cleanWord.endsWith('less') || cleanWord.endsWith('able') || 
        cleanWord.endsWith('ible') || cleanWord.endsWith('ous') || cleanWord.endsWith('ive') ||
        cleanWord.endsWith('al') || cleanWord.endsWith('ic') || cleanWord.endsWith('ed') ||
        cleanWord.endsWith('ing')) {
      // -ing, -ed は文脈によって動詞/形容詞が変わるので詳細チェック
      if (cleanWord.endsWith('ing') || cleanWord.endsWith('ed')) {
        return 'adjective/participle';
      }
      return 'adjective';
    }
    
    // 名詞の接尾辞
    if (cleanWord.endsWith('tion') || cleanWord.endsWith('sion') || cleanWord.endsWith('ment') ||
        cleanWord.endsWith('ness') || cleanWord.endsWith('ity') || cleanWord.endsWith('er') ||
        cleanWord.endsWith('or') || cleanWord.endsWith('ist') || cleanWord.endsWith('ism')) return 'noun';
    
    // 動詞の基本形やよくあるパターン
    if (cleanWord.endsWith('ate') || cleanWord.endsWith('ize') || cleanWord.endsWith('ify')) return 'verb';
    
    // 一般的な単語の品詞辞書
    const commonPOS: { [key: string]: string } = {
      // 基本動詞
      'be': 'verb', 'have': 'verb', 'do': 'verb', 'say': 'verb', 'get': 'verb', 'make': 'verb', 'go': 'verb',
      'know': 'verb', 'take': 'verb', 'see': 'verb', 'come': 'verb', 'think': 'verb', 'look': 'verb', 'want': 'verb',
      'give': 'verb', 'use': 'verb', 'find': 'verb', 'tell': 'verb', 'ask': 'verb', 'work': 'verb', 'seem': 'verb',
      'feel': 'verb', 'try': 'verb', 'leave': 'verb', 'call': 'verb', 'terminate': 'verb', 'establish': 'verb',
      
      // 基本名詞
      'time': 'noun', 'person': 'noun', 'year': 'noun', 'way': 'noun', 'day': 'noun', 'thing': 'noun', 'man': 'noun',
      'world': 'noun', 'life': 'noun', 'hand': 'noun', 'part': 'noun', 'child': 'noun', 'eye': 'noun', 'woman': 'noun',
      'place': 'noun', 'week': 'noun', 'case': 'noun', 'point': 'noun', 'government': 'noun',
      
      // 基本形容詞
      'good': 'adjective', 'new': 'adjective', 'first': 'adjective', 'last': 'adjective', 'long': 'adjective',
      'great': 'adjective', 'little': 'adjective', 'own': 'adjective', 'old': 'adjective', 'right': 'adjective',
      'big': 'adjective', 'high': 'adjective', 'different': 'adjective', 'small': 'adjective', 'large': 'adjective',
      'sophisticated': 'adjective', 'important': 'adjective', 'beautiful': 'adjective',
      
      // 基本副詞
      'well': 'adverb', 'also': 'adverb', 'back': 'adverb', 'only': 'adverb', 'very': 'adverb', 'still': 'adverb',
      'even': 'adverb', 'now': 'adverb', 'just': 'adverb', 'here': 'adverb', 'how': 'adverb',
      'carefully': 'adverb', 'quickly': 'adverb', 'slowly': 'adverb'
    };
    
    if (commonPOS[cleanWord]) {
      return commonPOS[cleanWord];
    }
    
    return 'word'; // デフォルト
  };

  // 単語の語形解析関数（改善版）
  const analyzeWordForm = (word: string): { 
    headword: string; // 見出し語
    baseForm: string; // 原形
    detailedPos: string; // 品詞情報
    isParticiple: boolean; // 分詞かどうか
  } => {
    const cleanWord = word.toLowerCase();
    
    // 詳細な単語分類辞書
    const detailedWordDict: { [key: string]: { base: string; pos: string; isParticiple?: boolean; altPos?: string } } = {
      // 不規則動詞の過去形・過去分詞（形容詞用法も併記）
      'confused': { base: 'confuse', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'proved': { base: 'prove', pos: '動詞（過去形）' },
      'proven': { base: 'prove', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'written': { base: 'write', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'taken': { base: 'take', pos: '動詞（過去分詞）', isParticiple: true },
      'given': { base: 'give', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'broken': { base: 'break', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'spoken': { base: 'speak', pos: '動詞（過去分詞）', isParticiple: true },
      'chosen': { base: 'choose', pos: '動詞（過去分詞）', isParticiple: true },
      'frozen': { base: 'freeze', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'excited': { base: 'excite', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'interested': { base: 'interest', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'surprised': { base: 'surprise', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'tired': { base: 'tire', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      'worried': { base: 'worry', pos: '動詞（過去分詞）', isParticiple: true, altPos: '形容詞' },
      
      // 現在分詞（形容詞用法も併記）
      'proving': { base: 'prove', pos: '動詞（現在分詞）', isParticiple: true },
      'confusing': { base: 'confuse', pos: '動詞（現在分詞）', isParticiple: true, altPos: '形容詞' },
      'writing': { base: 'write', pos: '動詞（現在分詞）', isParticiple: true },
      'taking': { base: 'take', pos: '動詞（現在分詞）', isParticiple: true },
      'giving': { base: 'give', pos: '動詞（現在分詞）', isParticiple: true },
      'breaking': { base: 'break', pos: '動詞（現在分詞）', isParticiple: true },
      'speaking': { base: 'speak', pos: '動詞（現在分詞）', isParticiple: true },
      'choosing': { base: 'choose', pos: '動詞（現在分詞）', isParticiple: true },
      'freezing': { base: 'freeze', pos: '動詞（現在分詞）', isParticiple: true, altPos: '形容詞' },
      'exciting': { base: 'excite', pos: '動詞（現在分詞）', isParticiple: true, altPos: '形容詞' },
      'interesting': { base: 'interest', pos: '動詞（現在分詞）', isParticiple: true, altPos: '形容詞' },
      'surprising': { base: 'surprise', pos: '動詞（現在分詞）', isParticiple: true, altPos: '形容詞' },
      'tiring': { base: 'tire', pos: '動詞（現在分詞）', isParticiple: true, altPos: '形容詞' },
      'worrying': { base: 'worry', pos: '動詞（現在分詞）', isParticiple: true, altPos: '形容詞' },
      
      // 形容詞（比較級・最上級）
      'better': { base: 'good', pos: '形容詞（比較級）' },
      'best': { base: 'good', pos: '形容詞（最上級）' },
      'worse': { base: 'bad', pos: '形容詞（比較級）' },
      'worst': { base: 'bad', pos: '形容詞（最上級）' },
      'larger': { base: 'large', pos: '形容詞（比較級）' },
      'largest': { base: 'large', pos: '形容詞（最上級）' },
      'smaller': { base: 'small', pos: '形容詞（比較級）' },
      'smallest': { base: 'small', pos: '形容詞（最上級）' },
      'older': { base: 'old', pos: '形容詞（比較級）' },
      'oldest': { base: 'old', pos: '形容詞（最上級）' },
      'younger': { base: 'young', pos: '形容詞（比較級）' },
      'youngest': { base: 'young', pos: '形容詞（最上級）' },
      
      // 名詞（複数形）
      'children': { base: 'child', pos: '名詞（複数）' },
      'people': { base: 'person', pos: '名詞（複数）' },
      'men': { base: 'man', pos: '名詞（複数）' },
      'women': { base: 'woman', pos: '名詞（複数）' },
      'feet': { base: 'foot', pos: '名詞（複数）' },
      'teeth': { base: 'tooth', pos: '名詞（複数）' },
      'mice': { base: 'mouse', pos: '名詞（複数）' },
      'geese': { base: 'goose', pos: '名詞（複数）' },
      
      // 副詞
      'quickly': { base: 'quick', pos: '副詞' },
      'carefully': { base: 'careful', pos: '副詞' },
      'happily': { base: 'happy', pos: '副詞' },
      'easily': { base: 'easy', pos: '副詞' },
      'really': { base: 'real', pos: '副詞' },
      'finally': { base: 'final', pos: '副詞' },
      'usually': { base: 'usual', pos: '副詞' },
      'probably': { base: 'probable', pos: '副詞' },
      'especially': { base: 'especial', pos: '副詞' },
      'certainly': { base: 'certain', pos: '副詞' },
      'definitely': { base: 'definite', pos: '副詞' },
      
      // 純粋な形容詞
      'beautiful': { base: 'beautiful', pos: '形容詞' },
      'wonderful': { base: 'wonderful', pos: '形容詞' },
      'careful': { base: 'careful', pos: '形容詞' },
      'helpful': { base: 'helpful', pos: '形容詞' },
      'useful': { base: 'useful', pos: '形容詞' },
      'powerful': { base: 'powerful', pos: '形容詞' },
      'successful': { base: 'successful', pos: '形容詞' }
    };
    
    // 詳細辞書をチェック
    if (detailedWordDict[cleanWord]) {
      const { base, pos, isParticiple, altPos } = detailedWordDict[cleanWord];
      // 主たる品詞のみ表示（複数ある場合は最初の品詞を優先）
      const finalPos = altPos && pos.includes('分詞') ? altPos : pos;
      return {
        headword: isParticiple ? cleanWord : base, // 分詞はそのまま、そうでなければ原形
        baseForm: base,
        detailedPos: finalPos,
        isParticiple: isParticiple || false
      };
    }
    
    // 規則変化のパターンマッチング
    const patterns = [
      // 動詞の過去形・過去分詞 (-ed)
      { 
        pattern: /(.+)ed$/, 
        getBase: (match: RegExpMatchArray) => {
          const stem = match[1];
          // 二重子音の場合（stopped -> stop）
          if (stem.length >= 3 && stem[stem.length-1] === stem[stem.length-2] && 
              !/[aeiou]/.test(stem[stem.length-1])) {
            return stem.slice(0, -1);
          }
          // -ied -> -y (studied -> study)
          if (stem.endsWith('i')) {
            return stem.slice(0, -1) + 'y';
          }
          return stem;
        },
        pos: '動詞（過去形/過去分詞）',
        isParticiple: true
      },
      // 動詞の現在分詞 (-ing)
      { 
        pattern: /(.+)ing$/, 
        getBase: (match: RegExpMatchArray) => {
          const stem = match[1];
          // 二重子音の場合（running -> run）
          if (stem.length >= 2 && stem[stem.length-1] === stem[stem.length-2] && 
              !/[aeiou]/.test(stem[stem.length-1])) {
            return stem.slice(0, -1);
          }
          // -ying -> -ie (lying -> lie)
          if (stem.endsWith('y')) {
            return stem.slice(0, -1) + 'ie';
          }
          // -cing -> -ce (dancing -> dance)
          if (stem.endsWith('c')) {
            return stem + 'e';
          }
          // 一般的な場合
          return stem + 'e';
        },
        pos: '動詞（現在分詞）',
        isParticiple: true
      },
      // 動詞の三人称単数 (-s)
      { 
        pattern: /(.+)s$/, 
        getBase: (match: RegExpMatchArray) => {
          const stem = match[1];
          if (stem.endsWith('ie')) return stem.slice(0, -2) + 'y';
          if (stem.endsWith('ch') || stem.endsWith('sh') || stem.endsWith('s') || stem.endsWith('z')) {
            return stem;
          }
          return stem;
        },
        pos: '動詞（三人称単数）',
        isParticiple: false
      }
    ];
    
    for (const { pattern, getBase, pos, isParticiple } of patterns) {
      const match = cleanWord.match(pattern);
      if (match) {
        const baseForm = getBase(match);
        if (baseForm.length >= 2) {
          return {
            headword: isParticiple ? cleanWord : baseForm, // 分詞はそのまま
            baseForm: baseForm,
            detailedPos: pos,
            isParticiple
          };
        }
      }
    }
    
    // パターンにマッチしない場合は品詞を推定
    const defaultPos = detectBasicPos(cleanWord);
    return { 
      headword: cleanWord, 
      baseForm: cleanWord, 
      detailedPos: defaultPos,
      isParticiple: false
    };
  };

  // 文脈情報を取得する関数
  const getWordContext = (word: string): string => {
    // 現在表示されている英語テキストから、その単語を含む文を探す
    const allParagraphs = englishParagraphs.join(' ');
    const sentences = allParagraphs.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(word.toLowerCase())) {
        return sentence.trim();
      }
    }
    return '';
  };



  // ✅ 改善された辞書データ取得関数（語義選択とコンテキスト分析）
  const getWordData = async (word: string, contextSentence?: string) => {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    const data = await response.json();

    const entry = data?.[0];
    if (!entry?.meanings || entry.meanings.length === 0) {
      throw new Error('No meanings found');
    }

    // 専門用語を識別するキーワード
    const specializedTerms = [
      'music', 'musical', 'mathematics', 'mathematical', 'physics', 'chemistry',
      'biology', 'anatomy', 'medicine', 'medical', 'legal', 'law', 'computing',
      'computer science', 'technical', 'scientific', 'archaic', 'obsolete'
    ];

    // 語義と品詞の組み合わせを評価してスコア付け
    const meaningCandidates = [];
    
    for (const meaning of entry.meanings) {
      const partOfSpeech = meaning.partOfSpeech;
      
      for (let i = 0; i < meaning.definitions.length; i++) {
        const definition = meaning.definitions[i];
        let score = 100 - i * 10; // 辞書順序による基本スコア

        // 専門用語検出による減点
        const defText = definition.definition.toLowerCase();
        const hasSpecializedTerm = specializedTerms.some(term => 
          defText.includes(term) || (definition.example && definition.example.toLowerCase().includes(term))
        );
        if (hasSpecializedTerm) {
          score -= 50;
        }

        // 短すぎる定義の減点
        if (definition.definition.length < 20) {
          score -= 20;
        }

        // 例文がある場合は加点
        if (definition.example && definition.example.trim().length > 10) {
          score += 15;
        }

        // コンテキストとの一致度評価
        if (contextSentence) {
          const contextWords = contextSentence.toLowerCase().split(/\s+/);
          const defWords = definition.definition.toLowerCase().split(/\s+/);
          const commonWords = contextWords.filter(word => defWords.includes(word));
          score += commonWords.length * 5;
        }

        meaningCandidates.push({
          partOfSpeech,
          definition: definition.definition,
          example: definition.example || '',
          score
        });
      }
    }

    // スコア順でソート（高い順）
    meaningCandidates.sort((a, b) => b.score - a.score);
    const bestCandidate = meaningCandidates[0];

    console.log(`📊 ${word}の語義選択結果:`, {
      selected: bestCandidate.definition.substring(0, 50) + '...',
      score: bestCandidate.score,
      pos: bestCandidate.partOfSpeech
    });

    return {
      word,
      pos: bestCandidate.partOfSpeech,
      meaning_en: bestCandidate.definition,
      example_en: bestCandidate.example,
    };
  };

  // コンテキストを考慮した例文生成関数
  const generateContextualExample = async (word: string, partOfSpeech: string, level: string = 'B1', context?: string): Promise<{ exampleEnglish: string; exampleJapanese: string }> => {
    try {
      const response = await fetch('/api/generate-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word,
          partOfSpeech: partOfSpeech,
          level: level,
          context: context // コンテキストも送信
        })
      });

      if (!response.ok) {
        throw new Error('例文生成の取得に失敗しました');
      }

      const data = await response.json();
      return {
        exampleEnglish: data.exampleEnglish || `This is an example with "${word}".`,
        exampleJapanese: data.exampleJapanese || `これは「${word}」を使った例文です。`
      };
    } catch (error) {
      console.error('コンテキスト例文生成エラー:', error);
      return {
        exampleEnglish: `This is an example with "${word}".`,
        exampleJapanese: `これは「${word}」を使った例文です。`
      };
    }
  };

  // 語彙レベルに応じた例文生成関数
  const generateLevelAppropriateExample = async (word: string, partOfSpeech: string, level: string = 'B1'): Promise<{ exampleEnglish: string; exampleJapanese: string }> => {
    try {
      const response = await fetch('/api/generate-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word,
          partOfSpeech: partOfSpeech,
          level: level
        })
      });

      if (!response.ok) {
        throw new Error('例文生成の取得に失敗しました');
      }

      const data = await response.json();
      return {
        exampleEnglish: data.exampleEnglish || `This is an example with "${word}".`,
        exampleJapanese: data.exampleJapanese || `これは「${word}」を使った例文です。`
      };
    } catch (error) {
      console.error('例文生成エラー:', error);
      return {
        exampleEnglish: `This is an example with "${word}".`,
        exampleJapanese: `これは「${word}」を使った例文です。`
      };
    }
  };

  // 翻訳取得関数（OpenAI API使用）
  const translateToJapanese = async (text: string): Promise<string> => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          targetLanguage: 'Japanese'
        })
      });

      if (!response.ok) {
        throw new Error('翻訳の取得に失敗しました');
      }

      const data = await response.json();
      return data.translation || text; // 翻訳失敗時は元のテキストを返す
    } catch (error) {
      console.error('翻訳エラー:', error);
      return text; // エラー時は元のテキストを返す
    }
  };

  // 単語情報取得関数（文脈ベース分析使用）
  const fetchWordInfo = async (originalWord: string, clickedWord: string, detailedPos: string): Promise<WordInfo> => {
    try {
      console.log('🔍 文脈ベース語義分析開始:', originalWord);
      
      // コンテキスト情報を取得
      const contextSentence = getWordContext(originalWord);
      console.log('📄 コンテキスト文:', contextSentence);
      
      // 文脈ベース分析APIを使用
      let contextAnalysis = null;
      if (contextSentence && contextSentence.trim().length > 10) {
        try {
          const response = await fetch('/api/context-word-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              word: originalWord,
              contextSentence: contextSentence,
              outputLanguage: displayLanguage === 'ja' ? 'japanese' : 'english'
            })
          });
          
          if (response.ok) {
            contextAnalysis = await response.json();
            console.log('✅ 文脈分析結果:', contextAnalysis);
          }
        } catch (error) {
          console.error('文脈分析エラー:', error);
        }
      }
      
      // フォールバック: Free Dictionary API使用
      const wordData = contextAnalysis || await getWordData(originalWord, contextSentence);
      console.log('📥 最終単語データ:', wordData);
      
      // 文脈分析結果がある場合の処理（新JSON形式対応）
      if (contextAnalysis && (contextAnalysis.meaning_en || contextAnalysis.meaning_ja)) {
        let exampleEn = contextAnalysis.example_en || contextSentence;
        let exampleJa = contextAnalysis.example_ja;
        
        // 日本語例文がない場合は翻訳
        if (!exampleJa || exampleJa.trim() === '' || exampleJa === 'Translation not available') {
          try {
            exampleJa = await translateToJapanese(exampleEn);
          } catch (error) {
            console.error('例文翻訳エラー:', error);
            exampleJa = null;
          }
        }
        
        return {
          word: contextAnalysis.word || originalWord,
          baseForm: contextAnalysis.base,
          originalForm: clickedWord,
          partOfSpeech: contextAnalysis.pos,
          detailedPos: contextAnalysis.pos,
          pos: contextAnalysis.pos,
          meaning: contextAnalysis.meaning_en || contextAnalysis.meaning_ja,
          japaneseMeaning: contextAnalysis.meaning_ja,
          sentence: exampleEn,
          sentenceJapanese: exampleJa,
          paraphrase: undefined,
          englishDefinition: contextAnalysis.meaning_en,
          japaneseDefinition: contextAnalysis.meaning_ja,
          englishExample: exampleEn,
          japaneseExample: exampleJa,
          meaning_en: contextAnalysis.meaning_en,
          meaning_ja: contextAnalysis.meaning_ja,
          example_en: exampleEn,
          example_ja: exampleJa,
          paraphrase_en: undefined,
          paraphrase_ja: undefined
        };
      }
      
      // フォールバック処理: Free Dictionary API結果の処理
      if (wordData.meaning_en || wordData.meaning) {
        // 例文が辞書になければ、語彙レベルに応じた例文を生成
        let exampleEn = wordData.example_en || wordData.exampleEnglish;
        let exampleJa = '';
        
        if (!exampleEn || exampleEn.trim() === '') {
          console.log('🔄 辞書に例文がないため、コンテキストを考慮した例文を生成中...');
          const userLevel = localStorage.getItem('level') || localStorage.getItem('vocabularyLevel') || '7';
          const cefrLevel = getCEFRLevel(parseInt(userLevel));
          
          const generatedExample = await generateContextualExample(originalWord, wordData.pos || wordData.partOfSpeech, cefrLevel, contextSentence);
          exampleEn = generatedExample.exampleEnglish;
          exampleJa = generatedExample.exampleJapanese;
          console.log('✅ 生成された例文:', { exampleEn, exampleJa });
        } else {
          // 辞書の例文があるが日本語訳が必要な場合
          try {
            exampleJa = await translateToJapanese(exampleEn);
            console.log('🌸 例文翻訳完了:', exampleJa);
          } catch (error) {
            console.error('例文翻訳エラー:', error);
            exampleJa = null; // 翻訳失敗時は非表示
          }
        }
        
        // 英語の意味を即座に日本語に翻訳
        let japaneseMeaning = undefined;
        try {
          if (wordData.meaning_en && wordData.meaning_en !== 'データを取得できませんでした') {
            japaneseMeaning = await translateToJapanese(wordData.meaning_en);
            console.log(`🌸 即座翻訳完了: ${originalWord} -> ${japaneseMeaning}`);
          }
        } catch (error) {
          console.error('即座翻訳エラー:', error);
        }

        return {
          word: originalWord,
          originalForm: clickedWord,
          partOfSpeech: wordData.pos,
          detailedPos: wordData.pos,
          pos: wordData.pos, // 英語品詞を設定
          meaning: wordData.meaning_en, // 英語の定義
          japaneseMeaning: japaneseMeaning || wordData.meaning_en, // 翻訳済みまたは英語
          sentence: exampleEn,
          sentenceJapanese: exampleJa,
          paraphrase: undefined,
          englishDefinition: wordData.meaning_en, // 英語版を保持
          japaneseDefinition: japaneseMeaning, // 翻訳済みを設定
          englishExample: exampleEn, // 英語版を保持
          japaneseExample: exampleJa, // 翻訳時に設定
          // 新しいフィールド名でも設定
          meaning_en: wordData.meaning_en,
          meaning_ja: japaneseMeaning, // 翻訳済みを設定
          example_en: exampleEn,
          example_ja: exampleJa, // 生成された日本語例文
          paraphrase_en: undefined, // パラフレーズ取得時に設定
          paraphrase_ja: undefined // パラフレーズ翻訳時に設定
        };
      } else {
        throw new Error('No dictionary data found');
      }
      
    } catch (error) {
      console.error('Dictionary API取得エラー:', error);
      
      // フォールバック: エラーメッセージを含む基本データ
      return {
        word: originalWord,
        originalForm: clickedWord,
        partOfSpeech: 'unknown',
        detailedPos: 'unknown',
        pos: 'unknown',
        meaning: 'データを取得できませんでした',
        japaneseMeaning: 'データを取得できませんでした',
        sentence: 'データを取得できませんでした',
        sentenceJapanese: 'データを取得できませんでした',
        paraphrase: undefined,
        englishDefinition: 'データを取得できませんでした',
        japaneseDefinition: undefined,
        englishExample: 'データを取得できませんでした',
        japaneseExample: undefined,
        // 新しいフィールド名でも設定
        meaning_en: 'データを取得できませんでした',
        meaning_ja: undefined,
        example_en: 'データを取得できませんでした',
        example_ja: undefined,
        paraphrase_en: undefined,
        paraphrase_ja: undefined
      };
    }
  };

  // 言語切り替え処理
  const handleLanguageToggle = async () => {
    const newLanguage = definitionLanguage === 'ja' ? 'en' : 'ja';
    setDefinitionLanguage(newLanguage);

    // 言語切り替え時の処理（日本語・英語両方対応）
    if (sessionWords.length > 0) {
      setLoadingTranslation(true);
      
      try {
        // セッション内の単語で翻訳が必要なものを特定
        const wordsNeedingTranslation = sessionWords.filter(word => 
          !word.japaneseDefinition && !word.meaning_ja
        );

        if (wordsNeedingTranslation.length > 0) {
          // 翻訳を並列実行
          const translationPromises = wordsNeedingTranslation.map(async (word) => {
            let translatedDefinition = word.japaneseDefinition || word.meaning_ja;
            let translatedExample = word.japaneseExample || word.example_ja;

            // 意味の翻訳（英語の定義がある場合は必ず翻訳）
            if (!translatedDefinition) {
              const sourceDefinition = word.englishDefinition || word.meaning_en || word.meaning;
              if (sourceDefinition && sourceDefinition !== 'データを取得できませんでした') {
                try {
                  translatedDefinition = await translateToJapanese(sourceDefinition);
                  console.log(`✅ 意味翻訳完了: ${word.word} -> ${translatedDefinition}`);
                } catch (error) {
                  console.error('意味の翻訳エラー:', error);
                  translatedDefinition = sourceDefinition; // 英語のままフォールバック
                }
              }
            }

            // 例文の翻訳（既存の日本語例文がない場合のみ）
            if (!translatedExample && (word.englishExample || word.example_en || word.sentence)) {
              try {
                const exampleToTranslate = word.englishExample || word.example_en || word.sentence;
                // テンプレート文は翻訳しない
                if (!exampleToTranslate.includes('を使った例文') && 
                    !exampleToTranslate.includes('Example sentence with')) {
                  translatedExample = await translateToJapanese(exampleToTranslate);
                }
              } catch (error) {
                console.error('例文の翻訳エラー:', error);
                // 翻訳に失敗した場合は例文を非表示にする（nullにする）
                translatedExample = null;
              }
            }

            return {
              ...word,
              japaneseDefinition: translatedDefinition,
              japaneseExample: translatedExample,
              // 新しいフィールド名でも設定
              meaning_ja: translatedDefinition,
              example_ja: translatedExample
            };
          });

          const translatedWords = await Promise.all(translationPromises);
          
          // セッション単語リストを更新
          setSessionWords(prevWords => 
            prevWords.map(word => {
              const translatedWord = translatedWords.find(tw => tw.word === word.word);
              return translatedWord || word;
            })
          );

          // ローカルストレージも更新
          translatedWords.forEach(translatedWord => {
            saveWordToNotebook(translatedWord);
          });
        }

      } catch (error) {
        console.error('翻訳取得エラー:', error);
      } finally {
        setLoadingTranslation(false);
      }
    }
  };

  // 単語選択クリック処理
  const handleClick = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    if (!selection) return
    const word = selection.toString().trim().match(/^\b\w+\b$/)?.[0]
    if (word) showDefinition(word)
  }

  // 単語定義表示処理
  const showDefinition = async (word: string) => {
    await handleWordClick(word);
  }

  // 単語クリック処理
  const handleWordClick = async (word: string) => {
    // 句読点や記号を除去
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (cleanWord.length === 0) return;


    // 語形解析
    const { headword, baseForm, detailedPos, isParticiple } = analyzeWordForm(cleanWord);
    
    // より正確な原形を取得
    const properBaseForm = getProperBaseForm(cleanWord);
    
    // 既にノートブックに記録されている場合は処理をスキップ
    if (isWordInNotebook(headword)) {
      console.log('📝 単語は既にマイノートに記録済み、処理をスキップ:', headword);
      return;
    }
    
    setSelectedWord(headword);
    setLoadingWordInfo(true);
    
    try {
      // APIには見出し語をメインで送信（例文生成のため）
      const info = await fetchWordInfo(headword, cleanWord, detailedPos);
      // 結果の見出し語を調整
      info.word = headword; // 見出し語を設定
      // より正確な原形を使用
      if (headword !== properBaseForm && properBaseForm !== headword.toLowerCase()) {
        info.baseForm = properBaseForm; // 正確な原形を追加
      }
      info.detailedPos = detailedPos; // 品詞情報を更新
      setWordInfo(info);
      
      // ローカルストレージに保存（パラフレーズなし）
      saveWordToNotebook(info);
      
      // セッション内の単語リストに追加（重複チェック）
      setSessionWords(prev => {
        const isDuplicate = prev.some(word => word.word.toLowerCase() === info.word.toLowerCase());
        return isDuplicate ? prev : [...prev, info];
      });

    } catch (error) {
      console.error('単語情報の取得に失敗:', error);
      setWordInfo({
        word: headword,
        baseForm: headword !== baseForm ? baseForm : undefined,
        originalForm: cleanWord,
        partOfSpeech: 'error',
        detailedPos: 'エラー',
        meaning: '単語情報の取得に失敗しました',
        japaneseMeaning: '単語情報の取得に失敗しました',
        sentence: 'Please try again later.',
        sentenceJapanese: 'しばらくしてから再度お試しください。',
        paraphrase: undefined
      });
    } finally {
      setLoadingWordInfo(false);
    }
  };

  // 🔧 修正③: 単語情報をmyNotebookとclickedWordsの両方に保存する関数
  const saveWordToNotebook = (wordInfo: WordInfo) => {
    try {
      // myNotebookに保存（従来の処理）
      const existingNotebook = JSON.parse(localStorage.getItem('myNotebook') || '[]');
      let savedToMyNotebook = false;
      
      // 重複チェック（同じ単語が既に存在するかチェック）
      const isDuplicateInNotebook = existingNotebook.some(
        (item: WordInfo) => item.word.toLowerCase() === wordInfo.word.toLowerCase()
      );
      
      if (!isDuplicateInNotebook) {
        existingNotebook.push(wordInfo);
        localStorage.setItem('myNotebook', JSON.stringify(existingNotebook));
        console.log('📝 単語をmyNotebookに保存:', wordInfo.word);
        savedToMyNotebook = true;
      }
      
      // clickedWordsに保存（notebookページが読み込む主要データ）
      const existingClickedWords = JSON.parse(localStorage.getItem('clickedWords') || '[]');
      
      // 重複チェック（同じ単語が既に存在するかチェック）
      const isDuplicateInClicked = existingClickedWords.some(
        (item: WordInfo) => item.word.toLowerCase() === wordInfo.word.toLowerCase()
      );
      
      if (!isDuplicateInClicked) {
        existingClickedWords.push({
          ...wordInfo,
          timestamp: Date.now(), // 保存時刻を追加
          source: 'reading' // 保存元を記録
        });
        localStorage.setItem('clickedWords', JSON.stringify(existingClickedWords));
        console.log('📝 単語をclickedWordsに保存:', wordInfo.word);
        return true; // 保存成功
      } else if (savedToMyNotebook) {
        console.log('📝 単語はclickedWordsに既存、myNotebookにのみ保存:', wordInfo.word);
        return true; // myNotebookには新規保存
      } else {
        console.log('📝 単語は両方に既に存在:', wordInfo.word);
        return false; // 両方とも重複のため保存スキップ
      }
    } catch (error) {
      console.error('ノートブック保存エラー:', error);
      return false;
    }
  };

  // 🔧 修正③: ノートブック記録確認をmyNotebookとclickedWords両方でチェック
  const isWordInNotebook = (word: string): boolean => {
    try {
      // clickedWordsを優先チェック（notebookページが読み込む主要データ）
      const existingClickedWords = JSON.parse(localStorage.getItem('clickedWords') || '[]');
      const inClickedWords = existingClickedWords.some(
        (item: WordInfo) => item.word.toLowerCase() === word.toLowerCase()
      );
      
      // myNotebookもチェック（後方互換性）
      const existingNotebook = JSON.parse(localStorage.getItem('myNotebook') || '[]');
      const inMyNotebook = existingNotebook.some(
        (item: WordInfo) => item.word.toLowerCase() === word.toLowerCase()
      );
      
      const isRecorded = inClickedWords || inMyNotebook;
      console.log('📝 単語記録確認:', { word, inClickedWords, inMyNotebook, isRecorded });
      
      return isRecorded;
    } catch (error) {
      console.error('ノートブック確認エラー:', error);
      return false;
    }
  };


  // 単語を個別にクリック可能にする関数
  const splitWords = (text: string) =>
    text.split(/\b/).map((w, i) => (
      <span 
        key={i} 
        onClick={() => showDefinition(w)}
        className={/\w/.test(w) ? "cursor-pointer hover:bg-yellow-200 hover:rounded transition-colors" : ""}
        style={/\w/.test(w) ? { padding: '1px 2px' } : {}}
      >
        {w}
      </span>
    ))

  // HTMLを含むテキストを処理してクリック可能にする関数
  const processHTMLForClicking = (htmlContent: string) => {
    // 1. 構造見出しを完全に除去（h3タグとその内容）
    let cleanContent = htmlContent
      .replace(/<h3[^>]*>.*?<\/h3>/gi, '') // h3タグとその内容を削除
      .replace(/### .+$/gm, '') // markdown形式の見出しも削除
      .replace(/^\s*(Setup|Inciting Incident|Rising Actions|Climax|Resolution|Conclusion)\s*$/gmi, '') // 単独の構造見出し行を削除
      .replace(/\n\s*\n\s*\n/g, '\n\n') // 余分な空行を整理
      .trim();
    
    // 2. __TAG_N__ および __TEMP_TAG_N__ プレースホルダーを完全に除去
    cleanContent = cleanContent
      .replace(/__TAG_\d+__/g, '')
      .replace(/__TEMP_TAG_\d+__/g, '');
    
    // 3. 残りのHTMLタグを一時的に保護
    const tagPlaceholders: { [key: string]: string } = {};
    let counter = 0;
    
    // HTMLタグを一時的な文字列に置換（構造見出しを除く）
    cleanContent = cleanContent.replace(/<(?!h3)[^>]+>/gi, (match) => {
      const placeholder = `__TEMP_TAG_${counter}__`;
      tagPlaceholders[placeholder] = match;
      counter++;
      return placeholder;
    });
    
    // 4. テキスト部分のみを単語分割してspan化
    const parts = cleanContent.split(/\b/);
    const clickableParts = parts.map((part, index) => {
      // プレースホルダーを元のHTMLタグに復元
      if (part.startsWith('__TEMP_TAG_') && tagPlaceholders[part]) {
        return tagPlaceholders[part];
      }
      
      // 残った __TEMP_TAG_ プレースホルダーを削除
      if (part.match(/^__TEMP_TAG_\d+__$/)) {
        return '';
      }
      
      // 単語の場合はクリック可能なspanで囲む
      if (/\w/.test(part) && !part.match(/^(Setup|Inciting|Rising|Actions|Climax|Resolution|Conclusion)$/i)) {
        return `<span class="cursor-pointer hover:bg-yellow-200 hover:rounded transition-colors" style="padding: 1px 2px;" onclick="handleWordClickFromHTML('${part}')">${part}</span>`;
      }
      
      return part;
    });
    
    // 5. 最終的に残った __TEMP_TAG_ プレースホルダーを完全除去
    const finalResult = clickableParts.join('').replace(/__TEMP_TAG_\d+__/g, '');
    
    return finalResult;
  };

  // HTML内からの単語クリック処理
  const handleWordClickFromHTML = (word: string) => {
    showDefinition(word);
  };

  // グローバルに関数を登録（HTMLのonclick属性から呼び出すため）
  useEffect(() => {
    console.log('🔍 useEffect [グローバル関数登録] triggered');
    (window as any).handleWordClickFromHTML = handleWordClickFromHTML;
    return () => {
      delete (window as any).handleWordClickFromHTML;
    };
  }, []);

  // テキストから構造見出しとタグプレースホルダーを除去する関数
  const cleanTextContent = (text: string) => {
    return text
      .replace(/__TAG_\d+__/g, '') // __TAG_N__ プレースホルダーを削除
      .replace(/__TEMP_TAG_\d+__/g, '') // __TEMP_TAG_N__ プレースホルダーを削除
      .replace(/^\s*(Setup|Inciting Incident|Rising Actions|Climax|Resolution|Conclusion)\s*$/gmi, '') // 構造見出しを削除
      .replace(/### .+$/gm, '') // markdown見出しを削除
      .replace(/\n\s*\n\s*\n/g, '\n\n') // 余分な空行を整理
      .trim();
  };

  // 単語を個別にクリック可能にする関数（シンプル版）
  const renderClickableText = (text: string) => {
    const cleanedText = cleanTextContent(text);
    return splitWords(cleanedText);
  };

  // Related Themes テーマ選択処理
  const handleThemeSelection = (theme: string) => {
    console.log('🔗 関連テーマ選択:', theme);
    
    // テーマからストーリー設定を推測してストーリーフォームに遷移
    // 簡易実装：ストーリーフォームに戻って新しいストーリー生成を促す
    localStorage.setItem('selectedTheme', theme);
    window.location.href = '/story-form';
  };

  // ストーリーモード用日本語訳表示処理
  const handleStoryJapaneseToggle = async () => {
    if (showJapanese) {
      // 既に表示中の場合は隠す
      setShowJapanese(false);
      return;
    }

    // 日本語訳がない場合は翻訳を実行
    if (japaneseParagraphs.length === 0 && isStoryMode) {
      setLoadingStoryTranslation(true);
      try {
        console.log('🌸 ストーリーの日本語訳を生成中...');
        
        // 各段落を翻訳
        const translationPromises = englishParagraphs.map(async (paragraph, index) => {
          // HTMLタグと構造タグを除去してクリーンアップ
          let cleanText = paragraph
            .replace(/<[^>]*>/g, '') // HTMLタグ除去
            .replace(/Setup|Inciting Incident|Rising Action|Climax|Resolution/gi, '') // 構造用語除去
            .replace(/__TAG_\w+__/g, '') // TAG形式の除去
            .replace(/\*\*.*?\*\*/g, '') // ボールド形式の除去
            .replace(/^\s*[-*]\s*/g, '') // リスト形式の除去
            .replace(/^### .*/g, '') // 見出し行の除去
            .trim();
          
          if (cleanText.length < 20) return ''; // 短すぎるテキストはスキップ
          
          console.log(`🌸 段落${index + 1}を翻訳中:`, cleanText.substring(0, 50) + '...');
          
          return await translateToJapanese(cleanText);
        });

        const translatedParagraphs = await Promise.all(translationPromises);
        
        // 空の翻訳を除去し、英語段落と同じ数になるように調整
        const filteredTranslations = translatedParagraphs.filter(t => t && t.trim().length > 0);
        
        console.log('✅ ストーリー翻訳完了:', {
          englishParagraphs: englishParagraphs.length,
          japaneseParagraphs: filteredTranslations.length,
          translations: filteredTranslations
        });
        
        setJapaneseParagraphs(filteredTranslations);
        setJapanese(filteredTranslations.join('\n\n'));
        setShowJapanese(true);
        
      } catch (error) {
        console.error('❌ ストーリー翻訳エラー:', error);
        alert('翻訳に失敗しました。もう一度お試しください。');
      } finally {
        setLoadingStoryTranslation(false);
      }
    } else {
      // 既に日本語訳がある場合は表示切り替え
      setShowJapanese(true);
    }
  };

  // 読書履歴保存関数（改良版）
  const saveReadingHistory = (wpmValue: number, completedTime: number) => {
    // contentが存在しない場合は保存しない
    if (!english || english.trim() === '') {
      console.log('🚫 英語コンテンツが存在しないため履歴保存をスキップ');
      return;
    }

    // 一意IDを生成（Date.now + ランダム値で衝突回避）
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // タイトルの確実な取得（改善版）
    let title = '';
    if (isStoryMode) {
      // ストーリーモードの場合
      if (storyTitle && storyTitle.trim() !== '') {
        title = storyTitle; // stateから直接取得（最新の状態）
      } else {
        const storyData = JSON.parse(localStorage.getItem('storyData') || '{}');
        if (storyData.title && storyData.title.trim() !== '') {
          title = storyData.title;
        } else if (storyData.genre && storyData.feeling) {
          title = `${storyData.genre} Story - ${storyData.feeling}`; // より描写的なタイトル
        } else {
          const genre = searchParams.get('genre') || '';
          const feeling = searchParams.get('feeling') || '';
          if (genre && feeling) {
            title = `${genre} Story - ${feeling}`; // URLパラメータから生成
          } else {
            console.warn('タイトル生成失敗: ストーリー情報が不完全');
            return; // タイトルが生成できない場合は履歴保存しない
          }
        }
      }
    } else {
      // 読み物モードの場合
      title = searchParams.get('topic') || localStorage.getItem('theme') || '読み物';
    }

    // タイトルの最終検証
    if (!title || title.trim() === '') {
      console.log('🚫 タイトルが空のため履歴保存をスキップ');
      return;
    }
    
    // ストーリーモード用の追加情報を取得
    let storyModeExtras = {};
    if (isStoryMode) {
      const storyData = JSON.parse(localStorage.getItem('storyData') || '{}');
      const genre = searchParams.get('genre') || storyData.genre || '';
      const tone = searchParams.get('tone') || storyData.tone || '';
      const feeling = searchParams.get('feeling') || storyData.feeling || '';
      
      storyModeExtras = {
        isStoryMode: true,
        genre,
        tone,
        aftertaste: feeling // UIでは"aftertaste"として表示
      };
    }

    const historyItem = {
      id: uniqueId,
      title: title, // Claudeが生成したストーリータイトル
      content: english, // 英文全体
      translation: japanese, // 日本語訳
      level: Number(localStorage.getItem('level')) || effectiveLevel || 7,
      wordCount: wordCount,
      wpm: wpmValue,
      timestamp: new Date(completedTime).toISOString(),
      // 後方互換性のため残しておく
      date: new Date(completedTime).toISOString(),
      theme: title,
      subTopic: localStorage.getItem('subTopic') || '',
      style: localStorage.getItem('style') || '',
      readingTime: Math.round((completedTime - (startTime || 0)) / 1000),
      mode: isStoryMode ? 'story' : 'reading',
      ...storyModeExtras // ストーリーモード固有の情報を展開
    };

    const existingHistory = JSON.parse(localStorage.getItem('readingHistory') || '[]');
    
    // 4. ダブり保存防止：同じIDが既に存在する場合はスキップ
    const existingIndex = existingHistory.findIndex((item: any) => item.id === uniqueId);
    if (existingIndex !== -1) {
      console.log('🔄 既存履歴を更新:', uniqueId);
      existingHistory[existingIndex] = historyItem;
    } else {
      console.log('📝 新規履歴を保存:', uniqueId);
      existingHistory.push(historyItem);
    }
    
    localStorage.setItem('readingHistory', JSON.stringify(existingHistory));
    
    // 新しくストーリー/読み物を生成した場合はlastStoryに保存
    localStorage.setItem('lastStory', JSON.stringify(historyItem));
    
    console.log('✅ 履歴保存完了:', { title, mode: historyItem.mode, contentLength: english.length });
  };

  // loading状態による表示切り替え（Lottieアニメーション使用）
  if (loading) {
    return <CatLoader />;
  }

  return (
    <main className="p-4 bg-[#FFF9F4] min-h-screen">
      <h1 className="text-xl font-bold mb-4 text-[#1E1E1E]">{t('reading.title')}</h1>
      
      {/* ストーリータイトル表示 */}
      {isStoryMode && storyTitle && (
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-[#1E1E1E] italic">"{storyTitle}"</h2>
        </div>
      )}
    
      {/* メインコンテンツ */}
        {/* タイトル空の場合のフォールバック UI */}
        {isStoryMode && english && (!storyTitle || storyTitle.trim() === '') && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="text-yellow-600 mr-2">⚠️</div>
              <h3 className="text-lg font-semibold text-yellow-800">
                {displayLang === 'ja' ? 'ストーリーの生成に問題がありました' : 'Story Generation Issue'}
              </h3>
            </div>
            <p className="text-yellow-700 mb-4">
              {displayLang === 'ja' 
                ? 'タイトルが生成されませんでした。もう一度生成してみましょうか？' 
                : 'The story title was not generated properly. Would you like to try generating again?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/story-form'}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                {displayLang === 'ja' ? 'もう一度生成する' : 'Generate Again'}
              </button>
              <button
                onClick={() => window.location.href = '/choose'}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                {displayLang === 'ja' ? '選択画面に戻る' : 'Back to Selection'}
              </button>
            </div>
          </div>
        )}
        
        {/* Start Reading ボタン - ページ上部 */}
        <div className="mb-6 text-center">
            <button
              onClick={handleStartReading}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isReadingStarted
                  ? 'bg-gray-400 text-[#1E1E1E] cursor-not-allowed'
                  : 'bg-[#FFB86C] text-[#1E1E1E] hover:bg-[#e5a561]'
              }`}
              disabled={isReadingStarted}
            >
              {isReadingStarted ? t('reading.started') : t('reading.start')}
            </button>
            <p className="text-sm text-[#1E1E1E] mt-2">{t('reading.words')}: {wordCount}語</p>
          </div>


          {/* 🔧 修正②: アニメ後のエラー表示問題を修正 */}
          <div className="mb-6 space-y-4">
            {isStoryMode ? (
              // ストーリーモードの場合
              !storyData ? (
                loading ? (
                  <p className="text-gray-500">📄 ストーリー読み込み中です...</p>
                ) : (
                  <p className="text-red-500">⚠️ ストーリーが空です。再度お試しください。</p>
                )
              ) : !storyData.story ? (
                <p className="text-red-500">⚠️ ストーリーが空です。再度お試しください。</p>
              ) : (
                // ストーリーが存在する場合の表示
                englishParagraphs.length > 0 ? (
                  englishParagraphs.map((eng, index) => (
                    <div key={index} className="mb-6">
                      <p className="text-base text-[#1E1E1E] bg-white px-4 py-2 rounded-md">{renderClickableText(eng)}</p>
                      {showJapanese && japaneseParagraphs[index] && (
                        <p className="text-base text-[#1E1E1E] bg-white px-4 py-2 rounded-md mt-2">{japaneseParagraphs[index]}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div>
                    {/* フォールバック: 段落分割されていない場合 */}
                    <div className="whitespace-pre-wrap text-lg leading-relaxed">
                      <p className="text-base text-[#1E1E1E] bg-white px-4 py-2 rounded-md">{renderClickableText(storyData.story)}</p>
                    </div>
                    
                    {/* 日本語訳（全文の場合は最初の翻訳のみ表示） */}
                    {showJapanese && japaneseParagraphs.length > 0 && japaneseParagraphs[0] && (
                      <p className="text-base text-[#1E1E1E] bg-white px-4 py-2 rounded-md">
                        {japaneseParagraphs[0]}
                      </p>
                    )}
                  </div>
                )
              )
            ) : (
              // 読み物モードの場合
              !english ? (
                loading ? (
                  <p className="text-gray-500">📄 読み物読み込み中です...</p>
                ) : (
                  <p className="text-red-500">⚠️ 読み物が見つかりません。再度お試しください。</p>
                )
              ) : (
                // 読み物が存在する場合の表示
                englishParagraphs.length > 0 ? (
                  englishParagraphs.map((eng, index) => (
                    <div key={index} className="mb-6">
                      <p className="text-base text-[#1E1E1E] bg-white px-4 py-2 rounded-md">{renderClickableText(eng)}</p>
                      {showJapanese && japaneseParagraphs[index] && (
                        <p className="text-base text-[#1E1E1E] bg-white px-4 py-2 rounded-md mt-2">{japaneseParagraphs[index]}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div>
                    {/* フォールバック: 段落分割されていない場合 */}
                    <div className="whitespace-pre-wrap text-lg leading-relaxed">
                      <p className="text-base text-[#1E1E1E] bg-white px-4 py-2 rounded-md">{renderClickableText(english)}</p>
                    </div>
                    
                    {/* 日本語訳（全文の場合は最初の翻訳のみ表示） */}
                    {showJapanese && japaneseParagraphs.length > 0 && japaneseParagraphs[0] && (
                      <p className="text-base text-[#1E1E1E] bg-white px-4 py-2 rounded-md">
                        {japaneseParagraphs[0]}
                      </p>
                    )}
                  </div>
                )
              )
            )}
          </div>


          {/* Finish ボタン - テキスト下部 */}
          {isReadingStarted && wpm === null && english && english.length > 0 && (
            <div className="mb-4 text-center">
              <button
                onClick={handleFinishReading}
                className="bg-[#FFB86C] text-[#1E1E1E] px-6 py-3 rounded-md font-semibold hover:bg-[#e5a561] transition-colors"
              >
                {t('reading.finished')}
              </button>
            </div>
          )}

          {/* 日本語訳ボタン - 読了後のみ表示 */}
          {showTranslationButton && english && english.length > 0 && (
            <div className="mb-4 text-center">
              <button
                onClick={isStoryMode ? handleStoryJapaneseToggle : () => setShowJapanese(!showJapanese)}
                disabled={loadingStoryTranslation}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  loadingStoryTranslation
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-[#FFE1B5] text-[#1E1E1E]'
                }`}
              >
                {loadingStoryTranslation
                  ? '翻訳中...'
                  : showJapanese
                  ? '日本語訳を隠す'
                  : t('reading.showTranslation')
                }
              </button>
            </div>
          )}

          {/* デバッグ情報表示 - 開発環境のみ */}
          {false && process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-4">
              Debug: showTranslationButton={showTranslationButton.toString()}, hasError={hasError.toString()}, wpm={wpm}, isStoryMode={isStoryMode.toString()}
            </div>
          )}

          {/* 結果表示 - 画面下部 */}
          {wpm !== null && (
            <div className="mt-6 space-y-6">
              {/* 読書結果 */}
              <div className="bg-white border border-gray-300 rounded p-4">
                <h3 className="font-bold text-[#1E1E1E] mb-2">{t('reading.finished')}</h3>
                <p className="text-[#1E1E1E]">
                  {t('reading.speed')}: <span className="font-bold text-xl">{wpm} WPM</span>
                </p>
                <p className="text-sm text-[#1E1E1E] mt-1">
                  {t('reading.time')}: {endTime && startTime ? Math.round((endTime - startTime) / 1000) : 0}秒
                </p>
                <p className="text-sm text-[#1E1E1E] mt-1">
                  {t('reading.words')}: {wordCount}語
                </p>
              </div>
              
              {/* 進捗情報まとめ */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-bold text-[#1E1E1E] mb-3">📊 読書進捗まとめ</h3>
                <div className="space-y-2 text-sm text-[#1E1E1E]">
                  <p>今回の語数：{wordCount}語</p>
                  <p>今回のWPM：{wpm}</p>
                  <p>平均WPM（直近5回）：{getAverageWPM()}</p>
                  <p>これまでの合計語数：{(parseInt(localStorage.getItem('wordCount') || '0', 10)).toLocaleString()}語</p>
                  {(() => {
                    const totalWords = parseInt(localStorage.getItem('wordCount') || '0', 10);
                    const nextCity = getNextUnreachedCity(totalWords);
                    return nextCity ? (
                      <p>次の目的地：{nextCity.cityName}（あと {(nextCity.requiredWords - totalWords).toLocaleString()}語）</p>
                    ) : (
                      <p>すべての都市に到達済みです！</p>
                    );
                  })()}
                </div>
              </div>
              
              {/* アクションボタン */}
              <div className="bg-white border border-gray-300 rounded p-4">
                <div className="flex gap-2 flex-wrap">
                  {/* 📮 手紙・メール確認ボタン */}
                  {(() => {
                    const letterInfo = checkForAvailableLetter();
                    return letterInfo.hasLetter ? (
                      <button
                        onClick={() => router.push('/letter')}
                        className="bg-[#FFE1B5] text-[#1E1E1E] px-3 py-1 rounded text-sm hover:bg-[#e5a561] flex items-center gap-1"
                      >
                        {letterInfo.letterType === 'mail' ? '✉️' : '📮'} 
                        {letterInfo.letterType === 'mail' 
                          ? `${letterInfo.catName}からのメールを見る` 
                          : `${letterInfo.catName}からの手紙を見る`}
                      </button>
                    ) : null;
                  })()}
                  
                  <button
                    onClick={handleLevelChange}
                    className="bg-[#FFB86C] text-[#1E1E1E] px-3 py-1 rounded text-sm hover:bg-[#e5a561]"
                  >
                    {t('reading.changeLevel')}
                  </button>
                  <button
                    onClick={() => {
                      // 🔧 修正④: 厳格な null チェック - generateReading() 絶対に呼ばない
                      console.log('🔄 【もう一度読む】開始 - 厳格null チェック付き');
                      
                      // 🚫 【最重要】null チェック - データがない場合は絶対に処理しない
                      if (!readAgainAvailable) {
                        console.error('❌ 【致命的】lastReading データが null - 処理を中断');
                        alert('保存された読み物が見つかりません。新しい読み物を選択してください。');
                        return; // ここで処理を完全に停止
                      }
                      
                      try {
                        // 現在のモードに応じて適切なデータソースから復元
                        const storageKey = isStoryMode ? 'lastStory' : 'lastReading';
                        const savedData = localStorage.getItem(storageKey);
                        
                        console.log('📖 【復元元確認】', {
                          storageKey,
                          isStoryMode,
                          hasData: !!savedData,
                          dataLength: savedData?.length || 0
                        });
                        
                        // 🚫 二重チェック - savedData が null の場合は処理しない
                        if (savedData) {
                          const parsedData = JSON.parse(savedData);
                          
                          // 🔧 新形式データの詳細検証とログ
                          console.log('💾 【lastReading内容確認】復元対象データ:', {
                            title: parsedData.title,
                            topic: parsedData.topic,
                            emotion: parsedData.emotion,
                            style: parsedData.style,
                            hasEnglish: !!parsedData.english,
                            hasJapanese: !!parsedData.japanese,
                            englishType: Array.isArray(parsedData.english) ? 'array' : 'string',
                            japaneseType: Array.isArray(parsedData.japanese) ? 'array' : 'string',
                            englishLength: Array.isArray(parsedData.english) ? parsedData.english.length : (parsedData.english?.length || 0),
                            japaneseLength: Array.isArray(parsedData.japanese) ? parsedData.japanese.length : (parsedData.japanese?.length || 0),
                            timestamp: parsedData.timestamp ? new Date(parsedData.timestamp).toLocaleString() : 'なし',
                            '🚫 Honda検証': (parsedData.topic?.includes('Honda') || parsedData.title?.includes('Honda')) ? '❌ Hondaが含まれています！' : '✅ Honda以外'
                          });
                          
                          // Honda検証（緊急チェック）
                          if (parsedData.topic?.includes('Honda') || parsedData.title?.includes('Honda')) {
                            console.error('🚨 【緊急警告】もう一度読むでHondaデータが検出されました！', {
                              topic: parsedData.topic,
                              title: parsedData.title,
                              currentParams: {
                                topic: searchParams.get('topic'),
                                emotion: searchParams.get('emotion'),
                                style: searchParams.get('style')
                              }
                            });
                          }
                          
                          // ローディング状態を少しだけ表示（視覚的フィードバック）
                          setLoading(true);
                          
                          setTimeout(() => {
                            // 🔧 新形式対応: 配列またはstring形式の判定と処理
                            let englishContent = '';
                            let japaneseContent = '';
                            let englishParagraphsArray = [];
                            let japaneseParagraphsArray = [];
                            
                            if (Array.isArray(parsedData.english)) {
                              // 新形式: 配列データ
                              englishParagraphsArray = parsedData.english;
                              englishContent = parsedData.english.join('\n\n');
                              console.log('📄 英語段落を配列形式で復元:', englishParagraphsArray.length, '段落');
                            } else {
                              // 旧形式: 文字列データ
                              englishContent = parsedData.english || parsedData.content || '';
                              englishParagraphsArray = englishContent.split('\n\n').filter((p: string) => p.trim().length > 0);
                              console.log('📄 英語段落を文字列から分割:', englishParagraphsArray.length, '段落');
                            }
                            
                            if (Array.isArray(parsedData.japanese)) {
                              // 新形式: 配列データ
                              japaneseParagraphsArray = parsedData.japanese;
                              japaneseContent = parsedData.japanese.join('\n\n');
                              console.log('🇯🇵 日本語段落を配列形式で復元:', japaneseParagraphsArray.length, '段落');
                            } else {
                              // 旧形式: 文字列データ
                              japaneseContent = parsedData.japanese || parsedData.translation || '';
                              japaneseParagraphsArray = japaneseContent.split('\n\n').filter((p: string) => p.trim().length > 0);
                              console.log('🇯🇵 日本語段落を文字列から分割:', japaneseParagraphsArray.length, '段落');
                            }
                            
                            // 状態更新
                            setEnglish(englishContent);
                            setJapanese(japaneseContent);
                            
                            if (isStoryMode && parsedData.title) {
                              setStoryTitle(parsedData.title);
                            }
                            
                            // 段落配列をフィルタリングして設定
                            const filteredEngParagraphs = filterStructuralHeadings(englishParagraphsArray);
                            const filteredJpnParagraphs = filterStructuralHeadings(japaneseParagraphsArray);
                            
                            setEnglishParagraphs(filteredEngParagraphs);
                            setJapaneseParagraphs(filteredJpnParagraphs);
                            
                            // 語数カウント
                            const words = englishContent.split(/\s+/).filter(word => word.trim().length > 0);
                            setWordCount(words.length);
                            
                            // 読書状態をリセット
                            setIsReadingStarted(false);
                            setStartTime(null);
                            setEndTime(null);
                            setWpm(null);
                            setShowJapanese(false);
                            
                            setLoading(false);
                            
                            console.log('✅ 【新形式対応】同一読み物の再表示完了:', {
                              title: parsedData.title,
                              topic: parsedData.topic,
                              englishParagraphs: filteredEngParagraphs.length,
                              japaneseParagraphs: filteredJpnParagraphs.length,
                              wordCount: words.length,
                              '最終確認Honda検証': englishContent.includes('Honda') ? '❌ Honda含有' : '✅ Honda非含有'
                            });
                          }, 500); // 短いローディング表示
                          
                        } else {
                          console.warn('⚠️ 【二重チェック失敗】savedData が null');
                          alert('保存された読み物が見つかりません。新しい読み物を選択してください。');
                        }
                      } catch (error) {
                        console.error('❌ 「もう一度読む」復元エラー:', error);
                        alert('読み物の復元に失敗しました。新しい読み物を選択してください。');
                      }
                    }}
                    disabled={!readAgainAvailable}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      readAgainAvailable 
                        ? 'bg-[#FFB86C] text-[#1E1E1E] hover:bg-[#e5a561] cursor-pointer' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {readAgainAvailable ? t('reading.readAgain') : '📵 読み物なし'}
                  </button>
                  <button
                    onClick={() => {
                      // 読み物の場合は明示的にtype=readingを保持して選択画面へ
                      router.push('/choose');
                    }}
                    className="bg-[#FFB86C] text-[#1E1E1E] px-3 py-1 rounded text-sm hover:bg-[#e5a561]"
                  >
                    {t('reading.next')}
                  </button>
                </div>
              </div>

              {/* 今日のマイノート */}
              <div className="bg-[#FFF9F4] border border-[#C9A86C] rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[#1E1E1E]">{t('note.title')}</h3>
                  
                  {/* 日本語/English切り替えトグル */}
                  {sessionWords.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleLanguageToggle}
                        disabled={loadingTranslation}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          definitionLanguage === 'ja'
                            ? 'bg-[#7E6944] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } ${loadingTranslation ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loadingTranslation ? '翻訳中...' : definitionLanguage === 'ja' ? '日本語' : 'English'}
                      </button>
                    </div>
                  )}
                </div>
                
                {sessionWords.length > 0 ? (
                  <>
                    <p className="text-sm text-[#1E1E1E] mb-3">
                      {t('note.clickedWords')} {sessionWords.length}{displayLang === 'ja' ? '個' : ''}
                    </p>
                    
                    
                    <div className="space-y-3 mb-4">
                      {sessionWords.map((word, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-[#C9A86C]">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="space-y-2">
                                {/* 1. 見出し語 + 原形 */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-lg text-[#1E1E1E]">{word.word}</span>
                                  {word.baseForm && word.baseForm !== word.word && word.baseForm.trim() !== '' && displayLang === 'ja' && (
                                    <span className="bg-gray-100 text-[#1E1E1E] text-xs px-2 py-1 rounded-md border">
                                      原形: {word.baseForm}
                                    </span>
                                  )}
                                </div>
                                
                                {/* 2. 品詞 */}
                                <div>
                                  <span className="inline-block bg-[#7E6944] text-white text-xs px-2 py-1 rounded-full font-medium">
                                    {displayLang === 'ja'
                                      ? posToJapanese[word.pos || ''] ?? t('pos.unknown', '不明')
                                      : t(`pos.${word.pos}`, t(`pos.${word.detailedPos}`, word.pos ?? 'Unknown'))}
                                  </span>
                                </div>
                                
                                {/* 3. 意味 */}
                                <div>
                                  {displayLang === 'ja' && (
                                    <p className="mb-1 font-semibold text-sm text-[#1E1E1E]">{t('dictionary.meaning')}:</p>
                                  )}
                                  <p className="mb-3 text-sm text-[#1E1E1E]">
                                    {displayLang === 'ja' ? (() => {
                                      const japaneseMeaning = word.meaning_ja || word.japaneseDefinition || word.japaneseMeaning;
                                      // 有効な日本語意味があるかチェック
                                      if (japaneseMeaning && 
                                          !japaneseMeaning.includes('データを取得できませんでした') &&
                                          !japaneseMeaning.includes('意味を取得できませんでした') &&
                                          japaneseMeaning.trim().length > 0) {
                                        return japaneseMeaning;
                                      }
                                      // フォールバック: 英語意味または翻訳中メッセージ
                                      return word.meaning_en || word.englishDefinition || word.meaning || '翻訳を取得中...';
                                    })() : (word.meaning_en || word.englishDefinition || word.meaning)}
                                  </p>
                                </div>
                                
                                
                                {/* 5. 例文 */}
                                {(word.example_en || word.englishExample || word.sentence) && (
                                  <div className="mt-3">
                                    {displayLang === 'ja' && (
                                      <p className="mb-1 font-semibold text-sm text-[#1E1E1E]">{t('dictionary.example')}:</p>
                                    )}
                                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-[#C9A86C]">
                                      {/* 英文 - イタリック表示 */}
                                      <p className="italic text-sm text-[#1E1E1E] mb-2">
                                        {word.example_en || word.englishExample || word.sentence}
                                      </p>
                                      {/* 日本語訳 - 日本語モードのみ表示 */}
                                      {displayLang === 'ja' && (() => {
                                        const japaneseText = word.example_ja || word.japaneseExample || word.sentenceJapanese;
                                        // テンプレート文や無効なテキストを除外
                                        const isValidJapanese = japaneseText && 
                                          !japaneseText.includes('を使った例文') &&
                                          !japaneseText.includes('Example sentence with') &&
                                          !japaneseText.includes('翻訳に失敗') &&
                                          !japaneseText.includes('データを取得できませんでした') &&
                                          japaneseText.trim().length > 0 &&
                                          japaneseText !== null;
                                        
                                        return isValidJapanese ? (
                                          <p className="text-sm text-[#1E1E1E]">
                                            {japaneseText}
                                          </p>
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => window.location.href = '/notebook'}
                      className="w-full bg-[#FFE1B5] text-[#1E1E1E] px-6 py-3 rounded-md font-medium transition-colors"
                    >
                      マイノートを見る
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#1E1E1E] mb-3">
                      今回は単語をクリックしませんでした
                    </p>
                    <button
                      onClick={() => window.location.href = '/notebook'}
                      className="w-full bg-[#FFE1B5] text-[#1E1E1E] px-6 py-3 rounded-md font-medium transition-colors"
                    >
                      マイノートを見る
                    </button>
                  </>
                )}
              </div>

              {/* Related Themes セクション (ストーリーモードのみ) */}
              {isStoryMode && storyData && storyData.themes && Array.isArray(storyData.themes) && storyData.themes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h3 className="font-bold text-[#1E1E1E] mb-3">Related Themes</h3>
                  <p className="text-sm text-[#1E1E1E] mb-3">
                    次に読みたいテーマを選んでください
                  </p>
                  
                  <div className="space-y-2">
                    {storyData.themes.map((theme, index) => (
                      <button
                        key={index}
                        onClick={() => handleThemeSelection(theme)}
                        className="w-full text-left p-3 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">{theme}</span>
                          <span className="text-[#1E1E1E] text-sm">次に読む</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <button
                      onClick={() => window.location.href = '/story-form'}
                      className="w-full bg-[#FFB86C] text-[#1E1E1E] px-4 py-2 rounded-md font-medium hover:bg-[#e5a561] transition-colors"
                    >
                      新しいストーリーを作成
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 難易度選択モーダル */}
          {showLevelSelection && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
                <h3 className="text-lg font-bold mb-4">語彙レベルを変えて読む</h3>
                <p className="text-gray-600 mb-4">読みたい難易度を選択してください</p>
                
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => handleNewDifficultySelect('簡単（A1〜A2）')}
                    className="w-full p-4 text-left border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <div className="font-semibold text-green-800">簡単（A1〜A2）</div>
                    <div className="text-sm text-green-600">基本的な語彙を使った文章</div>
                  </button>
                  
                  <button
                    onClick={() => handleNewDifficultySelect('中（B1〜B2）')}
                    className="w-full p-4 text-left border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="font-semibold text-[#1E1E1E]">中（B1〜B2）</div>
                    <div className="text-sm text-[#1E1E1E]">標準的な語彙を使った文章</div>
                  </button>
                  
                  <button
                    onClick={() => handleNewDifficultySelect('難しい（C1〜C2）')}
                    className="w-full p-4 text-left border-2 border-[#C9A86C] rounded-lg hover:bg-[#FFF9F4] hover:border-[#C9A86C] transition-colors"
                  >
                    <div className="font-semibold text-[#1E1E1E]">難しい（C1〜C2）</div>
                    <div className="text-sm text-[#1E1E1E]">高度な語彙を使った文章</div>
                  </button>
                </div>
                
                <button
                  onClick={() => setShowLevelSelection(false)}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
      
      {/* メール通知 */}
      <MailNotification show={showMailNotification} />
    </main>
  );
}

export default function ReadingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">読み込み中...</div>}>
      <ReadingPageContent />
    </Suspense>
  );
}
