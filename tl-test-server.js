const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json());

// TwelveLabs configuration from your .env
const TL_CONFIG = {
  apiKey: 'tlk_3YN6ZF80FS8KBA2VWEZWF0SMM457',
  indexId: '68d845e918ca9db9c9ddbe3b',
  baseUrl: 'https://api.twelvelabs.io/v1.3'
};

async function searchTwelveLabs(query, limit = 5) {
  const formData = new FormData();
  formData.append('query_text', query);
  formData.append('index_id', TL_CONFIG.indexId);
  formData.append('search_options', 'visual');
  formData.append('search_options', 'audio');
  formData.append('sort_option', 'score');
  formData.append('page_limit', limit.toString());
  
  const response = await fetch(`${TL_CONFIG.baseUrl}/search`, {
    method: 'POST',
    headers: {
      'x-api-key': TL_CONFIG.apiKey
    },
    body: formData
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TwelveLabs API Error ${response.status}: ${text}`);
  }
  
  return await response.json();
}

// Test endpoint to verify TwelveLabs is working
app.get('/clips', async (req, res) => {
  try {
    const query = req.query.q || req.query.player || 'touchdown';
    const limit = parseInt(req.query.limit) || 5;
    
    console.log(`🔍 Searching TwelveLabs for: "${query}"`);
    
    const result = await searchTwelveLabs(query, limit);
    
    const clips = result.data.map(item => ({
      id: `tl_${item.video_id}_${item.start}`,
      videoId: item.video_id,
      title: `Video Clip (${item.start}s-${item.end}s)`,
      description: item.transcription || 'Video moment',
      startTime: item.start,
      endTime: item.end,
      duration: item.end - item.start,
      score: item.score,
      confidence: item.confidence,
      thumbnailUrl: item.thumbnail_url,
      url: item.thumbnail_url, // Using thumbnail as placeholder URL
      type: 'twelvelabs'
    }));
    
    console.log(`✅ Found ${clips.length} clips`);
    
    res.json({
      clips,
      available: true,
      totalFound: clips.length,
      cached: false,
      query,
      source: 'TwelveLabs API v1.3'
    });
    
  } catch (error) {
    console.error('❌ TwelveLabs Error:', error);
    res.status(500).json({
      clips: [],
      available: false,
      error: error.message,
      source: 'TwelveLabs API v1.3'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    twelvelabs: {
      configured: !!TL_CONFIG.apiKey,
      indexId: TL_CONFIG.indexId,
      baseUrl: TL_CONFIG.baseUrl
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'PropSage TwelveLabs API Test Server',
    endpoints: {
      clips: '/clips?q=touchdown',
      health: '/health'
    },
    examples: {
      searchTouchdowns: '/clips?q=touchdown&limit=3',
      searchPlayer: '/clips?player=Haynes King&limit=2',
      searchFumbles: '/clips?q=fumble&limit=2'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PropSage TwelveLabs Test Server running on port ${PORT}`);
  console.log(`🎥 Test clips endpoint: http://localhost:${PORT}/clips?q=touchdown`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});