# CORS React Example - Deployment Guide

## The Problem We're Solving

NewsAPI's free tier only works from `localhost`. When you deploy to GitHub Pages, direct API calls fail with **HTTP 426 "Upgrade Required"**.

This project demonstrates:
- ❌ **Direct API call** - Fails on GitHub Pages (teaching example)
- ✅ **Cloudflare Worker proxy** - Works on GitHub Pages

## Security: Keeping API Keys Out of Source Control

The `.env` file is in `.gitignore` to prevent committing API keys to your repository. However, the deployed app still needs the API key to work.

### How It Works

1. **Development**: API key is in `.env` file (not committed)
2. **Build**: Vite bundles the API key into the JavaScript files at build time
3. **Deployment**: Only the built files (in `dist/`) are deployed to GitHub Pages
4. **Result**: API key is in the deployed app but not in your source code repository

> ⚠️ **Note**: The API key will be visible in the deployed JavaScript bundle. This is acceptable for demo/learning projects, but for production apps, you should use backend API routes or serverless functions.

## Deployment Instructions

### Prerequisites

Make sure you have a `.env` file with your API key:

```bash
VITE_NEWSAPI_KEY=your_api_key_here
```

### Deploy to GitHub Pages

Simply run:

```bash
npm run deploy
```

This script will:
1. ✅ Check that `.env` exists
2. ✅ Build the app with your API key
3. ✅ Deploy the `dist` folder to GitHub Pages
4. ✅ Keep your API key out of git history

### Manual Deployment (Alternative)

If you prefer to build and deploy separately:

```bash
# Build with environment variables
npm run build

# Deploy the dist folder
npm run deploy:direct
```

## Verifying the Deployment

After deployment, visit your GitHub Pages URL:
```
https://yourusername.github.io/cors-react-example/
```

You should see:
- ❌ **Direct call error: HTTP 426** - This is expected!
- ✅ **Data gathered through the proxy call!** - This should work!

## Troubleshooting

### Issue: "Error: .env file not found!"

**Solution**: Create a `.env` file in the project root with:
```
VITE_NEWSAPI_KEY=your_api_key_here
```

### Issue: Proxy call still fails with HTTP 426

**Possible causes**:
1. Your Cloudflare Worker might not be deployed or configured correctly
2. Test your worker directly: `curl "https://your-worker.workers.dev/?url=https://newsapi.org/v2/top-headlines&country=us&apiKey=YOUR_KEY"`

### Issue: "Permission denied: ./deploy.sh"

**Solution**: Make the script executable:
```bash
chmod +x deploy.sh
```

## Project Structure

```
cors-react-example/
├── .env                    # API keys (NOT committed to git)
├── .gitignore             # Includes .env
├── deploy.sh              # Deployment script
├── src/
│   └── App.jsx            # Main app with dual fetch calls
├── cloudflare-worker-example.js  # Reference Cloudflare Worker code
└── DEBUGGING.md           # Detailed debugging guide
```

## How the Cloudflare Worker Helps

The Cloudflare Worker acts as a proxy:

```
Browser (GitHub Pages) → Cloudflare Worker → NewsAPI
                      ←                    ←
```

Since the request to NewsAPI comes from Cloudflare's servers (not a browser), it bypasses the localhost-only restriction.

## Learn More

- See `DEBUGGING.md` for detailed troubleshooting
- See `cloudflare-worker-example.js` for the worker implementation
- NewsAPI docs: https://newsapi.org/docs
- Cloudflare Workers: https://workers.cloudflare.com/
