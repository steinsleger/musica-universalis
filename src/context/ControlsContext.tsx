import React, { createContext, useContext, ReactNode } from 'react';
import { Planet, CurrentFrequencies, PositionMode, FrequencyMode, AudioScalingConfig, TabType } from '../utils/types';

export interface ControlsContextType {
  // Audio Controls
  masterVolume: number;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  baseFrequency: number;
  handleBaseFrequencyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sequenceBPM: number;
  handleBPMChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  useFletcher: boolean;
  toggleFletcherCurves: () => void;
  audioScalingConfig: AudioScalingConfig;
  setAudioScalingConfig: (config: AudioScalingConfig) => void;
  forceRecalculateAllGains: () => void;

  // Visualization Controls
  distanceMode: FrequencyMode;
  handleDistanceModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  zoomLevel: number;
  handleZoomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;

  // Playback Controls
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playOrbitalSequence: () => Promise<void>;
  loopSequence: boolean;
  toggleLoopSequence: () => void;
  liveMode: boolean;
  toggleLiveMode: () => Promise<void>;
  togglePlayPause: () => Promise<void>;

  // Planet Controls
  orbitData: Planet[];
  togglePlanet: (index: number, forceState?: boolean | null) => Promise<void>;
  toggleAllPlanets: (enable: boolean) => Promise<void>;
  currentFrequencies: CurrentFrequencies;
  frequencyToNote: (frequency: number | undefined) => string;

  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  isInstructionsModalOpen: boolean;
  setIsInstructionsModalOpen: (open: boolean) => void;

  // Other
  isPaused: boolean;
  positionMode: PositionMode;
  setPositionMode: (mode: PositionMode) => void;
}

const ControlsContext = createContext<ControlsContextType | undefined>(undefined);

interface ControlsProviderProps {
  children: ReactNode;
  value: ControlsContextType;
}

export const ControlsProvider: React.FC<ControlsProviderProps> = ({ children, value }) => (
  <ControlsContext.Provider value={value}>
    {children}
  </ControlsContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useControls = (): ControlsContextType => {
  const context = useContext(ControlsContext);
  if (!context) {
    throw new Error('useControls must be used within ControlsProvider');
  }
  return context;
};
