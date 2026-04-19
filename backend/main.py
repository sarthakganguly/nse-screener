import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from services.logger import Logger
from services.symbols import refresh_master_list, search_symbols, get_top_50_symbols
from services.nse_service import get_stock_details, warm_session, get_market_status
from services.historical_fetcher import backfill_history, backfill_manager, check_sync_status

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # 1. Load symbols into Redis
    refresh_master_list()
    # 2. Initialize NSE Cookies
    warm_session()
    Logger.info("Screener Backend Online and Session Warmed")

@app.get("/api/symbols")
def api_search(q: str = Query("")):
    return search_symbols(q)

@app.get("/api/details/{symbol}")
def api_details(symbol: str):
    data = get_stock_details(symbol)
    if not data:
        return {"error": "Failed to fetch live data from NSE"}
    
    # Check if history is synced in DB
    from services.database_manager import db
    data["is_synced"] = db.is_symbol_synced(symbol.upper())
    
    return data

@app.get("/api/market-status")
def api_market_status():
    status = get_market_status()
    return {"status": status}

@app.get("/api/backfill/{symbol}")
def api_backfill(symbol: str):
    success = backfill_manager.start_single(symbol.upper())
    return {"symbol": symbol.upper(), "success": success}

@app.get("/api/bulk-backfill/start")
def start_bulk_backfill(years: int = Query(15)):
    symbols = get_top_50_symbols()
    success = backfill_manager.start_bulk(symbols, years)
    return {"success": success}

@app.get("/api/bulk-backfill/stop")
def stop_bulk_backfill():
    backfill_manager.stop()
    return {"success": True}

@app.get("/api/bulk-backfill/status")
def get_bulk_backfill_status():
    return backfill_manager.get_status()

@app.get("/api/bulk-check-sync")
def api_bulk_check_sync(symbols: str = Query("")):
    symbol_list = symbols.split(",") if symbols else []
    return check_sync_status(symbol_list)

@app.get("/api/analytics/{symbol}")
def api_analytics(symbol: str, range: str = Query("1Y")):
    from services.database_manager import db
    return db.get_aggregated_history(symbol.upper(), range)