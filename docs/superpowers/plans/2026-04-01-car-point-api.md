# Car-Point API (BFF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a NestJS REST API (BFF) at `C:\repos\car\car-point-api` that serves the car evaluation frontend, connecting to the existing car-point gRPC microservice.

**Architecture:** A separate NestJS HTTP server that verifies Firebase auth tokens, proxies evaluation requests to car-point via gRPC, persists user profiles and evaluation history in its own MongoDB, and provides brand/model lookup endpoints by reading car-point's database (read-only).

**Tech Stack:** NestJS 11, TypeScript, Firebase Admin SDK, Mongoose, @grpc/grpc-js, class-validator, @nestjs/throttler

**Spec:** `docs/superpowers/specs/2026-04-01-car-point-api-design.md` (in the car-point repo)

---

## File Structure

```
C:\repos\car\car-point-api\
├── src/
│   ├── main.ts                              # Bootstrap HTTP server on port 3000
│   ├── app.module.ts                        # Root module, imports all feature modules
│   ├── grpc/
│   │   ├── grpc.module.ts                   # Registers gRPC client for car-point
│   │   └── car-point-grpc.service.ts        # Wraps GetCarPoint RPC call
│   ├── auth/
│   │   ├── auth.module.ts                   # Firebase Admin SDK init
│   │   ├── firebase-auth.guard.ts           # Guard: require valid Firebase token
│   │   ├── optional-auth.guard.ts           # Guard: attach user if token present, don't reject
│   │   └── current-user.decorator.ts        # @CurrentUser() param decorator
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts              # GET /me, POST /me
│   │   ├── users.service.ts                 # User CRUD
│   │   └── schemas/
│   │       └── user.schema.ts               # Mongoose schema
│   ├── evaluate/
│   │   ├── evaluate.module.ts
│   │   ├── evaluate.controller.ts           # POST /evaluate
│   │   ├── evaluate.service.ts              # Orchestrates gRPC call + optional save
│   │   └── dto/
│   │       └── evaluate-request.dto.ts      # Validated request DTO
│   ├── evaluations/
│   │   ├── evaluations.module.ts
│   │   ├── evaluations.controller.ts        # GET /me/evaluations, GET /me/evaluations/:id
│   │   ├── evaluations.service.ts           # Evaluation history queries
│   │   └── schemas/
│   │       └── evaluation.schema.ts         # Mongoose schema
│   └── brands/
│       ├── brands.module.ts
│       ├── brands.controller.ts             # GET /brands, GET /brands/:brand/models
│       └── brands.service.ts                # Distinct queries on car_prices
├── proto/
│   └── car-point.proto                      # Copied from car-point project
├── test/
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── nest-cli.json
```

---

### Task 1: Scaffold NestJS Project

**Files:**
- Create: `C:\repos\car\car-point-api\` (entire project scaffold)

- [ ] **Step 1: Generate NestJS project**

```bash
cd C:\repos\car
npx @nestjs/cli new car-point-api --package-manager npm --skip-git
```

Select npm when prompted. The `--skip-git` flag prevents creating a nested git repo.

- [ ] **Step 2: Initialize git repo**

```bash
cd C:\repos\car\car-point-api
git init
```

- [ ] **Step 3: Create .gitignore**

Write to `C:\repos\car\car-point-api\.gitignore`:

```
/dist
/node_modules
/.idea
/.vscode
*.swp
*.swo
.DS_Store
Thumbs.db
.env
.env.*
npm-debug.log*
/coverage
```

- [ ] **Step 4: Install dependencies**

```bash
cd C:\repos\car\car-point-api
npm install @nestjs/mongoose mongoose firebase-admin @grpc/grpc-js @grpc/proto-loader @nestjs/microservices @nestjs/throttler class-validator class-transformer
```

- [ ] **Step 5: Update tsconfig.json to match car-point patterns**

Write to `C:\repos\car\car-point-api\tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

- [ ] **Step 6: Add moduleNameMapper to package.json jest config**

In `package.json`, find the `jest` section and add:

```json
"moduleNameMapper": {
  "^(\\.{1,2}/.*)\\.js$": "$1"
}
```

This allows `.js` extension imports to resolve to `.ts` files during testing (same pattern as car-point).

- [ ] **Step 7: Copy proto file**

```bash
cp C:\repos\car\car-point\proto\car-point.proto C:\repos\car\car-point-api\proto\car-point.proto
```

Create the `proto/` directory first if needed:

```bash
mkdir -p C:\repos\car\car-point-api\proto
```

- [ ] **Step 8: Update main.ts to use port from env**

Write to `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 9: Verify it compiles and starts**

```bash
cd C:\repos\car\car-point-api
npm run build
```

Expected: Successful compilation with no errors.

- [ ] **Step 10: Commit**

```bash
cd C:\repos\car\car-point-api
git add -A
git commit -m "chore: scaffold NestJS project with dependencies"
```

---

### Task 2: gRPC Client Module

**Files:**
- Create: `src/grpc/grpc.module.ts`
- Create: `src/grpc/car-point-grpc.service.ts`
- Test: `src/grpc/car-point-grpc.service.spec.ts`

- [ ] **Step 1: Write the gRPC service**

Write to `src/grpc/car-point-grpc.service.ts`:

```typescript
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

