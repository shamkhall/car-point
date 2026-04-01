# car-point Microservice Initialization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a NestJS gRPC microservice with MongoDB, ready for future car scoring logic.

**Architecture:** Use NestJS CLI to generate the base project in the existing `car-point` directory (which already has a git repo and spec docs). Then install gRPC and MongoDB dependencies, configure `main.ts` as a gRPC microservice, wire up `MongooseModule` in the root module, and create an empty `proto/` directory for future `.proto` files.

**Tech Stack:** NestJS 11, gRPC (`@grpc/grpc-js`, `@grpc/proto-loader`), MongoDB (`@nestjs/mongoose`, `mongoose`), TypeScript, Jest

---

### Task 1: Scaffold NestJS project

**Files:**
- Create: `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts`
- Create: `test/jest-e2e.json`, `test/app.e2e-spec.ts`
- Create: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `.prettierrc`, `eslint.config.mjs`

- [ ] **Step 1: Run NestJS CLI to scaffold the project**

```bash
cd C:/repos/car/car-point && nest new car-point --directory . --skip-git -p npm
```

This scaffolds into the current directory, skips git init (repo already exists), and uses npm. The CLI will create all source files and install dependencies.

- [ ] **Step 2: Verify the scaffold succeeded**

```bash
cd C:/repos/car/car-point && npm run build
```

Expected: Successful compilation with no errors. Output in `dist/` directory.

- [ ] **Step 3: Run default tests**

```bash
cd C:/repos/car/car-point && npm test
```

Expected: 1 test passes (`AppController > root > should return "Hello World!"`).

- [ ] **Step 4: Commit the scaffold**

```bash
cd C:/repos/car/car-point
git add package.json package-lock.json tsconfig.json tsconfig.build.json nest-cli.json .prettierrc eslint.config.mjs src/ test/ README.md
git commit -m "chore: scaffold NestJS project via CLI"
```

---

### Task 2: Install gRPC and MongoDB dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install gRPC packages**

```bash
cd C:/repos/car/car-point && npm install @nestjs/microservices @grpc/grpc-js @grpc/proto-loader
```

- [ ] **Step 2: Install MongoDB packages**

```bash
cd C:/repos/car/car-point && npm install @nestjs/mongoose mongoose
```

- [ ] **Step 3: Verify installation**

```bash
cd C:/repos/car/car-point && npm ls @nestjs/microservices @grpc/grpc-js @grpc/proto-loader @nestjs/mongoose mongoose
```

Expected: All 5 packages listed with their versions, no `MISSING` or `ERR!` output.

- [ ] **Step 4: Commit dependencies**

```bash
cd C:/repos/car/car-point
git add package.json package-lock.json
git commit -m "chore: add gRPC and MongoDB dependencies"
```

---

### Task 3: Configure gRPC microservice bootstrap

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Replace `src/main.ts` with gRPC microservice bootstrap**

Replace the entire contents of `src/main.ts` with:

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'carpoint',
        protoPath: join(__dirname, '../proto/car-point.proto'),
        url: process.env.GRPC_URL ?? '0.0.0.0:5000',
      },
    },
  );
  await app.listen();
}
bootstrap();
```

This changes the app from an HTTP server to a gRPC microservice. It references a proto file at `proto/car-point.proto` (will be created in a later task) and listens on `0.0.0.0:5000` by default.

- [ ] **Step 2: Verify the project compiles**

```bash
cd C:/repos/car/car-point && npm run build
```

Expected: Successful compilation, no errors. (The app won't start without the proto file, but it compiles.)

- [ ] **Step 3: Commit**

```bash
cd C:/repos/car/car-point
git add src/main.ts
git commit -m "feat: configure main.ts as gRPC microservice"
```

---

### Task 4: Add MongooseModule to AppModule

**Files:**
- Modify: `src/app.module.ts`

- [ ] **Step 1: Update `src/app.module.ts` to import MongooseModule**

Replace the entire contents of `src/app.module.ts` with:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/car-point'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

This connects to MongoDB using the `MONGODB_URI` environment variable, falling back to `localhost:27017/car-point` for local development.

- [ ] **Step 2: Verify the project compiles**

```bash
cd C:/repos/car/car-point && npm run build
```

Expected: Successful compilation, no errors.

- [ ] **Step 3: Update the unit test to handle MongooseModule**

Replace the entire contents of `src/app.controller.spec.ts` with:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
```

Note: This test already doesn't import AppModule, so it won't try to connect to MongoDB. The test file stays the same as the scaffold — we're just confirming it still works.

- [ ] **Step 4: Run tests**

```bash
cd C:/repos/car/car-point && npm test
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
cd C:/repos/car/car-point
git add src/app.module.ts src/app.controller.spec.ts
git commit -m "feat: add MongooseModule with env-based connection string"
```

---

### Task 5: Create proto directory with placeholder proto file

**Files:**
- Create: `proto/car-point.proto`

- [ ] **Step 1: Create `proto/car-point.proto` with minimal valid content**

```protobuf
syntax = "proto3";

package carpoint;
```

This is the minimal valid proto file that matches the `package: 'carpoint'` in `main.ts`. It has no services yet — those will be added when car scoring logic is implemented.

- [ ] **Step 2: Verify the project compiles**

```bash
cd C:/repos/car/car-point && npm run build
```

Expected: Successful compilation.

- [ ] **Step 3: Commit**

```bash
cd C:/repos/car/car-point
git add proto/car-point.proto
git commit -m "chore: add minimal proto file for gRPC package definition"
```

---

### Task 6: Final verification

- [ ] **Step 1: Clean build**

```bash
cd C:/repos/car/car-point && rm -rf dist && npm run build
```

Expected: Clean compilation, no errors or warnings.

- [ ] **Step 2: Run all tests**

```bash
cd C:/repos/car/car-point && npm test
```

Expected: All tests pass.

- [ ] **Step 3: Verify project structure**

```bash
cd C:/repos/car/car-point && find src proto test -type f | sort
```

Expected output:
```
proto/car-point.proto
src/app.controller.spec.ts
src/app.controller.ts
src/app.module.ts
src/app.service.ts
src/main.ts
test/app.e2e-spec.ts
test/jest-e2e.json
```
