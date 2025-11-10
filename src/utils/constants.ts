/**
 * Centralized constants for the Musica Universalis application
 */

import { type Planet } from '../types/domain';
import { type AudioScalingConfig } from '../types/audio';

export const MURCH_N_VALUES: Record<string, number> = {
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

// Audio defaults
export const DEFAULT_BASE_FREQUENCY = 110;
export const DEFAULT_MASTER_VOLUME = 0.35;
export const DEFAULT_SEQUENCE_BPM = 60;
export const DEFAULT_ANIMATION_SPEED = 1;
export const DEFAULT_ZOOM_LEVEL = 20;


// Audio safety
export const DEFAULT_REFERENCE_FREQUENCY = 55;
export const DEFAULT_SCALING_FACTOR = 0.4;
export const DEFAULT_MINIMUM_GAIN = 0.05;
export const DEFAULT_MAXIMUM_GAIN = 1.2;
export const HIGH_FREQUENCY_CUTOFF = 2000;
export const HIGH_FREQUENCY_SCALING_FACTOR = 0.6;


// ============ Utility Functions ============

/**
 * Calculate distance using Murch's formula: r = 1 + 2^n × 3
 */
const calculateMurchDistance = (n: number): number => {
  return 1 + Math.pow(2, n) * 3;
};

/**
 * Initialize default orbit data with all planets
 */
export const getDefaultOrbitData = (): Planet[] => {
  return [
    {
      name: 'Mercury',
      distance: calculateMurchDistance(MURCH_N_VALUES.Mercury),
      actualDistance: 0.3870,
      eccentricity: 0.2056,
      enabled: true
    },
    {
      name: 'Venus',
      distance: calculateMurchDistance(MURCH_N_VALUES.Venus),
      actualDistance: 0.7233,
      eccentricity: 0.0068,
      enabled: true
    },
    {
      name: 'Earth',
      distance: calculateMurchDistance(MURCH_N_VALUES.Earth),
      actualDistance: 1.00,
      eccentricity: 0.0167,
      enabled: true
    },
    {
      name: 'Mars',
      distance: calculateMurchDistance(MURCH_N_VALUES.Mars),
      actualDistance: 1.5237,
      eccentricity: 0.0934,
      enabled: true
    },
    {
      name: 'Ceres',
      distance: calculateMurchDistance(MURCH_N_VALUES.Ceres),
      actualDistance: 2.77,
      eccentricity: 0.0758,
      enabled: true
    },
    {
      name: 'Jupiter',
      distance: calculateMurchDistance(MURCH_N_VALUES.Jupiter),
      actualDistance: 5.2029,
      eccentricity: 0.0484,
      enabled: true
    },
    {
      name: 'Saturn',
      distance: calculateMurchDistance(MURCH_N_VALUES.Saturn),
      actualDistance: 9.5367,
      eccentricity: 0.0539,
      enabled: true
    },
    {
      name: 'Uranus',
      distance: calculateMurchDistance(MURCH_N_VALUES.Uranus),
      actualDistance: 19.1892,
      eccentricity: 0.0473,
      enabled: true
    },
    {
      name: 'Neptune',
      distance: calculateMurchDistance(MURCH_N_VALUES.Neptune),
      actualDistance: 30.07,
      eccentricity: 0.0086,
      enabled: true
    },
    {
      name: 'Pluto',
      distance: calculateMurchDistance(MURCH_N_VALUES.Pluto),
      actualDistance: 39.48,
      eccentricity: 0.2488,
      enabled: true
    }
  ];
};

/**
 * Get default audio scaling configuration
 */
export const getDefaultAudioScalingConfig = (): AudioScalingConfig => {
  return {
    referenceFrequency: DEFAULT_REFERENCE_FREQUENCY,
    scalingFactor: DEFAULT_SCALING_FACTOR,
    minimumGain: DEFAULT_MINIMUM_GAIN,
    maximumGain: DEFAULT_MAXIMUM_GAIN,
    highFrequencyCutoff: HIGH_FREQUENCY_CUTOFF,
    highFrequencyScalingFactor: HIGH_FREQUENCY_SCALING_FACTOR
  };
};
