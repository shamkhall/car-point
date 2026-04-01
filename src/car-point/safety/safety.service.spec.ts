import { SafetyService } from './safety.service.js';
import { SAFETY_STAR_SCORES, SAFETY_DEFAULT_SCORE } from '../scoring/scoring.config.js';

describe('SafetyService', () => {
  let service: SafetyService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findOne: jest.fn(),
    };
    service = new SafetyService(mockModel);
  });

  it('should return star score when brand+model found', async () => {
    mockModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ stars: 5 }),
      }),
    });

    const score = await service.getSafetyScore('Toyota', 'Camry');
    expect(score).toBe(SAFETY_STAR_SCORES[5]);
  });

  it('should return default score when not found', async () => {
    mockModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    const score = await service.getSafetyScore('Unknown', 'Car');
    expect(score).toBe(SAFETY_DEFAULT_SCORE);
  });
});
