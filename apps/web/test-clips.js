// Test the new social clips functionality
const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function testClipsAPI() {
  console.log('Testing Social Clips API...\n');
  
  try {
    // Test 1: Search for Ryan Puglisi clips
    console.log('1. Searching for Ryan Puglisi clips...');
    const puglisCResponse = await fetch(`${API_BASE}/cfb/clips?player=Ryan%20Puglisi&team=Georgia&limit=3`);
    console.log(`Status: ${puglisCResponse.status}`);
    
    if (puglisCResponse.ok) {
      const puglisiData = await puglisCResponse.json();
      console.log(`Found ${puglisiData.clips?.length || 0} clips`);
      if (puglisiData.clips?.length > 0) {
        const clip = puglisiData.clips[0];
        console.log(`- First clip: "${clip.title}" (${clip.platform})`);
        console.log(`- Duration: ${clip.duration}s, Views: ${clip.viewCount}`);
        console.log(`- URL: ${clip.url}`);
      }
    } else {
      const error = await puglisCResponse.text();
      console.log(`Error: ${error}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Search for Georgia team clips
    console.log('2. Searching for Georgia team clips...');
    const georgiaResponse = await fetch(`${API_BASE}/cfb/clips?team=Georgia&stat=passing&limit=3`);
    console.log(`Status: ${georgiaResponse.status}`);
    
    if (georgiaResponse.ok) {
      const georgiaData = await georgiaResponse.json();
      console.log(`Found ${georgiaData.clips?.length || 0} clips`);
      georgiaData.clips?.forEach((clip, i) => {
        console.log(`- Clip ${i + 1}: "${clip.title}"`);
        console.log(`  Platform: ${clip.platform}, Author: ${clip.author}`);
      });
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Test API endpoints structure
    console.log('3. Testing API endpoints...');
    const endpoints = [
      '/cfb/clips?player=Carson%20Beck&limit=1',
      '/cfb/clips/player/cfb_carson_beck?limit=1'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await fetch(`${API_BASE}${endpoint}`);
        console.log(`- Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`- Response type: ${Array.isArray(data.clips) ? 'clips array' : 'unknown'}`);
          console.log(`- Clips count: ${data.clips?.length || 0}`);
        }
      } catch (error) {
        console.log(`- Error: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 4: Check YouTube API key
    console.log('4. YouTube API Status...');
    const hasApiKey = process.env.YOUTUBE_API_KEY || 'hardcoded key present';
    console.log(`YouTube API Key: ${hasApiKey ? 'Present' : 'Missing'}`);
    
    // Try a simple YouTube search
    try {
      const youtubeTest = await fetch(`${API_BASE}/cfb/clips?player=Stetson%20Bennett&team=Georgia&limit=1`);
      if (youtubeTest.ok) {
        const data = await youtubeTest.json();
        console.log(`YouTube search test: ${data.clips?.length > 0 ? 'Success' : 'No results'}`);
        if (data.clips?.length > 0) {
          console.log(`Sample result: "${data.clips[0].title}"`);
        }
      } else {
        console.log(`YouTube search test failed: ${youtubeTest.status}`);
      }
    } catch (error) {
      console.log(`YouTube test error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  testClipsAPI();
}

module.exports = { testClipsAPI };