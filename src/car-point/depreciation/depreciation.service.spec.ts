import { DepreciationService } from './depreciation.service.js';

describe('DepreciationService', () => {
  let service: DepreciationService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findOne: jest.fn(),
    };
    service = new DepreciationService(mockModel);
  });

  it('should return 10 for retention >= 70%', async () => {
    mockModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ retentionPercent: 75 }),
      }),
    });

    const score = await service.getDepreciationScore('Toyota', 'Camry');
    expect(score).toBe(10);
  });

  it('should return 7 for retention 55-70%', async () => {
    mockModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ retentionPercent: 60 }),
      }),
    });

    const score = await service.getDepreciationScore('BMW', '3 Series');
    expect(score).toBe(7);
  });

  it('should return 4 for retention 40-55%', async () => {
    mockModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ retentionPercent: 45 }),
      }),
    });

    const score = await service.getDepreciationScore('Peugeot', '308');
    expect(score).toBe(4);
  });

  it('should return 2 when no data found', async () => {
    mockModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    const score = await service.getDepreciationScore('Unknown', 'Car');
    expect(score).toBe(2);
  });
});
