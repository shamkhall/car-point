# Client Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create client-facing documentation so external developers can integrate with the Car-Point gRPC API.

**Architecture:** Four documentation files — a concise README.md linking to three detailed guides in `docs/`: API reference, scoring guide, and pricing guide.

**Tech Stack:** Markdown documentation only. No code changes.

**Spec:** `docs/superpowers/specs/2026-04-01-client-documentation-design.md`

---

### File structure

- Overwrite: `README.md` (replace generic NestJS template)
- Create: `docs/api-reference.md`
- Create: `docs/scoring-guide.md`
- Create: `docs/pricing-guide.md`

---

### Task 1: Write README.md

**Files:**
- Overwrite: `README.md`

- [ ] **Step 1: Replace README.md with project-specific content**

Write the following content to `README.md`:

```markdown
# Car-Point

A gRPC microservice that evaluates used cars with a quality score (1-100) and market price analysis, powered by 50,000+ marketplace records from turbo.az.

## Features

- **Quality Scoring** — rates cars on a 1-100 scale based on 8 weighted components (mileage efficiency, reliability, age, condition, depreciation resilience, transmission, drivetrain, engine type)
- **Price Comparison** — compares listed price against market averages and classifies as Great Deal, Fair Price, or Overpriced
- **Score Breakdown** — returns individual component scores so clients can show users exactly why a car scored the way it did

## Quick Example

**Request:**

```json
{
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "body_type": "sedan",
  "color": "white",
  "engine": "petrol",
  "mileage": 45000,
  "transmission": "automatic",
  "drive": "FWD",
  "is_new": false,
  "number_of_seats": 5,
  "condition": "good",
  "market": "turbo.az",
  "city": "Baku",
  "price": 15000
}
```

**Response:**

```json
{
  "quality_score": 72,
  "quality_status": "EXCELLENT",
  "price": {
    "listed": 15000,
    "average": 18000,
    "deviation": -16.67,
    "price_status": "GREAT_DEAL"
  },
  "score_breakdown": {
    "mileage_score": 21,
    "age_score": 11,
    "reliability_score": 16,
    "condition_score": 10,
    "depreciation_score": 10,
    "transmission_score": 5,
    "drive_score": 3,
    "engine_score": 3
  }
}
```

## Documentation

- [API Reference](docs/api-reference.md) — how to connect, request/response fields, code examples
- [Scoring Guide](docs/scoring-guide.md) — how the 100-point quality score is calculated
- [Pricing Guide](docs/pricing-guide.md) — how market price analysis works

## Tech Stack

NestJS | gRPC | MongoDB | TypeScript
```

**Note on nested code fences:** The README contains JSON code blocks inside the markdown. When writing this file, use standard triple-backtick fencing for the JSON blocks. The outer code fence in this plan is just for display.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: replace generic NestJS README with project-specific content"
```

---

### Task 2: Write docs/api-reference.md

**Files:**
- Create: `docs/api-reference.md`

- [ ] **Step 1: Write the API reference document**

Write the following content to `docs/api-reference.md`:

```markdown
# API Reference

## Connecting to the Service

Car-Point uses gRPC for communication. To connect, you need:

| Property | Value |
|----------|-------|
| **Proto file** | `proto/car-point.proto` |
| **Package** | `carpoint` |
| **Service** | `CarPointService` |
| **RPC Method** | `GetCarPoint` |
| **Default address** | `0.0.0.0:5000` |

## Proto Definition

```protobuf
syntax = "proto3";

package carpoint;

service CarPointService {
  rpc GetCarPoint (CarPointRequest) returns (CarPointResponse);
}

message CarPointRequest {
  string brand = 1;
  string model = 2;
  int32 year = 3;
  string body_type = 4;
  string color = 5;
  string engine = 6;
  int32 mileage = 7;
  string transmission = 8;
  string drive = 9;
  bool is_new = 10;
  int32 number_of_seats = 11;
  string condition = 12;
  string market = 13;
  string city = 14;
  double price = 15;
}

message CarPointResponse {
  int32 quality_score = 1;
  QualityStatus quality_status = 2;
  PriceInfo price = 3;
  ScoreBreakdown score_breakdown = 4;
}

enum QualityStatus {
  GOOD = 0;
  POOR = 1;
  EXCELLENT = 2;
}

enum PriceStatus {
  FAIR_PRICE = 0;
  GREAT_DEAL = 1;
  OVERPRICED = 2;
}

message PriceInfo {
  double listed = 1;
  double average = 2;
  double deviation = 3;
  PriceStatus price_status = 4;
}

message ScoreBreakdown {
  int32 mileage_score = 1;
  int32 age_score = 2;
  int32 reliability_score = 3;
  int32 condition_score = 4;
  int32 depreciation_score = 5;
  int32 transmission_score = 6;
  int32 drive_score = 7;
  int32 engine_score = 8;
}
```

