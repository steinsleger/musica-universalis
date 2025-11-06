import * as Tone from 'tone';
import { SynthManager } from './synthManager';
import { SynthObject, AudioScalingConfig } from './types';

/**
 * AudioManager encapsulates all audio-related state and operations
 * Replaces 12 scattered refs in OrbitalSonification component
 * Provides unified API for audio system lifecycle and synth management
 */
export class AudioManager {
  private audioContextStarted: boolean = false;
  private gainNode: Tone.Gain | null = null;
  private initFrequencies: boolean = false;
  private synths: Map<string, SynthObject> = new Map();
  private mainSynth: Tone.Synth | null = null;
  private lastFrequencies: Record<string, number> = {};
  private activeSynths: Set<string> = new Set();
  private audioInitialized: boolean = false;
  private gainNodes: Map<string, Tone.Gain> = new Map();
  private reverb: Tone.Reverb | null = null;
  private synthManager: SynthManager;
  private debug: boolean = false;

  constructor(debug: boolean = false) {
    this.synthManager = new SynthManager();
    this.debug = debug;
  }

  /**
   * Initialize the audio system and create main gain node
   */
  async initialize(masterVolume: number): Promise<boolean> {
    try {
      if (this.audioContextStarted) {
        this.logDebug('Audio context already started');
        return true;
      }

      // Start Tone.js audio context
      await Tone.start();
      this.audioContextStarted = true;

      // Create main gain node
      this.gainNode = new Tone.Gain(masterVolume);
      this.gainNode.toDestination();

      this.logDebug('Audio system initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      this.logDebug('Failed to initialize audio');
      return false;
    }
  }

  /**
   * Create reverb effect node
   */
  createReverb(decay: number = 2.5): boolean {
    try {
      if (this.reverb && !this.reverb.disposed) {
        return true;
      }

      this.reverb = new Tone.Reverb({
        decay
      });

      if (this.gainNode && !this.gainNode.disposed) {
        this.reverb.connect(this.gainNode);
      }

      this.synthManager.setReverbNode(this.reverb);
      this.logDebug('Reverb created successfully');
      return true;
    } catch (error) {
      console.error('Failed to create reverb:', error);
      return false;
    }
  }

  /**
   * Create a synth for a planet
   */
  createSynth(
    planetName: string,
    currentFrequency: number | undefined,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): SynthObject | null {
    const synthObj = this.synthManager.createSynth(
      planetName,
      currentFrequency,
      audioScalingConfig,
      useFletcher
    );

    if (synthObj) {
      this.synths.set(planetName, synthObj);
      this.gainNodes.set(planetName, synthObj.gain);
    }

    return synthObj;
  }

  /**
   * Dispose of a synth
   */
  disposeSynth(planetName: string): void {
    this.synthManager.disposeSynth(planetName);
    this.synths.delete(planetName);
    this.gainNodes.delete(planetName);
    this.activeSynths.delete(planetName);
  }

  /**
   * Start playing a note on a planet's synth
   */
  startNote(planetName: string, frequency: number): void {
    try {
      const synthObj = this.synths.get(planetName);
      if (synthObj && synthObj.synth && !synthObj.synth.disposed) {
        synthObj.synth.frequency.value = frequency;
        synthObj.synth.triggerAttack(Tone.now());
        this.activeSynths.add(planetName);
        this.logDebug(`Started note for ${planetName} at ${frequency.toFixed(2)} Hz`);
      }
    } catch (error) {
      console.error(`Error starting note for ${planetName}:`, error);
    }
  }

  /**
   * Stop playing a note on a planet's synth
   */
  stopNote(planetName: string): void {
    try {
      const synthObj = this.synths.get(planetName);
      if (synthObj && synthObj.synth && !synthObj.synth.disposed) {
        synthObj.synth.triggerRelease(Tone.now());
        this.activeSynths.delete(planetName);
        this.logDebug(`Stopped note for ${planetName}`);
      }
    } catch (error) {
      console.error(`Error stopping note for ${planetName}:`, error);
    }
  }

  /**
   * Update frequency of an active synth
   */
  updateFrequency(planetName: string, frequency: number): void {
    try {
      const synthObj = this.synths.get(planetName);
      if (synthObj && synthObj.synth && !synthObj.synth.disposed) {
        synthObj.synth.frequency.value = frequency;
        this.lastFrequencies[planetName] = frequency;
      }
    } catch (error) {
      console.error(`Error updating frequency for ${planetName}:`, error);
    }
  }

  /**
   * Update gain for a planet's synth
   */
  setSynthGain(planetName: string, gainValue: number): void {
    const gainNode = this.gainNodes.get(planetName);
    if (gainNode && !gainNode.disposed) {
      try {
        const now = Tone.now();
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(Math.max(0.001, gainValue), now + 0.05);
        this.logDebug(`Updated gain for ${planetName} to ${gainValue.toFixed(3)}`);
      } catch (error) {
        console.error(`Error setting gain for ${planetName}:`, error);
      }
    }
  }

  /**
   * Set master volume for all synths
   */
  setMasterGain(value: number): void {
    if (this.gainNode && !this.gainNode.disposed) {
      try {
        this.gainNode.gain.value = Math.max(0.001, Math.min(1, value));
        this.logDebug(`Master gain set to ${value.toFixed(3)}`);
      } catch (error) {
        console.error('Error setting master gain:', error);
      }
    }
  }

  /**
   * Update all gains based on frequency configuration
   */
  updateAllGains(
    frequencies: Record<string, number>,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): void {
    this.synthManager.updateAllGains(frequencies, audioScalingConfig, useFletcher);
  }

  /**
   * Start audio context (for user interaction requirement)
   */
  async startAudioContext(): Promise<boolean> {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      this.audioContextStarted = true;
      this.logDebug('Audio context started');
      return true;
    } catch (error) {
      console.error('Failed to start audio context:', error);
      return false;
    }
  }

