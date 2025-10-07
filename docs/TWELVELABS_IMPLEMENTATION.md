# TwelveLabs Integration Implementation Guide

## Quick Start (For Immediate Testing)

Since you already have `TL_API_KEY` configured, you can start testing immediately:

### 1. Create TwelveLabs Index
```bash
# Set up your TwelveLabs index
pnpm tl:setup

# This will output an index ID - add it to your .env:
# TWELVELABS_INDEX_ID=idx_xxxxxxxxxxxx
```

### 2. Test Connection
```bash
# Verify TwelveLabs connection
pnpm tl:health
```

### 3. Upload & Index Videos (Mock Mode)
```bash
# Upload local clips to cloud storage (currently mocked)
pnpm tl:index --upload-only

# Index videos with TwelveLabs
pnpm tl:index --index-only

# Or do both at once
pnpm tl:index
```

### 4. Check Status
```bash
# Check indexing progress
pnpm tl:status

# Test search functionality
pnpm tl:search="touchdown"

# Test multiple queries
pnpm tl:test
```

### 5. Switch from Mock to Real Data
Once videos are indexed, your app will automatically use TwelveLabs instead of mock data when:
- `TL_API_KEY` is set ✅ (you have this)
- `TWELVELABS_INDEX_ID` is set (from step 1)
- Videos are indexed and ready

## Implementation Phases

### Phase 1: Foundation Setup ✅
- [x] TwelveLabs client service 
- [x] Database schema design
- [x] Index creation script
- [x] Environment configuration

### Phase 2: Video Pipeline (Week 1-2)
- [ ] **Install AWS SDK**: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [ ] **Set up cloud storage** (S3 or Cloudflare R2)
- [ ] **Upload existing clips** to cloud storage
- [ ] **Index videos** with TwelveLabs
- [ ] **Database integration** for video tracking

### Phase 3: API Integration (Week 2-3)
- [x] Enhanced search service
- [x] Updated clip routes with TL integration
- [x] Fallback chain (TL → mock data)
- [ ] **Rate limiting and caching**
- [ ] **Error handling improvements**

### Phase 4: Testing & Monitoring (Week 3-4)
- [x] Status checking scripts
- [x] Health monitoring
- [x] Search testing utilities
- [ ] **Performance benchmarking**
- [ ] **Usage analytics**

### Phase 5: Production Readiness (Week 4+)
- [ ] **Cache invalidation strategy**
- [ ] **Webhook for indexing status updates**
- [ ] **Background job queue for video processing**
- [ ] **Metrics and alerting**
- [ ] **Documentation for team**

## Current State

### ✅ Working Now
- TwelveLabs client with search, indexing, health check
- Hybrid API routes (try TL first, fallback to mock)
- Status checking and testing scripts
- Type-safe integration layer

### ⚠️ Partially Working
- Video storage service (mock implementation)
- Database schema (SQL created, not integrated)
- Clip routes (TL integration added but need testing)

### ❌ Needs Implementation
- Real video uploads to cloud storage
- Database persistence of indexed videos
- Production error handling and monitoring
- User-facing features for video management

## Expected Flow

1. **Local Development**: Mock data continues to work
2. **TwelveLabs Setup**: Run setup scripts, get index ID
3. **Video Upload**: Upload your MP4 files to cloud storage
4. **Video Indexing**: TwelveLabs processes videos (takes time)
5. **Search Testing**: Test queries against indexed content
6. **Production Switch**: App automatically uses real data when available

## Cost Considerations

### TwelveLabs Pricing
- **Free**: 100 API calls/day, 10 videos/month
- **Developer**: $99/month, 1K API calls/day, 100 videos/month
- **Pro**: $499/month, 10K API calls/day, 1K videos/month

### Recommendations
- Start with **Free** tier for testing
- Monitor usage with the status scripts
- Upgrade to **Developer** when you have ~50+ videos indexed
- Cache aggressively to minimize API calls

## Troubleshooting

### "No search results found"
- Videos may still be indexing (check with `pnpm tl:status`)
- Try broader queries like "football" or "highlight"
- Verify index ID is correct

### "API rate limit exceeded"
- Add delays between requests
- Implement request queuing
- Consider upgrading TwelveLabs plan

### "Video upload fails"
- Check AWS credentials for cloud storage
- Verify bucket permissions
- Use mock mode for local testing

## Next Steps

1. **Immediate**: Run `pnpm tl:setup` to create your index
2. **This Week**: Set up cloud storage (S3/R2) for video uploads
3. **Next Week**: Upload and index your first batch of videos
4. **Following Week**: Test search quality and tune queries
5. **Month 2**: Add production monitoring and user features

## Questions?

Check the scripts in `scripts/` directory:
- `setup-tl-index.js` - Creates TwelveLabs index
- `index-videos.js` - Uploads and indexes videos  
- `check-tl-status.js` - Status monitoring and testing

Run any script with `--help` or no args to see usage info.