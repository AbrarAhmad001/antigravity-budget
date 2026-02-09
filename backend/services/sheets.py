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
    transaction_type: str
    date: str
    time: str = ""
    category: str
    amount: float
    vault_location: str = "Other"
    description: str = ""
    detail_source_item: str = ""
    attachments: str = ""
    secondary_date: str = ""
    secondary_time: str = ""

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
        
        # Prepare augmented description
        # Include Vault and Details if they are not the same as description
        desc_parts = [transaction.description]
        if transaction.vault_location and transaction.vault_location != "Other":
            desc_parts.append(f"[Vault: {transaction.vault_location}]")
        if transaction.detail_source_item and transaction.detail_source_item != transaction.description:
            desc_parts.append(f"[Detail: {transaction.detail_source_item}]")
        
        full_description = " ".join(desc_parts)
        
        # Parse date to extract Year and Month
        try:
            parsed_date = datetime.strptime(transaction.date, "%Y-%m-%d")
            year = parsed_date.year
            month = parsed_date.strftime("%B")  # Full month name
        except ValueError:
            # Fallback to current date if parsing fails
            logger.warning(f"Could not parse transaction date '{transaction.date}', using current date")
            parsed_date = datetime.now()
            year = parsed_date.year
            month = parsed_date.strftime("%B")

        # Prepare row based on updated schema (8 columns):
        # 1. Date, 2. Amount, 3. Category, 4. Type, 5. Description, 6. Timestamp, 7. Year, 8. Month
        row = [
            transaction.date,
            float(transaction.amount),  # Store as number, not string
            transaction.category,
            transaction.transaction_type,
            full_description,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            year,
            month
        ]
        
        sheet.append_row(row)
        return {"status": "success", "message": "Transaction saved to Sheets.", "data": transaction.dict()}
    except Exception as e:
        logger.error(f"Error saving to sheet: {e}")
        return {"status": "error", "message": str(e), "data": transaction.dict()}
