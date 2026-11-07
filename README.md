# NSE PRO - AI Company Insights

A high-performance, real-time analytics dashboard and AI-powered intelligence platform for the National Stock Exchange (NSE) of India, optimized for deep historical data analysis (15 years) and conversational equity research.

---

## 🚀 Overview
NSE PRO bridges the gap between real-time market data, long-term historical analysis, and conversational AI insights. It features a robust time-series engine capable of ingesting and visualizing 15 years of market history for any NSE scrip, computing deterministic quantitative performance metrics (CAGR, drawdowns, moving averages, volatility), and injecting this grounded context into pluggable AI models for interactive research.

```
                                  ┌───────────────────────────────┐
                                  │      React 18 Frontend        │
                                  │  - Stock Header & Live Quote  │
                                  │  - TradingView Charts (15Y)   │
                                  │  - AI Snapshot Card           │
                                  │  - Interactive Chat Drawer    │
                                  └───────────────▲───────────────┘
                                                  │ REST (Axios)
                                  ┌───────────────▼───────────────┐
                                  │        FastAPI Backend        │
                                  └───────▲───────────────▲───────┘
                                          │               │
                     ┌────────────────────┴──┐         ┌──┴─────────────────────────┐
                     │                       │         │                            │
          ┌──────────▼──────────┐ ┌──────────▼───────┐ │   Pluggable AI Adapter     │
          │   TimescaleDB       │ │   Redis Cache    │ │  - Mock Heuristic Engine   │
          │  (stock_prices 15Y) │ │  (1-Hour TTL)    │ │  - Google Gemini API       │
          └─────────────────────┘ └──────────────────┘ │  - OpenAI API              │
                                                       │  - Ollama (Local)          │
                                                       └────────────────────────────┘
```

---

## 🛠 Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS + TradingView Lightweight Charts + Lucide React
- **Backend:** FastAPI (Python 3.10+) + Threaded Concurrency + Pandas & NumPy
- **Persistence:** TimescaleDB (Time-series PostgreSQL Hypertable)
- **Caching & Symbols:** Redis
- **Data Providers:** `nsepython` (Live Quotes) & `yfinance` (Historical Adjusted Data)
- **AI Providers:** Pluggable adapter supporting Mock Mode (zero configuration), Google Gemini, OpenAI, and Ollama
- **Containerization:** Docker Compose (Full-stack orchestration)

---

## ✨ Key Features

### 📈 Historical Data Engine
- **15-Year Backfill:** Ingests over 3,700 daily price points per scrip.
- **Smarter Syncing:** Uses incremental gap analysis to fetch only missing data.
- **Corporate Action Detection:** Automatically detects stock splits or bonuses by comparing database prices with adjusted market data. If divergence > 1% is found, the scrip is automatically re-synced to maintain consistency.
- **Concurrent Ingestion:** A high-speed 3-worker thread pool enables rapid bulk fetching of the NIFTY 50 and other scrips.

### 🤖 AI Company Intelligence & Interactive Q&A
- **Deterministic Quantitative Engine:** Computes 1Y/3Y/5Y/10Y CAGR, maximum historical drawdown (% and exact dates), 50/200 DMA, and 252-day annualized volatility server-side in Python to guarantee 100% mathematical accuracy without LLM hallucinations.
- **Pluggable LLM Adapter:** Modular backend supporting Google Gemini, OpenAI, and Ollama via `.env`, with a zero-config heuristic **Mock Mode** for instant local execution without API keys.
- **Automated AI Snapshot Card:** Automatically generates an executive summary, trend regime badge (`BULLISH_TRENDING`, `BEARISH_TRENDING`, `CONSOLIDATION`), and key risk factors upon selecting a synced stock.
- **Interactive Chat Drawer:** Expandable slide-out assistant on the stock page with preset prompt chips (`2020 Crash Impact?`, `Volume Trend Analysis`, `Drawdown Risk Profile`) for follow-up conversational queries.
- **SEBI Non-Advisory Guardrail:** Automated query interceptor and UI disclaimers ensuring strict educational/research compliance.

