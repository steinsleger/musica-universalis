import { useContext } from 'react';
import { OrbitalStateContext, OrbitalStateContextType } from '../context/OrbitalStateContext';

/**
 * Hook to consume OrbitalStateContext
 * Provides access to merged orbital, audio, and UI state
 * Consolidated from: OrbitStateContext, AudioControlsContext, UIControlsContext, VisualizationControlsContext
 */
export const useOrbitalState = (): OrbitalStateContextType => {
  const context = useContext(OrbitalStateContext);

  if (!context) {
    throw new Error('useOrbitalState must be used within OrbitalStateProvider');
  }

  return context;
};
