/**
 * AudioProvider interface - Abstract audio system operations from implementation
 * This allows for different implementations (Tone.js, Web Audio API, mocks, etc.)
 */

import type { AudioScalingConfig } from '../../types';

export interface SynthObject {
  synth: unknown;
  gain: unknown;
}

export interface AudioContextState {
  isRunning: boolean;
  needsUserInteraction: boolean;
}

export interface SequenceTimingParams {
  beatDuration: number;
  noteDuration: number;
  interval: number;
}

export { AudioScalingConfig };

export interface AudioProvider {
  /**
   * Initialize the audio provider
   */
  initialize(): Promise<void>;

  /**
   * Resume audio context if needed (for browser audio requirements)
   */
  resumeIfNeeded(): Promise<void>;

  /**
   * Get current audio context state
   */
  getContextState(): AudioContextState;

  /**
   * Create a synth for a planet
   */
  createSynth(
    planetName: string,
    frequency: number | undefined,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): SynthObject | null;

  /**
   * Dispose of a synth for a planet
   */
  disposeSynth(planetName: string): void;

  /**
   * Start playing a synth at given frequency
   */
  startSound(planetName: string, frequency: number): boolean;

  /**
   * Stop playing a synth
   */
  stopSound(planetName: string): boolean;

  /**
   * Update gain for a synth
   */
  updateGain(planetName: string, gainValue: number): void;

  /**
   * Update gains for all synths
   */
  updateAllGains(
    frequencies: Record<string, number>,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): void;

  /**
   * Set master volume for all synths
   */
  setMasterVolume(volume: number): void;

  /**
   * Check if a synth is currently playing
   */
  isPlaying(planetName: string): boolean;

  /**
   * Get all active synth names
   */
  getActiveSynths(): string[];

  /**
   * Create or recreate reverb effect
   */
  createReverb(): unknown;

  /**
   * Set reverb node reference
   */
  setReverbNode(reverb: unknown): void;

  /**
   * Trigger a synth note with gain protection
   */
  triggerNote(
    planetName: string,
    frequency: number,
    gainValue: number,
    duration?: number
  ): void;

  /**
   * Clean up all resources
   */
  disposeAll(): void;

  /**
   * Calculate sequence timing based on BPM
   */
  calculateSequenceTiming(bpm: number): SequenceTimingParams;

  /**
   * Create a polyphonic synth for sequence playback
   */
  createPolySynth(): unknown;

  /**
   * Dispose a polyphonic synth
   */
  disposePolySynth(synth: unknown): unknown;

  /**
   * Create a gain node
   */
  createGain(initialValue?: number): unknown;

  /**
   * Get the audio context's current time
   */
  getCurrentTime(): number;
}
