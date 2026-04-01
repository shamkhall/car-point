import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarDepreciation } from '../schemas/car-depreciation.schema.js';
import { getDepreciationScore } from '../scoring/scoring.config.js';

@Injectable()
export class DepreciationService {
  constructor(
    @InjectModel(CarDepreciation.name) private depreciationModel: Model<CarDepreciation>,
  ) {}

  async getDepreciationScore(brand: string, model: string): Promise<number> {
    const result = await this.depreciationModel
      .findOne({
        brand: brand.toLowerCase(),
        model: model.toLowerCase(),
      })
      .lean()
      .exec();

    if (!result) return 2;

    return getDepreciationScore(result.retentionPercent);
  }
}
