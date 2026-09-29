import numpy as np
import pandas as pd

FEATURES = [
    "Open","High","Low","Close","Volume",
    "SMA_20","SMA_50","EMA_20",
    "RSI_14","MACD","MACD_Signal",
    "BB_Upper","BB_Lower",
    "Daily_Return","Volatility_20","HL_Range","Volume_SMA_20"
]

def add_features(df: pd.DataFrame) -> pd.DataFrame:
    x = df.copy()
    x.columns = [str(c).title() for c in x.columns]
    if "Adj Close" in x.columns and "Close" not in x.columns:
        x["Close"] = x["Adj Close"]

    for c in ["Open","High","Low","Close","Volume"]:
        if c in x.columns:
            x[c] = pd.to_numeric(x[c], errors="coerce")

    x = x.sort_values("Date").drop_duplicates("Date").reset_index(drop=True)

    x["SMA_20"] = x["Close"].rolling(20).mean()
    x["SMA_50"] = x["Close"].rolling(50).mean()
    x["EMA_20"] = x["Close"].ewm(span=20, adjust=False).mean()

    delta = x["Close"].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    x["RSI_14"] = 100 - (100 / (1 + rs))

    ema12 = x["Close"].ewm(span=12, adjust=False).mean()
    ema26 = x["Close"].ewm(span=26, adjust=False).mean()
    x["MACD"] = ema12 - ema26
    x["MACD_Signal"] = x["MACD"].ewm(span=9, adjust=False).mean()

    mid = x["Close"].rolling(20).mean()
    std = x["Close"].rolling(20).std()
    x["BB_Upper"] = mid + 2 * std
    x["BB_Lower"] = mid - 2 * std

    x["Daily_Return"] = x["Close"].pct_change()
    x["Volatility_20"] = x["Daily_Return"].rolling(20).std()
    x["HL_Range"] = (x["High"] - x["Low"]) / x["Close"].replace(0, np.nan)
    x["Volume_SMA_20"] = x["Volume"].rolling(20).mean()

    # Regression target: next trading day's closing price.
    x["Target_Next_Close"] = x["Close"].shift(-1)
    return x
