import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { originalText, targetLevel, title, currentLevel } = await req.json();

    if (!originalText || !targetLevel) {
      return NextResponse.json({ error: 'originalText and targetLevel are required' }, { status: 400 });
    }

    console.log('🔄 Level conversion request:', { 
      currentLevel, 
      targetLevel, 
      textLength: originalText.length 
    });

    // NGSL語彙レベル範囲の設定
    const vocabularyRanges = {
      1: { rangeStart: 1, rangeMid: 500, rangeEnd: 800 },
      2: { rangeStart: 1, rangeMid: 750, rangeEnd: 1200 },
      3: { rangeStart: 1, rangeMid: 1000, rangeEnd: 1500 },
      4: { rangeStart: 1, rangeMid: 1500, rangeEnd: 2500 },
      5: { rangeStart: 1, rangeMid: 2000, rangeEnd: 4000 }
    };

    const range = vocabularyRanges[targetLevel as keyof typeof vocabularyRanges];
    const wordCountRequirements = {
      1: "80-120 words",
      2: "110-150 words", 
      3: "140-200 words",
      4: "200-240 words",
      5: "240-280 words"
    };

    const rewritePrompt = `You are an expert English rewriter specializing in NGSL vocabulary control and educational content adaptation.

${targetLevel === 1 ? `🚨🚨🚨 LEVEL 1 EMERGENCY MODE 🚨🚨🚨
This is LEVEL 1 - the EASIEST possible English for absolute beginners.
You MUST write like you are teaching a 6-year-old child who knows only basic English.

CRITICAL EXAMPLES OF WHAT TO DO:
✅ GOOD Level 1: "The Beatles were four men. They made music. People liked their songs. They were from England. They were very famous."
❌ BAD: "The Beatles members were not only into music but also interested in movies and art, excelling in different areas."

CRITICAL TASK: Rewrite the following English text for absolute beginners (6-year-old level).` : 
`CRITICAL TASK: Rewrite the following English text to match Level ${targetLevel} vocabulary constraints while maintaining the same meaning and expert explanatory style.`}

Original text:
"${originalText}"

🚨 ABSOLUTE REQUIREMENTS 🚨

VOCABULARY CONTROL (Level ${targetLevel}):
- Use ONLY NGSL vocabulary range ${range.rangeStart}–${range.rangeEnd}
- 80%+ of words must be from NGSL ${range.rangeStart}–${range.rangeMid}
- NO words beyond NGSL ${range.rangeEnd}
- Replace any difficult words with simpler Level ${targetLevel} equivalents

SPECIFIC VOCABULARY GUIDANCE:
${targetLevel === 1 ? `🚨🚨🚨 LEVEL 1 ABSOLUTE WORD LIST 🚨🚨🚨
ONLY USE THESE 200 WORDS - NO OTHERS ALLOWED:
VERBS: be, is, are, was, were, have, has, had, do, does, did, go, went, get, got, make, made, see, saw, know, knew, think, thought, come, came, take, took, give, gave, use, used, work, worked, look, looked, want, wanted, say, said, tell, told, ask, asked, feel, felt, find, found, try, tried, help, helped, show, showed, play, played, run, ran, sit, sat, eat, ate, drink, drank, live, lived, like, liked, love, loved, need, needed, keep, kept, put, put, call, called, read, read, write, wrote, buy, bought, pay, paid, open, opened, close, closed, start, started, stop, stopped, turn, turned, walk, walked, talk, talked, listen, listened, watch, watched, learn, learned, teach, taught, study, studied

NOUNS: man, woman, boy, girl, child, baby, people, family, friend, mother, father, school, home, house, place, city, country, world, water, food, money, book, car, tree, animal, day, time, year, week, hour, music, song, group, band

ADJECTIVES: big, small, good, bad, new, old, right, wrong, easy, hard, long, short, hot, cold, fast, slow, happy, sad, nice, red, blue, white, black, first, last, young, famous

OTHERS: the, a, an, and, but, or, in, on, at, to, for, with, from, of, about, he, she, it, they, them, we, us, I, you, my, your, his, her, their, this, that, these, those, one, two, three, four, very, so, too, also, only, just, here, there, now, then, today, tomorrow, yes, no, not

🚨 ABSOLUTE GRAMMAR RULES 🚨
- ONLY Subject + Verb + Object: "The Beatles were four men."
- ONLY simple past/present: "They made music." "People liked them."
- NO participles: NOT "excelling" - use "They were good at"
- NO compound adjectives: NOT "well-known" - use "famous"
- NO complex phrases: NOT "not only...but also" - use "They did this. They also did that."
- Maximum 6 words per sentence
- NO words ending in -ing at sentence start
- NO words like: members, interested, areas, excelling, into, also

