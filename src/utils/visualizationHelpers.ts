import * as Tone from 'tone';

/**
 * Convert a volume level (0-1) to decibels
 */
export const volumeToDb = (volume: number): string => {
  if (volume <= 0.01) return '-∞';
  return Tone.gainToDb(volume).toFixed(1);
};

/**
 * Get the color for a given planet
 */
export const getPlanetColor = (name: string): string => {
  const planetColors: Record<string, string> = {
    'Mercury': '#A9A9A9',
    'Venus': '#E6D3A3',
    'Earth': '#1E90FF',
    'Mars': '#CD5C5C',
    'Ceres': '#8B8B83',
    'Jupiter': '#E59866',
    'Saturn': '#F4D03F',
    'Uranus': '#73C6B6',
    'Neptune': '#5DADE2',
    'Pluto': '#C39BD3'
  };

  return planetColors[name] || '#999';
};

/**
 * Get the orbit color for a planet
 */
export const getOrbitColor = (name: string, enabled: boolean): string => {
  if (!enabled) return '#333';

  const planetColors: Record<string, string> = {
    'Mercury': '#AAA',
    'Venus': '#DAA',
    'Earth': '#5A5',
    'Mars': '#A55',
    'Ceres': '#AA8',
    'Jupiter': '#DA8',
    'Saturn': '#DD5',
    'Uranus': '#8DD',
    'Neptune': '#55D',
    'Pluto': '#D5D'
  };

  return planetColors[name] || '#666';
};
