/**
 * FrequencyCalculator - Central service for frequency calculations
 * Decouples frequency calculation logic from React components
 */

import { Planet } from '../../types';
import { FrequencyStrategy, MurchFormulaStrategy, ActualDistanceStrategy } from './FrequencyStrategy';

export interface FrequencyCalculatorConfig {
  murchNValues: Record<string, number>;
}

export class FrequencyCalculator {
  private strategy: FrequencyStrategy;
  private murchStrategy: MurchFormulaStrategy;
  private actualDistanceStrategy: ActualDistanceStrategy;

  constructor(config: FrequencyCalculatorConfig) {
    this.murchStrategy = new MurchFormulaStrategy(config.murchNValues);
    this.actualDistanceStrategy = new ActualDistanceStrategy();
    this.strategy = this.murchStrategy; // Default to Murch formula
  }

  /**
   * Set the active frequency calculation strategy
   */
  setStrategy(strategy: FrequencyStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Set to Murch formula strategy
   */
  useMurchFormula(): void {
    this.strategy = this.murchStrategy;
  }

  /**
   * Set to actual distance strategy
   */
  useActualDistance(): void {
    this.strategy = this.actualDistanceStrategy;
  }

  /**
   * Get current active strategy
   */
  getStrategy(): FrequencyStrategy {
    return this.strategy;
  }

  /**
   * Calculate frequency for a planet using current strategy
   */
  calculate(baseFrequency: number, planet: Planet): number {
    return this.strategy.calculate(baseFrequency, planet);
  }

  /**
   * Calculate frequencies for all planets
   */
  calculateAll(baseFrequency: number, planets: Planet[]): Record<string, number> {
    const frequencies: Record<string, number> = {};
    planets.forEach(planet => {
      frequencies[planet.name] = this.calculate(baseFrequency, planet);
    });
    return frequencies;
  }

  /**
   * Calculate frequency for enabled planets only
   */
  calculateEnabled(baseFrequency: number, planets: Planet[]): Record<string, number> {
    const frequencies: Record<string, number> = {};
    planets.forEach(planet => {
      if (planet.enabled) {
        frequencies[planet.name] = this.calculate(baseFrequency, planet);
      }
    });
    return frequencies;
  }
}
