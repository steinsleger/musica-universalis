import * as Tone from 'tone';

/**
 * Audio synth configuration for different purposes
 */
export const SYNTH_CONFIGS = {
  // Main synth for orbital sequences
  sequence: {
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
    oscillator: { type: 'sine' as const }
  },
  // Per-planet synths in live mode
  orbital: {
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.4, release: 1.2 },
    oscillator: { type: 'sine' as const }
  }
};

/**
 * Create a PolySynth with standard configuration
 */
export const createPolySynth = (configType: 'sequence' | 'orbital' = 'sequence'): Tone.PolySynth<Tone.Synth> => {
  const config = SYNTH_CONFIGS[configType];
  return new Tone.PolySynth(Tone.Synth, config);
};

/**
 * Create a Synth with standard configuration
 */
export const createSynth = (configType: 'sequence' | 'orbital' = 'orbital'): Tone.Synth => {
  const config = SYNTH_CONFIGS[configType];
  return new Tone.Synth(config);
};

/**
 * Connect synth to gain node and optionally to reverb or destination
 */
export const connectSynthToOutput = (
  synth: Tone.Synth | Tone.PolySynth<Tone.Synth>,
  gainNode: Tone.Gain,
  reverbNode?: Tone.Reverb | null
): void => {
  synth.connect(gainNode);

  if (reverbNode && !reverbNode.disposed) {
    gainNode.connect(reverbNode);
  } else {
    gainNode.toDestination();
  }
};

/**
 * Setup standard reverb node
 */
export const createReverbNode = (decay: number = 1.5, wet: number = 0.5): Tone.Reverb => {
  return new Tone.Reverb({
    decay,
    wet
  });
};

/**
 * Initialize Tone audio context with proper error handling
 */
export const initializeToneContext = async (): Promise<boolean> => {
  try {
    await Tone.start();

    if (Tone.context.state !== 'running') {
      try {
        await Tone.context.resume();
      } catch {
        // Fallback for browsers that don't support resume
      }
    }

    return Tone.context.state === 'running';
  } catch (error) {
    console.error('Failed to initialize Tone context:', error);
    return false;
  }
};

/**
 * Safely dispose a synth or audio node
 */
export const safeDispose = (node: Tone.BaseAudioContext | Tone.Synth | Tone.PolySynth<any> | Tone.Gain | Tone.Reverb | null | undefined): void => {
  try {
    if (node && !node.disposed) {
      node.dispose();
    }
  } catch {
    // Ignore disposal errors
  }
};
