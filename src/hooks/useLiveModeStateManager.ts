import { useRef, useCallback } from 'react';

interface LiveModeStateManager {
  recoveryCounter: React.MutableRefObject<number>;
  lastFrequencyUpdate: React.MutableRefObject<number>;
  incrementRecoveryCounter: () => void;
  resetRecoveryCounter: () => void;
  getRecoveryCounter: () => number;
  shouldUpdateFrequencies: (throttleMs: number) => boolean;
  updateFrequencyTimestamp: () => void;
}

export const useLiveModeStateManager = (): LiveModeStateManager => {
  const recoveryCounter = useRef<number>(0);
  const lastFrequencyUpdate = useRef<number>(Date.now());

  const incrementRecoveryCounter = useCallback(() => {
    recoveryCounter.current++;
  }, []);

  const resetRecoveryCounter = useCallback(() => {
    recoveryCounter.current = 0;
  }, []);

  const getRecoveryCounter = useCallback(() => {
    return recoveryCounter.current;
  }, []);

  const shouldUpdateFrequencies = useCallback((throttleMs: number): boolean => {
    const now = Date.now();
    return now - lastFrequencyUpdate.current > throttleMs;
  }, []);

  const updateFrequencyTimestamp = useCallback(() => {
    lastFrequencyUpdate.current = Date.now();
  }, []);

  return {
    recoveryCounter,
    lastFrequencyUpdate,
    incrementRecoveryCounter,
    resetRecoveryCounter,
    getRecoveryCounter,
    shouldUpdateFrequencies,
    updateFrequencyTimestamp
  };
};
