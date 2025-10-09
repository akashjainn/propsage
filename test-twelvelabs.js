// Test TwelveLabs API directly
const fetch = require('node-fetch');

const TL_KEY = 'tlk_3YN6ZF80FS8KBA2VWEZWF0SMM457';
const INDEX_ID = '68d845e918ca9db9c9ddbe3b';

async function testTwelveLabs() {
  try {
    console.log('Testing TwelveLabs API...');
    
    const formData = new (require('form-data'))();
    formData.append('query_text', 'touchdown');
    formData.append('index_id', INDEX_ID);
    formData.append('search_options', 'visual');
    formData.append('search_options', 'audio');
    formData.append('sort_option', 'score');
    formData.append('page_limit', '3');
    
    const response = await fetch('https://api.twelvelabs.io/v1.3/search', {
      method: 'POST',
      headers: {
        'x-api-key': TL_KEY
      },
      body: formData
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }
    
    const data = await response.json();
    console.log('Success! Found', data.data.length, 'clips');
    console.log('First clip:', JSON.stringify(data.data[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTwelveLabs();