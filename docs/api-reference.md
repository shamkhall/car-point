# API Reference

## Connecting to the Service

| Property        | Value                   |
| --------------- | ----------------------- |
| Proto file      | `proto/car-point.proto` |
| Package         | `carpoint`              |
| Service         | `CarPointService`       |
| RPC Method      | `GetCarPoint`           |
| Default address | `0.0.0.0:5000`          |

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

| Field             | Type   | Required | Description                                          | Example       |
| ----------------- | ------ | -------- | ---------------------------------------------------- | ------------- |
| `brand`           | string | Yes      | Car manufacturer                                     | `"Toyota"`    |
| `model`           | string | Yes      | Car model name                                       | `"Corolla"`   |
| `year`            | int32  | Yes      | Manufacturing year                                   | `2020`        |
| `body_type`       | string | No       | Body style                                           | `"sedan"`     |
| `color`           | string | No       | Exterior color                                       | `"white"`     |
| `engine`          | string | Yes      | Fuel type: `"petrol"`, `"diesel"`, `"hybrid"`, `"LPG"` | `"petrol"`    |
| `mileage`         | int32  | Yes      | Total kilometers driven                              | `45000`       |
| `transmission`    | string | Yes      | `"automatic"`, `"semi-automatic"`, `"manual"`        | `"automatic"` |
| `drive`           | string | Yes      | Drivetrain: `"AWD"`, `"FWD"`, `"RWD"`                | `"FWD"`       |
| `is_new`          | bool   | Yes      | `true` for brand-new cars                            | `false`       |
| `number_of_seats` | int32  | No       | Seat count                                           | `5`           |
| `condition`       | string | Yes      | `"excellent"`, `"good"`, `"fair"`, `"poor"`          | `"good"`      |
| `market`          | string | No       | Marketplace name                                     | `"turbo.az"`  |
| `city`            | string | No       | City of listing                                      | `"Baku"`      |
| `price`           | double | Yes      | Listed/asking price                                  | `15000`       |

## Response Fields

### Top-Level Fields

| Field            | Type           | Description                          |
| ---------------- | -------------- | ------------------------------------ |
| `quality_score`  | int32          | Overall quality score (0-100)        |
| `quality_status` | QualityStatus  | Human-readable quality classification |
| `price`          | PriceInfo      | Price analysis details               |
| `score_breakdown`| ScoreBreakdown | Per-category score breakdown         |

### QualityStatus Enum

| Value       | Number | Score Range | Description                  |
| ----------- | ------ | ----------- | ---------------------------- |
| `GOOD`      | 0      | 41 - 70     | Average quality              |
| `POOR`      | 1      | < 41        | Below-average quality        |
| `EXCELLENT` | 2      | 71+         | Above-average quality        |

### PriceInfo Fields

| Field          | Type        | Description                                  |
| -------------- | ----------- | -------------------------------------------- |
| `listed`       | double      | The asking price submitted in the request     |
| `average`      | double      | Average market price for comparable vehicles  |
| `deviation`    | double      | Percentage deviation from market average      |
| `price_status` | PriceStatus | Classification of the listing price           |

### PriceStatus Enum

| Value        | Number | Deviation Range | Description                        |
| ------------ | ------ | --------------- | ---------------------------------- |
| `FAIR_PRICE` | 0      | -15% to +15%    | Price is within market range       |
| `GREAT_DEAL` | 1      | Below -15%      | Price is significantly below market|
| `OVERPRICED` | 2      | Above +15%      | Price is significantly above market|

### ScoreBreakdown Fields

| Field               | Type  | Max Points | Description                     |
| ------------------- | ----- | ---------- | ------------------------------- |
| `mileage_score`     | int32 | 25         | Score based on total mileage    |
| `age_score`         | int32 | 15         | Score based on vehicle age      |
| `reliability_score` | int32 | 15         | Score based on brand reliability|
| `condition_score`   | int32 | 15         | Score based on reported condition|
| `depreciation_score`| int32 | 10         | Score based on depreciation rate|
| `transmission_score`| int32 | 10         | Score based on transmission type|
| `drive_score`       | int32 | 5          | Score based on drivetrain type  |
| `engine_score`      | int32 | 5          | Score based on engine/fuel type |

## Code Example (Node.js)

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDef = protoLoader.loadSync('proto/car-point.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).carpoint;

const client = new proto.CarPointService(
  'localhost:5000',
  grpc.credentials.createInsecure(),
);

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

### No Market Data Available

When there is no market data for the given brand/model/year combination, the price fields return defaults:

```json
{
  "quality_score": 72,
  "quality_status": "EXCELLENT",
  "price": {
    "listed": 15000,
    "average": null,
    "deviation": 0,
    "price_status": "FAIR_PRICE"
  },
  "score_breakdown": {
    "mileage_score": 20,
    "age_score": 12,
    "reliability_score": 15,
    "condition_score": 10,
    "depreciation_score": 5,
    "transmission_score": 5,
    "drive_score": 3,
    "engine_score": 2
  }
}
```

Clients should check for a `null` average before using price-related fields. When average is `null`, `deviation` will be `0` and `price_status` defaults to `FAIR_PRICE` since no comparison is possible.

### New Cars

When `is_new` is set to `true`, the service automatically assigns maximum scores for the following categories:

- `mileage_score`: 25 (max)
- `age_score`: 15 (max)
- `condition_score`: 15 (max)

This reflects that a brand-new car has zero mileage, zero age, and is in perfect condition by definition.
