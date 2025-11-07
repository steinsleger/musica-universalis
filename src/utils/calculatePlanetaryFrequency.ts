/**
 * Calculates frequencies based on the modified Titius-Bode law for solar system bodies
 * Uses centralized constants from utils/constants.ts
 */

import { Planet, FrequencyMode } from '../types';
import { MURCH_N_VALUES } from './constants';

/**
 * Calculates frequency using the modified Titius-Bode law for a given planet
 * @param baseFrequency - The base frequency in Hz
 * @param planet - Planet data object containing name and distances
 * @param distanceMode - 'titiusBode' or 'actual' to select calculation method
 * @returns The calculated frequency for the planet
 */
export const calculatePlanetaryFrequency = (
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
