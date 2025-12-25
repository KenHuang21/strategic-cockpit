#!/usr/bin/env python3
"""
Strategic Cockpit Dashboard - Data Fetching Script
Fetches metrics from multiple APIs and updates dashboard_data.json
"""

import os
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from fredapi import Fred
from notifications import broadcast_alerts

# Try to configure SSL properly
try:
    import certifi
    os.environ['SSL_CERT_FILE'] = certifi.where()
    os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
except ImportError:
    pass

# Load environment variables from backend/.env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
DASHBOARD_DATA_FILE = DATA_DIR / "dashboard_data.json"
HISTORY_FILE = DATA_DIR / "metrics_history.json"
USER_CONFIG_FILE = DATA_DIR / "user_config.json"
LAST_UPDATE_FILE = DATA_DIR / "metrics_last_update.json"  # For 15-minute interval comparisons

# API Keys
FRED_API_KEY = os.getenv("FRED_API_KEY", "")
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")


def load_existing_data():
    """Load existing dashboard data for delta calculations"""
    try:
        with open(DASHBOARD_DATA_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
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


def load_history():
    """Load historical data for 7-day change calculations"""
    try:
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"snapshots": []}


def save_history(history, current_data):
    """Save current data to history for future delta calculations"""
    snapshot = {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": current_data["metrics"]
    }
    history["snapshots"].append(snapshot)

    # Keep only last 30 days of history
    cutoff = datetime.utcnow() - timedelta(days=30)
    history["snapshots"] = [
        s for s in history["snapshots"]
        if datetime.fromisoformat(s["timestamp"]) > cutoff
    ]

    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)


def calculate_delta(current_value, previous_value):
    """Calculate percentage change"""
    if previous_value == 0:
        return 0
    return ((current_value - previous_value) / previous_value) * 100


