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
