import { useRef, useCallback, useEffect } from 'react';
import { PositionMode } from '../types/domain';

interface PositionTrackerState {
  hasPositionModeChanged: () => boolean;
  recordCurrentMode: (mode: PositionMode) => void;
}

/**
 * @deprecated Use useUIHandlers instead, which consolidates position tracking with other UI logic.
 * usePositionTracker will be removed in a future refactor after the container is migrated.
 */
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
