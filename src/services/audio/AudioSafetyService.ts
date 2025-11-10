/**
 * Audio Safety Service
 * Implements frequency-dependent gain calculations for hearing protection
 * with optional Fletcher-Munson equal-loudness curves
 */

import { AudioScalingConfig } from '@/types/audio';

/**
 * Calculate the appropriate gain level for a given frequency using a logarithmic curve
 * that protects hearing by reducing volume for higher frequencies.
 */
export const calculateFrequencyGain = (
  frequency: number,
  config: AudioScalingConfig
): number => {
  if (!frequency || frequency <= 0) return 1.0;

  const {
    referenceFrequency = 55,
    scalingFactor = 0.4,
    minimumGain = 0.05,
    maximumGain = 1.2,
    highFrequencyCutoff = 2000
  } = config;

  const ratio = referenceFrequency / frequency;
  let gain = Math.pow(ratio, scalingFactor);

  if (frequency > highFrequencyCutoff) {
    const additionalReduction = Math.pow(
      highFrequencyCutoff / frequency,
      0.6
    );
    gain *= additionalReduction;
  }

  gain = Math.max(minimumGain, Math.min(maximumGain, gain));

  return gain;
};

/**
 * Human hearing sensitivity based on Fletcher-Munson equal loudness contours
 * This is a simplified approximation
 */
const getHumanHearingSensitivity = (frequency: number): number => {
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
 * Create sophisticated gain scaling that considers both logarithmic falloff
 * and human hearing sensitivity curves
 */
export const calculateAdvancedFrequencyGain = (
  frequency: number,
  config: AudioScalingConfig
): number => {
  const baseGain = calculateFrequencyGain(frequency, config);
  const sensitivity = getHumanHearingSensitivity(frequency);

  const sensitivityFactor = 0.7;
  const sensitivityAdjustment = 1.0 - sensitivity * sensitivityFactor;

  let finalGain = baseGain * (0.3 + sensitivityAdjustment * 0.7);

  finalGain = Math.max(
    config.minimumGain || 0.05,
    Math.min(config.maximumGain || 1.2, finalGain)
  );

  return finalGain;
};
