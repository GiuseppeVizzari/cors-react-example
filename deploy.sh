#!/bin/bash

# Deployment script for GitHub Pages
# This script temporarily sets the API key for the build, then deploys

echo "🚀 Starting deployment process..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your API keys"
    exit 1
fi

# Source the .env file to get the API key
source .env

# Build the app with the environment variables
echo "📦 Building app with environment variables..."
VITE_NEWSAPI_KEY=$VITE_NEWSAPI_KEY npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to GitHub Pages
echo "🌐 Deploying to GitHub Pages..."
npx gh-pages -d dist

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment successful!"
echo "🎉 Your app should be live at: https://giuseppevizzari.github.io/cors-react-example/"
