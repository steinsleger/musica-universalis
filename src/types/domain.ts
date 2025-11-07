/**
 * Domain Types - Core business logic types
 *
 * Types that represent the domain model:
 * - Planets and orbital mechanics
 * - Frequencies and audio concepts
 */

/**
 * A celestial body in the solar system
 */
export interface Planet {
  name: string;
  distance: number;              // Titius-Bode distance in AU
  actualDistance: number;        // Real astronomical distance in AU
  eccentricity: number;          // Orbital eccentricity (0-1)
  enabled: boolean;              // Whether this planet is active in simulation
}

/**
 * Current frequencies for each enabled planet
 * Maps planet name to its current frequency in Hz
 */
export type CurrentFrequencies = Record<string, number>;

/**
 * Frequency calculation mode
 */
export type FrequencyMode = 'titiusBode' | 'actual';

/**
 * Position mode for orbital visualization
 */
export type PositionMode = 'normal' | 'average' | 'aphelion' | 'perihelion';

/**
 * Tab type for sidebar navigation
 */
export type TabType = 'controls' | 'planets' | 'audio';

/**
 * Audio scaling configuration for hearing protection
 */
export interface AudioScalingConfig {
  referenceFrequency?: number;
  baseGain?: number;
  peakFrequency?: number;
  highFrequencyCutoff?: number;
  minGain?: number;
  maxGain?: number;
}

/**
 * Synth object containing synthesis components
 */
export interface SynthObject {
  synth: unknown;  // Tone.Synth or similar
  gain: unknown;   // Tone.Gain node
}

/**
 * Audio health status
 */
export type AudioHealthStatus = 'healthy' | 'degraded' | 'failed';

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
