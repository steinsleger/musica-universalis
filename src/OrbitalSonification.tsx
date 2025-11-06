// src/OrbitalSonification.tsx
import React, { useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { AudioConfigProvider } from './context/AudioConfigContext';
import { OrbitStateProvider } from './context/OrbitStateContext';
import { useAudioConfig } from './hooks/useAudioConfig';
import { useOrbitState } from './hooks/useOrbitState';
import { useAudioContext } from './hooks/useAudioContext';
import { useFrequencyCalculation } from './hooks/useFrequencyCalculation';
import { useModals } from './hooks/useModals';
import { usePlaybackState } from './hooks/usePlaybackState';
import { useUIState } from './hooks/useUIState';
import { useAudioReferences } from './hooks/useAudioReferences';
import { usePlanetAudioManagement } from './hooks/usePlanetAudioManagement';
import { useLiveModeAudio } from './hooks/useLiveModeAudio';
import { useToggleControls } from './hooks/useToggleControls';
import { useAudioContextManager } from './hooks/useAudioContextManager';
import { useSequencePlayback } from './hooks/useSequencePlayback';
import { useControlHandlers } from './hooks/useControlHandlers';
import { useControlsContextValue } from './hooks/useControlsContextValue';
import { useFrequencyEffects } from './hooks/useFrequencyEffects';
import { useAudioInitialization } from './hooks/useAudioInitialization';
import { useVisualizationContextValue } from './hooks/useVisualizationContextValue';
import OrbitalSonificationLayout from './components/OrbitalSonificationLayout';
import {
  Planet,
  CurrentFrequencies,
  PositionMode
} from './utils/types';


declare global {
  interface Window {
    lastAudioUpdate?: number;
  }
}

const OrbitalSonificationContent: React.FC = () => {
  // Context state
  const { baseFrequency, setBaseFrequency, masterVolume, setMasterVolume, sequenceBPM, setSequenceBPM, useFletcher, setUseFletcher, audioScalingConfig, setAudioScalingConfig } = useAudioConfig();
  const { orbitData, setOrbitData, animationSpeed, setAnimationSpeed, isPaused, setIsPaused, distanceMode, setDistanceMode, positionMode, setPositionMode, zoomLevel, setZoomLevel } = useOrbitState();

  // Hooks
  const { needsUserInteraction } = useAudioContext();
  const { calculateFrequency, frequencyToNote: hookFrequencyToNote } = useFrequencyCalculation();

  // Local state
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    activeTab,
    setActiveTab
  } = useUIState();

  const {
    isPlaying,
    setIsPlaying,
    liveMode,
    setLiveMode,
    currentFrequencies,
    setCurrentFrequencies,
    loopSequence,
    setLoopSequence
  } = usePlaybackState();

  // Modal state management
  const {
    isInfoModalOpen,
    setIsInfoModalOpen,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen
  } = useModals({
    onEscapePressed: () => setSidebarCollapsed(true)
  });

  const prevPositionMode = useRef<PositionMode>(positionMode);

  const {
    audioContextStarted,
    gainNode: gainNodeRef,
    initFrequencies: initFrequenciesRef,
    synths: synthsRef,
    mainSynth: mainSynthRef,
    lastFrequencies: lastFrequenciesRef,
    debug,
    activeSynths: activeSynthsRef,
    audioInitialized: audioInitializedRef,
    gainNodes: gainNodesRef,
    reverb: reverbRef,
    synthManager: synthManagerRef
  } = useAudioReferences();

  // Debug function - declare early for use in hooks
  const debugAudio = useCallback((message: string, obj: unknown = null): void => {
    if (debug.current) {
      if (obj) {
        console.log(`[AUDIO DEBUG] ${message}`, obj);
      } else {
        console.log(`[AUDIO DEBUG] ${message}`);
      }
    }
  }, [debug]);

  // Planet audio management hook
  const {
    createIsolatedSynth,
    startPlanetSound,
    stopPlanetSound,
    updatePlanetFrequency
  } = usePlanetAudioManagement({
    synthManagerRef,
    synthsRef,
    gainNodesRef,
    activeSynthsRef,
    currentFrequencies,
    audioScalingConfig,
    useFletcher
  });

  // Use audio initialization hook
  const { initializeAudioContext, recreateAllAudio, forceRecalculateAllGains } = useAudioInitialization({
    gainNodeRef,
    reverbRef,
    synthManagerRef,
    synthsRef,
    gainNodesRef,
    activeSynthsRef,
    audioContextStarted,
    masterVolume,
    liveMode,
    orbitData,
    currentFrequencies,
    audioScalingConfig,
    useFletcher,
    debugAudio,
    createIsolatedSynth,
    startPlanetSound
  });

  // Stabilize function refs for useLiveModeAudio to prevent constant re-runs
  const initializeAudioContextFnRef = useRef(initializeAudioContext);
  const recreateAllAudioFnRef = useRef(recreateAllAudio);
  const startPlanetSoundFnRef = useRef(startPlanetSound);
  const stopPlanetSoundFnRef = useRef(stopPlanetSound);
  const updatePlanetFrequencyFnRef = useRef(updatePlanetFrequency);
  const debugAudioStableFnRef = useRef(debugAudio);
  const orbitDataRef = useRef(orbitData);
  const currentFrequenciesRef = useRef(currentFrequencies);

  useEffect(() => {
    initializeAudioContextFnRef.current = initializeAudioContext;
    recreateAllAudioFnRef.current = recreateAllAudio;
    startPlanetSoundFnRef.current = startPlanetSound;
    stopPlanetSoundFnRef.current = stopPlanetSound;
    updatePlanetFrequencyFnRef.current = updatePlanetFrequency;
    debugAudioStableFnRef.current = debugAudio;
    orbitDataRef.current = orbitData;
    currentFrequenciesRef.current = currentFrequencies;
  }, [initializeAudioContext, recreateAllAudio, startPlanetSound, stopPlanetSound, updatePlanetFrequency, debugAudio, orbitData, currentFrequencies]);

  const calculateBaseFrequencies = useCallback((baseFreq: number, planet: Planet, _index: number): number => {
    return calculateFrequency(baseFreq, planet, distanceMode);
  }, [distanceMode, calculateFrequency]);

  const updateAllFrequencies = useCallback((): CurrentFrequencies => {
    const defaultFrequencies: CurrentFrequencies = {};
    orbitData.forEach((planet, index) => {
      const freq = calculateBaseFrequencies(baseFrequency, planet, index);
      defaultFrequencies[planet.name] = freq;
    });

    setCurrentFrequencies(defaultFrequencies);

    return defaultFrequencies;
  }, [orbitData, baseFrequency, calculateBaseFrequencies, setCurrentFrequencies]);

  const handleFrequencyChange = useCallback((frequencies: CurrentFrequencies): void => {
    const updatedFrequencies = { ...currentFrequencies, ...frequencies };

    setCurrentFrequencies(updatedFrequencies);
    lastFrequenciesRef.current = { ...lastFrequenciesRef.current, ...frequencies };

    if (liveMode) {
      Object.entries(frequencies).forEach(([planetName, freq]) => {
        if (activeSynthsRef.current.has(planetName)) {
          updatePlanetFrequency(planetName, freq);
        }
      });
    }
  }, [currentFrequencies, liveMode, updatePlanetFrequency, activeSynthsRef, setCurrentFrequencies, lastFrequenciesRef]);

  const initAudioFnRef = useRef(initializeAudioContext);
  const debugAudioFnRef = useRef(debugAudio);

  useEffect(() => {
    initAudioFnRef.current = initializeAudioContext;
    debugAudioFnRef.current = debugAudio;
  }, [initializeAudioContext, debugAudio]);

  useEffect(() => {
    if (!audioInitializedRef.current) {
      initAudioFnRef.current()
        .then(success => {
          if (success) {
            audioInitializedRef.current = true;
            debugAudioFnRef.current('Audio initialized on component load');
          } else {
            console.warn('Failed to initialize audio on component load');
            debugAudioFnRef.current('Failed to initialize audio on component load');
          }
        })
        .catch(error => {
          console.error('Error during audio initialization:', error);
          debugAudioFnRef.current('Error during audio initialization');
        });
    }
  }, [audioInitializedRef]);

  useEffect(() => {
    const synthManagerCurrent = synthManagerRef.current;
    const mainSynthCurrent = mainSynthRef.current;
    const gainNodeCurrent = gainNodeRef.current;

    return () => {
      if (audioInitializedRef.current) {
        debugAudio('Component unmounting, cleaning up audio');
      }

      try {
        synthManagerCurrent.disposeAll();
      } catch (error) {
        console.error('Error disposing synths:', error);
      }

      if (mainSynthCurrent) {
        try {
          mainSynthCurrent.dispose();
        } catch {
          // Ignore disposal errors
        }
      }

      if (gainNodeCurrent) {
        try {
          gainNodeCurrent.dispose();
        } catch {
          // Ignore disposal errors
        }
      }
    };
  }, [audioInitializedRef, debugAudio, gainNodeRef, mainSynthRef, synthManagerRef]);


  useEffect(() => {
    if (!initFrequenciesRef.current) {
      updateAllFrequencies();
      initFrequenciesRef.current = true;
    }
  }, [updateAllFrequencies, initFrequenciesRef]);

  useEffect(() => {
    updateAllFrequencies();
  }, [baseFrequency, updateAllFrequencies]);

  useEffect(() => {
    const positionModeHasChanged = prevPositionMode.current !== positionMode;

    if (liveMode && (!isPaused || positionModeHasChanged)) {
      Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
        if (activeSynthsRef.current.has(planetName)) {
          updatePlanetFrequency(planetName, freq);
        }
      });
    }

    prevPositionMode.current = positionMode;
  }, [liveMode, isPaused, positionMode, currentFrequencies, updatePlanetFrequency, activeSynthsRef]);

  useEffect(() => {
    if (positionMode !== 'normal') {
      setPositionMode('normal');
    }
  }, [positionMode, setPositionMode]);

  // Use live mode audio hook
  // Create stable wrapper functions that call through refs to avoid effect re-runs
  const stableInitializeAudioContext = useCallback(() => initializeAudioContextFnRef.current(), []);
  const stableStartPlanetSound = useCallback((name: string, freq: number) => startPlanetSoundFnRef.current(name, freq), []);
  const stableStopPlanetSound = useCallback((name: string) => stopPlanetSoundFnRef.current(name), []);
  const stableUpdatePlanetFrequency = useCallback((name: string, freq: number) => updatePlanetFrequencyFnRef.current(name, freq), []);
  const stableRecreateAllAudio = useCallback(async () => {
    await recreateAllAudioFnRef.current();
  }, []);
  const stableDebugAudio = useCallback((msg: string) => debugAudioStableFnRef.current(msg), []);

  useLiveModeAudio({
    liveMode,
    orbitData,
    currentFrequencies,
    audioInitializedRef,
    gainNodeRef,
    activeSynthsRef,
    synthManagerRef,
    isPaused,
    initializeAudioContext: stableInitializeAudioContext,
    startPlanetSound: stableStartPlanetSound,
    stopPlanetSound: stableStopPlanetSound,
    updatePlanetFrequency: stableUpdatePlanetFrequency,
    recreateAllAudio: stableRecreateAllAudio,
    debugAudio: stableDebugAudio
  });

  // Use toggle controls hook
  const { togglePlanet, toggleAllPlanets, toggleLiveMode } = useToggleControls({
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
  });

  // Use audio context manager hook
  const { startAudioContext } = useAudioContextManager({
    audioContextStarted,
    gainNodeRef,
    debugAudio
  });

  const handleUserInteraction = useCallback(async (): Promise<void> => {
    if (needsUserInteraction) {
      try {
        const started = await startAudioContext();
        if (!started) {
          console.error('Failed to start audio context on user interaction');
          return;
        }

        if (!audioInitializedRef.current) {
          const initialized = await initAudioFnRef.current();
          if (!initialized) {
            console.warn('Failed to fully initialize audio after user interaction');
          }
        }
      } catch (error) {
        console.error('Error initializing audio on user interaction:', error);
      }
    }
  }, [needsUserInteraction, startAudioContext, audioInitializedRef]);

  useEffect((): void | (() => void) => {
    if (needsUserInteraction) {
      const handleGlobalClick = async (): Promise<void> => {
        await handleUserInteraction();
      };

      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('touchstart', handleGlobalClick);

      return () => {
        document.removeEventListener('click', handleGlobalClick);
        document.removeEventListener('touchstart', handleGlobalClick);
      };
    }
  }, [needsUserInteraction, handleUserInteraction]);

  // Use sequence playback hook
  const {
    currentlyPlayingPlanet,
    playOrbitalSequence
  } = useSequencePlayback({
    isPlaying,
    setIsPlaying,
    sequenceBPM,
    orbitData,
    baseFrequency,
    loopSequence,
    gainNodeRef,
    mainSynthRef,
    initializeAudioContext,
    calculateBaseFrequencies,
    debugAudio
  });

  // Use frequency effects hook for gain and frequency updates
  useFrequencyEffects({
    liveMode,
    isPaused,
    baseFrequency,
    currentFrequencies,
    orbitData,
    calculateBaseFrequencies,
    setCurrentFrequencies,
    useFletcher,
    audioScalingConfig,
    synthManagerRef,
    synthsRef,
    gainNodesRef
  });

  useEffect(() => {
    const initializeTone = async (): Promise<void> => {
      try {
        if (Tone.context.state !== 'running') {
          try {
            await Tone.start();
          } catch {
            console.error('Failed to start Tone:');
          }
        }
      } catch {
        console.error('Error initializing Tone.js:');
      }
    };

    initializeTone();

    return () => {
      try {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      } catch {
        console.error('Error cleaning up Tone.js:');
      }
    };
  }, []);

  const {
    togglePlayPause,
    handleBPMChange,
    toggleLoopSequence,
    toggleSidebar,
    handleDistanceModeChange,
    handleZoomChange,
    handleVolumeChange,
    handleBaseFrequencyChange,
    frequencyToNote,
    toggleFletcherCurves
  } = useControlHandlers({
    startAudioContext,
    isPaused,
    setPositionMode,
    setIsPaused,
    setSequenceBPM,
    loopSequence,
    setLoopSequence,
    sidebarCollapsed,
    setSidebarCollapsed,
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
    gainNodesRef
  });


  const controlsValue = useControlsContextValue({
    masterVolume,
    handleVolumeChange,
    baseFrequency,
    handleBaseFrequencyChange,
    sequenceBPM,
    handleBPMChange,
    useFletcher,
    toggleFletcherCurves,
    audioScalingConfig,
    setAudioScalingConfig,
    forceRecalculateAllGains,
    distanceMode,
    handleDistanceModeChange,
    zoomLevel,
    handleZoomChange,
    animationSpeed,
    setAnimationSpeed,
    isPlaying,
    setIsPlaying,
    playOrbitalSequence,
    loopSequence,
    toggleLoopSequence,
    liveMode,
    toggleLiveMode,
    togglePlayPause,
    orbitData,
    togglePlanet,
    toggleAllPlanets,
    currentFrequencies,
    frequencyToNote,
    sidebarCollapsed,
    toggleSidebar,
    activeTab,
    setActiveTab,
    isInfoModalOpen,
    setIsInfoModalOpen,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen,
    isPaused,
    positionMode,
    setPositionMode
  });

  const visualizationValue = useVisualizationContextValue({
    orbitData,
    animationSpeed,
    baseFrequency,
    onFrequencyChange: handleFrequencyChange,
    isPaused,
    setToAverageDistance: positionMode === 'average',
    setToAphelion: positionMode === 'aphelion',
    setToPerihelion: positionMode === 'perihelion',
    zoomLevel,
    setZoomLevel,
    distanceMode,
    currentlyPlayingPlanet,
    sequenceBPM
  });

  return (
    <OrbitalSonificationLayout
      controlsValue={controlsValue}
      visualizationValue={visualizationValue}
      needsUserInteraction={needsUserInteraction}
      handleUserInteraction={handleUserInteraction}
    />
  );
};

const OrbitalSonification: React.FC = () => (
  <AudioConfigProvider>
    <OrbitStateProvider>
      <OrbitalSonificationContent />
    </OrbitStateProvider>
  </AudioConfigProvider>
);

export default OrbitalSonification;
