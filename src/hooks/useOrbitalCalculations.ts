import { useCallback } from 'react';
import { calculatePlanetaryFrequency } from '../utils/calculatePlanetaryFrequency';
import { Planet, FrequencyMode } from '../types';

interface OrbitalCalculationsParams {
  svgSize: number;
  center: number;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  orbitData: Planet[];
  distanceMode: FrequencyMode;
  baseFrequency: number;
}

export const useOrbitalCalculations = (params: OrbitalCalculationsParams) => {
  const {
    svgSize,
    center,
    zoomLevel,
    panOffset,
    orbitData,
    distanceMode
  } = params;

  // Get distance based on mode
  const getDistance = useCallback((planet: Planet): number => {
    return distanceMode === 'titiusBode' ? planet.distance : planet.actualDistance;
  }, [distanceMode]);

  // Get max distance for scaling
  const maxDistance = Math.max(...orbitData.map(planet =>
    Math.max(
      getDistance(planet) * (1 + planet.eccentricity),
      planet.actualDistance * (1 + planet.eccentricity)
    )
  ));

  // Non-linear zoom scaling
  const getEffectiveZoom = useCallback((baseZoom: number): number => {
    if (baseZoom <= 1) {
      return 0.25;
    } else if (baseZoom <= 2) {
      return baseZoom * (1 + (baseZoom - 1) * 0.2);
    } else if (baseZoom <= 10) {
      return baseZoom * 1.1;
    }
    return baseZoom;
  }, []);

  const effectiveZoom = getEffectiveZoom(zoomLevel);
  const orbitScaleFactor = (svgSize / 2) * 0.98 / (maxDistance / effectiveZoom);

  // Calculate current distance using polar ellipse equation
  const getCurrentDistance = useCallback((semiMajorAxis: number, eccentricity: number, angle: number): number => {
    return (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) /
           (1 + eccentricity * Math.cos(angle));
  }, []);

  // Get planet position in SVG coordinates
  const getPlanetPosition = useCallback((semiMajorAxis: number, eccentricity: number, angle: number): { x: number; y: number } => {
    const distance = (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) /
                     (1 + eccentricity * Math.cos(angle));

    const rawX = distance * Math.cos(angle);
    const rawY = distance * Math.sin(angle);

    const x = center + rawX * orbitScaleFactor + panOffset.x;
    const y = center + rawY * orbitScaleFactor + panOffset.y;

    return { x, y };
  }, [center, orbitScaleFactor, panOffset]);

  // Calculate orbital extremes
  const calculateOrbitalExtremes = useCallback((semiMajorAxis: number, eccentricity: number): { perihelion: number; aphelion: number } => {
    return {
      perihelion: semiMajorAxis * (1 - eccentricity),
      aphelion: semiMajorAxis * (1 + eccentricity)
    };
  }, []);

  // Generate elliptical path
  const generateEllipticalPath = useCallback((semiMajorAxis: number, eccentricity: number, numPoints: number = 100): { x: number; y: number }[] => {
    const path: { x: number; y: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const position = getPlanetPosition(semiMajorAxis, eccentricity, angle);
      path.push(position);
    }
    return path;
  }, [getPlanetPosition]);

  // Get extreme positions
  const getExtremePositions = useCallback((semiMajorAxis: number, eccentricity: number): { perihelion: { x: number; y: number }; aphelion: { x: number; y: number } } => {
    return {
      perihelion: getPlanetPosition(semiMajorAxis, eccentricity, 0),
      aphelion: getPlanetPosition(semiMajorAxis, eccentricity, Math.PI)
    };
  }, [getPlanetPosition]);

  // Calculate angles for special positions
  const getAverageDistanceAngle = useCallback((eccentricity: number): number => {
    return Math.acos(-eccentricity);
  }, []);

  const getAphelionAngle = useCallback((): number => Math.PI, []);
  const getPerihelionAngle = useCallback((): number => 0, []);

  // Planet size (logarithmic scaling)
  const getPlanetSize = useCallback((planet: Planet): number => {
    const baseSize: Record<string, number> = {
      'Mercury': 2.5,
      'Venus': 3.6,
      'Earth': 3.8,
      'Mars': 3.0,
      'Ceres': 1.5,
      'Jupiter': 8.5,
      'Saturn': 7.8,
      'Uranus': 5.8,
      'Neptune': 5.6,
      'Pluto': 1.3
    };
    return planet.enabled ? baseSize[planet.name] || 3 : 0;
  }, []);

  // Orbital period (Kepler's Third Law)
  const getOrbitalPeriod = useCallback((distance: number): number => {
    return Math.pow(distance, 1.5);
  }, []);

  // Frequency to note conversion
  const frequencyToNote = useCallback((frequency: number): string => {
    if (!frequency) return '';

    const A4 = 440.0;
    const C0 = A4 * Math.pow(2, -4.75);
    const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / C0));

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(halfStepsFromC0 / 12);
    const noteIndex = halfStepsFromC0 % 12;

    return noteNames[noteIndex] + octave;
  }, []);

  // Calculate frequencies
  const calculateFrequencies = useCallback((baseFreq: number, planet: Planet, _index: number): number => {
    return calculatePlanetaryFrequency(baseFreq, planet, distanceMode);
  }, [distanceMode]);

  return {
    getDistance,
    maxDistance,
    getEffectiveZoom,
    effectiveZoom,
    orbitScaleFactor,
    getCurrentDistance,
    getPlanetPosition,
    calculateOrbitalExtremes,
    generateEllipticalPath,
    getExtremePositions,
    getAverageDistanceAngle,
    getAphelionAngle,
    getPerihelionAngle,
    getPlanetSize,
    getOrbitalPeriod,
    frequencyToNote,
    calculateFrequencies
  };
};
