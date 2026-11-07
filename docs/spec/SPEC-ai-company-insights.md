# Spec: AI Company Insights & Interactive Q&A

## Objective
Provide automated, mathematically verified AI company insight summaries and an interactive conversational Q&A drawer for any selected NSE stock. The system leverages existing 15-year historical price/volume time-series data stored in TimescaleDB and live quotes from NSE.

Key capabilities:
1. **Automated AI Snapshot Card:** Generates upon selecting a synced stock, synthesizing multi-year performance (1Y, 3Y, 5Y, 10Y CAGR), maximum historical drawdown, volatility profile, moving-average trends (50/200 DMA), and high-volume breakout patterns into an executive overview.
2. **Interactive Stock Chat Drawer:** An expandable conversational drawer on the stock page allowing users to ask natural language questions (e.g. "How did this stock perform during the 2020 crash?", "Is volume increasing on recent upward swings?", "Summarize the 5-year volatility profile.").
3. **Deterministic Financial Feature Engine:** Computes all quantitative metrics server-side in Python (via Pandas & TimescaleDB) to guarantee 100% numerical accuracy and prevent LLM mathematical hallucinations.
4. **Pluggable LLM Provider Layer:** Modular backend supporting Google Gemini, OpenAI, and Ollama through `.env`, with an instant zero-dependency mock/heuristic fallback mode for seamless local execution without API keys.

## Tech Stack
- **Backend:** FastAPI, Python 3.10+, Pandas, NumPy, psycopg2-binary
- **LLM Integrations:** Generic HTTP / official clients (Google Gemini, OpenAI, Ollama), configurable via `.env` (`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`)
- **Database:** TimescaleDB (PostgreSQL) hypertable `stock_prices`
- **Cache & Master Data:** Redis
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React icons, Axios

## Commands
- **Backend Dev Server:**
  ```bash
  cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000
  ```
- **Frontend Dev Server:**
  ```bash
  cd frontend && npm run dev
  ```
- **Docker Compose (All services):**
  ```bash
  docker compose up --build -d
  ```
- **Backend Tests:**
  ```bash
  cd backend && pytest
  ```
- **Frontend Build Check:**
  ```bash
  cd frontend && npm run build
  ```

## Project Structure
```
backend/
├── main.py                     # API routes including /api/ai/insights and /api/ai/chat
├── services/
│   ├── ai_service.py           # Pluggable LLM provider adapter (Mock, Gemini, OpenAI, Ollama)
│   ├── analytics_engine.py     # Quantitative metrics engine (CAGR, drawdown, DMAs, volatility)
│   ├── database_manager.py     # TimescaleDB queries & aggregations
│   ├── historical_fetcher.py   # Historical backfill manager
│   ├── nse_service.py          # Live NSE market data
│   ├── cache_manager.py        # Redis caching
│   └── logger.py               # Custom console logger
frontend/
├── src/
│   ├── App.jsx                 # Main application dashboard
│   ├── components/
│   │   ├── AIInsightCard.jsx   # Automated AI executive summary & risk snapshot
│   │   └── AIChatDrawer.jsx    # Expandable interactive Q&A assistant drawer
│   ├── index.css
│   └── main.jsx
docs/
├── intent/
│   └── ai_company_insights.md  # Approved statement of intent
└── spec/
    └── SPEC-ai-company-insights.md # This specification document
tasks/
├── plan.md                     # Implementation plan
└── todo.md                     # Actionable task list
```

## API Contracts

### 1. GET `/api/ai/insights/{symbol}`
- **Description:** Generates automated executive insights and quantitative snapshot for a synced stock.
- **Response Format:**
```json
{
  "symbol": "RELIANCE",
  "generated_at": "2026-11-07T10:30:00Z",
  "provider": "mock | gemini | openai | ollama",
  "quantitative_profile": {
    "cagr_1y": 14.2,
    "cagr_3y": 18.5,
    "cagr_5y": 21.1,
    "cagr_10y": 17.8,
    "max_drawdown_pct": -38.4,
    "max_drawdown_period": "2020-01-15 to 2020-03-23",
    "annualized_volatility_pct": 24.1,
    "dma_50": 2910.50,
    "dma_200": 2740.20,
    "current_price": 2985.00,
    "trend_regime": "BULLISH_TRENDING",
    "volume_trend_30d": "EXPANDING"
  },
  "summary": {
    "executive_overview": "Strong long-term compounder trading above both 50 and 200 DMAs...",
    "key_strengths": ["Consistent double-digit 5Y and 10Y CAGR", "Healthy recovery post historical drawdowns"],
    "risk_factors": ["Elevated cyclical drawdown risk during market corrections", "Moderate annualized volatility"],
    "historical_context": "Has weathered major drawdowns with standard recovery windows of 6 to 9 months."
  },
  "disclaimer": "For research and educational purposes only. Not SEBI-registered investment advice."
}
```

### 2. POST `/api/ai/chat`
- **Request Body:**
```json
{
  "symbol": "RELIANCE",
  "message": "How did this stock perform during the 2020 market crash?",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```
- **Response Format:**
```json
{
  "symbol": "RELIANCE",
  "reply": "During the 2020 market crash (Jan 2020 - Mar 2020), RELIANCE experienced a maximum drawdown of -38.4%, dropping to a low of ₹875 before rebounding sharply to recover its pre-crash peak within 5 months...",
  "provider": "mock",
  "metrics_cited": ["max_drawdown", "recovery_duration"]
}
```

## Testing Strategy
- **Unit Tests (`backend/tests/test_analytics_engine.py`):**
  - Verify deterministic calculations: CAGR across various time windows, Max Drawdown calculation, 50/200 DMA calculations, and annualized volatility calculation against known historical datasets.
- **Provider Tests (`backend/tests/test_ai_service.py`):**
  - Verify Mock provider returns valid structured JSON and coherent conversational replies without external dependencies.
  - Verify error handling and fallback behavior when API keys are missing or invalid.
- **Frontend Verification:**
  - Verify UI components render cleanly on responsive viewports.
  - Ensure zero layout shift and non-blocking asynchronous data fetching.

## Boundaries
- **Always do:**
  - Compute mathematical metrics server-side in Python before providing context to the LLM.
  - Include educational/research disclaimer on all AI outputs.
  - Provide a graceful fallback to mock mode if external API keys fail or are not set.
- **Ask first:**
  - Changing the TimescaleDB hypertable schema or altering existing price ingestion endpoints.
  - Adding external paid API dependencies or large model weight downloads.
- **Never do:**
  - Hallucinate financial calculations or let the LLM guess percentage returns/drawdowns.
  - Provide buy/sell recommendations or claim SEBI-registered advisory.
  - Hardcode external API keys in code or git commits.

## Success Criteria
- [ ] Backend endpoint `/api/ai/insights/{symbol}` successfully computes quantitative metrics from TimescaleDB and returns a structured AI summary.
- [ ] Backend endpoint `/api/ai/chat` answers conversational questions using the stock's quantitative metrics and historical context.
- [ ] Pluggable AI service works seamlessly out of the box in `mock` mode with zero `.env` setup, and can switch to Gemini/OpenAI/Ollama when configured.
- [ ] Frontend displays the AI Insight Card on the stock dashboard with visual indicators for CAGR, Drawdown, and Trend Regime.
- [ ] Interactive Chat Drawer allows users to open, ask questions, receive answers, and view suggested prompt chips.
