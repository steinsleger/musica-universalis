import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { AudioScalingConfig } from '../types';
import { getDefaultAudioScalingConfig } from '../utils/constants';
import {
  DEFAULT_BASE_FREQUENCY,
  DEFAULT_MASTER_VOLUME,
  DEFAULT_SEQUENCE_BPM
} from '../utils/constants';

interface AudioConfigContextType {
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

const AudioConfigContext = createContext<AudioConfigContextType | undefined>(undefined);

interface AudioConfigProviderProps {
  children: ReactNode;
}

export const AudioConfigProvider: React.FC<AudioConfigProviderProps> = ({ children }) => {
  const [baseFrequency, setBaseFrequency] = useState(DEFAULT_BASE_FREQUENCY);
  const [masterVolume, setMasterVolume] = useState(DEFAULT_MASTER_VOLUME);
  const [sequenceBPM, setSequenceBPM] = useState(DEFAULT_SEQUENCE_BPM);
  const [useFletcher, setUseFletcher] = useState(true);
  const [audioScalingConfig, setAudioScalingConfig] = useState<AudioScalingConfig>(getDefaultAudioScalingConfig());

  const value: AudioConfigContextType = {
    baseFrequency,
    setBaseFrequency: useCallback((freq: number) => setBaseFrequency(freq), []),
    masterVolume,
    setMasterVolume: useCallback((vol: number) => setMasterVolume(vol), []),
    sequenceBPM,
    setSequenceBPM: useCallback((bpm: number) => setSequenceBPM(bpm), []),
    useFletcher,
    setUseFletcher: useCallback((use: boolean) => setUseFletcher(use), []),
    audioScalingConfig,
    setAudioScalingConfig: useCallback((config: AudioScalingConfig) => setAudioScalingConfig(config), [])
  };

  return (
    <AudioConfigContext.Provider value={value}>
      {children}
    </AudioConfigContext.Provider>
  );
};

export { AudioConfigContext };
export type { AudioConfigContextType };