## Request Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `brand` | string | Yes | Car manufacturer | `"Toyota"` |
| `model` | string | Yes | Car model name | `"Corolla"` |
| `year` | int32 | Yes | Manufacturing year | `2020` |
| `body_type` | string | No | Body style | `"sedan"` |
| `color` | string | No | Exterior color | `"white"` |
| `engine` | string | Yes | Fuel type: `"petrol"`, `"diesel"`, `"hybrid"`, `"LPG"` | `"petrol"` |
| `mileage` | int32 | Yes | Total kilometers driven | `45000` |
| `transmission` | string | Yes | `"automatic"`, `"semi-automatic"`, `"manual"` | `"automatic"` |
| `drive` | string | Yes | Drivetrain: `"AWD"`, `"FWD"`, `"RWD"` | `"FWD"` |
| `is_new` | bool | Yes | `true` for brand-new cars | `false` |
| `number_of_seats` | int32 | No | Seat count | `5` |
| `condition` | string | Yes | `"excellent"`, `"good"`, `"fair"`, `"poor"` | `"good"` |
| `market` | string | No | Marketplace name | `"turbo.az"` |
| `city` | string | No | City of listing | `"Baku"` |
| `price` | double | Yes | Listed/asking price | `15000` |

## Response Fields

### Top-level

| Field | Type | Description |
|-------|------|-------------|
| `quality_score` | int32 | Overall quality score from 1 to 100 |
| `quality_status` | QualityStatus | Categorical rating based on score |
| `price` | PriceInfo | Market price comparison |
| `score_breakdown` | ScoreBreakdown | Individual component scores |

### QualityStatus Enum

| Value | Name | Meaning |
|-------|------|---------|
| 0 | `GOOD` | Score 41-70 |
| 1 | `POOR` | Score below 41 |
| 2 | `EXCELLENT` | Score 71 or above |

### PriceInfo

| Field | Type | Description |
|-------|------|-------------|
| `listed` | double | The input asking price |
| `average` | double | Market average price (null if no market data) |
| `deviation` | double | Percentage deviation from average |
| `price_status` | PriceStatus | Categorical price assessment |

### PriceStatus Enum

| Value | Name | Condition | Meaning |
|-------|------|-----------|---------|
| 0 | `FAIR_PRICE` | -15% to +15% deviation | Priced around market average |
| 1 | `GREAT_DEAL` | Below -15% deviation | Priced well below market |
| 2 | `OVERPRICED` | Above +15% deviation | Priced well above market |

### ScoreBreakdown

| Field | Type | Max Points | Description |
|-------|------|-----------|-------------|
| `mileage_score` | int32 | 25 | Kilometers-per-year efficiency |
| `age_score` | int32 | 15 | Year-based depreciation |
| `reliability_score` | int32 | 20 | Brand/model reliability tier |
| `condition_score` | int32 | 15 | Physical condition rating |
| `depreciation_score` | int32 | 10 | Market value retention |
| `transmission_score` | int32 | 5 | Transmission type preference |
| `drive_score` | int32 | 5 | Drivetrain preference |
| `engine_score` | int32 | 5 | Engine/fuel type preference |

