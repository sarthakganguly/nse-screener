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

def get_top_50_symbols():
    try:
        from nsepython import nse_get_index_quote
        data = nse_get_index_quote("NIFTY 50")
        
        # Handle different response structures
        if isinstance(data, dict) and 'data' in data:
            raw_list = data['data']
        elif isinstance(data, list):
            raw_list = data
        else:
            raise ValueError("Unexpected data format from NSE")

        symbols = [item['symbol'] for item in raw_list if 'symbol' in item and item['symbol'] != 'NIFTY 50']
        return symbols
    except Exception as e:
        Logger.error("Failed to fetch Top 50 symbols", str(e))
        # Fallback if NSE call fails
        return ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "BHARTIARTL", "HINDUNILVR", "ITC", "SBIN", "LICI"]

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