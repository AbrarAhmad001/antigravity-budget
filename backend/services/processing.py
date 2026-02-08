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

MODEL = "google/gemini-2.5-flash-lite"

SYSTEM_PROMPT = """
You are an advanced financial assistant. Your task is to extract structured transaction data from user input (text or image description).
The current date is: {current_date}.

Output must be a valid JSON array of objects. Each object represents one transaction with these fields:
- date: YYYY-MM-DD
- amount: number (float)
- category: string (short category, e.g., 'Food', 'Transport', 'Salary')
- description: string (original text or concise summary)
- type: 'income' or 'expense'

Examples:
Input: "Lunch $10, Taxi $5. Salary received $2000"
Output: 
[
  {{"date": "2026-02-08", "amount": 10.0, "category": "Food", "description": "Lunch", "type": "expense"}},
  {{"date": "2026-02-08", "amount": 5.0, "category": "Transport", "description": "Taxi", "type": "expense"}},
  {{"date": "2026-02-08", "amount": 2000.0, "category": "Salary", "description": "Salary received", "type": "income"}}
]

If input is irrelevant or empty, return empty array [].
Do not include markdown code blocks (```json). Just return the raw JSON string.
"""

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
        {"role": "system", "content": SYSTEM_PROMPT.format(current_date=current_date)},
        {"role": "user", "content": text}
    ]
    extracted = await get_llm_response(messages)
    return {"text": text, "extracted": extracted}

async def process_image_content(image_content: bytes):
    current_date = datetime.now().strftime("%Y-%m-%d")
    base64_image = base64.b64encode(image_content).decode('utf-8')
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(current_date=current_date)},
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
