# Implementation Plan: AI Company Insights & Interactive Q&A

## Architectural Overview

```
   ┌────────────────────────────────────────────────────────┐
   │                   React Frontend                       │
   │  ┌───────────────────────┐  ┌───────────────────────┐  │
   │  │   AIInsightCard.jsx   │  │    AIChatDrawer.jsx   │  │
   │  └───────────▲───────────┘  └───────────▲───────────┘  │
   └──────────────┼──────────────────────────┼──────────────┘
                  │ GET /api/ai/insights     │ POST /api/ai/chat
   ┌──────────────▼──────────────────────────▼──────────────┐
   │                  FastAPI Backend                       │
   │  ┌───────────────────────┐  ┌───────────────────────┐  │
   │  │  analytics_engine.py  │  │     ai_service.py     │  │
   │  │ (CAGR, Drawdown, DMA) │  │(Mock, Gemini, OpenAI) │  │
   │  └───────────▲───────────┘  └───────────▲───────────┘  │
   └──────────────┼──────────────────────────┼──────────────┘
                  │                          │
   ┌──────────────▼───────────┐  ┌───────────▼──────────────┐
   │   TimescaleDB (Hypertable)│  │   Configured LLM / Mock  │
   └──────────────────────────┘  └──────────────────────────┘
```

## Implementation Phases

### Phase 1: Analytics & Quantitative Feature Engine (`backend/services/analytics_engine.py`)
- Query historical daily prices from TimescaleDB for the given symbol.
- Calculate:
  - CAGR across 1Y, 3Y, 5Y, 10Y (or available span).
  - Maximum Historical Drawdown (% and peak-to-trough dates).
  - 50-day and 200-day Simple Moving Averages (SMA/DMA) & current price relation.
  - 30-day and 1-year annualized volatility (standard deviation of log returns).
  - Multi-year returns matrix (year-by-year % return).
  - Recent volume trends (20-day average vs 60-day average).
- Add unit tests for the analytics engine.

### Phase 2: Pluggable AI Service Adapter (`backend/services/ai_service.py`)
- Implement `AIServiceInterface` with a base adapter:
  - `MockAIService`: Heuristic, rich rule-based generation that produces insightful natural language summaries and handles common stock questions deterministically without external keys.
  - `GeminiAIService`: Uses Google Gemini API (via HTTP / `google-generativeai` if available) with prompt injection of the quantitative profile.
  - `OpenAIAIService`: Uses OpenAI API with structured prompts.
  - `OllamaAIService`: Connects to local Ollama endpoint (`http://localhost:11434`).
- Add system prompt enforcing research/educational posture and citing exact numerical calculations from the quantitative profile.

### Phase 3: Backend API Integration (`backend/main.py`)
- Add endpoints:
  - `GET /api/ai/insights/{symbol}`
  - `POST /api/ai/chat`
- Wire caching (Redis) for generated insights (e.g., 1-hour TTL) to optimize performance.

### Phase 4: Frontend UI Components (`frontend/src/components/`)
- Create `AIInsightCard.jsx`:
  - Executive summary banner with Trend Regime badge (Bullish / Neutral / Bearish).
  - Metric chips: Multi-year CAGR, Max Historical Drawdown, Volatility, 50/200 DMA status.
  - Expandable Key Strengths, Risk Factors, and Historical Context sections.
- Create `AIChatDrawer.jsx`:
  - Sliding / collapsible interactive assistant drawer.
  - Quick-prompt chips (e.g. "2020 crash impact?", "Volume trend analysis", "Risk profile summary").
  - Message history thread with research disclaimer footer.
- Integrate both components seamlessly into `frontend/src/App.jsx`.

### Phase 5: Verification & End-to-End Testing
- Test with synced symbols.
- Verify fallback handling when a stock has partial or un-synced data.
- Run frontend build check (`npm run build`).
- Verify backend tests.
