import { useContext } from 'react';
import { AudioControlsContext, AudioControlsContextType } from '../context/AudioControlsContext';

/**
 * Custom hook to consume AudioControlsContext
 * Provides access to audio configuration and playback controls
 */
export function useAudioControls(): AudioControlsContextType {
  const context = useContext(AudioControlsContext);

  if (!context) {
    throw new Error('useAudioControls must be used within AudioControlsProvider');
  }

  return context;
}
