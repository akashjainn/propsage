import express from 'express';
import cors from 'cors';
// Import your existing TwelveLabs client
const { twelveLabsClient } = require('./apps/api/src/services/twelve-labs-client.js');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint to verify TwelveLabs is working
app.get('/test-tl', async (req, res) => {
  try {
    const query = req.query.q || 'touchdown';
    console.log(`Searching TwelveLabs for: "${query}"`);
    
    const moments = await twelveLabsClient.searchMoments([query], undefined, 3);
    
    const clips = moments.map(moment => ({
      id: moment.id,
      videoId: moment.videoId,
      title: moment.label,
      startTime: moment.startTime,
      endTime: moment.endTime,
      score: moment.score,
      confidence: moment.confidence,
      thumbnailUrl: moment.thumbnailUrl
    }));
    
    res.json({
      success: true,
      query,
      clips,
      totalFound: clips.length
    });
    
  } catch (error) {
    console.error('TwelveLabs Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'TwelveLabs Test Server',
    endpoints: {
      testTL: '/test-tl?q=touchdown'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TwelveLabs Test Server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test-tl?q=touchdown`);
});