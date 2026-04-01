# Client Documentation Design Spec

## Goal

Create client-facing documentation for external developers integrating with the Car-Point gRPC API. The docs should enable a developer to understand the service, connect to it, call it, and interpret the results — without needing access to the source code.

## Audience

External developers building applications that consume the Car-Point gRPC service (e.g., frontends, other microservices).

## Language

English.

## Structure

Four files total:

1. `README.md` (project root — replaces existing generic NestJS README)
2. `docs/api-reference.md`
3. `docs/scoring-guide.md`
4. `docs/pricing-guide.md`

---

## File 1: README.md

**Purpose:** First thing a client sees. Quick overview, what the service does, and links to detailed docs.

**Contents:**

- **Project name and one-line description:** "Car-Point: A gRPC microservice that evaluates used cars with a quality score (1-100) and market price analysis."
- **Key features:** Bullet list — quality scoring, price comparison, score breakdown, market-based pricing.
- **Quick example:** A sample gRPC request and response showing a realistic car evaluation. Demonstrates what fields go in and what comes back.
- **Documentation links:** Links to the 3 docs pages (api-reference, scoring-guide, pricing-guide).
- **Tech stack:** NestJS, gRPC, MongoDB, TypeScript.

**Tone:** Concise, scannable. A developer should understand what Car-Point does within 30 seconds.

---

## File 2: docs/api-reference.md

**Purpose:** Everything a developer needs to connect to the service and call it correctly.

**Contents:**

- **Connecting to the service:** gRPC endpoint address, proto file location, package name (`car_point`), service name (`CarPointService`), RPC method name (`GetCarPoint`).
- **Proto definition:** Full or key portions of `car-point.proto` so clients can generate stubs in their language of choice.
- **Request fields table:** Each field with name, type, required/optional, description, and example value. Fields:
  - `brand` (string, required) — e.g., "Toyota"
  - `model` (string, required) — e.g., "Corolla"
  - `year` (int32, required) — e.g., 2020
  - `body_type` (string, optional) — e.g., "sedan"
  - `color` (string, optional) — e.g., "blue"
  - `engine` (string, required) — "petrol", "diesel", "hybrid", "LPG"
  - `mileage` (int32, required) — in kilometers, e.g., 50000
  - `transmission` (string, required) — "automatic", "semi-automatic", "manual"
  - `drive` (string, required) — "AWD", "FWD", "RWD"
  - `is_new` (bool, required) — true for brand-new cars
  - `number_of_seats` (int32, optional)
  - `condition` (string, required) — "excellent", "good", "fair", "poor"
  - `market` (string, optional)
  - `city` (string, optional)
  - `price` (double, required) — listed/asking price
- **Response fields:**
  - `quality_score` (int32) — 1 to 100
  - `quality_status` (enum QualityStatus) — EXCELLENT, GOOD, or POOR
  - `price` (PriceInfo object) — contains `listed`, `average`, `deviation`, `price_status`
  - `score_breakdown` (ScoreBreakdown object) — contains individual component scores
- **Enums:**
  - `QualityStatus`: GOOD (0), POOR (1), EXCELLENT (2) — with threshold explanation (71+, 41-70, <41)
  - `PriceStatus`: FAIR_PRICE (0), GREAT_DEAL (1), OVERPRICED (2) — with deviation thresholds (-15%, +15%)
- **Code example:** Node.js example using `@grpc/grpc-js` showing how to load the proto, create a client, and call `GetCarPoint`.
- **Edge cases:**
  - No market data: `average` is null, `deviation` is 0, `price_status` defaults to FAIR_PRICE.
  - New cars (`is_new: true`): Mileage, age, and condition scores automatically get maximum values.

---

## File 3: docs/scoring-guide.md

**Purpose:** Explain how the 100-point quality score is calculated so clients can understand and present results to their users.

**Contents:**

- **Overview:** Total score is 1-100, composed of 8 weighted components. Higher score = better quality car.
- **Score components summary table:**

  | Component | Max Points | Weight |
  |-----------|-----------|--------|
  | Mileage | 25 | 25% |
  | Reliability | 20 | 20% |
  | Age | 15 | 15% |
  | Condition | 15 | 15% |
  | Depreciation | 10 | 10% |
  | Transmission | 5 | 5% |
  | Drive | 5 | 5% |
  | Engine | 5 | 5% |

- **Detailed breakdown per component:**
  - **Mileage (0-25 pts):** Based on km/year efficiency. Formula: `kmPerYear = mileage / (currentYear - year)`. Scores: <=10k km/year = 25 pts, >=40k km/year = 0 pts, linear interpolation between.
  - **Reliability (0-20 pts):** Database lookup by brand+model. Tier system: S (20 pts), A (16), B (12), C (8), D (4). Falls back to brand-only lookup, then D-tier default.
  - **Age (0-15 pts):** Formula: `15 - (age * 0.75)`. New car (age 0) = 15 pts. 20+ years = 0 pts.
  - **Condition (0-15 pts):** Lookup: excellent (15), good (10), fair (5), poor (1).
  - **Depreciation (0-10 pts):** Based on value retention percentage from market data. Tiers: >=70% retention = 10 pts, 55-70% = 7, 40-55% = 4, <40% = 2.
  - **Transmission (0-5 pts):** automatic (5), semi-automatic (3), manual (1).
  - **Drive (0-5 pts):** AWD (5), FWD (3), RWD (1).
  - **Engine (0-5 pts):** hybrid (5), diesel (4), petrol (3), LPG (1).

- **New car special handling:** When `is_new` is true, mileage score = 25, age score = 15, condition score = 15 automatically.
- **Quality status thresholds:**
  - EXCELLENT: score >= 71
  - GOOD: score 41-70
  - POOR: score < 41
- **Example walkthrough:** Take a 2020 Toyota Corolla with 45,000 km, good condition, automatic, FWD, petrol, priced at 20,000 AZN. Show each component's score calculation step by step, arriving at the final score and quality status.

---

## File 4: docs/pricing-guide.md

**Purpose:** Explain how market price analysis works so clients understand the pricing fields in the response.

**Contents:**

- **Overview:** Car-Point compares a car's listed price against market data from 50,000+ turbo.az marketplace records to determine if it's fairly priced.
- **How average price is calculated:**
  - Primary match: brand + model + exact year.
  - Fallback: brand + model + year +/-3 years (if exact year has no data).
  - Uses MongoDB aggregation to compute the mean price across matching records.
- **Deviation formula:** `deviation = ((listedPrice - average) / average) * 100`, rounded to 2 decimal places. Positive deviation means listed above market; negative means below.
- **Price status classification:**

  | Status | Condition | Meaning |
  |--------|-----------|---------|
  | GREAT_DEAL | deviation < -15% | Listed well below market average |
  | FAIR_PRICE | -15% <= deviation <= +15% | Listed around market average |
  | OVERPRICED | deviation > +15% | Listed well above market average |

- **No data scenario:** When no matching cars exist in the database, `average` is null, `deviation` is 0, and `price_status` defaults to FAIR_PRICE. Clients should handle this case (e.g., display "No market data available" instead of showing a meaningless comparison).
- **Example:** A car listed at 15,000 AZN with a market average of 18,000 AZN. Deviation = ((15000 - 18000) / 18000) * 100 = -16.67%. Since -16.67% < -15%, the status is GREAT_DEAL.

---

## Out of Scope

- Local setup / development instructions (this is a consumer guide, not a contributor guide)
- Deployment documentation
- Auto-generated docs tooling (Buf, Swagger, etc.)
- Non-English translations
- Interactive API playground
