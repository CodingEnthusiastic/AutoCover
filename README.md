# AutoCover — Smart Vehicle Insurance Comparison & Management

**AutoCover** is an end-to-end car insurance aggregation, comparison, and policy lifecycle platform. A customer enters their vehicle registration number once; AutoCover aggregates quotes from four distinct simulated providers across heterogeneous data formats (JSON REST API, hydrated HTML, PDF rate card, and CSV export), standardizes disparate coverage terminology into canonical add-on concepts, ranks plans using a multi-dimensional value score, and provides policy issuance and automated renewal tracking.

---

## 1. Quick Start & Setup Instructions

Follow these step-by-step instructions to run the application on a fresh machine.

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** & **npm 9+** (Tested on Node v22)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/CodingEnthusiastic/AutoCover.git
cd AutoCover
```

---

### Step 2: Backend Setup & Database Initialization

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows:
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (defaults work out of the box with zero setup):
   ```bash
   cp .env.example .env
   ```
   *The database defaults to SQLite (`sqlite:///./autocover.db`), which automatically creates all tables and seeds demonstration data on initial startup. PostgreSQL can be used simply by setting `DATABASE_URL=postgresql://user:password@localhost:5432/autocover`.*

5. Run automated tests to verify your setup:
   ```bash
   python -m pytest -v
   ```
   Or run the standalone end-to-end verification script:
   ```bash
   python verify_system.py
   ```

6. Start the Backend API & Mock Providers server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   *The backend will be running at `http://localhost:8000` (API documentation available at `http://localhost:8000/docs`).*

---

### Step 3: Frontend Setup & Launch

1. In a second terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

*(Note: The backend also serves the pre-built React bundle directly from `http://localhost:8000/` if you prefer single-service execution!)*

---

## 2. System Architecture

```mermaid
flowchart TD
    User["Customer / Browser"] -->|"1. Enter Reg No. (e.g. WB 02 AB 1234)"| FE["React + TypeScript UI"]
    FE -->|"2. Vehicle Lookup & Verification"| API["FastAPI Backend"]
    API -->|"Lookup & Cache"| DB[("SQLite / PostgreSQL Database")]
    
    API -->|"Async Concurrent Aggregation"| Agg["Insurance Aggregator"]
    
    Agg -->|"HTTP GET (JSON)"| PA["Provider A Mock (Fast Quote API)"]
    Agg -->|"HTTP GET (HTML)"| PB["Provider B Mock (Hydrated DOM, ~1.5s delay)"]
    Agg -->|"HTTP GET (PDF)"| PC["Provider C Mock (Rate Card / Tariff Engine)"]
    Agg -->|"HTTP GET (CSV)"| PD["Provider D Mock (CSV Export, 503 Fault Injection)"]
    
    PA -->|"Raw Quotes"| Norm["Data Normalizer & Deduplicator"]
    PB -->|"Extracted DOM + Script State"| Norm
    PC -->|"Tariff Depreciation & CC Rules"| Norm
    PD -->|"Parsed Rows"| Norm
    
    Norm -->|"Standardize Terminology"| Gloss["Canonical Add-on Glossary"]
    Gloss -->|"Multi-factor Scoring"| Rank["Intelligent Ranking Engine"]
    Rank -->|"Unified Comparison Response"| FE
```

---

## 3. Data Source Investigation & Integration

Each provider represents insurance data through a fundamentally different format and transport mechanism:

| Provider | Ingested Format | Characteristics & Handling |
|---|---|---|
| **Provider A** | JSON API response (`provider_a.json`) | Contains active quotes, decline notices (e.g. `WB06CD5678` rejected for vehicle age > 10 yrs), and duplicate rows (e.g. index 1 and 2 for `WB02AB1234`). Add-ons are provided as uppercase codes (`ZERO_DEP`, `RSA`). Includes tax structures (`[{name: "GST", rate: 0.18}]`) or all-inclusive tags. |
| **Provider B** | HTML Webpage with JavaScript Hydration (`provider_b.html`) | Quotes are rendered in a static DOM shell with `<span class="price">Loading price…</span>` while real prices, Lakh-formatted covers (e.g. `"3.1 L"`), and validity dates are stored in an embedded script tag: `window.__QUOTE_DATA__ = {...}`. Parsed using regex and BeautifulSoup, accurately extracting IDV in Lakhs and breaking down inclusive 18% GST. Simulates a **slow provider** (~1.5s latency). |
| **Provider C** | Rate Card PDF (`provider_c.pdf`) | A published tariff document following the **India Motor Tariff**. Does not store static quotes; instead, provides deterministic underwriting formulas based on vehicle age depreciation (5% to 65%), engine CC third-party bands (₹2,094, ₹3,416, ₹7,897), model groups (Group 1, 2, 3), NCB discounts, and add-on percentages. Rejects vehicles older than 8 years. Evaluated dynamically relative to the reference date `2026-11-10`. |
| **Provider D** | CSV Quote Export (`provider_d.csv`) | Contains comma-separated values with dirty data: mixed registration formats, comma-formatted currency strings (`"11,670"`), mixed IDV notations (`"3.3 lakh"` vs `332000`), pipe-delimited add-ons (`Zero Dep|RSA`), duplicate records (`KL 07 DE 3030 Gold` appears twice), and expired quotes (`15/10/2026`). Simulates **intermittent 503 service downtime** with an in-app retry mechanism. |

