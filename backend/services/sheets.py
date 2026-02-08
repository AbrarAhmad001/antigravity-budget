import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os
import json
import logging
from pydantic import BaseModel
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Scope for Google Sheets API
SCOPE = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

CREDS_FILE = os.path.join(os.path.dirname(__file__), "..", "credentials.json")
SHEET_ID = os.getenv("SHEET_ID", "1xy1Rl8VNvaUchMVaNzzUQtctfa8IAvtbVuaN5MvkKgY")

class Transaction(BaseModel):
    date: str
    amount: float
    category: str
    description: str
    type: str

def get_sheet_client():
    """Initialize and return the Google Sheets client."""
    try:
        creds = None
        # Try to load credentials from environment variable first (for Vercel)
        creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
        if creds_json:
            try:
                creds_data = json.loads(creds_json)
                creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_data, SCOPE)
                logger.info("Loaded Google credentials from environment variable.")
            except Exception as e:
                logger.error(f"Error loading credentials from environment: {e}")
                # Continue to try file-based credentials if env var fails
        
        if not creds: # If credentials not loaded from env var or failed
            # Fall back to file-based credentials (for local development)
            if not os.path.exists(CREDS_FILE):
                logger.warning(f"{CREDS_FILE} not found. Sheets integration disabled.")
                return None
            creds = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
            logger.info(f"Loaded Google credentials from file: {CREDS_FILE}")
        
        if not creds:
            logger.error("No valid Google credentials found.")
            return None

        client = gspread.authorize(creds)
        return client
    except Exception as e:
        logger.error(f"Error authenticating with Google Sheets: {e}")
        return None

def add_transaction_to_sheet(transaction: Transaction):
    client = get_sheet_client() # Updated function call
    if not client:
        return {"status": "simulated", "message": "Credentials missing, transaction not saved to Sheets.", "data": transaction.dict()}

    try:
        # Open sheet by ID strictly (requires only Sheets API, not Drive API)
        sheet = client.open_by_key(SHEET_ID).sheet1
        
        # Prepare row
        row = [
            transaction.date,
            str(transaction.amount),
            transaction.category,
            transaction.type,
            transaction.description,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S") # Timestamp
        ]
        
        sheet.append_row(row)
        return {"status": "success", "message": "Transaction saved to Sheets.", "data": transaction.dict()}
    except Exception as e:
        logger.error(f"Error saving to sheet: {e}")
        return {"status": "error", "message": str(e), "data": transaction.dict()}
