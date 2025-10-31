/**
 * Orbital mechanics utilities - handles all elliptical orbit calculations
 */

/**
 * Calculate the orbital period using Kepler's Third Law
 * Period is proportional to distance^1.5
 */
export const getOrbitalPeriod = (distance: number): number => {
  return Math.pow(distance, 1.5);
};

/**
 * Calculate current distance from the sun using the polar equation of an ellipse
 * r = a(1-e²)/(1+e·cos(θ))
 */
export const getCurrentDistance = (
  semiMajorAxis: number,
  eccentricity: number,
  angle: number
): number => {
  return (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) /
         (1 + eccentricity * Math.cos(angle));
};

/**
 * Get the x,y coordinates for a planet at a given angle in its elliptical orbit
 */
export const getPlanetPosition = (
  semiMajorAxis: number,
  eccentricity: number,
  angle: number,
  centerX: number,
  centerY: number,
  scaleFactor: number,
  panOffsetX: number = 0,
  panOffsetY: number = 0
): { x: number; y: number } => {
  const distance = getCurrentDistance(semiMajorAxis, eccentricity, angle);

  const rawX = distance * Math.cos(angle);
  const rawY = distance * Math.sin(angle);

  return {
    x: centerX + rawX * scaleFactor + panOffsetX,
    y: centerY + rawY * scaleFactor + panOffsetY
  };
};

/**
 * Calculate minimum and maximum distances for a planet (perihelion and aphelion)
 */
export const calculateOrbitalExtremes = (
  semiMajorAxis: number,
  eccentricity: number
): { perihelion: number; aphelion: number } => {
  return {
    perihelion: semiMajorAxis * (1 - eccentricity),
    aphelion: semiMajorAxis * (1 + eccentricity)
  };
};

/**
 * Generate points for an elliptical orbit path
 */
export const generateEllipticalPath = (
  semiMajorAxis: number,
  eccentricity: number,
  centerX: number,
  centerY: number,
  scaleFactor: number,
  numPoints: number = 100,
  panOffsetX: number = 0,
  panOffsetY: number = 0
): { x: number; y: number }[] => {
  const path: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const position = getPlanetPosition(
      semiMajorAxis,
      eccentricity,
      angle,
      centerX,
      centerY,
      scaleFactor,
      panOffsetX,
      panOffsetY
    );
    path.push(position);
  }

  return path;
};

/**
 * Get perihelion and aphelion positions for a planet
 */
export const getExtremePositions = (
  semiMajorAxis: number,
  eccentricity: number,
  centerX: number,
  centerY: number,
  scaleFactor: number,
  panOffsetX: number = 0,
  panOffsetY: number = 0
): { perihelion: { x: number; y: number }; aphelion: { x: number; y: number } } => {
  return {
    perihelion: getPlanetPosition(
      semiMajorAxis,
      eccentricity,
      0, // Perihelion at angle 0
      centerX,
      centerY,
      scaleFactor,
      panOffsetX,
      panOffsetY
    ),
    aphelion: getPlanetPosition(
      semiMajorAxis,
      eccentricity,
      Math.PI, // Aphelion at angle π
      centerX,
      centerY,
      scaleFactor,
      panOffsetX,
      panOffsetY
    )
  };
};

/**
 * Calculate the angle at which a planet is at its average distance
 * Uses the polar equation: r = a(1-e²)/(1+e·cos(θ))
 */
export const getAverageDistanceAngle = (eccentricity: number): number => {
  return Math.acos(-eccentricity);
};

/**
 * Get the angle at aphelion (farthest point)
 */
export const getAphelionAngle = (): number => {
  return Math.PI;
};

/**
 * Get the angle at perihelion (closest point)
 */
export const getPerihelionAngle = (): number => {
  return 0;
};
