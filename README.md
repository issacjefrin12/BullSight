# Bull Sight

## AI-Powered Stock Market Prediction & Investment Analysis

Bull Sight is a machine-learning-based stock market analysis system. It obtains historical market data from Yahoo Finance through `yfinance`, preprocesses and engineers market features, compares machine-learning models, and predicts the next trading day's closing price. The React dashboard presents historical and predicted prices, model evaluation metrics, and an analytical BUY/HOLD/SELL signal.

Predictions and BUY/HOLD/SELL signals are analytical outputs for research and decision support. They are uncertain, are not guaranteed, and are **not financial advice**.

## Features

- Downloads daily historical prices from Yahoo Finance and caches them locally for six hours; the dashboard also supports manual refresh.
- Builds technical indicators and market-derived features from OHLCV data.
- Uses a chronological 80/20 train/test split for the scikit-learn and XGBoost models.
- Compares available models using MAE, RMSE, MAPE, and R², then selects the lowest-MAE model.
- Predicts the next trading day's closing price and computes a rule-based BUY/HOLD/SELL signal using predicted movement, moving-average trend, MACD, RSI, and volume.
- Displays historical market charts and the selected model's actual-versus-predicted test curve.
- Saves prediction history in a local SQLite database and stores the watchlist in browser local storage.

### Implemented features

Model input features in `backend/app/services/features.py` are:

- Open, High, Low, Close, and Volume
- SMA 20 and SMA 50
- EMA 20
- RSI 14
- MACD and MACD Signal
- Upper and lower Bollinger Bands (20-period)
- Daily Return
- 20-day Volatility
- High-Low Range, calculated as `(High - Low) / Close`
- 20-day Volume SMA

The next-day closing price is the regression target, not an input feature.

## Machine-learning models

- **Linear Regression:** baseline regression model for next-day closing-price prediction.
- **Random Forest:** ensemble of decision trees for nonlinear price relationships.
- **XGBoost:** gradient-boosted trees for next-day closing-price prediction.
- **LSTM (PyTorch):** sequence model using the preceding 30 trading days; it is marked unavailable when PyTorch is missing or there is not enough data.

The LSTM implementation uses PyTorch, not TensorFlow/Keras. The best available model is selected by lowest test-set MAE.

## Workflow

```text
User selects stock
      -> Historical data collection (Yahoo Finance / yfinance)
      -> Data preprocessing
      -> Feature engineering
      -> Chronological train/test split
      -> Model training
      -> Next-day closing-price prediction
      -> Model evaluation
      -> Visualization
      -> Analytical BUY/HOLD/SELL signal
```

## Evaluation metrics

- **MAE (Mean Absolute Error):** average absolute difference between predicted and observed prices.
- **RMSE (Root Mean Squared Error):** square root of the average squared error; larger errors have more influence.
- **MAPE (Mean Absolute Percentage Error):** mean absolute error expressed relative to observed values, as a percentage.
- **R² (coefficient of determination):** indicates how much of the observed target variance is explained by the model. It is not a prediction-accuracy percentage.

Lower MAE, RMSE, and MAPE generally indicate lower prediction error; higher R² generally indicates greater explained variance. These metrics do not guarantee future performance.

## Technology stack

- **Frontend:** React 18, TypeScript, Vite, Recharts, Axios, and Lucide React; styling is in the project's CSS. Tailwind CSS is not installed or configured.
- **Backend:** Python, FastAPI, and Uvicorn.
- **Data and ML:** Pandas, NumPy, scikit-learn, XGBoost, and PyTorch.
- **Storage:** SQLite for prediction history; local CSV and JSON files for the Yahoo Finance data cache.
- **Data source:** Yahoo Finance via `yfinance`.

## Requirements

- Python 3.11 (the included Dockerfile uses Python 3.11; use this version for the documented setup).
- Node.js 20 or newer and npm (the included Docker Compose configuration uses Node 20; Vite 6 requires Node.js 18 or newer).
- Git.
- Internet access for Yahoo Finance data downloads and the frontend's Google Fonts request.

