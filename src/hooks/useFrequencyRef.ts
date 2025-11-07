import { useRef, useCallback } from 'react';
import type { CurrentFrequencies } from '../types/domain';

/**
 * useFrequencyRef
 *
 * Optimization hook that manages frequency updates in refs instead of state.
 * This allows audio systems to access current frequencies without triggering
 * context updates and re-renders. The visualization still uses its own state
 * for rendering, but the audio system reads from this ref for lower latency.
 *
 * Benefits:
 * - Separates frequency state for visualization from frequency refs for audio
 * - Audio system accesses frequencies with minimal latency (no setState wait)
 * - Avoids propagating frequency updates through context every frame
 * - More efficient for 60fps frequency updates from animation
 *
 * Usage:
 * const { frequencyRef, updateFrequencies } = useFrequencyRef(initialFrequencies);
 * // In callback: updateFrequencies(newFrequencies);
 * // In audio code: audioSystem.setFrequency(frequencyRef.current[planetName]);
 */

interface UseFrequencyRefResult {
  frequencyRef: React.MutableRefObject<CurrentFrequencies>;
  updateFrequencies: (frequencies: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies)) => void;
}

export const useFrequencyRef = (initialFrequencies: CurrentFrequencies = {}): UseFrequencyRefResult => {
  const frequencyRef = useRef<CurrentFrequencies>(initialFrequencies);

  const updateFrequencies = useCallback(
    (frequencies: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies)) => {
      if (typeof frequencies === 'function') {
        frequencyRef.current = frequencies(frequencyRef.current);
      } else {
        frequencyRef.current = frequencies;
      }
    },
    []
  );

  return {
    frequencyRef,
    updateFrequencies
  };
};
