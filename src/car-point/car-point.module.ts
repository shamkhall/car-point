import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarPointController } from './car-point.controller.js';
import { CarPointService } from './car-point.service.js';
import { ScoringService } from './scoring/scoring.service.js';
import { ReliabilityService } from './reliability/reliability.service.js';
import { SafetyService } from './safety/safety.service.js';
import { DepreciationService } from './depreciation/depreciation.service.js';
import { PricingService } from './pricing/pricing.service.js';
import { CarPrice, CarPriceSchema } from './schemas/car-price.schema.js';
import { CarReliability, CarReliabilitySchema } from './schemas/car-reliability.schema.js';
import { CarSafety, CarSafetySchema } from './schemas/car-safety.schema.js';
import { CarDepreciation, CarDepreciationSchema } from './schemas/car-depreciation.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarPrice.name, schema: CarPriceSchema },
      { name: CarReliability.name, schema: CarReliabilitySchema },
      { name: CarSafety.name, schema: CarSafetySchema },
      { name: CarDepreciation.name, schema: CarDepreciationSchema },
    ]),
  ],
  controllers: [CarPointController],
  providers: [
    CarPointService,
    ScoringService,
    ReliabilityService,
    SafetyService,
    DepreciationService,
    PricingService,
  ],
})
export class CarPointModule {}
