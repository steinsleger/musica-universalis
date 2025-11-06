import * as Tone from 'tone';
import { Planet, CurrentFrequencies, SynthObject } from './types';
import { SynthManager } from './synthManager';

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