export interface CarPointRequest {
  brand: string;
  model: string;
  year: number;
  body_type: string;
  color: string;
  engine: string;
  mileage: number;
  transmission: string;
  drive: string;
  is_new: boolean;
  number_of_seats: number;
  condition: string;
  market: string;
  city: string;
  price: number;
}

export interface ScoreBreakdown {
  mileage_score: number;
  age_score: number;
  reliability_score: number;
  condition_score: number;
  depreciation_score: number;
  transmission_score: number;
  drive_score: number;
  engine_score: number;
}

export interface PriceInfo {
  listed: number;
  average: number | null;
  deviation: number;
  price_status: string;
}

export interface CarPointResponse {
  quality_score: number;
  quality_status: string;
  price: PriceInfo;
  score_breakdown: ScoreBreakdown;
}

interface CarPointGrpcService {
  getCarPoint(request: CarPointRequest): Observable<CarPointResponse>;
}

@Injectable()
export class CarPointGrpcService implements OnModuleInit {
  private grpcService: CarPointGrpcService;

  constructor(@Inject('CAR_POINT_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.grpcService =
      this.client.getService<CarPointGrpcService>('CarPointService');
  }

  async getCarPoint(request: CarPointRequest): Promise<CarPointResponse> {
    return firstValueFrom(this.grpcService.getCarPoint(request));
  }
}
```

- [ ] **Step 2: Write the gRPC module**

Write to `src/grpc/grpc.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CarPointGrpcService } from './car-point-grpc.service.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CAR_POINT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'carpoint',
          protoPath: join(__dirname, '../../proto/car-point.proto'),
          url: process.env.GRPC_URL ?? 'localhost:5000',
        },
      },
    ]),
  ],
  providers: [CarPointGrpcService],
  exports: [CarPointGrpcService],
})
export class GrpcModule {}
```

- [ ] **Step 3: Write the test**

Write to `src/grpc/car-point-grpc.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CarPointGrpcService } from './car-point-grpc.service.js';
import { of } from 'rxjs';

