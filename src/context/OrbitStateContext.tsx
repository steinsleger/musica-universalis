import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Planet, FrequencyMode, PositionMode, getDefaultOrbitData } from '../utils/types';
import { DEFAULT_ANIMATION_SPEED, DEFAULT_ZOOM_LEVEL } from '../utils/constants';

interface OrbitStateContextType {
  orbitData: Planet[];
  setOrbitData: (data: Planet[]) => void;
  togglePlanet: (name: string) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  distanceMode: FrequencyMode;
  setDistanceMode: (mode: FrequencyMode) => void;
  positionMode: PositionMode;
  setPositionMode: (mode: PositionMode) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
}

const OrbitStateContext = createContext<OrbitStateContextType | undefined>(undefined);

interface OrbitStateProviderProps {
  children: ReactNode;
}

export const OrbitStateProvider: React.FC<OrbitStateProviderProps> = ({ children }) => {
  const [orbitData, setOrbitData] = useState<Planet[]>(getDefaultOrbitData());
  const [animationSpeed, setAnimationSpeed] = useState(DEFAULT_ANIMATION_SPEED);
  const [isPaused, setIsPaused] = useState(true);
  const [distanceMode, setDistanceMode] = useState<FrequencyMode>('titiusBode');
  const [positionMode, setPositionMode] = useState<PositionMode>('average');
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);

  const togglePlanet = useCallback((name: string) => {
    setOrbitData(prevData =>
      prevData.map(planet =>
        planet.name === name ? { ...planet, enabled: !planet.enabled } : planet
      )
    );
  }, []);

  const value: OrbitStateContextType = {
    orbitData,
    setOrbitData: useCallback((data: Planet[]) => setOrbitData(data), []),
    togglePlanet,
    animationSpeed,
    setAnimationSpeed: useCallback((speed: number) => setAnimationSpeed(speed), []),
    isPaused,
    setIsPaused: useCallback((paused: boolean) => setIsPaused(paused), []),
    distanceMode,
    setDistanceMode: useCallback((mode: FrequencyMode) => setDistanceMode(mode), []),
    positionMode,
    setPositionMode: useCallback((mode: PositionMode) => setPositionMode(mode), []),
    zoomLevel,
    setZoomLevel: useCallback((level: number) => setZoomLevel(level), [])
  };

  return (
    <OrbitStateContext.Provider value={value}>
      {children}
    </OrbitStateContext.Provider>
  );
};

export { OrbitStateContext };
