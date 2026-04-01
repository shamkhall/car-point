import { CarPointService } from './car-point.service.js';
import { ScoringService } from './scoring/scoring.service.js';
import { ReliabilityService } from './reliability/reliability.service.js';
import { SafetyService } from './safety/safety.service.js';
import { DepreciationService } from './depreciation/depreciation.service.js';
import { PricingService } from './pricing/pricing.service.js';

describe('CarPointService', () => {
  let service: CarPointService;
  let scoringService: ScoringService;
  let reliabilityService: jest.Mocked<ReliabilityService>;
  let safetyService: jest.Mocked<SafetyService>;
  let depreciationService: jest.Mocked<DepreciationService>;
  let pricingService: jest.Mocked<PricingService>;

  beforeEach(() => {
    scoringService = new ScoringService();

    reliabilityService = {
      getReliabilityScore: jest.fn().mockResolvedValue(15),
    } as any;

    safetyService = {
      getSafetyScore: jest.fn().mockResolvedValue(10),
    } as any;

    depreciationService = {
      getDepreciationScore: jest.fn().mockResolvedValue(10),
    } as any;

    pricingService = {
      getPriceInfo: jest.fn().mockResolvedValue({
        listed: 16200,
        average: 18500,
        deviation: -12.43,
      }),
    } as any;

    service = new CarPointService(
      scoringService,
      reliabilityService,
      safetyService,
      depreciationService,
      pricingService,
    );
  });

  it('should return full car point response for a good car', async () => {
    const result = await service.getCarPoint({
      brand: 'Toyota',
      model: 'Camry',
      year: 2022,
      bodyType: 'sedan',
      color: 'white',
      engine: 'hybrid',
      mileage: 30000,
      transmission: 'automatic',
      drive: 'FWD',
      isNew: false,
      numberOfSeats: 5,
      condition: 'excellent',
      market: 'Azerbaijan',
      city: 'Baku',
      price: 16200,
    });

    expect(result.qualityScore).toBeGreaterThan(70);
    expect(result.qualityScore).toBeLessThanOrEqual(100);
    expect(result.price.listed).toBe(16200);
    expect(result.price.average).toBe(18500);
    expect(result.price.deviation).toBe(-12.43);
    expect(result.scoreBreakdown.mileageScore).toBeDefined();
    expect(result.scoreBreakdown.reliabilityScore).toBe(15);
    expect(result.scoreBreakdown.safetyScore).toBe(10);
    expect(result.scoreBreakdown.depreciationScore).toBe(10);
  });

  it('should override scores for new car', async () => {
    const result = await service.getCarPoint({
      brand: 'Toyota',
      model: 'Camry',
      year: 2026,
      bodyType: 'sedan',
      color: 'white',
      engine: 'hybrid',
      mileage: 0,
      transmission: 'automatic',
      drive: 'FWD',
      isNew: true,
      numberOfSeats: 5,
      condition: 'excellent',
      market: 'Azerbaijan',
      city: 'Baku',
      price: 35000,
    });

    expect(result.scoreBreakdown.mileageScore).toBe(20);
    expect(result.scoreBreakdown.ageScore).toBe(15);
    expect(result.scoreBreakdown.conditionScore).toBe(15);
  });

  it('should clamp score to 1-100', async () => {
    reliabilityService.getReliabilityScore.mockResolvedValue(15);
    safetyService.getSafetyScore.mockResolvedValue(10);
    depreciationService.getDepreciationScore.mockResolvedValue(10);

    const result = await service.getCarPoint({
      brand: 'Toyota',
      model: 'Camry',
      year: 2026,
      bodyType: 'sedan',
      color: 'white',
      engine: 'hybrid',
      mileage: 0,
      transmission: 'automatic',
      drive: 'AWD',
      isNew: true,
      numberOfSeats: 5,
      condition: 'excellent',
      market: 'Azerbaijan',
      city: 'Baku',
      price: 35000,
    });

    expect(result.qualityScore).toBeLessThanOrEqual(100);
    expect(result.qualityScore).toBeGreaterThanOrEqual(1);
  });
});
