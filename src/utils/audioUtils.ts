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

/**
 * Check if audio context needs resuming and attempt to resume it
 */
export const resumeAudioContextIfNeeded = async (): Promise<void> => {
  if (Tone.context.state !== 'running') {
    try {
      await Tone.context.resume();
    } catch (error) {
      console.error('Failed to resume audio context:', error);
    }
  }
};

/**
 * Check if a gain node is missing or disposed
 */
export const isGainNodeInvalid = (gainNode: Tone.Gain | null): boolean => {
  return !gainNode || gainNode.disposed;
};

/**
 * Parameters for sound state mismatch recovery
 */
export interface RecoveryParams {
  enabledPlanetNames: Set<string>;
  activeSynths: Set<string>;
  currentFrequencies: CurrentFrequencies;
  debugAudio: (msg: string) => void;
  onStopPlanet: (planetName: string) => void;
  onStartPlanet: (planetName: string, freq: number) => void;
  onFullReset: () => Promise<void>;
}

/**
 * Perform emergency recovery when sound state mismatches are detected
 */
export const performEmergencyRecovery = async (
  params: RecoveryParams
): Promise<{ succeeded: boolean; planetsFixed: number }> => {
  const {
    enabledPlanetNames,
    activeSynths,
    currentFrequencies,
    debugAudio,
    onStopPlanet,
    onStartPlanet,
    onFullReset
  } = params;

  params.debugAudio('EMERGENCY RECOVERY: Sound state mismatch detected');

  let recoverySucceeded = true;
  let planetsFixed = 0;

  // Stop planets that shouldn't be playing
  for (const name of Array.from(activeSynths)) {
    if (!enabledPlanetNames.has(name)) {
      try {
        onStopPlanet(name);
        planetsFixed++;
      } catch {
        console.error(`Error stopping ${name} during recovery:`);
        recoverySucceeded = false;
      }
    }
  }

  // Start planets that should be playing
  for (const planetName of Array.from(enabledPlanetNames)) {
    if (!activeSynths.has(planetName) && currentFrequencies[planetName]) {
      try {
        await new Promise(resolve => setTimeout(resolve, 10));
        onStartPlanet(planetName, currentFrequencies[planetName]);
        planetsFixed++;
        debugAudio(`Recovery: Started sound for ${planetName}`);
      } catch {
        console.error(`Error starting ${planetName} during recovery:`);
        recoverySucceeded = false;
      }
    }
  }

  // If targeted recovery failed, attempt full reset
  if (!recoverySucceeded && planetsFixed === 0) {
    debugAudio('Targeted recovery failed completely, attempting full audio system reset');
    await onFullReset();
  } else {
    debugAudio(`Recovery fixed ${planetsFixed} planets`);
  }

  return { succeeded: recoverySucceeded || planetsFixed > 0, planetsFixed };
};
