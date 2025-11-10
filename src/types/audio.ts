/**
 * Audio Types - Audio synthesis and processing types
 *
 * Types specific to audio operations:
 * - Audio scaling and gain configuration
 * - Synthesis objects
 * - Audio health status
 */

import * as Tone from 'tone';

/**
 * Audio scaling configuration for hearing protection
 */
export interface AudioScalingConfig {
  referenceFrequency: number;
  scalingFactor: number;
  minimumGain: number;
  maximumGain: number;
  highFrequencyCutoff: number;
  highFrequencyScalingFactor: number;
}

/**
 * Synth object containing synthesis components
 */
export interface SynthObject {
  synth: Tone.Synth;
  gain: Tone.Gain;
}

/**
 * Audio health status
 */
export type AudioHealthStatus = 'healthy' | 'degraded' | 'failed';
