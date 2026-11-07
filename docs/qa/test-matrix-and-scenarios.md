# QA Test Matrix & Execution Guide

This document outlines the testing strategy, test fixtures, and acceptance scenarios across all 5 QA dimensions for the AI Company Insights & Interactive Q&A feature.

---

## 1. Traceability & Coverage Matrix

| Test ID | Traced REQ | Category | Scenario Description | Preconditions | Input / Action | Expected Result |
|---|---|---|---|---|---|---|
| `QA-001` | `REQ-101` | Positive | Full metrics computation for 15Y synced scrip | Stock `RELIANCE` has 3,700 rows in TimescaleDB | Call `analytics_engine.get_stock_analytics("RELIANCE")` | Returns valid non-null CAGR (1Y, 3Y, 5Y, 10Y), max drawdown % & dates, 50/200 DMA, and volatility. |
| `QA-002` | `REQ-101` | Boundary | Metrics for newly listed stock (< 3 years history) | Stock `NEWLIST` has 450 rows in TimescaleDB | Call `analytics_engine.get_stock_analytics("NEWLIST")` | Returns valid 1Y CAGR; returns `null` for 3Y, 5Y, and 10Y CAGR without raising exceptions. |
| `QA-003` | `REQ-101` | Negative | Unsynced stock analytics request | Symbol `UNSYNCED` has 0 rows in TimescaleDB | Call `GET /api/ai/insights/UNSYNCED` | Returns HTTP 422 with `SYMBOL_NOT_SYNCED` error message. |
| `QA-004` | `REQ-201` | Positive | Zero-configuration Mock Mode execution | No API key in `.env` (`AI_PROVIDER=mock`) | Call `GET /api/ai/insights/TCS` | Returns HTTP 200 with `"provider": "mock"` and synthesized summary citing exact CAGR figures. |
| `QA-005` | `REQ-201` | Network / Timeout | External LLM timeout fallback | `AI_PROVIDER=gemini` with mock delay $> 4.0\text{s}$ | Call `GET /api/ai/insights/TCS` | Triggers timeout handler, falls back to `MockAIService`, returns HTTP 200 with `"provider": "mock_fallback"`. |
| `QA-006` | `REQ-301` | Compliance / Security | User asks for buy recommendation | Stock `INFY` selected | Post message: `"Should I buy INFY tomorrow?"` | Compliance filter intercepts prompt; returns SEBI advisory refusal message. |
| `QA-007` | `REQ-401` | Positive | Redis caching verification | Stock `TCS` synced in DB | Call `GET /api/ai/insights/TCS` twice within 60s | First call runs analytical engine; second call returns from Redis in $< 20\text{ms}$. |
| `QA-008` | `REQ-402` | Positive | Chat historical crash inquiry | Stock `TCS` synced in DB | User asks: `"What was the 2020 max drawdown?"` | Response text cites the exact `-28.40%` figure from quantitative profile. |
| `QA-009` | `REQ-501` | Positive | UI renders Insight Card for synced stock | Stock selected with `is_synced: true` | Load dashboard page in browser | AI Insight Card is visibly rendered with Trend Regime badge and metric pills. |
| `QA-010` | `REQ-502` | Positive | UI Chat Drawer interaction & chip click | Dashboard loaded for `TCS` | Click chip `"2020 Crash Impact?"` | Prompt submits automatically; assistant reply streams or displays in chat stream with disclaimer. |

---

## 2. Test Execution Commands

### Unit Tests
```bash
cd backend
pytest tests/test_analytics_engine.py -v
pytest tests/test_ai_service.py -v
```

### Integration Tests
```bash
cd backend
pytest tests/test_api_endpoints.py -v
```

### Frontend Build & Lint Verification
```bash
cd frontend
npm run build
```

---

## 3. Test Fixtures

### Sample Data Fixture: `fixture_price_series.csv`
Contains simulated daily closing prices designed to test specific mathematical conditions:
- **Known Drawdown:** Initial peak at ₹1000 on 2020-02-15 dropping to ₹600 on 2020-03-23 (Exact Drawdown = $-40.00\%$).
- **Known 1-Year Return:** Starting at ₹600, ending at ₹900 (Exact Return = $+50.00\%$).
- **50 DMA > 200 DMA:** Rising price trajectory triggering `BULLISH_TRENDING`.
