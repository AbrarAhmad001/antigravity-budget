# Multi-Modal Expense Tracker

## Setup Instructions

### Backend
1.  **Install Python Dependencies**:
    The installation of large ML libraries (Torch, EasyOCR, Whisper) might still be running or needs to be completed.
    ```bash
    pip install -r backend/requirements.txt
    ```
2.  **Google Sheets Credentials**:
    Place your `credentials.json` file in the **backend** directory: `e:\winter2026\projects\antigravity_budget\backend\credentials.json`.
3.  **FFmpeg**:
    Ensure `ffmpeg` is installed and in your system PATH for audio processing (Whisper).
3.  **Run the Server**:
    ```bash
    cd backend
    uvicorn main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

### Frontend
1.  **Install Node.js**: Ensure Node.js is installed on your system.
2.  **Install Dependencies**:
    ```bash
    cd frontend
    npm install
    ```
3.  **Run the Frontend**:
    ```bash
    npm run dev
    ```
    The UI will be available at `http://localhost:5173`.

## Features
- **Text Input**: Type expense details.
- **Audio Input**: (Pending Frontend integration) Backend supports audio file processing.
- **Image Input**: (Pending Frontend integration) Backend supports image OCR.
- **Google Sheets**: Transactions are saved to the configured Google Sheet.

## Verification
To verify the backend logic (once dependencies are installed):
```bash
python backend/test_processing.py
pytest backend/tests/test_api.py
```
