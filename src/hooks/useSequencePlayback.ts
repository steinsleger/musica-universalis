import { useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Planet } from '../types/domain';
import {
  disposeSynthAndCreateNew,
  calculateSequenceTiming,
  clearPlanetTimeouts
} from '../utils/audioUtils';

interface UseSequencePlaybackParams {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  setCurrentlyPlayingPlanet: (planet: string | undefined) => void;
  sequenceBPM: number;
  orbitData: Planet[];
  baseFrequency: number;
  loopSequence: boolean;
  gainNodeRef: React.RefObject<Tone.Gain | null>;
  mainSynthRef: React.RefObject<Tone.PolySynth<Tone.Synth> | null>;
  initializeAudioContext: () => Promise<boolean>;
  calculateBaseFrequencies: (baseFreq: number, planet: Planet, index: number) => number;
  debugAudio: (message: string) => void;
}

export const useSequencePlayback = ({
  isPlaying,
  setIsPlaying,
  setCurrentlyPlayingPlanet,
  sequenceBPM,
  orbitData,
  baseFrequency,
  loopSequence,
  gainNodeRef,
  mainSynthRef,
  initializeAudioContext,
  calculateBaseFrequencies,
  debugAudio
}: UseSequencePlaybackParams) => {

  const planetTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playOrbitalSequence = useCallback(async (): Promise<void> => {
    try {
      const audioStarted = await initializeAudioContext();
      if (!audioStarted) {
        debugAudio('Audio context couldn\'t be started');
        return;
      }

      if (isPlaying) {
        debugAudio('Stopping orbital sequence');

        setCurrentlyPlayingPlanet(undefined);

        planetTimeoutsRef.current.forEach(timeoutId => {
          clearTimeout(timeoutId);
        });
        planetTimeoutsRef.current = [];

        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = null;
        }

        if (mainSynthRef.current) {
          try {
            mainSynthRef.current.releaseAll();
            mainSynthRef.current.dispose();
          } catch {
            console.error('Error disposing main synth:');
          }

          const newMainSynth = new Tone.PolySynth(Tone.Synth, {
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
            oscillator: { type: 'sine' }
          });

          if (gainNodeRef.current && !gainNodeRef.current.disposed) {
            newMainSynth.connect(gainNodeRef.current);
          } else {
            newMainSynth.toDestination();
          }

          mainSynthRef.current = newMainSynth;
        }

        setIsPlaying(false);
        return;
      }

      debugAudio('Starting orbital sequence');

      mainSynthRef.current = disposeSynthAndCreateNew(mainSynthRef.current, gainNodeRef.current);
      setIsPlaying(true);

      const enabledPlanets = orbitData.filter(planet => planet.enabled);

      debugAudio(`Playing sequence with ${enabledPlanets.length} planets`);

      const { noteDuration, interval } = calculateSequenceTiming(sequenceBPM);

      const now = Tone.now();

      clearPlanetTimeouts(planetTimeoutsRef.current);

      enabledPlanets.forEach((planet, index) => {
        const originalIndex = orbitData.findIndex(p => p.name === planet.name);
        const freq = calculateBaseFrequencies(baseFrequency, planet, originalIndex);
        const time = now + index * interval;

        try {
          mainSynthRef.current!.triggerAttackRelease(freq, noteDuration, time, 0.3);
          debugAudio(`Scheduled note for ${planet.name} at ${freq.toFixed(1)}Hz`);

          const timeoutId = setTimeout(() => {
            setCurrentlyPlayingPlanet(planet.name);
          }, index * interval * 1000);

          planetTimeoutsRef.current.push(timeoutId);
        } catch {
          console.error(`Error scheduling note for ${planet.name}:`);
        }
      });

      const sequenceDuration = enabledPlanets.length * interval;

      sequenceTimeoutRef.current = setTimeout(() => {
        if (loopSequence) {
          setCurrentlyPlayingPlanet(undefined);
          clearPlanetTimeouts(planetTimeoutsRef.current);
          playOrbitalSequence();
        } else {
          setCurrentlyPlayingPlanet(undefined);
          clearPlanetTimeouts(planetTimeoutsRef.current);
          setIsPlaying(false);
          debugAudio('Sequence playback complete');
        }
      }, sequenceDuration * 1000 + 100);
    } catch (error) {
      console.error('Error playing orbital sequence:', error);

      clearPlanetTimeouts(planetTimeoutsRef.current);

      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }

      setCurrentlyPlayingPlanet(undefined);
      setIsPlaying(false);
    }
  }, [isPlaying, setIsPlaying, setCurrentlyPlayingPlanet, initializeAudioContext, sequenceBPM, orbitData, baseFrequency, loopSequence, calculateBaseFrequencies, debugAudio, gainNodeRef, mainSynthRef]);

  const cleanupSequence = useCallback(() => {
    clearPlanetTimeouts(planetTimeoutsRef.current);

    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
  }, []);

  return {
    playOrbitalSequence,
    cleanupSequence,
    planetTimeoutsRef,
    sequenceTimeoutRef
  };
};
