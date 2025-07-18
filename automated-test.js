const puppeteer = require('puppeteer');

async function runTest() {
  console.log('🚀 Starting automated test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Reset test
    console.log('📋 Step 1: Reset test');
    await page.goto('http://localhost:3003/start');
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'TestCat');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // 2. Skip quiz
    console.log('📋 Step 2: Skip quiz');
    await page.goto('http://localhost:3003/quiz');
    await page.waitForSelector('button');
    await page.click('button:last-of-type'); // Skip button
    await page.waitForNavigation();
    
    // 3. Read a story
    console.log('📋 Step 3: Read story');
    await page.goto('http://localhost:3003/choose');
    await page.waitForSelector('button');
    await page.click('button:first-of-type'); // First reading option
    await page.waitForNavigation();
    
    // 4. Complete reading
    console.log('📋 Step 4: Complete reading');
    await page.waitForSelector('button');
    
    // Enable console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🚨 DEBUG:') || text.includes('🔍 ADDING WORDS:') || text.includes('累計')) {
        console.log('📊 LOG:', text);
      }
    });
    
    await page.click('button:last-of-type'); // Complete reading button
    await page.waitForTimeout(3000);
    
    // 5. Check localStorage
    const result = await page.evaluate(() => {
      const userProgress = localStorage.getItem('userProgress');
      const totalWordsRead = localStorage.getItem('totalWordsRead');
      return {
        userProgress: userProgress ? JSON.parse(userProgress) : null,
        totalWordsRead,
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('📊 Test Results:', {
      totalWords: result.userProgress?.totalWords || 0,
      totalWordsRead: result.totalWordsRead || 0,
      totalStamps: result.userProgress?.totalStamps || 0,
      keyCount: result.allKeys.length
    });
    
    // 6. Test second reading
    console.log('📋 Step 6: Second reading test');
    await page.goto('http://localhost:3003/choose');
    await page.waitForSelector('button');
    await page.click('button:first-of-type');
    await page.waitForNavigation();
    await page.waitForSelector('button');
    await page.click('button:last-of-type');
    await page.waitForTimeout(3000);
    
    const result2 = await page.evaluate(() => {
      const userProgress = localStorage.getItem('userProgress');
      return {
        userProgress: userProgress ? JSON.parse(userProgress) : null
      };
    });
    
    console.log('📊 Second Reading Results:', {
      totalWords: result2.userProgress?.totalWords || 0,
      totalStamps: result2.userProgress?.totalStamps || 0
    });
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);