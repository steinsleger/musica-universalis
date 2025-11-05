import { useContext } from 'react';
import { VisualizationContext, VisualizationContextType } from '../context/VisualizationContext';

export const useVisualization = (): VisualizationContextType => {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error('useVisualization must be used within VisualizationProvider');
  }
  return context;
};
