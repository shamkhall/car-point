import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarSafety } from '../schemas/car-safety.schema.js';
import { SAFETY_STAR_SCORES, SAFETY_DEFAULT_SCORE } from '../scoring/scoring.config.js';

@Injectable()
export class SafetyService {
  constructor(
    @InjectModel(CarSafety.name) private safetyModel: Model<CarSafety>,
  ) {}

  async getSafetyScore(brand: string, model: string): Promise<number> {
    const result = await this.safetyModel
      .findOne({
        brand: brand.toLowerCase(),
        model: model.toLowerCase(),
      })
      .lean()
      .exec();

    if (!result) return SAFETY_DEFAULT_SCORE;

    return SAFETY_STAR_SCORES[result.stars] ?? SAFETY_DEFAULT_SCORE;
  }
}
