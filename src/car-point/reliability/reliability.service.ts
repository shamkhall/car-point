import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarReliability } from '../schemas/car-reliability.schema.js';
import { RELIABILITY_TIER_SCORES } from '../scoring/scoring.config.js';

@Injectable()
export class ReliabilityService {
  constructor(
    @InjectModel(CarReliability.name) private reliabilityModel: Model<CarReliability>,
  ) {}

  async getReliabilityScore(brand: string, model: string): Promise<number> {
    const normalizedBrand = brand.toLowerCase();
    const normalizedModel = model.toLowerCase();

    const exact = await this.reliabilityModel
      .findOne({ brand: normalizedBrand, model: normalizedModel })
      .lean()
      .exec();

    if (exact) {
      return RELIABILITY_TIER_SCORES[exact.tier] ?? RELIABILITY_TIER_SCORES['D'];
    }

    const brandOnly = await this.reliabilityModel
      .findOne({ brand: normalizedBrand, model: null })
      .lean()
      .exec();

    if (brandOnly) {
      return RELIABILITY_TIER_SCORES[brandOnly.tier] ?? RELIABILITY_TIER_SCORES['D'];
    }

    return RELIABILITY_TIER_SCORES['D'];
  }
}
