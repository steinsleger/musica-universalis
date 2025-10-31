import { useState, useCallback, useRef, useEffect } from 'react';
import { Planet, PositionMode } from '../utils/types';

interface UseOrbitalAnimationReturn {
  planetAngles: Record<string, number>;
  setPlanetAngles: (angles: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  animate: (time: number) => void;
  getOrbitalPeriod: (distance: number) => number;
  getCurrentDistance: (semiMajorAxis: number, eccentricity: number, angle: number) => number;
  getPlanetPosition: (semiMajorAxis: number, eccentricity: number, angle: number, center: number, scaleFactor: number, panOffset: { x: number; y: number }) => { x: number; y: number };
  generateEllipticalPath: (semiMajorAxis: number, eccentricity: number, numPoints: number) => { x: number; y: number }[];
  getAverageDistanceAngle: (eccentricity: number) => number;
  getAphelionAngle: () => number;
  getPerihelionAngle: () => number;
  calculateOrbitalExtremes: (semiMajorAxis: number, eccentricity: number) => { perihelion: number; aphelion: number };
  getExtremePositions: (semiMajorAxis: number, eccentricity: number, center: number, scaleFactor: number, panOffset: { x: number; y: number }) => { perihelion: { x: number; y: number }; aphelion: { x: number; y: number } };
}

export const useOrbitalAnimation = (
  orbitData: Planet[],
  animationSpeed: number,
  isPaused: boolean,
  getDistance: (planet: Planet) => number
): UseOrbitalAnimationReturn => {
  const [planetAngles, setPlanetAngles] = useState<Record<string, number>>({});
  const previousTimeRef = useRef<number | undefined>(undefined);

  const getOrbitalPeriod = useCallback((distance: number): number => {
    return Math.pow(distance, 1.5);
  }, []);

  const getCurrentDistance = useCallback(
    (semiMajorAxis: number, eccentricity: number, angle: number): number => {
      return (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) /
             (1 + eccentricity * Math.cos(angle));
    },
    []
  );

  const getPlanetPosition = useCallback(
    (semiMajorAxis: number, eccentricity: number, angle: number, center: number, scaleFactor: number, panOffset: { x: number; y: number }): { x: number; y: number } => {
      const distance = (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) /
                       (1 + eccentricity * Math.cos(angle));

      const rawX = distance * Math.cos(angle);
      const rawY = distance * Math.sin(angle);

      return {
        x: center + rawX * scaleFactor + panOffset.x,
        y: center + rawY * scaleFactor + panOffset.y
      };
    },
    []
  );

  const generateEllipticalPath = useCallback(
    (semiMajorAxis: number, eccentricity: number, numPoints: number = 100, center: number = 300, scaleFactor: number = 1, panOffset: { x: number; y: number } = { x: 0, y: 0 }): { x: number; y: number }[] => {
      const path: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const position = getPlanetPosition(semiMajorAxis, eccentricity, angle, center, scaleFactor, panOffset);
        path.push(position);
      }

      return path;
    },
    [getPlanetPosition]
  );

  const getAverageDistanceAngle = useCallback((eccentricity: number): number => {
    return Math.acos(-eccentricity);
  }, []);

  const getAphelionAngle = useCallback((): number => {
    return Math.PI;
  }, []);

  const getPerihelionAngle = useCallback((): number => {
    return 0;
  }, []);

  const calculateOrbitalExtremes = useCallback(
    (semiMajorAxis: number, eccentricity: number): { perihelion: number; aphelion: number } => {
      return {
        perihelion: semiMajorAxis * (1 - eccentricity),
        aphelion: semiMajorAxis * (1 + eccentricity)
      };
    },
    []
  );

  const getExtremePositions = useCallback(
    (semiMajorAxis: number, eccentricity: number, center: number, scaleFactor: number, panOffset: { x: number; y: number }): { perihelion: { x: number; y: number }; aphelion: { x: number; y: number } } => {
      return {
        perihelion: getPlanetPosition(semiMajorAxis, eccentricity, 0, center, scaleFactor, panOffset),
        aphelion: getPlanetPosition(semiMajorAxis, eccentricity, Math.PI, center, scaleFactor, panOffset)
      };
    },
    [getPlanetPosition]
  );

  const animate = useCallback((time: number): void => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
      return;
    }

    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;

    if (!isPaused) {
      setPlanetAngles(prevAngles => {
        const newAngles = { ...prevAngles };

        orbitData.forEach(planet => {
          const period = getOrbitalPeriod(getDistance(planet));
          const angularVelocity = (2 * Math.PI / (period * 20000)) * animationSpeed;
          newAngles[planet.name] = (prevAngles[planet.name] || 0) + angularVelocity * deltaTime;

          while (newAngles[planet.name] >= 2 * Math.PI) {
            newAngles[planet.name] -= 2 * Math.PI;
          }
        });

        return newAngles;
      });
    }
  }, [isPaused, orbitData, animationSpeed, getOrbitalPeriod, getDistance]);

  useEffect(() => {
    previousTimeRef.current = undefined;
  }, [isPaused]);

  return {
    planetAngles,
    setPlanetAngles,
    animate,
    getOrbitalPeriod,
    getCurrentDistance,
    getPlanetPosition,
    generateEllipticalPath,
    getAverageDistanceAngle,
    getAphelionAngle,
    getPerihelionAngle,
    calculateOrbitalExtremes,
    getExtremePositions
  };
};
