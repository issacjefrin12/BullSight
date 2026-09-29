import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import MinMaxScaler
from xgboost import XGBRegressor
from ..services.data import prepared, source_status, normalize_symbol
from ..services.features import FEATURES

def _mape(y, p):
    y=np.asarray(y,float); p=np.asarray(p,float)
    mask=np.abs(y)>1e-9
    return float(np.mean(np.abs((y[mask]-p[mask])/y[mask]))*100)

def _lstm_train(df):
    """Real PyTorch LSTM. Kept small enough for a student laptop and short demo runs."""
    try:
        import torch
        from torch import nn
    except Exception as e:
        return None, {"model":"LSTM","status":"unavailable","error":"PyTorch is not installed"}

    seq_len=30
    cols=["Close","Volume","SMA_20","SMA_50","EMA_20","RSI_14","MACD","MACD_Signal","Daily_Return","Volatility_20"]
    d=df[cols+["Target_Next_Close","Date"]].dropna().reset_index(drop=True)
    if len(d)<seq_len+80:
        return None, {"model":"LSTM","status":"unavailable","error":"Not enough rows"}

    split=int(len(d)*0.8)
    scaler=MinMaxScaler()
    scaler.fit(d.loc[:split-1,cols])
    target_scaler=MinMaxScaler()
    target_scaler.fit(d.loc[:split-1,["Target_Next_Close"]])

    arr=scaler.transform(d[cols]).astype("float32")
    yarr=target_scaler.transform(d[["Target_Next_Close"]]).astype("float32").ravel()

    Xs=[]; ys=[]; dates=[]
    for i in range(seq_len,len(d)):
        Xs.append(arr[i-seq_len:i]); ys.append(yarr[i]); dates.append(d.loc[i,"Date"])
    Xs=np.asarray(Xs,dtype="float32"); ys=np.asarray(ys,dtype="float32")
    train_n=max(1,split-seq_len)
    Xtr,Xte=Xs[:train_n],Xs[train_n:]
    ytr,yte=ys[:train_n],ys[train_n:]

    device="cuda" if torch.cuda.is_available() else "cpu"
    class Net(nn.Module):
        def __init__(self,n):
            super().__init__()
            self.lstm=nn.LSTM(n,64,num_layers=2,batch_first=True,dropout=.1)
            self.fc=nn.Sequential(nn.Linear(64,32),nn.ReLU(),nn.Linear(32,1))
        def forward(self,x):
            out,_=self.lstm(x); return self.fc(out[:,-1,:]).squeeze(-1)
    model=Net(len(cols)).to(device)
    opt=torch.optim.Adam(model.parameters(),lr=.001)
    loss_fn=nn.MSELoss()
    Xt=torch.tensor(Xtr,device=device); yt=torch.tensor(ytr,device=device)
    model.train()
    for _ in range(12):
        perm=torch.randperm(len(Xt),device=device)
        for st in range(0,len(Xt),64):
            idx=perm[st:st+64]
            opt.zero_grad(); loss=loss_fn(model(Xt[idx]),yt[idx]); loss.backward(); opt.step()

    model.eval()
    with torch.no_grad():
        pt=model(torch.tensor(Xte,device=device)).detach().cpu().numpy()
        latest_seq=torch.tensor(arr[-seq_len:][None,:,:],device=device)
        next_scaled=float(model(latest_seq).detach().cpu().numpy()[0])
    pred=target_scaler.inverse_transform(pt.reshape(-1,1)).ravel()
    actual=target_scaler.inverse_transform(yte.reshape(-1,1)).ravel()
    nxt=float(target_scaler.inverse_transform(np.array([[next_scaled]]))[0,0])
    metrics={"model":"LSTM","mae":round(mean_absolute_error(actual,pred),3),
             "rmse":round(np.sqrt(mean_squared_error(actual,pred)),3),
             "mape":round(_mape(actual,pred),3),"r2":round(r2_score(actual,pred),3),
             "status":"ready","device":device}
    curve=[{"date":str(dates[i]),"actual":round(float(actual[i]),2),"predicted":round(float(pred[i]),2)}
           for i in range(len(actual))]
    return {"model":model,"next_price":nxt,"curve":curve,"metrics":metrics}, metrics

