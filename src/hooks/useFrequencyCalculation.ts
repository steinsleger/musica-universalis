import { useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { Planet, CurrentFrequencies, FrequencyMode, AudioScalingConfig } from '../utils/types';
import { calculatePlanetaryFrequency } from '../utils/calculatePlanetaryFrequency';
import { calculateFrequencyGain, calculateAdvancedFrequencyGain } from '../utils/audioScaling';

interface UseFrequencyCalculationReturn {
  calculateFrequency: (baseFreq: number, planet: Planet, mode: FrequencyMode) => number;
  calculateAllFrequencies: (baseFreq: number, planets: Planet[], mode: FrequencyMode) => CurrentFrequencies;
  applyGain: (frequency: number, gainNode: Tone.Gain | null, config: AudioScalingConfig, useFletcher: boolean) => void;
  frequencyToNote: (frequency: number) => string;
}

export const useFrequencyCalculation = (): UseFrequencyCalculationReturn => {
  const lastFrequenciesRef = useRef<CurrentFrequencies>({});

  const calculateFrequency = useCallback((baseFreq: number, planet: Planet, mode: FrequencyMode): number => {
    return calculatePlanetaryFrequency(baseFreq, planet, mode);
  }, []);

  const calculateAllFrequencies = useCallback(
    (baseFreq: number, planets: Planet[], mode: FrequencyMode): CurrentFrequencies => {
      const frequencies: CurrentFrequencies = {};
      planets.forEach(planet => {
        frequencies[planet.name] = calculateFrequency(baseFreq, planet, mode);
      });
      lastFrequenciesRef.current = frequencies;
      return frequencies;
    },
    [calculateFrequency]
  );

  const applyGain = useCallback(
    (frequency: number, gainNode: Tone.Gain | null, config: AudioScalingConfig, useFletcher: boolean): void => {
      if (!gainNode || gainNode.disposed) return;

      const gain = useFletcher
        ? calculateAdvancedFrequencyGain(frequency, {
            referenceFrequency: config.referenceFrequency,
            scalingFactor: config.scalingFactor,
            minimumGain: config.minimumGain,
            maximumGain: config.maximumGain,
            highFrequencyCutoff: config.highFrequencyCutoff,
            highFrequencyScalingFactor: config.highFrequencyScalingFactor
          })
        : calculateFrequencyGain(frequency, {
            referenceFrequency: config.referenceFrequency,
            scalingFactor: config.scalingFactor,
            minimumGain: config.minimumGain,
            maximumGain: config.maximumGain,
            highFrequencyCutoff: config.highFrequencyCutoff,
            highFrequencyScalingFactor: config.highFrequencyScalingFactor
          });

      try {
        const now = Tone.now();
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);

        setTimeout(() => {
          try {
            gainNode.gain.value = gain;
          } catch {
            // Ignore direct set failures
          }
        }, 60);
      } catch (error) {
        console.error('Error applying gain:', error);
      }
    },
    []
  );

  const frequencyToNote = useCallback((frequency: number): string => {
    if (!frequency) return '';

    const A4 = 440.0;
    const C0 = A4 * Math.pow(2, -4.75);
    const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / C0));

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(halfStepsFromC0 / 12);
    const noteIndex = halfStepsFromC0 % 12;

    return noteNames[noteIndex] + octave;
  }, []);

  return {
    calculateFrequency,
    calculateAllFrequencies,
    applyGain,
    frequencyToNote
  };
};
