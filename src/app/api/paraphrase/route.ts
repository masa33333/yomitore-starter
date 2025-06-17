import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { word, partOfSpeech } = await req.json();

    if (!word) {
      return NextResponse.json({ error: '単語が指定されていません' }, { status: 400 });
    }

    console.log('🔄 パラフレーズ取得リクエスト:', { word, partOfSpeech });

    const userPrompt = `Suggest a simpler English word or phrase that has the same meaning and part of speech as "${word}" (${partOfSpeech}). Use only words a basic English learner would understand (e.g., A2/elementary level vocabulary).

Requirements:
- Use ONLY basic vocabulary (middle school/junior high level English)
- Output must be self-contained and context-independent
- Do NOT include context-specific objects (like "it", "them", "something")
- Do NOT include incomplete phrases that need objects
- Use the same part of speech as the original word
- If no single simple word exists, use a 2-3 word descriptive phrase

Examples:
- "demonstrated" (verb) → "showed" (verb), NOT "showed it"
- "substantial" (adjective) → "large and important" (adjective phrase)
- "terminate" (verb) → "stop" (verb)
- "sophisticated" (adjective) → "smart and nice" (adjective phrase)

Output only a single word or short phrase, self-contained and clear.`;

    console.log('📤 OpenAIに送信するパラフレーズプロンプト:', userPrompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that provides very simple English alternatives for beginning language learners. CRITICAL: Use ONLY elementary-level vocabulary (A2/basic level). Always maintain the same part of speech. Output must be self-contained and NOT include context-specific words like 'it', 'them', 'something'. Examples: 'demonstrated' → 'showed' (NOT 'showed it'), 'substantial' → 'large and important', 'terminate' → 'stop', 'sophisticated' → 'smart and nice'. Think like you're explaining to a middle school student. Always respond with only the simplified word or phrase, nothing else." 
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    let paraphrase = completion.choices[0].message.content?.trim() ?? "";
    console.log('📥 OpenAIからのパラフレーズ応答:', paraphrase);
    
    // 引用符を除去
    paraphrase = paraphrase.replace(/^["']|["']$/g, '').trim();
    
    console.log('📥 クリーニング後のパラフレーズ:', paraphrase);

    // バリデーション
    if (paraphrase && paraphrase.length > 0 && paraphrase.toLowerCase() !== word.toLowerCase()) {
      // 明らかに不適切な回答をフィルタリング
      const invalidResponses = [
        'i cannot', 'i can\'t', 'unable to', 'sorry', 'cannot provide',
        'not possible', 'difficult to', 'no simpler', 'same as'
      ];
      
      // 文脈依存語をフィルタリング
      const contextDependentWords = [
        ' it', ' them', ' him', ' her', ' this', ' that', ' these', ' those',
        ' something', ' someone', ' somebody', ' anything', ' anyone', ' anybody',
        'it ', 'them ', 'him ', 'her ', 'this ', 'that ', 'these ', 'those ',
        'something ', 'someone ', 'somebody ', 'anything ', 'anyone ', 'anybody '
      ];
      
      const isInvalid = invalidResponses.some(invalid => 
        paraphrase.toLowerCase().includes(invalid)
      );
      
      const isContextDependent = contextDependentWords.some(contextWord =>
        paraphrase.toLowerCase().includes(contextWord)
      );
      
      if (isInvalid) {
        console.log('⚠️ 無効なパラフレーズ応答:', paraphrase);
        return NextResponse.json({ paraphrase: null });
      }
      
      if (isContextDependent) {
        console.log('⚠️ 文脈依存語を含むパラフレーズ:', paraphrase);
        return NextResponse.json({ paraphrase: null });
      }
      
      // 不完全なフレーズをチェック
      const incompletePatterns = [
        /\bto\s+do\b/i,           // "to do"
        /\bto\s+be\b/i,           // "to be"
        /\bto\s+have\b/i,         // "to have"
        /\bpromise\s+to\b/i,      // "promise to"
        /\btry\s+to\b/i,          // "try to"
        /\bneed\s+to\b/i,         // "need to"
        /\bwant\s+to\b/i,         // "want to"
        /\b\w+\s+to\s+\w+\b/i,    // 一般的な "verb + to + verb" パターン
      ];
      
      const isIncompletePhrase = incompletePatterns.some(pattern =>
        pattern.test(paraphrase)
      );
      
      if (isIncompletePhrase) {
        console.log('⚠️ 不完全なフレーズパターン:', paraphrase);
        return NextResponse.json({ paraphrase: null });
      }
      
      // 基本語彙レベルチェック
      const basicVocabulary = [
        // 基本動詞
        'be', 'have', 'do', 'say', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want',
        'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'keep', 'let',
        'begin', 'help', 'show', 'hear', 'play', 'run', 'move', 'live', 'bring', 'happen', 'write', 'sit',
        'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand',
        'watch', 'follow', 'stop', 'create', 'speak', 'read', 'spend', 'grow', 'open', 'walk', 'win', 'teach',
        'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'serve', 'die', 'send', 'build', 'stay',
        'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report',
        'decide', 'pull', 'break', 'pick', 'wear', 'paper', 'visit', 'remove', 'drop', 'travel',
        
        // 基本名詞
        'time', 'person', 'year', 'way', 'day', 'thing', 'man', 'world', 'life', 'hand', 'part', 'child',
        'eye', 'woman', 'place', 'work', 'week', 'case', 'point', 'home', 'water', 'room', 'mother', 'area',
        'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'job', 'word', 'business', 'issue',
        'side', 'kind', 'head', 'house', 'service', 'friend', 'father', 'power', 'hour', 'game', 'line',
        'end', 'member', 'law', 'car', 'city', 'community', 'name', 'president', 'team', 'minute', 'idea',
        'kid', 'body', 'information', 'back', 'parent', 'face', 'others', 'level', 'office', 'door', 'health',
        'person', 'art', 'war', 'history', 'party', 'result', 'change', 'morning', 'reason', 'research',
        'girl', 'guy', 'moment', 'air', 'teacher', 'force', 'education',
        
        // 基本形容詞
        'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big',
        'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public',
        'bad', 'same', 'able', 'human', 'local', 'sure', 'far', 'black', 'white', 'personal', 'open',
        'red', 'difficult', 'available', 'likely', 'free', 'military', 'political', 'happy', 'possible',
        'major', 'real', 'simple', 'easy', 'strong', 'nice', 'pretty', 'smart', 'cool', 'fast', 'slow',
        'hot', 'cold', 'warm', 'clean', 'dirty', 'quiet', 'loud', 'safe', 'dangerous', 'heavy', 'light',
        
        // 基本副詞
        'well', 'also', 'back', 'only', 'very', 'still', 'way', 'even', 'now', 'just', 'here', 'how',
        'so', 'about', 'up', 'out', 'many', 'then', 'them', 'more', 'much', 'some', 'time', 'very',
        'when', 'where', 'why', 'what', 'all', 'each', 'most', 'often', 'always', 'never', 'sometimes',
        'usually', 'again', 'quite', 'really', 'almost', 'together', 'probably', 'maybe', 'perhaps',
        'quickly', 'slowly', 'carefully', 'easily', 'clearly', 'simply', 'finally', 'especially'
      ];
      
      const paraphraseWords = paraphrase.toLowerCase().split(' ');
      const isBasicVocab = paraphraseWords.every(word => 
        basicVocabulary.includes(word) || 
        ['a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'].includes(word)
      );
      
      if (!isBasicVocab) {
        console.log('⚠️ 基本語彙レベルを超えている可能性:', word, '->', paraphrase);
        // 警告のみで、完全拒否はしない
      }
      
      // 基本的な品詞チェック（簡易版）
      const originalPosType = partOfSpeech.toLowerCase();
      const paraphraseLower = paraphrase.toLowerCase().split(' ')[0]; // 最初の単語をチェック
      
      // 明らかな品詞の不一致をチェック
      if (originalPosType.includes('adverb') && !paraphraseLower.endsWith('ly') && 
          !['well', 'fast', 'hard', 'early', 'late', 'soon', 'now', 'here', 'there'].includes(paraphraseLower)) {
        console.log('⚠️ 品詞不一致の可能性:', word, '(', partOfSpeech, ') ->', paraphrase);
        // 品詞不一致でも完全に拒否はせず、警告のみ
      }
      
      // 長すぎる場合は短縮（25文字以内が理想）
      const cleanedParaphrase = paraphrase.length > 25 ? 
        paraphrase.substring(0, 25).trim() + '...' : 
        paraphrase;
      
      console.log('✅ パラフレーズ取得成功:', word, '(', partOfSpeech, ') ->', cleanedParaphrase);
      return NextResponse.json({ paraphrase: cleanedParaphrase });
    } else {
      console.log('⚠️ パラフレーズが同じまたは無効:', paraphrase);
      return NextResponse.json({ paraphrase: null });
    }

  } catch (err) {
    console.error("paraphrase error:", err);
    return NextResponse.json({ 
      error: "パラフレーズの取得に失敗しました",
      paraphrase: null
    }, { status: 500 });
  }
}