import * as Tone from 'tone';
import { SynthObject } from './types';

/**
 * Audio Operation Validation Utilities
 * Provides validation and safety checks before performing audio operations
 */

/**
 * Validates that a synth object is in a valid state for operations
 */
export function validateSynthState(synth: SynthObject | null | undefined): synth is SynthObject {
  if (!synth) {
    console.error('[AUDIO VALIDATION] Synth object is null or undefined');
    return false;
  }

  if (!synth.synth || synth.synth.disposed) {
    console.error('[AUDIO VALIDATION] Synth is not initialized or has been disposed');
    return false;
  }

  return true;
}

/**
 * Validates that a gain node is in a valid state for operations
 */
export function validateGainNode(gain: Tone.Gain | null | undefined): gain is Tone.Gain {
  if (!gain) {
    console.error('[AUDIO VALIDATION] Gain node is null or undefined');
    return false;
  }

  if (gain.disposed) {
    console.error('[AUDIO VALIDATION] Gain node has been disposed');
    return false;
  }

  return true;
}

/**
 * Validates that a frequency value is within acceptable bounds
 */
export function validateFrequency(frequency: number): boolean {
  if (!Number.isFinite(frequency)) {
    console.error('[AUDIO VALIDATION] Frequency is not a valid number:', frequency);
    return false;
  }

  if (frequency <= 0) {
    console.error('[AUDIO VALIDATION] Frequency must be positive:', frequency);
    return false;
  }

  if (frequency > 20000) {
    console.warn('[AUDIO VALIDATION] Frequency exceeds human hearing range:', frequency);
    return false;
  }

  return true;
}

/**
 * Validates that the Tone audio context is running
 */
export function validateAudioContext(): boolean {
  if (Tone.getContext().state !== 'running') {
    console.error('[AUDIO VALIDATION] Audio context is not running. State:', Tone.getContext().state);
    return false;
  }

  return true;
}

/**
 * Safely checks if a synth has a valid frequency value
 */
export function getSynthFrequency(synth: SynthObject | null): number | null {
  if (!validateSynthState(synth)) {
    return null;
  }

  try {
    const freq = Number(synth.synth.frequency.value);
    if (Number.isFinite(freq) && freq > 0) {
      return freq;
    }
    console.error('[AUDIO VALIDATION] Invalid frequency value in synth:', freq);
    return null;
  } catch (error) {
    console.error('[AUDIO VALIDATION] Error reading synth frequency:', error);
    return null;
  }
}

/**
 * Validates gain value is within acceptable bounds
 */
export function validateGainValue(gain: number): boolean {
  if (!Number.isFinite(gain)) {
    console.error('[AUDIO VALIDATION] Gain is not a valid number:', gain);
    return false;
  }

  if (gain < 0) {
    console.error('[AUDIO VALIDATION] Gain must be non-negative:', gain);
    return false;
  }

  if (gain > 2) {
    console.warn('[AUDIO VALIDATION] Gain exceeds safe bounds:', gain);
    return false;
  }

  return true;
}

/**
 * Provides a comprehensive validation result for audio operations
 */
export interface AudioValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates all prerequisites for starting a planet sound
 */
export function validateStartSoundPrerequisites(
  synth: SynthObject | null,
  frequency: number
): AudioValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!validateSynthState(synth)) {
    errors.push('Synth is not in a valid state');
  }

  if (!validateFrequency(frequency)) {
    errors.push('Frequency is not valid');
  }

  if (!validateAudioContext()) {
    errors.push('Audio context is not running');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates all prerequisites for updating a synth frequency
 */
export function validateUpdateFrequencyPrerequisites(
  synth: SynthObject | null,
  newFrequency: number
): AudioValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!validateSynthState(synth)) {
    errors.push('Synth is not in a valid state');
    return { isValid: false, errors, warnings };
  }

  if (!validateFrequency(newFrequency)) {
    errors.push('New frequency is not valid');
  }

  const currentFreq = getSynthFrequency(synth);
  if (currentFreq === null) {
    warnings.push('Could not read current frequency');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