def load_last_update():
    """Load last update snapshot for 15-minute interval comparisons"""
    try:
        with open(LAST_UPDATE_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def save_last_update(metrics_data):
    """Save current metrics as last update for next 15-minute comparison"""
    snapshot = {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": metrics_data
    }
    with open(LAST_UPDATE_FILE, 'w') as f:
        json.dump(snapshot, f, indent=2)


def load_user_config():
    """Load user configuration including thresholds and subscribers"""
    try:
        with open(USER_CONFIG_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print("⚠️  user_config.json not found, using default thresholds")
        return {
            "thresholds": {
                "btc_pct": 0.01,
                "stable_pct": 0.001,
                "yield_pct": 0.05,
                "liquidity_pct": 0.02,
                "usdt_dom_pct": 0.005,
                "rwa_pct": 0.03
            },
            "subscribers": []
        }


def smart_diff(last_15min_data, yesterday_data, new_data, thresholds):
    """
    Compare data using different time windows for different metrics:
    - US 10Y Yield: Daily change (vs yesterday)
    - Fed Net Liquidity: Any new data (threshold = 0%)
    - Bitcoin, Stablecoin, USDT Dom, RWA: 15-minute interval (vs last update)

    Args:
        last_15min_data: Data from last 15-minute update
        yesterday_data: Data from yesterday (for daily comparisons)
        new_data: Current data
        thresholds: User-configured thresholds

    Returns:
        List of alerts that exceed configured thresholds
    """
    alerts = []

    # Map metric keys to their comparison strategy
    metric_map = {
        "us_10y_yield": {
            "threshold_key": "yield_pct",
            "display_name": "US 10Y Treasury Yield",
            "unit": "",
            "suffix": "%",
            "format": ".2f",
            "comparison_source": "yesterday",  # Compare against yesterday
            "interval_label": "daily"
        },
        "fed_net_liquidity": {
            "threshold_key": "liquidity_pct",
            "display_name": "Fed Net Liquidity",
            "unit": "$",
            "suffix": "B",
            "format": ".2f",
            "comparison_source": "yesterday",  # Compare against last week for 7-day display
            "interval_label": "weekly",
            "force_alert": True  # Alert on ANY new data
        },
        "btc_price": {
            "threshold_key": "btc_pct",
            "display_name": "Bitcoin Price",
            "unit": "$",
            "format": ",.2f",
            "comparison_source": "15min",  # Compare against last 15-min update
            "interval_label": "15m"
        },
        "stablecoin_mcap": {
            "threshold_key": "stable_pct",
            "display_name": "Stablecoin Market Cap",
            "unit": "$",
            "suffix": "B",
            "format": ".2f",
            "comparison_source": "15min",  # Compare against last 15-min update
            "interval_label": "15m"
        },
        "usdt_dominance": {
            "threshold_key": "usdt_dom_pct",
            "display_name": "USDT Dominance",
            "unit": "",
            "suffix": "%",
            "format": ".2f",
            "comparison_source": "15min",  # Compare against last 15-min update
            "interval_label": "15m"
        },
        "rwa_tvl": {
            "threshold_key": "rwa_pct",
            "display_name": "RWA TVL",
            "unit": "$",
            "suffix": "B",
            "format": ".2f",
            "comparison_source": "15min",  # Compare against last 15-min update
            "interval_label": "15m"
        }
    }

    # Check each metric
    for metric_key, config in metric_map.items():
        try:
            new_value = new_data["metrics"][metric_key]["value"]

            # Skip if new value is zero (no data)
            if new_value == 0:
                continue

            # Determine which old data to use based on comparison strategy
            if config["comparison_source"] == "15min":
                if not last_15min_data or "metrics" not in last_15min_data:
                    print(f"⚠️  No 15-min baseline for {metric_key}, skipping alert check")
                    continue
                old_value = last_15min_data["metrics"][metric_key]["value"]
            elif config["comparison_source"] == "yesterday":
                if not yesterday_data or "metrics" not in yesterday_data:
                    print(f"⚠️  No yesterday baseline for {metric_key}, skipping alert check")
                    continue
                old_value = yesterday_data["metrics"][metric_key]["value"]
            else:
                continue

            # Skip if old value is zero (no baseline)
            if old_value == 0:
                continue

            # Calculate percentage change
            pct_change = abs((new_value - old_value) / old_value)

            # Get threshold for this metric
            threshold = thresholds.get(config["threshold_key"], 0.01)  # Default 1%

            # Special handling for Fed Net Liquidity: alert on ANY change
            if config.get("force_alert", False):
                should_alert = (new_value != old_value)  # Any change triggers alert
            else:
                should_alert = (pct_change >= threshold)

            # Check if change exceeds threshold
            if should_alert:
                # Format values for display
                format_str = config.get("format", ".2f")
                old_formatted = f"{config.get('unit', '')}{old_value:{format_str}}{config.get('suffix', '')}"
                new_formatted = f"{config.get('unit', '')}{new_value:{format_str}}{config.get('suffix', '')}"

                # Determine direction
                direction = "increased" if new_value > old_value else "decreased"

                alert = {
                    "metric": config["display_name"],
                    "old_value": old_value,
                    "new_value": new_value,
                    "old_formatted": old_formatted,
                    "new_formatted": new_formatted,
                    "pct_change": pct_change * 100,  # Convert to percentage
                    "direction": direction,
                    "threshold_pct": threshold * 100,
                    "interval": config["interval_label"]  # Add interval info for notifications
                }

                alerts.append(alert)

                if config.get("force_alert", False):
                    print(f"🚨 Alert: {config['display_name']} new data released: {old_formatted} → {new_formatted}")
                else:
                    print(f"🚨 Alert: {config['display_name']} {direction} by {pct_change*100:.2f}% over {config['interval_label']} (threshold: {threshold*100:.2f}%)")
                    print(f"   Old: {old_formatted} → New: {new_formatted}")

        except (KeyError, TypeError, ZeroDivisionError) as e:
            print(f"⚠️  Error comparing {metric_key}: {e}")
            continue

    return alerts


def fetch_fred_data():
    """Fetch US 10Y Treasury Yield and Fed Net Liquidity from FRED API"""
    print("Fetching FRED data...")

    if not FRED_API_KEY:
        print("⚠️  FRED_API_KEY not set, using placeholder data")
        return {
            "us_10y_yield": 4.5,
            "fed_net_liquidity": 6200
        }

    try:
        # Try with SSL workaround for FRED API
        import ssl
        import urllib3
        
        # Disable SSL warnings temporarily
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Create SSL context that doesn't verify
        try:
            _create_unverified_https_context = ssl._create_unverified_context
        except AttributeError:
            pass
        else:
            ssl._create_default_https_context = _create_unverified_https_context
        
        fred = Fred(api_key=FRED_API_KEY)

        # US 10Y Treasury Yield
        try:
            treasury_yield = fred.get_series_latest_release('DGS10')
            us_10y_value = float(treasury_yield.iloc[-1]) if not treasury_yield.empty else 0
        except Exception as e:
            print(f"⚠️  Error fetching Treasury Yield: {e}, using fallback")
            us_10y_value = 4.5  # Fallback value

        # Fed Net Liquidity (using Fed Balance Sheet minus TGA and Reverse Repo)
        # This is a simplified calculation - real implementation would be more sophisticated
        try:
            fed_balance = fred.get_series_latest_release('WALCL')
            fed_balance_value = float(fed_balance.iloc[-1]) / 1000 if not fed_balance.empty else 0  # Convert to billions
        except Exception as e:
            print(f"⚠️  Error fetching Fed Balance: {e}, using fallback")
            fed_balance_value = 6200  # Fallback value

        print(f"✅ FRED data fetched: 10Y Yield={us_10y_value}%, Fed Balance={fed_balance_value}B")

        return {
            "us_10y_yield": us_10y_value,
            "fed_net_liquidity": fed_balance_value
        }
    except Exception as e:
        print(f"❌ Error fetching FRED data: {e}")
        print("⚠️  Using placeholder values")
        return {
            "us_10y_yield": 4.5,
            "fed_net_liquidity": 6200
        }


def fetch_coingecko_data():
    """Fetch Bitcoin price and global market data from CoinGecko API"""
    print("Fetching CoinGecko data...")

    try:
        # Fetch Bitcoin price
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "bitcoin",
            "vs_currencies": "usd",
            "include_market_cap": "true",
            "include_24hr_change": "true"
        }

        headers = {}
        if COINGECKO_API_KEY:
            headers["x-cg-api-key"] = COINGECKO_API_KEY

        # Try with SSL verification first
        try:
            response = requests.get(url, params=params, headers=headers, timeout=30, verify=True)
        except requests.exceptions.SSLError:
            print("⚠️  SSL verification failed, retrying without verification...")
            response = requests.get(url, params=params, headers=headers, timeout=30, verify=False)

        response.raise_for_status()
        data = response.json()

        btc_price = data["bitcoin"]["usd"]

        # Fetch global crypto market data for total market cap
        global_url = "https://api.coingecko.com/api/v3/global"

        try:
            global_response = requests.get(global_url, headers=headers, timeout=30, verify=True)
        except requests.exceptions.SSLError:
            print("⚠️  SSL verification failed, retrying without verification...")
            global_response = requests.get(global_url, headers=headers, timeout=30, verify=False)

        global_response.raise_for_status()
        global_data = global_response.json()

        total_crypto_mcap = global_data["data"]["total_market_cap"]["usd"] / 1e9  # Convert to billions

        print(f"✅ CoinGecko data fetched: BTC=${btc_price:,.2f}, Total Crypto MCap=${total_crypto_mcap:.2f}B")

        return {
            "btc_price": btc_price,
            "total_crypto_mcap": total_crypto_mcap
        }
    except Exception as e:
        print(f"❌ Error fetching CoinGecko data: {e}")
        return {
            "btc_price": 0,
            "total_crypto_mcap": 0
        }


def fetch_defillama_data(total_crypto_mcap=0):
    """Fetch Stablecoin and RWA data from DefiLlama API

    Args:
        total_crypto_mcap: Total crypto market cap in billions (from CoinGecko)
    """
    print("Fetching DefiLlama data...")

    try:
        # Fetch stablecoin data
        stablecoin_url = "https://stablecoins.llama.fi/stablecoins?includePrices=true"

        # Try with SSL verification first
        try:
            stablecoin_response = requests.get(stablecoin_url, timeout=30, verify=True)
        except requests.exceptions.SSLError:
            print("⚠️  SSL verification failed, retrying without verification...")
            stablecoin_response = requests.get(stablecoin_url, timeout=30, verify=False)

        stablecoin_response.raise_for_status()
        stablecoin_data = stablecoin_response.json()

        # Calculate total stablecoin market cap
        total_stablecoin_mcap = 0
        usdt_mcap = 0

        for coin in stablecoin_data.get("peggedAssets", []):
            circulating = coin.get("circulating", {})
            total = circulating.get("peggedUSD", 0)
            total_stablecoin_mcap += total

            if coin.get("symbol") == "USDT":
                usdt_mcap = total

        # Convert to billions
        total_stablecoin_mcap = total_stablecoin_mcap / 1e9
        usdt_mcap_billions = usdt_mcap / 1e9

        # Calculate USDT Dominance as % of TOTAL CRYPTO market cap (not stablecoin mcap)
        # This gives us the ~6% value instead of ~60%
        if total_crypto_mcap > 0:
            usdt_dominance = (usdt_mcap_billions / total_crypto_mcap) * 100
        else:
            # Fallback: use stablecoin dominance if total crypto mcap not available
            usdt_dominance = (usdt_mcap / (total_stablecoin_mcap * 1e9)) * 100 if total_stablecoin_mcap > 0 else 0

        # Fetch RWA TVL data
        # Note: DefiLlama doesn't have a direct RWA endpoint, so we'll use a placeholder
        # In production, you'd fetch from specific RWA protocols
        rwa_tvl = 8.5  # Placeholder value in billions

        print(f"✅ DefiLlama data fetched: Stablecoin MCap=${total_stablecoin_mcap:.2f}B, USDT MCap=${usdt_mcap_billions:.2f}B")
        print(f"   USDT Dominance={usdt_dominance:.2f}% (of ${total_crypto_mcap:.2f}B total crypto), RWA TVL=${rwa_tvl}B")

        return {
            "stablecoin_mcap": total_stablecoin_mcap,
            "usdt_dominance": usdt_dominance,
            "rwa_tvl": rwa_tvl
        }
    except Exception as e:
        print(f"❌ Error fetching DefiLlama data: {e}")
        return {
            "stablecoin_mcap": 0,
            "usdt_dominance": 0,
            "rwa_tvl": 0
        }


def fetch_polymarket_data():
    """Fetch Top 5 Polymarket markets from Gamma API"""
    print("Fetching Polymarket data...")

    try:
        # Polymarket Gamma API CLOB endpoint
        url = "https://gamma-api.polymarket.com/markets"
        params = {
            "closed": "false",
            "limit": 50  # Fetch more to filter
        }

        # Try with SSL verification first
        try:
            response = requests.get(url, params=params, timeout=30, verify=True)
        except requests.exceptions.SSLError:
            print("⚠️  SSL verification failed, retrying without verification...")
            response = requests.get(url, params=params, timeout=30, verify=False)

        response.raise_for_status()
        markets = response.json()

        print(f"📊 Received {len(markets)} markets from Polymarket")

        # If no markets or not a list, return empty
        if not isinstance(markets, list):
            print(f"⚠️  Unexpected response format from Polymarket API")
            return []

        # Collect all unique tags for debugging
        all_tags = set()
        for market in markets:
            tags = market.get("tags", [])
            if isinstance(tags, list):
                for tag in tags:
                    if isinstance(tag, str):
                        all_tags.add(tag.lower())

        print(f"🏷️  Sample tags found: {sorted(list(all_tags))[:10]}")  # Show first 10 tags

        # Filter by tags and sort by volume - more flexible matching
        relevant_tags = ["economics", "finance", "crypto", "federal reserve", "fed", "interest rates", "inflation", "politics"]
        filtered_markets = []

        for market in markets:
            tags = market.get("tags", [])
            if not isinstance(tags, list):
                continue

            tags_lower = [tag.lower() if isinstance(tag, str) else str(tag).lower() for tag in tags]
            tags_str = " ".join(tags_lower)

            # Match if any relevant tag is found
            if any(relevant_tag in tags_str for relevant_tag in relevant_tags):
                volume = float(market.get("volume", 0))
                filtered_markets.append({
                    "market": market,
                    "volume": volume
                })

        print(f"✅ Filtered to {len(filtered_markets)} relevant markets")

        # If no matches with tags, just take top 5 by volume (fallback)
        if len(filtered_markets) == 0:
            print("⚠️  No markets matched tags, taking top 5 by volume")
            for market in markets:
                volume = float(market.get("volume", 0))
                if volume > 0:  # Only include markets with volume
                    filtered_markets.append({
                        "market": market,
                        "volume": volume
                    })

        # Sort by volume and take top 5
        filtered_markets.sort(key=lambda x: x["volume"], reverse=True)
        top_5 = filtered_markets[:5]

        # Format for frontend
        polymarket_top5 = []
        for idx, item in enumerate(top_5):
            market = item["market"]

            # Debug: print first market structure to understand format
            if idx == 0:
                print(f"📝 Sample market keys: {list(market.keys())}")

            # Try multiple ways to get outcome probability
            top_outcome = "N/A"

            # Method 1: Try tokens field
            tokens = market.get("tokens", [])
            if tokens and len(tokens) > 0:
                sorted_tokens = sorted(tokens, key=lambda t: float(t.get("price", 0) or 0), reverse=True)
                if sorted_tokens and sorted_tokens[0].get("price"):
                    top_token = sorted_tokens[0]
                    outcome_name = top_token.get("outcome", "Yes")
                    probability = float(top_token.get("price", 0)) * 100
                    top_outcome = f"{outcome_name} {probability:.0f}%"

            # Method 2: Try outcomePrices field (common in Polymarket API)
            elif "outcomePrices" in market:
                prices = market.get("outcomePrices", [])
                outcomes = market.get("outcomes", ["Yes", "No"])

                if isinstance(prices, str):
                    # Sometimes it's a JSON string, parse it
                    import json
                    try:
                        prices = json.loads(prices)
                    except:
                        prices = []

                if prices and len(prices) >= 1:
                    # Find the highest probability outcome
                    try:
                        max_idx = 0
                        max_price = 0
                        for i, price in enumerate(prices):
                            price_float = float(price) if price else 0
                            if price_float > max_price:
                                max_price = price_float
                                max_idx = i

                        # Get outcome name, handle if outcomes is a string or list
                        if isinstance(outcomes, list) and max_idx < len(outcomes):
                            outcome_name = outcomes[max_idx]
                        elif isinstance(outcomes, str):
                            # Parse if it's a JSON string
                            try:
                                import json
                                outcomes_list = json.loads(outcomes)
                                outcome_name = outcomes_list[max_idx] if max_idx < len(outcomes_list) else "Yes"
                            except:
                                outcome_name = "Yes"
                        else:
                            outcome_name = "Yes"

                        # Clean the outcome name (remove quotes, whitespace)
                        outcome_name = str(outcome_name).strip('"').strip("'").strip()
                        if not outcome_name:
                            outcome_name = "Yes"

                        top_outcome = f"{outcome_name} {max_price * 100:.0f}%"
                    except (ValueError, IndexError, TypeError) as e:
                        print(f"⚠️  Error parsing outcome prices: {e}")
                        top_outcome = "Active"

            # Method 3: Try direct price fields
            elif "clobTokenIds" in market and len(market.get("clobTokenIds", [])) > 0:
                # This is a different API format, just show volume
                top_outcome = "Active"

            polymarket_top5.append({
                "title": market.get("question", "Unknown Market"),
                "outcome": top_outcome,
                "volume": item["volume"],
                "url": f"https://polymarket.com/event/{market.get('slug', '')}"
            })

        print(f"✅ Polymarket data fetched: {len(polymarket_top5)} markets")

        return polymarket_top5
    except Exception as e:
        print(f"❌ Error fetching Polymarket data: {e}")
        return []


def check_polymarket_odds_flips(old_polymarket, new_polymarket, threshold_pct=10.0):
    """
    Check for significant odds flips (>threshold_pct change) in Polymarket markets

    Args:
        old_polymarket: Previous polymarket_top5 list
        new_polymarket: New polymarket_top5 list
        threshold_pct: Threshold percentage for triggering alert (default 10%)

    Returns:
        List of alert dictionaries for markets with significant odds flips
    """
    alerts = []

    if not old_polymarket or not new_polymarket:
        return alerts

    # Create lookup of old markets by title
    old_markets = {market.get("title", ""): market for market in old_polymarket}

    for new_market in new_polymarket:
        title = new_market.get("title", "")

        # Find matching old market
        old_market = old_markets.get(title)
        if not old_market:
            continue  # New market, no comparison possible

        # Extract probabilities from outcome strings
        old_outcome = old_market.get("outcome", "")
        new_outcome = new_market.get("outcome", "")

        # Parse probability from strings like "Yes 82%" or "No 100%"
        old_prob = extract_probability(old_outcome)
        new_prob = extract_probability(new_outcome)

        if old_prob is None or new_prob is None:
            continue

        # Calculate absolute change in probability
        prob_change = abs(new_prob - old_prob)

        # Check if change exceeds threshold
        if prob_change > threshold_pct:
            alert = {
                "market_title": title,
                "old_probability": old_prob,
                "new_probability": new_prob,
                "change": new_prob - old_prob,
                "url": new_market.get("url", "")
            }
            alerts.append(alert)

            print(f"💹 Polymarket odds flip: {title}")
            print(f"   {old_prob:.1f}% → {new_prob:.1f}% (change: {prob_change:+.1f}%)")

    return alerts


def extract_probability(outcome_str):
    """
    Extract probability percentage from outcome string

    Args:
        outcome_str: String like "Yes 82%" or "No 100%"

    Returns:
        Float probability (0-100) or None if can't parse
    """
    if not outcome_str or outcome_str == "N/A":
        return None

    import re
    # Look for percentage pattern
    match = re.search(r'(\d+(?:\.\d+)?)%', outcome_str)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return None

    return None


def main():
    """Main function to fetch all metrics and update dashboard data"""
    print("=" * 60)
    print("Strategic Cockpit Dashboard - Data Fetch Starting")
    print("=" * 60)

    # Load existing data and configuration
    existing_data = load_existing_data()
    history = load_history()
    user_config = load_user_config()

    print(f"📋 Loaded {len(user_config.get('subscribers', []))} subscribers")
    print(f"🎚️  Thresholds: BTC={user_config['thresholds'].get('btc_pct', 0.01)*100}%, Stable={user_config['thresholds'].get('stable_pct', 0.001)*100}%")

    # Fetch new data from all sources
    fred_data = fetch_fred_data()
    coingecko_data = fetch_coingecko_data()
    # Pass total crypto mcap to defillama for correct USDT dominance calculation
    defillama_data = fetch_defillama_data(coingecko_data.get("total_crypto_mcap", 0))
    polymarket_data = fetch_polymarket_data()

    # Calculate deltas (7-day change)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    historical_snapshot = None
    for snapshot in reversed(history.get("snapshots", [])):
        snapshot_time = datetime.fromisoformat(snapshot["timestamp"])
        if snapshot_time <= seven_days_ago:
            historical_snapshot = snapshot
            break

    # Build new data structure with deltas
    new_data = {
        "metrics": {
            "us_10y_yield": {
                "value": round(fred_data["us_10y_yield"], 2),
                "delta": calculate_delta(
                    fred_data["us_10y_yield"],
                    historical_snapshot["metrics"]["us_10y_yield"]["value"] if historical_snapshot else fred_data["us_10y_yield"]
                ) if historical_snapshot else 0
            },
            "fed_net_liquidity": {
                "value": round(fred_data["fed_net_liquidity"], 2),
                "delta": calculate_delta(
                    fred_data["fed_net_liquidity"],
                    historical_snapshot["metrics"]["fed_net_liquidity"]["value"] if historical_snapshot else fred_data["fed_net_liquidity"]
                ) if historical_snapshot else 0
            },
            "btc_price": {
                "value": round(coingecko_data["btc_price"], 2),
                "delta": calculate_delta(
                    coingecko_data["btc_price"],
                    historical_snapshot["metrics"]["btc_price"]["value"] if historical_snapshot else coingecko_data["btc_price"]
                ) if historical_snapshot else 0
            },
            "stablecoin_mcap": {
                "value": round(defillama_data["stablecoin_mcap"], 2),
                "delta": calculate_delta(
                    defillama_data["stablecoin_mcap"],
                    historical_snapshot["metrics"]["stablecoin_mcap"]["value"] if historical_snapshot else defillama_data["stablecoin_mcap"]
                ) if historical_snapshot else 0
            },
            "usdt_dominance": {
                "value": round(defillama_data["usdt_dominance"], 2),
                "delta": calculate_delta(
                    defillama_data["usdt_dominance"],
                    historical_snapshot["metrics"]["usdt_dominance"]["value"] if historical_snapshot else defillama_data["usdt_dominance"]
                ) if historical_snapshot else 0
            },
            "rwa_tvl": {
                "value": round(defillama_data["rwa_tvl"], 2),
                "delta": calculate_delta(
                    defillama_data["rwa_tvl"],
                    historical_snapshot["metrics"]["rwa_tvl"]["value"] if historical_snapshot else defillama_data["rwa_tvl"]
                ) if historical_snapshot else 0
            }
        },
        "polymarket_top5": polymarket_data,
        "last_updated": datetime.utcnow().isoformat() + "Z"
    }

    # Perform Smart Diff analysis
    print("\n🔍 Running Smart Diff analysis...")
    alerts = smart_diff(existing_data, new_data, user_config["thresholds"])

    if alerts:
        print(f"\n🚨 {len(alerts)} alert(s) detected:")
        for alert in alerts:
            print(f"   • {alert['metric']}: {alert['direction']} by {alert['pct_change']:.2f}%")
            print(f"     {alert['old_formatted']} → {alert['new_formatted']}")

        # Broadcast alerts to all subscribers
        subscribers = user_config.get("subscribers", [])
        if subscribers:
            broadcast_result = broadcast_alerts(alerts, subscribers, "metric")
            print(f"\n✅ Notification broadcast complete:")
            print(f"   • Telegram: {broadcast_result['telegram_sent']} sent")
            print(f"   • Email: {broadcast_result['email_sent']} sent")
            if broadcast_result["errors"]:
                print(f"   • Errors: {len(broadcast_result['errors'])}")
        else:
            print("\n📤 No subscribers configured - alerts logged only")
    else:
        print("✅ No significant changes detected (all deltas below thresholds)")

    # Check for Polymarket odds flips (>10% probability swing)
    print("\n💹 Checking for Polymarket odds flips...")
    old_polymarket = existing_data.get("polymarket_top5", [])
    polymarket_alerts = check_polymarket_odds_flips(old_polymarket, polymarket_data, threshold_pct=10.0)

    if polymarket_alerts:
        print(f"\n💹 {len(polymarket_alerts)} Polymarket odds flip(s) detected:")
        for alert in polymarket_alerts:
            print(f"   • {alert['market_title']}: {alert['old_probability']:.0f}% → {alert['new_probability']:.0f}%")

        # Broadcast Polymarket alerts to all subscribers
        subscribers = user_config.get("subscribers", [])
        if subscribers:
            broadcast_result = broadcast_alerts(polymarket_alerts, subscribers, "polymarket")
            print(f"\n✅ Polymarket notification broadcast complete:")
            print(f"   • Telegram: {broadcast_result['telegram_sent']} sent")
            print(f"   • Email: {broadcast_result['email_sent']} sent")
            if broadcast_result["errors"]:
                print(f"   • Errors: {len(broadcast_result['errors'])}")
        else:
            print("\n📤 No subscribers configured - Polymarket alerts logged only")
    else:
        print("✅ No significant Polymarket odds flips detected (<10% change)")

    # Save new data
    with open(DASHBOARD_DATA_FILE, 'w') as f:
        json.dump(new_data, f, indent=2)

    # Save to history
    save_history(history, new_data)

    print("\n" + "=" * 60)
    print("✅ Dashboard data updated successfully!")
    print(f"📁 Data saved to: {DASHBOARD_DATA_FILE}")
    print(f"🕐 Last updated: {new_data['last_updated']}")
    print("=" * 60)

    return new_data


if __name__ == "__main__":
    main()
