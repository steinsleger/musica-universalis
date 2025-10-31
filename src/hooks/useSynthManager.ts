import { useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { SynthObject } from '../utils/types';

interface UseSynthManagerReturn {
  synthsRef: React.MutableRefObject<Record<string, SynthObject>>;
  gainNodesRef: React.MutableRefObject<Record<string, Tone.Gain>>;
  activeSynthsRef: React.MutableRefObject<Set<string>>;
  createSynth: (planetName: string) => void;
  disposeSynth: (planetName: string) => void;
  updateGain: (planetName: string, gainValue: number) => void;
  startSound: (planetName: string, frequency: number) => boolean;
  stopSound: (planetName: string) => boolean;
  recreateAllSynths: (planetNames: string[]) => Promise<void>;
  disposeAllSynths: () => void;
  getMainGainNode: () => Tone.Gain | null;
}

export const useSynthManager = (mainGainNode: Tone.Gain | null): UseSynthManagerReturn => {
  const synthsRef = useRef<Record<string, SynthObject>>({});
  const gainNodesRef = useRef<Record<string, Tone.Gain>>({});
  const activeSynthsRef = useRef<Set<string>>(new Set());

  const createSynth = useCallback((planetName: string): void => {
    if (synthsRef.current[planetName]) {
      return;
    }

    try {
      const synth = new Tone.Synth({
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
        oscillator: { type: 'sine' }
      });

      const gainNode = new Tone.Gain(0.5);

      if (mainGainNode) {
        synth.connect(gainNode);
        gainNode.connect(mainGainNode);
      } else {
        synth.connect(gainNode);
        gainNode.toDestination();
      }

      synthsRef.current[planetName] = { synth, gain: gainNode };
      gainNodesRef.current[planetName] = gainNode;
    } catch (error) {
      console.error(`Error creating synth for ${planetName}:`, error);
    }
  }, [mainGainNode]);

  const disposeSynth = useCallback((planetName: string): void => {
    const synthObj = synthsRef.current[planetName];
    if (!synthObj) return;

    try {
      if (synthObj.synth) {
        synthObj.synth.dispose();
      }
      if (synthObj.gain) {
        synthObj.gain.dispose();
      }
      delete synthsRef.current[planetName];
      delete gainNodesRef.current[planetName];
      activeSynthsRef.current.delete(planetName);
    } catch (error) {
      console.error(`Error disposing synth for ${planetName}:`, error);
    }
  }, []);

  const updateGain = useCallback((planetName: string, gainValue: number): void => {
    const gainNode = gainNodesRef.current[planetName];
    if (!gainNode || gainNode.disposed) return;

    try {
      const now = Tone.now();
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(Math.max(0.001, gainValue), now + 0.05);

      setTimeout(() => {
        try {
          gainNode.gain.value = gainValue;
        } catch {
          // Ignore direct set failures
        }
      }, 60);
    } catch (error) {
      console.error(`Error updating gain for ${planetName}:`, error);
    }
  }, []);

  const startSound = useCallback((planetName: string, frequency: number): boolean => {
    const synthObj = synthsRef.current[planetName];
    if (!synthObj) return false;

    try {
      synthObj.synth.triggerAttack(frequency);
      activeSynthsRef.current.add(planetName);
      return true;
    } catch (error) {
      console.error(`Error starting sound for ${planetName}:`, error);
      return false;
    }
  }, []);

  const stopSound = useCallback((planetName: string): boolean => {
    const synthObj = synthsRef.current[planetName];
    if (!synthObj) return false;

    try {
      synthObj.synth.triggerRelease();
      activeSynthsRef.current.delete(planetName);
      return true;
    } catch (error) {
      console.error(`Error stopping sound for ${planetName}:`, error);
      return false;
    }
  }, []);

  const recreateAllSynths = useCallback(async (planetNames: string[]): Promise<void> => {
    disposeAllSynths();
    await new Promise(resolve => setTimeout(resolve, 50));

    for (const name of planetNames) {
      createSynth(name);
    }
  }, [createSynth]);

  const disposeAllSynths = useCallback((): void => {
    Object.keys(synthsRef.current).forEach(name => {
      disposeSynth(name);
    });
  }, [disposeSynth]);

  const getMainGainNode = useCallback((): Tone.Gain | null => mainGainNode, [mainGainNode]);

  useEffect(() => {
    return () => {
      disposeAllSynths();
    };
  }, [disposeAllSynths]);

  return {
    synthsRef,
    gainNodesRef,
    activeSynthsRef,
    createSynth,
    disposeSynth,
    updateGain,
    startSound,
    stopSound,
    recreateAllSynths,
    disposeAllSynths,
    getMainGainNode
  };
};
