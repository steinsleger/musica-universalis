/**
 * Utility functions for audio safety and frequency-based gain scaling
 */
import * as Tone from 'tone';

interface GainOptions {
  referenceFrequency?: number;
  scalingFactor?: number;
  minimumGain?: number;
  maximumGain?: number;
  highFrequencyCutoff?: number;
  highFrequencyScalingFactor?: number;
}

/**
 * Calculate the appropriate gain level for a given frequency using a logarithmic curve
 * that protects hearing by reducing volume for higher frequencies.
 * @param frequency - The frequency in Hz
 * @param options - Configuration options
 * @returns The calculated gain value between minimumGain and maximumGain
 */
export const calculateFrequencyGain = (
  frequency: number,
  options: GainOptions = {}
): number => {
  const {
    referenceFrequency = 55,
    scalingFactor = 0.4,
    minimumGain = 0.05,
    maximumGain = 1.2,
    highFrequencyCutoff = 2000,
    highFrequencyScalingFactor = 0.6
  } = options;

  if (!frequency || frequency <= 0) return 1.0;

  const ratio = referenceFrequency / frequency;
  let gain = Math.pow(ratio, scalingFactor);

  if (frequency > highFrequencyCutoff) {
    const additionalReduction = Math.pow(
      highFrequencyCutoff / frequency,
      highFrequencyScalingFactor
    );
    gain *= additionalReduction;
  }

  gain = Math.max(minimumGain, Math.min(maximumGain, gain));

  return gain;
};

/**
 * Apply frequency-dependent gain to a Tone.js synth for safer playing
 * @param synth - A Tone.js synthesizer
 * @param frequency - The frequency to play
 * @param velocity - The velocity/volume (0-1)
 * @param duration - Note duration (e.g., "8n", "4n", "1n")
 * @param gainNode - Optional Tone.js Gain node for volume control
 * @param options - Options for gain calculation
 */
export const safelyTriggerNote = (
  synth: Tone.Synth,
  frequency: number,
  velocity: number = 0.7,
  duration: string | null,
  gainNode: Tone.Gain | null = null,
  options: GainOptions = {}
): void => {
  if (!synth || !frequency) return;

  const gain = calculateFrequencyGain(frequency, options);

  if (gainNode) {
    try {
      const now = Tone.now();
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);

      setTimeout(() => {
        try {
          gainNode.gain.value = gain;
        } catch {
          console.error('[SAFE TRIGGER] Error with direct gain set:');
        }
      }, 60);
    } catch {
      console.error('[SAFE TRIGGER] Error setting gain:');
      try {
        gainNode.gain.value = gain;
      } catch (directErr) {
        console.error('[SAFE TRIGGER] Direct gain set also failed:', directErr);
      }
    }
  }

  const safeVelocity = velocity * (gainNode ? 1 : gain);

  try {
    if (duration) {
      synth.triggerAttackRelease(frequency, duration, undefined, safeVelocity);
    } else {
      synth.triggerAttack(frequency, undefined, safeVelocity);
    }
  } catch {
    console.error('[SAFE TRIGGER] Error triggering note:');
  }
};

/**
 * The Fletcher-Munson equal loudness contours describe how human hearing
 * sensitivity varies with frequency. This is a simplified approximation.
 * @param frequency - Frequency in Hz
 * @returns Relative sensitivity (higher = more sensitive)
 */
export const getHumanHearingSensitivity = (frequency: number): number => {
  if (frequency < 20) return 0.01;
  if (frequency > 20000) return 0.01;

  const peakFrequency = 3500;
  const logFreq = Math.log10(frequency);
  const logPeak = Math.log10(peakFrequency);
  const logDistance = Math.abs(logFreq - logPeak);

  let sensitivity = 1.0 - Math.min(1, logDistance * 0.7);

  if (frequency < 100) {
    sensitivity *= frequency / 100;
  }

  return Math.max(0.01, sensitivity);
};

/**
 * Create a more sophisticated gain scaling that takes into account
 * both logarithmic falloff and human hearing sensitivity curves
 * @param frequency - The frequency in Hz
 * @param options - Configuration options
 * @returns The calculated gain value
 */
export const calculateAdvancedFrequencyGain = (
  frequency: number,
  options: GainOptions = {}
): number => {
  const baseGain = calculateFrequencyGain(frequency, options);
  const sensitivity = getHumanHearingSensitivity(frequency);

  const sensitivityFactor = 0.7;
  const sensitivityAdjustment = 1.0 - sensitivity * sensitivityFactor;

  let finalGain = baseGain * (0.3 + sensitivityAdjustment * 0.7);

  finalGain = Math.max(
    options.minimumGain || 0.05,
    Math.min(options.maximumGain || 1.2, finalGain)
  );

  return finalGain;
};

export type { GainOptions };
