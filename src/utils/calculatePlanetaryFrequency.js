// src/utils/calculatePlanetaryFrequency.js
/**
 * Calculates frequencies based on the modified Titius-Bode law for solar system bodies
 * 
 * @param {number} baseFrequency - The base frequency in Hz
 * @param {Object} planet - Planet data object containing name and distances
 * @param {string} distanceMode - 'titiusBode' or 'actual' to select calculation method
 * @returns {number} The calculated frequency for the planet
 */
export const calculatePlanetaryFrequency = (baseFrequency, planet, distanceMode = 'titiusBode') => {
  if (distanceMode === 'titiusBode') {
    // Map each planet to its specific n value according to Murch's theory
    const murchNValues = {
      "Mercury": -10, // Very negative n value (Beta limit)
      "Venus": -2,
      "Earth": -1,
      "Mars": 0,
      "Ceres": 1,
      "Jupiter": 2,
      "Saturn": 3,
      "Uranus": 4,
      "Neptune": 5,
      "Pluto": 6
    };
    
    // Get the appropriate n value for this planet
    const n = murchNValues[planet.name];
    
    // Apply Murch's formula: Beta * (1 + 2^n * 3)
    return baseFrequency * (1 + Math.pow(2, n) * 3);
  } else {
    // Alternative calculation for actual distances
    return baseFrequency * (5 * planet.actualDistance + 1);
  }
};