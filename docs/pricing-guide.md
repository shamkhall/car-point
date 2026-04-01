# Pricing Guide

## Overview

Car-Point compares a car's listed price against market data from 50,000+ turbo.az marketplace records to determine if it's fairly priced.

## How the Average Price is Calculated

- **Primary match:** brand + model + exact year
- **Fallback:** brand + model within +/-3 years of the listed year (if exact year has no data)
- The average is the mean of all matching records' prices
- If no records exist even with fallback, a comparison cannot be provided and the response returns `average: null`

## Deviation

The deviation measures how far a car's listed price is from the market average, expressed as a percentage.

**Formula:**

```
deviation = ((listedPrice - average) / average) * 100
```

- **Positive** deviation means the car is listed above the market average
- **Negative** deviation means the car is listed below the market average
- The result is rounded to 2 decimal places

## Price Status Classification

| Status | Condition | Meaning |
|--------|-----------|---------|
| `GREAT_DEAL` | deviation < -15% | Listed well below market average |
| `FAIR_PRICE` | -15% <= deviation <= +15% | Listed around market average |
| `OVERPRICED` | deviation > +15% | Listed well above market average |

## No Market Data

When no matching cars exist in the database, the response returns:

- `average`: `null`
- `deviation`: `0`
- `price_status`: `FAIR_PRICE`

Clients should check for a `null` average and display "No market data available" instead of a meaningless comparison.

## Example

A 2020 Toyota Corolla is listed at **15,000 AZN**. The database contains 47 matching Corollas from 2020 with an average price of **18,000 AZN**.

**Calculation:**

```
((15000 - 18000) / 18000) * 100 = -16.67%
```

Since -16.67% < -15%, the price status is `GREAT_DEAL`.

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
