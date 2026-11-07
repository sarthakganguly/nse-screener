from nsepython import nse_eq
import requests
from .cache_manager import cache
from .logger import Logger
import time

# Standard headers to mimic a real browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5"
}

def warm_session():
    """
    Manually establishes a session with NSE by hitting the homepage.
    This sets the necessary cookies in the requests session.
    """
    try:
        Logger.info("Warming up NSE Session manually...")
        # We hit the homepage first to get cookies
        requests.get("https://www.nseindia.com", headers=HEADERS, timeout=10)
        return True
    except Exception as e:
        Logger.error("Manual Session Warmup Failed", str(e))
        return False

def get_market_status():
    cache_key = "market_status"
    cached_status = cache.get(cache_key)
    if cached_status:
        return cached_status

    try:
        from nsepython import nse_marketStatus
        status_raw = nse_marketStatus()
        # Find 'Capital Market' status
        cm_status = "Closed"
        for item in status_raw.get('marketState', []):
            if item.get('market') == 'Capital Market':
                cm_status = item.get('marketStatus', 'Closed')
                break
        
        cache.set(cache_key, cm_status, expire=60) # Cache for 1 minute
        return cm_status
    except Exception as e:
        Logger.error("Failed to fetch market status", str(e))
        return "Closed"

def get_stock_details(symbol: str):
    symbol = symbol.upper()
    cache_key = f"quote:{symbol}"
    
    cached_data = cache.get(cache_key)
    if cached_data:
        Logger.info(f"Price Cache Hit: {symbol}")
        return cached_data

    for attempt in range(2):
        try:
            Logger.info(f"Fetching {symbol} (Attempt {attempt + 1})...")
            from nsepython import nse_eq
            raw_data = nse_eq(symbol)
            
            if not raw_data:
                raise ValueError("Empty response from NSE")

            # --- ROBUST DEEP MAPPER ---
            metadata = raw_data.get('metadata', {})
            price_info = raw_data.get('priceInfo', {})
            intra_day = price_info.get('intraDayHighLow', {})
            
            # 1. Company Name Fallback
            company_name = (
                metadata.get('companyName') 
                or (raw_data.get('info') or {}).get('companyName') 
                or symbol
            )

            # 2. High/Low Fallback (Post-market keys often differ)
            high = intra_day.get('high') or price_info.get('high') or 0
            low = intra_day.get('low') or price_info.get('low') or 0
            
            # 3. 52 Week High Fallback
            # NSE sometimes puts this in azMarket, sometimes in marketDeptOrderBook
            h52 = (
                (raw_data.get('azMarket') or {}).get('high52') or 
                (raw_data.get('marketDeptOrderBook') or {}).get('tradeInfo', {}).get('high52') or 
                'N/A'
            )

            last_price = (
                price_info.get('lastPrice') 
                or price_info.get('close') 
                or price_info.get('previousClose') 
                or 0
            )
            p_change = price_info.get('pChange') or 0
            vwa = price_info.get('vwa') or price_info.get('vwap') or 0

            formatted_data = {
                "info": {
                    "symbol": symbol,
                    "companyName": company_name
                },
                "priceInfo": {
                    "lastPrice": float(last_price) if last_price is not None else 0.0,
                    "pChange": float(p_change) if p_change is not None else 0.0,
                    "intraDayHighLow": {
                        "high": float(high) if high is not None else 0.0,
                        "low": float(low) if low is not None else 0.0
                    },
                    "vwa": float(vwa) if vwa is not None else 0.0
                },
                "azMarket": {
                    "high52": h52
                }
            }
            
            cache.set(cache_key, formatted_data, expire=300)
            return formatted_data

        except Exception as e:
            Logger.error(f"Attempt {attempt + 1} failed for {symbol}", str(e))
            if attempt == 0:
                warm_session()
            else:
                return None