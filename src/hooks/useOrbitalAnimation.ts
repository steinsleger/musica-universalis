import { useState, useEffect, useRef, useCallback } from 'react';
import { Planet, CurrentFrequencies } from '../utils/types';

interface UseOrbitalAnimationParams {
  orbitData: Planet[];
  animationSpeed: number;
  baseFrequency: number;
  isPaused: boolean;
  distanceMode: 'titiusBode' | 'actual';
  setToAverageDistance: boolean;
  setToAphelion: boolean;
  setToPerihelion: boolean;
  onFrequencyChange?: (frequencies: Record<string, number>) => void;
  // Calculation functions from useOrbitalCalculations
  getDistance: (planet: Planet) => number;
  getOrbitalPeriod: (distance: number) => number;
  getCurrentDistance: (distance: number, eccentricity: number, angle: number) => number;
  calculateFrequencies: (baseFreq: number, planet: Planet, index: number) => number;
  getAverageDistanceAngle: (eccentricity: number) => number;
  getAphelionAngle: () => number;
  getPerihelionAngle: () => number;
}

export const useOrbitalAnimation = ({
  orbitData,
  animationSpeed,
  baseFrequency,
  isPaused,
  distanceMode,
  setToAverageDistance,
  setToAphelion,
  setToPerihelion,
  onFrequencyChange,
  getDistance,
  getOrbitalPeriod,
  getCurrentDistance,
  calculateFrequencies,
  getAverageDistanceAngle,
  getAphelionAngle,
  getPerihelionAngle
}: UseOrbitalAnimationParams) => {
  const [planetAngles, setPlanetAngles] = useState<Record<string, number>>({});
  const [currentFrequencies, setCurrentFrequencies] = useState<CurrentFrequencies>({});

  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const frequenciesRef = useRef<Record<string, number>>({});
  const distanceModeRef = useRef<'titiusBode' | 'actual'>(distanceMode);
  const initializedRef = useRef<boolean>(false);

  // Main animation loop
  const animate = useCallback((time: number): void => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }

    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;

    // Update planet angles if not paused
    if (!isPaused) {
      setPlanetAngles(prevAngles => {
        const newAngles = { ...prevAngles };

        orbitData.forEach(planet => {
          const period = getOrbitalPeriod(getDistance(planet));
          const angularVelocity = (2 * Math.PI / (period * 20000)) * animationSpeed;
          newAngles[planet.name] = (prevAngles[planet.name] || 0) + angularVelocity * deltaTime;

          // Normalize angle to 0-2π range
          while (newAngles[planet.name] >= 2 * Math.PI) {
            newAngles[planet.name] -= 2 * Math.PI;
          }
        });

        return newAngles;
      });
    }

    // Calculate and update frequencies
    const newFrequencies: Record<string, number> = {};
    orbitData.forEach((planet, index) => {
      const angle = planetAngles[planet.name] || 0;
      const currentDist = getCurrentDistance(getDistance(planet), planet.eccentricity, angle);
      const baseFreq = calculateFrequencies(baseFrequency, planet, index);
      const avgDistance = getDistance(planet);
      const ratio = currentDist / avgDistance;
      const modifiedFreq = baseFreq * Math.sqrt(ratio);

      newFrequencies[planet.name] = modifiedFreq;
    });

    setCurrentFrequencies(newFrequencies);
    frequenciesRef.current = newFrequencies;

    // Request next frame
    requestRef.current = requestAnimationFrame(animate);
  }, [
    isPaused,
    animationSpeed,
    orbitData,
    baseFrequency,
    planetAngles,
    calculateFrequencies,
    getCurrentDistance,
    getDistance,
    getOrbitalPeriod
  ]);

  // Notify frequency changes to parent
  const notifyFrequencyChanges = useCallback((): void => {
    if (onFrequencyChange) {
      onFrequencyChange(frequenciesRef.current);
    }
  }, [onFrequencyChange]);

  // Initialize planet angles when orbitData changes
  useEffect(() => {
    if (!orbitData || orbitData.length === 0) return;
    if (Object.keys(planetAngles).length > 0) return;

    const initialAngles: Record<string, number> = {};
    orbitData.forEach(planet => {
      initialAngles[planet.name] = 0;
    });

    setPlanetAngles(initialAngles);
  }, [orbitData, planetAngles]);

  // Initialize frequencies when component mounts or baseFrequency changes
  useEffect(() => {
    if (initializedRef.current) return;

    const initialFrequencies: Record<string, number> = {};
    orbitData.forEach((planet, index) => {
      const baseFreq = calculateFrequencies(baseFrequency, planet, index);
      initialFrequencies[planet.name] = baseFreq;
    });

    setCurrentFrequencies(initialFrequencies);
    frequenciesRef.current = initialFrequencies;
    if (onFrequencyChange) {
      onFrequencyChange(initialFrequencies);
    }

    initializedRef.current = true;
  }, [baseFrequency, orbitData, onFrequencyChange, distanceMode, calculateFrequencies]);

  // Handle distance mode changes
  useEffect(() => {
    if (distanceModeRef.current !== distanceMode) {
      distanceModeRef.current = distanceMode;

      if (onFrequencyChange && !isPaused) {
        const updatedFrequencies: Record<string, number> = {};

        orbitData.forEach((planet, index) => {
          const angle = planetAngles[planet.name] || 0;
          const currentDist = getCurrentDistance(getDistance(planet), planet.eccentricity, angle);
          const baseFreq = calculateFrequencies(baseFrequency, planet, index);
          const avgDistance = getDistance(planet);
          const ratio = currentDist / avgDistance;
          const modifiedFreq = baseFreq * Math.sqrt(ratio);

          updatedFrequencies[planet.name] = modifiedFreq;
        });

        onFrequencyChange(updatedFrequencies);
      }
    }
  }, [
    distanceMode,
    orbitData,
    planetAngles,
    onFrequencyChange,
    isPaused,
    baseFrequency,
    calculateFrequencies,
    getCurrentDistance,
    getDistance
  ]);

  // Handle position jumps (average distance, perihelion, aphelion)
  useEffect(() => {
    if (setToAverageDistance || setToAphelion || setToPerihelion) {
      setPlanetAngles(prevAngles => {
        const newAngles = { ...prevAngles };
        orbitData.forEach(planet => {
          if (setToAverageDistance) {
            newAngles[planet.name] = getAverageDistanceAngle(planet.eccentricity);
          } else if (setToAphelion) {
            newAngles[planet.name] = getAphelionAngle();
          } else if (setToPerihelion) {
            newAngles[planet.name] = getPerihelionAngle();
          }
        });
        return newAngles;
      });
    }
  }, [
    setToAverageDistance,
    setToAphelion,
    setToPerihelion,
    orbitData,
    distanceMode,
    getAverageDistanceAngle,
    getAphelionAngle,
    getPerihelionAngle
  ]);

  // Start/stop animation loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  // Set up frequency notification interval
  useEffect(() => {
    const notifyInterval = setInterval(() => {
      notifyFrequencyChanges();
    }, 16);

    return () => {
      clearInterval(notifyInterval);
    };
  }, [notifyFrequencyChanges]);

  return {
    planetAngles,
    currentFrequencies,
    frequenciesRef
  };
};