## Code Example (Node.js)

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load the proto file
const packageDef = protoLoader.loadSync('proto/car-point.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).carpoint;

// Create client
const client = new proto.CarPointService(
  'localhost:5000',
  grpc.credentials.createInsecure(),
);

// Call the service
client.GetCarPoint(
  {
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    body_type: 'sedan',
    color: 'white',
    engine: 'petrol',
    mileage: 45000,
    transmission: 'automatic',
    drive: 'FWD',
    is_new: false,
    number_of_seats: 5,
    condition: 'good',
    market: 'turbo.az',
    city: 'Baku',
    price: 15000,
  },
  (error, response) => {
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    console.log('Quality Score:', response.quality_score);
    console.log('Quality Status:', response.quality_status);
    console.log('Price Info:', response.price);
    console.log('Score Breakdown:', response.score_breakdown);
  },
);
```

## Edge Cases

### No market data available

When no matching cars exist in the database for the given brand/model/year combination (including the +/-3 year fallback), the response returns:

```json
{
  "price": {
    "listed": 15000,
    "average": null,
    "deviation": 0,
    "price_status": "FAIR_PRICE"
  }
}
```

Clients should check for `average === null` and display an appropriate message (e.g., "No market data available for this car") rather than showing a meaningless price comparison.

### New cars

When `is_new` is `true`, the following scores are automatically set to their maximum values regardless of the other input fields:

- `mileage_score` = 25
- `age_score` = 15
- `condition_score` = 15
```

- [ ] **Step 2: Commit**

```bash
git add docs/api-reference.md
git commit -m "docs: add API reference guide"
```

---

### Task 3: Write docs/scoring-guide.md

**Files:**
- Create: `docs/scoring-guide.md`

- [ ] **Step 1: Write the scoring guide document**

Write the following content to `docs/scoring-guide.md`:

```markdown
# Scoring Guide

Car-Point evaluates used cars with a quality score from 1 to 100. The score is composed of 8 weighted components, each measuring a different aspect of the car's value.

## Score Components

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
| **Total** | **100** | **100%** |

## Component Details

### Mileage (0-25 points)

Measures driving efficiency as kilometers per year, rewarding cars that have been driven less relative to their age.

**Formula:**
- `kmPerYear = mileage / (currentYear - year)`

**Scoring:**

| km/year | Score |
|---------|-------|
| 10,000 or less | 25 (maximum) |
| 10,001 - 39,999 | Linear interpolation: `25 - ((kmPerYear - 10000) / 30000) * 25` |
| 40,000 or more | 0 |

### Reliability (0-20 points)

Based on the car's brand and model reliability rating, sourced from industry reliability test data. Each brand/model is assigned a tier from S (best) to D (worst).

| Tier | Score | Meaning |
|------|-------|---------|
| S | 20 | Exceptional reliability |
| A | 16 | Above average |
| B | 12 | Average |
| C | 8 | Below average |
| D | 4 | Poor reliability (also the default if brand is not in the database) |

The system first looks up the specific brand+model combination. If not found, it falls back to the brand-level tier. If the brand isn't in the database at all, it defaults to D-tier (4 points).

### Age (0-15 points)

Newer cars score higher. Score decreases linearly with age.

**Formula:**
- `ageScore = 15 - (age * 0.75)` where `age = currentYear - year`

| Age | Score |
|-----|-------|
| 0 (new) | 15 |
| 5 years | 11.25 |
| 10 years | 7.5 |
| 15 years | 3.75 |
| 20+ years | 0 |

### Condition (0-15 points)

Based on the reported physical condition of the car.

| Condition | Score |
|-----------|-------|
| Excellent | 15 |
| Good | 10 |
| Fair | 5 |
| Poor | 1 |

### Depreciation (0-10 points)

Measures how well the car retains its value over time, based on market resale data.

| Value Retention | Score |
|----------------|-------|
| 70% or more | 10 |
| 55% - 69% | 7 |
| 40% - 54% | 4 |
| Below 40% | 2 |

### Transmission (0-5 points)

| Transmission | Score |
|-------------|-------|
| Automatic | 5 |
| Semi-automatic | 3 |
| Manual | 1 |

### Drive (0-5 points)

| Drivetrain | Score |
|-----------|-------|
| AWD (All-wheel drive) | 5 |
| FWD (Front-wheel drive) | 3 |
| RWD (Rear-wheel drive) | 1 |

### Engine (0-5 points)

| Engine/Fuel Type | Score |
|-----------------|-------|
| Hybrid | 5 |
| Diesel | 4 |
| Petrol | 3 |
| LPG | 1 |

## New Cars

When `is_new` is `true`, three components are automatically set to their maximum:

- Mileage: 25 points
- Age: 15 points
- Condition: 15 points

The remaining 5 components (reliability, depreciation, transmission, drive, engine) are still calculated normally.

## Quality Status

The final score maps to one of three quality tiers:

| Status | Score Range | Meaning |
|--------|-----------|---------|
| **EXCELLENT** | 71 - 100 | High quality car |
| **GOOD** | 41 - 70 | Average quality |
| **POOR** | 1 - 40 | Below average quality |

## Example Walkthrough

**Car:** 2020 Toyota Corolla, 45,000 km, good condition, automatic, FWD, petrol

**Step-by-step calculation:**

1. **Mileage:** `kmPerYear = 45000 / (2026 - 2020) = 7500`. Since 7500 < 10000 → **25 points**
2. **Reliability:** Toyota Corolla is tier A → **16 points**
3. **Age:** `age = 2026 - 2020 = 6`, `15 - (6 * 0.75) = 10.5` → **10.5 points**
4. **Condition:** Good → **10 points**
5. **Depreciation:** Toyota Corolla retains ~75% value → **10 points**
6. **Transmission:** Automatic → **5 points**
7. **Drive:** FWD → **3 points**
8. **Engine:** Petrol → **3 points**

**Total:** 25 + 16 + 10.5 + 10 + 10 + 5 + 3 + 3 = **72.5 → 73** (rounded)

**Quality Status:** 73 >= 71 → **EXCELLENT**
```

- [ ] **Step 2: Commit**

```bash
git add docs/scoring-guide.md
git commit -m "docs: add scoring guide"
```

---

### Task 4: Write docs/pricing-guide.md

**Files:**
- Create: `docs/pricing-guide.md`

- [ ] **Step 1: Write the pricing guide document**

Write the following content to `docs/pricing-guide.md`:

```markdown
# Pricing Guide

Car-Point compares a car's listed price against market data from 50,000+ turbo.az marketplace records to determine if it's fairly priced.

## How the Average Price is Calculated

The service finds matching cars in its database using this strategy:

1. **Exact match:** Look for cars with the same brand + model + year
2. **Fallback:** If no exact match is found, expand the search to brand + model within +/-3 years of the listed year

The average price is calculated as the mean of all matching records' prices.

If no matching records exist even with the fallback, the service cannot provide a price comparison and returns `average: null` (see [No Market Data](#no-market-data) below).

## Deviation

The deviation measures how far the listed price is from the market average, expressed as a percentage:

```
deviation = ((listedPrice - average) / average) * 100
```

- **Positive deviation** means the car is listed above market average
- **Negative deviation** means the car is listed below market average
- The value is rounded to 2 decimal places

## Price Status

Based on the deviation, the car is classified into one of three categories:

| Status | Condition | Meaning |
|--------|-----------|---------|
| **GREAT_DEAL** | deviation < -15% | Listed well below market average |
| **FAIR_PRICE** | -15% <= deviation <= +15% | Listed around market average |
| **OVERPRICED** | deviation > +15% | Listed well above market average |

## No Market Data

When no matching cars exist in the database (even after the +/-3 year fallback), the response returns:

- `average`: `null`
- `deviation`: `0`
- `price_status`: `FAIR_PRICE`

Clients should check for `average === null` and handle this case appropriately — for example, display "No market data available" instead of showing a price comparison with zero deviation.

## Example

**Scenario:** A 2020 Toyota Corolla listed at **15,000 AZN**. The database contains 47 matching Corollas from 2020, with an average price of **18,000 AZN**.

**Calculation:**

```
deviation = ((15000 - 18000) / 18000) * 100 = -16.67%
```

Since -16.67% < -15%, the status is **GREAT_DEAL**.

**Response:**

```json
{
  "listed": 15000,
  "average": 18000,
  "deviation": -16.67,
  "price_status": "GREAT_DEAL"
}
```

This tells the client that the car is priced 16.67% below market average — a good deal for the buyer.
```

- [ ] **Step 2: Commit**

```bash
git add docs/pricing-guide.md
git commit -m "docs: add pricing guide"
```
