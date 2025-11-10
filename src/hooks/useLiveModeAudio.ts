import { useEffect, useRef, MutableRefObject } from 'react';
import { Planet, CurrentFrequencies } from '../types/domain';
import { AudioProviderRef } from './useAudioProviderRef';
import { resumeAudioContextIfNeeded, isGainNodeInvalid } from '../utils/audioUtils';

interface UseLiveModeAudioProps {
  // Data state
  liveMode: boolean;
  orbitData: Planet[];
  currentFrequencies: CurrentFrequencies;
  isPaused: boolean;

  // Consolidated audio provider ref (replaces 4 individual refs)
  audioProviderRef: MutableRefObject<AudioProviderRef>;

  // Audio operation callbacks
  initializeAudioContext: () => Promise<boolean>;
  startPlanetSound: (planetName: string, frequency: number) => boolean;
  stopPlanetSound: (planetName: string) => boolean;
  updatePlanetFrequency: (planetName: string, frequency: number) => boolean;
  recreateAllAudio: () => Promise<void>;
  debugAudio: (message: string) => void;
}

/**
 * Hook that manages live mode audio interval
 * Handles continuous audio updates, state synchronization, and error recovery
 */
export const useLiveModeAudio = ({
  liveMode,
  orbitData,
  currentFrequencies,
  audioProviderRef,
  isPaused,
  initializeAudioContext,
  startPlanetSound,
  stopPlanetSound,
  updatePlanetFrequency,
  recreateAllAudio,
  debugAudio
}: UseLiveModeAudioProps): void => {
  const orbitDataRef = useRef(orbitData);
  const currentFrequenciesRef = useRef(currentFrequencies);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    orbitDataRef.current = orbitData;
    currentFrequenciesRef.current = currentFrequencies;
    isPausedRef.current = isPaused;
  }, [orbitData, currentFrequencies, isPaused]);

  useEffect(() => {
    if (!liveMode) return;

    const activeSynthsCopy = audioProviderRef.current.activeSynths;

    if (!audioProviderRef.current.audioInitialized) {
      initializeAudioContext().then(success => {
        if (success) {
          audioProviderRef.current.audioInitialized = true;
        }
      });
      return;
    }

    debugAudio('Starting live mode audio interval');

    let lastFrequencyUpdate = Date.now();

    const intervalId = setInterval(async () => {
      try {
        // Resume audio context if needed
        await resumeAudioContextIfNeeded();

        // Check and recreate gain node if needed
        if (isGainNodeInvalid(audioProviderRef.current.gainNode)) {
          debugAudio('Gain node is missing or disposed, recreating');
          await initializeAudioContext();
        }

        // Update frequencies for active synths if not paused
        if (!isPausedRef.current) {
          const now = Date.now();
          if (now - lastFrequencyUpdate > 50) {
            Array.from(audioProviderRef.current.activeSynths).forEach(planetName => {
              const freq = currentFrequenciesRef.current[planetName];
              if (freq && audioProviderRef.current.synthManager.getSynth(planetName)) {
                updatePlanetFrequency(planetName, freq);
              }
            });
            lastFrequencyUpdate = now;
          }
        }

        // Synchronize planet sounds with enabled/disabled state
        orbitDataRef.current.forEach(planet => {
          const isEnabled = planet.enabled;
          const isPlaying = audioProviderRef.current.activeSynths.has(planet.name);
          const freq = currentFrequenciesRef.current[planet.name];

          if (!freq) return;

          if (isEnabled && !isPlaying) {
            startPlanetSound(planet.name, freq);
          } else if (!isEnabled && isPlaying) {
            stopPlanetSound(planet.name);
          }
        });
      } catch (error) {
        console.error('Error in audio update interval:', error);
        debugAudio(`Audio update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      debugAudio('Stopped live mode audio interval');

      // Stop all sounds on cleanup
      Array.from(activeSynthsCopy).forEach(planetName => {
        stopPlanetSound(planetName);
      });
    };
  }, [liveMode, audioProviderRef, initializeAudioContext, startPlanetSound, stopPlanetSound, updatePlanetFrequency, recreateAllAudio, debugAudio]);
};
