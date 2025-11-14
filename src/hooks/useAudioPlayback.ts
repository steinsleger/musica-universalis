import { useReducer, useCallback } from 'react';
import { CurrentFrequencies } from '../types/domain';

/**
 * AudioPlaybackState - Consolidated audio playback and frequency state
 */
interface AudioPlaybackState {
  isPlaying: boolean;
  liveMode: boolean;
  currentFrequencies: CurrentFrequencies;
  loopSequence: boolean;
  currentlyPlayingPlanet: string | undefined;
}

/**
 * AudioPlaybackAction - Discriminated union of all possible audio state mutations
 */
type AudioPlaybackAction =
  | { type: 'START_PLAYBACK' }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'SET_LIVE_MODE'; payload: boolean }
  | { type: 'TOGGLE_LIVE_MODE' }
  | { type: 'TOGGLE_LOOP_SEQUENCE' }
  | { type: 'UPDATE_FREQUENCIES'; payload: CurrentFrequencies | ((prev: CurrentFrequencies) => CurrentFrequencies) }
  | { type: 'SET_LOOP_SEQUENCE'; payload: boolean }
  | { type: 'SET_PLAYING_PLANET'; payload: string | undefined }
  | { type: 'RESET' };

const initialState: AudioPlaybackState = {
  isPlaying: false,
  liveMode: false,
  currentFrequencies: {},
  loopSequence: false,
  currentlyPlayingPlanet: undefined
};

/**
 * Pure reducer function for audio playback state transitions
 */
function audioPlaybackReducer(state: AudioPlaybackState, action: AudioPlaybackAction): AudioPlaybackState {
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
 * useAudioPlayback - Consolidated audio playback state management hook
 *
 * Consolidates:
 * - isPlaying (playback status)
 * - liveMode (continuous audio vs sequence)
 * - currentFrequencies (active planet frequencies)
 * - loopSequence (whether to loop sequence playback)
 * - currentlyPlayingPlanet (for sequence playback tracking)
 *
 * Benefits:
 * - Single source of truth for audio playback state
 * - Clear action types prevent invalid state transitions
 * - Easier debugging (can log every action)
 * - Testable pure reducer function
 * - Follows Redux pattern
 */
export function useAudioPlayback() {
  const [state, dispatch] = useReducer(audioPlaybackReducer, initialState);

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
    state,
    dispatch,
    setIsPlaying,
    setLiveMode,
    toggleLiveMode,
    setCurrentFrequencies,
    setLoopSequence,
    toggleLoopSequence,
    setCurrentlyPlayingPlanet,
    reset,
    isPlaying: state.isPlaying,
    liveMode: state.liveMode,
    currentFrequencies: state.currentFrequencies,
    loopSequence: state.loopSequence,
    currentlyPlayingPlanet: state.currentlyPlayingPlanet
  };
}
