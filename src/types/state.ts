/**
 * State Types - Application state shape
 *
 * Types that define the shape of application state
 */

import type { Planet, CurrentFrequencies, FrequencyMode, PositionMode } from './domain';
import type { TabType } from './ui';
import type { AudioHealthStatus, AudioScalingConfig } from './audio';

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
