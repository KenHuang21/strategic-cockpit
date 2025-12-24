#!/bin/bash
# Deployment Helper Script

echo "🚀 Strategic Cockpit Deployment Helper"
echo "========================================"

# 1. GitHub Configuration
echo ""
echo "📦 GitHub Configuration"
echo "-----------------------"
echo "Using repository: https://github.com/KenHuang21/strategic-cockpit.git"

# Check if remote exists
if git remote | grep -q "^origin$"; then
    echo "✅ Remote 'origin' already exists."
    git remote set-url origin https://github.com/KenHuang21/strategic-cockpit.git
    echo "   Updated remote URL."
else
    git remote add origin https://github.com/KenHuang21/strategic-cockpit.git
    echo "✅ Added remote 'origin'."
fi

echo ""
echo "⚠️  ACTION REQUIRED: Push to GitHub"
echo "   Run the following command manually (requires authentication):"
echo "   git push -u origin main"

# 2. Vercel Configuration
echo ""
echo "⚡ Vercel Deployment"
echo "-------------------"
echo "To deploy to Vercel:"
echo "1. Go to https://vercel.com/new"
echo "2. Select 'KenHuang21/strategic-cockpit' repository"
echo "3. Configure Environment Variables (copy from backend/.env if needed)"
echo "4. Click Deploy"
echo ""
echo "✅ Setup script complete!"
