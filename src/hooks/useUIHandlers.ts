import React from 'react';
import * as Tone from 'tone';
import { useUIState } from './useUIState';
import { useModals } from './useModals';
import { useControlHandlers } from './useControlHandlers';
import { useToggleControls } from './useToggleControls';
import { usePositionTracker } from './usePositionTracker';
import type { Planet, FrequencyMode, AudioScalingConfig, CurrentFrequencies, SynthObject, PositionMode } from '../types/domain';
import type { SynthManager } from '../utils/synthManager';

/**
 * Parameters for useUIHandlers hook
 * Consolidates all parameters needed for UI state and event handling
 */
interface UseUIHandlersParams {
  // Audio context and control
  startAudioContext: () => Promise<boolean>;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  setPositionMode: (mode: PositionMode) => void;
  positionMode: PositionMode;

  // Sequence playback controls
  setSequenceBPM: (bpm: number) => void;
  loopSequence: boolean;
  setLoopSequence: (loop: boolean) => void;

  // Live mode controls
  liveMode: boolean;
  setLiveMode: (mode: boolean) => void;

  // Frequency controls
  setDistanceMode: (mode: FrequencyMode) => void;
  setBaseFrequency: (freq: number) => void;
  setMasterVolume: (volume: number) => void;

  // Zoom and visualization
  setZoomLevel: (zoom: number) => void;

  // Fletcher-Munson curves
  useFletcher: boolean;
  setUseFletcher: (use: boolean) => void;

  // Audio scaling and configuration
  audioScalingConfig: AudioScalingConfig;
  setAudioScalingConfig: (config: AudioScalingConfig) => void;

  // Orbital and planet data
  orbitData: Planet[];
  setOrbitData: (data: Planet[]) => void;
  currentFrequencies: CurrentFrequencies;
  setCurrentFrequencies: (frequencies: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies)) => void;

  // Audio functions and references
  updateAllFrequencies: () => CurrentFrequencies;
  calculateBaseFrequencies: (baseFreq: number, planet: Planet, index: number) => number;
  updatePlanetFrequency: (planetName: string, frequency: number) => void;
  createIsolatedSynth: (planetName: string) => SynthObject | null;
  startPlanetSound: (planetName: string, frequency: number) => boolean;
  stopPlanetSound: (planetName: string) => boolean;
  initializeAudioContext: () => Promise<boolean>;
  recreateAllAudio: () => Promise<boolean>;
  forceRecalculateAllGains: () => void;

  // Refs
  synthManagerRef: React.MutableRefObject<SynthManager>;
  activeSynthsRef: React.MutableRefObject<Set<string>>;
  synthsRef: React.MutableRefObject<Record<string, SynthObject>>;
  gainNodesRef: React.MutableRefObject<Record<string, Tone.Gain>>;

  // Utilities
  debugAudio: (message: string) => void;
  hookFrequencyToNote: (freq: number) => string;
}

/**
 * Return type for useUIHandlers
 * Consolidated UI state and event handlers
 */
export interface UIHandlers {
  // UI state
  sidebarCollapsed: boolean;
  activeTab: 'controls' | 'planets' | 'audio';
  isInfoModalOpen: boolean;
  isInstructionsModalOpen: boolean;

  // UI state setters
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: 'controls' | 'planets' | 'audio') => void;
  setIsInfoModalOpen: (open: boolean) => void;
  setIsInstructionsModalOpen: (open: boolean) => void;

  // Control handlers
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

  // Toggle handlers
  togglePlanet: (index: number, forceState?: boolean) => void;
  toggleAllPlanets: (enable: boolean) => void;
  toggleLiveMode: () => Promise<void>;

  // Position tracking
  hasPositionModeChanged: () => boolean;
  recordCurrentMode: (mode: PositionMode) => void;
}

