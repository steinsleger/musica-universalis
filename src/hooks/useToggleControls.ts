import { useCallback, MutableRefObject } from 'react';
import { Planet, CurrentFrequencies, SynthObject } from '../utils/types';

interface UseToggleControlsProps {
  orbitData: Planet[];
  setOrbitData: (data: Planet[]) => void;
  liveMode: boolean;
  setLiveMode: (mode: boolean) => void;
  currentFrequencies: CurrentFrequencies;
  activeSynthsRef: MutableRefObject<Set<string>>;
  createIsolatedSynth: (planetName: string) => SynthObject | null;
  startPlanetSound: (planetName: string, frequency: number) => boolean;
  stopPlanetSound: (planetName: string) => boolean;
  initializeAudioContext: () => Promise<boolean>;
  recreateAllAudio: () => Promise<boolean>;
  forceRecalculateAllGains: () => void;
  debugAudio: (message: string) => void;
}

interface ToggleControls {
  togglePlanet: (index: number, forceState?: boolean | null) => Promise<void>;
  toggleAllPlanets: (enable: boolean) => Promise<void>;
  toggleLiveMode: () => Promise<void>;
}

/**
 * Hook for managing toggle controls for planets and live mode
 * Handles state changes and audio synchronization
 *
 * @deprecated Use useUIHandlers instead, which consolidates UI event handlers and toggle logic.
 * useToggleControls will be removed in a future refactor after the container is migrated.
 */
export const useToggleControls = ({
  orbitData,
  setOrbitData,
  liveMode,
  setLiveMode,
  currentFrequencies,
  activeSynthsRef,
  createIsolatedSynth,
  startPlanetSound,
  stopPlanetSound,
  initializeAudioContext,
  recreateAllAudio,
  forceRecalculateAllGains,
  debugAudio
}: UseToggleControlsProps): ToggleControls => {
  const togglePlanet = useCallback(
    async (index: number, forceState: boolean | null = null): Promise<void> => {
      try {
        const newData = [...orbitData];
        const planet = newData[index];
        const wasEnabled = planet.enabled;

        const newEnabled = forceState !== null ? forceState : !wasEnabled;

        planet.enabled = newEnabled;
        setOrbitData(newData);

        debugAudio(
          `Toggling planet ${planet.name}, was ${wasEnabled ? 'enabled' : 'disabled'}, now ${
            newEnabled ? 'enabled' : 'disabled'
          }`
        );

        if (liveMode) {
          if (wasEnabled && !newEnabled) {
            debugAudio(`Stopping sound for ${planet.name} only`);
            try {
              stopPlanetSound(planet.name);
            } catch {
              console.error(`Error stopping sound for ${planet.name}:`);
              createIsolatedSynth(planet.name);
            }
          } else if (!wasEnabled && newEnabled) {
            const freq = currentFrequencies[planet.name];
            if (freq) {
              try {
                createIsolatedSynth(planet.name);
                startPlanetSound(planet.name, freq);
              } catch {
                console.error(`Error starting sound for ${planet.name}:`);
                try {
                  createIsolatedSynth(planet.name);
                  startPlanetSound(planet.name, freq);
                } catch (retryErr) {
                  console.error(`Retry failed for ${planet.name}:`, retryErr);
                }
              }
            }
          }

          debugAudio(`Active synths after toggle: ${Array.from(activeSynthsRef.current).join(', ')}`);
        }
      } catch (error) {
        console.error('Error toggling planet:', error);
      }
    },
    [orbitData, liveMode, currentFrequencies, createIsolatedSynth, startPlanetSound, stopPlanetSound, debugAudio, setOrbitData, activeSynthsRef]
  );

  const toggleAllPlanets = useCallback(
    async (enable: boolean): Promise<void> => {
      try {
        await Promise.all(orbitData.map((_, index) => togglePlanet(index, enable)));
      } catch (error) {
        console.error('Error toggling all planets:', error);
      }
    },
    [orbitData, togglePlanet]
  );

  const toggleLiveMode = useCallback(async (): Promise<void> => {
    try {
      const success = await initializeAudioContext();
      if (!success) {
        console.error('Could not initialize audio context when toggling live mode');
        return;
      }

      const newLiveMode = !liveMode;
      debugAudio(`Toggling live mode to ${newLiveMode ? 'on' : 'off'}`);

      if (!newLiveMode) {
        Array.from(activeSynthsRef.current).forEach(planetName => {
          stopPlanetSound(planetName);
        });
      } else {
        const resetSuccess = await recreateAllAudio();
        if (!resetSuccess) {
          console.error('Failed to reset audio system when entering live mode');
          return;
        }

        setTimeout(() => forceRecalculateAllGains(), 100);
        setTimeout(() => forceRecalculateAllGains(), 300);
        setTimeout(() => forceRecalculateAllGains(), 1000);
      }

      setLiveMode(newLiveMode);
    } catch (error) {
      console.error('Error toggling live mode:', error);
    }
  }, [liveMode, stopPlanetSound, initializeAudioContext, recreateAllAudio, forceRecalculateAllGains, debugAudio, setLiveMode, activeSynthsRef]);

  return {
    togglePlanet,
    toggleAllPlanets,
    toggleLiveMode
  };
};
