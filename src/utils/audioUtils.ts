import * as Tone from 'tone';

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

