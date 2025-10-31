import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { Planet } from '../utils/types';

interface UseAudioSequenceReturn {
  isPlaying: boolean;
  currentlyPlayingPlanet: string | null;
  playSequence: (planets: Planet[], calculateFreq: (planet: Planet) => number, bpm: number, shouldLoop: boolean) => Promise<void>;
  stopSequence: () => void;
}

export const useAudioSequence = (): UseAudioSequenceReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingPlanet, setCurrentlyPlayingPlanet] = useState<string | null>(null);

  const planetTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainSynthRef = useRef<Tone.PolySynth<Tone.Synth> | null>(null);

  const createMainSynth = useCallback((gainNode: Tone.Gain | null): Tone.PolySynth<Tone.Synth> => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
      oscillator: { type: 'sine' }
    });

    if (gainNode) {
      synth.connect(gainNode);
    } else {
      synth.toDestination();
    }

    return synth;
  }, []);

  const stopSequence = useCallback((): void => {
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
        mainSynthRef.current = null;
      } catch {
        // Ignore disposal errors
      }
    }

    setCurrentlyPlayingPlanet(null);
    setIsPlaying(false);
  }, []);

  const playSequence = useCallback(
    async (
      planets: Planet[],
      calculateFreq: (planet: Planet) => number,
      bpm: number,
      shouldLoop: boolean
    ): Promise<void> => {
      if (isPlaying) {
        stopSequence();
        return;
      }

      setIsPlaying(true);

      const beatDuration = 60 / bpm;
      const noteDuration = beatDuration;
      const interval = beatDuration;

      const mainSynth = createMainSynth(null);
      mainSynthRef.current = mainSynth;

      const now = Tone.now();

      planets.forEach((planet, index) => {
        const freq = calculateFreq(planet);
        const time = now + index * interval;

        try {
          mainSynth.triggerAttackRelease(freq, noteDuration, time, 0.3);

          const timeoutId = setTimeout(() => {
            setCurrentlyPlayingPlanet(planet.name);
          }, index * interval * 1000);

          planetTimeoutsRef.current.push(timeoutId);
        } catch (error) {
          console.error(`Error scheduling note for ${planet.name}:`, error);
        }
      });

      const sequenceDuration = planets.length * interval;

      sequenceTimeoutRef.current = setTimeout(() => {
        if (shouldLoop) {
          setCurrentlyPlayingPlanet(null);
          planetTimeoutsRef.current = [];
          playSequence(planets, calculateFreq, bpm, shouldLoop);
        } else {
          stopSequence();
        }
      }, sequenceDuration * 1000 + 100);
    },
    [isPlaying, createMainSynth, stopSequence]
  );

  useEffect(() => {
    return () => {
      stopSequence();
    };
  }, [stopSequence]);

  return {
    isPlaying,
    currentlyPlayingPlanet,
    playSequence,
    stopSequence
  };
};
