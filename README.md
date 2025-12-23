# Strategic Cockpit Dashboard - The Founder's Sentinel

A high-performance, "Signal-over-Noise" strategic dashboard for crypto-executive decision making. This system acts as an automated sentinel, monitoring three layers of market reality: Macro indicators, Crypto Structure, and Prediction Markets.

## 🎯 Overview

The Strategic Cockpit Dashboard provides real-time intelligence on 6 key strategic indicators:

1. **US 10Y Treasury Yield** - "The Gravity"
2. **Fed Net Liquidity** - "The Fuel"
3. **Bitcoin Price** - "The Market Proxy"
4. **Stablecoin Market Cap** - "The Liquidity"
5. **USDT Dominance** - "The Fear Gauge"
6. **RWA Onchain Value** - "The Alpha"

### Key Features

- ⚡ **Zero-latency web interface** with manual refresh capability
- 🔔 **Multi-channel notifications** (Telegram + Email)
- 📊 **Smart Money Radar** - Top 5 Polymarket markets
- 📅 **Catalyst Calendar** - 4-week economic event tracker
- 🎛️ **Customizable alerts** with threshold controls
- 📚 **Comprehensive documentation hub**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd strategic_cockpit
   ```

2. **Run the initialization script**
   ```bash
   ./init.sh
   ```

3. **Configure API keys**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   ```

4. **Start the development server**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the dashboard**
   - Open http://localhost:3000 in your browser

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (Bento Grid Layout)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Hosting**: Vercel

### Backend Pipeline
- **Runtime**: Python 3.9+
- **Automation**: GitHub Actions (Cron + Workflow Dispatch)
- **Storage**: JSON flat files (committed to repo)
- **Notifications**: Telegram Bot API + SMTP/SendGrid

### Data Sources
- **Macro**: FRED API (St. Louis Fed)
- **Crypto**: CoinGecko API
- **DeFi**: DefiLlama API
- **Calendar**: Investing.com (scraped)
- **Prediction Markets**: Polymarket Gamma API

## 📁 Project Structure

```
strategic_cockpit/
├── frontend/               # Next.js application
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   └── public/            # Static assets
├── backend/               # Python data pipeline
│   ├── fetch_metrics.py   # Metrics & Polymarket fetcher
│   ├── fetch_calendar.py  # Economic calendar scraper
│   ├── broadcast.py       # Notification system
│   └── venv/              # Python virtual environment
├── data/                  # JSON data files
│   ├── dashboard_data.json
│   ├── calendar_data.json
│   └── user_config.json
├── .github/workflows/     # GitHub Actions
│   ├── fetch_metrics.yml  # Runs every 15 minutes
│   ├── fetch_calendar.yml # Runs hourly
│   └── update_settings.yml# Repository dispatch
├── docs/                  # Documentation
├── feature_list.json      # Test cases & implementation checklist
├── init.sh                # Setup script
└── README.md              # This file
```

## 🔧 Configuration

### API Keys Required

1. **FRED API** (Free)
   - Get at: https://fred.stlouisfed.org/docs/api/api_key.html

2. **CoinGecko API** (Free tier available)
   - Get at: https://www.coingecko.com/en/api

3. **Telegram Bot Token** (Free)
   - Create bot: https://t.me/BotFather
   - Get your Chat ID: https://t.me/userinfobot

4. **SMTP Credentials** (Gmail, SendGrid, etc.)
   - Gmail: Use App Passwords
   - SendGrid: Free tier available

### GitHub Secrets

For production deployment, add these secrets to your GitHub repository:

- `TELEGRAM_BOT_TOKEN`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `FRED_API_KEY`
- `GITHUB_TOKEN` (for workflow dispatch)

## 🤖 Automated Workflows

### Metrics Update (Every 15 minutes)
- Fetches all 6 key indicators
- Updates Polymarket Top 5
- Runs Smart Diff to detect significant changes
- Broadcasts alerts if thresholds exceeded
- Commits updated dashboard_data.json

### Calendar Update (Hourly)
- Scrapes Investing.com economic calendar
- Checks for events within 12-hour warning window
- Monitors for new data releases (Actual vs Forecast)
- Broadcasts relevant alerts
- Commits updated calendar_data.json

### Settings Update (On-demand)
- Triggered by UI changes
- Updates user_config.json
- Commits changes to repository

## 📊 Dashboard Layout

### Header
- Global Risk Status indicator (Risk On/Risk Off)
- Manual Refresh button
- Settings icon
- Documentation link

### Bento Grid (3 Columns)

**Column 1 - Macro**
- US 10Y Yield
- Fed Net Liquidity
- Smart Money Radar (Polymarket Top 5)

**Column 2 - Market**
- Bitcoin Price (Large Hero Card)
- Stablecoin Market Cap
- USDT Dominance

**Column 3 - Alpha**
- RWA TVL
- Catalyst Calendar (Completed vs Upcoming)

## 🔔 Notification System

### Alert Types

1. **Metric Alerts**: Triggered when changes exceed user-defined thresholds
2. **Pre-Event Warnings**: 12 hours before high-impact economic events
3. **Data Release Alerts**: Immediate notification of Actual vs Forecast
4. **Polymarket Odds Flips**: >10% probability swings

### Adding Subscribers

1. Open Settings Modal
2. Enter Telegram Chat ID or Email address
3. Add a name for reference
4. Save settings
5. Receive test notification to confirm

## 📚 Documentation

Comprehensive documentation is available at `/docs` including:

- **Indicator Encyclopedia**: Definitions and interpretation guides
- **Operational Protocols**: Refresh policies and notification rules
- **Setup Guides**: Step-by-step configuration instructions
- **FAQ**: Common questions and troubleshooting

## 🧪 Testing

The project uses `feature_list.json` as the single source of truth for testing and implementation progress. This file contains 52 detailed test cases covering:

- Functional requirements (data pipeline, notifications, UI interactions)
- Style requirements (layout, typography, responsiveness)
- End-to-end workflows

### Running Tests

```bash
# Frontend tests (when implemented)
cd frontend
npm test

# Backend tests (when implemented)
cd backend
source venv/bin/activate
pytest
```

## 🚀 Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/.next`
3. Add environment variables if needed
4. Deploy!

### GitHub Actions (Backend)

1. Add required secrets to GitHub repository settings
2. Enable GitHub Actions
3. Workflows will run automatically on schedule
4. Monitor in the Actions tab

## 📝 Development Workflow

### For New Features

1. Check `feature_list.json` for pending features
2. Implement the feature
3. Test thoroughly
4. Mark feature as passing in `feature_list.json`
5. Commit with descriptive message
6. Never remove or edit features - only mark as passing

### For Bug Fixes

1. Identify the affected feature in `feature_list.json`
2. Fix the issue
3. Re-test the feature
4. Update if feature status needs correction
5. Commit the fix

## 🤝 Contributing

This is an autonomous development project following a specific workflow:

1. All features are tracked in `feature_list.json`
2. Features can only be marked as passing, never removed
3. Each session should commit progress
4. Use descriptive commit messages
5. Leave the codebase in a working state

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- FRED API by Federal Reserve Bank of St. Louis
- CoinGecko for crypto market data
- DefiLlama for DeFi analytics
- Polymarket for prediction markets data
- Vercel for hosting platform

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check the documentation at `/docs`
- Review `app_spec.txt` for detailed specifications

---

**Built with ❤️ for crypto executives who value signal over noise.**
