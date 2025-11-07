/**
 * Audio Configuration Defaults
 *
 * Centralized default values for audio configuration including:
 * - Synthesis settings
 * - Safety/Protection settings
 * - Playback defaults
 */

/**
 * Base audio frequency settings
 */
export const AUDIO_FREQUENCY_DEFAULTS = {
  baseFrequency: 110,      // Hz - reference frequency for frequency calculations
  minFrequency: 20,        // Hz - minimum audible frequency
  maxFrequency: 20000      // Hz - maximum audible frequency
} as const;

/**
 * Volume and gain settings
 */
export const AUDIO_VOLUME_DEFAULTS = {
  masterVolume: 0.35,
  minVolume: 0,
  maxVolume: 1,
  minimumGain: 0.05,       // Lowest gain level (hearing protection)
  maximumGain: 1.2         // Highest gain level (distortion protection)
} as const;

/**
 * Playback settings
 */
export const AUDIO_PLAYBACK_DEFAULTS = {
  sequenceBPM: 60,         // Beats per minute for sequence playback
  minBPM: 30,
  maxBPM: 300,
  loopSequence: false      // Whether sequence loops by default
} as const;

/**
 * Synth/Oscillator settings
 * Defines the sound characteristics
 */
export const SYNTH_ENVELOPE = {
  attack: 0.05,      // Seconds - fade in time
  decay: 0.1,        // Seconds - decay from peak
  sustain: 0.4,      // Level - sustained volume
  release: 1.2       // Seconds - fade out time
} as const;

export const SYNTH_OSCILLATOR = {
  type: 'sine',      // Pure sine wave for harmonic sounds
  count: 1           // Number of oscillators
} as const;

/**
 * Reverb/Effects settings
 */
export const REVERB_DEFAULTS = {
  decay: 4,          // Seconds - reverb tail length
  wet: 0.3           // Wet/dry mix (0-1)
} as const;

/**
 * Sequence synth settings (for playback mode)
 */
export const SEQUENCE_SYNTH_ENVELOPE = {
  attack: 0.02,      // Faster attack for sequence
  decay: 0.1,
  sustain: 0.3,
  release: 1
} as const;

/**
 * Audio Safety/Hearing Protection defaults
 * Used by AudioSafetyService
 */
export const AUDIO_SAFETY_DEFAULTS = {
  referenceFrequency: 55,           // Hz - baseline frequency for gain calculation
  scalingFactor: 0.4,               // Logarithmic scaling factor
  highFrequencyCutoff: 2000,        // Hz - where high-freq attenuation starts
  highFrequencyScalingFactor: 0.6,  // Additional scaling for high frequencies
  fletcherMunsonEnabled: true       // Apply human hearing curve by default
} as const;

/**
 * Fletcher-Munson curve settings
 * Models human hearing sensitivity at different frequencies
 */
export const FLETCHER_MUNSON_DEFAULTS = {
  peakFrequency: 3500,  // Hz - where human hearing is most sensitive
  enabled: true,
  sensitivityFactor: 0.7
} as const;

/**
 * Animation and frame rate settings
 */
export const ANIMATION_DEFAULTS = {
  targetFrameRate: 60,          // FPS
  animationSpeed: 1,            // Speed multiplier
  minAnimationSpeed: 0.1,
  maxAnimationSpeed: 5
} as const;

/**
 * All audio defaults combined for easy access
 */
export const ALL_AUDIO_DEFAULTS = {
  frequency: AUDIO_FREQUENCY_DEFAULTS,
  volume: AUDIO_VOLUME_DEFAULTS,
  playback: AUDIO_PLAYBACK_DEFAULTS,
  synth: SYNTH_ENVELOPE,
  oscillator: SYNTH_OSCILLATOR,
  reverb: REVERB_DEFAULTS,
  sequenceSynth: SEQUENCE_SYNTH_ENVELOPE,
  safety: AUDIO_SAFETY_DEFAULTS,
  fletcherMunson: FLETCHER_MUNSON_DEFAULTS,
  animation: ANIMATION_DEFAULTS
} as const;
