````markdown
# 🐂 Bull Sight

### AI-Powered Stock Market Prediction & Investment Analysis

> **Predicting Tomorrow's Market, Today.**

Bull Sight is a machine-learning-based stock market prediction and investment analysis system designed to analyze historical market data, generate technical indicators, compare multiple machine-learning models, and predict the next-day closing price of a selected stock or market index.

The system combines data collection, preprocessing, feature engineering, machine learning, model evaluation, and interactive visualization into a single web-based platform.

---

## 📌 Overview

Stock market prediction is challenging because financial markets are dynamic, volatile, and influenced by many factors.

Bull Sight provides an end-to-end framework that uses historical market data obtained through **Yahoo Finance using yfinance**. The data is processed and transformed into meaningful technical features before being passed to multiple machine-learning models.

The system evaluates the models using standard regression metrics and presents the results through an interactive dashboard.

### Bull Sight Pipeline

```text
Stock Selection
       ↓
Historical Data Collection
       ↓
Data Preprocessing
       ↓
Feature Engineering
       ↓
Chronological Train/Test Split
       ↓
Model Training
       ↓
Next-Day Price Prediction
       ↓
Model Evaluation
       ↓
Visualization & Investment Analysis
````

---

## ✨ Features

* 📊 Historical stock market data collection
* 🔎 Stock symbol search
* 📈 Technical indicator generation
* 🤖 Multiple machine-learning models
* 🔮 Next-day closing price prediction
* 📉 Actual vs. predicted price visualization
* 📊 Model performance comparison
* 📐 MAE, RMSE, MAPE and R² evaluation
* 📱 Interactive web dashboard
* 🟢🟡🔴 Analytical BUY / HOLD / SELL signal
* 📋 Historical market analysis
* 🏦 Support for stocks and market indices

---

## 🤖 Machine Learning Models

Bull Sight evaluates multiple models for next-day closing price prediction:

| Model                 | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| **Linear Regression** | Provides a simple linear baseline for price prediction                          |
| **Random Forest**     | Uses an ensemble of decision trees to model nonlinear relationships             |
| **XGBoost**           | Uses gradient boosting for regression                                           |
| **LSTM**              | Uses recurrent neural networks to learn sequential patterns in time-series data |

The models are trained using a **chronological train/test split** to preserve the temporal order of financial data.

---

## 📊 Technical Indicators

Bull Sight uses technical indicators and market features to provide additional information to the prediction models.

Some of the features include:

* SMA20
* SMA50
* EMA20
* RSI14
* MACD
* MACD Signal
* Bollinger Bands
* Daily Return
* Volatility
* High-Low Range
* Volume-based features

These features are derived from historical market data during the feature-engineering stage.

---

## 📏 Model Evaluation

The prediction models are evaluated using four regression metrics:

### MAE — Mean Absolute Error

Measures the average absolute difference between actual and predicted prices.

**Lower MAE indicates lower prediction error.**

### RMSE — Root Mean Squared Error

Measures prediction error while giving greater importance to larger errors.

**Lower RMSE indicates lower prediction error.**

### MAPE — Mean Absolute Percentage Error

Expresses prediction error as a percentage.

**Lower MAPE indicates lower percentage error.**

### R² — Coefficient of Determination

Measures how much of the variation in the target variable is explained by the model.

**Higher R² indicates greater explained variance.**



---

## 🏗️ System Architecture

```text
┌───────────────────────────────────────┐
│          Frontend                     │
│     React + TypeScript + Vite         │
│                                       │
│  Dashboard • Charts • Search • UI     │
└──────────────────┬────────────────────┘
                   │
                HTTP/JSON
                   │
                   ↓
┌───────────────────────────────────────┐
│          Backend                      │
│          Python + FastAPI             │
│                                       │
│ Data Collection → Preprocessing       │
│ → Feature Engineering → Prediction    │
│ → Model Evaluation                    │
└──────────────────┬────────────────────┘
                   │
                   ↓