describe('CarPointGrpcService', () => {
  let service: CarPointGrpcService;

  const mockGrpcService = {
    getCarPoint: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockGrpcService),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarPointGrpcService,
        { provide: 'CAR_POINT_PACKAGE', useValue: mockClientGrpc },
      ],
    }).compile();

    service = module.get<CarPointGrpcService>(CarPointGrpcService);
    service.onModuleInit();
  });

  it('should call gRPC getCarPoint and return the response', async () => {
    const mockResponse = {
      quality_score: 72,
      quality_status: 'EXCELLENT',
      price: { listed: 15000, average: 18000, deviation: -16.67, price_status: 'GREAT_DEAL' },
      score_breakdown: {
        mileage_score: 25, age_score: 11, reliability_score: 16,
        condition_score: 10, depreciation_score: 10,
        transmission_score: 5, drive_score: 3, engine_score: 3,
      },
    };
    mockGrpcService.getCarPoint.mockReturnValue(of(mockResponse));

    const result = await service.getCarPoint({
      brand: 'Toyota', model: 'Corolla', year: 2020,
      body_type: 'sedan', color: 'white', engine: 'petrol',
      mileage: 45000, transmission: 'automatic', drive: 'FWD',
      is_new: false, number_of_seats: 5, condition: 'good',
      market: 'turbo.az', city: 'Baku', price: 15000,
    });

    expect(result).toEqual(mockResponse);
    expect(mockGrpcService.getCarPoint).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: Run test**

```bash
cd C:\repos\car\car-point-api
npx jest src/grpc/car-point-grpc.service.spec.ts --verbose
```

Expected: 1 test passing.

- [ ] **Step 5: Commit**

```bash
cd C:\repos\car\car-point-api
git add src/grpc/ proto/
git commit -m "feat: add gRPC client module for car-point service"
```

---

### Task 3: Auth Module (Firebase)

**Files:**
- Create: `src/auth/auth.module.ts`
- Create: `src/auth/firebase-auth.guard.ts`
- Create: `src/auth/optional-auth.guard.ts`
- Create: `src/auth/current-user.decorator.ts`
- Test: `src/auth/firebase-auth.guard.spec.ts`
- Test: `src/auth/optional-auth.guard.spec.ts`

- [ ] **Step 1: Write the CurrentUser decorator**

Write to `src/auth/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): FirebaseUser | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.firebaseUser ?? null;
  },
);
```

- [ ] **Step 2: Write the FirebaseAuthGuard**

Write to `src/auth/firebase-auth.guard.ts`:

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      request.firebaseUser = {
        uid: decoded.uid,
        email: decoded.email ?? '',
        displayName: decoded.name ?? '',
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

- [ ] **Step 3: Write the OptionalAuthGuard**

Write to `src/auth/optional-auth.guard.ts`:

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      request.firebaseUser = {
        uid: decoded.uid,
        email: decoded.email ?? '',
        displayName: decoded.name ?? '',
      };
    } catch {
      // Invalid token — proceed as unauthenticated
    }

    return true;
  }
}
```

- [ ] **Step 4: Write the auth module**

Write to `src/auth/auth.module.ts`:

```typescript
import { Module, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

@Module({})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length > 0) return;

    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
    }

    let serviceAccount: admin.ServiceAccount;
    try {
      // Try parsing as JSON string first
      serviceAccount = JSON.parse(serviceAccountEnv);
    } catch {
      // Fall back to reading as file path
      serviceAccount = JSON.parse(readFileSync(serviceAccountEnv, 'utf-8'));
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
```

- [ ] **Step 5: Write FirebaseAuthGuard test**

Write to `src/auth/firebase-auth.guard.spec.ts`:

```typescript
import { FirebaseAuthGuard } from './firebase-auth.guard.js';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}));

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;

  const mockContext = (authHeader?: string): ExecutionContext => {
    const request = { headers: { authorization: authHeader }, firebaseUser: undefined };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new FirebaseAuthGuard();
  });

  it('should reject request with no auth header', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toThrow(UnauthorizedException);
  });

  it('should reject request with invalid token format', async () => {
    await expect(guard.canActivate(mockContext('InvalidToken'))).rejects.toThrow(UnauthorizedException);
  });

  it('should accept valid token and attach user to request', async () => {
    const mockVerify = jest.fn().mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });
    (admin.auth as jest.Mock).mockReturnValue({ verifyIdToken: mockVerify });

    const ctx = mockContext('Bearer valid-token');
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.firebaseUser).toEqual({
      uid: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    });
  });

  it('should reject invalid token', async () => {
    const mockVerify = jest.fn().mockRejectedValue(new Error('Invalid token'));
    (admin.auth as jest.Mock).mockReturnValue({ verifyIdToken: mockVerify });

    await expect(guard.canActivate(mockContext('Bearer invalid-token'))).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 6: Write OptionalAuthGuard test**

Write to `src/auth/optional-auth.guard.spec.ts`:

```typescript
import { OptionalAuthGuard } from './optional-auth.guard.js';
import { ExecutionContext } from '@nestjs/common';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}));

describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuard;

  const mockContext = (authHeader?: string) => {
    const request = { headers: { authorization: authHeader }, firebaseUser: undefined };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new OptionalAuthGuard();
  });

  it('should allow request with no auth header', async () => {
    const result = await guard.canActivate(mockContext());
    expect(result).toBe(true);
  });

  it('should attach user if valid token present', async () => {
    const mockVerify = jest.fn().mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });
    (admin.auth as jest.Mock).mockReturnValue({ verifyIdToken: mockVerify });

    const ctx = mockContext('Bearer valid-token');
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.firebaseUser).toEqual({
      uid: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    });
  });

  it('should allow request with invalid token (no user attached)', async () => {
    const mockVerify = jest.fn().mockRejectedValue(new Error('Invalid'));
    (admin.auth as jest.Mock).mockReturnValue({ verifyIdToken: mockVerify });

    const ctx = mockContext('Bearer bad-token');
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.firebaseUser).toBeUndefined();
  });
});
```

- [ ] **Step 7: Run tests**

```bash
cd C:\repos\car\car-point-api
npx jest src/auth/ --verbose
```

Expected: All tests passing.

- [ ] **Step 8: Commit**

```bash
cd C:\repos\car\car-point-api
git add src/auth/
git commit -m "feat: add Firebase auth module with guards and decorator"
```

---

### Task 4: Users Module

**Files:**
- Create: `src/users/schemas/user.schema.ts`
- Create: `src/users/users.service.ts`
- Create: `src/users/users.controller.ts`
- Create: `src/users/users.module.ts`
- Test: `src/users/users.service.spec.ts`
- Test: `src/users/users.controller.spec.ts`

- [ ] **Step 1: Write the User schema**

Write to `src/users/schemas/user.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class User {
  @Prop({ required: true, unique: true, index: true })
  firebaseUid: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: '' })
  displayName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

- [ ] **Step 2: Write the users service**

Write to `src/users/users.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ firebaseUid });
  }

  async create(data: {
    firebaseUid: string;
    email: string;
    displayName: string;
  }): Promise<UserDocument> {
    return this.userModel.create(data);
  }
}
```

- [ ] **Step 3: Write the users controller**

Write to `src/users/users.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';
import { CurrentUser, FirebaseUser } from '../auth/current-user.decorator.js';
import { UsersService } from './users.service.js';

@Controller('me')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getProfile(@CurrentUser() user: FirebaseUser) {
    const profile = await this.usersService.findByFirebaseUid(user.uid);
    if (!profile) {
      throw new NotFoundException('User profile not found. Create one with POST /me.');
    }
    return { data: profile };
  }

  @Post()
  async createProfile(@CurrentUser() user: FirebaseUser) {
    const existing = await this.usersService.findByFirebaseUid(user.uid);
    if (existing) {
      throw new ConflictException('Profile already exists');
    }

    const profile = await this.usersService.create({
      firebaseUid: user.uid,
      email: user.email,
      displayName: user.displayName ?? '',
    });

    return { data: profile };
  }
}
```

- [ ] **Step 4: Write the users module**

Write to `src/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: Write users service test**

