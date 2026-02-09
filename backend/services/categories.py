import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CATEGORIES_FILE = os.path.join(DATA_DIR, "categories.json")

def load_categories():
    if not os.path.exists(CATEGORIES_FILE):
        return {
            "expense": [],
            "income": [],
            "savings": [],
            "vaults": []
        }
    with open(CATEGORIES_FILE, "r") as f:
        return json.load(f)

def save_categories(categories):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CATEGORIES_FILE, "w") as f:
        json.dump(categories, f, indent=4)

# Load initial values
_cats = load_categories()

EXPENSE_CATEGORIES = _cats.get("expense", [])
INCOME_CATEGORIES = _cats.get("income", [])
DEFAULT_SAVINGS_CATEGORIES = _cats.get("savings", [])
VAULT_LOCATIONS = _cats.get("vaults", ["Bkash", "Bank", "Other"])
TRANSACTION_TYPES = ["expense", "income", "savings"]
