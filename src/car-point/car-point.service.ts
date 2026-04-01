import { Injectable } from '@nestjs/common';
import { ScoringService } from './scoring/scoring.service.js';
import { ReliabilityService } from './reliability/reliability.service.js';
import { DepreciationService } from './depreciation/depreciation.service.js';
import { PricingService } from './pricing/pricing.service.js';
import { CarPointRequestDto } from './dto/car-point-request.dto.js';
import { CarPointResponseDto } from './dto/car-point-response.dto.js';

@Injectable()
export class CarPointService {
  constructor(
    private readonly scoringService: ScoringService,
    private readonly reliabilityService: ReliabilityService,
    private readonly depreciationService: DepreciationService,
    private readonly pricingService: PricingService,
  ) {}

  async getCarPoint(request: CarPointRequestDto): Promise<CarPointResponseDto> {
    const currentYear = new Date().getFullYear();

    const [reliabilityScore, depreciationScore, priceInfo] =
      await Promise.all([
        this.reliabilityService.getReliabilityScore(request.brand, request.model),
        this.depreciationService.getDepreciationScore(request.brand, request.model),
        this.pricingService.getPriceInfo({
          brand: request.brand,
          model: request.model,
          year: request.year,
          bodyType: request.bodyType,
          engine: request.engine,
          transmission: request.transmission,
          drive: request.drive,
          listedPrice: request.price,
        }),
      ]);

    let mileageScore: number;
    let ageScore: number;
    let conditionScore: number;

    if (request.isNew) {
      mileageScore = 25;
      ageScore = 15;
      conditionScore = 15;
    } else {
      mileageScore = this.scoringService.calculateMileageScore(
        request.mileage, request.year, currentYear,
      );
      ageScore = this.scoringService.calculateAgeScore(request.year, currentYear);
      conditionScore = this.scoringService.calculateConditionScore(request.condition);
    }

    const transmissionScore = this.scoringService.calculateTransmissionScore(request.transmission);
    const driveScore = this.scoringService.calculateDriveScore(request.drive);
    const engineScore = this.scoringService.calculateEngineScore(request.engine);

    const totalScore = mileageScore + ageScore + conditionScore +
      reliabilityScore + depreciationScore +
      transmissionScore + driveScore + engineScore;

    const qualityScore = this.scoringService.clampScore(totalScore);

    return {
      qualityScore,
      qualityStatus: this.scoringService.getQualityStatus(qualityScore),
      price: priceInfo,
      scoreBreakdown: {
        mileageScore,
        ageScore,
        reliabilityScore,
        conditionScore,
        depreciationScore,
        transmissionScore,
        driveScore,
        engineScore,
      },
    };
  }
}
