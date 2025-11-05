import { useEffect, MutableRefObject } from 'react';
import * as Tone from 'tone';
import { Planet, CurrentFrequencies } from '../utils/types';
import { SynthManager } from '../utils/synthManager';
import { performEmergencyRecovery, resumeAudioContextIfNeeded, isGainNodeInvalid } from '../utils/audioUtils';

interface UseLiveModeAudioProps {
  liveMode: boolean;
  orbitData: Planet[];
  currentFrequencies: CurrentFrequencies;
  audioInitializedRef: MutableRefObject<boolean>;
  gainNodeRef: MutableRefObject<Tone.Gain | null>;
  activeSynthsRef: MutableRefObject<Set<string>>;
  synthManagerRef: MutableRefObject<SynthManager>;
  isPaused: boolean;
  distanceMode: string;
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
  audioInitializedRef,
  gainNodeRef,
  activeSynthsRef,
  synthManagerRef,
  isPaused,
  distanceMode,
  initializeAudioContext,
  startPlanetSound,
  stopPlanetSound,
  updatePlanetFrequency,
  recreateAllAudio,
  debugAudio
}: UseLiveModeAudioProps): void => {
  useEffect(() => {
    if (!liveMode) return;

    const activeSynthsCopy = activeSynthsRef.current;

    if (!audioInitializedRef.current) {
      initializeAudioContext().then(success => {
        if (success) {
          audioInitializedRef.current = true;
        }
      });
      return;
    }

    debugAudio('Starting live mode audio interval');

    let recoveryCounter = 0;
    let lastFrequencyUpdate = Date.now();

    const intervalId = setInterval(async () => {
      try {
        // Resume audio context if needed
        await resumeAudioContextIfNeeded();

        // Check and recreate gain node if needed
        if (isGainNodeInvalid(gainNodeRef.current)) {
          debugAudio('Gain node is missing or disposed, recreating');
          await initializeAudioContext();
        }

        // Detect sound state mismatches and recover if needed
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

        // Trigger recovery if state mismatch detected
        if ((shouldHaveSounds && !hasSounds) || shouldBePlayingButIsnt || shouldNotBePlayingButIs) {
          recoveryCounter++;

          if (recoveryCounter >= 3) {
            await performEmergencyRecovery({
              enabledPlanetNames,
              activeSynths: activeSynthsRef.current,
              currentFrequencies,
              debugAudio,
              onStopPlanet: stopPlanetSound,
              onStartPlanet: startPlanetSound,
              onFullReset: recreateAllAudio
            });
            recoveryCounter = 0;
          }
        } else {
          recoveryCounter = 0;
        }

        // Update frequencies for active synths if not paused
        if (!isPaused) {
          const now = Date.now();
          if (now - lastFrequencyUpdate > 50) {
            Array.from(activeSynthsRef.current).forEach(planetName => {
              const freq = currentFrequencies[planetName];
              if (freq && synthManagerRef.current.getSynth(planetName)) {
                updatePlanetFrequency(planetName, freq);
              }
            });
            lastFrequencyUpdate = now;
          }
        }

        // Synchronize planet sounds with enabled/disabled state
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
          debugAudio('Critical error in audio update, attempting full reset');
          await recreateAllAudio();
          recoveryCounter = 0;
        }
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
  }, [liveMode, distanceMode]); // eslint-disable-line react-hooks/exhaustive-deps
};
