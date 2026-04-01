import { ReliabilityService } from './reliability.service.js';
import { RELIABILITY_TIER_SCORES } from '../scoring/scoring.config.js';

describe('ReliabilityService', () => {
  let service: ReliabilityService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findOne: jest.fn(),
    };
    service = new ReliabilityService(mockModel);
  });

  it('should return tier score when brand+model found', async () => {
    mockModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ tier: 'S' }),
      }),
    });

    const score = await service.getReliabilityScore('Toyota', 'Camry');
    expect(score).toBe(RELIABILITY_TIER_SCORES['S']);
    expect(mockModel.findOne).toHaveBeenCalledWith({ brand: 'toyota', model: 'camry' });
  });

  it('should fallback to brand-only lookup when model not found', async () => {
    mockModel.findOne
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ tier: 'A' }),
        }),
      });

    const score = await service.getReliabilityScore('Mazda', 'UnknownModel');
    expect(score).toBe(RELIABILITY_TIER_SCORES['A']);
  });

  it('should return D tier score when nothing found', async () => {
    mockModel.findOne
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

    const score = await service.getReliabilityScore('UnknownBrand', 'UnknownModel');
    expect(score).toBe(RELIABILITY_TIER_SCORES['D']);
  });
});
