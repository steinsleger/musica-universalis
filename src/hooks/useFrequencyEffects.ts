import { useEffect } from 'react';
import * as Tone from 'tone';
import { CurrentFrequencies, AudioScalingConfig, Planet, SynthObject } from '../types';
import { SynthManager } from '../utils/synthManager';

interface UseFrequencyEffectsParams {
  liveMode: boolean;
  isPaused: boolean;
  baseFrequency: number;
  currentFrequencies: CurrentFrequencies;
  orbitData: Planet[];
  calculateBaseFrequencies: (baseFreq: number, planet: Planet, index: number) => number;
  setCurrentFrequencies: (frequencies: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies)) => void;
  useFletcher: boolean;
  audioScalingConfig: AudioScalingConfig;
  synthManagerRef: React.RefObject<SynthManager>;
  synthsRef: React.RefObject<Record<string, SynthObject>>;
  gainNodesRef: React.RefObject<Record<string, Tone.Gain>>;
}

export const useFrequencyEffects = ({
  liveMode,
  isPaused,
  baseFrequency,
  currentFrequencies,
  orbitData,
  calculateBaseFrequencies,
  setCurrentFrequencies,
  useFletcher,
  audioScalingConfig,
  synthManagerRef,
  synthsRef,
  gainNodesRef
}: UseFrequencyEffectsParams): void => {
  // Update frequencies when base frequency changes in live mode
  useEffect(() => {
    if (liveMode && !isPaused) {
      const updatedFrequencies: CurrentFrequencies = {};
      orbitData.forEach((planet, index) => {
        if (planet.enabled) {
          const baseFreq = calculateBaseFrequencies(baseFrequency, planet, index);
          updatedFrequencies[planet.name] = baseFreq;
        }
      });

      setCurrentFrequencies(prevFreqs => ({
        ...prevFreqs,
        ...updatedFrequencies
      }));
    }
  }, [baseFrequency, liveMode, isPaused, orbitData, calculateBaseFrequencies, setCurrentFrequencies]);

  // Update gains when Fletcher curves or audio scaling changes
  useEffect(() => {
    if (!liveMode) return;

    window.lastAudioUpdate = Date.now();

    const enabledFrequencies: CurrentFrequencies = {};
    Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
      const planet = orbitData.find(p => p.name === planetName);
      if (planet && planet.enabled && freq) {
        enabledFrequencies[planetName] = freq;
      }
    });

    synthManagerRef.current.updateAllGains(enabledFrequencies, audioScalingConfig, useFletcher);

    Object.keys(enabledFrequencies).forEach(planetName => {
      const synthObj = synthManagerRef.current.getSynth(planetName);
      if (synthObj) {
        synthsRef.current[planetName] = synthObj;
        gainNodesRef.current[planetName] = synthObj.gain;
      }
    });
  }, [
    useFletcher,
    audioScalingConfig,
    liveMode,
    orbitData,
    currentFrequencies,
    synthManagerRef,
    synthsRef,
    gainNodesRef
  ]);
};
