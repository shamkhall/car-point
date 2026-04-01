# Car-Point API (BFF) Design Spec

## Goal

Create a new NestJS REST API project (`car-point-api`) that serves as a Backend for Frontend for the car evaluation wizard. It sits in front of the existing car-point gRPC microservice, adding HTTP endpoints, Firebase authentication, user accounts, evaluation history, brand/model lookups, and rate limiting.

## Audience

Frontend developers building the wizard-style car evaluation UI.

## Architecture

```
Frontend → car-point-api (HTTP/REST, port 3000) → car-point (gRPC, port 5000)
                ↕
         MongoDB (car-point-api DB: users, evaluations)
         MongoDB (car-point DB: car_prices, car_reliability, car_depreciation)
```

- **car-point-api** owns: auth verification, user profiles, evaluation history, brand/model lookups, rate limiting
- **car-point** owns: scoring logic, pricing logic, market data
- The BFF calls car-point via gRPC for evaluations
- The BFF reads car-point's `car_prices` collection directly (read-only) for brand/model lookups

## Tech Stack

- NestJS (TypeScript)
- Firebase Admin SDK (auth token verification)
- Mongoose (MongoDB)
- `@grpc/grpc-js` + `@grpc/proto-loader` (gRPC client)
- `class-validator` + `class-transformer` (request validation)
- `@nestjs/throttler` (rate limiting)

---

## API Endpoints

### Public (no auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/brands` | List all distinct brands from car_prices |
| `GET` | `/brands/:brand/models` | List all distinct models for a brand |
| `POST` | `/evaluate` | Evaluate a car (calls car-point via gRPC). If a valid Firebase token is present, the evaluation is automatically saved to history. If not, the result is returned but not persisted. |

### Protected (Firebase token required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me` | Get current user's profile |
| `POST` | `/me` | Create user profile (after first Firebase sign-in) |
| `GET` | `/me/evaluations` | Get user's evaluation history (paginated) |
| `GET` | `/me/evaluations/:id` | Get a specific past evaluation |

---

## Data Models

### User

Stored in car-point-api's own MongoDB database.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `firebaseUid` | string | Firebase user ID (unique, indexed) |
| `email` | string | From Firebase token |
| `displayName` | string | From Firebase token |
| `createdAt` | Date | Account creation time |

### Evaluation

Stored in car-point-api's own MongoDB database.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `userId` | ObjectId | Reference to User (indexed) |
| `request` | object | The full car evaluation request sent |
| `result` | object | The full response from car-point (score, pricing, breakdown) |
| `createdAt` | Date | When the evaluation was performed |

---

## Authentication

- Firebase Admin SDK verifies the `Authorization: Bearer <token>` header
- Implemented as a NestJS Guard (`FirebaseAuthGuard`) applied to protected routes
- On `POST /evaluate`, auth is optional — a custom guard (`OptionalAuthGuard`) checks for a token but doesn't reject if absent. If valid, attaches the user to the request so the evaluation can be saved.
- `@CurrentUser()` custom parameter decorator extracts the authenticated user from the request

### Firebase Setup

The BFF uses Firebase Admin SDK initialized with a service account. Required environment variable:
- `FIREBASE_SERVICE_ACCOUNT` — path to the Firebase service account JSON file, or the JSON string itself

---

## Rate Limiting

- `@nestjs/throttler` package
- Global rate limit: 20 requests per minute per IP
- Applied to all endpoints
- No per-user differentiation

---

## gRPC Client

- NestJS `ClientGrpc` configured to connect to car-point
- Uses `proto/car-point.proto` (copied into the new project)
- Single service method: `GetCarPoint(request) → response`
- Connection address configurable via env var `GRPC_URL` (default: `localhost:5000`)

---

## Brand/Model Lookups

- The BFF connects to car-point's MongoDB (read-only) via a separate Mongoose connection
- Connection string configurable via env var `CAR_POINT_MONGODB_URI`
- `GET /brands` — `db.car_prices.distinct('brand')`, sorted alphabetically
- `GET /brands/:brand/models` — `db.car_prices.distinct('model', { brand: brand.toLowerCase() })`, sorted alphabetically

---

## Error Handling & Response Format

### Success response

```json
{
  "data": { ... }
}
```

### Error response

```json
{
  "statusCode": 400,
  "message": "Brand is required",
  "error": "Bad Request"
}
```

### Error scenarios

| Scenario | Status | Message |
|----------|--------|---------|
| Missing required fields on `/evaluate` | 400 | Validation error details |
| Invalid Firebase token | 401 | "Unauthorized" |
| Evaluation not found | 404 | "Evaluation not found" |
| Accessing another user's evaluation | 404 | "Evaluation not found" (don't leak existence) |
| car-point gRPC unavailable | 502 | "Scoring service unavailable" |
| Rate limit exceeded | 429 | "Too many requests" |

### Request Validation

`class-validator` + `class-transformer` on the evaluate request DTO. Validates types, required fields, and allowed values:
- `engine` must be one of: `petrol`, `diesel`, `hybrid`, `LPG`
- `transmission` must be one of: `automatic`, `semi-automatic`, `manual`
- `drive` must be one of: `AWD`, `FWD`, `RWD`
- `condition` must be one of: `excellent`, `good`, `fair`, `poor`

---

## Project Structure

```
car-point-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── firebase-auth.guard.ts
│   │   ├── optional-auth.guard.ts
│   │   └── current-user.decorator.ts
│   ├── evaluate/
│   │   ├── evaluate.module.ts
│   │   ├── evaluate.controller.ts
│   │   ├── evaluate.service.ts
│   │   └── dto/
│   │       └── evaluate-request.dto.ts
│   ├── brands/
│   │   ├── brands.module.ts
│   │   ├── brands.controller.ts
│   │   └── brands.service.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── schemas/
│   │       └── user.schema.ts
│   ├── evaluations/
│   │   ├── evaluations.module.ts
│   │   ├── evaluations.controller.ts
│   │   ├── evaluations.service.ts
│   │   └── schemas/
│   │       └── evaluation.schema.ts
│   └── grpc/
│       ├── grpc.module.ts
│       └── car-point-grpc.service.ts
├── proto/
│   └── car-point.proto
├── test/
├── package.json
└── tsconfig.json
```

### Module responsibilities

- **auth** — Firebase Admin SDK initialization, token verification guards, user decorator
- **evaluate** — `POST /evaluate` endpoint, calls gRPC, optionally saves to history
- **brands** — `GET /brands` and `GET /brands/:brand/models`, reads car-point's car_prices collection
- **users** — `GET /me` and `POST /me`, user profile CRUD
- **evaluations** — `GET /me/evaluations` and `GET /me/evaluations/:id`, evaluation history retrieval
- **grpc** — wraps the car-point gRPC client connection

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `MONGODB_URI` | Yes | — | MongoDB connection for car-point-api's own database |
| `CAR_POINT_MONGODB_URI` | Yes | — | MongoDB connection for car-point's database (read-only) |
| `GRPC_URL` | No | `localhost:5000` | car-point gRPC service address |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | — | Path to Firebase service account JSON or JSON string |

---

## Out of Scope

- Firebase project setup (user handles this separately)
- Frontend implementation
- Deployment / CI/CD
- Email notifications
- Password reset flows (Firebase handles this)
- Admin endpoints
