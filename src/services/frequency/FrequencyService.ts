/**
 * Frequency Service
 * Manages frequency calculations using pluggable strategy patterns
 */

import { Planet, FrequencyMode } from '@/types/domain';
import { MURCH_N_VALUES } from '@/utils/constants';

/**
 * Strategy interface for frequency calculation
 */
interface FrequencyStrategy {
  calculate(baseFrequency: number, planet: Planet): number;
}

/**
 * Murch Formula Strategy
 * Implements the modified Titius-Bode law: f(n) = (1 + 2^n) × 3 × baseFrequency
 */
class MurchFormulaStrategy implements FrequencyStrategy {
  calculate(baseFrequency: number, planet: Planet): number {
    const n = MURCH_N_VALUES[planet.name];
    return baseFrequency * (1 + Math.pow(2, n) * 3);
  }
}

/**
 * Actual Distance Strategy
 * Uses real astronomical distances: f = baseFrequency × (5 × actualDistance + 1)
 */
class ActualDistanceStrategy implements FrequencyStrategy {
  calculate(baseFrequency: number, planet: Planet): number {
    return baseFrequency * (5 * planet.actualDistance + 1);
  }
}

/**
 * Frequency Service
 * Provides pluggable frequency calculation using different strategies
 */
export class FrequencyService {
  private strategies: Record<FrequencyMode, FrequencyStrategy> = {
    titiusBode: new MurchFormulaStrategy(),
    actual: new ActualDistanceStrategy()
  };

  /**
   * Register or replace a strategy for a given mode
   */
  registerStrategy(mode: FrequencyMode, strategy: FrequencyStrategy): void {
    this.strategies[mode] = strategy;
  }

  /**
   * Calculate frequency using the selected strategy
   */
  calculate(
    baseFrequency: number,
    planet: Planet,
    mode: FrequencyMode = 'titiusBode'
  ): number {
    const strategy = this.strategies[mode];
    if (!strategy) {
      console.error(`[FREQUENCY] Unknown strategy mode: ${mode}`);
      return 0;
    }

    try {
      return strategy.calculate(baseFrequency, planet);
    } catch (error) {
      console.error(`[FREQUENCY] Error calculating frequency for ${planet.name}:`, error);
      return 0;
    }
  }

  /**
   * Calculate frequencies for all planets in a single mode
   */
  calculateAll(
    baseFrequency: number,
    planets: Planet[],
    mode: FrequencyMode = 'titiusBode'
  ): Record<string, number> {
    const frequencies: Record<string, number> = {};

    planets.forEach(planet => {
      if (planet.enabled) {
        frequencies[planet.name] = this.calculate(baseFrequency, planet, mode);
      }
    });

    return frequencies;
  }
}
