import sqlite3
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).resolve().parents[1] / "bullsight.db"

def connect():
    c=sqlite3.connect(DB_PATH)
    c.row_factory=sqlite3.Row
    return c

def init_db():
    with connect() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS predictions(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL, prediction_date TEXT NOT NULL,
            current_price REAL, predicted_price REAL, predicted_change_pct REAL,
            signal TEXT, best_model TEXT, mae REAL, rmse REAL, mape REAL, r2 REAL,
            created_at TEXT NOT NULL
        )""")
        c.execute("""CREATE INDEX IF NOT EXISTS idx_predictions_symbol_date
                     ON predictions(symbol,prediction_date)""")

def save_prediction(p):
    with connect() as c:
        c.execute("""INSERT INTO predictions
            (symbol,prediction_date,current_price,predicted_price,predicted_change_pct,
             signal,best_model,mae,rmse,mape,r2,created_at)
             VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
            (p["symbol"],p["prediction_date"],p["current_price"],p["predicted_price"],
             p["predicted_change_pct"],p["signal"],p["best_model"],p["mae"],
             p["rmse"],p["mape"],p["r2"],datetime.now(timezone.utc).isoformat()))

def history(symbol=None, limit=50):
    q="SELECT * FROM predictions"
    args=[]
    if symbol:
        q+=" WHERE symbol=?"; args.append(symbol)
    q+=" ORDER BY id DESC LIMIT ?"; args.append(limit)
    with connect() as c:
        return [dict(r) for r in c.execute(q,args).fetchall()]
