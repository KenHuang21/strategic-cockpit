#!/usr/bin/env python3
"""
Test #73: ETF Flow Summation Check
Verify that the 5-Day Trend Bar Chart adds up correctly
"""

import json
import sys

def verify_etf_summation():
    """Verify ETF flow summation matches the displayed total"""

    # Step 1-2: Load dashboard data and extract ETF flows
    try:
        with open('data/dashboard_data.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ FAIL: dashboard_data.json not found")
        return False

    etf_data = data.get('btc_etf_flows', {})
    flows = etf_data.get('flows', [])
    net_5day = etf_data.get('net_5day', 0)

    if not flows:
        print("❌ FAIL: No ETF flow data found")
        return False

    # Step 2: Record daily flow values
    print("\n📊 ETF Flow Data:")
    print("=" * 50)
    daily_flows = []
    for flow_data in flows:
        date = flow_data['date']
        flow = flow_data['flow']
        daily_flows.append(flow)
        print(f"  {date}: {flow:+.0f}M")

    # Step 3: Sum the 5 values manually
    calculated_sum_m = sum(daily_flows)
    calculated_sum_b = calculated_sum_m / 1000  # Convert M to B

    print("\n🧮 Calculations:")
    print("=" * 50)
    print(f"  Individual flows: {', '.join([f'{f:+.0f}M' for f in daily_flows])}")
    print(f"  Sum in millions: {calculated_sum_m:+.0f}M")
    print(f"  Sum in billions: {calculated_sum_b:+.2f}B")

    # Step 4: Read the displayed summary
    print(f"\n📋 Dashboard Summary:")
    print("=" * 50)
    print(f"  5-Day Net Flow (data): {net_5day:+.1f}B")

    # Step 5: Assert sum equals summary
    tolerance = 0.01  # Allow 0.01B tolerance for rounding
    difference = abs(calculated_sum_b - net_5day)

    print(f"\n🔍 Verification:")
    print("=" * 50)
    print(f"  Expected: {calculated_sum_b:+.2f}B")
    print(f"  Actual:   {net_5day:+.1f}B")
    print(f"  Difference: {difference:.3f}B")
    print(f"  Tolerance: {tolerance:.3f}B")

    if difference > tolerance:
        print(f"\n❌ FAIL: Sum mismatch!")
        print(f"   Expected {calculated_sum_b:.2f}B but got {net_5day:.1f}B")
        print(f"   Difference: {difference:.3f}B (exceeds tolerance of {tolerance:.3f}B)")
        return False

    # Step 6: Verify color coding
    expected_positive = calculated_sum_m > 0
    actual_positive = net_5day > 0

    print(f"\n🎨 Color Coding:")
    print("=" * 50)
    print(f"  Sum is positive: {expected_positive}")
    print(f"  Display should be: {'Green' if expected_positive else 'Red'}")
    print(f"  Actual value positive: {actual_positive}")

    if expected_positive != actual_positive:
        print(f"\n❌ FAIL: Color coding mismatch!")
        return False

    print(f"\n✅ PASS: ETF Flow summation verified correctly!")
    print(f"   ✓ Sum of daily flows ({calculated_sum_m:.0f}M) equals displayed net ({net_5day:.1f}B = {net_5day*1000:.0f}M)")
    print(f"   ✓ Color coding correct ({'Green' if net_5day >= 0 else 'Red'})")

    return True

if __name__ == "__main__":
    success = verify_etf_summation()
    sys.exit(0 if success else 1)