### 📊 Professional Analytics
- **TradingView Integration:** High-performance, interactive price charts using TradingView's Lightweight Charts library.
- **Multi-Timeframe Toggles:** Seamless switching between 1M, 6M, 1Y, 5Y, and ALL (Max) views.
- **Smart Downsampling:** Powered by TimescaleDB's `time_bucket` aggregation, ensuring 15-year charts load in milliseconds.
- **Volume Overlay:** Visualized trading volume alongside price action.

### ⚡ Performance & UX
- **Instant Search:** Debounced autocomplete for 2,000+ symbols with integrated "Sync Status" checkmarks.
- **Real-time Dashboards:** Live market prices, intraday high/low, and 52-week statistics.
- **Unified Progress Tracking:** Real-time polling with a persistent progress bar for both bulk and individual scrip syncs.

---

## 📚 Project Documentation Hub

Complete technical, product, QA, and compliance specifications are maintained in the [`docs/`](docs/) directory:

| Document | File Link | Description |
|---|---|---|
| **Product Requirement Document (PRD)** | [PRD-ai-company-insights.md](docs/prd/PRD-ai-company-insights.md) | Standard-tier PRD with deterministic formulas, KPIs, and state machines |
| **Technical Specification** | [SPEC-ai-company-insights.md](docs/spec/SPEC-ai-company-insights.md) | Architectural contracts, project structure, commands, and boundaries |
| **System Architecture & Design** | [system-design.md](docs/architecture/system-design.md) | In-depth data pipeline, TimescaleDB hypertable queries, and AI adapter pattern |
| **API Reference** | [ai-insights-api.md](docs/api/ai-insights-api.md) | Complete REST API documentation with cURL examples and schemas |
| **QA Test Matrix** | [test-matrix-and-scenarios.md](docs/qa/test-matrix-and-scenarios.md) | 10 test scenarios across all 5 QA categories with test fixtures |
| **SEBI Compliance Framework** | [sebi-regulatory-framework.md](docs/compliance/sebi-regulatory-framework.md) | SEBI non-advisory policy, disclaimer guidelines, and prompt guardrails |
| **Agile Backlog & User Stories** | [user-stories.md](docs/backlog/user-stories.md) | INVEST user stories (`US-101` to `US-105`) with Gherkin acceptance criteria |
| **Statement of Intent** | [ai_company_insights.md](docs/intent/ai_company_insights.md) | Confirmed scope boundaries, user persona, and success targets |

---

## 🛠 Setup & Installation

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.10+ (for local backend development)

### Quick Start (Docker)
1. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8000/api
   REDIS_HOST=localhost
   DB_URL=postgresql://nse_admin:nse_password@localhost:5432/nse_analytics
   ENABLE_LOGGING=true

   # AI Configuration (Optional: defaults to mock mode if omitted)
   ENABLE_AI_INSIGHTS=true
   AI_PROVIDER=mock
   AI_API_KEY=""
   AI_MODEL=""
   ```

2. **Launch Application:**
   ```bash
   docker compose up --build -d
   ```
   - **Frontend:** `http://localhost:5173`
   - **Backend API:** `http://localhost:8000`
   - **API Docs (Swagger):** `http://localhost:8000/docs`
   - **TimescaleDB:** Port `5432`
   - **Redis Cache:** Port `6379`

### Local Development (Without Docker)
1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## ⚖️ Regulatory Compliance & Disclaimer

**Educational & Research Analytics Only. Not SEBI-registered investment advice. No buy/sell/hold recommendations.**

This software is for research and educational purposes only. Data is retrieved using third-party wrappers and public market feeds; data accuracy is not guaranteed for live trading decisions. NSE PRO does not provide investment advisory services or portfolio management recommendations under the SEBI (Research Analysts) Regulations, 2014, or SEBI (Investment Advisers) Regulations, 2013.
