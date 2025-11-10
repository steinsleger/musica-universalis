import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import * as Tone from 'tone';
import { UIControlsProvider } from '../../context/UIControlsContext';
import { AudioControlsProvider } from '../../context/AudioControlsContext';
import { VisualizationControlsProvider } from '../../context/VisualizationControlsContext';
import { useAudioConfig } from '../../hooks/useAudioConfig';
import { useOrbitalState as useOrbitState } from '../../hooks/useOrbitalState';
import { useAudioContext } from '../../hooks/useAudioContext';
import { useModals } from '../../hooks/useModals';
import { useAudioState } from '../../hooks/useAudioState';
import { useUIState } from '../../hooks/useUIState';
import { useAudioProviderRef } from '../../hooks/useAudioProviderRef';
import { useFrequencyManager } from '../../hooks/useFrequencyManager';
import { useLiveModeAudio } from '../../hooks/useLiveModeAudio';
import { useToggleControls } from '../../hooks/useToggleControls';
import { useAudioContextManager } from '../../hooks/useAudioContextManager';
import { useSequencePlayback } from '../../hooks/useSequencePlayback';
import { useControlHandlers } from '../../hooks/useControlHandlers';
import { useFrequencyEffects } from '../../hooks/useFrequencyEffects';
import { useAudioInitialization } from '../../hooks/useAudioInitialization';
import { usePositionTracker } from '../../hooks/usePositionTracker';
import OrbitalSonificationPresenter from '../presenters/OrbitalSonificationPresenter';
import { CurrentFrequencies, Planet } from '../../types/domain';

declare global {
  interface Window {
    lastAudioUpdate?: number;
  }
}

/**
 * OrbitalSonificationContainer
 *
 * Handles all state management and orchestration logic:
 * - Audio context initialization and lifecycle
 * - Frequency calculations
 * - Playback and live mode management
 * - Event handler creation
 * - Context value building
 *
 * Provides 3 focused contexts to OrbitalSonificationPresenter:
 * - UIControlsContext
 * - AudioControlsContext
 * - VisualizationControlsContext
 */