Ollama is not used. No API keys or environment variables are required by the current code. The frontend API URL is currently configured in `frontend/src/main.tsx` as `http://127.0.0.1:8000/api`.

## Installation and run

### Backend (Windows PowerShell)

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

FastAPI initializes the SQLite database on startup. Open the interactive API documentation at <http://127.0.0.1:8000/docs>.

If PowerShell does not allow activation, run the environment's interpreter directly instead:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

In a second PowerShell window, from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed by the command (normally <http://localhost:5173>). The backend must be running at `127.0.0.1:8000`.

The repository also includes `START_BACKEND.bat` and `START_FRONTEND.bat` for Windows. Docker configuration is provided in `docker-compose.yml` and `backend/Dockerfile`.

## Data and generated files

Yahoo Finance daily history is requested through `yfinance` for the selected symbol. The backend caches downloaded CSV files and source metadata under `backend/data/raw/`; verified cache entries are reused for up to six hours. If Yahoo Finance cannot be reached, an existing cached CSV may be used and identified as cached data. Historical cache CSVs, processed data, and the local prediction-history database are generated runtime data and are excluded from Git. The application downloads market history as needed; these files do not need to be committed.

No `.env` file or `.env.example` is needed because the current application does not read environment variables or require credentials.

## API

All stock endpoints below are implemented by the FastAPI application. Interactive request and response schemas are available at `/docs`.

| Method | Route | Input | Purpose and response |
| --- | --- | --- | --- |
| `GET` | `/` | None | API welcome message and docs path. |
| `GET` | `/api/health` | None | Health status and project name. |
| `GET` | `/api/stocks` | None | Configured stock symbols. |
| `GET` | `/api/system/status?symbol=RELIANCE.NS` | Optional `symbol` query parameter | Backend, data-source/cache, prediction-engine, and model status. |
| `GET` | `/api/stock/{symbol}` | Stock symbol in the path, for example `TCS.NS` | Up to 160 recent feature-engineered observations and data-source status. Triggers data acquisition when the cache is missing or stale. |
| `GET` | `/api/predict/{symbol}` | Stock symbol in the path | Next-day prediction, model metrics, selected model, analytical signal, features, and evaluation curve; saves the prediction to history. |
| `POST` | `/api/refresh/{symbol}` | Stock symbol in the path | Forces a Yahoo Finance refresh; returns success, source status, and row count. |
| `GET` | `/api/history?symbol=TCS.NS&limit=50` | Optional `symbol` and `limit` query parameters (`limit` is clamped to 1–200) | Recent saved predictions, returned as an `items` array. |

**Known integration gap:** the frontend also requests `GET /api/market-overview`, but that route is not implemented by the backend. Its request is silently ignored by the current UI; no such endpoint is documented as available.

## Project structure

```text
BullSight/
├── backend/
│   ├── app/
│   │   ├── ml/                 # Prediction models
│   │   ├── routers/            # FastAPI routes
│   │   ├── services/           # Yahoo Finance data and feature engineering
│   │   ├── config.py
│   │   ├── db.py               # SQLite prediction history
│   │   ├── main.py             # FastAPI application
│   │   └── seed.py             # Initialize the local database
│   ├── data/                   # Runtime cache; ignored by Git
│   ├── Dockerfile
│   ├── requirements.txt
│   └── scripts_download.py
├── docs/                       # Project review paper and presentation
├── frontend/
│   ├── public/                 # Static logo and favicon
│   ├── src/                    # React/TypeScript application and CSS
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
├── docker-compose.yml
├── START_BACKEND.bat
├── START_FRONTEND.bat
└── README.md
```

## Screenshots

There are no application screenshots in the repository; the existing image is the Bull Sight logo. Screenshots can be added later under `docs/screenshots/` and linked here.

## License

No license is currently included. A license can be added when you choose one; no license has been selected for this project.