from pathlib import Path
BASE_DIR=Path(__file__).resolve().parents[1]
RAW_DIR=BASE_DIR/"data"/"raw"
PROCESSED_DIR=BASE_DIR/"data"/"processed"
RAW_DIR.mkdir(parents=True,exist_ok=True)
PROCESSED_DIR.mkdir(parents=True,exist_ok=True)
SYMBOLS=["RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS","ICICIBANK.NS","SBIN.NS","ITC.NS","LT.NS"]
MARKET_SYMBOLS={"NIFTY 50":"^NSEI","SENSEX":"^BSESN"}
DEFAULT_SYMBOL="RELIANCE.NS"
