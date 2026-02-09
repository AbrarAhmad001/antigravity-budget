import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os
import json
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SCOPE = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

CREDS_FILE = os.path.join(os.path.dirname(__file__), "credentials.json")
SHEET_ID = os.getenv("SHEET_ID", "1xy1Rl8VNvaUchMVaNzzUQtctfa8IAvtbVuaN5MvkKgY")

def get_sheet_client():
    creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
    if creds_json:
        creds_data = json.loads(creds_json)
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_data, SCOPE)
    else:
        if not os.path.exists(CREDS_FILE):
            logger.error(f"{CREDS_FILE} not found.")
            return None
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
    return gspread.authorize(creds)

def migrate():
    client = get_sheet_client()
    if not client:
        return

    try:
        spreadsheet = client.open_by_key(SHEET_ID)
        sheet = spreadsheet.sheet1
        
        # Get all records
        data = sheet.get_all_values()
        if not data:
            logger.info("Sheet is empty.")
            return

        # Backup existing data to a new sheet
        backup_sheet_name = f"Backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        backup_sheet = spreadsheet.add_worksheet(title=backup_sheet_name, rows=len(data), cols=len(data[0]))
        backup_sheet.update('A1', data)
        logger.info(f"Backup created in sheet: {backup_sheet_name}")

        # Define new headers
        new_headers = [
            "Timestamp", "Transaction Type", "Date", "Time", "Category/Type", 
            "Amount", "Vault Location", "Description", "Detail/Source/Item", 
            "Attachments", "Secondary Date", "Secondary Time"
        ]

        # Migrate data
        # Old schema: date, amount, category, type, description, timestamp
        # Match: 0: date, 1: amount, 2: category, 3: type, 4: description, 5: timestamp
        
        new_rows = [new_headers]
        for row in data[1:]: # Skip old headers
            if len(row) < 5: continue
            
            old_date = row[0]
            old_amount = row[1]
            old_cat = row[2]
            old_type = row[3].lower() if len(row) > 3 else "expense"
            old_desc = row[4] if len(row) > 4 else ""
            old_ts = row[5] if len(row) > 5 else datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Map to new schema
            new_row = [
                old_ts,         # 1. Timestamp
                old_type,       # 2. Transaction Type
                old_date,       # 3. Date
                "",             # 4. Time
                old_cat,        # 5. Category/Type
                old_amount,     # 6. Amount
                "Other",        # 7. Vault Location
                old_desc,       # 8. Description
                old_desc,       # 9. Detail/Source/Item
                "",             # 10. Attachments
                "",             # 11. Secondary Date
                ""              # 12. Secondary Time
            ]
            new_rows.append(new_row)

        # Clear original sheet and update with new data
        sheet.clear()
        sheet.update('A1', new_rows)
        logger.info("Migration successful!")

    except Exception as e:
        logger.error(f"Migration failed: {e}")

def revert():
    client = get_sheet_client()
    if not client:
        return

    try:
        spreadsheet = client.open_by_key(SHEET_ID)
        sheet = spreadsheet.sheet1
        
        # Get all records
        data = sheet.get_all_values()
        if not data:
            logger.info("Sheet is empty.")
            return

        # Backup existing data
        backup_sheet_name = f"Backup_Before_Revert_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        backup_sheet = spreadsheet.add_worksheet(title=backup_sheet_name, rows=len(data), cols=len(data[0]))
        backup_sheet.update('A1', data)
        logger.info(f"Backup created in sheet: {backup_sheet_name}")

        # Original Headers: Date, Amount, Category, Type, Description, Timestamp
        original_headers = ["Date", "Amount", "Category", "Type", "Description", "Timestamp"]
        
        # Mapping from 12 columns to 6
        # Current Schema (12): 1. Timestamp, 2. Transaction Type, 3. Date, 4. Time, 5. Category/Type, 
        # 6. Amount, 7. Vault Location, 8. Description, 9. Detail/Source/Item, 10. Attachments...
        
        new_rows = [original_headers]
        for row in data[1:]: # Skip current headers
            if len(row) < 9: continue
            
            ts = row[0]
            t_type = row[1]
            date = row[2]
            cat = row[4]
            amount = row[5]
            vault = row[6]
            desc = row[7]
            detail = row[8]
            
            # Augment description
            desc_parts = [desc]
            if vault and vault != "Other":
                desc_parts.append(f"[Vault: {vault}]")
            if detail and detail != desc:
                desc_parts.append(f"[Detail: {detail}]")
            full_desc = " ".join(desc_parts)

            new_row = [date, amount, cat, t_type, full_desc, ts]
            new_rows.append(new_row)

        # Clear original sheet and update
        sheet.clear()
        sheet.update('A1', new_rows)
        logger.info("Revert migration successful!")

    except Exception as e:
        logger.error(f"Revert failed: {e}")

if __name__ == "__main__":
    revert()
