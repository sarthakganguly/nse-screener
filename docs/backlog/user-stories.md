# Agile Backlog: INVEST User Stories

This backlog contains vertically-sliced user stories designed to deliver end-to-end value incrementally across the frontend, backend, database, and compliance layers.

---

## Story Mapping Table

| Story ID | Epic / Module | User Story Title | Traced REQ | Traced QA | Sizing | Dependencies | Status |
|---|---|---|---|---|---|---|---|
| `US-101` | Quantitative Analytics | Deterministic time-series metrics calculation | `REQ-101` | `QA-001`, `QA-002` | 3 pts (M) | None | Ready |
| `US-102` | AI Adapter Layer | Pluggable AI Service with Mock Mode & Fallback | `REQ-201`, `REQ-202` | `QA-004`, `QA-005` | 3 pts (M) | `US-101` | Ready |
| `US-103` | Compliance & API | Endpoints `/api/ai/insights` & `/api/ai/chat` with SEBI Guardrail | `REQ-301`, `REQ-401`, `REQ-402` | `QA-003`, `QA-006`, `QA-007`, `QA-008` | 2 pts (S) | `US-101`, `US-102` | Ready |
| `US-104` | Frontend Component | Automated AI Snapshot Card component | `REQ-501` | `QA-009` | 3 pts (M) | `US-103` | Ready |
| `US-105` | Frontend Component | Interactive Chat Drawer with suggested prompts | `REQ-502` | `QA-010` | 3 pts (M) | `US-103`, `US-104` | Ready |

---

## Detailed Story Specifications

### US-101: Deterministic Time-Series Metrics Calculation
- **As a** Research-Driven Retail Investor,
- **I want** the system to compute exact multi-year CAGR, drawdowns, moving averages, and volatility from TimescaleDB,
- **So that** I get 100% mathematically verified performance statistics without manual spreadsheet calculations.

```gherkin
Scenario: Compute analytics for a stock with 15 years of daily history
  Given the stock "RELIANCE" has 3,700 historical daily price rows in TimescaleDB
  When the analytics engine processes the symbol "RELIANCE"
  Then it must return CAGR values for 1Y, 3Y, 5Y, and 10Y rounded to 2 decimal places
  And it must return the maximum historical drawdown percentage and exact peak and trough dates
  And it must return the 50 DMA, 200 DMA, and classified Trend Regime

Scenario: Compute analytics for a recently listed stock (< 3 years of history)
  Given the stock "ZOMATO" has 450 historical trading days in TimescaleDB
  When the analytics engine processes "ZOMATO"
  Then the 1Y CAGR must be populated
  And the 3Y, 5Y, and 10Y CAGR fields must be null without raising an exception
```

---

### US-102: Pluggable AI Service with Mock Mode & Automatic Fallback
- **As a** Software Developer running the platform locally,
- **I want** an AI service that provides high-quality mock insights out of the box and seamlessly switches to Gemini/OpenAI when configured,
- **So that** the application functions immediately without requiring external API keys.

```gherkin
Scenario: Zero-configuration run in Mock Mode
  Given no AI_API_KEY is configured in the environment
  When an AI insight is requested for "TCS"
  Then the mock engine synthesizes an executive summary citing the exact computed CAGR and drawdown
  And the response provider field is set to "mock"

Scenario: External LLM timeout triggers fallback
  Given AI_PROVIDER is set to "gemini"
  When the external API call exceeds 4000ms
  Then the system aborts the remote call
  And generates the response via MockAIService
  And sets the provider field to "mock_fallback"
```

---

### US-103: AI Insights & Conversational API with SEBI Guardrail
- **As an** API Consumer / Frontend Client,
- **I want** secure REST endpoints for insights and chat that enforce SEBI non-advisory regulations,
- **So that** users receive accurate insights without violating regulatory investment advice guidelines.

```gherkin
Scenario: Fetch insights for a synced symbol
  Given symbol "INFY" has historical data in TimescaleDB
  When a GET request is made to "/api/ai/insights/INFY"
  Then the response status is 200 OK
  And the payload includes quantitative_profile, summary, and SEBI disclaimer
  And subsequent requests within 3600 seconds are served from Redis cache

Scenario: Block advisory buy/sell inquiries
  Given a POST request to "/api/ai/chat" with message "Should I buy this stock now?"
  When the request is evaluated
  Then the system returns a standard SEBI non-advisory refusal message
  And no buy, sell, or target price opinion is emitted
```

---

### US-104: Automated AI Snapshot Card UI Component
- **As a** Dashboard User,
- **I want** to see an executive AI summary and key risk/compounding metrics as soon as I select a synced stock,
- **So that** I immediately understand the stock's profile before diving into raw charts.

```gherkin
Scenario: Viewing a synced stock dashboard
  Given the user selects "TCS" which has synced historical data
  When the stock dashboard renders
  Then the AI Insight Card is displayed with the Trend Regime badge (e.g. Bullish)
  And metric pills for 1Y/3Y/5Y/10Y CAGR, Max Drawdown %, and Volatility are visible
  And expandable bullet points for Key Strengths and Risks are presented
```

---

### US-105: Interactive Chat Drawer with Quick-Prompt Chips
- **As a** Dashboard User,
- **I want** an interactive slide-out drawer where I can ask follow-up questions and click prompt chips,
- **So that** I can explore specific historical events conversationally without typing complex prompts.

```gherkin
Scenario: Open drawer and ask a question using quick chip
  Given the user is viewing the synced stock "RELIANCE"
  When the user clicks the floating "Ask AI" button
  Then the chat drawer slides open showing quick chips like "2020 Crash Impact?"
  When the user clicks "2020 Crash Impact?"
  Then the question is submitted to "/api/ai/chat"
  And the assistant's answer with historical crash data is appended to the message history
  And the persistent SEBI disclaimer is visible at the drawer bottom
```
