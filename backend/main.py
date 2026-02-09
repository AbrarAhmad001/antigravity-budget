from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.processing import process_text_content, process_audio_content, process_image_content
from services.sheets import add_transaction_to_sheet

import os

app = FastAPI(title="Multi-Modal Expense Tracker")

# CORS setup for frontend
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Transaction(BaseModel):
    transaction_type: str  # 'income', 'expense', or 'savings'
    date: str
    time: str = ""
    category: str
    amount: float
    vault_location: str = "Other"
    description: str = ""
    detail_source_item: str = "" # Source for Savings/Income, Item-Service for Expense
    attachments: str = ""
    secondary_date: str = "" # Spent Date for Savings
    secondary_time: str = "" # Spent Time for Savings

@app.get("/")
def read_root():
    return {"message": "Expense Tracker API is running"}

@app.post("/api/process/text")
async def process_text(text: str = Form(...)):
    return await process_text_content(text)

@app.post("/api/process/audio")
async def process_audio(file: UploadFile = File(...)):
    content = await file.read()
    return await process_audio_content(content)

@app.post("/api/process/image")
async def process_image(file: UploadFile = File(...)):
    content = await file.read()
    return await process_image_content(content)

from services.analytics import calculate_monthly_summary, get_chart_data
from services.budgets import Budget, get_budgets, add_budget, check_alerts, delete_budget
from services.categories import EXPENSE_CATEGORIES, INCOME_CATEGORIES, DEFAULT_SAVINGS_CATEGORIES, VAULT_LOCATIONS

@app.get("/api/summary/monthly")
async def get_monthly_summary(month: int, year: int):
    return calculate_monthly_summary(month, year)

@app.get("/api/summary/charts")
async def get_charts(month: int, year: int):
    return get_chart_data(month, year)

@app.get("/api/summary/available-years")
async def get_available_years():
    """Get list of unique years from the sheet data."""
    from services.analytics import get_all_transactions
    transactions = get_all_transactions()
    
    years = set()
    for t in transactions:
        year_str = t.get('Year', '')
        if year_str:
            try:
                years.add(int(year_str))
            except (ValueError, TypeError):
                continue
    
    return {"years": sorted(list(years))}

@app.get("/api/analytics/overall-savings")
async def get_overall_savings_endpoint():
    from services.analytics import get_overall_savings
    return get_overall_savings()

@app.get("/api/budgets")
async def list_budgets(month: int = None, year: int = None):
    return get_budgets(month, year)

@app.post("/api/budgets")
async def create_budget(budget: Budget):
    return add_budget(budget)

@app.delete("/api/budgets/{budget_id}")
async def remove_budget(budget_id: str):
    return delete_budget(budget_id)

@app.get("/api/alerts")
async def get_alerts(month: int, year: int):
    return check_alerts(month, year)

from services.categories import load_categories, save_categories, TRANSACTION_TYPES

@app.get("/api/categories")
async def get_categories():
    cats = load_categories()
    return {
        "expense": cats.get("expense", []),
        "income": cats.get("income", []),
        "savings": cats.get("savings", []),
        "vaults": cats.get("vaults", [])
    }

@app.post("/api/categories")
async def update_categories(categories: dict):
    save_categories(categories)
    return {"status": "success"}

@app.post("/api/confirm")
async def confirm_transactions(transactions: list[Transaction]):
    results = []
    for t in transactions:
        res = add_transaction_to_sheet(t)
        results.append(res)
    return results
