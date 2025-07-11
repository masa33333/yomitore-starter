import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let query = '';
  let language = 'en';
  
  try {
    const requestData = await request.json();
    query = requestData.query || '';
    language = requestData.language || 'en';
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`🔍 Wikipedia search for: "${query}" (language: ${language})`);

    // Step 1: Search for articles
    const searchUrl = `https://simple.wikipedia.org/w/api.php?` +
      `action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&` +
      `srlimit=5&srprop=snippet|titlesnippet&origin=*`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    console.log(`📊 Wikipedia search results for "${query}":`, {
      resultCount: searchData.query?.search?.length || 0,
      results: searchData.query?.search?.map((r: any) => r.title) || []
    });

    if (!searchData.query?.search || searchData.query.search.length === 0) {
      console.log(`❌ No Wikipedia results found for "${query}"`);
      return NextResponse.json({ 
        error: 'No Wikipedia articles found',
        suggestions: [],
        query: query
      }, { status: 404 });
    }

    // Step 2: Get detailed content for the best match
    const bestMatch = searchData.query.search[0];
    const pageTitle = bestMatch.title;

    console.log(`📖 Best match selected: "${pageTitle}" (score: ${bestMatch.score})`);
    console.log(`📄 Search snippet: "${bestMatch.snippet?.replace(/<[^>]*>/g, '') || 'N/A'}"`);

    // Get page content
    const contentUrl = `https://simple.wikipedia.org/w/api.php?` +
      `action=query&format=json&prop=extracts&exintro=true&explaintext=true&` +
      `exsectionformat=plain&titles=${encodeURIComponent(pageTitle)}&origin=*`;

    const contentResponse = await fetch(contentUrl);
    const contentData = await contentResponse.json();

    const pages = contentData.query?.pages;
    if (!pages) {
      return NextResponse.json({ error: 'Failed to get page content' }, { status: 500 });
    }

    const pageId = Object.keys(pages)[0];
    const pageContent = pages[pageId];

    if (!pageContent.extract) {
      console.log(`❌ No content extract found for page "${pageTitle}"`);
      return NextResponse.json({ error: 'No content found' }, { status: 404 });
    }

    // Content quality check
    const contentLength = pageContent.extract.length;
    const contentPreview = pageContent.extract.substring(0, 200);
    console.log(`📝 Content extracted: ${contentLength} chars`);
    console.log(`📝 Content preview: "${contentPreview}..."`);
    
    // Check if content seems relevant to the query
    const queryWords = query.toLowerCase().split(' ');
    const contentWords = pageContent.extract.toLowerCase();
    const relevanceScore = queryWords.filter(word => contentWords.includes(word)).length / queryWords.length;
    console.log(`🎯 Relevance score: ${relevanceScore} (${queryWords.filter(word => contentWords.includes(word)).length}/${queryWords.length} words match)`);

    // Step 3: Get images (optional)
    const imageUrl = `https://simple.wikipedia.org/w/api.php?` +
      `action=query&format=json&prop=pageimages&piprop=original&` +
      `titles=${encodeURIComponent(pageTitle)}&origin=*`;

    let imageData = null;
    try {
      const imageResponse = await fetch(imageUrl);
      const imageResult = await imageResponse.json();
      const imagePage = imageResult.query?.pages?.[pageId];
      imageData = imagePage?.original?.source || null;
    } catch (error) {
      console.log('⚠️ Could not fetch image:', error);
    }

    // Return structured data
    return NextResponse.json({
      title: pageTitle,
      content: pageContent.extract,
      url: `https://simple.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
      image: imageData,
      searchResults: searchData.query.search.slice(0, 3).map((result: any) => ({
        title: result.title,
        snippet: result.snippet?.replace(/<[^>]*>/g, '') || ''
      }))
    });

  } catch (error) {
    console.error('❌ Wikipedia search error:', error);
    return NextResponse.json(
      { error: 'Wikipedia search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}