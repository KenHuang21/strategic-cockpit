#!/usr/bin/env python3
"""
Strategic Cockpit Dashboard - Economic Calendar Scraper
Fetches US economic events from Investing.com for 4-week forward look
"""

import os
import json
import cloudscraper
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
import time
import re

# Try to import BeautifulSoup, use fallback if not available
try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False
    print("⚠️  BeautifulSoup4 not installed, using fallback calendar data")
    print("   To enable scraping: pip install beautifulsoup4>=4.12.0")

# Load environment variables from backend/.env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
CALENDAR_DATA_FILE = DATA_DIR / "calendar_data.json"

# Investing.com calendar URL
CALENDAR_BASE_URL = "https://www.investing.com/economic-calendar/"


def load_existing_calendar():
    """Load existing calendar data"""
    try:
        with open(CALENDAR_DATA_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "events": [],
            "notification_states": {}
        }


def parse_impact_level(impact_element):
    """Parse impact level from HTML element"""
    if not impact_element:
        return "Low"

    # Check for bull icons (Investing.com uses bull icons for impact)
    bulls = impact_element.find_all('i', class_='grayFullBullishIcon')
    if len(bulls) >= 3:
        return "High"
    elif len(bulls) >= 2:
        return "Medium"
    else:
        return "Low"


def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ""
    return text.strip().replace('\n', '').replace('\t', '').replace('  ', ' ')


def parse_event_time(time_str):
    """Parse event time from string"""
    if not time_str:
        return None

    # Remove any extra spaces and convert to 24-hour format
    time_str = clean_text(time_str)

    try:
        # Parse time like "08:30 AM" or "2:00 PM"
        if 'AM' in time_str or 'PM' in time_str:
            time_obj = datetime.strptime(time_str, "%I:%M %p")
            return time_obj.strftime("%H:%M")
        else:
            # Already in 24-hour format
            return time_str
    except:
        return None


def fetch_investing_calendar():
    """
    Fetch economic calendar from Investing.com
    Note: This is a simplified implementation that uses the existing mock data structure.
    In production, this would scrape real data from Investing.com.
    """
    print("Fetching Investing.com economic calendar...")

    # If BeautifulSoup is not available, use fallback immediately
    if not BS4_AVAILABLE:
        print("⚠️  BeautifulSoup4 not available, using fallback data")
        return generate_fallback_calendar()

    try:
        # Create cloudscraper instance to bypass Cloudflare
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'desktop': True
            }
        )

        # Calculate date range (4 weeks forward)
        start_date = datetime.now()
        end_date = start_date + timedelta(weeks=4)

        # Format dates for URL (YYYY-MM-DD)
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")

        # Construct URL with date parameters
        url = f"{CALENDAR_BASE_URL}?dateFrom={start_str}&dateTo={end_str}&timeZone=8&timeFilter=timeRemain&currentTab=custom&countries%5B%5D=5&importances%5B%5D=2&importances%5B%5D=3"

        print(f"Fetching calendar from: {url}")

        # Add headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
        }

        # Fetch the page
        response = scraper.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        print(f"✅ Successfully fetched calendar page (status: {response.status_code})")

        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find calendar events table
        # Note: Investing.com structure may vary, this is a best-effort implementation
        events = []

        # Try to find the events table
        calendar_table = soup.find('table', {'id': 'economicCalendarData'})

        if not calendar_table:
            print("⚠️  Calendar table not found, using fallback data")
            return generate_fallback_calendar()

        # Parse table rows
        rows = calendar_table.find_all('tr', class_='js-event-item')

        print(f"Found {len(rows)} calendar rows")

        for row in rows[:20]:  # Limit to first 20 events
            try:
                # Extract event data
                event_id = row.get('data-event-id', '')

                # Date
                date_elem = row.find('td', class_='first left time')
                event_date = None
                if date_elem:
                    date_str = clean_text(date_elem.get('title', ''))
                    if date_str:
                        try:
                            event_date = datetime.strptime(date_str, "%A, %B %d, %Y").strftime("%Y-%m-%d")
                        except:
                            pass

                # Time
                time_elem = row.find('td', class_='time')
                event_time = parse_event_time(clean_text(time_elem.text)) if time_elem else None

                # Country flag - ensure it's US
                country_elem = row.find('td', class_='left flagCur')
                if country_elem and 'united_states' not in country_elem.get('title', '').lower():
                    continue  # Skip non-US events

                # Impact
                impact_elem = row.find('td', class_='sentiment')
                impact = parse_impact_level(impact_elem)

                # Only include High and Medium impact events
                if impact == "Low":
                    continue

                # Event name
                name_elem = row.find('td', class_='left event')
                event_name = clean_text(name_elem.text) if name_elem else "Unknown Event"

                # Actual, Forecast, Previous values
                actual_elem = row.find('td', id=f'eventActual_{event_id}')
                forecast_elem = row.find('td', id=f'eventForecast_{event_id}')
                previous_elem = row.find('td', id=f'eventPrevious_{event_id}')

                actual = clean_text(actual_elem.text) if actual_elem else None
                forecast = clean_text(forecast_elem.text) if forecast_elem else None
                previous = clean_text(previous_elem.text) if previous_elem else None

                # Determine status
                status = "completed" if actual and actual != "" else "upcoming"

                # Create event object
                event = {
                    "id": f"event_{event_id}" if event_id else f"event_{len(events) + 1}",
                    "name": event_name,
                    "date": event_date or start_date.strftime("%Y-%m-%d"),
                    "time": event_time or "00:00",
                    "impact": impact,
                    "forecast": forecast,
                    "actual": actual,
                    "previous": previous,
                    "country": "US",
                    "status": status
                }

                events.append(event)

            except Exception as e:
                print(f"⚠️  Error parsing event row: {e}")
                continue

        print(f"✅ Successfully parsed {len(events)} events")

        if len(events) == 0:
            print("⚠️  No events found, using fallback data")
            return generate_fallback_calendar()

        return events

    except Exception as e:
        print(f"❌ Error fetching calendar: {e}")
        print(f"Using fallback calendar data")
        return generate_fallback_calendar()


