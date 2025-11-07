import { useMemo, useCallback } from 'react';
import { Planet, FrequencyMode } from '../utils/types';
import { FrequencyCalculator, FrequencyCalculatorConfig } from '../services/frequency/FrequencyCalculator';
import { AudioSafetyService, AudioSafetyConfig } from '../services/audio/AudioSafetyService';
import { MURCH_N_VALUES } from '../utils/constants';

/**
 * Hook to manage frequency calculations for planets
 * Handles frequency mode switching, gain calculations, and note name conversion
 * Replaces: useFrequencyManager + useFrequencyEffects + useFrequencyCalculation
 */
export const useFrequency = (baseFrequency: number, distanceMode: FrequencyMode) => {
  // Initialize frequency calculator
  const calculator = useMemo(() => {
    const config: FrequencyCalculatorConfig = {
      murchNValues: MURCH_N_VALUES
    };
    const calc = new FrequencyCalculator(config);

    // Set initial strategy based on distanceMode
    if (distanceMode === 'titiusBode') {
      calc.useMurchFormula();
    } else {
      calc.useActualDistance();
    }

    return calc;
  }, []);

  // Update strategy when distanceMode changes
  useMemo(() => {
    if (distanceMode === 'titiusBode') {
      calculator.useMurchFormula();
    } else {
      calculator.useActualDistance();
    }
  }, [calculator, distanceMode]);

  /**
   * Calculate frequency for a single planet
   */
  const calculateFrequency = useCallback(
    (planet: Planet): number => {
      return calculator.calculate(baseFrequency, planet);
    },
    [calculator, baseFrequency]
  );

  /**
   * Calculate frequencies for all planets
   */
  const calculateAllFrequencies = useCallback(
    (planets: Planet[]): Record<string, number> => {
      return calculator.calculateAll(baseFrequency, planets);
    },
    [calculator, baseFrequency]
  );

  /**
   * Calculate frequencies for enabled planets only
   */
  const calculateEnabledFrequencies = useCallback(
    (planets: Planet[]): Record<string, number> => {
      return calculator.calculateEnabled(baseFrequency, planets);
    },
    [calculator, baseFrequency]
  );

  /**
   * Calculate gain for a given frequency
   */
  const calculateGain = useCallback(
    (frequency: number, config?: AudioSafetyConfig): number => {
      return AudioSafetyService.calculateFrequencyGain(frequency, config);
    },
    []
  );

  /**
   * Calculate advanced gain with Fletcher-Munson curves
   */
  const calculateAdvancedGain = useCallback(
    (frequency: number, config?: AudioSafetyConfig): number => {
      return AudioSafetyService.calculateAdvancedFrequencyGain(frequency, config);
    },
    []
  );

  /**
   * Get gain for a frequency with optional Fletcher-Munson
   */
  const getGain = useCallback(
    (frequency: number, useFletcher: boolean, config?: AudioSafetyConfig): number => {
      return useFletcher
        ? AudioSafetyService.calculateAdvancedFrequencyGain(frequency, config)
        : AudioSafetyService.calculateFrequencyGain(frequency, config);
    },
    []
  );

  /**
   * Convert frequency to musical note name
   * Approximate conversion: A4 = 440 Hz
   */
  const frequencyToNote = useCallback((frequency: number | undefined): string => {
    if (!frequency || frequency <= 0) return 'N/A';

    // Standard notes with their frequencies (A4 = 440 Hz)
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const a4 = 440;
    const c0 = a4 * Math.pow(2, -4.75);

    const halfStepsAboveC0 = 12 * Math.log2(frequency / c0);
    const octave = Math.floor(halfStepsAboveC0 / 12);
    const noteIndex = Math.round(halfStepsAboveC0 % 12);

    return `${notes[noteIndex % 12]}${octave}`;
  }, []);

  return {
    calculateFrequency,
    calculateAllFrequencies,
    calculateEnabledFrequencies,
    calculateGain,
    calculateAdvancedGain,
    getGain,
    frequencyToNote,
    calculator
  };
};
