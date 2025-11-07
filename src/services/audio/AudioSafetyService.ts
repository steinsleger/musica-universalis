/**
 * AudioSafetyService - Centralized audio safety and hearing protection
 * Decoupled from Tone.js for easier maintenance and configuration
 */

export interface AudioSafetyConfig {
  referenceFrequency?: number;
  scalingFactor?: number;
  minimumGain?: number;
  maximumGain?: number;
  highFrequencyCutoff?: number;
  highFrequencyScalingFactor?: number;
}

const DEFAULT_CONFIG: Required<AudioSafetyConfig> = {
  referenceFrequency: 55,
  scalingFactor: 0.4,
  minimumGain: 0.05,
  maximumGain: 1.2,
  highFrequencyCutoff: 2000,
  highFrequencyScalingFactor: 0.6
};

/**
 * AudioSafetyService - Static utility class for audio safety calculations
 */
export class AudioSafetyService {
  /**
   * Calculate the appropriate gain level for a given frequency using a logarithmic curve
   * that protects hearing by reducing volume for higher frequencies.
   */
  static calculateFrequencyGain(
    frequency: number,
    config: AudioSafetyConfig = {}
  ): number {
    const {
      referenceFrequency,
      scalingFactor,
      minimumGain,
      maximumGain,
      highFrequencyCutoff,
      highFrequencyScalingFactor
    } = { ...DEFAULT_CONFIG, ...config };

    if (!frequency || frequency <= 0) {
      return 1.0;
    }

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
  }

  /**
   * The Fletcher-Munson equal loudness contours describe how human hearing
   * sensitivity varies with frequency. This is a simplified approximation.
   */
  static getHumanHearingSensitivity(frequency: number): number {
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
  }

  /**
   * Create a more sophisticated gain scaling that takes into account
   * both logarithmic falloff and human hearing sensitivity curves
   */
  static calculateAdvancedFrequencyGain(
    frequency: number,
    config: AudioSafetyConfig = {}
  ): number {
    const baseGain = this.calculateFrequencyGain(frequency, config);
    const sensitivity = this.getHumanHearingSensitivity(frequency);

    const sensitivityFactor = 0.7;
    const sensitivityAdjustment = 1.0 - sensitivity * sensitivityFactor;

    let finalGain = baseGain * (0.3 + sensitivityAdjustment * 0.7);

    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    finalGain = Math.max(
      mergedConfig.minimumGain,
      Math.min(mergedConfig.maximumGain, finalGain)
    );

    return finalGain;
  }

  /**
   * Get default configuration for audio safety
   */
  static getDefaultConfig(): Required<AudioSafetyConfig> {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Merge custom config with defaults
   */
  static mergeConfig(
    customConfig: AudioSafetyConfig = {}
  ): Required<AudioSafetyConfig> {
    return { ...DEFAULT_CONFIG, ...customConfig };
  }
}
