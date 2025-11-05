import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Planet, CurrentFrequencies, SynthObject } from '../utils/types';

interface UseLiveModeReturn {
  debug: (message: string, ...args: (string | number | boolean)[]) => void;
}

export const useLiveMode = (
  liveMode: boolean,
  isPaused: boolean,
  orbitData: Planet[],
  currentFrequencies: CurrentFrequencies,
  synthsRef: React.MutableRefObject<Record<string, SynthObject>>,
  activeSynthsRef: React.MutableRefObject<Set<string>>,
  gainNodesRef: React.MutableRefObject<Record<string, Tone.Gain>>,
  startPlanetSound: (name: string, freq: number) => boolean,
  stopPlanetSound: (name: string) => boolean,
  createIsolatedSynth: (name: string) => void,
  updatePlanetFrequency: (name: string, freq: number) => void,
  recreateAllAudio: () => Promise<boolean>,
  distanceMode: string
): UseLiveModeReturn => {
  const debugRef = useRef(true);

  const debug = useCallback((message: string, ...args: (string | number | boolean)[]): void => {
    if (debugRef.current) {
      console.log(`[LIVE MODE] ${message}`, ...args);
    }
  }, []);

  useEffect(() => {
    if (!liveMode) return;

    const activeSynthsCopy = activeSynthsRef.current;

    if (Tone.context.state !== 'running') {
      try {
        Tone.context.resume().catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      } catch (err) {
        console.error('Error resuming audio context:', err);
      }
    }

    let recoveryCounter = 0;
    let lastFrequencyUpdate = Date.now();

    const intervalId = setInterval(async () => {
      try {
        if (Tone.context.state !== 'running') {
          try {
            await Tone.context.resume();
            debug('Resumed audio context');
          } catch (resumeErr) {
            console.error('Failed to resume audio context:', resumeErr);
          }
        }

        const enabledPlanets = orbitData.filter(p => p.enabled);
        const enabledPlanetNames = new Set(enabledPlanets.map(p => p.name));

        const shouldHaveSounds = enabledPlanets.length > 0;
        const hasSounds = activeSynthsRef.current.size > 0;

        const shouldBePlayingButIsnt = enabledPlanets.some(p =>
          !activeSynthsRef.current.has(p.name) && currentFrequencies[p.name]
        );

        const shouldNotBePlayingButIs = Array.from(activeSynthsRef.current).some(name =>
          !enabledPlanetNames.has(name)
        );

        if ((shouldHaveSounds && !hasSounds) || shouldBePlayingButIsnt || shouldNotBePlayingButIs) {
          recoveryCounter++;

          if (recoveryCounter >= 3) {
            debug('EMERGENCY RECOVERY: Sound state mismatch detected');

            for (const name of Array.from(activeSynthsRef.current)) {
              if (!enabledPlanetNames.has(name)) {
                try {
                  createIsolatedSynth(name);
                  stopPlanetSound(name);
                } catch {
                  console.error(`Error stopping ${name} during recovery:`);
                }
              }
            }

            for (const planet of enabledPlanets) {
              if (!activeSynthsRef.current.has(planet.name) && currentFrequencies[planet.name]) {
                try {
                  createIsolatedSynth(planet.name);
                  await new Promise(resolve => setTimeout(resolve, 10));
                  startPlanetSound(planet.name, currentFrequencies[planet.name]);
                  debug(`Recovery: Started sound for ${planet.name}`);
                } catch {
                  console.error(`Error starting ${planet.name} during recovery:`);
                }
              }
            }

            recoveryCounter = 0;
          }
        } else {
          recoveryCounter = 0;
        }

        if (!isPaused) {
          const now = Date.now();
          if (now - lastFrequencyUpdate > 50) {
            Array.from(activeSynthsRef.current).forEach(planetName => {
              const freq = currentFrequencies[planetName];
              if (freq && synthsRef.current[planetName] && synthsRef.current[planetName].synth) {
                updatePlanetFrequency(planetName, freq);
              }
            });
            lastFrequencyUpdate = now;
          }
        }

        orbitData.forEach(planet => {
          const isEnabled = planet.enabled;
          const isPlaying = activeSynthsRef.current.has(planet.name);
          const freq = currentFrequencies[planet.name];

          if (!freq) return;

          if (isEnabled && !isPlaying) {
            startPlanetSound(planet.name, freq);
          } else if (!isEnabled && isPlaying) {
            stopPlanetSound(planet.name);
          }
        });
      } catch (error) {
        console.error('Error in audio update interval:', error);
        recoveryCounter++;
        if (recoveryCounter >= 3) {
          debug('Critical error in audio update, attempting full reset');
          recreateAllAudio();
          recoveryCounter = 0;
        }
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      debug('Stopped live mode audio interval');

      Array.from(activeSynthsCopy).forEach(planetName => {
        stopPlanetSound(planetName);
      });
    };
  }, [liveMode, isPaused, orbitData, currentFrequencies, distanceMode, debug, synthsRef, activeSynthsRef, gainNodesRef, startPlanetSound, stopPlanetSound, createIsolatedSynth, updatePlanetFrequency, recreateAllAudio]);

  return {
    debug
  };
};
