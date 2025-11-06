import { useState, useCallback, useRef } from 'react';
import { CurrentFrequencies, Planet, FrequencyMode } from '../utils/types';

interface FrequencyManagerState {
  currentFrequencies: CurrentFrequencies;
}

interface FrequencyManagerMethods {
  updateAllFrequencies: (
    orbitData: Planet[],
    baseFrequency: number,
    calculateFrequency: (baseFreq: number, planet: Planet, distanceMode: FrequencyMode) => number,
    distanceMode: FrequencyMode
  ) => CurrentFrequencies;
  updateFrequencies: (frequencies: CurrentFrequencies) => void;
  getFrequency: (planetName: string) => number | undefined;
  setCurrentFrequencies: (frequencies: CurrentFrequencies) => void;
}

export const useFrequencyManager = (): FrequencyManagerState & FrequencyManagerMethods => {
  const [currentFrequencies, setCurrentFrequencies] = useState<CurrentFrequencies>({});
  const lastFrequenciesRef = useRef<CurrentFrequencies>({});

  const updateAllFrequencies = useCallback((
    orbitData: Planet[],
    baseFrequency: number,
    calculateFrequency: (baseFreq: number, planet: Planet, distanceMode: FrequencyMode) => number,
    distanceMode: FrequencyMode
  ): CurrentFrequencies => {
    const defaultFrequencies: CurrentFrequencies = {};
    orbitData.forEach((planet) => {
      const freq = calculateFrequency(baseFrequency, planet, distanceMode);
      defaultFrequencies[planet.name] = freq;
    });

    setCurrentFrequencies(defaultFrequencies);
    lastFrequenciesRef.current = defaultFrequencies;

    return defaultFrequencies;
  }, []);

  const updateFrequencies = useCallback((frequencies: CurrentFrequencies): void => {
    const updated = { ...currentFrequencies, ...frequencies };
    setCurrentFrequencies(updated);
    lastFrequenciesRef.current = updated;
  }, [currentFrequencies]);

  const getFrequency = useCallback((planetName: string): number | undefined => {
    return currentFrequencies[planetName];
  }, [currentFrequencies]);

  return {
    currentFrequencies,
    updateAllFrequencies,
    updateFrequencies,
    getFrequency,
    setCurrentFrequencies
  };
};
