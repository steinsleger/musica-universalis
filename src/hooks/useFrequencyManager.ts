import { useCallback, MutableRefObject } from 'react';
import * as Tone from 'tone';
import { Planet, CurrentFrequencies, FrequencyMode } from '../types/domain';
import { AudioScalingConfig, SynthObject } from '../types/audio';
import { SynthManager } from '@/services/audio/SynthManager';
import { FrequencyService } from '@/services/frequency/FrequencyService';
import { calculateFrequencyGain, calculateAdvancedFrequencyGain } from '@/services/audio/AudioSafetyService';

/**
 * Parameters for frequency manager initialization
 */
interface UseFrequencyManagerParams {
  synthManagerRef: MutableRefObject<SynthManager>;
  synthsRef: MutableRefObject<Record<string, SynthObject>>;
  gainNodesRef: MutableRefObject<Record<string, Tone.Gain>>;
  activeSynthsRef: MutableRefObject<Set<string>>;
  currentFrequencies: CurrentFrequencies;
  audioScalingConfig: AudioScalingConfig;
  useFletcher: boolean;
}

/**
 * API for frequency operations and audio synthesis
 */
interface FrequencyManager {
  // Core calculation
  calculateFrequency: (baseFreq: number, planet: Planet, mode: FrequencyMode) => number;
  calculateAllFrequencies: (baseFreq: number, planets: Planet[], mode: FrequencyMode) => CurrentFrequencies;

  // Conversion utilities
  frequencyToNote: (frequency: number | undefined) => string;
  getAdjustedGain: (frequency: number) => number;

  // Audio operations
  createIsolatedSynth: (planetName: string) => SynthObject | null;
  startPlanetSound: (planetName: string, frequency: number) => boolean;
  stopPlanetSound: (planetName: string) => boolean;
  updatePlanetFrequency: (planetName: string, frequency: number) => boolean;

  // Batch operations
  stopAllSounds: () => void;
}

/**
 * Manages frequency calculations and audio synthesis
 * Handles Titius-Bode formula calculations, gain scaling, and synth operations
 */
export function useFrequencyManager({
  synthManagerRef,
  synthsRef,
  gainNodesRef,
  activeSynthsRef,
  currentFrequencies,
  audioScalingConfig,
  useFletcher
}: UseFrequencyManagerParams): FrequencyManager {
  // ============ Frequency Calculation ============

  const calculateFrequency = useCallback(
    (baseFreq: number, planet: Planet, mode: FrequencyMode): number => {
      const frequencyService = new FrequencyService();
      return frequencyService.calculate(baseFreq, planet, mode);
    },
    []
  );

  const calculateAllFrequencies = useCallback(
    (baseFreq: number, planets: Planet[], mode: FrequencyMode): CurrentFrequencies => {
      const frequencies: CurrentFrequencies = {};
      planets.forEach(planet => {
        frequencies[planet.name] = calculateFrequency(baseFreq, planet, mode);
      });
      return frequencies;
    },
    [calculateFrequency]
  );

  // ============ Conversion Utilities ============

  const frequencyToNote = useCallback((frequency: number | undefined): string => {
    if (!frequency) return '';

    const A4 = 440.0;
    const C0 = A4 * Math.pow(2, -4.75);
    const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(halfStepsFromC0 / 12);
    const noteIndex = halfStepsFromC0 % 12;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return `${noteNames[noteIndex]}${octave}`;
  }, []);

  const getAdjustedGain = useCallback(
    (frequency: number): number => {
      if (!frequency) return 1.0;

      try {
        return useFletcher
          ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
          : calculateFrequencyGain(frequency, audioScalingConfig);
      } catch {
        console.error('[ERROR getAdjustedGain] Error calculating gain:');
        return 1.0;
      }
    },
    [useFletcher, audioScalingConfig]
  );

  // ============ Audio Operations ============

  const createIsolatedSynth = useCallback(
    (planetName: string): SynthObject | null => {
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
    },
    [synthManagerRef, currentFrequencies, audioScalingConfig, useFletcher, synthsRef, gainNodesRef]
  );

  const stopPlanetSound = useCallback(
    (planetName: string): boolean => {
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
    },
    [synthManagerRef, createIsolatedSynth, activeSynthsRef]
  );

  const updatePlanetFrequency = useCallback(
    (planetName: string, frequency: number): boolean => {
      try {
        const synthObj = synthManagerRef.current.getSynth(planetName);
        if (!synthObj || !synthObj.synth || synthObj.synth.disposed) return false;

        const currentFreq = Number(synthObj.synth.frequency.value);
        const freqDiff = Math.abs(currentFreq - frequency);
        const freqRatio = frequency / currentFreq;

        // Update only if change exceeds threshold (>1Hz or >2% change)
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
        return false;
      }
    },
    [synthManagerRef, getAdjustedGain]
  );

  const startPlanetSound = useCallback(
    (planetName: string, frequency: number): boolean => {
      try {
        if (activeSynthsRef.current.has(planetName)) {
          return updatePlanetFrequency(planetName, frequency);
        }

        let synthObj = synthManagerRef.current.getSynth(planetName);
        if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
          synthObj = createIsolatedSynth(planetName);
          if (!synthObj || !synthObj.synth) return false;
        }

        const gain = getAdjustedGain(frequency);

        if (synthObj.gain) {
          synthManagerRef.current.updateGain(planetName, gain);
          gainNodesRef.current[planetName] = synthObj.gain;
        }

        synthObj.synth.frequency.value = frequency;
        synthObj.synth.triggerAttack(Tone.now());

        activeSynthsRef.current.add(planetName);
        return true;
      } catch {
        console.error(`Failed to start sound for ${planetName}:`);
        return false;
      }
    },
    [
      activeSynthsRef,
      updatePlanetFrequency,
      createIsolatedSynth,
      getAdjustedGain,
      synthManagerRef,
      gainNodesRef
    ]
  );

  // ============ Batch Operations ============

  const stopAllSounds = useCallback(() => {
    activeSynthsRef.current.forEach(planetName => {
      stopPlanetSound(planetName);
    });
    activeSynthsRef.current.clear();
  }, [activeSynthsRef, stopPlanetSound]);

  return {
    // Calculation
    calculateFrequency,
    calculateAllFrequencies,

    // Conversion
    frequencyToNote,
    getAdjustedGain,

    // Audio operations
    createIsolatedSynth,
    startPlanetSound,
    stopPlanetSound,
    updatePlanetFrequency,

    // Batch
    stopAllSounds
  };
}
