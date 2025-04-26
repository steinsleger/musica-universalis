// src/utils/audioScaling.js
import * as Tone from 'tone';

/**
 * Utility functions for audio safety and frequency-based gain scaling
 */

/**
 * Calculate the appropriate gain level for a given frequency using a logarithmic curve
 * that protects hearing by reducing volume for higher frequencies.
 * 
 * @param {number} frequency - The frequency in Hz
 * @param {Object} options - Configuration options
 * @param {number} options.referenceFrequency - Base frequency at which gain = 1.0 (default: 55Hz)
 * @param {number} options.scalingFactor - How aggressively to scale (default: 0.4)
 * @param {number} options.minimumGain - Floor value to ensure audibility (default: 0.05)
 * @param {number} options.maximumGain - Ceiling value to prevent distortion (default: 1.2)
 * @param {number} options.highFrequencyCutoff - Frequency above which extra reduction is applied (default: 2000Hz)
 * @param {number} options.highFrequencyScalingFactor - Extra scaling for high frequencies (default: 0.6)
 * @returns {number} The calculated gain value between minimumGain and maximumGain
 */
export const calculateFrequencyGain = (frequency, options = {}) => {
    // Default configuration values
    const {
      referenceFrequency = 55,       // A1 is our reference point
      scalingFactor = 0.4,           // How strong the effect is
      minimumGain = 0.05,            // Ensure sounds are still audible
      maximumGain = 1.2,             // Prevent distortion for low frequencies
      highFrequencyCutoff = 2000,    // Additional safety for very high frequencies
      highFrequencyScalingFactor = 0.6  // More aggressive scaling above cutoff
    } = options;
    
    if (!frequency || frequency <= 0) return 1.0;
    
    // Basic logarithmic scaling: lower frequencies get higher gain
    let ratio = referenceFrequency / frequency;
    let gain = Math.pow(ratio, scalingFactor);
    
    // Apply additional reduction for high frequencies to protect hearing
    if (frequency > highFrequencyCutoff) {
      const additionalReduction = Math.pow(highFrequencyCutoff / frequency, highFrequencyScalingFactor);
      gain *= additionalReduction;
    }
    
    // Ensure gain stays within reasonable limits
    gain = Math.max(minimumGain, Math.min(maximumGain, gain));
    
    return gain;
  };
  
  /**
   * Apply frequency-dependent gain to a Tone.js synth for safer playing
   * 
   * @param {Object} synth - A Tone.js synthesizer
   * @param {number} frequency - The frequency to play
   * @param {number} velocity - The velocity/volume (0-1)
   * @param {string} duration - Note duration (e.g., "8n", "4n", "1n")
   * @param {Object} gainNode - Optional Tone.js Gain node for volume control
   * @param {Object} options - Options for gain calculation
   */
  export const safelyTriggerNote = (synth, frequency, velocity = 0.7, duration, gainNode = null, options = {}) => {
    if (!synth || !frequency) return;
    
    // Calculate safe gain
    const gain = calculateFrequencyGain(frequency, options);
    
    // Apply gain if a gain node is provided
    if (gainNode) {
      const now = Tone.now();
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), now + 0.05);
    }
    
    // Adjust velocity based on frequency
    const safeVelocity = velocity * (gainNode ? 1 : gain);
    
    // Play the note
    if (duration) {
      synth.triggerAttackRelease(frequency, duration, undefined, safeVelocity);
    } else {
      synth.triggerAttack(frequency, undefined, safeVelocity);
    }
  };
  
  /**
   * The Fletcher-Munson equal loudness contours describe how human hearing
   * sensitivity varies with frequency. This is a simplified approximation.
   * 
   * @param {number} frequency - Frequency in Hz
   * @returns {number} Relative sensitivity (higher = more sensitive)
   */
  export const getHumanHearingSensitivity = (frequency) => {
    // Simple approximation of Fletcher-Munson curves
    // Human hearing is most sensitive around 2-5kHz
    
    if (frequency < 20) return 0.01;  // Very low sensitivity below audible range
    if (frequency > 20000) return 0.01;  // Very low sensitivity above audible range
    
    // Highest sensitivity around 3-4kHz (where speech consonants are)
    const peakFrequency = 3500;
    
    // Calculate distance from peak on log scale
    const logFreq = Math.log10(frequency);
    const logPeak = Math.log10(peakFrequency);
    const logDistance = Math.abs(logFreq - logPeak);
    
    // Create a curve peaking at 1.0 for the most sensitive region
    let sensitivity = 1.0 - Math.min(1, logDistance * 0.7);
    
    // Special case: extra reduction for very low frequencies (below 100Hz)
    if (frequency < 100) {
      sensitivity *= frequency / 100;
    }
    
    return Math.max(0.01, sensitivity);
  };
  
  /**
   * Create a more sophisticated gain scaling that takes into account
   * both logarithmic falloff and human hearing sensitivity curves
   * 
   * @param {number} frequency - The frequency in Hz
   * @param {Object} options - Configuration options
   * @returns {number} The calculated gain value
   */
  export const calculateAdvancedFrequencyGain = (frequency, options = {}) => {
    // Get basic logarithmic scaling
    const baseGain = calculateFrequencyGain(frequency, options);
    
    // Get human hearing sensitivity adjustment
    const sensitivity = getHumanHearingSensitivity(frequency);
    
    // Adjust gain inversely to sensitivity: we reduce volume more for frequencies
    // where human hearing is most sensitive
    const sensitivityFactor = 0.7; // How strongly to apply the sensitivity curve
    const sensitivityAdjustment = 1.0 - (sensitivity * sensitivityFactor);
    
    // Combine the adjustments
    let finalGain = baseGain * (0.3 + sensitivityAdjustment * 0.7);
    
    // Clamp to reasonable values
    finalGain = Math.max(options.minimumGain || 0.05, 
                        Math.min(options.maximumGain || 1.2, finalGain));
    
    return finalGain;
  };