#!/usr/bin/env python3
"""
Test script for Smart Diff logic
Tests various scenarios to ensure alerts trigger correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from fetch_metrics import smart_diff

def test_smart_diff():
    """Test Smart Diff logic with various scenarios"""

    print("=" * 60)
    print("Testing Smart Diff Logic")
    print("=" * 60)

    # Test thresholds (in decimal form: 0.01 = 1%)
    thresholds = {
        "btc_pct": 0.01,        # 1% for Bitcoin
        "stable_pct": 0.001,    # 0.1% for stablecoins
        "yield_pct": 0.05,      # 5% for yields
        "liquidity_pct": 0.02,  # 2% for liquidity
        "usdt_dom_pct": 0.005,  # 0.5% for USDT dominance
        "rwa_pct": 0.03         # 3% for RWA
    }

    # Test Case 1: Bitcoin price increases by 2% (should trigger, threshold is 1%)
    print("\n📝 Test Case 1: Bitcoin price +2% (should trigger)")
    old_data = {
        "metrics": {
            "btc_price": {"value": 100000, "delta": 0},
            "stablecoin_mcap": {"value": 300, "delta": 0},
            "us_10y_yield": {"value": 4.5, "delta": 0},
            "fed_net_liquidity": {"value": 6200, "delta": 0},
            "usdt_dominance": {"value": 60, "delta": 0},
            "rwa_tvl": {"value": 8.5, "delta": 0}
        }
    }

    new_data = {
        "metrics": {
            "btc_price": {"value": 102000, "delta": 2},  # +2%
            "stablecoin_mcap": {"value": 300, "delta": 0},
            "us_10y_yield": {"value": 4.5, "delta": 0},
            "fed_net_liquidity": {"value": 6200, "delta": 0},
            "usdt_dominance": {"value": 60, "delta": 0},
            "rwa_tvl": {"value": 8.5, "delta": 0}
        }
    }

    alerts = smart_diff(old_data, new_data, thresholds)
    print(f"Result: {len(alerts)} alert(s)")
    assert len(alerts) == 1, f"Expected 1 alert, got {len(alerts)}"
    assert alerts[0]["metric"] == "Bitcoin Price", "Expected Bitcoin Price alert"
    print("✅ Test Case 1 PASSED")

    # Test Case 2: Bitcoin price increases by 0.5% (should NOT trigger, threshold is 1%)
    print("\n📝 Test Case 2: Bitcoin price +0.5% (should NOT trigger)")
    new_data["metrics"]["btc_price"]["value"] = 100500  # +0.5%

    alerts = smart_diff(old_data, new_data, thresholds)
    print(f"Result: {len(alerts)} alert(s)")
    assert len(alerts) == 0, f"Expected 0 alerts, got {len(alerts)}"
    print("✅ Test Case 2 PASSED")

    # Test Case 3: Multiple metrics change (BTC +1.5%, Stablecoin +0.2%)
    print("\n📝 Test Case 3: Multiple changes (BTC +1.5%, Stablecoin +0.2%)")
    new_data["metrics"]["btc_price"]["value"] = 101500  # +1.5%
    new_data["metrics"]["stablecoin_mcap"]["value"] = 300.6  # +0.2%

    alerts = smart_diff(old_data, new_data, thresholds)
    print(f"Result: {len(alerts)} alert(s)")
    assert len(alerts) == 2, f"Expected 2 alerts, got {len(alerts)}"
    print("✅ Test Case 3 PASSED")

    # Test Case 4: Decrease also triggers (BTC -2%)
    print("\n📝 Test Case 4: Bitcoin price -2% (decrease should trigger)")
    new_data["metrics"]["btc_price"]["value"] = 98000  # -2%
    new_data["metrics"]["stablecoin_mcap"]["value"] = 300  # Reset

    alerts = smart_diff(old_data, new_data, thresholds)
    print(f"Result: {len(alerts)} alert(s)")
    assert len(alerts) == 1, f"Expected 1 alert, got {len(alerts)}"
    assert alerts[0]["direction"] == "decreased", "Expected decrease direction"
    print("✅ Test Case 4 PASSED")

    # Test Case 5: Edge case - exactly at threshold (1%)
    print("\n📝 Test Case 5: Bitcoin price +1% (exactly at threshold)")
    new_data["metrics"]["btc_price"]["value"] = 101000  # +1%

    alerts = smart_diff(old_data, new_data, thresholds)
    print(f"Result: {len(alerts)} alert(s)")
    assert len(alerts) == 1, f"Expected 1 alert (>= threshold), got {len(alerts)}"
    print("✅ Test Case 5 PASSED")

    # Test Case 6: All metrics change above threshold
    print("\n📝 Test Case 6: All metrics change above threshold")
    new_data["metrics"]["btc_price"]["value"] = 102000  # +2%
    new_data["metrics"]["stablecoin_mcap"]["value"] = 301  # +0.33%
    new_data["metrics"]["us_10y_yield"]["value"] = 4.73  # +5.1%
    new_data["metrics"]["fed_net_liquidity"]["value"] = 6330  # +2.1%
    new_data["metrics"]["usdt_dominance"]["value"] = 60.4  # +0.67%
    new_data["metrics"]["rwa_tvl"]["value"] = 8.8  # +3.5%

    alerts = smart_diff(old_data, new_data, thresholds)
    print(f"Result: {len(alerts)} alert(s)")
    assert len(alerts) == 6, f"Expected 6 alerts, got {len(alerts)}"
    print("✅ Test Case 6 PASSED")

    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_smart_diff()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
