# Car-Point Scoring Guide

## Overview

Car-Point evaluates vehicle quality using a **1-100 point** scoring system composed of 8 weighted components. A higher score indicates a better quality car. Each component contributes a fixed maximum number of points, and the final score is the sum of all component scores (rounded to the nearest integer).

## Score Components Summary

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

Based on kilometers driven per year of ownership.

**Formula:**

```
kmPerYear = mileage / (currentYear - year)
```

**Scoring:**

- <= 10,000 km/year: **25 points** (maximum)
- \>= 40,000 km/year: **0 points** (minimum)
- Between 10k and 40k: linear interpolation using `25 - ((kmPerYear - 10000) / 30000) * 25`

### Reliability (0-20 points)

Based on a brand/model tier lookup system. Each brand-model combination (or brand alone) is assigned a reliability tier.

| Tier | Points |
|------|--------|
| S | 20 |
| A | 16 |
| B | 12 |
| C | 8 |
| D | 4 |

The system first attempts to match on the specific brand + model combination. If no match is found, it falls back to a brand-only lookup. If neither is found, the car defaults to **D-tier** (4 points).

### Age (0-15 points)

Based on the vehicle's age in years.

**Formula:**

```
age = currentYear - year
score = 15 - (age * 0.75)
```

- A new car (age 0) receives the full **15 points**.
- Cars aged **20 years or older** receive **0 points**.

### Condition (0-15 points)

Based on the reported vehicle condition.

| Condition | Points |
|-----------|--------|
| Excellent | 15 |
| Good | 10 |
| Fair | 5 |
| Poor | 1 |

### Depreciation (0-10 points)

Based on the vehicle's value retention percentage (current value relative to original price).

| Value Retention | Points |
|----------------|--------|
| >= 70% | 10 |
| 55-69% | 7 |
| 40-54% | 4 |
| < 40% | 2 |

### Transmission (0-5 points)

| Transmission Type | Points |
|-------------------|--------|
| Automatic | 5 |
| Semi-automatic | 3 |
| Manual | 1 |

### Drive (0-5 points)

| Drivetrain | Points |
|------------|--------|
| AWD | 5 |
| FWD | 3 |
| RWD | 1 |

### Engine (0-5 points)

| Fuel Type | Points |
|-----------|--------|
| Hybrid | 5 |
| Diesel | 4 |
| Petrol | 3 |
| LPG | 1 |

## New Cars

When `is_new` is `true`, the following components are automatically set to their maximum values:

- **Mileage**: 25 points
- **Age**: 15 points
- **Condition**: 15 points

The remaining 5 components (Reliability, Depreciation, Transmission, Drive, Engine) are calculated normally using the formulas and lookup tables described above.

## Quality Status Thresholds

The final score maps to a quality status label:

| Status | Score Range | Meaning |
|--------|-----------|---------|
| EXCELLENT | 71-100 | High quality car |
| GOOD | 41-70 | Average quality |
| POOR | 1-40 | Below average quality |

## Example Walkthrough

**Car:** 2020 Toyota Corolla, 45,000 km, good condition, automatic, FWD, petrol.

**Step-by-step calculation:**

1. **Mileage:** kmPerYear = 45000 / (2026 - 2020) = 7,500. Since 7,500 < 10,000 → **25 points**
2. **Reliability:** Toyota Corolla is tier A → **16 points**
3. **Age:** age = 6, score = 15 - (6 * 0.75) = 10.5 → **10.5 points**
4. **Condition:** Good → **10 points**
5. **Depreciation:** Toyota Corolla retains ~75% value → **10 points**
6. **Transmission:** Automatic → **5 points**
7. **Drive:** FWD → **3 points**
8. **Engine:** Petrol → **3 points**

**Total:** 25 + 16 + 10.5 + 10 + 10 + 5 + 3 + 3 = 72.5 → **73** (rounded)

**Quality Status:** 73 >= 71 → **EXCELLENT**
