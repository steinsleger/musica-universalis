import { useContext } from 'react';
import { OrbitStateContext } from '../context/OrbitStateContext';
import type { OrbitStateContextType } from '../context/OrbitStateContext';

export const useOrbitState = (): OrbitStateContextType => {
  const context = useContext(OrbitStateContext);
  if (!context) {
    throw new Error('useOrbitState must be used within OrbitStateProvider');
  }
  return context;
};
