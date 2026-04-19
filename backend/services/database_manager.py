import os
import psycopg2
from psycopg2.extras import execute_values
from .logger import Logger

class DatabaseManager:
    def __init__(self):
        self.db_url = os.getenv("DB_URL", "postgresql://nse_admin:nse_password@localhost:5432/nse_analytics")
        self.conn = None
        self._connect()

    def _connect(self):
        import time
        max_retries = 5
        for i in range(max_retries):
            try:
                self.conn = psycopg2.connect(self.db_url)
                self.conn.autocommit = True
                Logger.info("Database Connection Established")
                self._init_schema()
                return
            except Exception as e:
                Logger.error(f"Failed to connect to Database (Attempt {i+1}/{max_retries})", str(e))
                time.sleep(5)
        Logger.error("Could not establish database connection after multiple attempts.")

    def _init_schema(self):
        with self.conn.cursor() as cur:
            # 1. Create the main historical prices table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS stock_prices (
                    time TIMESTAMPTZ NOT NULL,
                    symbol TEXT NOT NULL,
                    open DOUBLE PRECISION,
                    high DOUBLE PRECISION,
                    low DOUBLE PRECISION,
                    close DOUBLE PRECISION,
                    volume BIGINT,
                    PRIMARY KEY (time, symbol)
                );
            """)
            
            # 2. Turn it into a TimescaleDB Hypertable (if not already)
            try:
                cur.execute("SELECT create_hypertable('stock_prices', 'time', if_not_exists => TRUE);")
            except:
                pass # Already a hypertable or Timescale extension not loaded yet

            Logger.info("Database Schema Initialized (Timescale Hypertable)")

    def insert_bulk_prices(self, records):
        """Records is a list of tuples: (time, symbol, open, high, low, close, volume)"""
        query = "INSERT INTO stock_prices (time, symbol, open, high, low, close, volume) VALUES %s ON CONFLICT (time, symbol) DO UPDATE SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low, close=EXCLUDED.close, volume=EXCLUDED.volume"
        with self.conn.cursor() as cur:
            execute_values(cur, query, records)

    def get_symbol_bounds(self, symbol):
        """Returns (min_time, max_time, last_close) for a symbol."""
        query = "SELECT MIN(time), MAX(time), (SELECT close FROM stock_prices WHERE symbol=%s ORDER BY time DESC LIMIT 1) FROM stock_prices WHERE symbol=%s"
        with self.conn.cursor() as cur:
            cur.execute(query, (symbol, symbol))
            return cur.fetchone()

    def delete_symbol_data(self, symbol):
        """Removes all data for a symbol (used for re-syncing after splits)."""
        query = "DELETE FROM stock_prices WHERE symbol=%s"
        with self.conn.cursor() as cur:
            cur.execute(query, (symbol,))

    def get_aggregated_history(self, symbol, timeframe="1Y"):
        """
        Returns aggregated historical data based on timeframe.
        Self-correcting: if bucketed query returns < 2 points, falls back to daily.
        """
        resolutions = {
            "1M": ("1 day", "31 days"),
            "6M": ("1 day", "183 days"),
            "1Y": ("7 days", "366 days"),
            "5Y": ("30 days", "1826 days"),
            "ALL": ("90 days", "6000 days")
        }
        
        bucket_size, days_back = resolutions.get(timeframe, ("7 days", "366 days"))
        
        def run_query(b_size, d_back):
            if b_size == "1 day":
                q = """
                    SELECT time as bucket, close, volume 
                    FROM stock_prices 
                    WHERE symbol=%s AND time > (NOW() - %s::interval)
                    ORDER BY time ASC
                """
                p = (symbol, d_back)
            else:
                q = """
                    SELECT time_bucket(%s, time) AS bucket, 
                           AVG(close) as close, 
                           SUM(volume) as volume
                    FROM stock_prices
                    WHERE symbol=%s AND time > (NOW() - %s::interval)
                    GROUP BY bucket
                    ORDER BY bucket ASC
                """
                p = (b_size, symbol, d_back)
            
            with self.conn.cursor() as cur:
                cur.execute(q, p)
                rows = cur.fetchall()
                return [{"time": r[0].date().isoformat(), "value": float(r[1]), "volume": int(r[2])} for r in rows if r[1] is not None]

        # 1. Try with requested resolution
        data = run_query(bucket_size, days_back)
        
        # 2. If data is too sparse for a chart (< 2 points) and we aren't already at daily, fallback to daily
        if len(data) < 2 and bucket_size != "1 day":
            Logger.info(f"Sparse data for {symbol} ({len(data)} pts). Falling back to daily for chart.")
            data = run_query("1 day", days_back)
            
        Logger.info(f"Analytics for {symbol} ({timeframe}): Returning {len(data)} points.")
        return data

    def is_symbol_synced(self, symbol):
        """Checks if the symbol has data within the last 4 days (handling weekends/holidays)."""
        query = "SELECT MAX(time) FROM stock_prices WHERE symbol=%s"
        with self.conn.cursor() as cur:
            cur.execute(query, (symbol,))
            res = cur.fetchone()
            if res and res[0]:
                from datetime import datetime, timedelta, timezone
                # Use a 4-day window to be safe for long weekends
                buffer_limit = (datetime.now(timezone.utc) - timedelta(days=4)).date()
                return res[0].date() >= buffer_limit
            return False

# Singleton instance
db = DatabaseManager()