  /**
   * Mark audio as initialized
   */
  setAudioInitialized(value: boolean): void {
    this.audioInitialized = value;
  }

  /**
   * Mark frequencies as initialized
   */
  setFrequenciesInitialized(value: boolean): void {
    this.initFrequencies = value;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    try {
      this.synthManager.disposeAll();
      this.synths.clear();
      this.gainNodes.clear();
      this.activeSynths.clear();

      if (this.reverb && !this.reverb.disposed) {
        this.reverb.dispose();
        this.reverb = null;
      }

      if (this.gainNode && !this.gainNode.disposed) {
        this.gainNode.dispose();
        this.gainNode = null;
      }

      if (this.mainSynth && !this.mainSynth.disposed) {
        this.mainSynth.dispose();
        this.mainSynth = null;
      }

      this.logDebug('AudioManager disposed successfully');
    } catch (error) {
      console.error('Error disposing audio manager:', error);
    }
  }

  /**
   * Getters for component access
   */
  getGainNode(): Tone.Gain | null {
    return this.gainNode;
  }

  getMainSynth(): Tone.Synth | null {
    return this.mainSynth;
  }

  setMainSynth(synth: Tone.Synth | null): void {
    this.mainSynth = synth;
  }

  getSynthManager(): SynthManager {
    return this.synthManager;
  }

  getReverb(): Tone.Reverb | null {
    return this.reverb;
  }

  getActiveSynths(): Set<string> {
    return this.activeSynths;
  }

  getLastFrequencies(): Record<string, number> {
    return { ...this.lastFrequencies };
  }

  setLastFrequencies(frequencies: Record<string, number>): void {
    this.lastFrequencies = { ...frequencies };
  }

  isAudioInitialized(): boolean {
    return this.audioInitialized;
  }

  isAudioContextStarted(): boolean {
    return this.audioContextStarted;
  }

  areFrequenciesInitialized(): boolean {
    return this.initFrequencies;
  }

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  private logDebug(message: string): void {
    if (this.debug) {
      console.log(`[AUDIO] ${message}`);
    }
  }
}
