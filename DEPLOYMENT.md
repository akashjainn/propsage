# PropSage Deployment Guide

## Quick Setup for HackGT Demo

### 1. Railway (API Backend)

**Environment Variables to set in Railway dashboard:**

```bash
DEMO_MODE=true
VIDEO_ENABLED=true
PPLX_API_KEY=[your-perplexity-api-key]
TL_API_KEY=[your-twelvelabs-api-key]
PORT=8080
FEATURE_FLAGS=demo_mode:true,video:true
CORS_ORIGIN=https://propsage.vercel.app
```

**Steps:**
1. Go to your Railway project dashboard
2. Click "Variables" tab
3. Add each environment variable above
4. Railway will auto-deploy on next git push

### 2. Vercel (Web Frontend)

**Environment Variables to set in Vercel dashboard:**

```bash
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_VIDEO_ENABLED=true
NEXT_PUBLIC_API_URL=https://[YOUR-RAILWAY-DOMAIN].up.railway.app
NEXT_PUBLIC_API_WS_URL=wss://[YOUR-RAILWAY-DOMAIN].up.railway.app
NEXT_PUBLIC_HACKGT_MODE=true
```

**Steps:**
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable above
4. **Replace `[YOUR-RAILWAY-DOMAIN]`** with your actual Railway URL
5. Click "Redeploy" after adding variables

### 3. Find Your Railway Domain

**Option A: Railway Dashboard**
1. Go to your Railway project
2. Click on your API service
3. Go to "Settings" tab
4. Look for "Public Domain" or "Generated Domain"
5. Copy the URL (should be like `https://propsage-api-production-abcd.up.railway.app`)

**Option B: Railway CLI**
```bash
railway status
```

### 4. Update Vercel with Correct API URL

Once you have your Railway domain:
1. Go to Vercel dashboard
2. Update these variables:
   - `NEXT_PUBLIC_API_URL=https://your-actual-railway-domain.up.railway.app`
   - `NEXT_PUBLIC_API_WS_URL=wss://your-actual-railway-domain.up.railway.app`
3. Redeploy your Vercel app

### 5. Update Railway CORS

After your Vercel deployment:
1. Get your Vercel domain (like `https://propsage.vercel.app`)
2. Update Railway's `CORS_ORIGIN` variable to your Vercel domain
3. Railway will auto-redeploy

## Testing Deployment

### Health Check
```bash
curl https://your-railway-domain.up.railway.app/health
```

Should return:
```json
{
  "demo": true,
  "video": true,
  "provider": "perplexity",
  "ok": true
}
```

### Test Search
Open your Vercel app and try searching for "Anthony Edwards". You should see:
- Network requests to your Railway API
- Fair line calculations
- No more "ERR_CONNECTION_REFUSED" errors

## Common Issues

### 1. CORS Errors
- Make sure `CORS_ORIGIN` on Railway matches your Vercel domain exactly
- Include `https://` in the domain

### 2. WebSocket Connection Failed  
- Check that `NEXT_PUBLIC_API_WS_URL` uses `wss://` (not `ws://`)
- Verify the Railway domain is correct

### 3. 404 on API Routes
- Ensure Railway has the latest code with `/price` endpoint
- Check Railway build logs for TypeScript compilation errors

### 4. Environment Variables Not Loading
- Vercel: Must start with `NEXT_PUBLIC_` for client-side access
- Railway: Regular environment variables work for server-side
- Redeploy after changing environment variables

## Demo Mode Backup

If APIs fail during demo, the app will fall back to cached data:
- Set `DEMO_MODE=true` ensures offline functionality
- Sample data includes Anthony Edwards, Luka Doncic, Jayson Tatum
- All calculations work offline with demo data

## Quick Commands

**Get Railway Domain:**
```bash
railway status
```

**Test API Health:**
```bash
curl https://your-railway-domain/health
```

**Test Price Endpoint:**
```bash
curl -X POST https://your-railway-domain/price \
  -H "Content-Type: application/json" \
  -d '{"playerId":"Anthony Edwards","market":"Points","marketLine":25.5}'
```