#!/usr/bin/env python3
"""
Diagnostic script to inspect Polymarket API response and find alternative filtering fields
"""
import requests
import json

def inspect_polymarket_api():
    """Fetch and inspect Polymarket API structure"""
    print("=" * 70)
    print("Polymarket API Structure Inspector")
    print("=" * 70)
    
    url = "https://gamma-api.polymarket.com/markets"
    params = {
        "closed": "false",
        "limit": 10  # Get 10 markets for inspection
    }
    
    try:
        response = requests.get(url, params=params, timeout=30, verify=False)
        response.raise_for_status()
        markets = response.json()
        
        if not isinstance(markets, list) or len(markets) == 0:
            print("❌ No markets returned")
            return
        
        print(f"\n✅ Retrieved {len(markets)} markets\n")
        
        # Inspect first market in detail
        first_market = markets[0]
        print("=" * 70)
        print("SAMPLE MARKET #1 - Full Structure:")
        print("=" * 70)
        print(json.dumps(first_market, indent=2))
        
        # Check all markets for patterns
        print("\n" + "=" * 70)
        print("ANALYSIS: Checking for finance/crypto related keywords in questions")
        print("=" * 70)
        
        finance_keywords = ["bitcoin", "btc", "crypto", "fed", "federal reserve", 
                           "inflation", "interest", "economy", "stock", "market",
                           "dollar", "treasury", "ethereum", "eth", "finance"]
        
        finance_markets = []
        for market in markets:
            question = market.get("question", "").lower()
            description = market.get("description", "").lower()
            
            # Check if any finance keyword is in question or description
            matched_keywords = [kw for kw in finance_keywords if kw in question or kw in description]
            
            if matched_keywords:
                finance_markets.append({
                    "question": market.get("question", ""),
                    "volume": market.get("volume", 0),
                    "matched_keywords": matched_keywords,
                    "description_snippet": description[:100] if description else "N/A"
                })
        
        print(f"\n🎯 Found {len(finance_markets)} finance/crypto related markets (out of {len(markets)}):\n")
        for idx, m in enumerate(finance_markets, 1):
            volume = float(m['volume']) if m['volume'] else 0
            print(f"{idx}. {m['question'][:80]}")
            print(f"   Volume: ${volume:,.0f}")
            print(f"   Keywords matched: {', '.join(m['matched_keywords'])}")
            print(f"   Description: {m['description_snippet']}...\n")
        
        # Check tags field
        print("\n" + "=" * 70)
        print("TAGS FIELD ANALYSIS:")
        print("=" * 70)
        all_tags = set()
        for market in markets:
            tags = market.get("tags", [])
            print(f"Market: {market.get('question', '')[:60]}...")
            print(f"  Tags: {tags}")
            if isinstance(tags, list):
                all_tags.update(tags)
        
        print(f"\n📊 Unique tags found across all markets: {sorted(list(all_tags))}")
        
        # Check events field
        print("\n" + "=" * 70)
        print("EVENTS FIELD ANALYSIS:")
        print("=" * 70)
        for idx, market in enumerate(markets[:3], 1):  # Check first 3
            events = market.get("events", [])
            print(f"\nMarket #{idx}: {market.get('question', '')[:60]}...")
            if events:
                print(f"  Events structure: {type(events)}")
                if isinstance(events, list) and len(events) > 0:
                    print(f"  First event: {json.dumps(events[0], indent=4)}")
            else:
                print(f"  Events: {events}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    inspect_polymarket_api()
