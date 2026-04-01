import { ScoringService } from './scoring.service.js';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  describe('calculateMileageScore', () => {
    it('should return 20 for 10k km/year or less', () => {
      expect(service.calculateMileageScore(30000, 2023, 2026)).toBe(20);
    });

    it('should return 0 for 40k km/year or more', () => {
      expect(service.calculateMileageScore(120000, 2023, 2026)).toBe(0);
    });

    it('should interpolate for values between 10k-40k', () => {
      // 25k km/year = halfway -> 10 pts
      const score = service.calculateMileageScore(75000, 2023, 2026);
      expect(score).toBe(10);
    });

    it('should return 20 for brand new car (age 0)', () => {
      expect(service.calculateMileageScore(0, 2026, 2026)).toBe(20);
    });
  });

  describe('calculateAgeScore', () => {
    it('should return 15 for age 0', () => {
      expect(service.calculateAgeScore(2026, 2026)).toBe(15);
    });

    it('should return 0 for age >= 20', () => {
      expect(service.calculateAgeScore(2006, 2026)).toBe(0);
      expect(service.calculateAgeScore(2000, 2026)).toBe(0);
    });

    it('should return 7.5 for age 10', () => {
      expect(service.calculateAgeScore(2016, 2026)).toBe(7.5);
    });
  });

  describe('calculateStaticScores', () => {
    it('should return correct condition score', () => {
      expect(service.calculateConditionScore('excellent')).toBe(15);
      expect(service.calculateConditionScore('poor')).toBe(1);
    });

    it('should return 0 for unknown condition', () => {
      expect(service.calculateConditionScore('unknown')).toBe(0);
    });

    it('should return correct transmission score', () => {
      expect(service.calculateTransmissionScore('automatic')).toBe(5);
    });

    it('should return 0 for unknown transmission', () => {
      expect(service.calculateTransmissionScore('unknown')).toBe(0);
    });

    it('should return correct drive score', () => {
      expect(service.calculateDriveScore('AWD')).toBe(5);
    });

    it('should return 0 for unknown drive', () => {
      expect(service.calculateDriveScore('unknown')).toBe(0);
    });

    it('should return correct engine score', () => {
      expect(service.calculateEngineScore('hybrid')).toBe(5);
    });

    it('should return 0 for unknown engine type', () => {
      expect(service.calculateEngineScore('unknown')).toBe(0);
    });
  });

  describe('clampScore', () => {
    it('should clamp total to 1-100', () => {
      expect(service.clampScore(0)).toBe(1);
      expect(service.clampScore(150)).toBe(100);
      expect(service.clampScore(72)).toBe(72);
    });
  });
});