const OrbitalSonificationContainer: React.FC = () => {
  // Context state
  const {
    baseFrequency,
    setBaseFrequency,
    masterVolume,
    setMasterVolume,
    sequenceBPM,
    setSequenceBPM,
    useFletcher,
    setUseFletcher,
    audioScalingConfig,
    setAudioScalingConfig
  } = useAudioConfig();

  const {
    orbitData,
    setOrbitData,
    animationSpeed,
    setAnimationSpeed,
    isPaused,
    setIsPaused,
    distanceMode,
    setDistanceMode,
    positionMode,
    setPositionMode,
    zoomLevel,
    setZoomLevel
  } = useOrbitState();

  // Hooks
  const { needsUserInteraction } = useAudioContext();

  // Local state
  const { sidebarCollapsed, setSidebarCollapsed, activeTab, setActiveTab } =
    useUIState();

  const {
    isPlaying,
    setIsPlaying,
    liveMode,
    setLiveMode,
    currentFrequencies,
    setCurrentFrequencies,
    loopSequence,
    setLoopSequence,
    currentlyPlayingPlanet,
    setCurrentlyPlayingPlanet
  } = useAudioState();

  // Error state management
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioHealthStatus, setAudioHealthStatus] = useState<'healthy' | 'degraded' | 'failed'>('healthy');

  // Modal state management
  const {
    isInfoModalOpen,
    setIsInfoModalOpen,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen
  } = useModals({
    onEscapePressed: () => setSidebarCollapsed(true)
  });

  // Position tracker hook - replaces prevPositionMode ref
  const { hasPositionModeChanged, recordCurrentMode } = usePositionTracker(
    positionMode
  );

  // Consolidated audio provider reference
  const audioProviderRef = useAudioProviderRef();

  // Memoize alias refs to prevent dependency issues
  const audioContextStartedRef = useMemo(() => ({
    get current() { return audioProviderRef.current.audioContextStarted; },
    set current(v) { audioProviderRef.current.audioContextStarted = v; }
  }), [audioProviderRef]);

  const gainNodeRef = useMemo(() => ({
    get current() { return audioProviderRef.current.gainNode; },
    set current(v) { audioProviderRef.current.gainNode = v; }
  }), [audioProviderRef]);

  const initFrequenciesRef = useMemo(() => ({
    get current() { return audioProviderRef.current.initFrequencies; },
    set current(v) { audioProviderRef.current.initFrequencies = v; }
  }), [audioProviderRef]);

  const synthsRef = useMemo(() => ({
    get current() { return audioProviderRef.current.synths; },
    set current(v) { audioProviderRef.current.synths = v; }
  }), [audioProviderRef]);

  const mainSynthRef = useMemo(() => ({
    get current() { return audioProviderRef.current.mainSynth; },
    set current(v) { audioProviderRef.current.mainSynth = v; }
  }), [audioProviderRef]);

  const lastFrequenciesRef = useMemo(() => ({
    get current() { return audioProviderRef.current.lastFrequencies; },
    set current(v) { audioProviderRef.current.lastFrequencies = v; }
  }), [audioProviderRef]);

  const activeSynthsRef = useMemo(() => ({
    get current() { return audioProviderRef.current.activeSynths; },
    set current(v) { audioProviderRef.current.activeSynths = v; }
  }), [audioProviderRef]);

  const audioInitializedRef = useMemo(() => ({
    get current() { return audioProviderRef.current.audioInitialized; },
    set current(v) { audioProviderRef.current.audioInitialized = v; }
  }), [audioProviderRef]);

  const gainNodesRef = useMemo(() => ({
    get current() { return audioProviderRef.current.gainNodes; },
    set current(v) { audioProviderRef.current.gainNodes = v; }
  }), [audioProviderRef]);

  const reverbRef = useMemo(() => ({
    get current() { return audioProviderRef.current.reverb; },
    set current(v) { audioProviderRef.current.reverb = v; }
  }), [audioProviderRef]);

  const synthManagerRef = useMemo(() => ({
    get current() { return audioProviderRef.current.synthManager; },
    set current(v) { audioProviderRef.current.synthManager = v; }
  }), [audioProviderRef]);

  // Debug function
  const debugAudio = useCallback((message: string, obj: unknown = null): void => {
    if (audioProviderRef.current.debug) {
      if (obj) {
        console.log(`[AUDIO DEBUG] ${message}`, obj);
      } else {
        console.log(`[AUDIO DEBUG] ${message}`);
      }
    }
  }, [audioProviderRef]);

  // Consolidated frequency and audio management hook (replaces useFrequencyCalculation + usePlanetAudioManagement)
  const {
    calculateFrequency,
    createIsolatedSynth,
    startPlanetSound,
    stopPlanetSound,
    updatePlanetFrequency,
    frequencyToNote: hookFrequencyToNote
  } = useFrequencyManager({
    synthManagerRef,
    synthsRef,
    gainNodesRef,
    activeSynthsRef,
    currentFrequencies,
    audioScalingConfig,
    useFletcher
  });

  // Audio initialization hook
  const {
    initializeAudioContext,
    recreateAllAudio,
    forceRecalculateAllGains
  } = useAudioInitialization({
    gainNodeRef,
    reverbRef,
    synthManagerRef,
    synthsRef,
    gainNodesRef,
    activeSynthsRef,
    audioContextStarted: audioContextStartedRef,
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

  // Memoized refs for stable function references
  const initializeAudioContextRef = useRef(initializeAudioContext);
  const recreateAllAudioRef = useRef(recreateAllAudio);
  const startPlanetSoundRef = useRef(startPlanetSound);
  const stopPlanetSoundRef = useRef(stopPlanetSound);
  const updatePlanetFrequencyRef = useRef(updatePlanetFrequency);

  useEffect(() => {
    initializeAudioContextRef.current = initializeAudioContext;
    recreateAllAudioRef.current = recreateAllAudio;
    startPlanetSoundRef.current = startPlanetSound;
    stopPlanetSoundRef.current = stopPlanetSound;
    updatePlanetFrequencyRef.current = updatePlanetFrequency;
  }, [initializeAudioContext, recreateAllAudio, startPlanetSound, stopPlanetSound, updatePlanetFrequency]);

  const calculateBaseFrequencies = useCallback(
    (baseFreq: number, planet: Planet, _index: number): number => {
      return calculateFrequency(baseFreq, planet, distanceMode);
    },
    [distanceMode, calculateFrequency]
  );

  const updateAllFrequencies = useCallback((): CurrentFrequencies => {
    const defaultFrequencies: CurrentFrequencies = {};
    orbitData.forEach((planet, index) => {
      const freq = calculateBaseFrequencies(baseFrequency, planet, index);
      defaultFrequencies[planet.name] = freq;
    });

    setCurrentFrequencies(defaultFrequencies);
    lastFrequenciesRef.current = defaultFrequencies;

    return defaultFrequencies;
  }, [orbitData, baseFrequency, calculateBaseFrequencies, setCurrentFrequencies, lastFrequenciesRef]);

  // Handle frequency changes from PlanetarySystem when planets move
  const handleFrequencyChange = useCallback(
    (frequencies: CurrentFrequencies): void => {
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
    },
    [
      currentFrequencies,
      liveMode,
      updatePlanetFrequency,
      activeSynthsRef,
      setCurrentFrequencies,
      lastFrequenciesRef
    ]
  );

  // Initialize audio on component mount
  useEffect(() => {
    if (!audioInitializedRef.current) {
      initializeAudioContextRef
        .current()
        .then((success: boolean) => {
          if (success) {
            audioInitializedRef.current = true;
            debugAudio('Audio initialized on component load');
          } else {
            console.warn('Failed to initialize audio on component load');
            debugAudio('Failed to initialize audio on component load');
          }
        })
        .catch((error: unknown) => {
          console.error('Error during audio initialization:', error);
          debugAudio('Error during audio initialization');
        });
    }
  }, [audioInitializedRef, debugAudio]);

  // Cleanup audio on component unmount
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

  // Initialize frequencies on mount
  useEffect(() => {
    if (!initFrequenciesRef.current) {
      updateAllFrequencies();
      initFrequenciesRef.current = true;
    }
  }, [updateAllFrequencies, initFrequenciesRef]);

  // Update all frequencies when base frequency changes
  useEffect(() => {
    updateAllFrequencies();
  }, [baseFrequency, updateAllFrequencies]);

  // Handle position mode changes for live mode
  useEffect(() => {
    if (liveMode && (!isPaused || hasPositionModeChanged())) {
      Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
        if (activeSynthsRef.current.has(planetName)) {
          updatePlanetFrequency(planetName, freq);
        }
      });
    }

    recordCurrentMode(positionMode);
  }, [
    liveMode,
    isPaused,
    positionMode,
    currentFrequencies,
    updatePlanetFrequency,
    activeSynthsRef,
    hasPositionModeChanged,
    recordCurrentMode
  ]);

  // Reset position mode to normal
  useEffect(() => {
    if (positionMode !== 'normal') {
      setPositionMode('normal');
    }
  }, [positionMode, setPositionMode]);

  // Stable function wrappers to prevent dependency churn
  const stableInitializeAudioContext = useCallback(
    () => initializeAudioContextRef.current(),
    []
  );
  const stableStartPlanetSound = useCallback(
    (name: string, freq: number) => startPlanetSoundRef.current(name, freq),
    []
  );
  const stableStopPlanetSound = useCallback(
    (name: string) => stopPlanetSoundRef.current(name),
    []
  );
  const stableUpdatePlanetFrequency = useCallback(
    (name: string, freq: number) => updatePlanetFrequencyRef.current(name, freq),
    []
  );
  const stableRecreateAllAudio = useCallback(async () => {
    await recreateAllAudioRef.current();
  }, []);

  // Use live mode audio hook
  useLiveModeAudio({
    liveMode,
    orbitData,
    currentFrequencies,
    audioProviderRef,
    isPaused,
    initializeAudioContext: stableInitializeAudioContext,
    startPlanetSound: stableStartPlanetSound,
    stopPlanetSound: stableStopPlanetSound,
    updatePlanetFrequency: stableUpdatePlanetFrequency,
    recreateAllAudio: stableRecreateAllAudio,
    debugAudio
  });

  // Use toggle controls hook
  const { togglePlanet, toggleAllPlanets, toggleLiveMode } = useToggleControls(
    {
      orbitData,
      setOrbitData,
      liveMode,
      setLiveMode,
      currentFrequencies,
      audioProviderRef,
      createIsolatedSynth,
      startPlanetSound,
      stopPlanetSound,
      initializeAudioContext,
      recreateAllAudio,
      forceRecalculateAllGains,
      debugAudio
    }
  );

  // Use audio context manager hook
  const { startAudioContext } = useAudioContextManager({
    audioContextStarted: audioContextStartedRef,
    gainNodeRef,
    debugAudio
  });

  const handleUserInteraction = useCallback(async (): Promise<void> => {
    if (needsUserInteraction) {
      try {
        setAudioError(null);
        const started = await startAudioContext();
        if (!started) {
          const message = 'Failed to start audio context on user interaction';
          console.error(message);
          setAudioError(message);
          return;
        }

        if (!audioInitializedRef.current) {
          const initialized = await initializeAudioContextRef.current();
          if (!initialized) {
            console.warn('Failed to fully initialize audio after user interaction');
            setAudioError('Audio initialization incomplete');
            setAudioHealthStatus('degraded');
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown audio initialization error';
        console.error('Error initializing audio on user interaction:', error);
        setAudioError(message);
        setAudioHealthStatus('failed');
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
  const { playOrbitalSequence } = useSequencePlayback(
    {
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
    }
  );

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
        const context = Tone.getContext();
        if (context.state !== 'running') {
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
        const transport = Tone.getTransport();
        transport.stop();
        transport.cancel();
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

  // Build context values with useMemo
  const uiControlsValue = useMemo(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      activeTab,
      setActiveTab,
      isInfoModalOpen,
      setIsInfoModalOpen,
      isInstructionsModalOpen,
      setIsInstructionsModalOpen
    }),
    [
      sidebarCollapsed,
      toggleSidebar,
      activeTab,
      setActiveTab,
      isInfoModalOpen,
      setIsInfoModalOpen,
      isInstructionsModalOpen,
      setIsInstructionsModalOpen
    ]
  );

  const audioControlsValue = useMemo(
    () => ({
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
      isPlaying,
      setIsPlaying,
      playOrbitalSequence,
      loopSequence,
      toggleLoopSequence,
      liveMode,
      toggleLiveMode,
      togglePlayPause,
      audioError,
      setAudioError,
      audioHealthStatus,
      setAudioHealthStatus
    }),
    [
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
      isPlaying,
      setIsPlaying,
      playOrbitalSequence,
      loopSequence,
      toggleLoopSequence,
      liveMode,
      toggleLiveMode,
      togglePlayPause,
      audioError,
      audioHealthStatus
    ]
  );

  const visualizationControlsValue = useMemo(
    () => ({
      distanceMode,
      handleDistanceModeChange,
      zoomLevel,
      handleZoomChange,
      animationSpeed,
      setAnimationSpeed,
      orbitData,
      togglePlanet,
      toggleAllPlanets,
      currentFrequencies,
      frequencyToNote,
      isPaused,
      positionMode,
      setPositionMode,
      currentlyPlayingPlanet: currentlyPlayingPlanet || undefined
    }),
    [
      distanceMode,
      handleDistanceModeChange,
      zoomLevel,
      handleZoomChange,
      animationSpeed,
      setAnimationSpeed,
      orbitData,
      togglePlanet,
      toggleAllPlanets,
      currentFrequencies,
      frequencyToNote,
      isPaused,
      positionMode,
      setPositionMode,
      currentlyPlayingPlanet
    ]
  );

  return (
    <UIControlsProvider value={uiControlsValue}>
      <AudioControlsProvider value={audioControlsValue}>
        <VisualizationControlsProvider value={visualizationControlsValue}>
          <OrbitalSonificationPresenter
            needsUserInteraction={needsUserInteraction}
            handleUserInteraction={handleUserInteraction}
            onFrequencyChange={handleFrequencyChange}
          />
        </VisualizationControlsProvider>
      </AudioControlsProvider>
    </UIControlsProvider>
  );
};

export default OrbitalSonificationContainer;