🚨 BANNED WORDS FOR LEVEL 1 🚨
members, interested, areas, excelling, into, also, different, only, both, various, several, including, during, through, between, among, within, without, although, however, therefore, moreover, furthermore, especially, particularly, specifically, generally, usually, often, sometimes, always, never, really, actually, probably, perhaps, maybe, quite, rather, pretty, fairly, extremely, incredibly, absolutely, completely, totally, entirely, exactly, definitely, certainly, obviously, clearly, apparently, unfortunately, fortunately, surprisingly, interestingly, importantly, significantly` : 
targetLevel === 2 ? `🚨 LEVEL 2 STRICT RESTRICTIONS 🚨  
- Use ONLY NGSL 1-1000 words: important, different, study, example, problem, learn, school, student, teacher, education, science, history, nature, animal, plant, country, city, people, family, friend, work, job, business, money, buy, sell, food, eat, drink, house, home, live, place, travel, visit, beautiful, interesting, special, happy, sad, easy, difficult, big, small, good, bad, new, old, young, think, know, understand, remember, forget, like, love, want, need, help, show, tell, say, speak, read, write, listen, watch, look, see, find, get, give, take, make, do, go, come, start, stop, finish, open, close, turn, walk, run, sit, stand, play, work, rest, sleep
- GRAMMAR: Simple sentences + basic compound sentences with "and/but/or". NO complex clauses. NO participles.
- BANNED WORDS: fascinated, exploring, resonates, legacy, admiration, perspectives, comprehensive, sophisticated, elaborate, contemporary, significant, demonstrate, essential, particular
- SENTENCE EXAMPLES: "Edison was a man." "He made many things." "People liked his work." "His ideas were good."` :
targetLevel === 3 ? `- Level 3: Use words like "significant", "demonstrate", "essential", "particular"
- Avoid: comprehensive, sophisticated, elaborate, contemporary` :
targetLevel === 4 ? `- Level 4: Use words like "comprehensive", "sophisticated", "elaborate", "contemporary"
- Can use: analysis, development, perspective, substantial` :
`- Level 5: Use advanced words like "sophisticated", "comprehensive", "substantial", "contemporary"
- Can use: intricate, elaborate, fundamental, paradigm`}

🚨 VOCABULARY VALIDATION (CRITICAL) 🚨
${targetLevel <= 2 ? `- EVERY WORD will be checked against NGSL ${range.rangeEnd} limit
- If ANY forbidden word is found, the text will be REJECTED
- Use simple alternatives: "like" not "fascinated", "look at" not "exploring", "feels good" not "resonates", "what he left" not "legacy", "liked" not "admiration", "ideas" not "perspectives"` : ''}

🚨 CRITICAL WORD COUNT REQUIREMENTS 🚨
- Level ${targetLevel} MUST have EXACTLY ${wordCountRequirements[targetLevel as keyof typeof wordCountRequirements]}
- Current text has ${originalText.split(' ').length} words
- TARGET: ${targetLevel === 4 ? 'MINIMUM 200 words, TARGET 220 words' : targetLevel === 5 ? 'MINIMUM 240 words, TARGET 260 words' : targetLevel === 3 ? 'MINIMUM 140 words, TARGET 170 words' : targetLevel === 2 ? 'MINIMUM 110 words, TARGET 130 words' : 'MINIMUM 80 words, TARGET 100 words'}
- ${targetLevel >= 4 ? '⚠️ MUST EXPAND: Add detailed explanations, examples, context, and elaboration' : targetLevel <= 2 ? '⚠️ Keep concise but meet minimum word count' : '⚠️ Adjust content to meet target range'}

🔥 EXPANSION MANDATORY FOR LEVEL ${targetLevel >= 4 ? '4-5' : targetLevel >= 3 ? '3+' : '2+'} 🔥

${targetLevel >= 4 ? `⚠️ LEVEL 4-5 SPECIAL INSTRUCTIONS ⚠️
- MUST reach minimum ${targetLevel === 4 ? '200' : '240'} words
- Add multiple paragraphs with detailed explanations
- Include specific examples and case studies  
- Elaborate on historical context and development
- Discuss implications and future perspectives
- Add technical details and comprehensive analysis` : ''}

EXPANSION STRATEGIES (MANDATORY if word count is insufficient):
- Add more detailed explanations of concepts and principles
- Include multiple specific examples and case studies
- Provide comprehensive background information and context
- Elaborate extensively on implications and significance
- Add descriptive details, specifics, and technical information
- Discuss historical development and future perspectives
- Include comparative analysis and different viewpoints

STYLE REQUIREMENTS:
- Maintain expert explanatory tone throughout
- NO dialogue format ("said", "asked", "replied")
- Use educational, informative language
- Keep the same meaning and message as original
- MUST perform fact-checking: ensure all information is factually accurate
- NO speculative content: only include scientifically verified information
- Maintain factual accuracy while simplifying language

${targetLevel === 1 ? `🚨 LEVEL 1 GRAMMAR RESTRICTIONS 🚨
- ONLY use simple present tense: "Edison is", "He makes", "People like"
- ONLY use simple past tense: "Edison was", "He made", "People liked"  
- NO -ing participles at start of sentences: NOT "Working hard, he..." but "He worked hard. He..."
- NO complex sentences with "because/although/while/since"
- NO relative clauses with "who/which/that"
- Maximum sentence length: 8 words
- Every sentence: Subject + Verb + Object/Complement
- EXAMPLES: "Edison was smart." "He made lights." "People bought them." "His work was good."` : ''}

${targetLevel === 2 ? `🚨 LEVEL 2 GRAMMAR RESTRICTIONS 🚨
- Simple sentences + compound sentences with "and/but/or" ONLY
- NO subordinate clauses (because/although/while/when/if)
- NO participle phrases
- NO relative clauses (who/which/that)
- Maximum sentence length: 12 words
- EXAMPLES: "Edison was a smart man. He lived in America. He made many inventions. People liked his work."` : ''}

🎯 FINAL VALIDATION CHECKLIST (MUST CHECK BEFORE OUTPUT):
✓ All vocabulary within NGSL ${range.rangeStart}–${range.rangeEnd}
✓ Word count is ${targetLevel === 4 ? 'AT LEAST 200 words' : targetLevel === 5 ? 'AT LEAST 240 words' : targetLevel === 3 ? 'AT LEAST 140 words' : targetLevel === 2 ? 'AT LEAST 110 words' : 'AT LEAST 80 words'}
${targetLevel <= 2 ? `✓ NO forbidden words: fascinated, exploring, resonates, legacy, admiration, perspectives, significant, demonstrate, essential, particular
✓ ALL sentences are simple structure: Subject + Verb + Object
✓ NO participles (-ing/-ed at start): "Working hard" → "He worked hard"
✓ NO complex grammar: because/although/while/who/which/that` : ''}
✓ Same meaning as original text maintained
✓ Expert explanatory style maintained throughout
✓ No dialogue format whatsoever
✓ Content is sufficiently detailed and expanded

⚠️ CRITICAL: COUNT YOUR WORDS BEFORE OUTPUTTING ⚠️
If word count is insufficient, ADD MORE CONTENT before finalizing.

${targetLevel === 1 ? `🚨🚨🚨 LEVEL 1 FINAL WARNING 🚨🚨🚨
BEFORE YOU OUTPUT, CHECK EVERY SINGLE WORD:
❌ If you see "members" → change to "people"
❌ If you see "interested" → change to "liked" 
❌ If you see "excelling" → change to "good at"
❌ If you see "areas" → change to "things"
❌ If you see "not only...but also" → split into two sentences
❌ If ANY sentence has more than 6 words → split it
❌ If you see -ing at start → change to simple sentence

