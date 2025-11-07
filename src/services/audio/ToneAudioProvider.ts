import * as Tone from 'tone';
import {
  AudioProvider,
  AudioContextState,
  AudioScalingConfig,
  SequenceTimingParams,
  SynthObject
} from './AudioProvider';
import { calculateFrequencyGain, calculateAdvancedFrequencyGain } from '../../utils/audioScaling';

/**
 * SynthManager - Internal class for managing synths within ToneAudioProvider
 */
class SynthManager {
  private synths: Record<string, { synth: Tone.Synth; gain: Tone.Gain }> = {};
  private gainNodes: Record<string, Tone.Gain> = {};
  private activeSynths: Set<string> = new Set();
  private reverbNode: Tone.Reverb | null = null;

  constructor(reverbNode: Tone.Reverb | null = null) {
    this.reverbNode = reverbNode;
  }

  setReverbNode(reverb: Tone.Reverb | null): void {
    this.reverbNode = reverb;
  }

  createSynth(
    planetName: string,
    currentFrequency: number | undefined,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): SynthObject | null {
    try {
      this.disposeSynth(planetName);

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

      const planetGain = new Tone.Gain(initialGain);

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

      synth.connect(planetGain);

      if (this.reverbNode && !this.reverbNode.disposed) {
        planetGain.connect(this.reverbNode);
      } else {
        planetGain.toDestination();
      }

      const synthObj: SynthObject = { synth, gain: planetGain };
      this.synths[planetName] = synthObj as unknown as { synth: Tone.Synth; gain: Tone.Gain };
      this.gainNodes[planetName] = planetGain;

      return synthObj;
    } catch (error) {
      console.error(`[SYNTH] Failed to create synth for ${planetName}:`, error);
      return null;
    }
  }

  disposeSynth(planetName: string): void {
    try {
      const synthObj = this.synths[planetName];
      if (!synthObj) return;

      if (this.activeSynths.has(planetName)) {
        try {
          synthObj.synth.triggerRelease(Tone.now());
        } catch (error) {
          console.error(`[SYNTH] Error releasing synth for ${planetName}:`, error);
        }
        this.activeSynths.delete(planetName);
      }

      if (synthObj.synth && !synthObj.synth.disposed) {
        synthObj.synth.dispose();
      }

      if (synthObj.gain && !synthObj.gain.disposed) {
        synthObj.gain.dispose();
      }

      delete this.synths[planetName];
      delete this.gainNodes[planetName];
    } catch (error) {
      console.error(`[SYNTH] Error disposing synth for ${planetName}:`, error);
    }
  }