/**
 * useUIHandlers
 *
 * Consolidates 6 UI-related hooks into a single, comprehensive hook:
 * - useUIState: sidebar/tab state management
 * - useModals: modal visibility state management
 * - useControlHandlers: UI event handlers (play/pause, BPM, volume, etc.)
 * - useToggleControls: planet/live-mode toggle handlers
 * - usePositionTracker: orbital position mode tracking
 *
 * This reduces hook complexity in the container and provides a single,
 * focused interface for all UI-related state and event handling.
 *
 * @param params - All parameters needed for UI state and event handling
 * @returns Consolidated UI handlers and state
 */
export const useUIHandlers = (params: UseUIHandlersParams): UIHandlers => {
  // Core UI state management
  const { sidebarCollapsed, setSidebarCollapsed, activeTab, setActiveTab } = useUIState();

  // Modal management
  const {
    isInfoModalOpen,
    setIsInfoModalOpen,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen
  } = useModals({
    onEscapePressed: () => setSidebarCollapsed(true)
  });

  // Position tracking
  const { hasPositionModeChanged, recordCurrentMode } = usePositionTracker(params.positionMode);

  // Control handlers (play/pause, BPM, volume, frequency, etc.)
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
    startAudioContext: params.startAudioContext,
    isPaused: params.isPaused,
    setPositionMode: params.setPositionMode,
    setIsPaused: params.setIsPaused,
    setSequenceBPM: params.setSequenceBPM,
    loopSequence: params.loopSequence,
    setLoopSequence: params.setLoopSequence,
    sidebarCollapsed,
    setSidebarCollapsed,
    setDistanceMode: params.setDistanceMode,
    liveMode: params.liveMode,
    updateAllFrequencies: params.updateAllFrequencies,
    setZoomLevel: params.setZoomLevel,
    debugAudio: params.debugAudio,
    synthManagerRef: params.synthManagerRef,
    setMasterVolume: params.setMasterVolume,
    calculateBaseFrequencies: params.calculateBaseFrequencies,
    orbitData: params.orbitData,
    activeSynthsRef: params.activeSynthsRef,
    updatePlanetFrequency: params.updatePlanetFrequency,
    setCurrentFrequencies: params.setCurrentFrequencies,
    currentFrequencies: params.currentFrequencies,
    setBaseFrequency: params.setBaseFrequency,
    hookFrequencyToNote: params.hookFrequencyToNote,
    useFletcher: params.useFletcher,
    audioScalingConfig: params.audioScalingConfig,
    setUseFletcher: params.setUseFletcher,
    synthsRef: params.synthsRef,
    gainNodesRef: params.gainNodesRef
  });

  // Toggle handlers (planet enable/disable, live mode toggle)
  const { togglePlanet, toggleAllPlanets, toggleLiveMode } = useToggleControls({
    orbitData: params.orbitData,
    setOrbitData: params.setOrbitData,
    liveMode: params.liveMode,
    setLiveMode: params.setLiveMode,
    currentFrequencies: params.currentFrequencies,
    activeSynthsRef: params.activeSynthsRef,
    createIsolatedSynth: params.createIsolatedSynth,
    startPlanetSound: params.startPlanetSound,
    stopPlanetSound: params.stopPlanetSound,
    initializeAudioContext: params.initializeAudioContext,
    recreateAllAudio: params.recreateAllAudio,
    forceRecalculateAllGains: params.forceRecalculateAllGains,
    debugAudio: params.debugAudio
  });

  return {
    // UI state
    sidebarCollapsed,
    activeTab,
    isInfoModalOpen,
    isInstructionsModalOpen,

    // UI state setters
    setSidebarCollapsed,
    setActiveTab,
    setIsInfoModalOpen,
    setIsInstructionsModalOpen,

    // Control handlers
    togglePlayPause,
    handleBPMChange,
    toggleLoopSequence,
    toggleSidebar,
    handleDistanceModeChange,
    handleZoomChange,
    handleVolumeChange,
    handleBaseFrequencyChange,
    frequencyToNote,
    toggleFletcherCurves,

    // Toggle handlers
    togglePlanet,
    toggleAllPlanets,
    toggleLiveMode,

    // Position tracking
    hasPositionModeChanged,
    recordCurrentMode
  };
};
