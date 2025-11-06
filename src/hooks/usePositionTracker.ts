import { useRef, useCallback, useEffect } from 'react';
import { PositionMode } from '../utils/types';

interface PositionTrackerState {
  hasPositionModeChanged: () => boolean;
  recordCurrentMode: (mode: PositionMode) => void;
}

export const usePositionTracker = (currentMode: PositionMode): PositionTrackerState => {
  const prevModeRef = useRef<PositionMode>(currentMode);

  const hasPositionModeChanged = useCallback((): boolean => {
    return prevModeRef.current !== currentMode;
  }, [currentMode]);

  const recordCurrentMode = useCallback((mode: PositionMode): void => {
    prevModeRef.current = mode;
  }, []);

  useEffect(() => {
    prevModeRef.current = currentMode;
  }, [currentMode]);

  return {
    hasPositionModeChanged,
    recordCurrentMode
  };
};
