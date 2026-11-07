# System Architecture & Technical Design

## 1. Executive Architecture Summary

The AI Company Insights & Interactive Q&A system integrates analytical data processing with generative language synthesis. To ensure zero financial hallucinations, the architecture separates **deterministic quantitative calculation** from **natural language generation**:

1. **Storage Layer:** TimescaleDB hypertable (`stock_prices`) storing up to 15 years (~3,700 rows) of daily OHLCV market data.
2. **Deterministic Analytics Engine:** A server-side Python module (`analytics_engine.py`) using Pandas to compute mathematical metrics (CAGR, Max Drawdown, DMAs, Volatility, Volume shifts).
3. **Pluggable AI Adapter Layer:** A provider-agnostic service (`ai_service.py`) supporting:
   - **Mock Engine:** High-fidelity, heuristic rule-based responses with dynamic variable injection (runs out-of-the-box with zero configuration).
   - **Google Gemini Provider:** Direct connection to Gemini Flash models via API key.
   - **OpenAI Provider:** Standard GPT-4o / GPT-4o-mini integration.
   - **Ollama Provider:** Local LLM endpoint (`http://localhost:11434`) for offline execution.
4. **Caching Layer:** Redis cache with 3600-second TTL to avoid redundant calculations and LLM costs.
5. **Presentation Layer:** React frontend containing an automated **AI Insight Card** and an expandable **AI Chat Drawer**.

---

## 2. Component Diagram

```
+-----------------------------------------------------------------------------------+
|                                  USER BROWSER                                     |
|  +-------------------------------------+  +------------------------------------+  |
|  |     AIInsightCard (Auto on Load)    |  |   AIChatDrawer (Floating/Slide-out)|  |
|  +------------------+------------------+  +-----------------+------------------+  |
+---------------------|---------------------------------------|---------------------+
                      | GET /api/ai/insights/{symbol}         | POST /api/ai/chat
                      v                                       v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                    |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             API ROUTE CONTROLLER                            |  |
|  +-------------------------+-----------------------------------+---------------+  |
|                            |                                   |                  |
|                            v                                   v                  |
|             +------------------------------+     +-----------------------------+  |
|             |  Redis Cache Layer (1h TTL)  |     |   SEBI Compliance Filter    |  |
|             +--------------+---------------+     | (Rejects advisory questions)|  |
|                            | Miss                +--------------+--------------+  |
|                            v                                    |                 |
|             +------------------------------+                    |                 |
|             | QuantitativeAnalyticsEngine  |                    |                 |
|             | - 1Y/3Y/5Y/10Y CAGR          |                    |                 |
|             | - Max Drawdown (% & Dates)   |<-------------------+                 |
|             | - 50 & 200 DMA               |   Injected Quantitative Context      |
|             | - 252-Day Volatility         |                                      |
|             +--------------+---------------+                                      |
|                            |                                                      |
|                            v                                                      |
|             +-------------------------------------------------------------+       |
|             |                   AIServiceManager Factory                  |       |
|             |  (Dispatches based on AI_PROVIDER in environment variables) |       |
|             +-------+--------------------+-------------------+------------+       |
|                     |                    |                   |                    |
|                     v                    v                   v                    |
|             +---------------+    +---------------+   +---------------+            |
|             | MockAIService |    |GeminiAIService|   |OpenAIAIService|            |
|             |  (Built-in)   |    | (Google API)  |   | (OpenAI API)  |            |
|             +---------------+    +---------------+   +---------------+            |
+---------------------|-------------------------------------------------------------+
                      | SQL Query (Daily OHLCV)
                      v
+-----------------------------------------------------------------------------------+
|                                 TIMESCALEDB                                       |
|  Hypertable: stock_prices (time, symbol, open, high, low, close, volume)          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Processing & Analytical Pipeline

### 3.1 TimescaleDB Query
The engine extracts daily adjusted closing prices and volumes ordered chronologically:

```sql
SELECT time, open, high, low, close, volume 
FROM stock_prices 
WHERE symbol = %s 
ORDER BY time ASC;
```

### 3.2 Quantitative Formulations
- **Compounded Annual Growth Rate (CAGR):**
  $$\text{CAGR}_{N} = \left(\frac{P_{T}}{P_{T - N \times 252}}\right)^{\frac{1}{N}} - 1$$
- **Peak-to-Trough Maximum Drawdown:**
  $$\text{Peak}_t = \max_{0 \le \tau \le t}(P_\tau)$$
  $$\text{Drawdown}_t = \frac{P_t - \text{Peak}_t}{\text{Peak}_t}$$
  $$\text{Max Drawdown} = \min_{t}(\text{Drawdown}_t)$$
  The exact timestamps for $\text{argmax}(\text{Peak}_t)$ and $\text{argmin}(\text{Drawdown}_t)$ are captured.
- **Trend Regime Logic:**
  - `BULLISH_TRENDING`: Current Price $> \text{SMA}_{50} > \text{SMA}_{200}$
  - `BEARISH_TRENDING`: Current Price $< \text{SMA}_{50} < \text{SMA}_{200}$
  - `CONSOLIDATION`: All other conditions.

---

## 4. Pluggable AI Adapter Pattern

The adapter implements a unified interface:

```python
class BaseAIService(ABC):
    @abstractmethod
    async def generate_insight_summary(self, symbol: str, profile: dict) -> dict:
        pass

    @abstractmethod
    async def chat(self, symbol: str, message: str, profile: dict, history: list) -> str:
        pass
```

### 4.1 Mock Provider Design
The `MockAIService` provides zero-latency deterministic responses without external network access:
- Synthesizes dynamic executive summaries by formatting string templates with real computed values.
- Pattern-matches conversational user queries (`"drawdown"`, `"2020 crash"`, `"volume"`, `"volatility"`, `"cagr"`) and provides context-rich factual replies citing the exact database metrics.

### 4.2 Fallback Strategy
Every external provider call is wrapped in an async timeout:
- **Timeout threshold:** 4.0 seconds.
- **Action on Timeout or Error:** Log warning and seamlessly delegate generation to `MockAIService`, returning a response payload with `"provider": "mock_fallback"`.

---

## 5. Security & Isolation
- **No Direct LLM Access to Database:** The LLM never connects directly to TimescaleDB or generates dynamic SQL. Context is injected strictly as sanitized JSON.
- **SEBI Advisory Interceptor:** Fast regex filter evaluates incoming user chat queries before passing to the AI layer, instantly rejecting buy/sell/price-target requests.
- **Environment Isolation:** All secret keys (`AI_API_KEY`) reside exclusively in `.env` and are never serialized to the frontend or git.