Write to `src/users/users.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service.js';
import { User } from './schemas/user.schema.js';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should find user by firebaseUid', async () => {
    const mockUser = { firebaseUid: 'uid-123', email: 'test@example.com' };
    mockUserModel.findOne.mockResolvedValue(mockUser);

    const result = await service.findByFirebaseUid('uid-123');

    expect(result).toEqual(mockUser);
    expect(mockUserModel.findOne).toHaveBeenCalledWith({ firebaseUid: 'uid-123' });
  });

  it('should return null when user not found', async () => {
    mockUserModel.findOne.mockResolvedValue(null);

    const result = await service.findByFirebaseUid('nonexistent');

    expect(result).toBeNull();
  });

  it('should create a new user', async () => {
    const userData = { firebaseUid: 'uid-123', email: 'test@example.com', displayName: 'Test' };
    mockUserModel.create.mockResolvedValue(userData);

    const result = await service.create(userData);

    expect(result).toEqual(userData);
    expect(mockUserModel.create).toHaveBeenCalledWith(userData);
  });
});
```

- [ ] **Step 6: Write users controller test**

Write to `src/users/users.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    findByFirebaseUid: jest.fn(),
    create: jest.fn(),
  };

  const firebaseUser = { uid: 'uid-123', email: 'test@example.com', displayName: 'Test' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('GET /me', () => {
    it('should return user profile', async () => {
      const profile = { firebaseUid: 'uid-123', email: 'test@example.com' };
      mockUsersService.findByFirebaseUid.mockResolvedValue(profile);

      const result = await controller.getProfile(firebaseUser);

      expect(result).toEqual({ data: profile });
    });

    it('should throw 404 if profile not found', async () => {
      mockUsersService.findByFirebaseUid.mockResolvedValue(null);

      await expect(controller.getProfile(firebaseUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /me', () => {
    it('should create user profile', async () => {
      mockUsersService.findByFirebaseUid.mockResolvedValue(null);
      const created = { firebaseUid: 'uid-123', email: 'test@example.com', displayName: 'Test' };
      mockUsersService.create.mockResolvedValue(created);

      const result = await controller.createProfile(firebaseUser);

      expect(result).toEqual({ data: created });
    });

    it('should throw 409 if profile already exists', async () => {
      mockUsersService.findByFirebaseUid.mockResolvedValue({ firebaseUid: 'uid-123' });

      await expect(controller.createProfile(firebaseUser)).rejects.toThrow(ConflictException);
    });
  });
});
```

- [ ] **Step 7: Run tests**

```bash
cd C:\repos\car\car-point-api
npx jest src/users/ --verbose
```

Expected: All tests passing.

- [ ] **Step 8: Commit**

```bash
cd C:\repos\car\car-point-api
git add src/users/
git commit -m "feat: add users module with profile endpoints"
```

---

### Task 5: Evaluations Module (History)

**Files:**
- Create: `src/evaluations/schemas/evaluation.schema.ts`
- Create: `src/evaluations/evaluations.service.ts`
- Create: `src/evaluations/evaluations.controller.ts`
- Create: `src/evaluations/evaluations.module.ts`
- Test: `src/evaluations/evaluations.service.spec.ts`
- Test: `src/evaluations/evaluations.controller.spec.ts`

- [ ] **Step 1: Write the Evaluation schema**

Write to `src/evaluations/schemas/evaluation.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EvaluationDocument = HydratedDocument<Evaluation>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Evaluation {
  @Prop({ required: true, index: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Object })
  request: Record<string, any>;

  @Prop({ required: true, type: Object })
  result: Record<string, any>;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
```

- [ ] **Step 2: Write the evaluations service**

Write to `src/evaluations/evaluations.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Evaluation, EvaluationDocument } from './schemas/evaluation.schema.js';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation.name) private evaluationModel: Model<Evaluation>,
  ) {}

  async create(data: {
    userId: Types.ObjectId;
    request: Record<string, any>;
    result: Record<string, any>;
  }): Promise<EvaluationDocument> {
    return this.evaluationModel.create(data);
  }

  async findByUserId(
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ evaluations: EvaluationDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const [evaluations, total] = await Promise.all([
      this.evaluationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.evaluationModel.countDocuments({ userId }),
    ]);

    return { evaluations, total };
  }

  async findOneByIdAndUserId(
    id: string,
    userId: Types.ObjectId,
  ): Promise<EvaluationDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.evaluationModel.findOne({ _id: id, userId });
  }
}
```

- [ ] **Step 3: Write the evaluations controller**

Write to `src/evaluations/evaluations.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';
import { CurrentUser, FirebaseUser } from '../auth/current-user.decorator.js';
import { UsersService } from '../users/users.service.js';
import { EvaluationsService } from './evaluations.service.js';

@Controller('me/evaluations')
@UseGuards(FirebaseAuthGuard)
export class EvaluationsController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async getHistory(
    @CurrentUser() user: FirebaseUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userDoc = await this.usersService.findByFirebaseUid(user.uid);
    if (!userDoc) {
      throw new NotFoundException('User profile not found');
    }

    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));

    const result = await this.evaluationsService.findByUserId(
      userDoc._id,
      pageNum,
      limitNum,
    );

    return {
      data: result.evaluations,
      meta: { page: pageNum, limit: limitNum, total: result.total },
    };
  }

  @Get(':id')
  async getEvaluation(
    @CurrentUser() user: FirebaseUser,
    @Param('id') id: string,
  ) {
    const userDoc = await this.usersService.findByFirebaseUid(user.uid);
    if (!userDoc) {
      throw new NotFoundException('Evaluation not found');
    }

    const evaluation = await this.evaluationsService.findOneByIdAndUserId(
      id,
      userDoc._id,
    );
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    return { data: evaluation };
  }
}
```

