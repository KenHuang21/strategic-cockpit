#!/usr/bin/env python3
"""
Strategic Cockpit Dashboard - AI Morning Briefing
Generates daily executive summary and sends via Telegram
"""

import os
import json
import requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
DASHBOARD_DATA_FILE = DATA_DIR / "dashboard_data.json"
CALENDAR_DATA_FILE = DATA_DIR / "calendar_data.json"
USER_CONFIG_FILE = DATA_DIR / "user_config.json"

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


def load_dashboard_data():
    """Load current dashboard metrics"""
    try:
        with open(DASHBOARD_DATA_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading dashboard data: {e}")
        return None


def load_calendar_data():
    """Load calendar events"""
    try:
        with open(CALENDAR_DATA_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading calendar data: {e}")
        return None


def load_user_config():
    """Load user configuration for subscriber list"""
    try:
        with open(USER_CONFIG_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading user config: {e}")
        return None


def get_next_high_impact_event(calendar_data):
    """Find the next high-impact economic event"""
    if not calendar_data or 'events' not in calendar_data:
        return None

    now = datetime.now()
    upcoming_high_impact = []

    for event in calendar_data['events']:
        if event.get('impact') == 'High' and event.get('status') == 'upcoming':
            try:
                # Parse event date
                event_date_str = event.get('date', '')
                event_time_str = event.get('time', '')
                event_datetime = datetime.strptime(f"{event_date_str} {event_time_str}", "%Y-%m-%d %H:%M")

                if event_datetime > now:
                    upcoming_high_impact.append({
                        'name': event.get('name', ''),
                        'date': event_date_str,
                        'time': event_time_str,
                        'forecast': event.get('forecast', 'N/A'),
                        'datetime': event_datetime
                    })
            except (ValueError, TypeError):
                continue

    # Sort by date and return the next one
    if upcoming_high_impact:
        upcoming_high_impact.sort(key=lambda x: x['datetime'])
        return upcoming_high_impact[0]

    return None


def generate_briefing_with_ai(dashboard_data, calendar_data):
    """Generate briefing using Anthropic Claude API"""

    if not ANTHROPIC_API_KEY:
        print("Warning: ANTHROPIC_API_KEY not set, using fallback briefing")
        return generate_fallback_briefing(dashboard_data, calendar_data)

    # Prepare context for LLM
    metrics = dashboard_data.get('metrics', {})
    risk_status = dashboard_data.get('global_risk_status', 'Unknown')

    # Get next high-impact event
    next_event = get_next_high_impact_event(calendar_data)
    next_event_str = f"{next_event['name']} on {next_event['date']} at {next_event['time']}" if next_event else "No major events scheduled"

    # Build prompt
    prompt = f"""You are an executive briefing assistant for a crypto fund manager. Generate a concise morning briefing with EXACTLY 3 bullet points.

Current Market Data:
- Global Risk Status: {risk_status}
- Bitcoin Price: ${metrics.get('bitcoin_price', {}).get('value', 'N/A'):,.2f} (Change: {metrics.get('bitcoin_price', {}).get('delta', 0):.2f}%)
- US 10Y Yield: {metrics.get('us_10y_yield', {}).get('value', 'N/A')}%
- Fed Net Liquidity: ${metrics.get('fed_net_liquidity', {}).get('value', 'N/A'):.2f}B
- Stablecoin Market Cap: ${metrics.get('stablecoin_market_cap', {}).get('value', 'N/A'):.2f}B
- Next High-Impact Event: {next_event_str}

Generate EXACTLY 3 bullets following this structure:
1. **Regime**: Current market regime (Risk On/Off) and primary macro driver
2. **Flows**: Notable changes in liquidity indicators (Fed, Stablecoins, BTC price action)
3. **Watchlist**: Most important upcoming catalyst to monitor

Keep each bullet to ONE concise sentence (max 20 words). Be direct and actionable."""

    try:
        # Call Anthropic API
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            json={
                'model': 'claude-3-haiku-20240307',  # Use fastest/cheapest model
                'max_tokens': 300,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            },
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            briefing_text = result.get('content', [{}])[0].get('text', '')
            return briefing_text
        else:
            print(f"Anthropic API error: {response.status_code} - {response.text}")
            return generate_fallback_briefing(dashboard_data, calendar_data)

    except Exception as e:
        print(f"Error calling Anthropic API: {e}")
        return generate_fallback_briefing(dashboard_data, calendar_data)


def generate_fallback_briefing(dashboard_data, calendar_data):
    """Generate a simple briefing without AI when API is unavailable"""

    metrics = dashboard_data.get('metrics', {})
    risk_status = dashboard_data.get('global_risk_status', 'Unknown')

    # Get next high-impact event
    next_event = get_next_high_impact_event(calendar_data)

    # Simple rule-based briefing
    btc_delta = metrics.get('bitcoin_price', {}).get('delta', 0)
    btc_trend = "gaining" if btc_delta > 0 else "declining"

    stable_delta = metrics.get('stablecoin_market_cap', {}).get('delta', 0)
    liquidity_trend = "rising" if stable_delta > 0 else "falling"

    briefing = f"""1. **Regime**: Market in {risk_status} mode with BTC {btc_trend} {abs(btc_delta):.2f}%
2. **Flows**: Stablecoin liquidity {liquidity_trend}, Fed Net Liquidity at ${metrics.get('fed_net_liquidity', {}).get('value', 0):.0f}B
3. **Watchlist**: {next_event['name'] if next_event else 'Monitor macro indicators'} - {next_event['date'] if next_event else 'ongoing'}"""

    return briefing


def send_telegram_briefing(briefing_text, subscribers):
    """Send briefing to all Telegram subscribers"""

    if not TELEGRAM_BOT_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not set")
        return False

    # Format message
    message = f"☕ Morning Briefing - {datetime.now().strftime('%B %d, %Y')}\n\n{briefing_text}"

    telegram_subscribers = [s for s in subscribers if s.get('type') == 'telegram']

    if not telegram_subscribers:
        print("No Telegram subscribers found")
        return False

    success_count = 0
    for subscriber in telegram_subscribers:
        chat_id = subscriber.get('id')
        if not chat_id:
            continue

        try:
            response = requests.post(
                f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage',
                json={
                    'chat_id': chat_id,
                    'text': message,
                    'parse_mode': 'Markdown'
                },
                timeout=10
            )

            if response.status_code == 200:
                print(f"✅ Briefing sent to {subscriber.get('name', chat_id)}")
                success_count += 1
            else:
                print(f"❌ Failed to send to {subscriber.get('name', chat_id)}: {response.text}")

        except Exception as e:
            print(f"❌ Error sending to {subscriber.get('name', chat_id)}: {e}")

    return success_count > 0


def main():
    """Main execution function"""
    print("=" * 60)
    print("AI Morning Briefing Generator")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Load data
    print("📊 Loading dashboard data...")
    dashboard_data = load_dashboard_data()
    if not dashboard_data:
        print("❌ Failed to load dashboard data")
        return False

    print("📅 Loading calendar data...")
    calendar_data = load_calendar_data()
    if not calendar_data:
        print("⚠️  Calendar data not available, continuing without it")
        calendar_data = {'events': []}

    print("👥 Loading subscriber list...")
    user_config = load_user_config()
    if not user_config or 'subscribers' not in user_config:
        print("❌ No subscribers configured")
        return False

    # Generate briefing
    print("\n🤖 Generating AI briefing...")
    briefing = generate_briefing_with_ai(dashboard_data, calendar_data)

    if not briefing:
        print("❌ Failed to generate briefing")
        return False

    print("\n" + "=" * 60)
    print("Generated Briefing:")
    print("=" * 60)
    print(briefing)
    print("=" * 60 + "\n")

    # Send to subscribers
    print("📱 Broadcasting to Telegram subscribers...")
    success = send_telegram_briefing(briefing, user_config['subscribers'])

    if success:
        print("\n✅ Morning briefing sent successfully!")
        return True
    else:
        print("\n❌ Failed to send briefing")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
