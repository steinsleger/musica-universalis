/**
 * Services Index - Central export point for all service layer
 *
 * This file exports all services, strategies, and providers from the service layer.
 * Services are decoupled from React and provide pure business logic.
 */

// Audio Service
export { ToneAudioProvider } from './audio/ToneAudioProvider';
export type {
  AudioProvider,
  AudioContextState,
  AudioScalingConfig,
  SequenceTimingParams,
  SynthObject
} from './audio/AudioProvider';

// Audio Safety Service
export { AudioSafetyService } from './audio/AudioSafetyService';
export type { AudioSafetyConfig } from './audio/AudioSafetyService';

// Frequency Service
export { FrequencyCalculator } from './frequency/FrequencyCalculator';
export type { FrequencyCalculatorConfig } from './frequency/FrequencyCalculator';

// Frequency Strategies
export {
  MurchFormulaStrategy,
  ActualDistanceStrategy,
  HarmonicSeriesStrategy
} from './frequency/FrequencyStrategy';
export type { FrequencyStrategy } from './frequency/FrequencyStrategy';
