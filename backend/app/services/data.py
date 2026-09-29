from pathlib import Path
import json
from datetime import datetime, timezone
import pandas as pd
import yfinance as yf
from ..config import RAW_DIR, DEFAULT_SYMBOL

CACHE_HOURS = 6

INDEX_ALIASES = {
    "NIFTY": "^NSEI",
    "NIFTY50": "^NSEI",
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN",
}

def normalize_symbol(symbol: str) -> str:
    raw = str(symbol).strip().upper()
    return INDEX_ALIASES.get(raw, raw)


def path_for(symbol: str) -> Path:
    safe = symbol.replace("^", "index_").replace(".", "_").replace("/", "_")
    return RAW_DIR / f"{safe}.csv"

def meta_path_for(symbol: str) -> Path:
    return path_for(symbol).with_suffix(".meta.json")

def _read_meta(symbol: str) -> dict:
    p = meta_path_for(symbol)
    try:
        return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    except Exception:
        return {}

def _write_meta(symbol: str, meta: dict):
    meta_path_for(symbol).write_text(json.dumps(meta, indent=2), encoding="utf-8")

def _normalize(df: pd.DataFrame, symbol: str) -> pd.DataFrame:
    if hasattr(df.columns, "levels"):
        df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]
    df = df.reset_index()
    if "Date" not in df.columns:
        raise ValueError(f"Yahoo Finance response has no Date column for {symbol}")
    df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
    required = ["Open","High","Low","Close","Volume"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing Yahoo Finance columns for {symbol}: {missing}")
    df = df[["Date"] + ([c for c in ["Adj Close"] if c in df.columns]) + required]
    return df.dropna(subset=["Close"]).sort_values("Date").drop_duplicates("Date")

def download_symbol(symbol: str = DEFAULT_SYMBOL, period: str = "5y") -> pd.DataFrame:
    symbol = normalize_symbol(symbol)
    try:
        df = yf.download(symbol, period=period, interval="1d", auto_adjust=False,
                          progress=False, threads=False)
        if df.empty:
            raise ValueError(f"Yahoo Finance returned no rows for {symbol}")
        df = _normalize(df, symbol)
        df.to_csv(path_for(symbol), index=False)
        now = datetime.now(timezone.utc).isoformat()
        _write_meta(symbol, {
            "source":"Yahoo Finance","provider":"yfinance","ticker":symbol,
            "status":"verified","downloaded_at":now,
            "latest_market_date":str(df["Date"].iloc[-1]),"rows":int(len(df)),
            "period":period,"interval":"1d","error":None
        })
        return df
    except Exception as exc:
        existing = path_for(symbol)
        meta = _read_meta(symbol)
        if existing.exists():
            cached = pd.read_csv(existing)
            if not cached.empty:
                meta.update({
                    "source": meta.get("source","Yahoo Finance"),
                    "provider":"yfinance","ticker":symbol,"status":"cached",
                    "latest_market_date":str(cached["Date"].iloc[-1]),
                    "rows":int(len(cached)),"error":str(exc)
                })
                _write_meta(symbol, meta)
                return cached
        _write_meta(symbol,{
            "source":"Unavailable","provider":"yfinance","ticker":symbol,
            "status":"error","rows":0,"latest_market_date":None,
            "downloaded_at":None,"error":str(exc)
        })
        raise RuntimeError(f"Yahoo Finance unavailable for {symbol}: {exc}") from exc

def _cache_is_fresh(symbol: str) -> bool:
    meta = _read_meta(symbol)
    if meta.get("status") != "verified": return False
    try:
        t = pd.Timestamp(meta["downloaded_at"])
        if t.tzinfo is None: t=t.tz_localize("UTC")
        return (pd.Timestamp.now(tz="UTC")-t).total_seconds() < CACHE_HOURS*3600
    except Exception:
        return False

def load_symbol(symbol: str, force_refresh: bool=False) -> pd.DataFrame:
    symbol = normalize_symbol(symbol)
    if force_refresh or not path_for(symbol).exists() or not _cache_is_fresh(symbol):
        return download_symbol(symbol)
    return pd.read_csv(path_for(symbol))

def source_status(symbol: str) -> dict:
    symbol = normalize_symbol(symbol)
    p=path_for(symbol); meta=_read_meta(symbol)
    if not p.exists():
        return {"symbol":symbol,"source":"Unavailable","provider":"yfinance","status":"error",
                "rows":0,"latest_market_date":None,"downloaded_at":None,
                "cache_fresh":False,"error":meta.get("error")}
    df=pd.read_csv(p)
    latest=str(df["Date"].iloc[-1]) if not df.empty else None
    return {
        "symbol":symbol,"source":meta.get("source","Local cached data"),
        "provider":meta.get("provider","yfinance"),"status":meta.get("status","cached"),
        "rows":int(len(df)),"latest_market_date":meta.get("latest_market_date",latest),
        "downloaded_at":meta.get("downloaded_at"),"cache_fresh":_cache_is_fresh(symbol),
        "error":meta.get("error")
    }

def prepared(symbol: str, force_refresh: bool=False) -> pd.DataFrame:
    symbol = normalize_symbol(symbol)
    from .features import add_features
    return add_features(load_symbol(symbol, force_refresh))
