/**
 * State Types - Application state shape
 *
 * Types that define the shape of application state
 */

import type { Planet, CurrentFrequencies, FrequencyMode, PositionMode, TabType, AudioHealthStatus } from './domain';

/**
 * Orbital/Animation state
 */
export interface OrbitalState {
  orbitData: Planet[];
  animationSpeed: number;
  isPaused: boolean;
  distanceMode: FrequencyMode;
  positionMode: PositionMode;
  zoomLevel: number;
}

/**
 * Audio state
 */
export interface AudioState {
  currentFrequencies: CurrentFrequencies;
  isPlaying: boolean;
  liveMode: boolean;
  loopSequence: boolean;
  currentlyPlayingPlanet: string | undefined;
  audioError: string | null;
  audioHealthStatus: AudioHealthStatus;
}

/**
 * UI state
 */
export interface UIState {
  sidebarCollapsed: boolean;
  activeTab: TabType;
  isInfoModalOpen: boolean;
  isInstructionsModalOpen: boolean;
}

/**
 * Audio configuration (separate from state, more persistent)
 */
export interface AudioConfig {
  baseFrequency: number;
  masterVolume: number;
  sequenceBPM: number;
  useFletcher: boolean;
  audioScalingConfig: AudioScalingConfig;
}

/**
 * Combined orbital state (merged from multiple contexts)
 */
export interface CombinedOrbitalState extends OrbitalState, AudioState, UIState {}

/**
 * Audio scaling configuration
 */
export interface AudioScalingConfig {
  referenceFrequency?: number;
  baseGain?: number;
  peakFrequency?: number;
  highFrequencyCutoff?: number;
  minGain?: number;
  maxGain?: number;
}
