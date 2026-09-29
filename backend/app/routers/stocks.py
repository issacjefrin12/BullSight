from fastapi import APIRouter, HTTPException
from ..config import SYMBOLS, MARKET_SYMBOLS
from ..services.data import prepared, source_status, download_symbol, normalize_symbol
from ..ml.predictor import train_models
from ..db import history, save_prediction

router=APIRouter(prefix="/api",tags=["stocks"])

@router.get("/health")
def health():
    return {"status":"healthy","project":"Bull Sight"}

@router.get("/stocks")
def stocks():
    return {"symbols":SYMBOLS}

@router.get("/system/status")
def system_status(symbol:str="RELIANCE.NS"):
    return {"backend":"online","data":source_status(symbol),"cache_policy":"6 hours",
            "prediction_engine":"online","models":["Linear Regression","Random Forest","XGBoost","LSTM"]}

@router.get("/stock/{symbol:path}")
def stock(symbol:str):
    symbol = normalize_symbol(symbol)
    try:
        df=prepared(symbol).dropna().tail(160)
        out=[]
        for _,r in df.iterrows():
            out.append({"date":str(r.Date)[:10],"open":float(r.Open),"high":float(r.High),
                        "low":float(r.Low),"close":float(r.Close),"volume":float(r.Volume),
                        "sma20":float(r.SMA_20),"sma50":float(r.SMA_50),"ema20":float(r.EMA_20),
                        "rsi":float(r.RSI_14),"macd":float(r.MACD),"macd_signal":float(r.MACD_Signal),
                        "bb_upper":float(r.BB_Upper),"bb_lower":float(r.BB_Lower),
                        "return":float(r.Daily_Return),"volatility":float(r.Volatility_20)})
        return {"symbol":symbol,"data":out,"source":source_status(symbol)}
    except Exception as e:
        raise HTTPException(400,str(e))

@router.get("/predict/{symbol:path}")
def predict(symbol:str):
    symbol = normalize_symbol(symbol)
    try:
        result=train_models(symbol)
        best=next(m for m in result["metrics"] if m["model"]==result["best_model"])
        result["history_saved"]=True
        save_prediction({
            "symbol":result["symbol"],"prediction_date":result["prediction_date"],
            "current_price":result["current_price"],"predicted_price":result["predicted_price"],
            "predicted_change_pct":result["predicted_change_pct"],"signal":result["signal"],
            "best_model":result["best_model"],"mae":best["mae"],"rmse":best["rmse"],
            "mape":best["mape"],"r2":best["r2"]
        })
        return result
    except Exception as e:
        raise HTTPException(400,str(e))

@router.post("/refresh/{symbol:path}")
def refresh(symbol:str):
    symbol = normalize_symbol(symbol)
    try:
        df=download_symbol(symbol)
        return {"ok":True,"source":source_status(symbol),"rows":int(len(df))}
    except Exception as e:
        raise HTTPException(502,str(e))

@router.get("/history")
def prediction_history(symbol:str|None=None,limit:int=50):
    return {"items":history(symbol,max(1,min(limit,200)))}
