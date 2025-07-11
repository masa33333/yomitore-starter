import { NextResponse } from 'next/server';

// Wikipedia検索を実行する関数（フォールバック付き）
async function performWikipediaSearch(query: string, useSimple: boolean = true): Promise<any> {
  const baseUrl = useSimple ? 'https://simple.wikipedia.org' : 'https://en.wikipedia.org';
  const searchUrl = `${baseUrl}/w/api.php?` +
    `action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&` +
    `srlimit=5&srprop=snippet|titlesnippet&origin=*`;

  console.log(`🌐 ${useSimple ? 'Simple' : 'Regular'} Wikipedia search URL: ${searchUrl}`);

  const response = await fetch(searchUrl);
  
  if (!response.ok) {
    console.error(`❌ ${useSimple ? 'Simple' : 'Regular'} Wikipedia API error: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error(`❌ Error response: ${errorText}`);
    throw new Error(`Wikipedia API error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`📊 ${useSimple ? 'Simple' : 'Regular'} Wikipedia results:`, {
    resultCount: data.query?.search?.length || 0,
    results: data.query?.search?.map((r: any) => r.title) || []
  });
  
  return { data, baseUrl };
}

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

    let searchData, baseUrl;
    
    try {
      // Step 1: Try Simple English Wikipedia first
      const simpleResult = await performWikipediaSearch(query, true);
      searchData = simpleResult.data;
      baseUrl = simpleResult.baseUrl;
    } catch (error) {
      console.log(`⚠️ Simple Wikipedia failed, trying regular Wikipedia...`);
      try {
        // Step 2: Fallback to regular English Wikipedia
        const regularResult = await performWikipediaSearch(query, false);
        searchData = regularResult.data;
        baseUrl = regularResult.baseUrl;
      } catch (fallbackError) {
        console.error(`❌ Both Wikipedia sources failed:`, fallbackError);
        throw fallbackError;
      }
    }
    
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

    // Get page content using the same base URL that worked for search
    const contentUrl = `${baseUrl}/w/api.php?` +
      `action=query&format=json&prop=extracts&exintro=true&explaintext=true&` +
      `exsectionformat=plain&titles=${encodeURIComponent(pageTitle)}&origin=*`;

    console.log(`📖 Fetching content from: ${contentUrl}`);
    
    const contentResponse = await fetch(contentUrl);
    
    if (!contentResponse.ok) {
      console.error(`❌ Content fetch error: ${contentResponse.status} ${contentResponse.statusText}`);
      const errorText = await contentResponse.text();
      console.error(`❌ Content error response: ${errorText}`);
      throw new Error(`Content fetch error: ${contentResponse.status}`);
    }
    
    const contentData = await contentResponse.json();
    console.log(`📖 Content response structure:`, Object.keys(contentData));

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
    const imageUrl = `${baseUrl}/w/api.php?` +
      `action=query&format=json&prop=pageimages&piprop=original&` +
      `titles=${encodeURIComponent(pageTitle)}&origin=*`;

    let imageData = null;
    try {
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        const imageResult = await imageResponse.json();
        const imagePage = imageResult.query?.pages?.[pageId];
        imageData = imagePage?.original?.source || null;
      }
    } catch (error) {
      console.log('⚠️ Could not fetch image:', error);
    }

    // Construct the correct Wikipedia URL based on which source worked
    const wikiUrl = `${baseUrl}/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
    console.log(`📱 Wikipedia URL: ${wikiUrl}`);

    // Return structured data
    return NextResponse.json({
      title: pageTitle,
      content: pageContent.extract,
      url: wikiUrl,
      image: imageData,
      source: baseUrl.includes('simple') ? 'Simple Wikipedia' : 'Regular Wikipedia',
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