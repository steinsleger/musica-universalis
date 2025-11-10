import React, { createContext, ReactNode } from 'react';
import { Planet, CurrentFrequencies, FrequencyMode, PositionMode } from '../types/domain';

/**
 * Manages visualization and planet-related controls
 */
export interface VisualizationControlsContextType {
  // Visualization Controls
  distanceMode: FrequencyMode;
  handleDistanceModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  zoomLevel: number;
  handleZoomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;

  // Planet Controls
  orbitData: Planet[];
  togglePlanet: (index: number, forceState?: boolean | null) => Promise<void>;
  toggleAllPlanets: (enable: boolean) => Promise<void>;
  currentFrequencies: CurrentFrequencies;
  frequencyToNote: (frequency: number | undefined) => string;

  // Orbital State
  isPaused: boolean;
  positionMode: PositionMode;
  setPositionMode: (mode: PositionMode) => void;
  currentlyPlayingPlanet: string | undefined;
}

const VisualizationControlsContext = createContext<VisualizationControlsContextType | undefined>(
  undefined
);

interface VisualizationControlsProviderProps {
  children: ReactNode;
  value: VisualizationControlsContextType;
}

export const VisualizationControlsProvider: React.FC<VisualizationControlsProviderProps> = ({
  children,
  value
}) => (
  <VisualizationControlsContext.Provider value={value}>
    {children}
  </VisualizationControlsContext.Provider>
);

export { VisualizationControlsContext };
