import { useRef } from 'react';
import * as Tone from 'tone';
import { CurrentFrequencies } from '../types/domain';
import { SynthObject } from '../types/audio';
import { SynthManager } from '@/services/audio/SynthManager';

/**
 * Consolidated audio provider reference structure
 * Consolidates all audio system state into a single ref
 */
interface AudioProviderRef {
  // Audio context management
  audioContextStarted: boolean;
  audioInitialized: boolean;

  // Tone.js audio nodes
  gainNode: Tone.Gain | null;
  reverb: Tone.Reverb | null;
  mainSynth: Tone.PolySynth<Tone.Synth> | null;

  // Synth and gain management
  synthManager: SynthManager;
  synths: Record<string, SynthObject>;
  gainNodes: Record<string, Tone.Gain>;
  activeSynths: Set<string>;

  // Frequency tracking
  initFrequencies: boolean;
  currentFrequencies: CurrentFrequencies;
  lastFrequencies: CurrentFrequencies;

  // Debug flag
  debug: boolean;
}

/**
 * Creates single consolidated audio provider reference
 * Combines audio context, nodes, synth manager, and frequency tracking state
 */
export const useAudioProviderRef = (): React.RefObject<AudioProviderRef> => {
  return useRef<AudioProviderRef>({
    audioContextStarted: false,
    audioInitialized: false,
    gainNode: null,
    reverb: null,
    mainSynth: null,
    synthManager: new SynthManager(null),
    synths: {},
    gainNodes: {},
    activeSynths: new Set(),
    initFrequencies: false,
    currentFrequencies: {},
    lastFrequencies: {},
    debug: false
  });
};

export type { AudioProviderRef };
