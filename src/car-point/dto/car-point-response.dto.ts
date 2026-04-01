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

export class PriceInfoDto {
  listed: number;
  average: number | null;
  deviation: number;
}

export class CarPointResponseDto {
  qualityScore: number;
  price: PriceInfoDto;
  scoreBreakdown: ScoreBreakdownDto;
}
