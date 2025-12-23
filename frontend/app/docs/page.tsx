import Link from "next/link";
import { ArrowLeft, TrendingUp, DollarSign, Bitcoin, Coins, Shield, Building2, AlertTriangle, RefreshCw, Bell, MessageSquare } from "lucide-react";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Documentation Hub
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Strategic Cockpit Documentation
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your comprehensive guide to understanding and using the Strategic Cockpit Dashboard -
            a signal-over-noise platform for crypto-executive decision making.
          </p>
        </section>

        {/* Table of Contents */}
        <section className="mb-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Navigation
          </h3>
          <nav className="space-y-2">
            <a href="#indicators" className="block text-blue-600 dark:text-blue-400 hover:underline">
              → Indicator Encyclopedia
            </a>
            <a href="#risk-status" className="block text-blue-600 dark:text-blue-400 hover:underline ml-4">
              • Risk On/Risk Off Logic
            </a>
            <a href="#operational" className="block text-blue-600 dark:text-blue-400 hover:underline">
              → Operational Protocols
            </a>
            <a href="#setup" className="block text-blue-600 dark:text-blue-400 hover:underline">
              → Setup Guide
            </a>
          </nav>
        </section>

        {/* Indicator Encyclopedia */}
        <section id="indicators" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2" />
            Indicator Encyclopedia
          </h2>

          {/* US 10Y Treasury Yield */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              US 10Y Treasury Yield - "The Gravity"
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">What it is:</strong> The yield on 10-year
                U.S. Treasury bonds, representing the risk-free rate of return in financial markets.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Data Source:</strong> FRED (Federal Reserve
                Economic Data) - Series: DGS10
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Rising yields make
                risk assets like crypto less attractive as safe bonds offer better returns. Falling yields
                signal "Risk On" as investors seek higher returns elsewhere.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Interpretation:</strong>
                <br />• Rising (↑): Bearish for crypto - capital flows to safer assets
                <br />• Falling (↓): Bullish for crypto - investors seek yield in risk assets
                <br />• Threshold: Changes &gt;5% trigger alerts
              </p>
            </div>
          </div>

          {/* Fed Net Liquidity */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Fed Net Liquidity - "The Fuel"
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">What it is:</strong> The net liquidity
                provided by the Federal Reserve, calculated as the Fed's balance sheet minus Treasury General
                Account and Reverse Repo balances.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Data Source:</strong> FRED - Aggregated
                from WALCL, WTREGEN, RRPONTSYD
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Why it matters:</strong> More liquidity
                means more money available for risk assets. This is the "fuel" that drives bull markets.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Interpretation:</strong>
                <br />• Rising (↑): Bullish - more money entering the system
                <br />• Falling (↓): Bearish - liquidity being drained
                <br />• Threshold: Changes &gt;2% trigger alerts
              </p>
            </div>
          </div>

          {/* Bitcoin Price */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Bitcoin className="w-5 h-5 mr-2 text-orange-500" />
              Bitcoin Price - "The Market Proxy"
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">What it is:</strong> The current market
                price of Bitcoin (BTC) in USD, the dominant cryptocurrency by market capitalization.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Data Source:</strong> CoinGecko API -
                Real-time price data
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Bitcoin serves
                as the primary indicator of crypto market sentiment and drives correlation across all digital assets.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Interpretation:</strong>
                <br />• Rising (↑): Risk appetite increasing across crypto
                <br />• Falling (↓): Risk-off sentiment, capital preservation mode
                <br />• Threshold: Changes &gt;0.5% trigger alerts
              </p>
            </div>
          </div>

          {/* Stablecoin Market Cap */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Coins className="w-5 h-5 mr-2 text-green-600" />
              Stablecoin Market Cap - "The Liquidity"
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">What it is:</strong> The total market
                capitalization of all major stablecoins (USDT, USDC, DAI, etc.) across blockchain networks.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Data Source:</strong> DefiLlama API -
                Aggregated stablecoin data
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Stablecoins
                represent "dry powder" - capital ready to deploy into crypto assets. Rising supply signals
                incoming liquidity.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Interpretation:</strong>
                <br />• Rising (↑): Fresh capital entering crypto markets
                <br />• Falling (↓): Capital leaving crypto ecosystem
                <br />• Threshold: Changes &gt;0.1% trigger alerts
              </p>
            </div>
          </div>

          {/* USDT Dominance */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              USDT Dominance - "The Fear Gauge"
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">What it is:</strong> The percentage of
                total stablecoin market cap held by Tether (USDT), calculated as USDT supply / Total Stablecoin Supply.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Data Source:</strong> DefiLlama API -
                Calculated from stablecoin supplies
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Why it matters:</strong> High USDT
                dominance suggests risk-off behavior (preference for highest-liquidity stablecoin).
                Declining dominance shows diversification into other stablecoins.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Interpretation:</strong>
                <br />• Rising (↑): Flight to liquidity, risk-off sentiment
                <br />• Falling (↓): Diversification, risk-on sentiment
                <br />• Threshold: Changes &gt;0.5% trigger alerts
              </p>
            </div>
          </div>

          {/* RWA TVL */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-purple-600" />
              RWA TVL - "The Alpha"
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">What it is:</strong> Total Value Locked
                in Real World Assets (RWA) protocols on-chain, representing tokenized real-world assets like
                treasuries, real estate, and commodities.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Data Source:</strong> DefiLlama API -
                RWA category aggregation
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Why it matters:</strong> RWA growth
                represents institutional capital adoption and crypto infrastructure maturing. This is the
                cutting-edge narrative.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Interpretation:</strong>
                <br />• Rising (↑): Institutional adoption accelerating
                <br />• Falling (↓): Capital rotation away from RWAs
                <br />• Threshold: Changes &gt;3% trigger alerts
              </p>
            </div>
          </div>
        </section>

        {/* Risk On/Risk Off Logic */}
        <section id="risk-status" className="mb-12 bg-gradient-to-br from-green-50 to-red-50 dark:from-green-900/20 dark:to-red-900/20 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Understanding Risk On / Risk Off Status
          </h3>
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p>
              The global Risk Status is automatically determined by analyzing the relationship between
              Treasury Yields and Fed Net Liquidity:
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
              <p className="font-semibold text-green-700 dark:text-green-400 mb-2">
                ✅ Risk On Conditions:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>10Y Treasury Yield is falling (↓) - Safe assets less attractive</li>
                <li>AND Fed Net Liquidity is rising (↑) - More money in the system</li>
                <li>Result: Capital flows into risk assets like crypto</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
              <p className="font-semibold text-red-700 dark:text-red-400 mb-2">
                ⚠️ Risk Off Conditions:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>10Y Treasury Yield is rising (↑) - Safe assets more attractive</li>
                <li>OR Fed Net Liquidity is falling (↓) - Liquidity being drained</li>
                <li>Result: Capital preservation, flight to safety</li>
              </ul>
            </div>
            <p className="text-sm italic">
              Note: The system uses 7-day change trends to determine direction. Short-term noise is filtered out.
            </p>
          </div>
        </section>

        {/* Operational Protocols */}
        <section id="operational" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <RefreshCw className="w-6 h-6 mr-2" />
            Operational Protocols
          </h2>

          <div className="space-y-6">
            {/* Data Refresh Policy */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Data Refresh Policy
              </h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>
                  <strong className="text-gray-900 dark:text-white">Automatic Updates:</strong>
                  <br />• Metrics refresh every 15 minutes via GitHub Actions
                  <br />• Calendar updates hourly for economic events
                  <br />• Polymarket data updates every 15 minutes
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Manual Refresh:</strong>
                  <br />• Click the "Refresh" button in the header to trigger immediate update
                  <br />• Manual refresh triggers GitHub Actions workflow via Repository Dispatch
                  <br />• Updates typically complete within 60 seconds
                  <br />• Rate limit: Maximum 1 manual refresh per minute
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Data Staleness:</strong>
                  <br />• Dashboard displays "Last Updated" timestamp
                  <br />• Data should never be more than 15 minutes old under normal operation
                  <br />• If data is stale, check GitHub Actions workflow status
                </p>
              </div>
            </div>

            {/* Notification Rules */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Rules
              </h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>
                  <strong className="text-gray-900 dark:text-white">Metric Alerts:</strong>
                  <br />• Triggered when any metric changes by more than your configured threshold
                  <br />• "Smart Diff" logic compares current vs. previous values
                  <br />• Default thresholds: BTC 0.5%, Stablecoins 0.1%, Yields 5%, etc.
                  <br />• Customize thresholds in Settings Modal
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Calendar Alerts:</strong>
                  <br />• Pre-Event Warning: 12 hours before High Impact economic events
                  <br />• Data Release: Immediate notification when actual data is published
                  <br />• Surprise coloring: Green if beats forecast, red if misses
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Polymarket Alerts:</strong>
                  <br />• Triggered on significant odds swings (&gt;10% change)
                  <br />• Only for markets in Finance/Economics/Crypto categories
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Delivery Channels:</strong>
                  <br />• Telegram: Instant notifications via bot
                  <br />• Email: Alerts sent via SMTP
                  <br />• Broadcasts to all subscribers in your list
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Setup Guide */}
        <section id="setup" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2" />
            Setup Guide
          </h2>

          {/* How to Find Telegram Chat ID */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              How to Find Your Telegram Chat ID
            </h3>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                To receive alerts via Telegram, you need to find your unique Chat ID and add it to the
                Settings Modal. Follow these steps:
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Method 1: Using @userinfobot (Recommended)
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open Telegram on your phone or desktop</li>
                  <li>Search for <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">@userinfobot</code></li>
                  <li>Start a chat with the bot</li>
                  <li>Send any message (e.g., "hi")</li>
                  <li>The bot will reply with your user information, including your Chat ID</li>
                  <li>Copy the numeric ID (e.g., 123456789)</li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Method 2: Using @RawDataBot
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Search for <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">@RawDataBot</code> in Telegram</li>
                  <li>Send any message to the bot</li>
                  <li>Look for the "id" field in the response JSON</li>
                  <li>Copy the numeric Chat ID</li>
                </ol>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Adding Your Chat ID to the Dashboard
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the Settings icon in the dashboard header</li>
                  <li>In the "Add New Subscriber" section, ensure "Telegram" is selected</li>
                  <li>Enter your name (for your reference)</li>
                  <li>Paste your Chat ID in the "Telegram Chat ID" field</li>
                  <li>Click "Add Subscriber"</li>
                  <li>You'll receive a confirmation that you've been added</li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  ⚠️ Important Notes
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your Chat ID is always a number (positive or negative)</li>
                  <li>Group chat IDs are typically negative numbers</li>
                  <li>Keep your Chat ID private - it's like a phone number for Telegram bots</li>
                  <li>You must have started a chat with the Strategic Cockpit bot to receive messages</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email Setup */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Setting Up Email Alerts
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                Email alerts are simpler to set up than Telegram:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Click the Settings icon in the dashboard header</li>
                <li>Click the "Email" toggle button</li>
                <li>Enter your name and email address</li>
                <li>Click "Add Subscriber"</li>
                <li>Alerts will be sent to your email via SMTP</li>
              </ol>
              <p className="text-sm italic">
                Note: Check your spam folder if you don't receive alerts initially. Add the sender
                to your contacts to ensure delivery.
              </p>
            </div>
          </div>

          {/* Adjusting Alert Thresholds */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Adjusting Alert Thresholds
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                Customize how sensitive alerts are for each metric:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Open the Settings Modal</li>
                <li>Scroll to the "Alert Thresholds" section</li>
                <li>Use the sliders to adjust sensitivity for each metric</li>
                <li>Lower values = more alerts (more sensitive)</li>
                <li>Higher values = fewer alerts (less noise)</li>
                <li>Click "Save Thresholds" to persist your changes</li>
              </ol>
              <p className="text-sm">
                <strong className="text-gray-900 dark:text-white">Recommended Settings:</strong>
                <br />• Bitcoin: 0.5% (default) - catches significant moves without noise
                <br />• Stablecoins: 0.1% (default) - very sensitive, indicates capital flows
                <br />• Yields: 5% (default) - filters daily noise, catches major shifts
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                Why is the data more than 15 minutes old?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Check the GitHub Actions workflows to ensure they're running successfully. API rate limits
                or connectivity issues could delay updates. Try clicking the Manual Refresh button.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                I'm not receiving Telegram notifications. What should I check?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                1) Verify your Chat ID is correct. 2) Ensure you've started a chat with the Strategic Cockpit bot.
                3) Check that your thresholds aren't set too high. 4) Verify the bot has the correct API token configured.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                How do I remove myself from the subscriber list?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Open the Settings Modal, find your entry in the "Current Subscribers" list, and click the
                red trash icon next to your name. Confirm the removal when prompted.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                Can I suggest a new metric to track?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Yes! Use the "Suggest Metric" feature in the Settings Modal to submit a GitHub Issue with
                your proposal. The team will review and consider it for future updates.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                What's the difference between WoW and 7-day change?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                They're the same thing! "Week-over-Week" (WoW) is calculated as the 7-day change, comparing
                today's value to the value from exactly 7 days ago.
              </p>
            </details>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 pt-8 text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            Strategic Cockpit Dashboard v5.0 - The Founder's Sentinel
          </p>
          <p className="text-sm">
            Built with Next.js, Python, and GitHub Actions • Data from FRED, CoinGecko, DefiLlama, and Polymarket
          </p>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-2 inline-block">
            Return to Dashboard →
          </Link>
        </footer>
      </div>
    </main>
  );
}
