import json

with open('../feature_list.json', 'r') as f:
    data = json.load(f)

passing = sum(1 for t in data if t['passes'])
total = len(data)
percentage = (passing / total) * 100

print(f"\n{'='*60}")
print(f"STRATEGIC COCKPIT DASHBOARD - TEST STATUS")
print(f"{'='*60}")
print(f"Passing Tests: {passing}/{total}")
print(f"Completion:    {percentage:.1f}%")
print(f"Remaining:     {total - passing} tests")
print(f"{'='*60}\n")

# Show remaining tests
failing = [t for t in data if not t['passes']]
if failing:
    print(f"Remaining Tests to Complete:\n")
    for i, test in enumerate(failing, 1):
        print(f"{i}. {test['description']}")
