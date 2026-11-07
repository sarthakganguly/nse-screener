# SEBI Compliance Framework & Non-Advisory Guardrail Policy

## 1. Regulatory Context

In India, financial advice and research reports are governed by the Securities and Exchange Board of India (SEBI) under:
1. **SEBI (Research Analysts) Regulations, 2014:** Regulates the preparation and publication of research reports and recommendations.
2. **SEBI (Investment Advisers) Regulations, 2013:** Regulates entities providing financial planning and buy/sell advice for remuneration.

**NSE PRO is an educational and analytical research software tool**, not a SEBI-registered Investment Adviser (RIA) or Research Analyst (RA). Therefore, the system must enforce technical safeguards to prevent providing unsolicited investment advice.

---

## 2. Core Compliance Directives

### Directive 1: Mandatory Persistent Disclaimer
Every automated insight card, chat response, and export must display the standardized disclaimer:

> **"Educational & Research Analytics Only. Not SEBI-registered investment advice. No buy/sell/hold recommendations."**

### Directive 2: Automated Buy/Sell Query Interceptor
The backend must run a deterministic prompt guardrail before dispatching queries to any LLM. If the query pattern suggests investment advice, the system must reject the request.

#### Monitored Query Patterns
- `\b(should i buy|can i buy|shall i buy|good time to buy)\b`
- `\b(should i sell|can i sell|shall i sell|exit now)\b`
- `\b(target price|price target|stop loss level)\b`
- `\b(multibagger|sure shot|guaranteed return)\b`

#### Standard Refusal Message
> "NSE PRO provides quantitative historical research analytics only and cannot offer buy, sell, or target price recommendations under SEBI regulations. Please consult a SEBI-registered investment adviser for personal financial planning."

---

## 3. Data Grounding & Factual Integrity
- The AI system prompt forbids speculation, financial forecast projection without historical basis, or promises of returns.
- All numbers cited by the AI must map 1:1 to the server-calculated quantitative profile derived from TimescaleDB hypertable data.
