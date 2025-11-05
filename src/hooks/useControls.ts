import { useContext } from 'react';
import { ControlsContext, ControlsContextType } from '../context/ControlsContext';

export const useControls = (): ControlsContextType => {
  const context = useContext(ControlsContext);
  if (!context) {
    throw new Error('useControls must be used within ControlsProvider');
  }
  return context;
};
