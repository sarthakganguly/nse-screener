import requests
import pandas as pd
from io import StringIO
from .cache_manager import cache
from .logger import Logger

MASTER_URL = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"

def refresh_master_list():
    """Downloads CSV and stores the full list in Redis."""
    try:
        Logger.info("Fetching Master List from NSE...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(MASTER_URL, headers=headers)
        df = pd.read_csv(StringIO(response.text))
        
        symbols = df[['SYMBOL', 'NAME OF COMPANY']].rename(
            columns={'SYMBOL': 'symbol', 'NAME OF COMPANY': 'name'}
        ).to_dict('records')
        
        # Cache the full list indefinitely (until next restart)
        cache.set("nse_master_list", symbols)
        Logger.info(f"Master List Cached: {len(symbols)} stocks.")
    except Exception as e:
        Logger.error("Failed to refresh Master List", str(e))

def search_symbols(query: str):
    query = query.strip().upper()
    search_cache_key = f"search:{query}"
    
    # 1. Check if this specific search result is cached
    cached_search = cache.get(search_cache_key)
    if cached_search:
        return cached_search

    # 2. Get master list from cache
    master_list = cache.get("nse_master_list")
    if not master_list:
        return []

    # 3. Filter
    results = [
        s for s in master_list 
        if query in s['symbol'] or query in s['name'].upper()
    ][:15]

    # 4. Cache this specific search result for 1 hour
    cache.set(search_cache_key, results, expire=3600)
    return results