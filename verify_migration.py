import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from services.budgets import load_budgets

print("--- MIGRATION & VERIFICATION ---")
budgets = load_budgets() # This should trigger the migration code in budgets.py
print(f"Loaded {len(budgets)} budgets.")

missing_ids = [b for b in budgets if 'id' not in b]
if missing_ids:
    print(f"ERROR: {len(missing_ids)} budgets strictly missing IDs!")
else:
    print("SUCCESS: All budgets have IDs.")

with open('backend/budgets.json', 'r') as f:
    raw = json.load(f)
    print("First budget in file:", raw[0])
