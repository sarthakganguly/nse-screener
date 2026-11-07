# NSE PRO Documentation Hub

Welcome to the central documentation index for **NSE PRO - AI Company Insights**. This directory contains the complete product, architecture, specification, QA, compliance, and user story documentation for the platform.

---

## 📚 Documentation Directory Structure

```
docs/
├── README.md                                # Master documentation index (This file)
│
├── intent/
│   └── ai_company_insights.md               # Confirmed Statement of Intent (Outcome, User, Bounds)
│
├── prd/
│   └── PRD-ai-company-insights.md           # Engineering-ready Product Requirement Document (PRD)
│
├── spec/
│   └── SPEC-ai-company-insights.md          # Technical Specification & Code Contracts
│
├── architecture/
│   └── system-design.md                     # System architecture, data flow, & provider adapter design
│
├── api/
│   └── ai-insights-api.md                   # REST API documentation & curl examples
│
├── qa/
│   └── test-matrix-and-scenarios.md         # 5-Category QA test matrix, edge cases, & fixtures
│
├── compliance/
│   └── sebi-regulatory-framework.md         # SEBI compliance baseline & non-advisory guardrails
│
└── backlog/
    └── user-stories.md                      # INVEST user stories (US-101 to US-105) & Gherkin criteria
```

---

## 🧭 Navigation by Role

### For Product Managers & Stakeholders
- **[Statement of Intent](intent/ai_company_insights.md):** High-level goals, target users, binding constraints, and out-of-scope boundaries.
- **[Product Requirement Document (PRD)](prd/PRD-ai-company-insights.md):** Comprehensive feature requirements, KPIs, deterministic formulas, and state machines.
- **[Agile User Stories](backlog/user-stories.md):** Sprint-ready INVEST stories with Gherkin acceptance criteria.

### For Software Engineers
- **[Technical Specification](spec/SPEC-ai-company-insights.md):** Project structure, build/test commands, code conventions, and execution boundaries.
- **[System Design & Architecture](architecture/system-design.md):** In-depth architecture covering TimescaleDB hypertable aggregation, the deterministic feature engine, and pluggable LLM provider abstractions.
- **[API Reference](api/ai-insights-api.md):** Complete HTTP request/response schemas, error status codes, and usage examples.

### For QA Engineers & Testers
- **[QA Test Matrix & Scenarios](qa/test-matrix-and-scenarios.md):** Exhaustive test catalog covering Positive, Negative, Boundary, Network Timeout/Fallback, and Compliance scenarios.

### For Legal & Compliance Officers
- **[SEBI Regulatory Framework](compliance/sebi-regulatory-framework.md):** Alignment with SEBI (Research Analysts) Regulations 2014 & SEBI (Investment Advisers) Regulations 2013, disclaimer mandates, and automated refusal interceptors.

---

## ⚡ Quick Architecture Overview

```
                                  ┌───────────────────────────────┐
                                  │      React 18 Frontend        │
                                  │  - Stock Header & Live Quote  │
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
