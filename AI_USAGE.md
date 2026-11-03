# AI Usage Log (`AI_USAGE.md`)

This document records all AI coding tools, assistant workflows, and prompts used during the development of **AutoCover**, adhering to the assignment's transparency guidelines.

---

## 1. Tools Used
- **Antigravity (Powered by Google Gemini 3.8 Flash)**: Used for rapid architecture scaffolding, multi-file inspection, test synthesis, and TypeScript interface definition.
- **Python 3.12 / Pytest / FastAPI**: Native backend execution and verification.
- **Node.js / Vite / Tailwind CSS**: Frontend UI development and bundling.

---

## 2. Prompts and Execution Sequence

### Prompt 1: Initial Investigation and Architecture Setup
* **Prompt:**
  > "Investigate `registry.json`, `provider_a.json`, `provider_b.html`, `provider_c.pdf`, `provider_d.csv`, and `test_customers.json`. Formulate an end-to-end plan to parse disparate formats, extract rates and rules, normalize add-ons using public insurer research, build mock services with latency and fault tolerance, and structure a React + FastAPI platform."
* **What was generated:**
  - Initial analysis of the 4 formats (JSON, hydrated HTML, PDF rate card, CSV).
  - Identification of duplicates in Provider A and Provider D.
  - Identification of expired quotes relative to reference date `2026-11-10`.
* **What was changed/fixed:**
  - The model initially considered using an external browser automation library for `provider_b.html`. We replaced this with a lightweight, deterministic server-side regex & BeautifulSoup parser that extracts the hydration dictionary `window.__QUOTE_DATA__` directly from the HTML script tag, avoiding heavy headless browser overhead.

---

### Prompt 2: Provider C Rate Card Mathematical Engine
* **Prompt:**
  > "Extract the full text and rules from `provider_c.pdf`. Implement the mathematical model for India Motor Tariff depreciation schedules, model group tiers, Own Damage rates, NCB discounts, Third-Party tariffs by CC, add-on costs (Nil Dep, RSA, Consumables), and vehicle eligibility limits."
* **What was generated:**
  - Python logic for computing vehicle age in days and years relative to `2026-11-10`.
  - Half-up rounding helper to match IRDAI motor tariff standards.
  - Plan generator for `C-Standard` and `C-Shield`.
* **What was changed/fixed:**
  - Ensured vehicles older than 8 years (`> 8 years`) return `DECLINED` status with a clear explanation, rather than throwing an unhandled exception or returning zeroed premiums.
  - Ensured `C-Shield` is offered only for vehicles up to 5 years of age as mandated by the rate card.

---

### Prompt 3: Add-on Glossary and Public Insurer Research
* **Prompt:**
  > "Research the public car insurance add-on pages of leading Indian insurers (Acko, HDFC ERGO, Digit, ICICI Lombard). Create a canonical mapping dictionary for add-ons (Zero Dep, RSA, Engine Protect, Consumables, Return to Invoice, Key Replacement) mapping each provider's terminology."
* **What was generated:**
  - Add-on glossary mapping module with regex aliases and citation metadata.
* **What was changed/fixed:**
  - Standardized deduplication of add-ons so that when a plan contains redundant tags (e.g. `Bumper to Bumper` and `Zero Dep`), only one canonical `Zero Depreciation` item is produced.

---

### Prompt 4: Mock Service Endpoints, Fault Tolerance & Resilient Aggregator
* **Prompt:**
  > "Create mock endpoints simulating the 4 external providers. Provider B must simulate latency (~1.5s). Provider D must simulate intermittent 503 gateway timeouts. The aggregator must query providers concurrently using asyncio and httpx, and provide isolated error boundaries so that failure of one provider does not crash the comparison."
* **What was generated:**
  - FastAPI mock endpoints and `InsuranceAggregator` class.
* **What was changed/fixed:**
  - In unit tests where the server was not bound to a port, `httpx` threw connection errors. Added an internal resilient fallback to the mock handlers so tests can run in-process as well as over real network ports.

---

### Prompt 5: React + TypeScript UI and Policy Management
* **Prompt:**
  > "Build a modern, responsive React + TypeScript frontend with Tailwind CSS. Include: vehicle lookup with quick-pick test customers, RC verification card with edit modal, real-time provider progress bar, filter and sort drawer, multi-plan comparison modal, plan checkout modal, policy dashboard with 15-day expiry warnings, and simulated renewal alerts."
* **What was generated:**
  - Complete component hierarchy in `frontend/src/components/`.
* **What was changed/fixed:**
  - Fixed Vite build configuration and Windows EPERM file handling.
  - Configured FastAPI in `backend/main.py` to optionally serve the built React bundle at `http://localhost:8000/`, enabling evaluators to run the entire application with a single command.

---

## 3. Engineering Accountability
All generated code was reviewed, debugged, and tested against real data files and automated unit/integration suites. All mathematical formulas, tariffs, and normalization rules correspond directly to the rate cards and public insurer documentation.
