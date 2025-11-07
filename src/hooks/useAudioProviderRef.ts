import { useRef } from 'react';
import * as Tone from 'tone';
import { CurrentFrequencies, SynthObject } from '../types/domain';
import { SynthManager } from '../utils/synthManager';

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
 * useAudioProviderRef
 *
 * Consolidates 12 individual refs into a single structured ref:
 * OLD REFS (12 individual):
 * - audioContextStarted, audioInitializedRef
 * - gainNodeRef, reverbRef, mainSynthRef
 * - synthManagerRef, synthsRef, gainNodesRef, activeSynthsRef
 * - initFrequenciesRef, lastFrequenciesRef
 * - debug (embedded in code)
 *
 * NEW REF (1 consolidated):
 * - audioProviderRef containing all the above
 *
 * Benefits:
 * - Easier to pass around (single ref instead of 12)
 * - Clearer intent: this is THE audio provider state
 * - Single ref dependency in useCallback/useEffect
 * - Better organization and encapsulation
 * - Easier to track and manage audio lifecycle
 *
 * Usage:
 * const audioProvider = useAudioProviderRef();
 * // Access: audioProvider.current.audioContextStarted, audioProvider.current.gainNode, etc.
 */

/**
 * Creates a single consolidated audio provider reference
 * Replaces 12 individual refs with 1 well-organized ref
 */
export const useAudioProviderRef = (): React.MutableRefObject<AudioProviderRef> => {
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
