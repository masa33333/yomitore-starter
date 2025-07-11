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

    // NGSL語彙レベル範囲の設定（3段階システム）
    const vocabularyRanges = {
      1: { rangeStart: 1, rangeMid: 300, rangeEnd: 500 },    // 初級：基本語彙のみ
      2: { rangeStart: 1, rangeMid: 700, rangeEnd: 1000 },   // 中級：日常語彙
      3: { rangeStart: 1, rangeMid: 1200, rangeEnd: 2000 }   // 上級：幅広い語彙
    };

    const range = vocabularyRanges[targetLevel as keyof typeof vocabularyRanges];
    const wordCountRequirements = {
      1: "80-120 words",
      2: "120-180 words", 
      3: "180-250 words"
    };

    const rewritePrompt = `You are an expert English rewriter specializing in NGSL vocabulary control and educational content adaptation.

${targetLevel === 1 ? `🚨🚨🚨 LEVEL 1 EMERGENCY MODE 🚨🚨🚨
This is LEVEL 1 - the EASIEST possible English for absolute beginners.
You MUST write like you are teaching a 6-year-old child who knows only basic English.

CRITICAL EXAMPLES OF WHAT TO DO:
✅ GOOD Level 1: "The Beatles were four men. They made music. People liked their songs. They were from England. They were very famous."
❌ BAD: "The Beatles members were not only into music but also interested in movies and art, excelling in different areas."

