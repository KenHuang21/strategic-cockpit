#!/usr/bin/env python3
import json

with open('feature_list.json', 'r') as f:
    tests = json.load(f)

total = len(tests)
passing = sum(1 for t in tests if t["passes"])
failing = sum(1 for t in tests if not t["passes"])

print(f"Total tests: {total}")
print(f"Passing: {passing}")
print(f"Failing: {failing}")
print(f"Completion: {passing}/{total} ({passing/total*100:.1f}%)")

if failing > 0:
    print(f"\nRemaining failing tests:")
    for i, t in enumerate(tests):
        if not t["passes"]:
            print(f"  {i+1}. {t['description']}")
