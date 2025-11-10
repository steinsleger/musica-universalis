/**
 * Audio Service Interface
 * Defines the contract for audio synthesis and management
 */

import { SynthObject, AudioScalingConfig } from '@/types/audio';

export interface AudioService {
  /**
   * Initialize the audio context and prepare for playback
   */
  initialize(): Promise<void>;

  /**
   * Create a synth for a specific planet
   */
  createSynth(
    planetName: string,
    frequency: number | undefined,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): SynthObject | null;

  /**
   * Trigger a note on a synth
   */
  startSound(planetName: string, frequency: number): boolean;

  /**
   * Stop a note on a synth
   */
  stopSound(planetName: string): boolean;

  /**
   * Update gain for a synth
   */
  updateGain(planetName: string, gainValue: number): void;

  /**
   * Update gains for all synths based on frequency data
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
   * Clean up and dispose of all synths
   */
  cleanup(): void;
}
