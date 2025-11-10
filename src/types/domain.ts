/**
 * Domain Types - Core business logic types
 *
 * Types that represent the domain model:
 * - Planets and orbital mechanics
 * - Frequencies and orbital concepts
 */

/**
 * Planet order in solar system
 */
export type PlanetName =
  | 'Mercury'
  | 'Venus'
  | 'Earth'
  | 'Mars'
  | 'Ceres'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto';

/**
 * A celestial body in the solar system
 */
export interface Planet {
  name: PlanetName;              // Specific planet name (constrained type)
  distance: number;              // Titius-Bode distance in AU
  actualDistance: number;        // Real astronomical distance in AU
  eccentricity: number;          // Orbital eccentricity (0-1)
  enabled: boolean;              // Whether this planet is active in simulation
}

/**
 * Current frequencies for each enabled planet
 * Maps planet name to its current frequency in Hz
 * Defined as Record<string, number> to allow dynamic construction and testing
 */
export type CurrentFrequencies = Record<string, number>;

/**
 * Frequency calculation mode
 */
export type FrequencyMode = 'titiusBode' | 'actual';

/**
 * Position mode for orbital visualization
 */
export type PositionMode = 'average' | 'aphelion' | 'perihelion' | 'normal';