CRITICAL TASK: Rewrite the following English text for absolute beginners (6-year-old level).
REQUIRED WORD COUNT: EXACTLY 80-120 words (NO LESS, NO MORE)` : 
`CRITICAL TASK: Rewrite the following English text to match Level ${targetLevel} vocabulary constraints while maintaining the same meaning and expert explanatory style.
REQUIRED WORD COUNT: ${targetLevel === 2 ? 'EXACTLY 120-160 words' : 'EXACTLY 180-220 words'} (MUST BE LONGER THAN ORIGINAL)`}

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

OTHERS: the, a, an, and, but, or, in, on, at, to, for, with, from, of, about, he, she, it, they, them, we, us, I, you, my, your, his, her, their, this, that, these, those, one, two, three, four, very, so, here, there, now, then, today, tomorrow, yes, no, not

🚨 ABSOLUTE GRAMMAR RULES 🚨
- ONLY Subject + Verb + Object: "Google is a website." "People use Google." "It helps people."
- ONLY simple past/present: "They made it." "People liked it."
- NEVER use -ing words: NOT "saving time" → "it saves time"
- NEVER use -ed after nouns: NOT "engine used" → "people use an engine"
- NO participles: NOT "providing help" → "it gives help"
- NO post-modification: NOT "a search engine used worldwide" → "Google is a search engine. People use it everywhere."
- NO compound adjectives: NOT "well-known" → "famous"
- NEVER start with -ing: NOT "Saving time..." → "It saves time."
- Maximum 5 words per sentence: "Google is a website."
- SPLIT LONG IDEAS: "Google helps people find things. It is fast. People like it."

🚨 BANNED WORDS FOR LEVEL 1 🚨
feature, additionally, search, engine, worldwide, saving, providing, used, become, through, after, between, within, around, during, while, before, since, until, unless, although, however, therefore, moreover, furthermore, especially, particularly, specifically, generally, usually, often, sometimes, always, never, really, actually, probably, perhaps, maybe, quite, rather, pretty, fairly, extremely, incredibly, absolutely, completely, totally, entirely, exactly, definitely, certainly, obviously, clearly, apparently, unfortunately, fortunately, surprisingly, interestingly, importantly, significantly, members, interested, areas, excelling, into, also, different, only, both, various, several, including` : 
targetLevel === 2 ? `🚨 LEVEL 2 STRICT RESTRICTIONS 🚨  
- Use ONLY NGSL 1-1000 words: important, different, study, example, problem, learn, school, student, teacher, education, science, history, nature, animal, plant, country, city, people, family, friend, work, job, business, money, buy, sell, food, eat, drink, house, home, live, place, travel, visit, beautiful, interesting, special, happy, sad, easy, difficult, big, small, good, bad, new, old, young, think, know, understand, remember, forget, like, love, want, need, help, show, tell, say, speak, read, write, listen, watch, look, see, find, get, give, take, make, do, go, come, start, stop, finish, open, close, turn, walk, run, sit, stand, play, work, rest, sleep
- GRAMMAR: Simple sentences + basic compound sentences with "and/but/or". NO complex clauses. NO participles.
- BANNED WORDS: captivate, enthusiastic, donation, active, involvement, participate, contribute, inspire, influence, impact, fascinated, exploring, resonates, legacy, admiration, perspectives, comprehensive, sophisticated, elaborate, contemporary, significant, demonstrate, essential, particular, create, achieve, develop, maintain, various, specific, certain
- SENTENCE EXAMPLES: "Edison was a man." "He made many things." "People liked his work." "His ideas were good."` :
targetLevel === 3 ? `🚨 LEVEL 3 STRICT VOCABULARY CONTROL 🚨
- ALLOWED NGSL 1-1500 words: significant, demonstrate, essential, particular, understand, develop, create, important, different, example, education, science, knowledge, experience, research, study, learn, discover, explain, improve, increase, describe, compare, analyze, suggest, influence, effect, result, cause, reason, solution, method, process, system, structure, information, evidence, data, facts, details, relationship, connection, activity, function, role, purpose, advantage, benefit, problem, issue, challenge, opportunity, success, achievement, progress, development, movement, change, growth, expansion
- BANNED Level 4+ words: comprehensive, sophisticated, elaborate, contemporary, substantial, perspective, framework, paradigm, phenomenon, implications, methodology, theoretical, conceptual, extensive, intensive, complexity, intricacy, synthesis, integration, implementation, optimization, enhancement, transformation, configuration, specification, validation, evaluation, assessment, interpretation, analysis (use "study" instead), manifestation, demonstration (use "show" instead), establishment, investigation, exploration, examination, consideration, determination, identification, classification, categorization, characterization, representation, illustration, documentation, formulation, articulation, elaboration, sophistication, comprehensiveness
- GRAMMAR RESTRICTIONS: NO complex relative clauses, NO participle phrases as sentence starters, NO subjunctive mood, NO passive constructions with complex agents
- SENTENCE STRUCTURE: Max 15 words per sentence, mostly compound sentences with "and/but/or", simple subordinate clauses with "because/when/if" only
- EXAMPLES: "Scientists study this problem because it is important." "They found that water helps plants grow." "This method works well, but it takes time."` :
targetLevel === 4 ? `🚨 LEVEL 4 ENHANCED VOCABULARY CONTROL 🚨  
- ALLOWED NGSL 1-2500 words: comprehensive, sophisticated, elaborate, contemporary, substantial, perspective, framework, analysis, development, methodology, theoretical, conceptual, extensive, complexity, synthesis, implementation, enhancement, configuration, evaluation, interpretation, manifestation, establishment, investigation, exploration, examination, consideration, determination, identification, classification, representation, documentation, formulation, articulation, optimization, transformation, validation, assessment, characterization, illustration, categorization, specification, integration, intensive, demonstration, phenomenon, implications
- BANNED Level 5+ words: paradigm, intricate, fundamental (use "basic" instead), elaborate theoretical frameworks, phenomenological, epistemological, ontological, methodological considerations, comprehensive theoretical synthesis, sophisticated analytical framework, intricate methodological approach, fundamental epistemological questions, paradigmatic shifts, theoretical underpinnings, conceptual foundations, analytical rigor, methodological sophistication, theoretical complexity, conceptual intricacy
- ADVANCED GRAMMAR ALLOWED: Complex relative clauses, participle phrases, subjunctive mood, complex passive constructions, embedded clauses, conditional sentences with multiple conditions
- SENTENCE STRUCTURE: 15-25 words per sentence, complex compound-complex sentences, multiple subordinate clauses
- EXAMPLES: "The comprehensive analysis, which was conducted over several years, demonstrates that contemporary methods are more sophisticated than traditional approaches." "Having examined the extensive data, researchers determined that the implementation of this framework requires substantial methodological considerations."` :
`🚨 LEVEL 5 ADVANCED VOCABULARY CONTROL 🚨
- UNRESTRICTED NGSL: All academic and sophisticated vocabulary allowed
- ENCOURAGED words: paradigm, intricate, fundamental, elaborate theoretical frameworks, phenomenological, epistemological, ontological, methodological considerations, comprehensive theoretical synthesis, sophisticated analytical framework, intricate methodological approach, fundamental epistemological questions, paradigmatic shifts, theoretical underpinnings, conceptual foundations, analytical rigor, methodological sophistication, theoretical complexity, conceptual intricacy, multifaceted, nuanced, sophisticated conceptualization, comprehensive examination, extensive investigation, rigorous analysis, systematic exploration, thorough evaluation, detailed assessment, critical interpretation, substantive discussion, profound implications, significant ramifications
- ADVANCED GRAMMAR REQUIRED: Complex nested clauses, sophisticated syntactic structures, academic register, formal discourse markers, complex conditional constructions, subjunctive mood, intricate participial phrases
- SENTENCE STRUCTURE: 20-35 words per sentence, sophisticated academic style with embedded clauses and complex nominalization
- EXAMPLES: "The paradigmatic shift toward comprehensive theoretical frameworks necessitates a fundamental reconceptualization of methodological approaches, particularly those concerning the intricate relationships between epistemological foundations and analytical rigor." "This sophisticated examination, which encompasses both theoretical underpinnings and practical implications, demonstrates the profound complexity inherent in contemporary analytical paradigms."`}

