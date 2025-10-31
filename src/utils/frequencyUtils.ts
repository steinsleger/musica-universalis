/**
 * Frequency calculation utilities - consolidates all frequency-related math
 */

import { Planet, FrequencyMode } from './types';
import { MURCH_N_VALUES } from './constants';

/**
 * Calculate frequency for a planet using Murch's formula or actual distances
 */
export const calculateFrequency = (
  baseFrequency: number,
  planet: Planet,
  distanceMode: FrequencyMode = 'titiusBode'
): number => {
  if (distanceMode === 'titiusBode') {
    const n = MURCH_N_VALUES[planet.name];
    return baseFrequency * (1 + Math.pow(2, n) * 3);
  } else {
    return baseFrequency * (5 * planet.actualDistance + 1);
  }
};

/**
 * Convert frequency (Hz) to the closest musical note
 * @param frequency - Frequency in Hz
 * @returns Note name with octave (e.g., "C4", "A#5")
 */
export const frequencyToNote = (frequency: number): string => {
  if (!frequency) return '';

  // A4 is 440Hz, which is the reference
  const A4 = 440.0;
  // C0 is the 0th note in our system (by convention)
  const C0 = A4 * Math.pow(2, -4.75);

  // Calculate how many half steps from C0
  const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / C0));

  // Convert to note
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(halfStepsFromC0 / 12);
  const noteIndex = halfStepsFromC0 % 12;

  return noteNames[noteIndex] + octave;
};

/**
 * Calculate Murch distance for a given n value
 * r = 1 + 2^n × 3
 */
export const calculateMurchDistance = (n: number): number => {
  return 1 + Math.pow(2, n) * 3;
};
