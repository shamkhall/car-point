export const CONDITION_SCORES: Record<string, number> = {
  excellent: 15,
  good: 10,
  fair: 5,
  poor: 1,
};

export const TRANSMISSION_SCORES: Record<string, number> = {
  automatic: 5,
  'semi-automatic': 3,
  manual: 1,
};

export const DRIVE_SCORES: Record<string, number> = {
  AWD: 5,
  FWD: 3,
  RWD: 1,
};

export const ENGINE_SCORES: Record<string, number> = {
  hybrid: 5,
  diesel: 4,
  petrol: 3,
  LPG: 1,
};

export const RELIABILITY_TIER_SCORES: Record<string, number> = {
  S: 20,
  A: 16,
  B: 12,
  C: 8,
  D: 4,
};

export function getDepreciationScore(retentionPercent: number): number {
  if (retentionPercent >= 70) return 10;
  if (retentionPercent >= 55) return 7;
  if (retentionPercent >= 40) return 4;
  return 2;
}