---

## 4. Add-on Normalization & Insurer Research

Different insurers use proprietary marketing names for identical coverage concepts. To normalize these reliably, we researched the public add-on pages of **4 leading Indian general insurers**:

### Public Insurer Research Citations
1. **Acko General Insurance**  
   - Source: [https://www.acko.com/car-insurance/add-on-covers/](https://www.acko.com/car-insurance/add-on-covers/)  
   - Verified terms: *Zero Depreciation Cover*, *Roadside Assistance*, *Engine Protection Cover*, *Key Protect*, *Invoice Cover*, *Consumables Cover*.
2. **HDFC ERGO General Insurance**  
   - Source: [https://www.hdfcergo.com/car-insurance/add-on-covers](https://www.hdfcergo.com/car-insurance/add-on-covers)  
   - Verified terms: *Zero Depreciation*, *Emergency Assistance Cover / RSA*, *Engine & Gearbox Protector*, *Cost of Consumables*, *Return to Invoice*.
3. **Digit Insurance (Go Digit)**  
   - Source: [https://www.godigit.com/motor-insurance/car-insurance/add-ons](https://www.godigit.com/motor-insurance/car-insurance/add-ons)  
   - Verified terms: *Bumper-to-Bumper Cover (Zero Dep)*, *Breakdown Assistance*, *Engine & Gearbox Protection*, *Return to Invoice*.
4. **ICICI Lombard General Insurance**  
   - Source: [https://www.icicilombard.com/motor-insurance/car-insurance/add-on-covers](https://www.icicilombard.com/motor-insurance/car-insurance/add-on-covers)  
   - Verified terms: *Nil Depreciation*, *Roadside Assistance*, *Key Protect*, *Engine Protect Plus*.

### Canonical Mapping Matrix

| Canonical Code | Canonical Display Name | Provider A Term | Provider B Term | Provider C Term | Provider D Term |
|---|---|---|---|---|---|
| `ZERO_DEP` | **Zero Depreciation** | `ZERO_DEP` | `Bumper to Bumper` | `Nil Depreciation` | `Zero Dep` |
| `RSA` | **Roadside Assistance** | `RSA` | `24x7 Roadside Assistance` | `Roadside Assistance` | `RSA` |
| `ENGINE_PROTECT` | **Engine & Gearbox Protection** | — | `Engine & Gearbox Protection` | `Engine Protect` | `Engine Protect` |
| `RETURN_TO_INVOICE`| **Return to Invoice** | — | `Total Cover` | `Return to Invoice` | — |
| `CONSUMABLES` | **Consumables Cover** | — | — | `Consumables` | — |
| `KEY_REPLACEMENT`| **Key Replacement** | — | `Key Replacement` | — | — |

---

## 5. Value Scoring & Plan Ranking

Rather than assuming the cheapest plan is best, AutoCover computes a multi-dimensional **Value Score (0 to 100)**:
1. **Price Affordability (35 pts)**: Normalized position between minimum and maximum quoted market premiums.
2. **IDV Coverage Strength (30 pts)**: Ratio of insured declared value protected relative to market ex-showroom valuation.
3. **Add-on Protection Depth (30 pts)**: Weighted credit for essential covers:
   - Zero Depreciation: +12 pts
   - Engine & Gearbox Protection: +7 pts
   - Roadside Assistance: +5 pts
   - Return to Invoice: +4 pts
   - Consumables Cover: +2 pts
4. **Validity & Provider Reliability (5 pts)**: Active quote bonus.

### Smart Badging
- **`Best Value`**: Highest composite score balancing price and coverage depth.
- **`Lowest Price`**: Minimum net premium plan for budget-conscious drivers.
- **`Maximum Coverage`**: Plan offering the highest number of bundled add-ons and IDV.

---

## 6. Assumptions

1. **Reference Date**: Evaluated as **10 November 2026 (IST)** across all quote validity checks and policy expiry countdowns (configurable via `REFERENCE_DATE` environment variable).
2. **Goods and Services Tax (GST)**: Standard Indian motor insurance GST of **18%** is consistently calculated and displayed separately from net base premiums.
3. **Vehicle Registration Normalization**: Indian vehicle registration formats are leniently stripped of spaces, hyphens, and casing (e.g. `wb 02 ab 1234` $\rightarrow$ `WB02AB1234`).
4. **Vehicle Registry Fallback**: If a registration number is not found in `registry.json` (such as test cases `WB02AB9999` or `12345`), the system displays a draft vehicle card allowing the user to verify or enter specifications rather than hard-failing.
5. **Provider Rate Card Depreciation**: Provider C follows the India Motor Tariff half-up rounding to the nearest ₹1,000 for IDV and nearest ₹1 for premiums. Vehicles exceeding 8 years are formally marked as `DECLINED`.

---

## 7. Database Schema

Managed via SQLAlchemy ORM (`app/models.py`):

```sql
CREATE TABLE policies (
    id VARCHAR(36) PRIMARY KEY,
    policy_number VARCHAR(32) UNIQUE NOT NULL,
    registration_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    coverage_type VARCHAR(50) NOT NULL,
    idv INTEGER NOT NULL,
    base_premium FLOAT NOT NULL,
    gst_amount FLOAT NOT NULL,
    total_premium FLOAT NOT NULL,
    addons TEXT DEFAULT '[]',
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    variant VARCHAR(50),
    fuel_type VARCHAR(20),
    reminder_sent BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle_overrides (
    registration_number VARCHAR(20) PRIMARY KEY,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    variant VARCHAR(50),
    fuel_type VARCHAR(20),
    engine_cc INTEGER,
    registration_date VARCHAR(20),
    rto VARCHAR(50),
    ex_showroom_price INTEGER,
    current_policy_expiry VARCHAR(20),
    claims_last_year INTEGER DEFAULT 0,
    ncb_percent INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Test Suite Coverage

The test suite contains 14 automated tests covering parsers, rate card calculations, add-on normalization, API endpoints, and async aggregation:

```bash
cd backend
python -m pytest -v
```

Output:
```
tests/test_api.py::test_health PASSED
tests/test_api.py::test_vehicle_lookup_api PASSED
tests/test_api.py::test_glossary_api PASSED
tests/test_api.py::test_mock_endpoints PASSED
tests/test_api.py::test_policy_crud_and_reminder PASSED
tests/test_parsers.py::test_provider_a_parsing PASSED
tests/test_parsers.py::test_provider_b_parsing PASSED
tests/test_parsers.py::test_provider_d_parsing PASSED
tests/test_services.py::test_registration_normalization PASSED
tests/test_services.py::test_flexible_date_parsing PASSED
tests/test_services.py::test_vehicle_lookup PASSED
tests/test_services.py::test_addon_glossary_mapping PASSED
tests/test_services.py::test_provider_c_rate_card_logic PASSED
tests/test_aggregator.py::test_full_aggregation_flow PASSED
```

---

## 9. Test Customers to Try

Quick-pick buttons are available directly on the homepage UI:
- **`WB 02 AB 1234`** (Rahul Sen) — Maruti Swift VXi (Valid quotes across all 4 providers, expiring in 10 days).
- **`kl-07-de-3030`** (Priya Nair) — Maruti Swift ZXi (Tests Provider A expired quotes & Provider D deduplication).
- **`MH12 EF 4321`** (Arjun Mehta) — Tata Nexon Diesel (Full quotes across providers).
- **`wb06cd5678`** (Sanjay Gupta) — Hyundai i20 (>10 yrs old, demonstrating underwriting decline handling across Provider A, B, and C).
- **`DL 3C AB 0042`** (Fatima Khan) — Hyundai Creta (1 claim last year, NCB 0%, Provider D has 1 expired quote).
- **`WB02AB9999`** — Unregistered car (Demonstrates draft profile fallback & dynamic Provider C Rate Card quote generation).
