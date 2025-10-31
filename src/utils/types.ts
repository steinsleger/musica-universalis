/**
 * Shared type definitions for the Musica Universalis application
 */

import * as Tone from 'tone';
import { MURCH_N_VALUES } from './constants';

export type FrequencyMode = 'titiusBode' | 'actual';
export type PositionMode = 'average' | 'aphelion' | 'perihelion' | 'normal';
export type TabType = 'controls' | 'planets' | 'audio';

export interface Planet {
  name: string;
  distance: number;
  actualDistance: number;
  eccentricity: number;
  enabled: boolean;
}

export interface CurrentFrequencies {
  [planetName: string]: number;
}

export interface PanOffset {
  x: number;
  y: number;
}

export interface DragStart {
  x: number;
  y: number;
}

export interface PlanetAngles {
  [planetName: string]: number;
}

export interface SynthObject {
  synth: Tone.Synth;
  gain: Tone.Gain;
}

export interface AudioScalingConfig {
  referenceFrequency: number;
  scalingFactor: number;
  minimumGain: number;
  maximumGain: number;
  highFrequencyCutoff: number;
  highFrequencyScalingFactor: number;
}

export interface PlanetarySystemProps {
  orbitData: Planet[];
  animationSpeed?: number;
  baseFrequency?: number;
  onFrequencyChange: (frequencies: CurrentFrequencies) => void;
  isPaused?: boolean;
  setToAverageDistance?: boolean;
  setToAphelion?: boolean;
  setToPerihelion?: boolean;
  zoomLevel?: number;
  setZoomLevel: (level: number) => void;
  distanceMode?: FrequencyMode;
  currentlyPlayingPlanet?: string | null;
  sequenceBPM?: number;
}

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
    referenceFrequency: 55,
    scalingFactor: 0.4,
    minimumGain: 0.05,
    maximumGain: 1.2,
    highFrequencyCutoff: 2000,
    highFrequencyScalingFactor: 0.6
  };
};