EXAMPLE PERFECT LEVEL 1:
"The Beatles were four men. They made music. People liked their songs. They were very famous. They lived in England."

NO EXCEPTIONS. NO EXCUSES. Level 1 = 6-year-old child level.` : ''}

Output the rewritten text only (no JSON, no formatting, just the text):`;

    console.log('🔤 Rewriting with OpenAI API for Level', targetLevel);

    // API key チェック
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY not found');
      return NextResponse.json({ 
        error: 'API key not configured' 
      }, { status: 500 });
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: rewritePrompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const rewrittenText = data.choices[0].message.content.trim();
      
      // 語数を計算
      const wordCount = rewrittenText.split(' ').filter(word => word.length > 0).length;
      
      console.log('✅ Level conversion completed:', {
        targetLevel,
        wordCount,
        originalLength: originalText.length,
        rewrittenLength: rewrittenText.length,
        success: true
      });

      return NextResponse.json({
        rewrittenText,
        targetLevel,
        wordCount,
        title: title || `Level ${targetLevel} Reading`,
        success: true
      });

    } catch (apiError) {
      console.error('❌ OpenAI API error:', apiError);
      
      return NextResponse.json({
        error: 'Level conversion failed. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Level conversion error:', error);
    
    return NextResponse.json({
      error: 'Level conversion failed. Please try again.'
    }, { status: 500 });
  }
}