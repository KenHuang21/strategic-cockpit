#!/bin/bash

# Strategic Cockpit Dashboard - Initialization Script
# This script sets up and runs the development environment

set -e  # Exit on any error

echo "=========================================="
echo "Strategic Cockpit Dashboard Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "app_spec.txt" ]; then
    echo "${YELLOW}Warning: app_spec.txt not found. Are you in the project root?${NC}"
fi

echo "${BLUE}Step 1: Setting up Frontend (Next.js)${NC}"
echo "----------------------------------------"

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "Creating frontend directory..."
    mkdir -p frontend
fi

cd frontend

# Initialize Next.js project if package.json doesn't exist
if [ ! -f "package.json" ]; then
    echo "Initializing Next.js 14 project..."
    npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
else
    echo "package.json found, skipping Next.js initialization"
fi

# Install required dependencies
echo "Installing frontend dependencies..."
npm install lucide-react recharts

# Install dev dependencies
npm install --save-dev @types/node @types/react @types/react-dom

cd ..

echo ""
echo "${BLUE}Step 2: Setting up Backend (Python)${NC}"
echo "----------------------------------------"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "Creating backend directory..."
    mkdir -p backend
fi

cd backend

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Create requirements.txt if it doesn't exist
if [ ! -f "requirements.txt" ]; then
    echo "Creating requirements.txt..."
    cat > requirements.txt << EOF
# Data fetching
fredapi>=0.5.0
requests>=2.31.0
cloudscraper>=1.2.71

# Telegram notifications
python-telegram-bot>=20.7

# Email notifications
python-dotenv>=1.0.0

# Data processing
pandas>=2.0.0
EOF
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

cd ..

echo ""
echo "${BLUE}Step 3: Creating Project Structure${NC}"
echo "----------------------------------------"

# Create necessary directories
mkdir -p data
mkdir -p .github/workflows
mkdir -p docs

# Create placeholder data files if they don't exist
if [ ! -f "data/dashboard_data.json" ]; then
    echo "Creating placeholder dashboard_data.json..."
    cat > data/dashboard_data.json << EOF
{
  "metrics": {
    "us_10y_yield": {"value": 0, "delta": 0},
    "fed_net_liquidity": {"value": 0, "delta": 0},
    "btc_price": {"value": 0, "delta": 0},
    "stablecoin_mcap": {"value": 0, "delta": 0},
    "usdt_dominance": {"value": 0, "delta": 0},
    "rwa_tvl": {"value": 0, "delta": 0}
  },
  "polymarket_top5": [],
  "last_updated": "1970-01-01T00:00:00Z"
}
EOF
fi

if [ ! -f "data/calendar_data.json" ]; then
    echo "Creating placeholder calendar_data.json..."
    cat > data/calendar_data.json << EOF
{
  "events": [],
  "notification_states": {}
}
EOF
fi

if [ ! -f "data/user_config.json" ]; then
    echo "Creating placeholder user_config.json..."
    cat > data/user_config.json << EOF
{
  "thresholds": {
    "btc_pct": 0.005,
    "stable_pct": 0.001,
    "yield_pct": 0.05,
    "liquidity_pct": 0.02,
    "usdt_dom_pct": 0.005,
    "rwa_pct": 0.03
  },
  "subscribers": []
}
EOF
fi

echo ""
echo "${BLUE}Step 4: Environment Setup${NC}"
echo "----------------------------------------"

# Create .env.example file
if [ ! -f "backend/.env.example" ]; then
    echo "Creating .env.example file..."
    cat > backend/.env.example << EOF
# API Keys
FRED_API_KEY=your_fred_api_key_here
COINGECKO_API_KEY=optional_for_free_tier

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# GitHub (for workflows)
GITHUB_TOKEN=your_github_token_here
EOF
    echo "${YELLOW}⚠️  Please copy backend/.env.example to backend/.env and fill in your API keys${NC}"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
frontend/node_modules/
backend/venv/

# Environment variables
.env
.env.local
backend/.env

# Build outputs
frontend/.next/
frontend/out/
*.pyc
__pycache__/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
EOF
fi

echo ""
echo "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Configure API Keys:"
echo "   - Copy backend/.env.example to backend/.env"
echo "   - Fill in your API keys and credentials"
echo ""
echo "2. Start Development Server:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo ""
echo "4. Test Python scripts:"
echo "   cd backend && source venv/bin/activate"
echo "   python fetch_metrics.py"
echo ""
echo "5. Set up GitHub Actions:"
echo "   - Add secrets to your GitHub repository"
echo "   - Enable workflows in .github/workflows/"
echo ""
echo "${YELLOW}For production deployment:${NC}"
echo "   - Deploy frontend to Vercel"
echo "   - Configure GitHub Actions secrets"
echo "   - Set up scheduled workflows"
echo ""
echo "${GREEN}Happy coding! 🚀${NC}"
echo ""
