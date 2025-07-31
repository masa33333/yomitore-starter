import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateStoryPrompt, STORY_SYSTEM_MESSAGE, parseStoryResponse, validateStoryParameters } from '@/lib/storyPrompt';

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface StoryRequest {
  genre: string;
  mood: string;
  tone?: string;
  vocabLevel: number;
}

interface StoryData {
  id: string;
  title: string;
  enText: string;
  jpText?: string;
  vocabLevel: number;
  genre: string;
  mood: string;
  tone?: string;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json();
    const { genre, mood, tone, vocabLevel } = body;

    // Validate required parameters
    if (!genre || !mood || !vocabLevel) {
      return NextResponse.json(
        { error: 'Missing required parameters: genre, mood, vocabLevel' },
        { status: 400 }
      );
    }

    // Validate story parameters using existing validation
    const validationError = validateStoryParameters({
      genre,
      tone: tone || mood, // Use mood as tone if tone not provided
      feeling: mood,
      level: vocabLevel
    });

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Generate story prompt
    const prompt = generateStoryPrompt({
      genre,
      tone: tone || mood,
      feeling: mood,
      level: vocabLevel
    });

    console.log('🎭 Generating story with OpenAI:', { genre, mood, tone, vocabLevel });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: STORY_SYSTEM_MESSAGE
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const rawResponse = completion.choices[0]?.message?.content;
    
    if (!rawResponse) {
      throw new Error('No response from OpenAI');
    }

    console.log('📖 Raw OpenAI response:', rawResponse.substring(0, 200));

    // Parse the story response
    const { story, title } = parseStoryResponse(rawResponse);

    if (!story || story.trim().length < 50) {
      throw new Error('Generated story is too short or empty');
    }

    // Create story ID and data
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storyData: StoryData = {
      id: storyId,
      title: title || `${genre} Story`,
      enText: story,
      jpText: undefined, // Will be generated on demand if needed
      vocabLevel,
      genre,
      mood,
      tone,
      createdAt: new Date().toISOString()
    };

    // Save story to localStorage (client-side will handle this)
    // For now, we'll return the story data and let the client save it

    console.log('✅ Story generated successfully:', {
      id: storyId,
      title: storyData.title,
      length: story.length,
      vocabLevel
    });

    return NextResponse.json({
      success: true,
      storyId,
      storyData,
      message: 'Story generated successfully'
    });

  } catch (error) {
    console.error('❌ Story generation error:', error);
    
    if (error instanceof Error) {
      // Check for specific OpenAI errors
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API configuration error' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate story. Please try again.' },
      { status: 500 }
    );
  }
}