# Debugging HTTP 426 Error on GitHub Pages

## Problem Summary

Your app works locally but returns **HTTP 426 "Upgrade Required"** when deployed to GitHub Pages.

## Root Cause

**NewsAPI's free tier only allows requests from `localhost`** (policy since May 2020). When deployed to GitHub Pages:
- ✅ **Localhost**: Direct calls work because they originate from `localhost`
- ❌ **GitHub Pages**: Direct calls fail with HTTP 426 because they originate from `yourusername.github.io`

## Your Current Setup

You have two fetch calls in your app:
1. **Direct call** to NewsAPI - Will fail on GitHub Pages (teaching example)
2. **Proxy call** through Cloudflare Worker - Should work on GitHub Pages

## Why the Proxy Should Work

The Cloudflare Worker acts as a middleman:
```
Browser (GitHub Pages) → Cloudflare Worker → NewsAPI → Cloudflare Worker → Browser
```

NewsAPI sees the request coming from Cloudflare's servers (not a browser), so it should work.

## Debugging Steps

### Step 1: Verify Your Cloudflare Worker

Your Cloudflare Worker URL is: `https://soft-cake-cb40.giuseppe-vizzari.workers.dev/`

Test it directly by opening this URL in your browser (replace `YOUR_API_KEY` with your actual key):

```
https://soft-cake-cb40.giuseppe-vizzari.workers.dev/?url=https://newsapi.org/v2/top-headlines&country=us&apiKey=YOUR_API_KEY
```

**Expected result**: You should see JSON data with news articles

**If you get an error**: Your Cloudflare Worker needs to be fixed

### Step 2: Check Your Cloudflare Worker Code

Your worker should:
1. Accept `url`, `country`, and `apiKey` as query parameters
2. Make a fetch request to NewsAPI with those parameters
3. Return the response with proper CORS headers (`Access-Control-Allow-Origin: *`)

See `cloudflare-worker-example.js` for a reference implementation.

### Step 3: Common Issues

#### Issue 1: Missing CORS Headers
If your worker doesn't include CORS headers, the browser will block the response.

**Fix**: Add these headers to your worker's response:
```javascript
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}
```

#### Issue 2: Worker Not Deployed
Make sure your Cloudflare Worker is actually deployed and accessible.

**Test**: Visit `https://soft-cake-cb40.giuseppe-vizzari.workers.dev/` - you should get some response (not a 404)

#### Issue 3: API Key Not Being Passed Correctly
The worker needs to receive the API key and pass it to NewsAPI.

**Check**: Your App.jsx passes the API key like this:
```javascript
proxyUrl.searchParams.set("apiKey", API_KEY);
```

Your worker should extract it like this:
```javascript
const apiKey = url.searchParams.get("apiKey");
```

### Step 4: Deploy and Test

After fixing your Cloudflare Worker:

1. **Build your app**:
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

3. **Test on GitHub Pages**: Visit your deployed site and check:
   - Direct call should show: ❌ Direct call error: HTTP 426
   - Proxy call should show: ✅ Data gathered through the proxy call!

## Alternative Solutions

If you can't fix the Cloudflare Worker:

### Option 1: Use a Different API
Switch to an API that doesn't have localhost restrictions:
- **GNews.io** - 100 free requests/day
- **Currents API**
- **MediaStack**

### Option 2: Upgrade NewsAPI
Pay for NewsAPI's Business plan to remove the localhost restriction.

### Option 3: Create a Simple Backend
Deploy a simple Node.js/Python backend (e.g., on Vercel, Netlify Functions, or Railway) to proxy the requests.

## Need Help?

If you're still getting HTTP 426 errors after checking your Cloudflare Worker, please share:
1. Your Cloudflare Worker code
2. The exact error message from the browser console
3. The response when you test the worker URL directly
