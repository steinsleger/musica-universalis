import { useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { Planet } from '../utils/types';

interface UseSequencePlaybackParams {
  isPlaying: boolean;
  sequenceBPM: number;
  orbitData: Planet[];
  baseFrequency: number;
  loopSequence: boolean;
  gainNodeRef: React.MutableRefObject<Tone.Gain | null>;
  mainSynthRef: React.MutableRefObject<Tone.PolySynth<Tone.Synth> | null>;
  initializeAudioContext: () => Promise<boolean>;
  calculateBaseFrequencies: (baseFreq: number, planet: Planet, index: number) => number;
  debugAudio: (message: string) => void;
}

export const useSequencePlayback = ({
  isPlaying,
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
  const [currentlyPlayingPlanet, setCurrentlyPlayingPlanet] = useState<string | null>(null);

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

        setCurrentlyPlayingPlanet(null);

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

        return;
      }

      debugAudio('Starting orbital sequence');

      if (mainSynthRef.current) {
        try {
          mainSynthRef.current.dispose();
        } catch {
          // Ignore disposal errors
        }
      }

      const mainSynth = new Tone.PolySynth(Tone.Synth, {
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
        oscillator: { type: 'sine' }
      });

      if (gainNodeRef.current && !gainNodeRef.current.disposed) {
        mainSynth.connect(gainNodeRef.current);
      } else {
        mainSynth.toDestination();
      }

      mainSynthRef.current = mainSynth;

      const enabledPlanets = orbitData.filter(planet => planet.enabled);

      debugAudio(`Playing sequence with ${enabledPlanets.length} planets`);

      const beatDuration = 60 / sequenceBPM;
      const noteDuration = beatDuration;
      const interval = beatDuration;

      const now = Tone.now();

      planetTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      planetTimeoutsRef.current = [];

      enabledPlanets.forEach((planet, index) => {
        const originalIndex = orbitData.findIndex(p => p.name === planet.name);
        const freq = calculateBaseFrequencies(baseFrequency, planet, originalIndex);
        const time = now + index * interval;

        try {
          mainSynth.triggerAttackRelease(freq, noteDuration, time, 0.3);
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
          setCurrentlyPlayingPlanet(null);

          planetTimeoutsRef.current.forEach(timeoutId => {
            clearTimeout(timeoutId);
          });
          planetTimeoutsRef.current = [];

          // Re-trigger sequence
          playOrbitalSequence();
        } else {
          setCurrentlyPlayingPlanet(null);

          planetTimeoutsRef.current.forEach(timeoutId => {
            clearTimeout(timeoutId);
          });
          planetTimeoutsRef.current = [];

          debugAudio('Sequence playback complete');
        }
      }, sequenceDuration * 1000 + 100);
    } catch (error) {
      console.error('Error playing orbital sequence:', error);

      planetTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      planetTimeoutsRef.current = [];

      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }

      setCurrentlyPlayingPlanet(null);
    }
  }, [isPlaying, initializeAudioContext, sequenceBPM, orbitData, baseFrequency, loopSequence, calculateBaseFrequencies, debugAudio, gainNodeRef, mainSynthRef]);

  const cleanupSequence = useCallback(() => {
    planetTimeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    planetTimeoutsRef.current = [];

    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
  }, []);

  return {
    currentlyPlayingPlanet,
    setCurrentlyPlayingPlanet,
    playOrbitalSequence,
    cleanupSequence,
    planetTimeoutsRef,
    sequenceTimeoutRef
  };
};
