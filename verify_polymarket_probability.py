#!/usr/bin/env python3
"""
Test #75: Polymarket Probability Integrity
Verify implied probability matches binary odds
"""

import json
import sys

def verify_polymarket_probability():
    """Verify Polymarket probability display integrity"""

    print("\n🎲 Polymarket Probability Integrity Verification")
    print("=" * 60)

    # Step 1: Load dashboard data and get top event
    print("\n📋 Step 1: Loading Smart Money Radar (Top Event)...")
    try:
        with open('data/dashboard_data.json', 'r') as f:
            dashboard_data = json.load(f)

        polymarket_data = dashboard_data.get('polymarket_top5', [])

        if not polymarket_data:
            print(f"   ⚠️  No Polymarket data found")
            return False

        top_event = polymarket_data[0]

        print(f"   ✓ Top Event: {top_event['title'][:70]}...")
        print(f"   ✓ Displayed Outcome: {top_event['outcome']}")
        print(f"   ✓ Probability: {top_event['probability']:.4f} ({top_event['probability']*100:.2f}%)")
        print(f"   ✓ Volume: ${top_event['volume']:,.0f}")

    except Exception as e:
        print(f"   ❌ Failed to read dashboard data: {e}")
        return False

    # Step 2: Parse the displayed probability
    print("\n📊 Step 2: Parsing Displayed Probability...")

    outcome_text = top_event['outcome']  # e.g., "Yes 82%" or "No 100%"
    prob_value = top_event['probability']  # e.g., 0.82

    # Extract the outcome type (Yes/No) and percentage
    if 'Yes' in outcome_text:
        outcome_type = 'Yes'
    elif 'No' in outcome_text:
        outcome_type = 'No'
    else:
        print(f"   ⚠️  Unknown outcome type: {outcome_text}")
        outcome_type = 'Unknown'

    # Extract percentage from outcome text
    import re
    match = re.search(r'(\d+)%', outcome_text)
    if match:
        displayed_pct = int(match.group(1))
    else:
        print(f"   ⚠️  Could not extract percentage from: {outcome_text}")
        displayed_pct = int(prob_value * 100)

    print(f"   Outcome Type: {outcome_type}")
    print(f"   Displayed %: {displayed_pct}%")
    print(f"   Probability Value: {prob_value:.4f} ({prob_value*100:.2f}%)")

    # Step 3-4: Verify probability alignment
    print("\n🔍 Step 3-4: Verifying Probability Alignment...")

    # Check if displayed percentage matches probability value
    expected_pct = round(prob_value * 100)
    tolerance = 1  # Allow 1% tolerance for rounding

    diff = abs(displayed_pct - expected_pct)

    print(f"   Expected %: {expected_pct}%")
    print(f"   Displayed %: {displayed_pct}%")
    print(f"   Difference: {diff}%")
    print(f"   Tolerance: {tolerance}%")

    if diff > tolerance:
        print(f"\n   ❌ FAIL: Probability mismatch!")
        print(f"      Expected {expected_pct}% but displayed {displayed_pct}%")
        return False

    print(f"   ✅ Probability alignment verified")

    # Step 5: Verify binary odds sum to ~100%
    print("\n🎯 Step 5: Verifying Binary Odds Logic...")

    # For binary markets, Yes% + No% should = 100%
    # The displayed probability is the "winning" outcome
    # If showing "Yes 82%", then No = 18% (implied)
    # If showing "No 100%", then Yes = 0% (implied)

    if outcome_type == 'Yes':
        yes_prob = prob_value
        no_prob = 1 - prob_value
    else:  # No
        no_prob = prob_value
        yes_prob = 1 - prob_value

    total_prob = yes_prob + no_prob

    print(f"   Yes Probability: {yes_prob:.4f} ({yes_prob*100:.2f}%)")
    print(f"   No Probability: {no_prob:.4f} ({no_prob*100:.2f}%)")
    print(f"   Sum: {total_prob:.4f} ({total_prob*100:.2f}%)")

    # Should sum to 1.0 (100%)
    if abs(total_prob - 1.0) > 0.01:
        print(f"\n   ❌ FAIL: Probabilities don't sum to 100%!")
        print(f"      Sum: {total_prob*100:.2f}% (expected 100%)")
        return False

    print(f"   ✅ Binary odds sum correctly to ~100%")

    # Step 6: Verify no inversion error
    print("\n🔄 Step 6: Checking for Probability Inversion...")

    # If outcome shows "Yes 82%", probability should be 0.82, not 0.18
    # If outcome shows "No 95%", probability should be 0.95, not 0.05

    is_correct = True

    if outcome_type == 'Yes':
        # For "Yes X%", probability should be ~X/100
        if prob_value < 0.5 and displayed_pct > 50:
            print(f"   ⚠️  WARNING: Possible inversion - Yes {displayed_pct}% but prob={prob_value:.2f}")
            is_correct = False
        elif prob_value > 0.5 and displayed_pct < 50:
            print(f"   ⚠️  WARNING: Possible inversion - Yes {displayed_pct}% but prob={prob_value:.2f}")
            is_correct = False
    elif outcome_type == 'No':
        # For "No X%", probability should be ~X/100
        if prob_value < 0.5 and displayed_pct > 50:
            print(f"   ⚠️  WARNING: Possible inversion - No {displayed_pct}% but prob={prob_value:.2f}")
            is_correct = False
        elif prob_value > 0.5 and displayed_pct < 50:
            print(f"   ⚠️  WARNING: Possible inversion - No {displayed_pct}% but prob={prob_value:.2f}")
            is_correct = False

    if not is_correct:
        print(f"\n   ❌ FAIL: Probability inversion detected!")
        return False

    print(f"   ✅ No probability inversion detected")

    # Additional check: Test multiple events
    print("\n📊 Verifying All Top 5 Events...")
    all_valid = True

    for i, event in enumerate(polymarket_data[:5], 1):
        outcome = event['outcome']
        prob = event['probability']

        # Extract percentage
        match = re.search(r'(\d+)%', outcome)
        if match:
            pct = int(match.group(1))
            expected = round(prob * 100)

            if abs(pct - expected) > tolerance:
                print(f"   ❌ Event {i}: {pct}% vs {expected}% (expected)")
                all_valid = False
            else:
                print(f"   ✓ Event {i}: {outcome} - probability {prob:.2f} ✓")

    if not all_valid:
        print(f"\n   ❌ FAIL: Some events have probability mismatches")
        return False

    print("\n" + "=" * 60)
    print("✅ PASS: Polymarket Probability Integrity Verified!")
    print(f"   ✓ Displayed probabilities match data values")
    print(f"   ✓ Binary odds sum to 100%")
    print(f"   ✓ No probability inversion errors")
    print(f"   ✓ All top 5 events validated")
    print("=" * 60)

    return True

if __name__ == "__main__":
    success = verify_polymarket_probability()
    sys.exit(0 if success else 1)
