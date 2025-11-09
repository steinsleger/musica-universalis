/**
 * Services Index - Central export point for all service layer
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
