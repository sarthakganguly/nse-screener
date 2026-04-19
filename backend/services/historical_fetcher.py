import yfinance as yf
import pandas as pd
import threading
import time
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from .database_manager import db
from .logger import Logger

class BackfillManager:
    def __init__(self):
        self.status = {
            "is_running": False,
            "total": 0,
            "completed": 0,
            "current_symbol": "", # For backward compatibility
            "active_symbols": [],
            "stop_requested": False
        }
        self._lock = threading.Lock()
        self._executor = None

    def get_status(self):
        with self._lock:
            # Join active symbols for UI display
            self.status["current_symbol"] = ", ".join(self.status["active_symbols"])
            return self.status.copy()

    def stop(self):
        with self._lock:
            self.status["stop_requested"] = True
            Logger.info("Stop requested for backfill workers.")

    def start_bulk(self, symbols, years=15):
        with self._lock:
            if self.status["is_running"]:
                return False
            
            self.status = {
                "is_running": True,
                "total": len(symbols),
                "completed": 0,
                "current_symbol": "",
                "active_symbols": [],
                "stop_requested": False
            }
        
        threading.Thread(target=self._run_executor, args=(symbols, years)).start()
        return True

    def start_single(self, symbol, years=15):
        return self.start_bulk([symbol], years)

    def _run_executor(self, symbols, years):
        try:
            # We use 3 workers as requested
            with ThreadPoolExecutor(max_workers=3) as executor:
                # Map the worker function across symbols
                futures = [executor.submit(self._worker, s, years) for s in symbols]
                # Wait for all to finish
                for future in futures:
                    future.result()
        except Exception as e:
            Logger.error("Executor failure", str(e))
        finally:
            with self._lock:
                self.status["is_running"] = False
                self.status["active_symbols"] = []
                Logger.info(f"Bulk backfill process ended. Final: {self.status['completed']}/{self.status['total']}")

    def _worker(self, symbol, years):
        """Worker function for a single symbol sync."""
        # 1. Check stop request before starting
        with self._lock:
            if self.status["stop_requested"]:
                return
            self.status["active_symbols"].append(symbol)

        try:
            success = backfill_history(symbol, years, self._should_stop)
            if success:
                with self._lock:
                    self.status["completed"] += 1
        except Exception as e:
            Logger.error(f"Worker failed for {symbol}", str(e))
        finally:
            with self._lock:
                if symbol in self.status["active_symbols"]:
                    self.status["active_symbols"].remove(symbol)

    def _should_stop(self):
        """Callback for the backfill_history logic to check if it should abort."""
        with self._lock:
            return self.status["stop_requested"]

def backfill_history(symbol: str, years=15, stop_callback=None):
    """
    Smarter Fetcher (Option B):
    - stop_callback: function that returns True if we should stop.
    """
    symbol_ns = f"{symbol}.NS"
    Logger.info(f"Starting smarter sync for {symbol}...")

    # 1. Determine Window
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=years*365)
    
    # 2. Check current DB bounds
    db_min, db_max, db_last_close = db.get_symbol_bounds(symbol)
    
    # Gap Analysis
    if db_max:
        # Ensure db_max is aware (Postgres should return it aware, but safety first)
        if db_max.tzinfo is None:
            db_max = db_max.replace(tzinfo=timezone.utc)

        # Check if we have yesterday's data
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date()
        if db_max.date() >= yesterday:
            Logger.info(f"{symbol} is already up to date ({db_max.date()}).")
            return True
        
        # Incremental Sync from db_max
        start_date = db_max + timedelta(days=1)
        Logger.info(f"Incremental sync for {symbol} starting from {start_date.date()}")
    
    # 3. Download Data in chunks to handle 'Option B' checks
    # For simplicity, we fetch all missing data. But for Option B, 
    # we need to check the 'Adjusted' prices from Yahoo against our DB.
    
    # Check for Split (Option B)
    if db_last_close and db_max:
        # Fetch just the last day from Yahoo to compare
        check_data = yf.download(symbol_ns, start=db_max.date().isoformat(), end=(db_max + timedelta(days=4)).date().isoformat(), progress=False)
        if not check_data.empty:
            # Flatten columns
            check_data.columns = [col[0] if isinstance(col, tuple) else col for col in check_data.columns]
            # yfinance adjusted price vs our stored price
            y_close = float(check_data.iloc[0]['Close'])
            # Compare. If divergence > 1%, assume a split happened.
            if abs(y_close - db_last_close) / db_last_close > 0.01:
                Logger.info(f"!! CORPORATE ACTION DETECTED for {symbol} !! (DB: {db_last_close}, Y: {y_close}). Wiping and re-fetching 15Y.")
                db.delete_symbol_data(symbol)
                start_date = end_date - timedelta(days=years*365)

    # 4. Final Download & Store
    # Split into 2-year segments to provide "Stop" button granularity
    current_chunk_start = start_date
    while current_chunk_start < end_date:
        if stop_callback and stop_callback():
            Logger.info(f"Sync stopped for {symbol} during segment download.")
            return False

        chunk_end = min(current_chunk_start + timedelta(days=365*2), end_date)
        
        # Convert to string for yfinance to avoid datetime comparison internally
        start_str = current_chunk_start.date().isoformat()
        end_str = chunk_end.date().isoformat()
        
        Logger.info(f"Downloading {symbol} segment from {start_str}...")
        
        df = yf.download(symbol_ns, start=start_str, end=end_str, progress=False)
        
        if not df.empty:
            # Flatten MultiIndex columns if present
            df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]
            
            records = []
            for t, row in df.iterrows():
                records.append((
                    t, symbol, 
                    float(row['Open']), float(row['High']), 
                    float(row['Low']), float(row['Close']), 
                    int(row['Volume'])
                ))
            db.insert_bulk_prices(records)
            Logger.info(f"Stored {len(records)} new days for {symbol}.")
        
        current_chunk_start = chunk_end + timedelta(days=1)
        time.sleep(0.5) # Small breather between segments

    return True

# Singleton instance
backfill_manager = BackfillManager()

def check_sync_status(symbols):
    """Returns a dict mapping symbol to its sync status."""
    results = {}
    for s in symbols:
        results[s] = db.is_symbol_synced(s)
    return results
