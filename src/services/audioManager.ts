/**
 * Audio Manager Service - High-level API for audio synthesis
 * Handles synth lifecycle, gain management, and reverb effects
 */

import * as Tone from 'tone';
import { DEFAULT_SYNTH_ENVELOPE, REVERB_AMOUNT } from '../utils/constants';

export interface SynthConfig {
  name: string;
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  oscillatorType?: 'sine' | 'square' | 'sawtooth' | 'triangle';
}

export class AudioManager {
  private synths: Map<string, Tone.Synth> = new Map();
  private gains: Map<string, Tone.Gain> = new Map();
  private mainGain: Tone.Gain;
  private reverb: Tone.Reverb | null = null;
  private disposedSynths: Set<string> = new Set();

  constructor() {
    this.mainGain = new Tone.Gain(0.5);
    this.mainGain.toDestination();
  }

  /**
   * Create a new synth for a planet/voice
   */
  createSynth(config: SynthConfig): Tone.Synth {
    // Dispose old synth if exists
    if (this.synths.has(config.name)) {
      this.disposeSynth(config.name);
    }

    const synth = new Tone.Synth({
      envelope: config.envelope || DEFAULT_SYNTH_ENVELOPE,
      oscillator: { type: config.oscillatorType || 'sine' }
    });

    const gainNode = new Tone.Gain(0.5);
    synth.connect(gainNode);
    gainNode.connect(this.mainGain);

    this.synths.set(config.name, synth);
    this.gains.set(config.name, gainNode);
    this.disposedSynths.delete(config.name);

    return synth;
  }

  /**
   * Dispose of a synth
   */
  disposeSynth(name: string): void {
    const synth = this.synths.get(name);
    const gain = this.gains.get(name);

    if (synth) {
      try {
        synth.dispose();
      } catch {
        // Ignore disposal errors
      }
      this.synths.delete(name);
    }

    if (gain) {
      try {
        gain.dispose();
      } catch {
        // Ignore disposal errors
      }
      this.gains.delete(name);
    }

    this.disposedSynths.add(name);
  }

  /**
   * Get a synth by name
   */
  getSynth(name: string): Tone.Synth | undefined {
    return this.synths.get(name);
  }

  /**
   * Get a gain node by name
   */
  getGain(name: string): Tone.Gain | undefined {
    return this.gains.get(name);
  }

  /**
   * Update gain for a specific voice
   */
  updateGain(name: string, gainValue: number): void {
    const gain = this.gains.get(name);
    if (!gain || gain.disposed) return;

    try {
      const now = Tone.now();
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(Math.max(0.001, gainValue), now + 0.05);
    } catch {
      // Ignore scheduling errors
    }
  }

  /**
   * Update main gain
   */
  setMasterVolume(volume: number): void {
    try {
      this.mainGain.gain.value = Math.max(0, Math.min(1, volume));
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get main gain node
   */
  getMainGain(): Tone.Gain {
    return this.mainGain;
  }

  /**
   * Initialize reverb effect
   */
  initializeReverb(): void {
    if (this.reverb) return;

    this.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: REVERB_AMOUNT
    });

    this.mainGain.disconnect();
    this.mainGain.connect(this.reverb);
    this.reverb.toDestination();
  }

  /**
   * Dispose reverb effect
   */
  disposeReverb(): void {
    if (this.reverb) {
      try {
        this.reverb.dispose();
        this.reverb = null;

        this.mainGain.disconnect();
        this.mainGain.toDestination();
      } catch {
        // Ignore disposal errors
      }
    }
  }

  /**
   * Dispose all synths and cleanup
   */
  disposeAll(): void {
    this.synths.forEach((synth, name) => {
      this.disposeSynth(name);
    });

    this.disposeReverb();

    try {
      this.mainGain.dispose();
    } catch {
      // Ignore disposal errors
    }
  }

  /**
   * Get list of active synth names
   */
  getActiveSynthNames(): string[] {
    return Array.from(this.synths.keys());
  }

  /**
   * Check if synth exists and is not disposed
   */
  hasSynth(name: string): boolean {
    return this.synths.has(name) && !this.disposedSynths.has(name);
  }
}

/**
 * Create a singleton instance
 */
export const createAudioManager = (): AudioManager => {
  return new AudioManager();
};
