import React, { createContext, ReactNode } from 'react';
import { AudioScalingConfig } from '../types';

/**
 * AudioControlsContext manages audio configuration and playback state
 * Includes master volume, base frequency, BPM, and playback controls
 * Separated to allow independent re-renders from UI/visualization changes
 */
export interface AudioControlsContextType {
  // Audio Configuration
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

  // Playback Controls
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playOrbitalSequence: () => Promise<void>;
  loopSequence: boolean;
  toggleLoopSequence: () => void;
  liveMode: boolean;
  toggleLiveMode: () => Promise<void>;
  togglePlayPause: () => Promise<void>;

  // Error State
  audioError: string | null;
  setAudioError: (error: string | null) => void;
  audioHealthStatus: 'healthy' | 'degraded' | 'failed';
  setAudioHealthStatus: (status: 'healthy' | 'degraded' | 'failed') => void;
}

const AudioControlsContext = createContext<AudioControlsContextType | undefined>(undefined);

interface AudioControlsProviderProps {
  children: ReactNode;
  value: AudioControlsContextType;
}

export const AudioControlsProvider: React.FC<AudioControlsProviderProps> = ({ children, value }) => (
  <AudioControlsContext.Provider value={value}>
    {children}
  </AudioControlsContext.Provider>
);

export { AudioControlsContext };
