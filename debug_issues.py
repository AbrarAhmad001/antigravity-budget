
import sys
import os
import json

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from services.analytics import get_all_transactions, get_overall_savings
from services.budgets import get_budgets

print("--- DEBUGGING SAVINGS ---")
transactions = get_all_transactions()
print(f"Total Transactions: {len(transactions)}")
if len(transactions) > 0:
    print("Sample Transaction:", transactions[0])

savings = get_overall_savings()
print("Overall Savings Result:", savings)

print("\n--- DEBUGGING BUDGETS ---")
# Check budgets.json directly
with open('backend/budgets.json', 'r') as f:
    raw_budgets = json.load(f)
    print("Raw Budgets.json content:")
    print(json.dumps(raw_budgets, indent=2))
