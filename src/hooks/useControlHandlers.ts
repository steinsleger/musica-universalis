import { useCallback } from 'react';
import * as Tone from 'tone';
import { Planet, FrequencyMode, AudioScalingConfig, CurrentFrequencies, SynthObject } from '../utils/types';
import { SynthManager } from '../utils/synthManager';

interface UseControlHandlersParams {
  startAudioContext: () => Promise<boolean>;
  isPaused: boolean;
  setPositionMode: (mode: 'normal' | 'average' | 'aphelion' | 'perihelion') => void;
  setIsPaused: (paused: boolean) => void;
  setSequenceBPM: (bpm: number) => void;
  loopSequence: boolean;
  setLoopSequence: (loop: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDistanceMode: (mode: FrequencyMode) => void;
  liveMode: boolean;
  updateAllFrequencies: () => CurrentFrequencies;
  setZoomLevel: (zoom: number) => void;
  debugAudio: (message: string) => void;
  synthManagerRef: React.MutableRefObject<SynthManager>;
  setMasterVolume: (volume: number) => void;
  calculateBaseFrequencies: (baseFreq: number, planet: Planet, index: number) => number;
  orbitData: Planet[];
  activeSynthsRef: React.MutableRefObject<Set<string>>;
  updatePlanetFrequency: (planetName: string, frequency: number) => void;
  setCurrentFrequencies: (frequencies: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies)) => void;
  currentFrequencies: CurrentFrequencies;
  setBaseFrequency: (freq: number) => void;
  hookFrequencyToNote: (freq: number) => string;
  useFletcher: boolean;
  audioScalingConfig: AudioScalingConfig;
  setUseFletcher: (use: boolean) => void;
  synthsRef: React.MutableRefObject<Record<string, SynthObject>>;
  gainNodesRef: React.MutableRefObject<Record<string, Tone.Gain>>;
}

interface ControlHandlers {
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
}

export const useControlHandlers = ({
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
}: UseControlHandlersParams): ControlHandlers => {
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

  const toggleLoopSequence = useCallback((): void => {
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
      Tone.Destination.volume.value = Tone.gainToDb(newVolume);
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

  return {
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
  };
};
