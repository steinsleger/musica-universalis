import { useCallback, MutableRefObject } from 'react';
import { CurrentFrequencies, AudioScalingConfig, SynthObject } from '../utils/types';
import { SynthManager } from '../utils/synthManager';
import {
  calculateFrequencyGain,
  calculateAdvancedFrequencyGain,
  safelyTriggerNote
} from '../utils/audioScaling';

interface UsePlanetAudioManagementProps {
  synthManagerRef: MutableRefObject<SynthManager>;
  synthsRef: MutableRefObject<Record<string, SynthObject>>;
  gainNodesRef: MutableRefObject<Record<string, any>>;
  activeSynthsRef: MutableRefObject<Set<string>>;
  currentFrequencies: CurrentFrequencies;
  audioScalingConfig: AudioScalingConfig;
  useFletcher: boolean;
  debugAudio: (msg: string) => void;
}

interface PlanetAudioManagement {
  createIsolatedSynth: (planetName: string) => SynthObject | null;
  startPlanetSound: (planetName: string, frequency: number) => boolean;
  stopPlanetSound: (planetName: string) => boolean;
  updatePlanetFrequency: (planetName: string, frequency: number) => boolean;
  getAdjustedGain: (frequency: number) => number;
}

export const usePlanetAudioManagement = ({
  synthManagerRef,
  synthsRef,
  gainNodesRef,
  activeSynthsRef,
  currentFrequencies,
  audioScalingConfig,
  useFletcher,
  debugAudio
}: UsePlanetAudioManagementProps): PlanetAudioManagement => {
  const createIsolatedSynth = useCallback((planetName: string): SynthObject | null => {
    const synthObj = synthManagerRef.current.createSynth(
      planetName,
      currentFrequencies[planetName],
      audioScalingConfig,
      useFletcher
    );

    if (synthObj) {
      synthsRef.current[planetName] = synthObj;
      gainNodesRef.current[planetName] = synthObj.gain;
    }

    return synthObj;
  }, [synthManagerRef, currentFrequencies, audioScalingConfig, useFletcher]);

  const getAdjustedGain = useCallback((frequency: number): number => {
    if (!frequency) return 1.0;

    try {
      return useFletcher
        ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
        : calculateFrequencyGain(frequency, audioScalingConfig);
    } catch {
      console.error('[ERROR getAdjustedGain] Error calculating gain:');
      return 1.0;
    }
  }, [useFletcher, audioScalingConfig]);

  const startPlanetSound = useCallback((planetName: string, frequency: number): boolean => {
    try {
      if (synthManagerRef.current.isPlaying(planetName)) {
        updatePlanetFrequency(planetName, frequency);
        return true;
      }

      let synthObj = synthManagerRef.current.getSynth(planetName);
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
        synthObj = createIsolatedSynth(planetName);
        if (!synthObj || !synthObj.synth) return false;
      }

      let gain: number;
      try {
        gain = useFletcher
          ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
          : calculateFrequencyGain(frequency, audioScalingConfig);
      } catch {
        console.error(`[ERROR] Failed to calculate gain for ${planetName}:`);
        gain = 0.5;
      }

      if (synthObj.gain) {
        synthManagerRef.current.updateGain(planetName, gain);
        gainNodesRef.current[planetName] = synthObj.gain;
      }

      safelyTriggerNote(
        synthObj.synth,
        frequency,
        0.7,
        null,
        synthObj.gain,
        audioScalingConfig
      );

      activeSynthsRef.current.add(planetName);
      return true;
    } catch {
      console.error(`Failed to start sound for ${planetName}:`);
      return false;
    }
  }, [synthManagerRef, createIsolatedSynth, updatePlanetFrequency, useFletcher, audioScalingConfig]);

  const stopPlanetSound = useCallback((planetName: string): boolean => {
    try {
      const success = synthManagerRef.current.stopSound(planetName);
      activeSynthsRef.current.delete(planetName);
      return success;
    } catch {
      console.error(`Failed to stop sound for ${planetName}:`);
      activeSynthsRef.current.delete(planetName);

      try {
        createIsolatedSynth(planetName);
      } catch (recreateErr) {
        console.error(`Failed to recreate synth for ${planetName}:`, recreateErr);
      }

      return false;
    }
  }, [synthManagerRef, createIsolatedSynth]);

  const updatePlanetFrequency = useCallback((planetName: string, frequency: number): boolean => {
    try {
      const synthObj = synthManagerRef.current.getSynth(planetName);
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) return false;

      const currentFreq = Number(synthObj.synth.frequency.value);
      const freqDiff = Math.abs(currentFreq - frequency);
      const freqRatio = frequency / currentFreq;

      if (freqDiff > 1 || freqRatio < 0.98 || freqRatio > 1.02) {
        const gain = getAdjustedGain(frequency);
        synthObj.synth.frequency.value = frequency;

        if (synthObj.gain) {
          synthManagerRef.current.updateGain(planetName, gain);
        }
      }

      return true;
    } catch {
      console.error(`Error updating frequency for ${planetName}:`);
      const wasActive = activeSynthsRef.current.has(planetName);
      if (wasActive) {
        stopPlanetSound(planetName);
        const synthObj = createIsolatedSynth(planetName);
        if (synthObj && synthObj.synth) {
          startPlanetSound(planetName, frequency);
        }
      }
      return false;
    }
  }, [synthManagerRef, getAdjustedGain, activeSynthsRef, stopPlanetSound, createIsolatedSynth, startPlanetSound]);

  return {
    createIsolatedSynth,
    startPlanetSound,
    stopPlanetSound,
    updatePlanetFrequency,
    getAdjustedGain
  };
};