- [ ] **Step 4: Write the evaluations module**

Write to `src/evaluations/evaluations.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Evaluation, EvaluationSchema } from './schemas/evaluation.schema.js';
import { EvaluationsService } from './evaluations.service.js';
import { EvaluationsController } from './evaluations.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Evaluation.name, schema: EvaluationSchema }]),
    UsersModule,
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
```

- [ ] **Step 5: Write evaluations service test**

Write to `src/evaluations/evaluations.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { EvaluationsService } from './evaluations.service.js';
import { Evaluation } from './schemas/evaluation.schema.js';

describe('EvaluationsService', () => {
  let service: EvaluationsService;

  const mockEvalModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        { provide: getModelToken(Evaluation.name), useValue: mockEvalModel },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
    jest.clearAllMocks();
  });

  it('should create an evaluation', async () => {
    const data = {
      userId: new Types.ObjectId(),
      request: { brand: 'Toyota' },
      result: { quality_score: 72 },
    };
    mockEvalModel.create.mockResolvedValue(data);

    const result = await service.create(data);

    expect(result).toEqual(data);
    expect(mockEvalModel.create).toHaveBeenCalledWith(data);
  });

  it('should find evaluations by userId with pagination', async () => {
    const userId = new Types.ObjectId();
    const evals = [{ request: {}, result: {} }];
    const chainMock = { sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue(evals) };
    mockEvalModel.find.mockReturnValue(chainMock);
    mockEvalModel.countDocuments.mockResolvedValue(1);

    const result = await service.findByUserId(userId, 1, 20);

    expect(result.evaluations).toEqual(evals);
    expect(result.total).toBe(1);
    expect(mockEvalModel.find).toHaveBeenCalledWith({ userId });
  });

  it('should find one evaluation by id and userId', async () => {
    const userId = new Types.ObjectId();
    const id = new Types.ObjectId().toString();
    const evaluation = { _id: id, userId, request: {}, result: {} };
    mockEvalModel.findOne.mockResolvedValue(evaluation);

    const result = await service.findOneByIdAndUserId(id, userId);

    expect(result).toEqual(evaluation);
    expect(mockEvalModel.findOne).toHaveBeenCalledWith({ _id: id, userId });
  });

  it('should return null for invalid ObjectId', async () => {
    const result = await service.findOneByIdAndUserId('invalid-id', new Types.ObjectId());

    expect(result).toBeNull();
    expect(mockEvalModel.findOne).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Write evaluations controller test**

Write to `src/evaluations/evaluations.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EvaluationsController } from './evaluations.controller.js';
import { EvaluationsService } from './evaluations.service.js';
import { UsersService } from '../users/users.service.js';