┌───────────────────────────────────────┐
│       Data & Machine Learning         │
│                                       │
│ Yahoo Finance / yfinance              │
│              ↓                        │
│ Historical OHLCV Data                 │
│              ↓                        │
│ Technical Indicators                  │
│              ↓                        │
│ Linear Regression | Random Forest     │
│ XGBoost | LSTM                        │
│              ↓                        │
│ Prediction & Evaluation               │
└───────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts

### Backend

* Python
* FastAPI

### Data Processing

* Pandas
* NumPy
* yfinance

### Machine Learning

* Scikit-learn
* XGBoost
* TensorFlow / Keras

### Development

* Visual Studio Code
* Git
* GitHub

---

## 📂 Project Structure

```text
BullSight/
│
├── backend/
│   ├── app/
│   ├── data/
│   ├── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── ...
│
├── docs/
│
├── START_BACKEND.bat
├── START_FRONTEND.bat
├── docker-compose.yml
├── .gitignore
└── README.md
```

> The exact internal structure may change as the project continues to be developed.

---

## ⚙️ Requirements

Before running Bull Sight, make sure you have:

* Python
* Node.js
* npm
* Git

The required Python and frontend dependencies are provided in the project files.

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/bull-sight.git
cd bull-sight
```

### 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend using the project's configured startup command.

---

### 3. Frontend Setup

Open another terminal and navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will provide the Bull Sight web dashboard.

---

## 📈 Data Source

Bull Sight uses **Yahoo Finance through the yfinance Python library** to obtain historical market data.

The data contains market information such as:

* Open
* High
* Low
* Close
* Adjusted Close
* Volume

The collected data is then processed and transformed into features used by the machine-learning models.

---

## 🔬 Methodology

The system follows these major stages:

### 1. Data Collection

Historical market data is obtained using `yfinance`.

### 2. Data Preprocessing

The collected data is checked and prepared for modelling. This includes handling missing or inconsistent observations and maintaining chronological ordering.

### 3. Feature Engineering

Technical indicators and market-derived features are calculated from the historical data.

### 4. Train/Test Split

The dataset is divided chronologically into training and testing data to preserve the time-series structure.

### 5. Model Training

Multiple machine-learning models are trained using the prepared features.

### 6. Prediction

The trained models generate an estimate of the next trading day's closing price.

### 7. Evaluation

The models are compared using MAE, RMSE, MAPE and R².

### 8. Visualization

Historical prices, predictions, technical indicators and model performance are presented through the web dashboard.

---

## 📊 Results

Bull Sight allows the performance of different models to be compared using quantitative evaluation metrics.

For the NIFTY 50 experiment, the evaluated models produced different prediction errors, demonstrating that model performance can vary depending on the characteristics of the financial time series.

The dashboard presents:

* Actual price
* Predicted price
* Model metrics
* Technical indicators
* Model comparison
* Analytical market signal

---

## ⚠️ Disclaimer

Bull Sight is an academic and analytical project.

The predictions and BUY / HOLD / SELL signals generated by the system are **analytical outputs and should not be considered financial advice or guaranteed predictions of future market prices**.

Financial markets are affected by many factors that may not be represented in historical price data, including economic events, company-specific events, market sentiment, news, and unexpected changes.

---

## 🔮 Future Scope

Future improvements may include:

* LSTM/GRU and Transformer-based models
* Financial news and sentiment analysis
* Fundamental analysis
* SHAP/LIME-based explainability
* Real-time market data
* Walk-forward validation
* Ensemble and hybrid models
* Prediction uncertainty estimation
* Automated model retraining
* Market alerts
* Portfolio analysis
* Multi-market support

---

## 👨‍💻 Project

**Bull Sight**
**AI-Powered Stock Market Prediction & Investment Analysis**

Developed as an academic machine-learning and data-modelling project.

---

