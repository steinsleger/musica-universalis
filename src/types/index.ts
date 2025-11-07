/**
 * Types Index - Central export point for all types
 *
 * Organized by concern:
 * - Domain types (core business logic)
 * - State types (application state)
 */

export type {
  Planet,
  CurrentFrequencies,
  FrequencyMode,
  PositionMode,
  TabType,
  AudioScalingConfig,
  SynthObject,
  AudioHealthStatus,
  PlanetName
} from './domain';

export type {
  OrbitalState,
  AudioState,
  UIState,
  AudioConfig,
  CombinedOrbitalState
} from './state';
