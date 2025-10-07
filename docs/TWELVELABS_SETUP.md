# TwelveLabs Integration Setup

## Prerequisites

1. **TwelveLabs Account & API Key**
   - Sign up at [twelvelabs.io](https://twelvelabs.io)
   - Get your API key from the dashboard
   - Choose a plan that supports your expected usage (see rate limits below)

2. **Environment Variables**
   ```bash
   # Already configured in .env
   TL_API_KEY=tlk_304WSJE117GJH2225TDRP2A39ZPG
   TWELVELABS_INDEX_ID=your_index_id_here
   TWELVELABS_BASE_URL=https://api.twelvelabs.io/v1.2
   ```

## Rate Limits (by Plan)
- **Free**: 100 requests/day, 10 videos/month indexing
- **Developer**: 1000 requests/day, 100 videos/month indexing  
- **Pro**: 10k requests/day, 1000 videos/month indexing

## Current Status
- ✅ API Key configured
- ❌ Index ID needs to be created
- ❌ Video storage needs to be set up
- ❌ Database schema needs to be implemented

## Next Steps
1. Create TwelveLabs index
2. Set up video storage (S3/R2)
3. Implement database schema
4. Test with sample videos