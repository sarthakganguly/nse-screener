# Task List: AI Company Insights & Interactive Q&A

- [ ] Task 1: Build the Deterministic Quantitative Feature Engine (`backend/services/analytics_engine.py`)
  - Calculate 1Y/3Y/5Y/10Y CAGR, Max Drawdown (% and dates), 50/200 DMA, Annualized Volatility, and yearly return breakdown.
  - Acceptance Criteria: Takes symbol data from TimescaleDB and outputs accurate structured quantitative profile dictionary.
  - Verification: Run unit test script asserting calculations against simulated/known time-series.

- [ ] Task 2: Build the Pluggable AI Service Adapter (`backend/services/ai_service.py`)
  - Implement base interface, high-fidelity Mock provider, and support for Gemini/OpenAI/Ollama via `.env`.
  - Acceptance Criteria: In `mock` mode, returns structured summary and natural language chat answers citing quantitative figures; switches seamlessly if `AI_PROVIDER` and `AI_API_KEY` are provided.
  - Verification: Test mock generation and prompt synthesis directly via Python test.

- [ ] Task 3: Expose FastAPI Endpoints & Redis Caching (`backend/main.py`)
  - Expose `GET /api/ai/insights/{symbol}` and `POST /api/ai/chat`.
  - Acceptance Criteria: Endpoints return 200 OK with expected JSON schema; cache `/api/ai/insights/{symbol}` in Redis.
  - Verification: Test endpoints via curl or FastAPI TestClient.

- [ ] Task 4: Build Frontend AI Components (`frontend/src/components/AIInsightCard.jsx` & `frontend/src/components/AIChatDrawer.jsx`)
  - Style components matching dark mode slate/indigo aesthetic.
  - Acceptance Criteria: Renders snapshot metrics (CAGR, Drawdown, DMA status), AI summary, and chat interface with suggested prompt chips.
  - Verification: Component unit/syntax check.

- [ ] Task 5: Integrate Components into `App.jsx` & Wire End-to-End
  - Place `AIInsightCard` alongside `StockChart` when a stock is synced; integrate floating/docked `AIChatDrawer`.
  - Acceptance Criteria: Full interactive experience works smoothly when viewing stocks.
  - Verification: Run `npm run build` in frontend to ensure zero compilation or bundle errors.
