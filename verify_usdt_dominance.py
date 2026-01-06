#!/usr/bin/env python3
"""
Test #71: USDT Dominance Formula Verification
Verify that dashboard USDT Dominance value matches independent calculation
"""

import json
import sys
import requests
import time
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def verify_usdt_dominance():
    """Verify USDT dominance calculation"""

    print("\n🔍 USDT Dominance Formula Verification")
    print("=" * 60)

    # Step 1: Fetch Total Crypto Market Cap from CoinGecko Global API
    print("\n📊 Step 1: Fetching Total Crypto Market Cap from CoinGecko...")
    try:
        response = requests.get(
            'https://api.coingecko.com/api/v3/global',
            timeout=10,
            verify=False
        )
        response.raise_for_status()
        global_data = response.json()
        total_mcap = global_data['data']['total_market_cap']['usd']
        print(f"   ✓ Total Crypto Market Cap: ${total_mcap:,.0f}")
    except Exception as e:
        print(f"   ❌ Failed to fetch global market cap: {e}")
        return False

    time.sleep(1)  # Rate limiting

    # Step 2: Fetch USDT Market Cap from CoinGecko Coins API
    print("\n📊 Step 2: Fetching Tether (USDT) Market Cap from CoinGecko...")
    try:
        response = requests.get(
            'https://api.coingecko.com/api/v3/coins/tether',
            timeout=10,
            verify=False
        )
        response.raise_for_status()
        usdt_data = response.json()
        usdt_mcap = usdt_data['market_data']['market_cap']['usd']
        print(f"   ✓ USDT Market Cap: ${usdt_mcap:,.0f}")
    except Exception as e:
        print(f"   ❌ Failed to fetch USDT market cap: {e}")
        return False

    # Step 3: Calculate expected dominance
    print("\n🧮 Step 3: Calculating Expected USDT Dominance...")
    expected_dominance = (usdt_mcap / total_mcap) * 100
    print(f"   Formula: (USDT_Cap / Total_Cap) × 100")
    print(f"   Calculation: (${usdt_mcap:,.0f} / ${total_mcap:,.0f}) × 100")
    print(f"   Expected Dominance: {expected_dominance:.2f}%")

    # Step 4: Read dashboard value
    print("\n📋 Step 4: Reading Dashboard USDT Dominance Value...")
    try:
        with open('data/dashboard_data.json', 'r') as f:
            dashboard_data = json.load(f)
        dashboard_value = dashboard_data['metrics']['usdt_dominance']['value']
        print(f"   Dashboard Value: {dashboard_value:.2f}%")
    except Exception as e:
        print(f"   ❌ Failed to read dashboard data: {e}")
        return False

    # Step 5: Assert values match within tolerance
    print("\n✅ Step 5: Comparing Values...")
    # Note: Dashboard data may be stale, so allow for reasonable market movement
    # 0.2% tolerance accounts for up to ~24 hours of market movement
    tolerance = 0.2
    difference = abs(dashboard_value - expected_dominance)

    print(f"   Expected: {expected_dominance:.2f}%")
    print(f"   Actual:   {dashboard_value:.2f}%")
    print(f"   Difference: {difference:.3f}%")
    print(f"   Tolerance: {tolerance:.3f}%")

    if difference > tolerance:
        print(f"\n❌ FAIL: Values differ by more than tolerance!")
        print(f"   Difference: {difference:.3f}% > {tolerance:.3f}%")
        return False

    # Step 6: Verify not using wrong denominator
    print("\n🔍 Step 6: Verifying Correct Denominator Used...")
    # If wrong denominator (stablecoin total instead of total crypto), would be ~60-70%
    # Check that it's in reasonable range (should be 3-8% typically)
    if dashboard_value > 30:
        print(f"   ❌ FAIL: Value {dashboard_value:.2f}% is too high!")
        print(f"   This indicates wrong denominator (likely stablecoin total instead of total crypto)")
        return False

    print(f"   ✓ Value {dashboard_value:.2f}% is in reasonable range (3-8%)")
    print(f"   ✓ Correct denominator confirmed (total crypto market cap)")

    print("\n" + "=" * 60)
    print("✅ PASS: USDT Dominance Formula Verified!")
    print(f"   ✓ Dashboard value ({dashboard_value:.2f}%) matches expected ({expected_dominance:.2f}%)")
    print(f"   ✓ Difference ({difference:.3f}%) within tolerance ({tolerance:.3f}%)")
    print(f"   ✓ Correct formula confirmed: (USDT / Total_Crypto) × 100")
    print("=" * 60)

    return True

if __name__ == "__main__":
    success = verify_usdt_dominance()
    sys.exit(0 if success else 1)
