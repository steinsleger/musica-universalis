import React, { createContext, useContext, ReactNode } from 'react';
import { Planet, FrequencyMode } from '../utils/types';

export interface VisualizationContextType {
  orbitData: Planet[];
  animationSpeed: number;
  baseFrequency: number;
  onFrequencyChange: (frequencies: Record<string, number>) => void;
  isPaused: boolean;
  setToAverageDistance: boolean;
  setToAphelion: boolean;
  setToPerihelion: boolean;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  distanceMode: FrequencyMode;
  currentlyPlayingPlanet: string | null;
  sequenceBPM: number;
}

const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined);

interface VisualizationProviderProps {
  children: ReactNode;
  value: VisualizationContextType;
}

export const VisualizationProvider: React.FC<VisualizationProviderProps> = ({ children, value }) => (
  <VisualizationContext.Provider value={value}>
    {children}
  </VisualizationContext.Provider>
);

export const useVisualization = (): VisualizationContextType => {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error('useVisualization must be used within VisualizationProvider');
  }
  return context;
};
