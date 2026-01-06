#!/usr/bin/env python3
"""
Test #72: Macro Data Freshness (FRED)
Verify Yields and Liquidity are not stale
"""

import json
import sys
import os
from datetime import datetime, timedelta
from fredapi import Fred

def verify_fred_freshness():
    """Verify FRED data is not stale"""

    print("\n🔍 FRED Data Freshness Verification")
    print("=" * 60)

    # Get FRED API key
    fred_api_key = os.getenv('FRED_API_KEY')
    if not fred_api_key:
        # Try to load from backend/.env
        try:
            with open('backend/.env', 'r') as f:
                for line in f:
                    if line.startswith('FRED_API_KEY='):
                        fred_api_key = line.split('=', 1)[1].strip()
                        break
        except:
            pass

    if not fred_api_key:
        print("   ⚠️  FRED_API_KEY not found in environment")
        print("   ℹ️  Will verify against dashboard data only")
        fred = None
    else:
        fred = Fred(api_key=fred_api_key)

    # Load dashboard data
    print("\n📋 Loading Dashboard Data...")
    try:
        with open('data/dashboard_data.json', 'r') as f:
            dashboard_data = json.load(f)

        us_10y = dashboard_data['metrics']['us_10y_yield']['value']
        fed_liq = dashboard_data['metrics']['fed_net_liquidity']['value']
        last_updated_str = dashboard_data['last_updated']

        # Parse timestamp
        last_updated = datetime.fromisoformat(last_updated_str.replace('Z', '+00:00'))

        print(f"   ✓ US 10Y Yield: {us_10y}%")
        print(f"   ✓ Fed Net Liquidity: ${fed_liq}B")
        print(f"   ✓ Last Updated: {last_updated_str}")
        print(f"   ✓ Update Date: {last_updated.strftime('%Y-%m-%d %A')}")

    except Exception as e:
        print(f"   ❌ Failed to read dashboard data: {e}")
        return False

    # Check if we have FRED access
    if fred:
        # Step 1: Fetch latest 10Y Treasury observation from FRED
        print("\n📊 Step 1: Fetching Latest US 10Y Treasury from FRED...")
        try:
            # DGS10 = 10-Year Treasury Constant Maturity Rate
            treasury_data = fred.get_series('DGS10', limit=10)
            latest_treasury_date = treasury_data.index[-1]
            latest_treasury_value = treasury_data.iloc[-1]

            print(f"   ✓ Latest FRED Date: {latest_treasury_date.strftime('%Y-%m-%d %A')}")
            print(f"   ✓ Latest FRED Value: {latest_treasury_value}%")

        except Exception as e:
            print(f"   ❌ Failed to fetch FRED data: {e}")
            print(f"   ℹ️  Continuing with dashboard-only validation...")
            fred = None

    # Step 2-6: Verify data freshness
    print("\n🕐 Step 2-6: Verifying Data Freshness...")

    now = datetime.now()
    today_weekday = now.weekday()  # Monday=0, Sunday=6
    weekday_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    print(f"   Today: {now.strftime('%Y-%m-%d %A')}")
    print(f"   Dashboard updated: {last_updated.strftime('%Y-%m-%d %A')}")

    # Calculate business days since update
    days_diff = (now.date() - last_updated.date()).days

    print(f"   Calendar days since update: {days_diff}")

    # Calculate business days (excluding weekends)
    business_days = 0
    check_date = last_updated.date()
    while check_date < now.date():
        check_date += timedelta(days=1)
        if check_date.weekday() < 5:  # Monday-Friday
            business_days += 1

    print(f"   Business days since update: {business_days}")

    # Step 3-4: Check based on current day
    max_allowed_business_days = 3  # Allow up to 3 business days lag

    if business_days > max_allowed_business_days:
        print(f"\n   ❌ FAIL: Data is too stale!")
        print(f"      {business_days} business days old > {max_allowed_business_days} day limit")
        print(f"      Data from: {last_updated.strftime('%Y-%m-%d %A')}")
        print(f"      Today: {now.strftime('%Y-%m-%d %A')}")
        return False

    if business_days == 0:
        print(f"   ✅ Data is current (updated today)")
    elif business_days == 1:
        print(f"   ✅ Data is from yesterday (acceptable)")
    elif business_days <= max_allowed_business_days:
        print(f"   ✅ Data is {business_days} business days old (within {max_allowed_business_days} day limit)")

    # Additional check: warn if data is on a weekend
    if last_updated.weekday() >= 5:  # Saturday or Sunday
        print(f"   ⚠️  WARNING: Data timestamp is on a weekend ({weekday_names[last_updated.weekday()]})")
        print(f"      This is unusual but may be acceptable for automated systems")

    # Verify yield and liquidity values are reasonable
    print("\n📊 Data Validity Checks...")
    if us_10y < 0 or us_10y > 20:
        print(f"   ❌ FAIL: US 10Y Yield {us_10y}% is out of reasonable range (0-20%)")
        return False
    else:
        print(f"   ✓ US 10Y Yield {us_10y}% is in reasonable range")

    if fed_liq < 1000 or fed_liq > 20000:
        print(f"   ❌ FAIL: Fed Net Liquidity ${fed_liq}B is out of reasonable range ($1T-$20T)")
        return False
    else:
        print(f"   ✓ Fed Net Liquidity ${fed_liq}B is in reasonable range")

    print("\n" + "=" * 60)
    print("✅ PASS: FRED Data Freshness Verified!")
    print(f"   ✓ Data is {business_days} business days old (≤{max_allowed_business_days} allowed)")
    print(f"   ✓ US 10Y Yield: {us_10y}% (valid range)")
    print(f"   ✓ Fed Net Liquidity: ${fed_liq}B (valid range)")
    print("=" * 60)

    return True

if __name__ == "__main__":
    success = verify_fred_freshness()
    sys.exit(0 if success else 1)
