/**
 * FrequencyStrategy - Interface for pluggable frequency calculation strategies
 * Allows different models to be swapped without modifying core logic
 */

import { Planet } from '../../utils/types';

export interface FrequencyStrategy {
  /**
   * Calculate frequency for a planet
   */
  calculate(baseFrequency: number, planet: Planet): number;

  /**
   * Get human-readable name of this strategy
   */
  getName(): string;

  /**
   * Get description of how this strategy works
   */
  getDescription(): string;
}

/**
 * MurchFormulaStrategy - Uses modified Titius-Bode law formula: f(n) = baseFrequency * (1 + 2^n * 3)
 */
export class MurchFormulaStrategy implements FrequencyStrategy {
  private murchNValues: Record<string, number>;

  constructor(murchNValues: Record<string, number>) {
    this.murchNValues = murchNValues;
  }

  calculate(baseFrequency: number, planet: Planet): number {
    const n = this.murchNValues[planet.name];
    if (n === undefined) {
      throw new Error(`No Murch n-value defined for planet: ${planet.name}`);
    }
    return baseFrequency * (1 + Math.pow(2, n) * 3);
  }

  getName(): string {
    return 'Murch Formula';
  }

  getDescription(): string {
    return 'Modified Titius-Bode law: f(n) = baseFrequency × (1 + 2^n × 3)';
  }
}

/**
 * ActualDistanceStrategy - Uses real astronomical distances
 */
export class ActualDistanceStrategy implements FrequencyStrategy {
  calculate(baseFrequency: number, planet: Planet): number {
    return baseFrequency * (5 * planet.actualDistance + 1);
  }

  getName(): string {
    return 'Actual Distance';
  }

  getDescription(): string {
    return 'Real astronomical distances: f = baseFrequency × (5 × distance + 1)';
  }
}

/**
 * HarmonicSeriesStrategy - Maps planets to harmonic series
 * (Future strategy for extensibility)
 */
export class HarmonicSeriesStrategy implements FrequencyStrategy {
  private harmonicMultipliers: Record<string, number>;

  constructor(harmonicMultipliers: Record<string, number>) {
    this.harmonicMultipliers = harmonicMultipliers;
  }

  calculate(baseFrequency: number, planet: Planet): number {
    const multiplier = this.harmonicMultipliers[planet.name];
    if (multiplier === undefined) {
      throw new Error(`No harmonic multiplier defined for planet: ${planet.name}`);
    }
    return baseFrequency * multiplier;
  }

  getName(): string {
    return 'Harmonic Series';
  }

  getDescription(): string {
    return 'Planets mapped to harmonic series multiples of base frequency';
  }
}
