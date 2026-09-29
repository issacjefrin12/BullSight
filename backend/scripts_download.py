from app.config import SYMBOLS
from app.services.data import download_symbol
for s in SYMBOLS:
    try: download_symbol(s); print('Downloaded',s)
    except Exception as e: print('Skipped',s,e)
