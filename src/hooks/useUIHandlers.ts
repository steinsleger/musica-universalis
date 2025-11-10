import { useCallback, useState, useRef, useEffect, MutableRefObject } from 'react';
import * as Tone from 'tone';
import { Planet, FrequencyMode, CurrentFrequencies, PositionMode } from '../types/domain';
import { AudioScalingConfig, SynthObject } from '../types/audio';
import { TabType } from '../types/ui';
import { SynthManager } from '@/services/audio/SynthManager';
import { AudioProviderRef } from './useAudioProviderRef';

interface UseUIHandlersParams {
  currentMode: PositionMode;
  onEscapePressed?: () => void;
  startAudioContext: () => Promise<boolean>;
  isPaused: boolean;
  setPositionMode: (mode: PositionMode) => void;
  setIsPaused: (paused: boolean) => void;
  setSequenceBPM: (bpm: number) => void;
  loopSequence: boolean;
  setLoopSequence: (loop: boolean) => void;
  setDistanceMode: (mode: FrequencyMode) => void;
  liveMode: boolean;
  updateAllFrequencies: () => CurrentFrequencies;
  setZoomLevel: (zoom: number) => void;
  debugAudio: (message: string) => void;
  synthManagerRef: React.RefObject<SynthManager>;
  setMasterVolume: (volume: number) => void;
  calculateBaseFrequencies: (baseFreq: number, planet: Planet, index: number) => number;
  orbitData: Planet[];
  activeSynthsRef: React.RefObject<Set<string>>;
  updatePlanetFrequency: (planetName: string, frequency: number) => void;
  setCurrentFrequencies: (frequencies: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies)) => void;
  currentFrequencies: CurrentFrequencies;
  setBaseFrequency: (freq: number) => void;
  hookFrequencyToNote: (freq: number) => string;
  useFletcher: boolean;
  audioScalingConfig: AudioScalingConfig;
  setUseFletcher: (use: boolean) => void;
  synthsRef: React.RefObject<Record<string, SynthObject>>;
  gainNodesRef: React.RefObject<Record<string, Tone.Gain>>;
  setOrbitData: (data: Planet[]) => void;
  setLiveMode: (mode: boolean) => void;
  audioProviderRef: MutableRefObject<AudioProviderRef>;
  createIsolatedSynth: (planetName: string) => SynthObject | null;
  startPlanetSound: (planetName: string, frequency: number) => boolean;
  stopPlanetSound: (planetName: string) => boolean;
  initializeAudioContext: () => Promise<boolean>;
  recreateAllAudio: () => Promise<boolean>;
  forceRecalculateAllGains: () => void;
}

interface UIHandlers {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  isInstructionsModalOpen: boolean;
  setIsInstructionsModalOpen: (open: boolean) => void;
  hasPositionModeChanged: () => boolean;
  recordCurrentMode: (mode: PositionMode) => void;
  togglePlayPause: () => Promise<void>;
  handleBPMChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleLoopSequence: () => void;
  toggleSidebar: () => void;
  handleDistanceModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleZoomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBaseFrequencyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  frequencyToNote: (frequency: number | undefined) => string;
  toggleFletcherCurves: () => void;
  togglePlanet: (index: number, forceState?: boolean | null) => Promise<void>;
  toggleAllPlanets: (enable: boolean) => Promise<void>;
  toggleLiveMode: () => Promise<void>;
}

/**
 * Manages UI state and event handlers
 * Combines modal state, position tracking, and control handlers
 */
