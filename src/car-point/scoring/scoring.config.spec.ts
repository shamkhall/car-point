import {
  CONDITION_SCORES,
  TRANSMISSION_SCORES,
  DRIVE_SCORES,
  ENGINE_SCORES,
  RELIABILITY_TIER_SCORES,
  getDepreciationScore,
} from './scoring.config.js';

describe('ScoringConfig', () => {
  it('should have condition scores summing to correct max of 15', () => {
    expect(CONDITION_SCORES['excellent']).toBe(15);
    expect(CONDITION_SCORES['poor']).toBe(1);
  });

  it('should have transmission scores with max of 5', () => {
    expect(TRANSMISSION_SCORES['automatic']).toBe(5);
    expect(TRANSMISSION_SCORES['manual']).toBe(1);
  });

  it('should have drive scores with max of 5', () => {
    expect(DRIVE_SCORES['AWD']).toBe(5);
    expect(DRIVE_SCORES['RWD']).toBe(1);
  });

  it('should have engine scores with max of 5', () => {
    expect(ENGINE_SCORES['hybrid']).toBe(5);
    expect(ENGINE_SCORES['LPG']).toBe(1);
  });

  it('should have reliability tier scores with max of 20, min of 4', () => {
    expect(RELIABILITY_TIER_SCORES['S']).toBe(20);
    expect(RELIABILITY_TIER_SCORES['D']).toBe(4);
  });

  it('should return correct depreciation score for retention >= 70', () => {
    expect(getDepreciationScore(75)).toBe(10);
  });

  it('should return correct depreciation score for retention 55-70', () => {
    expect(getDepreciationScore(60)).toBe(7);
  });

  it('should return correct depreciation score for retention 40-55', () => {
    expect(getDepreciationScore(45)).toBe(4);
  });

  it('should return correct depreciation score for retention < 40', () => {
    expect(getDepreciationScore(30)).toBe(2);
  });
});
