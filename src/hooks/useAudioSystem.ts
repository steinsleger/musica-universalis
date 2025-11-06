import { useRef, useCallback, MutableRefObject } from 'react';
import * as Tone from 'tone';
import { SynthManager } from '../utils/synthManager';
import { CurrentFrequencies, AudioScalingConfig, SynthObject } from '../utils/types';

interface AudioSystemState {
  audioContextStarted: MutableRefObject<boolean>;
  audioInitialized: MutableRefObject<boolean>;
  gainNode: MutableRefObject<Tone.Gain | null>;
  reverb: MutableRefObject<Tone.Reverb | null>;
  synthManager: SynthManager;
}

interface AudioSystemMethods {
  startAudioContext: () => Promise<boolean>;
  initializeAudioContext: (masterVolume: number) => Promise<boolean>;
  createSynth: (planetName: string, frequency: number, audioScalingConfig: AudioScalingConfig, useFletcher: boolean) => SynthObject | null;
  startSound: (planetName: string, frequency: number) => boolean;
  stopSound: (planetName: string) => boolean;
  updateFrequency: (planetName: string, frequency: number) => boolean;
  setMasterVolume: (volume: number) => void;
  getActiveSynths: () => string[];
  recreateAllAudio: (currentFrequencies: CurrentFrequencies, audioScalingConfig: AudioScalingConfig, useFletcher: boolean) => Promise<boolean>;
  cleanup: () => void;
}

interface AudioSystem extends AudioSystemState, AudioSystemMethods {}

export const useAudioSystem = (): AudioSystem => {
  const audioContextStarted = useRef<boolean>(false);
  const audioInitialized = useRef<boolean>(false);
  const gainNode = useRef<Tone.Gain | null>(null);
  const reverb = useRef<Tone.Reverb | null>(null);
  const synthManagerRef = useRef<SynthManager>(new SynthManager(null));

  const startAudioContext = useCallback(async (): Promise<boolean> => {
    try {
      if (audioContextStarted.current) {
        return true;
      }

      try {
        await Tone.start();
      } catch {
        console.error('Error starting Tone');
      }

      if (Tone.context.state !== 'running') {
        try {
          await Tone.context.resume();
        } catch {
          console.error('Error resuming Tone context');
        }
      }

      audioContextStarted.current = true;
      return true;
    } catch (error) {
      console.error('Failed to start audio context:', error);
      return false;
    }
  }, []);

  const initializeAudioContext = useCallback(async (masterVolume: number): Promise<boolean> => {
    try {
      const started = await startAudioContext();
      if (!started) {
        return false;
      }

      if (gainNode.current) {
        try {
          gainNode.current.dispose();
        } catch {
          // Ignore disposal errors
        }
      }

      if (reverb.current) {
        try {
          reverb.current.dispose();
        } catch {
          // Ignore disposal errors
        }
      }

      const newReverb = new Tone.Reverb({ decay: 1.5, wet: 0.5 }).toDestination();
      await newReverb.generate();
      reverb.current = newReverb;
      synthManagerRef.current.setReverbNode(newReverb);

      try {
        const masterGain = new Tone.Gain(masterVolume).connect(newReverb);
        gainNode.current = masterGain;
        Tone.Destination.volume.value = Tone.gainToDb(masterVolume);
        audioInitialized.current = true;
        return true;
      } catch {
        console.error('Error creating master gain node');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }, [startAudioContext]);

  const createSynth = useCallback((
    planetName: string,
    frequency: number,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): SynthObject | null => {
    return synthManagerRef.current.createSynth(planetName, frequency, audioScalingConfig, useFletcher);
  }, []);

  const startSound = useCallback((planetName: string, frequency: number): boolean => {
    try {
      return synthManagerRef.current.startSound(planetName, frequency);
    } catch (error) {
      console.error(`Failed to start sound for ${planetName}:`, error);
      return false;
    }
  }, []);

  const stopSound = useCallback((planetName: string): boolean => {
    try {
      return synthManagerRef.current.stopSound(planetName);
    } catch (error) {
      console.error(`Failed to stop sound for ${planetName}:`, error);
      return false;
    }
  }, []);

  const updateFrequency = useCallback((planetName: string, frequency: number): boolean => {
    try {
      const synthObj = synthManagerRef.current.getSynth(planetName);
      if (synthObj && synthObj.synth && !synthObj.synth.disposed) {
        synthObj.synth.frequency.value = frequency;
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to update frequency for ${planetName}:`, error);
      return false;
    }
  }, []);

  const setMasterVolume = useCallback((volume: number): void => {
    if (gainNode.current) {
      gainNode.current.gain.rampTo(volume, 0.1);
      Tone.Destination.volume.value = Tone.gainToDb(volume);
    }
  }, []);

  const getActiveSynths = useCallback((): string[] => {
    return synthManagerRef.current.getActiveSynths();
  }, []);

  const recreateAllAudio = useCallback(async (
    currentFrequencies: CurrentFrequencies,
    audioScalingConfig: AudioScalingConfig,
    useFletcher: boolean
  ): Promise<boolean> => {
    try {
      const activeSynthNames = getActiveSynths();

      for (const planetName of activeSynthNames) {
        const frequency = currentFrequencies[planetName];
        if (frequency) {
          const created = createSynth(planetName, frequency, audioScalingConfig, useFletcher);
          if (created) {
            startSound(planetName, frequency);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to recreate audio:', error);
      return false;
    }
  }, [createSynth, startSound, getActiveSynths]);

  const cleanup = useCallback((): void => {
    try {
      synthManagerRef.current.disposeAll();
    } catch (error) {
      console.error('Error disposing synths:', error);
    }

    if (gainNode.current) {
      try {
        gainNode.current.dispose();
      } catch {
        // Ignore disposal errors
      }
    }

    if (reverb.current) {
      try {
        reverb.current.dispose();
      } catch {
        // Ignore disposal errors
      }
    }
  }, []);

  return {
    audioContextStarted,
    audioInitialized,
    gainNode,
    reverb,
    synthManager: synthManagerRef.current,
    startAudioContext,
    initializeAudioContext,
    createSynth,
    startSound,
    stopSound,
    updateFrequency,
    setMasterVolume,
    getActiveSynths,
    recreateAllAudio,
    cleanup
  };
};
