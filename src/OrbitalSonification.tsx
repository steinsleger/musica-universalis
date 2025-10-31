// src/OrbitalSonification.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import PlanetarySystem from './PlanetarySystem';
import InfoModal from './components/InfoModal';
import InstructionsModal from './components/InstructionsModal';
import SidebarContent from './components/SidebarContent';
import FloatingControlsBar from './components/FloatingControlsBar';
import { AudioConfigProvider, useAudioConfig } from './context/AudioConfigContext';
import { OrbitStateProvider, useOrbitState } from './context/OrbitStateContext';
import { useAudioContext } from './hooks/useAudioContext';
import { useSynthManager } from './hooks/useSynthManager';
import { useFrequencyCalculation } from './hooks/useFrequencyCalculation';
import {
  calculateFrequencyGain,
  safelyTriggerNote,
  calculateAdvancedFrequencyGain,
  getHumanHearingSensitivity
} from './utils/audioScaling';
import {
  Planet,
  CurrentFrequencies,
  PositionMode,
  TabType,
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
  const { needsUserInteraction, startAudio, audioContextReady } = useAudioContext();
  const { calculateFrequency, calculateAllFrequencies, frequencyToNote: hookFrequencyToNote } = useFrequencyCalculation();

  // Local state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [liveMode, setLiveMode] = useState<boolean>(false);
  const [currentFrequencies, setCurrentFrequencies] = useState<CurrentFrequencies>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('controls');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState<boolean>(false);
  const [loopSequence, setLoopSequence] = useState<boolean>(false);
  const [currentlyPlayingPlanet, setCurrentlyPlayingPlanet] = useState<string | null>(null);
  const reverbAmount: number = 0.5;

  const audioContextStarted = useRef<boolean>(false);
  const gainNodeRef = useRef<Tone.Gain | null>(null);
  const initFrequenciesRef = useRef<boolean>(false);
  const synthsRef = useRef<Record<string, SynthObject>>({});
  const mainSynthRef = useRef<Tone.PolySynth<Tone.Synth> | null>(null);
  const lastFrequenciesRef = useRef<CurrentFrequencies>({});
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debug = useRef<boolean>(true);
  const activeSynthsRef = useRef<Set<string>>(new Set());
  const audioInitializedRef = useRef<boolean>(false);
  const prevPositionMode = useRef<PositionMode>(positionMode);
  const gainNodesRef = useRef<Record<string, Tone.Gain>>({});
  const planetTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const reverbRef = useRef<Tone.Reverb | null>(null);

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

      Object.values(synthsRef.current).forEach(synthObj => {
        if (synthObj && synthObj.synth) {
          try {
            synthObj.synth.dispose();
          } catch {
            // Ignore disposal errors
          }
        }
        if (synthObj && synthObj.gain) {
          try {
            synthObj.gain.dispose();
          } catch {
            // Ignore disposal errors
          }
        }
      });

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

  useEffect(() => {
    if (!liveMode) return;

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
        if (Tone.context.state !== 'running') {
          try {
            await Tone.context.resume();
            debugAudio('Resumed audio context');
          } catch (resumeErr) {
            console.error('Failed to resume audio context:', resumeErr);
          }
        }

        if (!gainNodeRef.current || gainNodeRef.current.disposed) {
          debugAudio('Gain node is missing or disposed, recreating');
          await initializeAudioContext();
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
            debugAudio('EMERGENCY RECOVERY: Sound state mismatch detected');

            let recoverySucceeded = true;
            let planetsFixed = 0;

            for (const name of Array.from(activeSynthsRef.current)) {
              if (!enabledPlanetNames.has(name)) {
                try {
                  createIsolatedSynth(name);
                  const success = stopPlanetSound(name);
                  if (success) planetsFixed++;
                  else recoverySucceeded = false;
                } catch {
                  console.error(`Error stopping ${name} during recovery:`);
                  recoverySucceeded = false;
                }
              }
            }

            for (const planet of enabledPlanets) {
              if (!activeSynthsRef.current.has(planet.name) && currentFrequencies[planet.name]) {
                try {
                  createIsolatedSynth(planet.name);
                  await new Promise(resolve => setTimeout(resolve, 10));
                  const success = startPlanetSound(planet.name, currentFrequencies[planet.name]);
                  if (success) {
                    planetsFixed++;
                    debugAudio(`Recovery: Started sound for ${planet.name}`);
                  } else {
                    recoverySucceeded = false;
                  }
                } catch {
                  console.error(`Error starting ${planet.name} during recovery:`);
                  recoverySucceeded = false;
                }
              }
            }

            if (!recoverySucceeded && planetsFixed === 0) {
              debugAudio('Targeted recovery failed completely, attempting full audio system reset');
              await recreateAllAudio();
            } else {
              debugAudio(`Recovery fixed ${planetsFixed} planets`);
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
      } catch {
        console.error('Error in audio update interval:');

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

      Array.from(activeSynthsRef.current).forEach(planetName => {
        stopPlanetSound(planetName);
      });
    };
  }, [liveMode, distanceMode]);

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

    Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
      const planet = orbitData.find(p => p.name === planetName);
      if (planet && planet.enabled) {
        const synthObj = synthsRef.current[planetName];
        if (synthObj && synthObj.gain && freq) {
          const gain = useFletcher
            ? calculateAdvancedFrequencyGain(freq, audioScalingConfig)
            : calculateFrequencyGain(freq, audioScalingConfig);

          try {
            const now = Tone.now();
            synthObj.gain.gain.cancelScheduledValues(now);
            synthObj.gain.gain.setValueAtTime(synthObj.gain.gain.value, now);
            synthObj.gain.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);

            setTimeout(() => {
              try {
                synthObj.gain.gain.value = gain;
              } catch (directErr) {
                console.error('[CONFIG] Error in direct gain set:', directErr);
              }
            }, 60);
          } catch {
            console.error(`[CONFIG] Error updating gain for ${planetName}:`);

            try {
              synthObj.gain.gain.value = gain;
            } catch (directErr) {
              console.error('[CONFIG] Fallback direct gain set also failed:', directErr);
            }
          }
        }
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

  const playOrbitalSequence = async (): Promise<void> => {
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

        setIsPlaying(false);
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

      setIsPlaying(true);

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

          playOrbitalSequence();
        } else {
          setCurrentlyPlayingPlanet(null);

          planetTimeoutsRef.current.forEach(timeoutId => {
            clearTimeout(timeoutId);
          });
          planetTimeoutsRef.current = [];

          setIsPlaying(false);
          sequenceTimeoutRef.current = null;
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
      setIsPlaying(false);
    }
  };

  const startAudioContext = async (): Promise<boolean> => {
    if (!audioContextStarted.current) {
      try {
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }

        await Tone.start();
        audioContextStarted.current = true;

        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }

        return true;
      } catch (error) {
        console.error('Could not start AudioContext:', error);
        return false;
      }
    } else if (Tone.context.state !== 'running') {
      try {
        await Tone.context.resume();
        return true;
      } catch (error) {
        console.error('Could not resume AudioContext:', error);
        return false;
      }
    }
    return true;
  };

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

  const recreateAllAudio = async (): Promise<boolean> => {
    debugAudio('FULL AUDIO SYSTEM RESET');

    try {
      const activeList = Array.from(activeSynthsRef.current);
      for (const planetName of activeList) {
        try {
          stopPlanetSound(planetName);
        } catch {
          console.error(`Error stopping ${planetName} during reset:`);
        }
      }

      for (const [_name, synthObj] of Object.entries(synthsRef.current)) {
        try {
          if (synthObj && synthObj.synth) synthObj.synth.dispose();
          if (synthObj && synthObj.gain) synthObj.gain.dispose();
        } catch {
          // Ignore disposal errors
        }
      }

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
          forceRecalculateAllGains();
        }, 100);
      }

      return true;
    } catch {
      console.error('Failed to recreate audio system:');
      return false;
    }
  };

  const forceRecalculateAllGains = (): void => {
    Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
      const planet = orbitData.find(p => p.name === planetName);
      if (planet && planet.enabled) {
        const synthObj = synthsRef.current[planetName];
        if (synthObj && synthObj.gain && freq) {
          try {
            const gain = useFletcher
              ? calculateAdvancedFrequencyGain(freq, audioScalingConfig)
              : calculateFrequencyGain(freq, audioScalingConfig);

            try {
              synthObj.gain.gain.value = gain;

              const now = Tone.now();
              synthObj.gain.gain.cancelScheduledValues(now);
              synthObj.gain.gain.setValueAtTime(synthObj.gain.gain.value, now);
              synthObj.gain.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);
            } catch {
              console.error('[FORCE RECALC] Error setting gain:');
            }
          } catch {
            console.error('[FORCE RECALC] Error calculating gain:');
          }
        }
      }
    });
  };

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
        } catch {
          // Ignore disposal errors
        }
      }

      if (reverbRef.current) {
        try {
          reverbRef.current.dispose();
        } catch {
          // Ignore disposal errors
        }
      }

      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: reverbAmount
      }).toDestination();

      await reverb.generate();
      reverbRef.current = reverb;

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

  const togglePlanet = async (index: number, forceState: boolean | null = null): Promise<void> => {
    try {
      const newData = [...orbitData];
      const planet = newData[index];
      const wasEnabled = planet.enabled;

      const newEnabled = forceState !== null ? forceState : !wasEnabled;

      planet.enabled = newEnabled;
      setOrbitData(newData);

      debugAudio(`Toggling planet ${planet.name}, was ${wasEnabled ? 'enabled' : 'disabled'}, now ${newEnabled ? 'enabled' : 'disabled'}`);

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
  };

  const toggleAllPlanets = async (enable: boolean): Promise<void> => {
    try {
      await Promise.all(orbitData.map((_, index) => togglePlanet(index, enable)));
    } catch (error) {
      console.error('Error toggling all planets:', error);
    }
  };

  const toggleLiveMode = async (): Promise<void> => {
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
  };

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSequenceBPM(parseInt(e.target.value, 10));
  };

  const toggleLoopSequence = (): void => {
    setLoopSequence(!loopSequence);
  };

  const volumeToDb = (volume: number): string => {
    if (volume <= 0.01) return '-∞';
    return Tone.gainToDb(volume).toFixed(1);
  };

  const toggleSidebar = (): void => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getPlanetColor = (name: string): string => {
    const planetColors: Record<string, string> = {
      'Mercury': '#A9A9A9',
      'Venus': '#E6D3A3',
      'Earth': '#1E90FF',
      'Mars': '#CD5C5C',
      'Ceres': '#8B8B83',
      'Jupiter': '#E59866',
      'Saturn': '#F4D03F',
      'Uranus': '#73C6B6',
      'Neptune': '#5DADE2',
      'Pluto': '#C39BD3'
    };

    return planetColors[name] || '#999';
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

  const debugAudio = (message: string, obj: unknown = null): void => {
    if (debug.current) {
      if (obj) {
        console.log(`[AUDIO DEBUG] ${message}`, obj);
      } else {
        console.log(`[AUDIO DEBUG] ${message}`);
      }
    }
  };

  const createIsolatedSynth = (planetName: string): SynthObject | null => {
    try {
      if (synthsRef.current[planetName]) {
        try {
          if (activeSynthsRef.current.has(planetName)) {
            synthsRef.current[planetName].synth.triggerRelease();
            activeSynthsRef.current.delete(planetName);
          }
          synthsRef.current[planetName].synth.dispose();
          if (synthsRef.current[planetName].gain) {
            synthsRef.current[planetName].gain.dispose();
          }
        } catch {
          debugAudio(`Error cleaning up old synth for ${planetName}`);
        }
      }

      let initialGain = 1.0;

      if (currentFrequencies[planetName]) {
        try {
          const frequency = currentFrequencies[planetName];

          initialGain = useFletcher
            ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
            : calculateFrequencyGain(frequency, audioScalingConfig);
        } catch {
          console.error('[CREATE SYNTH] Error pre-calculating gain:');
        }
      }

      const planetGain = new Tone.Gain(initialGain);

      const newSynth = new Tone.Synth({
        envelope: {
          attack: 0.05,
          decay: 0.1,
          sustain: 0.4,
          release: 1.2
        },
        oscillator: {
          type: 'sine'
        }
      });

      newSynth.connect(planetGain);

      if (reverbRef.current && !reverbRef.current.disposed) {
        planetGain.connect(reverbRef.current);
      } else {
        planetGain.toDestination();
      }

      synthsRef.current[planetName] = {
        synth: newSynth,
        gain: planetGain
      };

      gainNodesRef.current[planetName] = planetGain;

      return synthsRef.current[planetName];
    } catch {
      console.error(`Failed to create isolated synth for ${planetName}:`);
      return null;
    }
  };

  const startPlanetSound = (planetName: string, frequency: number): boolean => {
    try {
      if (activeSynthsRef.current.has(planetName)) {
        updatePlanetFrequency(planetName, frequency);
        return true;
      }

      let synthObj: SynthObject | null = synthsRef.current[planetName];
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
        synthObj = createIsolatedSynth(planetName);
        if (!synthObj || !synthObj.synth) return false;
      }

      let gain: number;
      try {
        gain = useFletcher
          ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
          : calculateFrequencyGain(frequency, audioScalingConfig);
      } catch {
        console.error(`[ERROR] Failed to calculate gain for ${planetName}:`);
        gain = 0.5;
      }

      if (synthObj.gain) {
        synthObj.gain.gain.value = gain;

        gainNodesRef.current[planetName] = synthObj.gain;
      }

      safelyTriggerNote(
        synthObj.synth,
        frequency,
        0.7,
        null,
        synthObj.gain,
        audioScalingConfig
      );

      activeSynthsRef.current.add(planetName);
      return true;
    } catch {
      console.error(`Failed to start sound for ${planetName}:`);
      return false;
    }
  };

  const stopPlanetSound = (planetName: string): boolean => {
    try {
      const synthObj = synthsRef.current[planetName];
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
        activeSynthsRef.current.delete(planetName);
        return true;
      }

      try {
        synthObj.synth.triggerRelease();
      } catch (releaseErr) {
        console.error(`Error releasing synth for ${planetName}:`, releaseErr);
        createIsolatedSynth(planetName);
      }

      activeSynthsRef.current.delete(planetName);
      return true;
    } catch {
      console.error(`Failed to stop sound for ${planetName}:`);
      activeSynthsRef.current.delete(planetName);

      try {
        createIsolatedSynth(planetName);
      } catch (recreateErr) {
        console.error(`Failed to recreate synth for ${planetName}:`, recreateErr);
      }

      return false;
    }
  };

  const updatePlanetFrequency = (planetName: string, frequency: number): boolean => {
    try {
      const synthObj = synthsRef.current[planetName];
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) return false;

      const currentFreq = Number(synthObj.synth.frequency.value);
      const freqDiff = Math.abs(currentFreq - frequency);
      const freqRatio = frequency / currentFreq;

      if (freqDiff > 1 || freqRatio < 0.98 || freqRatio > 1.02) {
        if (debug.current && Math.random() < 0.01) {
          debugAudio(`${planetName} freq change: ${currentFreq.toFixed(2)} → ${frequency.toFixed(2)} Hz`);
        }

        const gain = getAdjustedGain(frequency);

        synthObj.synth.frequency.value = frequency;

        if (synthObj.gain) {
          try {
            const now = Tone.now();
            synthObj.gain.gain.cancelScheduledValues(now);
            synthObj.gain.gain.setValueAtTime(synthObj.gain.gain.value, now);
            synthObj.gain.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);

            setTimeout(() => {
              try {
                synthObj.gain.gain.value = gain;
              } catch (directErr) {
                console.error('[UPDATE FREQ] Error in direct gain set:', directErr);
              }
            }, 60);
          } catch {
            console.error('[UPDATE FREQ] Error updating gain:');

            try {
              synthObj.gain.gain.value = gain;
            } catch (directErr) {
              console.error('[UPDATE FREQ] Fallback direct gain set also failed:', directErr);
            }
          }
        }
      }

      return true;
    } catch {
      console.error(`Error updating frequency for ${planetName}:`);
      const wasActive = activeSynthsRef.current.has(planetName);
      if (wasActive) {
        stopPlanetSound(planetName);
        const synthObj = createIsolatedSynth(planetName);
        if (synthObj && synthObj.synth) {
          startPlanetSound(planetName, frequency);
        }
      }
      return false;
    }
  };

  const updateMasterVolume = (newVolume: number): boolean => {
    debugAudio(`Updating master volume to ${newVolume}`);

    try {
      Tone.Destination.volume.value = Tone.gainToDb(newVolume);

      Object.entries(synthsRef.current).forEach(([name, synthObj]) => {
        if (synthObj && synthObj.gain && !synthObj.gain.disposed) {
          try {
            synthObj.gain.gain.value = newVolume;
          } catch {
            debugAudio(`Failed to update gain for ${name}`);
          }
        }
      });

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

  const _getFrequencyGain = (planetName: string): string => {
    const freq = currentFrequencies[planetName];
    if (!freq) return 'N/A';

    const gain = getAdjustedGain(freq);
    return gain.toFixed(2);
  };

  const _getHearingSensitivity = (planetName: string): string => {
    const freq = currentFrequencies[planetName];
    if (!freq) return 'N/A';

    const sensitivity = getHumanHearingSensitivity(freq);
    return (sensitivity * 100).toFixed(0) + '%';
  };

  const getAdjustedGain = useCallback((frequency: number): number => {
    if (!frequency) return 1.0;

    try {
      const result = useFletcher
        ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
        : calculateFrequencyGain(frequency, audioScalingConfig);

      return result;
    } catch {
      console.error('[ERROR getAdjustedGain] Error calculating gain:');
      return 1.0;
    }
  }, [useFletcher, audioScalingConfig]);

  const toggleFletcherCurves = useCallback((): void => {
    const newValue = !useFletcher;

    if (liveMode) {
      Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
        const planet = orbitData.find(p => p.name === planetName);
        if (planet && planet.enabled) {
          const synthObj = synthsRef.current[planetName];
          if (synthObj && synthObj.gain && freq) {
            const gain = newValue
              ? calculateAdvancedFrequencyGain(freq, audioScalingConfig)
              : calculateFrequencyGain(freq, audioScalingConfig);

            try {
              const now = Tone.now();
              synthObj.gain.gain.cancelScheduledValues(now);
              synthObj.gain.gain.setValueAtTime(synthObj.gain.gain.value, now);
              synthObj.gain.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);

              setTimeout(() => {
                try {
                  synthObj.gain.gain.value = gain;
                } catch (directErr) {
                  console.error('[FLETCHER] Error in direct gain set:', directErr);
                }
              }, 60);
            } catch {
              console.error(`[FLETCHER] Error updating gain for ${planetName}:`);

              try {
                synthObj.gain.gain.value = gain;
              } catch (directErr) {
                console.error('[FLETCHER] Fallback direct gain set also failed:', directErr);
              }
            }
          }
        }
      });
    }

    setUseFletcher(newValue);
  }, [liveMode, orbitData, currentFrequencies, audioScalingConfig, useFletcher]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setSidebarCollapsed(true);
        setIsInfoModalOpen(false);
        setIsInstructionsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
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

        <SidebarContent
          sidebarCollapsed={sidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          masterVolume={masterVolume}
          handleVolumeChange={handleVolumeChange}
          baseFrequency={baseFrequency}
          handleBaseFrequencyChange={handleBaseFrequencyChange}
          distanceMode={distanceMode}
          handleDistanceModeChange={handleDistanceModeChange}
          zoomLevel={zoomLevel}
          handleZoomChange={handleZoomChange}
          animationSpeed={animationSpeed}
          setAnimationSpeed={setAnimationSpeed}
          isPlaying={isPlaying}
          playOrbitalSequence={playOrbitalSequence}
          loopSequence={loopSequence}
          toggleLoopSequence={toggleLoopSequence}
          sequenceBPM={sequenceBPM}
          handleBPMChange={handleBPMChange}
          liveMode={liveMode}
          orbitData={orbitData}
          toggleAllPlanets={toggleAllPlanets}
          togglePlanet={togglePlanet}
          currentFrequencies={currentFrequencies}
          distanceModeForDisplay={distanceMode}
          getPlanetColor={getPlanetColor}
          frequencyToNote={frequencyToNote}
          volumeToDb={volumeToDb}
          useFletcher={useFletcher}
          toggleFletcherCurves={toggleFletcherCurves}
          audioScalingConfig={audioScalingConfig}
          setAudioScalingConfig={setAudioScalingConfig}
          forceRecalculateAllGains={forceRecalculateAllGains}
        />
      </div>

      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <InstructionsModal isOpen={isInstructionsModalOpen} onClose={() => setIsInstructionsModalOpen(false)} />
    </div>
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
