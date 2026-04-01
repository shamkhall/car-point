import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarPrice } from '../schemas/car-price.schema.js';
import { PriceInfoDto } from '../dto/car-point-response.dto.js';

export interface PriceQuery {
  brand: string;
  model: string;
  year: number;
  bodyType: string;
  engine: string;
  transmission: string;
  drive: string;
  listedPrice: number;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(CarPrice.name) private priceModel: Model<CarPrice>,
  ) {}

  async getPriceInfo(query: PriceQuery): Promise<PriceInfoDto> {
    const filter: Record<string, any> = {
      brand: query.brand.toLowerCase(),
      model: query.model.toLowerCase(),
      year: query.year,
    };

    let result = await this.priceModel.aggregate([
      { $match: filter },
      { $group: { _id: null, avgPrice: { $avg: '$price' } } },
    ]);

    if (!result.length) {
      // Broader fallback: brand + model only
      result = await this.priceModel.aggregate([
        { $match: { brand: filter.brand, model: filter.model } },
        { $group: { _id: null, avgPrice: { $avg: '$price' } } },
      ]);
    }

    if (!result.length) {
      return { listed: query.listedPrice, average: null, deviation: 0 };
    }

    const average = Math.round(result[0].avgPrice);
    const deviation = Math.round(((query.listedPrice - average) / average) * 10000) / 100;

    return {
      listed: query.listedPrice,
      average,
      deviation,
    };
  }
}
