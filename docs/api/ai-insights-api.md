# AI Company Insights & Chat API Reference

Base URL: `http://localhost:8000/api` (or environment-configured `VITE_API_URL`)

---

## 1. Automated Stock Insights

### `GET /api/ai/insights/{symbol}`
Retrieves mathematically computed performance metrics and an AI-synthesized executive summary for a synced NSE stock.

#### Parameters
| Name | Type | In | Required | Description |
|---|---|---|---|---|
| `symbol` | `string` | path | Yes | The NSE trading symbol (e.g. `RELIANCE`, `TCS`, `INFY`). Automatically converted to uppercase. |

#### Request Example (cURL)
```bash
curl -X GET "http://localhost:8000/api/ai/insights/RELIANCE" \
     -H "Accept: application/json"
```

#### Success Response (`200 OK`)
```json
{
  "symbol": "RELIANCE",
  "generated_at": "2026-11-07T10:35:00Z",
  "provider": "mock",
  "quantitative_profile": {
    "current_price": 2985.50,
    "cagr_1y": 14.20,
    "cagr_3y": 18.50,
    "cagr_5y": 21.10,
    "cagr_10y": 17.80,
    "max_drawdown_pct": -38.40,
    "max_drawdown_peak_date": "2020-01-15",
    "max_drawdown_trough_date": "2020-03-23",
    "recovery_duration_days": 180,
    "annualized_volatility_pct": 24.10,
    "dma_50": 2910.50,
    "dma_200": 2740.20,
    "trend_regime": "BULLISH_TRENDING",
    "volume_trend": "EXPANDING"
  },
  "summary": {
    "executive_overview": "RELIANCE demonstrates consistent long-term wealth compounding with a 5-year CAGR of 21.10%. The stock is currently trading in a BULLISH_TRENDING regime positioned above its 50 and 200 daily moving averages.",
    "key_strengths": [
      "Substantial 10-year compounding track record of 17.80% CAGR.",
      "Demonstrated swift recovery post the 2020 maximum historical drawdown (-38.40%)."
    ],
    "risk_factors": [
      "Historical cyclical drawdowns can reach ~38% during macro market corrections.",
      "Annualized volatility stands at 24.10%."
    ],
    "historical_context": "During the pandemic shock, the scrip reached its maximum recorded drawdown before rallying to new all-time highs within 6 months."
  },
  "disclaimer": "Educational & Research Analytics Only. Not SEBI-registered investment advice. No buy/sell/hold recommendations."
}
```

#### Error Responses
- **`404 Not Found`**: Stock does not exist in master symbol registry.
  ```json
  {
    "detail": "Symbol INVALID_SYMBOL not found."
  }
  ```
- **`422 Unprocessable Entity`**: Stock has not completed historical backfill.
  ```json
  {
    "detail": "Stock historical data has not been synced. Please sync 15Y history first."
  }
  ```

---

## 2. Interactive Conversational Chat

### `POST /api/ai/chat`
Allows users to ask natural language questions regarding the selected stock's quantitative history and price/volume behavior.

#### Request Headers
| Header | Value |
|---|---|
| `Content-Type` | `application/json` |

#### Request Body Schema
```json
{
  "symbol": "string (Required)",
  "message": "string (Required)",
  "history": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ]
}
```

#### Request Example (cURL)
```bash
curl -X POST "http://localhost:8000/api/ai/chat" \
     -H "Content-Type: application/json" \
     -d '{
       "symbol": "RELIANCE",
       "message": "What was the worst drawdown in the stock history?",
       "history": []
     }'
```

#### Success Response (`200 OK`)
```json
{
  "symbol": "RELIANCE",
  "reply": "RELIANCE experienced its maximum historical drawdown of -38.40% between January 15, 2020, and March 23, 2020. It successfully recovered to its prior peak within approximately 180 trading days.",
  "provider": "mock",
  "disclaimer": "Educational & Research Analytics Only. Not SEBI-registered investment advice. No buy/sell/hold recommendations."
}
```

#### Regulatory Refusal Response (`200 OK` with Disclaimer)
If a user asks for direct investment advice:
```bash
curl -X POST "http://localhost:8000/api/ai/chat" \
     -H "Content-Type: application/json" \
     -d '{
       "symbol": "RELIANCE",
       "message": "Should I buy RELIANCE tomorrow?",
       "history": []
     }'
```
Response:
```json
{
  "symbol": "RELIANCE",
  "reply": "NSE PRO provides quantitative historical research analytics only and cannot offer buy, sell, or target price recommendations under SEBI regulations. Please consult a SEBI-registered investment adviser for personal financial decisions.",
  "provider": "compliance_guardrail",
  "disclaimer": "Educational & Research Analytics Only. Not SEBI-registered investment advice. No buy/sell/hold recommendations."
}
```
