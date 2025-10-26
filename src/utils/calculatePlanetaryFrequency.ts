/**
 * Calculates frequencies based on the modified Titius-Bode law for solar system bodies
 */

type FrequencyMode = 'titiusBode' | 'actual';

interface Planet {
  name: string;
  distance: number;
  actualDistance: number;
  eccentricity: number;
  enabled: boolean;
}

const murchNValues: Record<string, number> = {
  Mercury: -10,
  Venus: -2,
  Earth: -1,
  Mars: 0,
  Ceres: 1,
  Jupiter: 2,
  Saturn: 3,
  Uranus: 4,
  Neptune: 5,
  Pluto: 6
};

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
    const n = murchNValues[planet.name];
    return baseFrequency * (1 + Math.pow(2, n) * 3);
  } else {
    return baseFrequency * (5 * planet.actualDistance + 1);
  }
};

export type { FrequencyMode, Planet };
