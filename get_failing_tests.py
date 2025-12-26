import json

with open('feature_list.json', 'r') as f:
    data = json.load(f)

failing = [t for t in data if not t['passes']]
print(f"Failing tests: {len(failing)}/66\n")

for i, test in enumerate(failing, 1):
    test_num = data.index(test) + 1
    print(f"{i}. Test #{test_num}: {test['description']}")
    print(f"   Category: {test['category']}")
    print()
