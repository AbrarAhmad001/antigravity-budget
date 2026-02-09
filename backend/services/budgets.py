import json
import os
import uuid
from pydantic import BaseModel, Field
from services.analytics import calculate_monthly_summary
from typing import Optional, List
from services.categories import EXPENSE_CATEGORIES, DEFAULT_SAVINGS_CATEGORIES

BUDGET_FILE = os.path.join(os.path.dirname(__file__), "..", "budgets.json")

class Budget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    amount: float
    month: Optional[int] = None
    year: Optional[int] = None
    threshold: float = 0.8 # 80%

def load_budgets():
    if not os.path.exists(BUDGET_FILE):
        return []
    with open(BUDGET_FILE, "r") as f:
        data = json.load(f)
        
    # Migration: Ensure all budgets have IDs
    migrated = False
    for b in data:
        if 'id' not in b:
            b['id'] = str(uuid.uuid4())
            migrated = True
            
    if migrated:
        save_budgets(data)
        
    return data

def save_budgets(budgets):
    with open(BUDGET_FILE, "w") as f:
        json.dump(budgets, f, indent=4)

def get_budgets(month: Optional[int] = None, year: Optional[int] = None):
    budgets = load_budgets()
    if month is not None and year is not None:
        return [b for b in budgets if b.get('month') == month and b.get('year') == year]
    return budgets

def add_budget(budget: Budget):
    budgets = load_budgets()
    
    # Check for duplicate (same category, month, year) - Update if exists
    for b in budgets:
        if (b['category'] == budget.category and 
            b.get('month') == budget.month and 
            b.get('year') == budget.year):
            
            # Update existing
            b['amount'] = budget.amount
            b['threshold'] = budget.threshold
            save_budgets(budgets)
            return b
            
    # Add new
    new_budget = budget.dict()
    if not new_budget.get('id'):
        new_budget['id'] = str(uuid.uuid4())
        
    budgets.append(new_budget)
    save_budgets(budgets)
    return new_budget

def delete_budget(budget_id: str):
    budgets = load_budgets()
    initial_len = len(budgets)
    new_budgets = [b for b in budgets if b.get('id') != budget_id]
    
    if len(new_budgets) < initial_len:
        save_budgets(new_budgets)
        return True
    return False

def check_alerts(month: int, year: int):
    summary = calculate_monthly_summary(month, year)
    budgets = get_budgets(month, year)
    alerts = []
    
    # Combine expense and savings breakdowns
    combined_spending = {
        **summary.get('expense_breakdown', {}),
        **summary.get('savings_breakdown', {})
    }
    
    for b in budgets:
        spending = combined_spending.get(b['category'], 0)
        category_type = "savings" if b['category'] in DEFAULT_SAVINGS_CATEGORIES else "expense"
        
        # Determine status and color
        status = "normal"
        msg = ""
        
        if category_type == "expense":
            if spending >= b['amount']:
                status = "critical" # Red
                msg = "Goal Reached!!"
            elif spending >= b['amount'] * b['threshold']:
                status = "warning" # Yellow
        else: # Savings
            if spending >= b['amount']:
                status = "success" # Blue
                msg = "Goal Reached!!"
                
        alerts.append({
            "category": b['category'],
            "limit": b['amount'],
            "spent": spending,
            "percentage": (spending / b['amount']) * 100 if b['amount'] > 0 else 0,
            "status": status,
            "msg": msg,
            "type": category_type
        })
    return alerts
