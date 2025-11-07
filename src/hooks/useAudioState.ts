import { useReducer, useCallback } from 'react';
import { CurrentFrequencies } from '../utils/types';

/**
 * AudioState - Consolidated audio playback and frequency state
 * Previously scattered across usePlaybackState and useSequencePlayback hooks
 */
export interface AudioState {
  isPlaying: boolean;
  liveMode: boolean;
  currentFrequencies: CurrentFrequencies;
  loopSequence: boolean;
  currentlyPlayingPlanet: string | undefined;
}

/**
 * AudioAction - Discriminated union of all possible audio state mutations
 * Using explicit action types prevents invalid state transitions
 */
export type AudioAction =
  | { type: 'START_PLAYBACK' }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'SET_LIVE_MODE'; payload: boolean }
  | { type: 'TOGGLE_LIVE_MODE' }
  | { type: 'TOGGLE_LOOP_SEQUENCE' }
  | { type: 'UPDATE_FREQUENCIES'; payload: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies) }
  | { type: 'SET_LOOP_SEQUENCE'; payload: boolean }
  | { type: 'SET_PLAYING_PLANET'; payload: string | undefined }
  | { type: 'RESET' };

const initialState: AudioState = {
  isPlaying: false,
  liveMode: false,
  currentFrequencies: {},
  loopSequence: false,
  currentlyPlayingPlanet: undefined
};

/**
 * Pure reducer function for audio state transitions
 * Predictable, testable, and easy to reason about
 */
function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'START_PLAYBACK':
      return { ...state, isPlaying: true };
    case 'STOP_PLAYBACK':
      return { ...state, isPlaying: false, currentlyPlayingPlanet: undefined };
    case 'SET_LIVE_MODE':
      return { ...state, liveMode: action.payload, isPlaying: false };
    case 'TOGGLE_LIVE_MODE':
      return { ...state, liveMode: !state.liveMode, isPlaying: false };
    case 'TOGGLE_LOOP_SEQUENCE':
      return { ...state, loopSequence: !state.loopSequence };
    case 'UPDATE_FREQUENCIES': {
      const payload = typeof action.payload === 'function'
        ? action.payload(state.currentFrequencies)
        : action.payload;
      return {
        ...state,
        currentFrequencies: { ...state.currentFrequencies, ...payload }
      };
    }
    case 'SET_LOOP_SEQUENCE':
      return { ...state, loopSequence: action.payload };
    case 'SET_PLAYING_PLANET':
      return { ...state, currentlyPlayingPlanet: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/**
 * useAudioState - Consolidated audio state management hook
 *
 * Consolidates:
 * - isPlaying (playback status)
 * - liveMode (continuous audio vs sequence)
 * - currentFrequencies (active planet frequencies)
 * - loopSequence (whether to loop sequence playback)
 * - currentlyPlayingPlanet (for sequence playback tracking)
 *
 * Replaces scattered useState calls with single useReducer
 * Provides both raw dispatch and convenience setter functions
 *
 * Benefits:
 * - Single source of truth for audio state
 * - Clear action types prevent invalid state transitions
 * - Easier debugging (can log every action)
 * - Testable pure reducer function
 * - Follows Redux pattern
 *
 * @deprecated Use useAudioPlayback instead, which consolidates audio playback management.
 * useAudioState will be removed in a future refactor after the container is migrated.
 */
export function useAudioState() {
  const [state, dispatch] = useReducer(audioReducer, initialState);

  // Convenience functions for cleaner API
  // Stabilized with useCallback and NO state dependencies to prevent infinite loops
  const setIsPlaying = useCallback(
    (playing: boolean) => {
      dispatch(playing ? { type: 'START_PLAYBACK' } : { type: 'STOP_PLAYBACK' });
    },
    []
  );

  const setLiveMode = useCallback(
    (mode: boolean) => {
      dispatch({ type: 'SET_LIVE_MODE', payload: mode });
    },
    []
  );

  const toggleLiveMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_LIVE_MODE' });
  }, []);

  const setCurrentFrequencies = useCallback(
    (frequencies: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies)) => {
      dispatch({ type: 'UPDATE_FREQUENCIES', payload: frequencies });
    },
    []
  );

  const setLoopSequence = useCallback(
    (loop: boolean) => {
      dispatch({ type: 'SET_LOOP_SEQUENCE', payload: loop });
    },
    []
  );

  const toggleLoopSequence = useCallback(() => {
    dispatch({ type: 'TOGGLE_LOOP_SEQUENCE' });
  }, []);

  const setCurrentlyPlayingPlanet = useCallback(
    (planet: string | undefined) => {
      dispatch({ type: 'SET_PLAYING_PLANET', payload: planet });
    },
    []
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    // Raw state and dispatch for flexibility
    state,
    dispatch,

    // Convenience setters for backward compatibility with useState-based code
    setIsPlaying,
    setLiveMode,
    toggleLiveMode,
    setCurrentFrequencies,
    setLoopSequence,
    toggleLoopSequence,
    setCurrentlyPlayingPlanet,
    reset,

    // Direct state accessors for cleaner usage
    isPlaying: state.isPlaying,
    liveMode: state.liveMode,
    currentFrequencies: state.currentFrequencies,
    loopSequence: state.loopSequence,
    currentlyPlayingPlanet: state.currentlyPlayingPlanet
  };
}
