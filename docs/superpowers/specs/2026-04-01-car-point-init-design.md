# car-point: NestJS Microservice Initialization

## Overview

Scaffold a NestJS gRPC microservice with MongoDB, serving as the foundation for a car scoring/rating service. The service will eventually accept car information, analyze it against an existing database, and return a score on a scale of 1 to 100.

This spec covers **project initialization only** — no business logic, schemas, or proto definitions.

## Technology Choices

- **Framework:** NestJS
- **Transport:** gRPC (`@grpc/grpc-js`, `@grpc/proto-loader`, `@nestjs/microservices`)
- **Database:** MongoDB (`@nestjs/mongoose`, `mongoose`)
- **Package manager:** npm
- **Testing:** Jest (NestJS default)

## Project Structure

```
car-point/
├── src/
│   ├── app.module.ts            # Root module with MongoDB + gRPC config
│   ├── app.controller.ts        # Default controller (from CLI)
│   ├── app.service.ts           # Default service (from CLI)
│   └── main.ts                  # Bootstrap as gRPC microservice
├── test/                        # e2e test scaffolding (from CLI)
├── proto/                       # gRPC proto files (empty dir for now)
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── .eslint / .prettier configs  # From CLI
```

## Setup Details

- **main.ts:** Configured as a gRPC microservice (not HTTP)
- **MongoDB connection:** Via `@nestjs/mongoose`, connection string read from environment variable
- **Proto directory:** Empty `proto/` directory created for future `.proto` files
- **Scaffold method:** `nest new` CLI, then add gRPC and MongoDB dependencies

## Out of Scope

- Car scoring logic, data schemas, or gRPC proto definitions
- Docker / docker-compose
- CI/CD pipeline
- Environment configuration files (.env)
