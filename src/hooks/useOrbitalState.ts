import { useContext, useCallback } from 'react';
import { OrbitalStateContext } from '../context/OrbitalStateContext';
import { Planet, FrequencyMode, PositionMode } from '../types/domain';

interface FlatOrbitalState {
  // Orbital State
  orbitData: Planet[];
  setOrbitData: (data: Planet[]) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  distanceMode: FrequencyMode;
  setDistanceMode: (mode: FrequencyMode) => void;
  positionMode: PositionMode;
  setPositionMode: (mode: PositionMode) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
}

/**
 * Hook to consume OrbitalStateContext
 * Provides access to merged orbital, audio, and UI state
 * Returns a flattened interface for easier consumption
 * Consolidated from: OrbitStateContext, AudioControlsContext, UIControlsContext, VisualizationControlsContext
 */
export const useOrbitalState = (): FlatOrbitalState => {
  const context = useContext(OrbitalStateContext);

  if (!context) {
    throw new Error('useOrbitalState must be used within OrbitalStateProvider');
  }

  // Create setIsPaused wrapper around togglePause
  const setIsPaused = useCallback((paused: boolean) => {
    if (paused !== context.state.isPaused) {
      context.dispatch({ type: 'TOGGLE_PAUSE' });
    }
  }, [context]);

  return {
    orbitData: context.state.orbitData,
    setOrbitData: context.setOrbitData,
    animationSpeed: context.state.animationSpeed,
    setAnimationSpeed: context.setAnimationSpeed,
    isPaused: context.state.isPaused,
    setIsPaused,
    distanceMode: context.state.distanceMode,
    setDistanceMode: context.setDistanceMode,
    positionMode: context.state.positionMode,
    setPositionMode: context.setPositionMode,
    zoomLevel: context.state.zoomLevel,
    setZoomLevel: context.setZoomLevel
  };
};
