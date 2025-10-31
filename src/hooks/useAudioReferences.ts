import { useRef } from 'react';
import * as Tone from 'tone';
import { CurrentFrequencies, SynthObject } from '../utils/types';
import { SynthManager } from '../utils/synthManager';

interface AudioReferences {
  audioContextStarted: React.MutableRefObject<boolean>;
  gainNode: React.MutableRefObject<Tone.Gain | null>;
  initFrequencies: React.MutableRefObject<boolean>;
  synths: React.MutableRefObject<Record<string, SynthObject>>;
  mainSynth: React.MutableRefObject<Tone.PolySynth<Tone.Synth> | null>;
  lastFrequencies: React.MutableRefObject<CurrentFrequencies>;
  sequenceTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
  debug: React.MutableRefObject<boolean>;
  activeSynths: React.MutableRefObject<Set<string>>;
  audioInitialized: React.MutableRefObject<boolean>;
  gainNodes: React.MutableRefObject<Record<string, Tone.Gain>>;
  planetTimeouts: React.MutableRefObject<NodeJS.Timeout[]>;
  reverb: React.MutableRefObject<Tone.Reverb | null>;
  synthManager: React.MutableRefObject<SynthManager>;
}

export const useAudioReferences = (): AudioReferences => {
  const audioContextStarted = useRef<boolean>(false);
  const gainNode = useRef<Tone.Gain | null>(null);
  const initFrequencies = useRef<boolean>(false);
  const synths = useRef<Record<string, SynthObject>>({});
  const mainSynth = useRef<Tone.PolySynth<Tone.Synth> | null>(null);
  const lastFrequencies = useRef<CurrentFrequencies>({});
  const sequenceTimeout = useRef<NodeJS.Timeout | null>(null);
  const debug = useRef<boolean>(true);
  const activeSynths = useRef<Set<string>>(new Set());
  const audioInitialized = useRef<boolean>(false);
  const gainNodes = useRef<Record<string, Tone.Gain>>({});
  const planetTimeouts = useRef<NodeJS.Timeout[]>([]);
  const reverb = useRef<Tone.Reverb | null>(null);
  const synthManager = useRef<SynthManager>(new SynthManager(null));

  return {
    audioContextStarted,
    gainNode,
    initFrequencies,
    synths,
    mainSynth,
    lastFrequencies,
    sequenceTimeout,
    debug,
    activeSynths,
    audioInitialized,
    gainNodes,
    planetTimeouts,
    reverb,
    synthManager
  };
};
