/**
 * Shared type definitions for the Musica Universalis application
 */

import * as Tone from 'tone';

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

export const murchNValues: Record<string, number> = {
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
 * Calculate distance using Murch's formula: r = 1 + 2^n × 3
 */
export const calculateMurchDistance = (n: number): number => {
  return 1 + Math.pow(2, n) * 3;
};

/**
 * Initialize default orbit data with all planets
 */
export const getDefaultOrbitData = (): Planet[] => {
  return [
    {
      name: 'Mercury',
      distance: calculateMurchDistance(murchNValues.Mercury),
      actualDistance: 0.3870,
      eccentricity: 0.2056,
      enabled: true
    },
    {
      name: 'Venus',
      distance: calculateMurchDistance(murchNValues.Venus),
      actualDistance: 0.7233,
      eccentricity: 0.0068,
      enabled: true
    },
    {
      name: 'Earth',
      distance: calculateMurchDistance(murchNValues.Earth),
      actualDistance: 1.00,
      eccentricity: 0.0167,
      enabled: true
    },
    {
      name: 'Mars',
      distance: calculateMurchDistance(murchNValues.Mars),
      actualDistance: 1.5237,
      eccentricity: 0.0934,
      enabled: true
    },
    {
      name: 'Ceres',
      distance: calculateMurchDistance(murchNValues.Ceres),
      actualDistance: 2.77,
      eccentricity: 0.0758,
      enabled: true
    },
    {
      name: 'Jupiter',
      distance: calculateMurchDistance(murchNValues.Jupiter),
      actualDistance: 5.2029,
      eccentricity: 0.0484,
      enabled: true
    },
    {
      name: 'Saturn',
      distance: calculateMurchDistance(murchNValues.Saturn),
      actualDistance: 9.5367,
      eccentricity: 0.0539,
      enabled: true
    },
    {
      name: 'Uranus',
      distance: calculateMurchDistance(murchNValues.Uranus),
      actualDistance: 19.1892,
      eccentricity: 0.0473,
      enabled: true
    },
    {
      name: 'Neptune',
      distance: calculateMurchDistance(murchNValues.Neptune),
      actualDistance: 30.07,
      eccentricity: 0.0086,
      enabled: true
    },
    {
      name: 'Pluto',
      distance: calculateMurchDistance(murchNValues.Pluto),
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
