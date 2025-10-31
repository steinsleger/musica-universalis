// src/OrbitalSonification.tsx
import React, { useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import PlanetarySystem from './PlanetarySystem';
import InfoModal from './components/InfoModal';
import InstructionsModal from './components/InstructionsModal';
import SidebarContent from './components/SidebarContent';
import FloatingControlsBar from './components/FloatingControlsBar';
import { AudioConfigProvider, useAudioConfig } from './context/AudioConfigContext';
import { OrbitStateProvider, useOrbitState } from './context/OrbitStateContext';
import { ControlsProvider } from './context/ControlsContext';
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
import { SynthManager } from './utils/synthManager';
import { volumeToDb, getPlanetColor } from './utils/visualizationHelpers';
import {
  Planet,
  CurrentFrequencies,
  PositionMode,
  FrequencyMode,
  SynthObject,
  AudioScalingConfig,
  getDefaultOrbitData,
  getDefaultAudioScalingConfig
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
  const reverbAmount: number = 0.5;

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
  const debugAudio = (message: string, obj: unknown = null): void => {
    if (debug.current) {
      if (obj) {
        console.log(`[AUDIO DEBUG] ${message}`, obj);
      } else {
        console.log(`[AUDIO DEBUG] ${message}`);
      }
    }
  };

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
    useFletcher,
    debugAudio
  });

  // Forward declare these for use in hooks
  const initializeAudioContext = async (): Promise<boolean> => {
    try {
      debugAudio('Initializing audio context');
      try {
        await Tone.start();
      } catch {
        debugAudio('Error starting Tone');
      }
      if (Tone.context.state !== 'running') {
        try {
          await Tone.context.resume();
          debugAudio('Resumed Tone context');
        } catch {
          debugAudio('Error resuming Tone context');
        }
      }
      debugAudio(`Tone context state: ${Tone.context.state}`);
      if (gainNodeRef.current) {
        try {
          gainNodeRef.current.dispose();
        } catch {}
      }
      if (reverbRef.current) {
        try {
          reverbRef.current.dispose();
        } catch {}
      }
      const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.5 }).toDestination();
      await reverb.generate();
      reverbRef.current = reverb;
      synthManagerRef.current.setReverbNode(reverb);
      try {
        const masterGain = new Tone.Gain(masterVolume).connect(reverb);
        gainNodeRef.current = masterGain;
        Tone.Destination.volume.value = Tone.gainToDb(masterVolume);
        audioContextStarted.current = true;
        return true;
      } catch {
        console.error('Error creating master gain node:');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  };

  const recreateAllAudio = async (): Promise<boolean> => {
    debugAudio('FULL AUDIO SYSTEM RESET');
    try {
      synthManagerRef.current.disposeAll();
      synthsRef.current = {};
      gainNodesRef.current = {};
      activeSynthsRef.current.clear();
      await new Promise(resolve => setTimeout(resolve, 50));
      try {
        await Tone.start();
        debugAudio('Tone restarted');
      } catch {
        debugAudio('Error restarting Tone');
      }
      try {
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
          debugAudio('Tone context resumed');
        }
      } catch {
        debugAudio('Error resuming Tone context');
      }
      for (const planet of orbitData) {
        try {
          createIsolatedSynth(planet.name);
        } catch {
          console.error(`Failed to create synth for ${planet.name} during reset:`);
        }
      }
      if (liveMode) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const enabledPlanets = orbitData.filter(planet => planet.enabled);
        let startedCount = 0;
        for (const planet of enabledPlanets) {
          try {
            if (currentFrequencies[planet.name]) {
              const success = startPlanetSound(planet.name, currentFrequencies[planet.name]);
              if (success) {
                startedCount++;
                debugAudio(`Successfully restarted sound for ${planet.name}`);
              }
            }
          } catch {
            console.error(`Failed to restart sound for ${planet.name}:`);
          }
        }
        debugAudio(`Restarted sounds for ${startedCount}/${enabledPlanets.length} planets`);
        if (enabledPlanets.length > 0 && startedCount === 0) {
          console.error('Failed to start any planet sounds during reset');
          return false;
        }
        setTimeout(() => {
          const enabledFrequencies: CurrentFrequencies = {};
          Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
            const planet = orbitData.find(p => p.name === planetName);
            if (planet && planet.enabled && freq) {
              enabledFrequencies[planetName] = freq;
            }
          });
          synthManagerRef.current.updateAllGains(enabledFrequencies, audioScalingConfig, useFletcher);
          Object.keys(enabledFrequencies).forEach(planetName => {
            const synthObj = synthManagerRef.current.getSynth(planetName);
            if (synthObj) {
              synthsRef.current[planetName] = synthObj;
              gainNodesRef.current[planetName] = synthObj.gain;
            }
          });
        }, 100);
      }
      return true;
    } catch {
      console.error('Failed to recreate audio system:');
      return false;
    }
  };

  const forceRecalculateAllGains = (): void => {
    const enabledFrequencies: CurrentFrequencies = {};
    Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
      const planet = orbitData.find(p => p.name === planetName);
      if (planet && planet.enabled && freq) {
        enabledFrequencies[planetName] = freq;
      }
    });

    synthManagerRef.current.updateAllGains(enabledFrequencies, audioScalingConfig, useFletcher);

    Object.keys(enabledFrequencies).forEach(planetName => {
      const synthObj = synthManagerRef.current.getSynth(planetName);
      if (synthObj) {
        synthsRef.current[planetName] = synthObj;
        gainNodesRef.current[planetName] = synthObj.gain;
      }
    });
  };

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
  }, [orbitData, baseFrequency, calculateBaseFrequencies]);

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
  }, [currentFrequencies, liveMode]);

  useEffect(() => {
    if (!audioInitializedRef.current) {
      initializeAudioContext().then(success => {
        if (success) {
          audioInitializedRef.current = true;
          debugAudio('Audio initialized on component load');
        } else {
          debugAudio('Failed to initialize audio on component load');
        }
      });
    }

    return () => {
      debugAudio('Component unmounting, cleaning up audio');

      // Use SynthManager to dispose all synths
      synthManagerRef.current.disposeAll();

      if (mainSynthRef.current) {
        try {
          mainSynthRef.current.dispose();
        } catch {
          // Ignore disposal errors
        }
      }

      if (gainNodeRef.current) {
        try {
          gainNodeRef.current.dispose();
        } catch {
          // Ignore disposal errors
        }
      }
    };
  }, []);

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
  }, [needsUserInteraction]);

  useEffect(() => {
    if (!initFrequenciesRef.current) {
      updateAllFrequencies();
      initFrequenciesRef.current = true;
    }
  }, [updateAllFrequencies]);

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
  }, [liveMode, isPaused, positionMode]);

  useEffect(() => {
    if (positionMode !== 'normal') {
      setPositionMode('normal');
    }
  }, [positionMode]);

  // Use live mode audio hook
  useLiveModeAudio({
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
    recreateAllAudio: async () => {
      await recreateAllAudio();
    },
    debugAudio
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

  useEffect(() => {
    if (liveMode && !isPaused) {
      const updatedFrequencies: CurrentFrequencies = {};
      orbitData.forEach((planet, index) => {
        if (planet.enabled) {
          const n = index - 2;
          const baseFreq = calculateBaseFrequencies(baseFrequency, planet, n);
          updatedFrequencies[planet.name] = baseFreq;
        }
      });

      setCurrentFrequencies(prevFreqs => ({
        ...prevFreqs,
        ...updatedFrequencies
      }));
    }
  }, [baseFrequency, liveMode, isPaused, orbitData, calculateBaseFrequencies]);

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

  useEffect(() => {
    if (!liveMode) return;

    window.lastAudioUpdate = Date.now();

    const enabledFrequencies: CurrentFrequencies = {};
    Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
      const planet = orbitData.find(p => p.name === planetName);
      if (planet && planet.enabled && freq) {
        enabledFrequencies[planetName] = freq;
      }
    });

    synthManagerRef.current.updateAllGains(enabledFrequencies, audioScalingConfig, useFletcher);

    // Sync old refs for backward compatibility
    Object.keys(enabledFrequencies).forEach(planetName => {
      const synthObj = synthManagerRef.current.getSynth(planetName);
      if (synthObj) {
        synthsRef.current[planetName] = synthObj;
        gainNodesRef.current[planetName] = synthObj.gain;
      }
    });
  }, [
    useFletcher,
    audioScalingConfig.referenceFrequency,
    audioScalingConfig.scalingFactor,
    liveMode,
    orbitData,
    currentFrequencies
  ]);

  const handleUserInteraction = async (): Promise<void> => {
    if (needsUserInteraction) {
      try {
        const started = await startAudioContext();
        if (!started) {
          console.error('Failed to start audio context on user interaction');
        }
      } catch (error) {
        console.error('Error initializing audio on user interaction:', error);
      }
    }
  };

  const togglePlayPause = async (): Promise<void> => {
    await startAudioContext();
    if (isPaused) {
      setPositionMode('normal');
    }
    setIsPaused(!isPaused);
  };

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSequenceBPM(parseInt(e.target.value, 10));
  };

  const toggleLoopSequence = (): void => {
    setLoopSequence(!loopSequence);
  };

  const toggleSidebar = (): void => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleDistanceModeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newMode = e.target.value as FrequencyMode;
    setDistanceMode(newMode);

    if (liveMode) {
      updateAllFrequencies();
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setZoomLevel(parseFloat(e.target.value));
  };

  const updateMasterVolume = (newVolume: number): boolean => {
    debugAudio(`Updating master volume to ${newVolume}`);

    try {
      Tone.Destination.volume.value = Tone.gainToDb(newVolume);
      synthManagerRef.current.setMasterVolume(newVolume);
      return true;
    } catch {
      console.error('Failed to update master volume:');
      return false;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newVolume = parseFloat(e.target.value);
    setMasterVolume(newVolume);
    updateMasterVolume(newVolume);
  };

  const handleBaseFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newBaseFrequency = parseFloat(e.target.value);
    setBaseFrequency(newBaseFrequency);

    const recalculatedFrequencies: CurrentFrequencies = {};
    orbitData.forEach((planet, index) => {
      if (planet.enabled) {
        const _n = index - 2;
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
  };

  const frequencyToNote = (frequency: number | undefined): string => {
    return frequency ? hookFrequencyToNote(frequency) : '';
  };

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

      // Sync old refs for backward compatibility
      Object.keys(enabledFrequencies).forEach(planetName => {
        const synthObj = synthManagerRef.current.getSynth(planetName);
        if (synthObj) {
          synthsRef.current[planetName] = synthObj;
          gainNodesRef.current[planetName] = synthObj.gain;
        }
      });
    }

    setUseFletcher(newValue);
  }, [liveMode, orbitData, currentFrequencies, audioScalingConfig]);


  const controlsValue = {
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
    isPaused,
    positionMode
  };

  return (
    <ControlsProvider value={controlsValue}>
      <div
        className="container"
        onClick={needsUserInteraction ? handleUserInteraction : undefined}
      >
        <div className="visualization-container">
          <div className="orbital-display">
            <PlanetarySystem
              animationSpeed={animationSpeed}
              baseFrequency={baseFrequency}
              distanceMode={distanceMode}
              isPaused={isPaused}
              onFrequencyChange={handleFrequencyChange}
              orbitData={orbitData}
              setToAverageDistance={positionMode === 'average'}
              setToAphelion={positionMode === 'aphelion'}
              setToPerihelion={positionMode === 'perihelion'}
              setZoomLevel={setZoomLevel}
              zoomLevel={zoomLevel}
              currentlyPlayingPlanet={currentlyPlayingPlanet}
              sequenceBPM={sequenceBPM}
            />
          </div>

          <FloatingControlsBar
            isPaused={isPaused}
            onPlayPauseClick={togglePlayPause}
            isPlaying={isPlaying}
            liveMode={liveMode}
            onPlaySequenceClick={playOrbitalSequence}
            onLiveModeToggle={toggleLiveMode}
            positionMode={positionMode}
            onPositionModeChange={setPositionMode}
            isInfoModalOpen={isInfoModalOpen}
            onInfoClick={() => setIsInfoModalOpen(!isInfoModalOpen)}
            isInstructionsModalOpen={isInstructionsModalOpen}
            onInstructionsClick={() => setIsInstructionsModalOpen(!isInstructionsModalOpen)}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={toggleSidebar}
          />

          <SidebarContent />
        </div>

        <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        <InstructionsModal isOpen={isInstructionsModalOpen} onClose={() => setIsInstructionsModalOpen(false)} />
      </div>
    </ControlsProvider>
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
