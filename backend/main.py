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
    date: str
    amount: float
    category: str
    description: str
    type: str  # 'income' or 'expense'

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

@app.post("/api/confirm")
async def confirm_transactions(transactions: list[Transaction]):
    results = []
    for t in transactions:
        res = add_transaction_to_sheet(t)
        results.append(res)
    return results