describe('EvaluationsController', () => {
  let controller: EvaluationsController;

  const userId = new Types.ObjectId();
  const mockUsersService = { findByFirebaseUid: jest.fn() };
  const mockEvalsService = { findByUserId: jest.fn(), findOneByIdAndUserId: jest.fn() };
  const firebaseUser = { uid: 'uid-123', email: 'test@example.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationsController],
      providers: [
        { provide: EvaluationsService, useValue: mockEvalsService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<EvaluationsController>(EvaluationsController);
    jest.clearAllMocks();
  });

  describe('GET /me/evaluations', () => {
    it('should return paginated evaluations', async () => {
      mockUsersService.findByFirebaseUid.mockResolvedValue({ _id: userId });
      mockEvalsService.findByUserId.mockResolvedValue({ evaluations: [], total: 0 });

      const result = await controller.getHistory(firebaseUser, '1', '20');

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 0 });
    });

    it('should throw 404 if user profile not found', async () => {
      mockUsersService.findByFirebaseUid.mockResolvedValue(null);

      await expect(controller.getHistory(firebaseUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /me/evaluations/:id', () => {
    it('should return a specific evaluation', async () => {
      const evalDoc = { _id: 'eval-id', request: {}, result: {} };
      mockUsersService.findByFirebaseUid.mockResolvedValue({ _id: userId });
      mockEvalsService.findOneByIdAndUserId.mockResolvedValue(evalDoc);

      const result = await controller.getEvaluation(firebaseUser, 'eval-id');

      expect(result).toEqual({ data: evalDoc });
    });

    it('should throw 404 if evaluation not found', async () => {
      mockUsersService.findByFirebaseUid.mockResolvedValue({ _id: userId });
      mockEvalsService.findOneByIdAndUserId.mockResolvedValue(null);

      await expect(controller.getEvaluation(firebaseUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw 404 if user profile not found (hides existence)', async () => {
      mockUsersService.findByFirebaseUid.mockResolvedValue(null);

      await expect(controller.getEvaluation(firebaseUser, 'eval-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 7: Run tests**

```bash
cd C:\repos\car\car-point-api
npx jest src/evaluations/ --verbose
```

Expected: All tests passing.

- [ ] **Step 8: Commit**

```bash
cd C:\repos\car\car-point-api
git add src/evaluations/
git commit -m "feat: add evaluations module for history storage and retrieval"
```

---

### Task 6: Evaluate Module (Core Endpoint)

**Files:**
- Create: `src/evaluate/dto/evaluate-request.dto.ts`
- Create: `src/evaluate/evaluate.service.ts`
- Create: `src/evaluate/evaluate.controller.ts`
- Create: `src/evaluate/evaluate.module.ts`
- Test: `src/evaluate/evaluate.service.spec.ts`
- Test: `src/evaluate/evaluate.controller.spec.ts`

- [ ] **Step 1: Write the request DTO with validation**

Write to `src/evaluate/dto/evaluate-request.dto.ts`:

```typescript
import {
  IsString,
  IsInt,
  IsBoolean,
  IsNumber,
  IsIn,
  IsOptional,
  Min,
} from 'class-validator';

export class EvaluateRequestDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

  @IsString()
  @IsOptional()
  bodyType?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsIn(['petrol', 'diesel', 'hybrid', 'LPG'])
  engine: string;

  @IsInt()
  @Min(0)
  mileage: number;

  @IsString()
  @IsIn(['automatic', 'semi-automatic', 'manual'])
  transmission: string;

  @IsString()
  @IsIn(['AWD', 'FWD', 'RWD'])
  drive: string;

  @IsBoolean()
  isNew: boolean;

  @IsInt()
  @IsOptional()
  numberOfSeats?: number;

  @IsString()
  @IsIn(['excellent', 'good', 'fair', 'poor'])
  condition: string;

  @IsString()
  @IsOptional()
  market?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

- [ ] **Step 2: Write the evaluate service**

Write to `src/evaluate/evaluate.service.ts`:

```typescript
import { Injectable, BadGatewayException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  CarPointGrpcService,
  CarPointRequest,
  CarPointResponse,
} from '../grpc/car-point-grpc.service.js';
import { EvaluationsService } from '../evaluations/evaluations.service.js';
import { EvaluateRequestDto } from './dto/evaluate-request.dto.js';

@Injectable()
export class EvaluateService {
  constructor(
    private readonly grpcService: CarPointGrpcService,
    private readonly evaluationsService: EvaluationsService,
  ) {}

  async evaluate(
    dto: EvaluateRequestDto,
    userId?: Types.ObjectId,
  ): Promise<CarPointResponse> {
    const grpcRequest: CarPointRequest = {
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      body_type: dto.bodyType ?? '',
      color: dto.color ?? '',
      engine: dto.engine,
      mileage: dto.mileage,
      transmission: dto.transmission,
      drive: dto.drive,
      is_new: dto.isNew,
      number_of_seats: dto.numberOfSeats ?? 0,
      condition: dto.condition,
      market: dto.market ?? '',
      city: dto.city ?? '',
      price: dto.price,
    };

    let result: CarPointResponse;
    try {
      result = await this.grpcService.getCarPoint(grpcRequest);
    } catch {
      throw new BadGatewayException('Scoring service unavailable');
    }

    if (userId) {
      await this.evaluationsService.create({
        userId,
        request: grpcRequest,
        result,
      });
    }

    return result;
  }
}
```

- [ ] **Step 3: Write the evaluate controller**

Write to `src/evaluate/evaluate.controller.ts`:

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard } from '../auth/optional-auth.guard.js';
import { CurrentUser, FirebaseUser } from '../auth/current-user.decorator.js';
import { UsersService } from '../users/users.service.js';
import { EvaluateService } from './evaluate.service.js';
import { EvaluateRequestDto } from './dto/evaluate-request.dto.js';

@Controller('evaluate')
export class EvaluateController {
  constructor(
    private readonly evaluateService: EvaluateService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  async evaluate(
    @Body() dto: EvaluateRequestDto,
    @CurrentUser() firebaseUser: FirebaseUser | null,
  ) {
    let userId = undefined;

    if (firebaseUser) {
      const userDoc = await this.usersService.findByFirebaseUid(firebaseUser.uid);
      if (userDoc) {
        userId = userDoc._id;
      }
    }

    const result = await this.evaluateService.evaluate(dto, userId);
    return { data: result };
  }
}
```

- [ ] **Step 4: Write the evaluate module**

Write to `src/evaluate/evaluate.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { EvaluateController } from './evaluate.controller.js';
import { EvaluateService } from './evaluate.service.js';
import { GrpcModule } from '../grpc/grpc.module.js';
import { EvaluationsModule } from '../evaluations/evaluations.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [GrpcModule, EvaluationsModule, UsersModule],
  controllers: [EvaluateController],
  providers: [EvaluateService],
})
export class EvaluateModule {}
```

- [ ] **Step 5: Write evaluate service test**

Write to `src/evaluate/evaluate.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadGatewayException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EvaluateService } from './evaluate.service.js';
import { CarPointGrpcService } from '../grpc/car-point-grpc.service.js';
import { EvaluationsService } from '../evaluations/evaluations.service.js';

describe('EvaluateService', () => {
  let service: EvaluateService;

  const mockGrpcService = { getCarPoint: jest.fn() };
  const mockEvalsService = { create: jest.fn() };

  const dto = {
    brand: 'Toyota', model: 'Corolla', year: 2020,
    engine: 'petrol', mileage: 45000, transmission: 'automatic',
    drive: 'FWD', isNew: false, condition: 'good', price: 15000,
  };

  const grpcResponse = {
    quality_score: 72,
    quality_status: 'EXCELLENT',
    price: { listed: 15000, average: 18000, deviation: -16.67, price_status: 'GREAT_DEAL' },
    score_breakdown: {
      mileage_score: 25, age_score: 11, reliability_score: 16,
      condition_score: 10, depreciation_score: 10,
      transmission_score: 5, drive_score: 3, engine_score: 3,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluateService,
        { provide: CarPointGrpcService, useValue: mockGrpcService },
        { provide: EvaluationsService, useValue: mockEvalsService },
      ],
    }).compile();

    service = module.get<EvaluateService>(EvaluateService);
    jest.clearAllMocks();
  });

  it('should call gRPC and return result (anonymous)', async () => {
    mockGrpcService.getCarPoint.mockResolvedValue(grpcResponse);

    const result = await service.evaluate(dto as any);

    expect(result).toEqual(grpcResponse);
    expect(mockEvalsService.create).not.toHaveBeenCalled();
  });

  it('should save evaluation when userId is provided', async () => {
    mockGrpcService.getCarPoint.mockResolvedValue(grpcResponse);
    const userId = new Types.ObjectId();

    await service.evaluate(dto as any, userId);

    expect(mockEvalsService.create).toHaveBeenCalledWith({
      userId,
      request: expect.objectContaining({ brand: 'Toyota' }),
      result: grpcResponse,
    });
  });

  it('should throw BadGatewayException when gRPC fails', async () => {
    mockGrpcService.getCarPoint.mockRejectedValue(new Error('Connection refused'));

    await expect(service.evaluate(dto as any)).rejects.toThrow(BadGatewayException);
  });
});
```

- [ ] **Step 6: Write evaluate controller test**

Write to `src/evaluate/evaluate.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EvaluateController } from './evaluate.controller.js';
import { EvaluateService } from './evaluate.service.js';
import { UsersService } from '../users/users.service.js';
import { Types } from 'mongoose';

describe('EvaluateController', () => {
  let controller: EvaluateController;

  const mockEvaluateService = { evaluate: jest.fn() };
  const mockUsersService = { findByFirebaseUid: jest.fn() };

  const dto = {
    brand: 'Toyota', model: 'Corolla', year: 2020,
    engine: 'petrol', mileage: 45000, transmission: 'automatic',
    drive: 'FWD', isNew: false, condition: 'good', price: 15000,
  };

  const grpcResponse = { quality_score: 72, quality_status: 'EXCELLENT' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluateController],
      providers: [
        { provide: EvaluateService, useValue: mockEvaluateService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<EvaluateController>(EvaluateController);
    jest.clearAllMocks();
  });

  it('should evaluate without auth (anonymous)', async () => {
    mockEvaluateService.evaluate.mockResolvedValue(grpcResponse);

    const result = await controller.evaluate(dto as any, null);

    expect(result).toEqual({ data: grpcResponse });
    expect(mockEvaluateService.evaluate).toHaveBeenCalledWith(dto, undefined);
  });

  it('should evaluate with auth and pass userId', async () => {
    const userId = new Types.ObjectId();
    mockUsersService.findByFirebaseUid.mockResolvedValue({ _id: userId });
    mockEvaluateService.evaluate.mockResolvedValue(grpcResponse);

    const firebaseUser = { uid: 'uid-123', email: 'test@example.com' };
    const result = await controller.evaluate(dto as any, firebaseUser);

    expect(result).toEqual({ data: grpcResponse });
    expect(mockEvaluateService.evaluate).toHaveBeenCalledWith(dto, userId);
  });

  it('should evaluate without saving if user has no profile', async () => {
    mockUsersService.findByFirebaseUid.mockResolvedValue(null);
    mockEvaluateService.evaluate.mockResolvedValue(grpcResponse);

    const firebaseUser = { uid: 'uid-123', email: 'test@example.com' };
    const result = await controller.evaluate(dto as any, firebaseUser);

    expect(result).toEqual({ data: grpcResponse });
    expect(mockEvaluateService.evaluate).toHaveBeenCalledWith(dto, undefined);
  });
});
```

- [ ] **Step 7: Run tests**

```bash
cd C:\repos\car\car-point-api
npx jest src/evaluate/ --verbose
```

Expected: All tests passing.

- [ ] **Step 8: Commit**

```bash
cd C:\repos\car\car-point-api
git add src/evaluate/
git commit -m "feat: add evaluate module with gRPC proxy and optional history save"
```

---

### Task 7: Brands Module

**Files:**
- Create: `src/brands/brands.service.ts`
- Create: `src/brands/brands.controller.ts`
- Create: `src/brands/brands.module.ts`
- Test: `src/brands/brands.service.spec.ts`
- Test: `src/brands/brands.controller.spec.ts`

- [ ] **Step 1: Write the brands service**

Write to `src/brands/brands.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class BrandsService {
  constructor(
    @InjectConnection('carpoint') private connection: Connection,
  ) {}

  async getBrands(): Promise<string[]> {
    const brands = await this.connection
      .collection('car_prices')
      .distinct('brand');
    return brands.sort((a, b) => a.localeCompare(b));
  }

  async getModels(brand: string): Promise<string[]> {
    const models = await this.connection
      .collection('car_prices')
      .distinct('model', { brand: brand.toLowerCase() });
    return models.sort((a, b) => a.localeCompare(b));
  }
}
```

- [ ] **Step 2: Write the brands controller**

Write to `src/brands/brands.controller.ts`:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { BrandsService } from './brands.service.js';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  async getBrands() {
    const brands = await this.brandsService.getBrands();
    return { data: brands };
  }

  @Get(':brand/models')
  async getModels(@Param('brand') brand: string) {
    const models = await this.brandsService.getModels(brand);
    return { data: models };
  }
}
```

- [ ] **Step 3: Write the brands module**

Write to `src/brands/brands.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller.js';
import { BrandsService } from './brands.service.js';

@Module({
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
```

- [ ] **Step 4: Write brands service test**

Write to `src/brands/brands.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { BrandsService } from './brands.service.js';

describe('BrandsService', () => {
  let service: BrandsService;

  const mockCollection = {
    distinct: jest.fn(),
  };

  const mockConnection = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: getConnectionToken('carpoint'), useValue: mockConnection },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    jest.clearAllMocks();
    mockConnection.collection.mockReturnValue(mockCollection);
  });

  it('should return sorted brands', async () => {
    mockCollection.distinct.mockResolvedValue(['toyota', 'bmw', 'mercedes']);

    const result = await service.getBrands();

    expect(result).toEqual(['bmw', 'mercedes', 'toyota']);
    expect(mockConnection.collection).toHaveBeenCalledWith('car_prices');
    expect(mockCollection.distinct).toHaveBeenCalledWith('brand');
  });

  it('should return sorted models for a brand', async () => {
    mockCollection.distinct.mockResolvedValue(['corolla', 'camry', 'rav4']);

    const result = await service.getModels('Toyota');

    expect(result).toEqual(['camry', 'corolla', 'rav4']);
    expect(mockCollection.distinct).toHaveBeenCalledWith('model', { brand: 'toyota' });
  });
});
```

- [ ] **Step 5: Write brands controller test**

Write to `src/brands/brands.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BrandsController } from './brands.controller.js';
import { BrandsService } from './brands.service.js';

describe('BrandsController', () => {
  let controller: BrandsController;

  const mockBrandsService = {
    getBrands: jest.fn(),
    getModels: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [{ provide: BrandsService, useValue: mockBrandsService }],
    }).compile();

    controller = module.get<BrandsController>(BrandsController);
    jest.clearAllMocks();
  });

  it('GET /brands should return brands', async () => {
    mockBrandsService.getBrands.mockResolvedValue(['bmw', 'toyota']);

    const result = await controller.getBrands();

    expect(result).toEqual({ data: ['bmw', 'toyota'] });
  });

  it('GET /brands/:brand/models should return models', async () => {
    mockBrandsService.getModels.mockResolvedValue(['camry', 'corolla']);

    const result = await controller.getModels('toyota');

    expect(result).toEqual({ data: ['camry', 'corolla'] });
  });
});
```

- [ ] **Step 6: Run tests**

```bash
cd C:\repos\car\car-point-api
npx jest src/brands/ --verbose
```

Expected: All tests passing.

- [ ] **Step 7: Commit**

```bash
cd C:\repos\car\car-point-api
git add src/brands/
git commit -m "feat: add brands module for brand/model lookup endpoints"
```

---

### Task 8: App Module + Rate Limiting

**Files:**
- Modify: `src/app.module.ts`
- Remove: `src/app.controller.ts` (generated by scaffold, not needed)
- Remove: `src/app.service.ts` (generated by scaffold, not needed)
- Remove: `src/app.controller.spec.ts` (generated by scaffold, not needed)

- [ ] **Step 1: Write the app module**

Write to `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { GrpcModule } from './grpc/grpc.module.js';
import { UsersModule } from './users/users.module.js';
import { EvaluationsModule } from './evaluations/evaluations.module.js';
import { EvaluateModule } from './evaluate/evaluate.module.js';
import { BrandsModule } from './brands/brands.module.js';

@Module({
  imports: [
    // App's own database (users, evaluations)
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/car-point-api',
    ),
    // Car-point's database (read-only, for brand/model lookups)
    MongooseModule.forRoot(
      process.env.CAR_POINT_MONGODB_URI ?? 'mongodb://localhost:27017/car-point',
      { connectionName: 'carpoint' },
    ),
    // Rate limiting: 20 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    AuthModule,
    GrpcModule,
    UsersModule,
    EvaluationsModule,
    EvaluateModule,
    BrandsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Remove scaffold files**

```bash
cd C:\repos\car\car-point-api
rm -f src/app.controller.ts src/app.service.ts src/app.controller.spec.ts
```

- [ ] **Step 3: Verify the project builds**

```bash
cd C:\repos\car\car-point-api
npm run build
```

Expected: Successful compilation.

- [ ] **Step 4: Run all tests**

```bash
cd C:\repos\car\car-point-api
npx jest --verbose
```

Expected: All tests passing across all modules.

- [ ] **Step 5: Commit**

```bash
cd C:\repos\car\car-point-api
git add -A
git commit -m "feat: wire up app module with all features and rate limiting"
```