def train_models(symbol):
    symbol = normalize_symbol(symbol)
    df=prepared(symbol).dropna().copy()
    if len(df)<120: raise ValueError("Not enough data after feature engineering")
    X,y=df[FEATURES],df["Target_Next_Close"]
    split=int(len(df)*.8)
    Xtr,Xte=X.iloc[:split],X.iloc[split:]
    ytr,yte=y.iloc[:split],y.iloc[split:]

    models={
        "Linear Regression":LinearRegression(),
        "Random Forest":RandomForestRegressor(n_estimators=220,max_depth=12,random_state=42,n_jobs=-1),
        "XGBoost":XGBRegressor(n_estimators=280,max_depth=6,learning_rate=.04,subsample=.9,
                               colsample_bytree=.9,objective="reg:squarederror",random_state=42,n_jobs=4)
    }
    results=[]; fitted={}
    curves={}
    for name,m in models.items():
        m.fit(Xtr,ytr); p=m.predict(Xte)
        metric={"model":name,"mae":round(float(mean_absolute_error(yte,p)),3),
                "rmse":round(float(np.sqrt(mean_squared_error(yte,p))),3),
                "mape":round(_mape(yte,p),3),"r2":round(float(r2_score(yte,p)),3),"status":"ready"}
        results.append(metric); fitted[name]=m
        curves[name]=[{"date":str(df["Date"].iloc[split+i]),"actual":round(float(yte.iloc[i]),2),"predicted":round(float(p[i]),2)}
                      for i in range(len(p))]

    lstm_obj,lstm_metric=_lstm_train(df)
    if lstm_obj:
        results.append(lstm_metric); curves["LSTM"]=lstm_obj["curve"]

    best=min([r for r in results if r.get("status")=="ready"],key=lambda z:z["mae"])
    if best["model"]=="LSTM":
        nxt=lstm_obj["next_price"]
    else:
        nxt=float(fitted[best["model"]].predict(df[FEATURES].iloc[[-1]])[0])
    current=float(df["Close"].iloc[-1]); move=(nxt-current)/current*100
    rsi=float(df["RSI_14"].iloc[-1]); macd=float(df["MACD"].iloc[-1]); sig=float(df["MACD_Signal"].iloc[-1])
    sma20=float(df["SMA_20"].iloc[-1]); sma50=float(df["SMA_50"].iloc[-1])
    vol=float(df["Volume"].iloc[-1]); vol_avg=float(df["Volume_SMA_20"].iloc[-1])
    score=0
    score += 1 if move >= 0.5 else (-1 if move <= -0.5 else 0)
    score += 1 if current > sma20 else -1
    score += 1 if sma20 > sma50 else -1
    score += 1 if macd > sig else -1
    score += 1 if 50 <= rsi < 70 else (-1 if rsi >= 70 or rsi < 30 else 0)
    score += 1 if (vol > vol_avg and float(df["Daily_Return"].iloc[-1]) > 0) else (-1 if (vol > vol_avg and float(df["Daily_Return"].iloc[-1]) < 0) else 0)
    action="BUY" if score >= 3 else ("SELL" if score <= -3 else "HOLD")

    return {
        "symbol":symbol,"prediction_date":str(df["Date"].iloc[-1]),
        "current_price":round(current,2),"predicted_price":round(nxt,2),
        "predicted_change_pct":round(move,2),"signal":action,
        "best_model":best["model"],"metrics":results,
        "data_source":source_status(symbol),
        "evaluation_curve":curves.get(best["model"],[]),
        "feature_count":len(FEATURES),
        "features":FEATURES,
        "explanation":{
            "RSI":round(rsi,2),"MACD":round(macd,4),"MACD_Signal":round(sig,4),
            "rule":f"Signal score {score:+d}/6 combines predicted movement, SMA trend, MACD, RSI and volume. BUY ≥ +3, SELL ≤ -3, otherwise HOLD.",
            "trend":"Bullish" if float(df["Close"].iloc[-1])>float(df["SMA_20"].iloc[-1]) else "Below SMA 20",
            "volume":"Above 20-day average" if float(df["Volume"].iloc[-1])>float(df["Volume_SMA_20"].iloc[-1]) else "Below 20-day average"
        }
    }
