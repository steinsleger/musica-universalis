import * as Tone from 'tone';
import { Planet, CurrentFrequencies, SynthObject } from './types';
import { SynthManager } from './synthManager';

/**
 * Get only the enabled planets' frequencies from the full frequencies object
 */
export const getEnabledFrequencies = (
  currentFrequencies: CurrentFrequencies,
  orbitData: Planet[]
): CurrentFrequencies => {
  const result: CurrentFrequencies = {};

  Object.entries(currentFrequencies).forEach(([planetName, frequency]) => {
    const planet = orbitData.find(p => p.name === planetName);
    if (planet?.enabled && frequency) {
      result[planetName] = frequency;
    }
  });

  return result;
};

/**
 * Synchronize SynthManager results back to legacy ref storage for backward compatibility
 */
export const syncSynthRefs = (
  planetNames: string[],
  synthManager: SynthManager,
  synthsRef: Record<string, SynthObject>,
  gainNodesRef: Record<string, Tone.Gain>
): void => {
  planetNames.forEach(planetName => {
    const synthObj = synthManager.getSynth(planetName);
    if (synthObj) {
      synthsRef[planetName] = synthObj;
      gainNodesRef[planetName] = synthObj.gain;
    }
  });
};

/**
 * Clear all timeouts from the given array and reset it
 */
export const clearSequenceTimeouts = (
  timeoutArray: NodeJS.Timeout[]
): void => {
  timeoutArray.forEach(timeoutId => {
    clearTimeout(timeoutId);
  });
  timeoutArray.length = 0;
};

/**
 * Detect if there's a mismatch between expected and actual sound state
 */
export const detectSoundStateMismatch = (
  enabledPlanets: Planet[],
  activeSynths: Set<string>,
  currentFrequencies: CurrentFrequencies
): boolean => {
  const enabledPlanetNames = new Set(enabledPlanets.map(p => p.name));
  const shouldHaveSounds = enabledPlanetNames.size > 0;
  const hasSounds = activeSynths.size > 0;

  const shouldBePlayingButIsnt = enabledPlanets.some(p =>
    !activeSynths.has(p.name) && currentFrequencies[p.name]
  );

  const shouldNotBePlayingButIs = Array.from(activeSynths).some(name =>
    !enabledPlanetNames.has(name)
  );

  return (shouldHaveSounds && !hasSounds) || shouldBePlayingButIsnt || shouldNotBePlayingButIs;
};

/**
 * Resume audio context with error handling
 */
export const ensureAudioContextRunning = async (): Promise<boolean> => {
  try {
    if (Tone.getContext().state === 'suspended') {
      await Tone.start();
    }
    return true;
  } catch (error) {
    console.error('Failed to resume audio context:', error);
    return false;
  }
};

/**
 * Create a new PolySynth with standard envelope and oscillator settings
 */
export const createSequenceSynth = (gainNode?: Tone.Gain | null): Tone.PolySynth<Tone.Synth> => {
  const synth = new Tone.PolySynth(Tone.Synth, {
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
    oscillator: { type: 'sine' }
  });

  if (gainNode && !gainNode.disposed) {
    synth.connect(gainNode);
  } else {
    synth.toDestination();
  }

  return synth;
};

/**
 * Safely dispose of a PolySynth and return a new one
 */
export const disposeSynthAndCreateNew = (
  synth: Tone.PolySynth<Tone.Synth> | null,
  gainNode?: Tone.Gain | null
): Tone.PolySynth<Tone.Synth> => {
  if (synth) {
    try {
      synth.releaseAll();
      synth.dispose();
    } catch {
      console.error('Error disposing synth during sequence control');
    }
  }

  return createSequenceSynth(gainNode);
};

/**
 * Clear all planet timeouts and return empty array
 */
export const clearPlanetTimeouts = (timeoutArray: NodeJS.Timeout[]): void => {
  timeoutArray.forEach(timeoutId => {
    clearTimeout(timeoutId);
  });
  timeoutArray.length = 0;
};

/**
 * Calculate timing parameters for sequence playback based on BPM
 */
export const calculateSequenceTiming = (bpm: number): {
  beatDuration: number;
  noteDuration: number;
  interval: number;
} => {
  const beatDuration = 60 / bpm;
  return {
    beatDuration,
    noteDuration: beatDuration,
    interval: beatDuration
  };
};
