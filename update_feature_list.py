#!/usr/bin/env python3
"""
Script to update feature_list.json with new metric requirement tests.

This script:
1. Marks Test #2 (7-Day Change deltas) as false - needs update to interval-based
2. Marks Test #12 (Smart Diff logic) as false - needs update for new comparison logic
3. Adds 4 new tests at the end:
   - USDT Dominance calculation fix (~6% not 60%)
   - US 10Y Yield daily comparison alerts
   - Fed Net Liquidity any-change alerts
   - 15-min interval metric comparisons
"""

import json
import sys
from pathlib import Path

# File path
FEATURE_LIST_PATH = Path(__file__).parent / "feature_list.json"

def main():
    # Load existing tests
    with open(FEATURE_LIST_PATH, 'r') as f:
        tests = json.load(f)
    
    print(f"📊 Current status: {len(tests)} tests")
    
    # Mark existing tests as false for re-verification
    # Test #2 (index 1): 7-Day Change logic needs update
    tests[1]["passes"] = False
    print("✏️  Marked Test #2 (7-Day Change deltas) as false")
    
    # Test #12 (index 11): Smart Diff logic needs update
    tests[11]["passes"] = False
    print("✏️  Marked Test #12 (Smart Diff logic) as false")
    
    # Define new tests
    new_tests = [
        {
            "category": "functional",
            "description": "USDT Dominance calculation: Correctly calculated as % of total crypto market cap (~6% not 60%)",
            "steps": [
                "Step 1: Fetch total crypto market cap from CoinGecko Global API",
                "Step 2: Fetch USDT market cap from DefiLlama Stablecoins API",
                "Step 3: Calculate USDT Dominance = (USDT MCap / Total Crypto MCap) * 100",
                "Step 4: Verify result is approximately 6% (not 60%)",
                "Step 5: Verify dashboard displays correct small percentage",
                "Step 6: Verify historical data shows correct values",
                "Step 7: Check that calculation is consistent across updates",
                "Step 8: Ensure proper error handling if API fails"
            ],
            "passes": False
        },
        {
            "category": "functional",
            "description": "US 10Y Treasury Yield: Notifications trigger on daily change exceeding threshold",
            "steps": [
                "Step 1: Wait for FRED API daily update (market close)",
                "Step 2: Verify fetch_metrics.py retrieves latest daily yield data",
                "Step 3: Compare today's yield value vs yesterday's yield value",
                "Step 4: Calculate daily percentage change",
                "Step 5: If |daily change| > threshold%, verify alert is sent",
                "Step 6: If |daily change| <= threshold%, verify NO alert is sent",
                "Step 7: Verify alert message shows daily change (not 7-day change)",
                "Step 8: Verify dashboard displays 'vs yesterday' indicator",
                "Step 9: Check threshold is user-customizable via Settings Modal",
                "Step 10: Verify notification includes correct baseline (previous day)"
            ],
            "passes": False
        },
        {
            "category": "functional",
            "description": "Fed Net Liquidity: Notifications trigger on ANY new data release regardless of change magnitude",
            "steps": [
                "Step 1: Wait for weekly FRED update (typically Wednesday)",
                "Step 2: Verify fetch_metrics.py detects new data availability",
                "Step 3: Verify alert is sent even if change is 0.01%",
                "Step 4: Verify alert is sent even if change is 0%",
                "Step 5: Confirm threshold for Fed Net Liquidity is hardcoded to 0%",
                "Step 6: Verify threshold is NOT user-customizable (unlike other metrics)",
                "Step 7: Check dashboard still displays 7-day change",
                "Step 8: Verify notification mentions 'New Fed data released'",
                "Step 9: Ensure no duplicate alerts for same data point",
                "Step 10: Confirm alert includes weekly change value"
            ],
            "passes": False
        },
        {
            "category": "functional",
            "description": "15-Minute Interval Metrics: Bitcoin, Stablecoin, USDT Dom, RWA compare against last update (not 7-day)",
            "steps": [
                "Step 1: Verify workflow runs every 15 minutes as scheduled",
                "Step 2: Confirm fetch_metrics.py saves snapshot to metrics_last_update.json",
                "Step 3: On next update, verify comparison is against last 15-min snapshot",
                "Step 4: Calculate 15-min interval change for Bitcoin price",
                "Step 5: If |15-min change| > 2% threshold, verify Bitcoin alert sent",
                "Step 6: Calculate 15-min interval change for Stablecoin MCap",
                "Step 7: If |15-min change| > 1% threshold, verify Stablecoin alert sent",
                "Step 8: Calculate 15-min interval change for USDT Dominance",
                "Step 9: If |15-min change| > 2% threshold, verify USDT Dom alert sent",
                "Step 10: Calculate 15-min interval change for RWA TVL",
                "Step 11: If |15-min change| > 1% threshold, verify RWA alert sent",
                "Step 12: Verify dashboard shows '15m' interval indicator for these metrics",
                "Step 13: Verify deltas show 15-min change (not 7-day change)",
                "Step 14: Check all thresholds are user-customizable",
                "Step 15: Verify metrics_last_update.json updates after each run"
            ],
            "passes": False
        }
    ]
    
    # Add new tests
    for i, test in enumerate(new_tests, start=1):
        tests.append(test)
        print(f"➕ Added new Test #{len(tests)}: {test['description'][:60]}...")
    
    # Save updated tests
    with open(FEATURE_LIST_PATH, 'w') as f:
        json.dump(tests, f, indent=2)
    
    # Count status
    passing = sum(1 for t in tests if t.get("passes", False))
    total = len(tests)
    percentage = (passing / total) * 100
    
    print(f"\n✅ Updated feature_list.json:")
    print(f"   Total tests: {total}")
    print(f"   Passing: {passing}/{total} ({percentage:.1f}%)")
    print(f"   Marked for re-verification: 2 tests (#2, #12)")
    print(f"   New tests added: {len(new_tests)}")
    print(f"\n🚀 Ready for autonomous agent implementation!")

if __name__ == "__main__":
    main()
