import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from services.logger import Logger
from services.symbols import refresh_master_list, search_symbols
from services.nse_service import get_stock_details, warm_session

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
    return data