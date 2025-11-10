import * as Tone from 'tone';

/**
 * Convert a volume level (0-1) to decibels
 */
export const volumeToDb = (volume: number): string => {
  if (volume <= 0.01) return '-∞';
  return Tone.gainToDb(volume).toFixed(1);
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