  startSound(planetName: string, frequency: number): boolean {
    try {
      const synthObj = this.synths[planetName];

      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
        return false;
      }

      synthObj.synth.frequency.value = frequency;
      synthObj.synth.triggerAttack(Tone.now());
      this.activeSynths.add(planetName);

      return true;
    } catch (error) {
      console.error(`[SYNTH] Error starting sound for ${planetName}:`, error);
      return false;
    }
  }

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

  updateGain(planetName: string, gainValue: number): void {
    try {
      const gainNode = this.gainNodes[planetName];
      if (!gainNode || gainNode.disposed) return;

      const now = Tone.now();
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(Math.max(0.001, gainValue), now + 0.05);

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

  isPlaying(planetName: string): boolean {
    return this.activeSynths.has(planetName);
  }

  getActiveSynths(): string[] {
    return Array.from(this.activeSynths);
  }

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

  setMasterVolume(volume: number): void {
    Object.entries(this.gainNodes).forEach(([_, gainNode]) => {
      if (gainNode && !gainNode.disposed) {
        try {
          gainNode.gain.value = volume;
        } catch (error) {
          console.error('[SYNTH] Error setting master volume:', error);
        }
      }
    });
  }

  disposeAll(): void {
    const planetNames = Object.keys(this.synths);
    planetNames.forEach(name => this.disposeSynth(name));
  }
}

/**
 * ToneAudioProvider - Tone.js implementation of AudioProvider
 */
export class ToneAudioProvider implements AudioProvider {
  private synthManager: SynthManager;
  private reverbNode: Tone.Reverb | null = null;
  private masterGain: Tone.Gain;

  constructor() {
    this.synthManager = new SynthManager();
    this.masterGain = new Tone.Gain(1.0);
    this.masterGain.toDestination();
  }

  async initialize(): Promise<void> {
    try {
      await Tone.start();
    } catch (error) {
      console.error('[TONE] Failed to initialize:', error);
    }
  }

  async resumeIfNeeded(): Promise<void> {
    if (Tone.context.state !== 'running') {
      try {
        await Tone.context.resume();
      } catch (error) {
        console.error('[TONE] Failed to resume audio context:', error);
      }
    }
  }

  getContextState(): AudioContextState {
    return {
      isRunning: Tone.context.state === 'running',
      needsUserInteraction: Tone.context.state === 'suspended'
    };
  }

  createSynth(
    planetName: string,
    frequency: number | undefined,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): SynthObject | null {
    return this.synthManager.createSynth(planetName, frequency, audioScalingConfig, useFletcher);
  }

  disposeSynth(planetName: string): void {
    this.synthManager.disposeSynth(planetName);
  }

  startSound(planetName: string, frequency: number): boolean {
    return this.synthManager.startSound(planetName, frequency);
  }

  stopSound(planetName: string): boolean {
    return this.synthManager.stopSound(planetName);
  }

  updateGain(planetName: string, gainValue: number): void {
    this.synthManager.updateGain(planetName, gainValue);
  }

  updateAllGains(
    frequencies: Record<string, number>,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): void {
    this.synthManager.updateAllGains(frequencies, audioScalingConfig, useFletcher);
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = volume;
    this.synthManager.setMasterVolume(volume);
  }

  isPlaying(planetName: string): boolean {
    return this.synthManager.isPlaying(planetName);
  }

  getActiveSynths(): string[] {
    return this.synthManager.getActiveSynths();
  }

  createReverb(): unknown {
    try {
      this.reverbNode = new Tone.Reverb({
        decay: 4,
        wet: 0.3
      });
      this.reverbNode.connect(this.masterGain);
      this.synthManager.setReverbNode(this.reverbNode);
      return this.reverbNode;
    } catch (error) {
      console.error('[TONE] Error creating reverb:', error);
      return null;
    }
  }

  setReverbNode(reverb: unknown): void {
    this.reverbNode = reverb as Tone.Reverb;
    this.synthManager.setReverbNode(this.reverbNode);
  }

  triggerNote(
    planetName: string,
    frequency: number,
    gainValue: number,
    duration?: number
  ): void {
    if (!this.startSound(planetName, frequency)) {
      return;
    }

    this.updateGain(planetName, gainValue);

    if (duration) {
      setTimeout(() => {
        this.stopSound(planetName);
      }, duration * 1000);
    }
  }

  disposeAll(): void {
    this.synthManager.disposeAll();
    if (this.reverbNode && !this.reverbNode.disposed) {
      this.reverbNode.dispose();
    }
    if (this.masterGain && !this.masterGain.disposed) {
      this.masterGain.dispose();
    }
  }

  calculateSequenceTiming(bpm: number): SequenceTimingParams {
    const beatDuration = 60 / bpm;
    return {
      beatDuration,
      noteDuration: beatDuration,
      interval: beatDuration
    };
  }

  createPolySynth(): unknown {
    try {
      const synth = new Tone.PolySynth(Tone.Synth, {
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
        oscillator: { type: 'sine' }
      });

      synth.connect(this.masterGain);
      return synth;
    } catch (error) {
      console.error('[TONE] Error creating poly synth:', error);
      return null;
    }
  }

  disposePolySynth(synth: unknown): unknown {
    try {
      const polySynth = synth as Tone.PolySynth<Tone.Synth>;
      if (polySynth && !polySynth.disposed) {
        polySynth.releaseAll();
        polySynth.dispose();
      }
      return null;
    } catch (error) {
      console.error('[TONE] Error disposing poly synth:', error);
      return synth;
    }
  }

  createGain(initialValue: number = 1.0): unknown {
    return new Tone.Gain(initialValue);
  }

  getCurrentTime(): number {
    return Tone.now();
  }
}