🚨 VOCABULARY VALIDATION (CRITICAL) 🚨
${targetLevel === 1 ? `- EVERY WORD will be checked against the 200-word Level 1 list above
- If ANY forbidden word is found, the text will be REJECTED
- Use simple alternatives: "like" not "fascinated", "look at" not "exploring", "feels good" not "resonates", "what he left" not "legacy", "liked" not "admiration", "ideas" not "perspectives"` : 
targetLevel === 2 ? `- EVERY WORD will be checked against NGSL 1-1000 limit
- BANNED words: fascinated, exploring, resonates, legacy, admiration, perspectives, comprehensive, sophisticated, elaborate, contemporary, significant, demonstrate, essential, particular
- Use alternatives: "interested" not "fascinated", "study" not "exploring", "feels" not "resonates"` :
targetLevel === 3 ? `- EVERY WORD will be checked against NGSL 1-1500 limit  
- STRICTLY BANNED Level 4+ words: comprehensive, sophisticated, elaborate, contemporary, substantial, perspective, framework, paradigm, phenomenon, implications, methodology, theoretical, conceptual, extensive, intensive, complexity, synthesis, implementation, enhancement, evaluation, interpretation, manifestation, establishment, investigation, exploration, examination, consideration, determination, identification, classification, representation, documentation, formulation, articulation, optimization, transformation, validation, assessment, characterization, illustration, categorization, specification, integration
- Use Level 3 alternatives: "complete" not "comprehensive", "advanced" not "sophisticated", "detailed" not "elaborate", "modern" not "contemporary", "large" not "substantial", "view" not "perspective", "system" not "framework"` :
targetLevel === 4 ? `- EVERY WORD will be checked against NGSL 1-2500 limit
- STRICTLY BANNED Level 5+ words: paradigm, intricate, fundamental, elaborate theoretical frameworks, phenomenological, epistemological, ontological, methodological considerations, comprehensive theoretical synthesis, sophisticated analytical framework, paradigmatic shifts, theoretical underpinnings, conceptual foundations, analytical rigor, methodological sophistication, theoretical complexity, conceptual intricacy
- Use Level 4 alternatives: "model" not "paradigm", "complex" not "intricate", "basic" not "fundamental"` :
`- Level 5: NO vocabulary restrictions - use the most sophisticated academic language available
- REQUIRED: Must use advanced academic vocabulary to demonstrate C1+ proficiency
- AVOID simple alternatives: Use "paradigm" not "model", "intricate" not "complex", "fundamental" not "basic"`}

🚨 CRITICAL WORD COUNT REQUIREMENTS 🚨
- Level ${targetLevel} MUST have EXACTLY ${wordCountRequirements[targetLevel as keyof typeof wordCountRequirements]}
- Current text has ${originalText.split(' ').length} words
- TARGET: ${targetLevel === 3 ? 'MINIMUM 180 words, TARGET 220 words' : targetLevel === 2 ? 'MINIMUM 120 words, TARGET 150 words' : 'MINIMUM 80 words, TARGET 100 words'}
- ${targetLevel === 3 ? '⚠️ MUST EXPAND: Add detailed explanations, examples, context, and elaboration' : targetLevel === 2 ? '⚠️ Moderate detail with clear explanations' : '⚠️ Keep simple but meet minimum word count'}

🔥 EXPANSION MANDATORY FOR LEVEL ${targetLevel === 3 ? '3 (Advanced)' : targetLevel === 2 ? '2 (Intermediate)' : '1 (Beginner)'} 🔥

