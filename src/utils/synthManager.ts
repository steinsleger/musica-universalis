import * as Tone from 'tone';
import { SynthObject, AudioScalingConfig } from '../types';
import { calculateFrequencyGain, calculateAdvancedFrequencyGain } from './audioScaling';

/**
 * Synth management utility for creating, updating, and disposing planet synths
 * Handles per-planet gain calculation and reverb routing
 */
export class SynthManager {
  private synths: Record<string, SynthObject> = {};
  private gainNodes: Record<string, Tone.Gain> = {};
  private activeSynths: Set<string> = new Set();
  private reverbNode: Tone.Reverb | null = null;

  constructor(reverbNode: Tone.Reverb | null = null) {
    this.reverbNode = reverbNode;
  }

  /**
   * Update the reverb node reference (called after reverb is created)
   */
  setReverbNode(reverb: Tone.Reverb | null): void {
    this.reverbNode = reverb;
  }

  /**
   * Create or recreate a synth for a planet with optimized envelope settings
   */
  createSynth(
    planetName: string,
    currentFrequency: number | undefined,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): SynthObject | null {
    try {
      // Clean up old synth if it exists
      this.disposeSynth(planetName);

      // Calculate initial gain based on current frequency
      let initialGain = 1.0;
      if (currentFrequency) {
        try {
          initialGain = useFletcher
            ? calculateAdvancedFrequencyGain(currentFrequency, audioScalingConfig)
            : calculateFrequencyGain(currentFrequency, audioScalingConfig);
        } catch (error) {
          console.error(`[SYNTH] Error pre-calculating gain for ${planetName}:`, error);
        }
      }

      // Create planet-specific gain node
      const planetGain = new Tone.Gain(initialGain);

      // Create synth with optimized envelope for orbital sonification
      const synth = new Tone.Synth({
        envelope: {
          attack: 0.05,
          decay: 0.1,
          sustain: 0.4,
          release: 1.2
        },
        oscillator: {
          type: 'sine'
        }
      });

      // Connect synth → planetGain → reverb/destination
      synth.connect(planetGain);

      if (this.reverbNode && !this.reverbNode.disposed) {
        planetGain.connect(this.reverbNode);
      } else {
        planetGain.toDestination();
      }

      // Store synth and gain node
      const synthObj: SynthObject = { synth, gain: planetGain };
      this.synths[planetName] = synthObj;
      this.gainNodes[planetName] = planetGain;

      return synthObj;
    } catch (error) {
      console.error(`[SYNTH] Failed to create synth for ${planetName}:`, error);
      return null;
    }
  }

  /**
   * Dispose of a synth and its gain node
   */
  disposeSynth(planetName: string): void {
    try {
      const synthObj = this.synths[planetName];
      if (!synthObj) return;

      // Stop sound if playing
      if (this.activeSynths.has(planetName)) {
        try {
          synthObj.synth.triggerRelease(Tone.now());
        } catch (error) {
          console.error(`[SYNTH] Error releasing synth for ${planetName}:`, error);
        }
        this.activeSynths.delete(planetName);
      }

      // Dispose synth
      if (synthObj.synth && !synthObj.synth.disposed) {
        synthObj.synth.dispose();
      }

      // Dispose gain node
      if (synthObj.gain && !synthObj.gain.disposed) {
        synthObj.gain.dispose();
      }

      delete this.synths[planetName];
      delete this.gainNodes[planetName];
    } catch (error) {
      console.error(`[SYNTH] Error disposing synth for ${planetName}:`, error);
    }
  }

  /**
   * Start playing a synth at the given frequency
   */
  startSound(planetName: string, frequency: number): boolean {
    try {
      const synthObj = this.synths[planetName];

      // Create synth if it doesn't exist or is disposed
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
        // Note: caller should provide current audio config
        // This is a fallback for safety
        return false;
      }

      // Trigger attack
      synthObj.synth.frequency.value = frequency;
      synthObj.synth.triggerAttack(Tone.now());
      this.activeSynths.add(planetName);

      return true;
    } catch (error) {
      console.error(`[SYNTH] Error starting sound for ${planetName}:`, error);
      return false;
    }
  }

  /**
   * Stop playing a synth
   */
  stopSound(planetName: string): boolean {
    try {
      const synthObj = this.synths[planetName];
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
        return false;
      }

      synthObj.synth.triggerRelease(Tone.now());
      this.activeSynths.delete(planetName);
      return true;
    } catch (error) {
      console.error(`[SYNTH] Error stopping sound for ${planetName}:`, error);
      return false;
    }
  }

  /**
   * Update gain for a synth
   */
  updateGain(planetName: string, gainValue: number): void {
    try {
      const gainNode = this.gainNodes[planetName];
      if (!gainNode || gainNode.disposed) return;

      const now = Tone.now();
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(Math.max(0.001, gainValue), now + 0.05);

      // Fallback direct set after ramp
      setTimeout(() => {
        try {
          gainNode.gain.value = gainValue;
        } catch {
          // Ignore fallback errors
        }
      }, 60);
    } catch (error) {
      console.error(`[SYNTH] Error updating gain for ${planetName}:`, error);
    }
  }

  /**
   * Get a synth object
   */
  getSynth(planetName: string): SynthObject | null {
    return this.synths[planetName] || null;
  }

  /**
   * Check if a synth is currently playing
   */
  isPlaying(planetName: string): boolean {
    return this.activeSynths.has(planetName);
  }

  /**
   * Get all active synth names
   */
  getActiveSynths(): string[] {
    return Array.from(this.activeSynths);
  }

  /**
   * Update gains for all synths based on frequency data
   * Used by forceRecalculateAllGains and toggleFletcherCurves
   */
  updateAllGains(
    frequencies: Record<string, number>,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): void {
    Object.entries(frequencies).forEach(([planetName, frequency]) => {
      const synthObj = this.synths[planetName];
      if (synthObj && synthObj.gain && frequency) {
        try {
          const gain = useFletcher
            ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
            : calculateFrequencyGain(frequency, audioScalingConfig);

          this.updateGain(planetName, gain);
        } catch (error) {
          console.error(`[SYNTH] Error updating gain for ${planetName}:`, error);
        }
      }
    });
  }

  /**
   * Set master volume for all synths
   */
  setMasterVolume(volume: number): void {
    Object.entries(this.gainNodes).forEach(([planetName, gainNode]) => {
      if (gainNode && !gainNode.disposed) {
        try {
          gainNode.gain.value = volume;
        } catch (error) {
          console.error(`[SYNTH] Error setting master volume for ${planetName}:`, error);
        }
      }
    });
  }

  /**
   * Dispose all synths
   */
  disposeAll(): void {
    const planetNames = Object.keys(this.synths);
    planetNames.forEach(name => this.disposeSynth(name));
  }
}
