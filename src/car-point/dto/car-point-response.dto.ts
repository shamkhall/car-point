export class ScoreBreakdownDto {
  mileageScore: number;
  ageScore: number;
  reliabilityScore: number;
  conditionScore: number;
  depreciationScore: number;
  transmissionScore: number;
  driveScore: number;
  engineScore: number;
}

export enum PriceStatus {
  FAIR_PRICE = 0,
  GREAT_DEAL = 1,
  OVERPRICED = 2,
}

export enum QualityStatus {
  GOOD = 0,
  POOR = 1,
  EXCELLENT = 2,
}

export class PriceInfoDto {
  listed: number;
  average: number | null;
  deviation: number;
  priceStatus: PriceStatus;
}

export class CarPointResponseDto {
  qualityScore: number;
  qualityStatus: QualityStatus;
  price: PriceInfoDto;
  scoreBreakdown: ScoreBreakdownDto;
}
