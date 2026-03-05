#!/bin/bash

# Setup script for GitHub repository and Railway deployment

echo "🚀 Setting up ShinyHunt.app for GitHub and Railway..."

# Initialize git repository
echo "📦 Initializing git repository..."
git init

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: ShinyHunt.app - Shiny Pokémon hunting tracker"

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "🔐 GitHub CLI detected!"
    read -p "Do you want to create the GitHub repo automatically? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📤 Creating GitHub repository..."
        gh repo create shinyhunt-app --public --source=. --remote=origin --push
        echo "✅ Repository created and pushed to GitHub!"
    fi
else
    echo "📋 GitHub CLI not found. Please create the repo manually:"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: shinyhunt-app"
    echo "3. Description: Shiny Pokémon hunting tracker"
    echo "4. Choose Public or Private"
    echo "5. DO NOT initialize with README (we already have one)"
    echo "6. Click 'Create repository'"
    echo ""
    echo "Then run these commands:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/shinnyhunt-app.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
fi

echo ""
echo "✅ Setup complete! Next steps:"
echo "1. Push your code to GitHub (if not done automatically)"
echo "2. Go to https://railway.app"
echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
echo "4. Select your shinyhunt-app repository"
echo "5. Railway will auto-detect and deploy"
echo "6. Add your custom domain in Railway project settings"
