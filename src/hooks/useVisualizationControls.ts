import { useContext } from 'react';
import {
  VisualizationControlsContext,
  VisualizationControlsContextType
} from '../context/VisualizationControlsContext';

/**
 * Custom hook to consume VisualizationControlsContext
 * Provides access to visualization and planet-related controls
 */
export function useVisualizationControls(): VisualizationControlsContextType {
  const context = useContext(VisualizationControlsContext);

  if (!context) {
    throw new Error('useVisualizationControls must be used within VisualizationControlsProvider');
  }

  return context;
}
