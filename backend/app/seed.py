from .db import init_db
if __name__ == "__main__":
    init_db()
    print("Bull Sight database initialized. Market data is sourced from Yahoo Finance; no synthetic market data was created.")
