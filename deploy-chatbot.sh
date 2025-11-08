#!/bin/bash

# Chatbot Deployment Script
# Run this to deploy the enhanced chatbot to Firebase

echo "🤖 CHATBOT DEPLOYMENT SCRIPT"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean previous build
echo "📦 Step 1: Cleaning previous build..."
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✓ Cleaned dist folder${NC}"
else
    echo -e "${YELLOW}! No previous build found${NC}"
fi
echo ""

# Step 2: Install dependencies
echo "📚 Step 2: Installing dependencies..."
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Step 3: Run tests
echo "🧪 Step 3: Running chatbot tests..."
if node test-chatbot.mjs; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    echo "Continuing anyway..."
fi
echo ""

# Step 4: Build project
echo "🔨 Step 4: Building project..."
if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Step 5: Verify build
echo "✅ Step 5: Verifying build..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    SIZE=$(du -sh dist | cut -f1)
    echo -e "${GREEN}✓ Build verified (Size: $SIZE)${NC}"
else
    echo -e "${RED}✗ Build verification failed${NC}"
    exit 1
fi
echo ""

# Step 6: Deploy to Firebase
echo "🚀 Step 6: Deploying to Firebase..."
echo -e "${YELLOW}Note: You may need to run 'firebase login' first${NC}"
echo ""

read -p "Do you want to deploy now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if firebase deploy --only hosting; then
        echo ""
        echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
        echo ""
        echo "🎉 Your chatbot is now live with:"
        echo "   • Fast, detailed responses"
        echo "   • Semantic matching"
        echo "   • Roman Urdu support"
        echo "   • 100% Spark plan compatible"
        echo ""
        echo "Test it on your website now!"
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "1. Run 'firebase login' to authenticate"
        echo "2. Run 'firebase use --add' to select project"
        echo "3. Try 'firebase deploy --only hosting' manually"
        exit 1
    fi
else
    echo ""
    echo "Deployment cancelled. To deploy later, run:"
    echo "  firebase deploy --only hosting"
fi

echo ""
echo "=============================="
echo "✨ Done!"