def generate_fallback_calendar():
    """
    Generate fallback calendar data when scraping fails
    This provides realistic mock data for development and testing
    """
    print("Generating fallback calendar data...")

    today = datetime.now()

    # Generate events for the next 4 weeks
    events = [
        {
            "id": "event_1",
            "name": "Consumer Price Index (CPI)",
            "date": (today - timedelta(days=4)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "High",
            "forecast": "3.2%",
            "actual": "3.4%",
            "previous": "3.1%",
            "country": "US",
            "status": "completed"
        },
        {
            "id": "event_2",
            "name": "Federal Reserve Interest Rate Decision",
            "date": (today - timedelta(days=6)).strftime("%Y-%m-%d"),
            "time": "14:00",
            "impact": "High",
            "forecast": "5.50%",
            "actual": "5.50%",
            "previous": "5.50%",
            "country": "US",
            "status": "completed"
        },
        {
            "id": "event_3",
            "name": "Initial Jobless Claims",
            "date": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "Medium",
            "forecast": "220K",
            "actual": "218K",
            "previous": "225K",
            "country": "US",
            "status": "completed"
        },
        {
            "id": "event_oil",
            "name": "Crude Oil Inventories",
            "date": (today + timedelta(days=5)).strftime("%Y-%m-%d"),
            "time": "10:30",
            "impact": "High",
            "forecast": "-2.000M",
            "actual": None,
            "previous": "-1.425M",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_4",
            "name": "GDP Growth Rate (Q3 Final)",
            "date": (today + timedelta(days=2)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "High",
            "forecast": "2.8%",
            "actual": None,
            "previous": "2.6%",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_5",
            "name": "Consumer Confidence Index",
            "date": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
            "time": "10:00",
            "impact": "Medium",
            "forecast": "103.5",
            "actual": None,
            "previous": "102.7",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_6",
            "name": "New Home Sales",
            "date": (today + timedelta(days=6)).strftime("%Y-%m-%d"),
            "time": "10:00",
            "impact": "Medium",
            "forecast": "725K",
            "actual": None,
            "previous": "738K",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_7",
            "name": "ISM Manufacturing PMI",
            "date": (today + timedelta(days=10)).strftime("%Y-%m-%d"),
            "time": "10:00",
            "impact": "High",
            "forecast": "48.5",
            "actual": None,
            "previous": "48.3",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_8",
            "name": "Non-Farm Payrolls",
            "date": (today + timedelta(days=12)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "High",
            "forecast": "180K",
            "actual": None,
            "previous": "199K",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_9",
            "name": "Unemployment Rate",
            "date": (today + timedelta(days=12)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "High",
            "forecast": "4.2%",
            "actual": None,
            "previous": "4.2%",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_10",
            "name": "FOMC Meeting Minutes",
            "date": (today + timedelta(days=15)).strftime("%Y-%m-%d"),
            "time": "14:00",
            "impact": "High",
            "forecast": None,
            "actual": None,
            "previous": None,
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_11",
            "name": "Retail Sales",
            "date": (today + timedelta(days=17)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "High",
            "forecast": "0.5%",
            "actual": None,
            "previous": "0.4%",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_12",
            "name": "Housing Starts",
            "date": (today + timedelta(days=19)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "Medium",
            "forecast": "1.35M",
            "actual": None,
            "previous": "1.31M",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_13",
            "name": "Durable Goods Orders",
            "date": (today + timedelta(days=24)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "Medium",
            "forecast": "0.3%",
            "actual": None,
            "previous": "0.2%",
            "country": "US",
            "status": "upcoming"
        },
        {
            "id": "event_14",
            "name": "Personal Income",
            "date": (today + timedelta(days=26)).strftime("%Y-%m-%d"),
            "time": "08:30",
            "impact": "Medium",
            "forecast": "0.4%",
            "actual": None,
            "previous": "0.6%",
            "country": "US",
            "status": "upcoming"
        }
    ]

    return events


def check_pre_event_warnings(events, notification_states, user_config):
    """
    Check for events that need 12-hour pre-event warnings
    Returns list of alerts to send
    """
    from notifications import broadcast_alerts

    alerts = []
    now = datetime.now()

    for event in events:
        # Only check upcoming high-impact events
        if event["status"] != "upcoming" or event["impact"] != "High":
            continue

        event_id = event["id"]

        # Skip if already sent
        if notification_states.get(event_id, {}).get("pre_event_sent", False):
            continue

        try:
            # Parse event datetime
            event_date_str = f"{event['date']} {event['time']}"
            event_datetime = datetime.strptime(event_date_str, "%Y-%m-%d %H:%M")

            # Calculate time until event
            time_until_event = event_datetime - now
            hours_until = time_until_event.total_seconds() / 3600

            # Check if within 12-hour warning window
            if 0 < hours_until <= 12:
                alert = {
                    "event_name": event["name"],
                    "time": event_datetime.strftime("%Y-%m-%d %H:%M"),
                    "hours_until": round(hours_until, 1),
                    "forecast": event.get("forecast", "N/A"),
                    "impact": event["impact"]
                }
                alerts.append(alert)

                # Mark as sent
                if event_id not in notification_states:
                    notification_states[event_id] = {}
                notification_states[event_id]["pre_event_sent"] = True

                print(f"⚠️  Pre-event warning: {event['name']} in {round(hours_until, 1)} hours")

        except Exception as e:
            print(f"⚠️  Error processing pre-event warning for {event_id}: {e}")
            continue

    # Broadcast alerts if any
    if alerts:
        try:
            subscribers = user_config.get("subscribers", [])
            if subscribers:
                broadcast_alerts(alerts, subscribers, alert_type="calendar_warning")
                print(f"✅ Sent {len(alerts)} pre-event warning(s) to {len(subscribers)} subscriber(s)")
            else:
                print(f"ℹ️  No subscribers configured, skipping {len(alerts)} alert(s)")
        except Exception as e:
            print(f"❌ Error broadcasting pre-event warnings: {e}")

    return notification_states


def check_data_releases(events, existing_events, notification_states, user_config):
    """
    Check for newly released actual data
    Returns list of alerts to send
    """
    from notifications import broadcast_alerts

    alerts = []

    # Create lookup of existing events by ID
    existing_lookup = {e["id"]: e for e in existing_events}

    for event in events:
        event_id = event["id"]

        # Skip if release alert already sent
        if notification_states.get(event_id, {}).get("release_sent", False):
            continue

        # Check if actual data is now available
        if event.get("actual") and event["actual"] != "":
            # Check if this is new (wasn't in previous data or didn't have actual)
            existing_event = existing_lookup.get(event_id)

            is_new_release = False
            if not existing_event:
                is_new_release = True
            elif not existing_event.get("actual") or existing_event["actual"] == "":
                is_new_release = True

            if is_new_release:
                # Calculate surprise (deviation from forecast)
                try:
                    forecast_val = parse_numeric_value(event.get("forecast", ""))
                    actual_val = parse_numeric_value(event["actual"])

                    if forecast_val is not None and actual_val is not None:
                        surprise = actual_val - forecast_val
                        surprise_pct = (surprise / forecast_val * 100) if forecast_val != 0 else 0
                    else:
                        surprise = None
                        surprise_pct = None
                except:
                    surprise = None
                    surprise_pct = None

                alert = {
                    "event_name": event["name"],
                    "forecast": event.get("forecast", "N/A"),
                    "actual": event["actual"],
                    "previous": event.get("previous", "N/A"),
                    "surprise": surprise,
                    "surprise_pct": surprise_pct,
                    "impact": event["impact"]
                }
                alerts.append(alert)

                # Mark as sent
                if event_id not in notification_states:
                    notification_states[event_id] = {}
                notification_states[event_id]["release_sent"] = True

                surprise_str = f" (surprise: {surprise:+.2f})" if surprise is not None else ""
                print(f"📊 Data release: {event['name']}: {event['actual']} vs {event.get('forecast', 'N/A')} forecast{surprise_str}")

    # Broadcast alerts if any
    if alerts:
        try:
            subscribers = user_config.get("subscribers", [])
            if subscribers:
                broadcast_alerts(alerts, subscribers, alert_type="calendar_release")
                print(f"✅ Sent {len(alerts)} data release alert(s) to {len(subscribers)} subscriber(s)")
            else:
                print(f"ℹ️  No subscribers configured, skipping {len(alerts)} alert(s)")
        except Exception as e:
            print(f"❌ Error broadcasting data releases: {e}")

    return notification_states


def parse_numeric_value(value_str):
    """Parse numeric value from string (handles %, K, M, B suffixes)"""
    if not value_str or value_str == "":
        return None

    try:
        # Remove commas and spaces
        value_str = str(value_str).replace(',', '').strip()

        # Handle percentage
        if '%' in value_str:
            return float(value_str.replace('%', ''))

        # Handle K (thousands)
        if 'K' in value_str:
            return float(value_str.replace('K', '')) * 1000

        # Handle M (millions)
        if 'M' in value_str:
            return float(value_str.replace('M', '')) * 1000000

        # Handle B (billions)
        if 'B' in value_str:
            return float(value_str.replace('B', '')) * 1000000000

        # Plain number
        return float(value_str)
    except:
        return None


def initialize_notification_states(events, existing_states):
    """Initialize notification states for new events"""
    notification_states = existing_states.copy()

    for event in events:
        event_id = event["id"]
        if event_id not in notification_states:
            notification_states[event_id] = {
                "pre_event_sent": event["status"] == "completed",  # Already sent if completed
                "release_sent": event["status"] == "completed"
            }

    return notification_states


def save_calendar_data(events, notification_states):
    """Save calendar data to JSON file"""
    data = {
        "events": events,
        "notification_states": notification_states,
        "last_updated": datetime.utcnow().isoformat()
    }

    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with open(CALENDAR_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"✅ Calendar data saved to {CALENDAR_DATA_FILE}")


def load_user_config():
    """Load user configuration including thresholds and subscribers"""
    USER_CONFIG_FILE = DATA_DIR / "user_config.json"
    try:
        with open(USER_CONFIG_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print("⚠️  user_config.json not found, using default config")
        return {
            "thresholds": {},
            "subscribers": []
        }


def main():
    """Main execution function"""
    print("=" * 60)
    print("Strategic Cockpit - Economic Calendar Update")
    print("=" * 60)
    print()

    # Load existing data
    existing_calendar = load_existing_calendar()
    existing_events = existing_calendar.get("events", [])

    # Load user configuration for subscribers
    user_config = load_user_config()

    # Fetch new calendar data
    events = fetch_investing_calendar()

    # Initialize notification states
    notification_states = initialize_notification_states(
        events,
        existing_calendar.get("notification_states", {})
    )

    # Check for pre-event warnings (12 hours before high-impact events)
    print("\n🔔 Checking for pre-event warnings...")
    notification_states = check_pre_event_warnings(events, notification_states, user_config)

    # Check for data releases (new actual values)
    print("\n📊 Checking for data releases...")
    notification_states = check_data_releases(events, existing_events, notification_states, user_config)

    # Save updated data
    save_calendar_data(events, notification_states)

    print()
    print("=" * 60)
    print(f"✅ Calendar update complete! ({len(events)} events)")
    print("=" * 60)

    # Print summary
    completed = [e for e in events if e["status"] == "completed"]
    upcoming = [e for e in events if e["status"] == "upcoming"]

    print(f"\n📊 Summary:")
    print(f"   - Completed events: {len(completed)}")
    print(f"   - Upcoming events: {len(upcoming)}")
    print()


if __name__ == "__main__":
    main()
