/**
 * Centralized constants for the Musica Universalis application
 */

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

export const PLANETARY_SIZES: Record<string, number> = {
  Mercury: 2.5,
  Venus: 3.6,
  Earth: 3.8,
  Mars: 3.0,
  Ceres: 1.5,
  Jupiter: 8.5,
  Saturn: 7.8,
  Uranus: 5.8,
  Neptune: 5.6,
  Pluto: 1.3
};

export const PLANET_COLORS: Record<string, string> = {
  Mercury: '#AAA',
  Venus: '#DAA',
  Earth: '#5A5',
  Mars: '#A55',
  Ceres: '#AA8',
  Jupiter: '#DA8',
  Saturn: '#DD5',
  Uranus: '#8DD',
  Neptune: '#55D',
  Pluto: '#D5D'
};

// Audio defaults
export const DEFAULT_BASE_FREQUENCY = 110;
export const DEFAULT_MASTER_VOLUME = 0.35;
export const DEFAULT_SEQUENCE_BPM = 60;
export const DEFAULT_ANIMATION_SPEED = 1;
export const DEFAULT_ZOOM_LEVEL = 20;

// SVG visualization constants
export const SVG_SIZE = 600;
export const SVG_CENTER = SVG_SIZE / 2;
export const MIN_PLANET_SIZE = 3;
export const SUN_RADIUS = 10;

// Zoom limits
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 40;
export const ZOOM_SPEED = 0.1;

// Animation constants
export const ORBIT_SCALE_FACTOR_MULTIPLIER = 0.98;
export const MIN_ZOOM_SCALE = 0.25;

// Audio safety
export const DEFAULT_REFERENCE_FREQUENCY = 55;
export const DEFAULT_SCALING_FACTOR = 0.4;
export const DEFAULT_MINIMUM_GAIN = 0.05;
export const DEFAULT_MAXIMUM_GAIN = 1.2;
export const HIGH_FREQUENCY_CUTOFF = 2000;
export const HIGH_FREQUENCY_SCALING_FACTOR = 0.6;


// Ellipse math
export const ELLIPSE_POINTS = 100;

// UI
export const MIN_PAN = 0;
