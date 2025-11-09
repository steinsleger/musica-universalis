import { useContext, useMemo } from 'react';
import { OrbitalStateContext } from '../context/OrbitalStateContext';
import type { AudioScalingConfig } from '../types';

/**
 * Audio configuration context type - extracted from OrbitalStateContext
 */
export interface AudioConfigContextType {
  baseFrequency: number;
  setBaseFrequency: (freq: number) => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  sequenceBPM: number;
  setSequenceBPM: (bpm: number) => void;
  useFletcher: boolean;
  setUseFletcher: (use: boolean) => void;
  audioScalingConfig: AudioScalingConfig;
  setAudioScalingConfig: (config: AudioScalingConfig) => void;
}

/**
 * Hook to access audio configuration from OrbitalStateContext
 * Provides the same interface as the old AudioConfigContext for backward compatibility
 */
export const useAudioConfig = (): AudioConfigContextType => {
  const context = useContext(OrbitalStateContext);
  if (!context) {
    throw new Error('useAudioConfig must be used within OrbitalStateProvider');
  }

  return useMemo(
    () => ({
      baseFrequency: context.state.baseFrequency,
      setBaseFrequency: context.setBaseFrequency,
      masterVolume: context.state.masterVolume,
      setMasterVolume: context.setMasterVolume,
      sequenceBPM: context.state.sequenceBPM,
      setSequenceBPM: context.setSequenceBPM,
      useFletcher: context.state.useFletcher,
      setUseFletcher: context.setUseFletcher,
      audioScalingConfig: context.state.audioScalingConfig,
      setAudioScalingConfig: context.setAudioScalingConfig
    }),
    [context]
  );
};
