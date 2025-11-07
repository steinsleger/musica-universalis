/**
 * Planet Configuration
 *
 * Centralized configuration for planet data, including:
 * - Murch n-values for frequency calculation
 * - Visual properties (size, color)
 * - Orbital characteristics
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

/**
 * Planet visual sizes for SVG rendering
 * Relative sizes, not to scale (for visibility)
 */
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

/**
 * Planet colors for visualization
 * Used in SVG rendering and UI elements
 */
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

/**
 * Visualization themes for planets
 * Can be extended with new themes (dark, high-contrast, etc.)
 */
export const PLANET_THEMES = {
  default: {
    colors: PLANET_COLORS,
    sizes: PLANETARY_SIZES
  },
  dark: {
    colors: {
      Mercury: '#555',
      Venus: '#744',
      Earth: '#357',
      Mars: '#744',
      Ceres: '#556',
      Jupiter: '#754',
      Saturn: '#774',
      Uranus: '#466',
      Neptune: '#335',
      Pluto: '#535'
    },
    sizes: PLANETARY_SIZES
  },
  highContrast: {
    colors: {
      Mercury: '#000',
      Venus: '#E00',
      Earth: '#0F0',
      Mars: '#F00',
      Ceres: '#880',
      Jupiter: '#FA0',
      Saturn: '#FF0',
      Uranus: '#0FF',
      Neptune: '#00F',
      Pluto: '#F0F'
    },
    sizes: PLANETARY_SIZES
  }
} as const;

export type PlanetTheme = keyof typeof PLANET_THEMES;

/**
 * Planet order (from Sun)
 */
export const PLANET_ORDER = [
  'Mercury',
  'Venus',
  'Earth',
  'Mars',
  'Ceres',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto'
] as const;

/**
 * Sun visualization properties
 */
export const SUN_CONFIG = {
  radius: 10,
  color: '#FF8',
  glowColor: '#FFA'
} as const;