${targetLevel === 3 ? `⚠️ LEVEL 3 ADVANCED INSTRUCTIONS ⚠️
- MUST reach minimum 180 words
- Add multiple paragraphs with detailed explanations
- Include specific examples and case studies  
- Elaborate on historical context and development
- Discuss implications and perspectives
- Add comprehensive analysis with wide vocabulary` : ''}

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

${targetLevel === 3 ? `🚨 LEVEL 3 GRAMMAR RESTRICTIONS 🚨
- Basic compound and complex sentences allowed
- Simple subordinate clauses with "because/when/if/that" ONLY
- Basic relative clauses: "The man who..." "The book that..."
- NO participle phrases as sentence starters
- NO subjunctive mood or complex conditionals
- NO passive voice with complex agents
- Maximum sentence length: 15 words
- EXAMPLES: "Scientists study this problem because it affects many people." "The method that they use works well." "When people understand the facts, they make better decisions."` : ''}

🎯 FINAL VALIDATION CHECKLIST (MUST CHECK BEFORE OUTPUT):
✓ All vocabulary within NGSL ${range.rangeStart}–${range.rangeEnd}
✓ Word count is ${targetLevel === 3 ? 'EXACTLY 180-220 words' : targetLevel === 2 ? 'EXACTLY 120-160 words' : 'EXACTLY 80-120 words'}
${targetLevel <= 2 ? `✓ NO forbidden words: captivate, enthusiastic, donation, active, involvement, fascinated, exploring, resonates, legacy, admiration, perspectives, significant, demonstrate, essential, particular, participate, contribute, inspire, influence, impact, create, achieve, develop, maintain, various, specific, certain
✓ ALL sentences are simple structure: Subject + Verb + Object
✓ NO participles (-ing/-ed at start): "Working hard" → "He worked hard"
✓ NO complex grammar: because/although/while/who/which/that` : ''}
✓ Same meaning as original text maintained
✓ Expert explanatory style maintained throughout
✓ No dialogue format whatsoever
✓ Content is sufficiently detailed and expanded

⚠️ CRITICAL: COUNT YOUR WORDS BEFORE OUTPUTTING ⚠️
${targetLevel === 1 ? 'If under 80 words, ADD MORE SIMPLE SENTENCES' : targetLevel === 2 ? 'If under 120 words, ADD MORE EXPLANATIONS' : 'If under 180 words, ADD MORE DETAILED CONTENT'}
REMEMBER: Higher levels = MORE words, MORE details, MORE examples

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
              role: 'system',
              content: targetLevel === 1 ? 
                `You are an English teacher for kindergarten children (5-year-olds). CRITICAL RULES: 1) Use ONLY these 200 basic words: be, is, are, have, go, come, see, like, good, big, small, man, woman, boy, girl, home, school, etc. 2) NEVER use: feature, additionally, search, engine, worldwide, saving, providing, used, become. 3) NEVER use -ing words: NOT "saving time" → "it saves time". 4) NEVER use -ed after nouns: NOT "engine used" → "people use engine". 5) ONLY write simple sentences: "Google is a website. People use Google. It helps people." 6) Maximum 5 words per sentence. 7) Think like explaining to a 5-year-old child.` :
                targetLevel === 2 ? `You are an English teacher for beginners. CRITICAL: For Level ${targetLevel}, you MUST write EXACTLY 120-160 words (LONGER than the original). Use ONLY basic vocabulary. NEVER use words like: captivate, enthusiastic, donation, active, involvement, participate, contribute, inspire, influence, impact, create, achieve, develop, maintain, various, specific, certain. Replace with simple words like: catch, excited, gift, busy, taking part, join, give, help, change, make, keep, many, one, some. Every sentence must be simple: Subject + Verb + Object. ADD MORE EXPLANATIONS to reach word count.` :
                'You are an English teacher creating level-appropriate content. Follow all vocabulary constraints strictly.'
            },
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

      const responseData = {
        rewrittenText,
        targetLevel,
        wordCount,
        title: title || `Level ${targetLevel} Reading`,
        success: true
      };
      
      console.log('📤 Sending response:', {
        hasRewrittenText: !!responseData.rewrittenText,
        rewrittenTextLength: responseData.rewrittenText?.length,
        rewrittenTextType: typeof responseData.rewrittenText,
        keys: Object.keys(responseData)
      });

      return NextResponse.json(responseData);

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