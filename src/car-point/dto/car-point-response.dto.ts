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
  priceStatus: string;
}

export class CarPointResponseDto {
  qualityScore: number;
  qualityStatus: string;
  price: PriceInfoDto;
  scoreBreakdown: ScoreBreakdownDto;
}
