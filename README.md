# Antigravity Budget - Multi-Modal Expense Tracker

An intelligent expense tracker that uses AI to automatically extract and categorize transactions from text or images. Built with FastAPI backend and React frontend.

🌐 **Live Demo**: https://antigravity-budget-7u76.vercel.app

## Features

- 📝 **Smart Text Processing**: Input multiple transactions in natural language (e.g., "Lunch $10, Taxi $5, Salary $2000")
- 🖼️ **Image Recognition**: Upload receipt photos for automatic extraction
- 🤖 **AI-Powered**: Uses Google Gemini via OpenRouter to intelligently parse and categorize expenses
- 📊 **Google Sheets Integration**: Automatically saves all transactions to your spreadsheet
- ✏️ **Edit & Confirm**: Review and modify extracted transactions before saving
- 💰 **Income/Expense Tracking**: Automatically distinguishes between income and expenses

## Tech Stack

### Backend
- **FastAPI** - Fast, modern Python web framework
- **OpenRouter** - Access to Google Gemini 2.5 Flash Lite
- **Google Sheets API** - Data persistence
- **Railway** - Hosting

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Vercel** - Hosting

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Cloud Service Account credentials

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   Create a `.env` file in `backend/` folder:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   SHEET_ID=your-google-sheet-id
   SITE_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173
   ```

3. **Add Google credentials**:
   Place `credentials.json` in the `backend/` folder

4. **Run the server**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

   Backend runs at: http://127.0.0.1:8000

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run dev server**:
   ```bash
   npm run dev
   ```

   Frontend runs at: http://localhost:5173

## Deployment

### Backend (Railway)

1. Sign up at https://railway.app
2. Create new project from GitHub repo
3. Set Root Directory: `backend`
4. Add environment variables:
   - `OPENROUTER_API_KEY`
   - `SHEET_ID`
   - `GOOGLE_CREDENTIALS_JSON` (paste entire credentials.json)
   - `SITE_URL` (your Vercel frontend URL)
   - `ALLOWED_ORIGINS` (your Vercel frontend URL)
5. Deploy automatically triggers

### Frontend (Vercel)

1. Sign up at https://vercel.com
2. Import GitHub repo
3. Set Root Directory: `frontend`
4. Framework: Vite
5. Update `frontend/vercel.json` with your Railway backend URL
6. Deploy

Full deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

## Environment Variables

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-v1-...` |
| `SHEET_ID` | Google Sheets spreadsheet ID | `1xy1Rl8...` |
| `GOOGLE_CREDENTIALS_JSON` | Service account JSON (deployment only) | `{"type":"service_account",...}` |
| `SITE_URL` | Frontend URL | `https://yourapp.vercel.app` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://yourapp.vercel.app` |

### Frontend
No environment variables needed - API URL is configured in `vercel.json`

## Usage

1. **Text Input**: 
   - Enter transactions like: "Coffee $5, Uber $15, Freelance payment $500"
   - AI splits into individual transactions
   - Auto-categorizes as expense/income

2. **Image Upload**:
   - Upload receipt photo
   - AI extracts items and amounts
   - Review and edit before saving

3. **Confirm & Save**:
   - Review extracted transactions
   - Edit any field (date, amount, category, description, type)
   - Delete unwanted items
   - Click "Save All to Google Sheets"

## Project Structure

```
antigravity-budget/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── services/
│   │   ├── processing.py    # LLM processing logic
│   │   └── sheets.py        # Google Sheets integration
│   ├── requirements.txt
│   └── credentials.json     # Google credentials (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Capture.jsx
│   │   │   └── Confirmation.jsx
│   │   └── index.css
│   ├── package.json
│   └── vercel.json
└── README.md
```

## Troubleshooting

### "No transactions extracted"
- Check OpenRouter API key is valid
- Verify you have credits on OpenRouter
- Check Railway logs for errors

### "403 Forbidden" on Sheets
- Enable Google Drive API in console
- Share spreadsheet with service account email
- Verify credentials.json is correct

### Frontend can't connect to backend
- Check `frontend/vercel.json` has correct backend URL
- Verify CORS settings in Railway
- Check browser console for errors

## API Endpoints

- `GET /` - Health check
- `POST /api/process/text` - Process text input
- `POST /api/process/image` - Process image upload
- `POST /api/confirm` - Save transactions to Sheets

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - feel free to use for personal or commercial projects

## Credits

Built by [Abrar Ahmad](https://github.com/AbrarAhmad001)

## Support

For issues or questions, please open an issue on GitHub.
