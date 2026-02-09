# backend/services/analytics.py
from services.sheets import get_sheet_client, SHEET_ID
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_all_transactions():
    client = get_sheet_client()
    if not client:
        return []
    
    try:
        sheet = client.open_by_key(SHEET_ID).sheet1
        data = sheet.get_all_values()
        if not data:
            return []
        
        # Updated Schema (8 cols): Date, Amount, Category, Type, Description, Timestamp, Year, Month
        headers = data[0]
        rows = data[1:]
        
        # Mapping index based on headers to be safe
        header_map = {h.strip(): i for i, h in enumerate(headers)}
        
        transactions = []
        for row in rows:
            if len(row) < 4: continue
            transactions.append({
                "Date": row[header_map.get("Date", 0)],
                "Amount": row[header_map.get("Amount", 1)],
                "Category": row[header_map.get("Category", 2)],
                "Type": row[header_map.get("Type", 3)],
                "Description": row[header_map.get("Description", 4)] if "Description" in header_map else "",
                "Year": row[header_map.get("Year", 6)] if "Year" in header_map and len(row) > 6 else "",
                "Month": row[header_map.get("Month", 7)] if "Month" in header_map and len(row) > 7 else ""
            })
        return transactions
    except Exception as e:
        logger.error(f"Error fetching transactions for analytics: {e}")
        return []

def parse_date(date_str):
    """Robust date parsing for multiple formats."""
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def calculate_monthly_summary(month: int, year: int):
    transactions = get_all_transactions()
    
    # Import categories dynamically to handle user-defined ones
    from services.categories import load_categories
    all_cats = load_categories()
    savings_cat_list = all_cats.get("savings", [])
    
    # Convert month number to month name
    month_name = datetime(year, month, 1).strftime("%B")
    
    income = 0
    expense = 0
    savings = 0
    income_categories = {}
    expense_categories = {}
    savings_categories = {}

    for t in transactions:
        try:
            # Use Year and Month columns for filtering
            t_year = t.get('Year', '')
            t_month = t.get('Month', '')
            
            # Convert year to int for comparison
            try:
                t_year_int = int(t_year) if t_year else 0
            except (ValueError, TypeError):
                continue
            
            if t_year_int == year and t_month == month_name:
                t_type = t['Type'].strip().lower()
                # Remove apostrophes that Google Sheets adds to text-formatted numbers
                amount_str = str(t['Amount']).lstrip("'")
                amount = float(amount_str)
                cat = t['Category']

                if t_type == 'income':
                    income += amount
                    income_categories[cat] = income_categories.get(cat, 0) + amount
                elif t_type == 'expense':
                    # Check if this expense is actually spending from a Savings Fund
                    if cat in savings_cat_list:
                        # Subtract from savings instead of adding to expense
                        savings -= amount
                        savings_categories[cat] = savings_categories.get(cat, 0) - amount
                    else:
                        expense += amount
                        expense_categories[cat] = expense_categories.get(cat, 0) + amount
                elif t_type == 'savings':
                    savings += amount
                    savings_categories[cat] = savings_categories.get(cat, 0) + amount
        except Exception as e:
            logger.warning(f"Error processing row for summary: {e}")
            continue

    return {
        "month": month,
        "year": year,
        "total_income": income,
        "total_expense": expense,
        "total_savings": savings,
        "net_balance": income - expense - savings,
        "income_breakdown": income_categories,
        "expense_breakdown": expense_categories,
        "savings_breakdown": savings_categories
    }

def get_chart_data(month: int, year: int):
    transactions = get_all_transactions()
    
    # Import categories dynamically
    from services.categories import load_categories
    all_cats = load_categories()
    savings_cat_list = all_cats.get("savings", [])
    
    # Convert month number to month name
    month_name = datetime(year, month, 1).strftime("%B")
    
    daily_data = {}
    
    for t in transactions:
        try:
            # Use Year and Month columns for filtering
            t_year = t.get('Year', '')
            t_month = t.get('Month', '')
            
            try:
                t_year_int = int(t_year) if t_year else 0
            except (ValueError, TypeError):
                continue

            if t_year_int == year and t_month == month_name:
                # Parse date to get the day
                t_date = parse_date(t['Date'])
                if not t_date: continue
                
                day = t_date.day
                t_type = t['Type'].strip().lower()
                # Remove apostrophes that Google Sheets adds to text-formatted numbers
                amount_str = str(t['Amount']).lstrip("'")
                amount = float(amount_str)
                cat = t['Category']
                
                if day not in daily_data:
                    daily_data[day] = {"day": day, "income": 0, "expense": 0, "savings": 0}
                
                # Apply same Net Logic to Chart Data
                if t_type == 'expense' and cat in savings_cat_list:
                     daily_data[day]['savings'] -= amount
                elif t_type in daily_data[day]:
                    daily_data[day][t_type] += amount
        except Exception:
            continue
            
    result = [daily_data[d] for d in sorted(daily_data.keys())]
    return result


def get_overall_savings():
    """
    Calculate total overall savings across all time.
    Subtracts expenses made from savings categories (e.g. spending from Investment Fund).
    """
    transactions = get_all_transactions()
    from services.categories import DEFAULT_SAVINGS_CATEGORIES
    
    savings_map = {}
    total_savings = 0
    
    for t in transactions:
        amount = 0
        try:
            # Clean amount string
            amount_str = str(t.get('Amount', 0)).lstrip("'")
            amount = float(amount_str)
        except (ValueError, TypeError):
            continue
            
        category = t.get('Category', '').strip()
        t_type = t.get('Type', '').strip().lower() # Normalize to lowercase
        
        # Check against savings categories
        is_savings_cat = category in DEFAULT_SAVINGS_CATEGORIES
        
        if t_type == 'savings':
            total_savings += amount
            savings_map[category] = savings_map.get(category, 0) + amount
        elif t_type == 'expense' and is_savings_cat:
            total_savings -= amount
            savings_map[category] = savings_map.get(category, 0) - amount
        elif t_type == 'income' and is_savings_cat:
            # Theoretical case: Income directly into a savings fund
            total_savings += amount
            savings_map[category] = savings_map.get(category, 0) + amount
            
    # Filter out zero balances for the chart
    breakdown = {k: v for k, v in savings_map.items() if v != 0}
    
    return {
        "total_overall_savings": total_savings,
        "savings_breakdown": breakdown
    }
