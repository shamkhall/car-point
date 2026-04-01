import { Injectable } from '@nestjs/common';
import {
  CONDITION_SCORES,
  TRANSMISSION_SCORES,
  DRIVE_SCORES,
  ENGINE_SCORES,
} from './scoring.config.js';

@Injectable()
export class ScoringService {
  calculateMileageScore(mileage: number, year: number, currentYear: number): number {
    const age = currentYear - year;
    if (age <= 0) return 25;

    const kmPerYear = mileage / age;
    if (kmPerYear <= 10000) return 25;
    if (kmPerYear >= 40000) return 0;

    const score = 25 - ((kmPerYear - 10000) / 30000) * 25;
    return Math.round(score * 100) / 100;
  }

  calculateAgeScore(year: number, currentYear: number): number {
    const age = currentYear - year;
    if (age <= 0) return 15;
    if (age >= 20) return 0;

    return 15 - age * 0.75;
  }

  calculateConditionScore(condition: string): number {
    return CONDITION_SCORES[condition.toLowerCase()] ?? 0;
  }

  calculateTransmissionScore(transmission: string): number {
    return TRANSMISSION_SCORES[transmission.toLowerCase()] ?? 0;
  }

  calculateDriveScore(drive: string): number {
    return DRIVE_SCORES[drive.toUpperCase()] ?? 0;
  }

  calculateEngineScore(engine: string): number {
    return ENGINE_SCORES[engine.toLowerCase()] ?? 0;
  }

  clampScore(total: number): number {
    return Math.max(1, Math.min(100, Math.round(total)));
  }
}
