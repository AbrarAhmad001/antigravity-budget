"""
Migration script to add Year and Month columns to the Google Sheet.
This script will:
1. Add 'Year' and 'Month' column headers
2. Populate these columns for all existing rows by parsing the Date column
"""

from services.sheets import get_sheet_client, SHEET_ID
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_date(date_str):
    """Parse date string from multiple formats."""
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def add_year_month_columns():
    """Add Year and Month columns to the sheet and populate existing rows."""
    client = get_sheet_client()
    if not client:
        logger.error("Failed to get sheet client")
        return
    
    try:
        sheet = client.open_by_key(SHEET_ID).sheet1
        
        # Get all data
        data = sheet.get_all_values()
        if not data:
            logger.error("No data found in sheet")
            return
        
        headers = data[0]
        logger.info(f"Current headers: {headers}")
        
        # Check if Year and Month columns already exist
        if 'Year' in headers and 'Month' in headers:
            logger.info("Year and Month columns already exist")
            return
        
        # Add headers for Year and Month (columns 7 and 8)
        if len(headers) < 7:
            # Append Year and Month to headers
            headers.extend(['Year', 'Month'])
            sheet.update('A1:H1', [headers])
            logger.info("Added Year and Month column headers")
        
        # Process each row and add Year and Month
        rows_to_update = []
        for i, row in enumerate(data[1:], start=2):  # Skip header, row numbers start at 2
            if len(row) < 1:
                continue
            
            date_str = row[0]  # Date is in column 1
            parsed_date = parse_date(date_str)
            
            if parsed_date:
                year = parsed_date.year
                month = parsed_date.strftime("%B")  # Full month name (January, February, etc.)
                
                # Extend row to include Year and Month
                while len(row) < 8:
                    row.append("")
                row[6] = year  # Column 7 (G)
                row[7] = month  # Column 8 (H)
                
                rows_to_update.append((i, row))
                logger.info(f"Row {i}: Date={date_str}, Year={year}, Month={month}")
            else:
                logger.warning(f"Row {i}: Could not parse date '{date_str}'")
        
        # Batch update all rows
        if rows_to_update:
            for row_num, row_data in rows_to_update:
                # Update the entire row
                range_name = f"A{row_num}:H{row_num}"
                sheet.update(range_name, [row_data[:8]])  # Only update first 8 columns
            
            logger.info(f"Successfully updated {len(rows_to_update)} rows with Year and Month data")
        
        logger.info("Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during migration: {e}")
        raise

if __name__ == "__main__":
    logger.info("Starting migration to add Year and Month columns...")
    add_year_month_columns()
