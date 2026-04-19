# NSE PRO - AI Company Insights

A high-performance, real-time analytics dashboard for the National Stock Exchange (NSE) of India, optimized for deep historical data analysis and AI-driven intelligence.

## 🚀 Overview
NSE PRO is a professional-grade intelligence tool that bridges the gap between real-time market data and long-term historical analysis. It features a robust time-series engine capable of ingesting and visualizing 15 years of market history for any NSE scrip, providing the foundational data layer for AI-powered company research.

## 🛠 Tech Stack
- **Frontend:** React + Vite + Tailwind CSS + TradingView Lightweight Charts
- **Backend:** FastAPI (Python) + Threaded Concurrency
- **Persistence:** TimescaleDB (Time-series PostgreSQL)
- **Caching:** Redis
- **Data APIs:** `nsepython` (Live) & `yfinance` (Historical)
- **Containerization:** Docker Compose (Full-stack orchestration)

## ✨ Key Features

### 📈 Historical Data Engine
- **15-Year Backfill:** Ingests over 3,700 daily price points per scrip.
- **Smarter Syncing:** Uses incremental gap analysis to fetch only missing data.
- **Corporate Action Detection (Option B):** Automatically detects stock splits or bonuses by comparing database prices with adjusted market data. If a divergence >1% is found, the scrip is automatically wiped and re-synced to maintain accuracy.
- **Concurrent Ingestion:** A high-speed 3-worker thread pool enables rapid bulk fetching of the NIFTY 50 and other scrips.

### 📊 Professional Analytics
- **TradingView Integration:** High-performance, interactive price charts using TradingView's Lightweight Charts library.
- **Multi-Timeframe Toggles:** Seamless switching between 1M, 6M, 1Y, 5Y, and ALL (Max) views.
- **Smart Downsampling:** Powered by TimescaleDB's `time_bucket` aggregation, ensuring 15-year charts load in milliseconds.
- **Volume Overlay:** Visualized trading volume alongside price action.

### ⚡ Performance & UX
- **Instant Search:** Debounced autocomplete for 2,000+ symbols with integrated "Sync Status" checkmarks.
- **Real-time Dashboards:** Live market prices, intraday high/low, and 52-week statistics.
- **Unified Progress Tracking:** Real-time polling with a persistent progress bar for both bulk and individual scrip syncs.

## 🛠 Setup & Installation

### Prerequisites
- Docker & Docker Compose

### Quick Start (Docker)
1. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://<YOUR_SERVER_IP>:8000/api
   REDIS_HOST=localhost
   DB_URL=postgresql://nse_admin:nse_password@localhost:5432/nse_analytics
   ENABLE_LOGGING=true
   ```

2. **Launch Application:**
   ```bash
   docker compose up --build -d
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:8000`
   - Database: Port `5432` (TimescaleDB)
   - Cache: Port `6379` (Redis)

## 🔮 Future Roadmap: AI Q&A
The foundation is now laid for AI Company Intelligence. Upcoming features include:
- **LLM Context Injection:** Feeding 15 years of price/volume trends into an LLM for natural language analysis.
- **Financial Q&A:** Ask questions like *"How has the volume trended relative to price over the last 3 years?"* or *"Summarize the volatility profile for this scrip."*
- **Sentiment Layer:** Integrating news and earnings data for holistic company insights.

## ⚖️ Disclaimer
This project is for educational and research purposes only. It uses unofficial API wrappers. Data accuracy is not guaranteed for live trading decisions.
