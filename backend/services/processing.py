import os
import json
import base64
from openai import OpenAI
from datetime import datetime

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
SITE_URL = os.getenv("SITE_URL", "http://localhost:5173")
APP_NAME = "Antigravity Budget"

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=OPENROUTER_API_KEY,
)

MODEL = "nvidia/nemotron-nano-12b-v2-vl:free"

from services.categories import EXPENSE_CATEGORIES, INCOME_CATEGORIES, DEFAULT_SAVINGS_CATEGORIES, VAULT_LOCATIONS

SYSTEM_PROMPT_TEMPLATE = """
You are an advanced financial assistant. Your task is to extract structured transaction data from user input (text or image description).
The current date is: {current_date}.

Output must be a valid JSON array of objects. Each object represents one transaction with these fields:
- transaction_type: 'income', 'expense', or 'savings'
- date: YYYY-MM-DD
- time: HH:MM (extract if mentioned, else empty string)
- category: Pick the MOST relevant category from the lists below:
  - For expense: {expense_cats}
  - For income: {income_cats}
  - For savings: {savings_cats}
- amount: number (float)
- vault_location: Pick from: {vaults} (default to 'Other' if unknown or not mentioned)
- description: string (original text or concise summary)
- detail_source_item: string (Source for Savings/Income like 'income' or 'outside', Item-Service for Expense like 'Taxi' or 'Lent to John')
- attachments: empty string (handled by UI)
- secondary_date: YYYY-MM-DD (Spent Date for Savings ONLY, else empty string)
- secondary_time: HH:MM (Spent Time for Savings ONLY, else empty string)

Examples:
Input: "Lunch 500 BDT from Bkash. Saved 2000 in emergency fund from income."
Output: 
[
  {{
    "transaction_type": "expense", 
    "date": "{current_date}", 
    "time": "", 
    "category": "food", 
    "amount": 500.0, 
    "vault_location": "Bkash", 
    "description": "Lunch", 
    "detail_source_item": "Lunch",
    "attachments": "",
    "secondary_date": "",
    "secondary_time": ""
  }},
  {{
    "transaction_type": "savings", 
    "date": "{current_date}", 
    "time": "", 
    "category": "emergency fund", 
    "amount": 2000.0, 
    "vault_location": "Other", 
    "description": "Saved in emergency fund", 
    "detail_source_item": "income",
    "attachments": "",
    "secondary_date": "",
    "secondary_time": ""
  }}
]

If input is irrelevant or empty, return empty array [].
Do not include markdown code blocks (```json). Just return the raw JSON string.
"""

def get_system_prompt(current_date):
    return SYSTEM_PROMPT_TEMPLATE.format(
        current_date=current_date,
        expense_cats=", ".join(EXPENSE_CATEGORIES),
        income_cats=", ".join(INCOME_CATEGORIES),
        savings_cats=", ".join(DEFAULT_SAVINGS_CATEGORIES),
        vaults=", ".join(VAULT_LOCATIONS)
    )

async def get_llm_response(messages):
    try:
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": SITE_URL,
                "X-Title": APP_NAME,
            },
            model=MODEL,
            messages=messages,
        )
        content = completion.choices[0].message.content
        # Clean potential markdown
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print(f"LLM Error: {e}")
        # Return empty list on failure
        return []

async def process_text_content(text: str):
    current_date = datetime.now().strftime("%Y-%m-%d")
    messages = [
        {"role": "system", "content": get_system_prompt(current_date)},
        {"role": "user", "content": text}
    ]
    extracted = await get_llm_response(messages)
    return {"text": text, "extracted": extracted}

async def process_image_content(image_content: bytes):
    current_date = datetime.now().strftime("%Y-%m-%d")
    base64_image = base64.b64encode(image_content).decode('utf-8')
    
    messages = [
        {"role": "system", "content": get_system_prompt(current_date)},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract all financial transactions visible in this image."},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
        }
    ]
    extracted = await get_llm_response(messages)
    return {"text": "[Image Processed]", "extracted": extracted}

async def process_audio_content(content: bytes):
    # Deprecated/Removed feature
    return {"text": "Audio not supported", "extracted": []}
