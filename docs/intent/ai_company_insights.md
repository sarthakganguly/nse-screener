# Confirmed Statement of Intent: AI Company Insights & Interactive Q&A

- **Outcome:** An AI Company Insights & Interactive Q&A system embedded into the stock dashboard that provides automated financial trend summaries and conversational answers for any selected NSE stock.
- **User:** Retail investors and equity researchers who want instant quantitative insights and historical context without manually calculating returns, drawdowns, or technical metrics.
- **Why now:** The 15-year TimescaleDB backfill engine and charting interface are already operational, making AI context injection the next logical milestone on the roadmap.
- **Success:** Selecting a synced stock generates an automated AI snapshot card (multi-year CAGR, max historical drawdown, trend regime, and volatility) and opens an interactive chat drawer capable of answering follow-up questions accurately in natural language.
- **Constraint:** Pluggable LLM backend (supporting OpenAI, Google Gemini, and Ollama via `.env`) with a built-in mock/demo fallback mode so the app runs out-of-the-box without requiring an API key; all financial arithmetic (CAGR, DMAs, drawdowns, volume shifts) computed deterministically server-side in Python to prevent LLM hallucinations.
- **Out of scope:** External news web-scraping, quarterly earnings transcript/PDF parsing, persistent multi-user chat databases, automated trading order placement, and SEBI-regulated buy/sell recommendations (research/educational only).
