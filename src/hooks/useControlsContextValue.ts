import { useMemo } from 'react';
import { CurrentFrequencies, PositionMode, AudioScalingConfig, FrequencyMode, TabType } from '../utils/types';

interface ControlsContextValueParams {
  masterVolume: number;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  baseFrequency: number;
  handleBaseFrequencyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sequenceBPM: number;
  handleBPMChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  useFletcher: boolean;
  toggleFletcherCurves: () => void;
  audioScalingConfig: AudioScalingConfig;
  setAudioScalingConfig: (config: AudioScalingConfig) => void;
  forceRecalculateAllGains: () => void;
  distanceMode: FrequencyMode;
  handleDistanceModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  zoomLevel: number;
  handleZoomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playOrbitalSequence: () => Promise<void>;
  loopSequence: boolean;
  toggleLoopSequence: () => void;
  liveMode: boolean;
  toggleLiveMode: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  orbitData: any[];
  togglePlanet: (index: number, forceState?: boolean | null) => Promise<void>;
  toggleAllPlanets: (enable: boolean) => Promise<void>;
  currentFrequencies: CurrentFrequencies;
  frequencyToNote: (frequency: number | undefined) => string;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  isInstructionsModalOpen: boolean;
  setIsInstructionsModalOpen: (open: boolean) => void;
  isPaused: boolean;
  positionMode: PositionMode;
  setPositionMode: (mode: PositionMode) => void;
}

export const useControlsContextValue = (params: ControlsContextValueParams) => {
  return useMemo(() => ({
    masterVolume: params.masterVolume,
    handleVolumeChange: params.handleVolumeChange,
    baseFrequency: params.baseFrequency,
    handleBaseFrequencyChange: params.handleBaseFrequencyChange,
    sequenceBPM: params.sequenceBPM,
    handleBPMChange: params.handleBPMChange,
    useFletcher: params.useFletcher,
    toggleFletcherCurves: params.toggleFletcherCurves,
    audioScalingConfig: params.audioScalingConfig,
    setAudioScalingConfig: params.setAudioScalingConfig,
    forceRecalculateAllGains: params.forceRecalculateAllGains,
    distanceMode: params.distanceMode,
    handleDistanceModeChange: params.handleDistanceModeChange,
    zoomLevel: params.zoomLevel,
    handleZoomChange: params.handleZoomChange,
    animationSpeed: params.animationSpeed,
    setAnimationSpeed: params.setAnimationSpeed,
    isPlaying: params.isPlaying,
    setIsPlaying: params.setIsPlaying,
    playOrbitalSequence: params.playOrbitalSequence,
    loopSequence: params.loopSequence,
    toggleLoopSequence: params.toggleLoopSequence,
    liveMode: params.liveMode,
    toggleLiveMode: params.toggleLiveMode,
    togglePlayPause: params.togglePlayPause,
    orbitData: params.orbitData,
    togglePlanet: params.togglePlanet,
    toggleAllPlanets: params.toggleAllPlanets,
    currentFrequencies: params.currentFrequencies,
    frequencyToNote: params.frequencyToNote,
    sidebarCollapsed: params.sidebarCollapsed,
    toggleSidebar: params.toggleSidebar,
    activeTab: params.activeTab,
    setActiveTab: params.setActiveTab,
    isInfoModalOpen: params.isInfoModalOpen,
    setIsInfoModalOpen: params.setIsInfoModalOpen,
    isInstructionsModalOpen: params.isInstructionsModalOpen,
    setIsInstructionsModalOpen: params.setIsInstructionsModalOpen,
    isPaused: params.isPaused,
    positionMode: params.positionMode,
    setPositionMode: params.setPositionMode
  }), [
    params.masterVolume,
    params.handleVolumeChange,
    params.baseFrequency,
    params.handleBaseFrequencyChange,
    params.sequenceBPM,
    params.handleBPMChange,
    params.useFletcher,
    params.toggleFletcherCurves,
    params.audioScalingConfig,
    params.setAudioScalingConfig,
    params.forceRecalculateAllGains,
    params.distanceMode,
    params.handleDistanceModeChange,
    params.zoomLevel,
    params.handleZoomChange,
    params.animationSpeed,
    params.setAnimationSpeed,
    params.isPlaying,
    params.setIsPlaying,
    params.playOrbitalSequence,
    params.loopSequence,
    params.toggleLoopSequence,
    params.liveMode,
    params.toggleLiveMode,
    params.togglePlayPause,
    params.orbitData,
    params.togglePlanet,
    params.toggleAllPlanets,
    params.currentFrequencies,
    params.frequencyToNote,
    params.sidebarCollapsed,
    params.toggleSidebar,
    params.activeTab,
    params.setActiveTab,
    params.isInfoModalOpen,
    params.setIsInfoModalOpen,
    params.isInstructionsModalOpen,
    params.setIsInstructionsModalOpen,
    params.isPaused,
    params.positionMode,
    params.setPositionMode
  ]);
};
