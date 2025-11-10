import { useContext } from 'react';
import { UIControlsContext, UIControlsContextType } from '../context/UIControlsContext';

/**
 * Custom hook to consume UIControlsContext
 * Provides access to UI-only state: sidebar, tabs, and modals
 */
export function useUIControls(): UIControlsContextType {
  const context = useContext(UIControlsContext);

  if (!context) {
    throw new Error('useUIControls must be used within UIControlsProvider');
  }

  return context;
}