export const useUIHandlers = ({
  currentMode,
  onEscapePressed,
  startAudioContext,
  isPaused,
  setPositionMode,
  setIsPaused,
  setSequenceBPM,
  loopSequence,
  setLoopSequence,
  setDistanceMode,
  liveMode,
  updateAllFrequencies,
  setZoomLevel,
  debugAudio,
  synthManagerRef,
  setMasterVolume,
  calculateBaseFrequencies,
  orbitData,
  activeSynthsRef,
  updatePlanetFrequency,
  setCurrentFrequencies,
  currentFrequencies,
  setBaseFrequency,
  hookFrequencyToNote,
  useFletcher,
  audioScalingConfig,
  setUseFletcher,
  synthsRef,
  gainNodesRef,
  setOrbitData,
  setLiveMode,
  audioProviderRef,
  createIsolatedSynth,
  startPlanetSound,
  stopPlanetSound,
  initializeAudioContext,
  recreateAllAudio,
  forceRecalculateAllGains
}: UseUIHandlersParams): UIHandlers => {
  // Modal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('controls');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);

  // Position tracking
  const prevModeRef = useRef<PositionMode>(currentMode);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsInfoModalOpen(false);
        setIsInstructionsModalOpen(false);
        setSidebarCollapsed(true);
        onEscapePressed?.();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onEscapePressed]);

  // Track position mode changes
  useEffect(() => {
    prevModeRef.current = currentMode;
  }, [currentMode]);

  const hasPositionModeChanged = useCallback((): boolean => {
    return prevModeRef.current !== currentMode;
  }, [currentMode]);

  const recordCurrentMode = useCallback((mode: PositionMode): void => {
    prevModeRef.current = mode;
  }, []);

  // Control handlers
  const togglePlayPause = useCallback(async (): Promise<void> => {
    await startAudioContext();
    if (isPaused) {
      setPositionMode('normal');
    }
    setIsPaused(!isPaused);
  }, [startAudioContext, isPaused, setPositionMode, setIsPaused]);

  const handleBPMChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSequenceBPM(parseInt(e.target.value, 10));
  }, [setSequenceBPM]);

  const toggleLoopSeq = useCallback((): void => {
    setLoopSequence(!loopSequence);
  }, [loopSequence, setLoopSequence]);

  const toggleSidebar = useCallback((): void => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  const handleDistanceModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newMode = e.target.value as FrequencyMode;
    setDistanceMode(newMode);

    if (liveMode) {
      updateAllFrequencies();
    }
  }, [setDistanceMode, liveMode, updateAllFrequencies]);

  const handleZoomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setZoomLevel(parseFloat(e.target.value));
  }, [setZoomLevel]);

  const updateMasterVolume = useCallback((newVolume: number): boolean => {
    debugAudio(`Updating master volume to ${newVolume}`);

    try {
      Tone.getDestination().volume.value = Tone.gainToDb(newVolume);
      synthManagerRef.current.setMasterVolume(newVolume);
      return true;
    } catch {
      console.error('Failed to update master volume:');
      return false;
    }
  }, [debugAudio, synthManagerRef]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const newVolume = parseFloat(e.target.value);
    setMasterVolume(newVolume);
    updateMasterVolume(newVolume);
  }, [setMasterVolume, updateMasterVolume]);

  const handleBaseFrequencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const newBaseFrequency = parseFloat(e.target.value);
    setBaseFrequency(newBaseFrequency);

    const recalculatedFrequencies: CurrentFrequencies = {};
    orbitData.forEach((planet, index) => {
      if (planet.enabled) {
        const baseFreq = calculateBaseFrequencies(newBaseFrequency, planet, index);
        recalculatedFrequencies[planet.name] = baseFreq;

        if (liveMode && activeSynthsRef.current.has(planet.name)) {
          updatePlanetFrequency(planet.name, baseFreq);
        }
      }
    });

    setCurrentFrequencies(prevFreqs => ({
      ...prevFreqs,
      ...recalculatedFrequencies
    }));
  }, [
    setBaseFrequency,
    calculateBaseFrequencies,
    orbitData,
    liveMode,
    activeSynthsRef,
    updatePlanetFrequency,
    setCurrentFrequencies
  ]);

  const frequencyToNote = useCallback((frequency: number | undefined): string => {
    return frequency ? hookFrequencyToNote(frequency) : '';
  }, [hookFrequencyToNote]);

  const toggleFletcherCurves = useCallback((): void => {
    const newValue = !useFletcher;

    if (liveMode) {
      const enabledFrequencies: CurrentFrequencies = {};
      Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
        const planet = orbitData.find(p => p.name === planetName);
        if (planet && planet.enabled && freq) {
          enabledFrequencies[planetName] = freq;
        }
      });

      synthManagerRef.current.updateAllGains(enabledFrequencies, audioScalingConfig, newValue);

      Object.keys(enabledFrequencies).forEach(planetName => {
        const synthObj = synthManagerRef.current.getSynth(planetName);
        if (synthObj) {
          synthsRef.current[planetName] = synthObj;
          gainNodesRef.current[planetName] = synthObj.gain;
        }
      });
    }

    setUseFletcher(newValue);
  }, [
    useFletcher,
    liveMode,
    orbitData,
    currentFrequencies,
    audioScalingConfig,
    synthManagerRef,
    setUseFletcher,
    synthsRef,
    gainNodesRef
  ]);

  // Toggle controls
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

          debugAudio(`Active synths after toggle: ${Array.from(audioProviderRef.current.activeSynths).join(', ')}`);
        }
      } catch (error) {
        console.error('Error toggling planet:', error);
      }
    },
    [orbitData, liveMode, currentFrequencies, createIsolatedSynth, startPlanetSound, stopPlanetSound, debugAudio, setOrbitData, audioProviderRef]
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
        Array.from(audioProviderRef.current.activeSynths).forEach(planetName => {
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
  }, [liveMode, stopPlanetSound, initializeAudioContext, recreateAllAudio, forceRecalculateAllGains, debugAudio, setLiveMode, audioProviderRef]);

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    activeTab,
    setActiveTab,
    isInfoModalOpen,
    setIsInfoModalOpen,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen,
    hasPositionModeChanged,
    recordCurrentMode,
    togglePlayPause,
    handleBPMChange,
    toggleLoopSequence: toggleLoopSeq,
    toggleSidebar,
    handleDistanceModeChange,
    handleZoomChange,
    handleVolumeChange,
    handleBaseFrequencyChange,
    frequencyToNote,
    toggleFletcherCurves,
    togglePlanet,
    toggleAllPlanets,
    toggleLiveMode
  };
};
