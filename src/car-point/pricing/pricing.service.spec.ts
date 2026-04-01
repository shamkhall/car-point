import { PricingService } from './pricing.service.js';

describe('PricingService', () => {
  let service: PricingService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      aggregate: jest.fn(),
    };
    service = new PricingService(mockModel);
  });

  it('should return average price and deviation', async () => {
    mockModel.aggregate.mockResolvedValue([{ avgPrice: 18500 }]);

    const result = await service.getPriceInfo({
      brand: 'Toyota',
      model: 'Camry',
      year: 2018,
      bodyType: 'sedan',
      engine: '2.5L petrol',
      transmission: 'automatic',
      drive: 'FWD',
      listedPrice: 16200,
    });

    expect(result.listed).toBe(16200);
    expect(result.average).toBe(18500);
    expect(result.deviation).toBeCloseTo(-12.43, 1);
    expect(result.priceStatus).toBe('Fair Price');
  });

  it('should return 0 deviation when average matches listed', async () => {
    mockModel.aggregate.mockResolvedValue([{ avgPrice: 20000 }]);

    const result = await service.getPriceInfo({
      brand: 'Toyota',
      model: 'Camry',
      year: 2020,
      bodyType: 'sedan',
      engine: '2.5L petrol',
      transmission: 'automatic',
      drive: 'FWD',
      listedPrice: 20000,
    });

    expect(result.deviation).toBe(0);
  });

  it('should fallback to ±3 year range when exact year not found', async () => {
    mockModel.aggregate
      .mockResolvedValueOnce([]) // exact year: no results
      .mockResolvedValueOnce([{ avgPrice: 8000 }]); // ±3 year fallback

    const result = await service.getPriceInfo({
      brand: 'BMW',
      model: '528',
      year: 1998,
      bodyType: 'sedan',
      engine: 'petrol',
      transmission: 'automatic',
      drive: 'RWD',
      listedPrice: 7000,
    });

    expect(result.average).toBe(8000);
    expect(result.deviation).toBe(-12.5);
    expect(result.priceStatus).toBe('Fair Price');
    expect(mockModel.aggregate).toHaveBeenCalledTimes(2);
  });

  it('should return null average and 0 deviation when no data found', async () => {
    mockModel.aggregate
      .mockResolvedValueOnce([])  // exact year
      .mockResolvedValueOnce([]); // ±3 year fallback

    const result = await service.getPriceInfo({
      brand: 'Unknown',
      model: 'Car',
      year: 2020,
      bodyType: 'sedan',
      engine: '2.0L petrol',
      transmission: 'automatic',
      drive: 'FWD',
      listedPrice: 15000,
    });

    expect(result.average).toBeNull();
    expect(result.deviation).toBe(0);
    expect(result.priceStatus).toBe('Fair Price');
  });

  it('should return Great Deal for deviation below -15%', async () => {
    mockModel.aggregate.mockResolvedValue([{ avgPrice: 10000 }]);

    const result = await service.getPriceInfo({
      brand: 'BMW',
      model: '528',
      year: 1998,
      bodyType: 'sedan',
      engine: 'petrol',
      transmission: 'automatic',
      drive: 'RWD',
      listedPrice: 7000,
    });

    expect(result.priceStatus).toBe('Great Deal');
  });

  it('should return Overpriced for deviation above 15%', async () => {
    mockModel.aggregate.mockResolvedValue([{ avgPrice: 10000 }]);

    const result = await service.getPriceInfo({
      brand: 'BMW',
      model: '528',
      year: 1998,
      bodyType: 'sedan',
      engine: 'petrol',
      transmission: 'automatic',
      drive: 'RWD',
      listedPrice: 13000,
    });

    expect(result.priceStatus).toBe('Overpriced');
  });
});
