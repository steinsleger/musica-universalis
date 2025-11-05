import { useContext } from 'react';
import { AudioConfigContext } from '../context/AudioConfigContext';
import type { AudioConfigContextType } from '../context/AudioConfigContext';

export const useAudioConfig = (): AudioConfigContextType => {
  const context = useContext(AudioConfigContext);
  if (!context) {
    throw new Error('useAudioConfig must be used within AudioConfigProvider');
  }
  return context;
};
