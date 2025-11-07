import React, { createContext, useReducer, useCallback, ReactNode } from 'react';
import {
  Planet,
  FrequencyMode,
  PositionMode,
  TabType,
  CurrentFrequencies,
  getDefaultOrbitData
} from '../utils/types';
import {
  DEFAULT_ANIMATION_SPEED,
  DEFAULT_ZOOM_LEVEL
} from '../utils/constants';

/**
 * Comprehensive state for orbital visualization, audio, and UI
 * Merged from: OrbitStateContext + AudioControlsContext + UIControlsContext + VisualizationControlsContext
 */
interface OrbitalState {
  // Orbital/Visualization State
  orbitData: Planet[];
  animationSpeed: number;
  isPaused: boolean;
  distanceMode: FrequencyMode;
  positionMode: PositionMode;
  zoomLevel: number;

  // Audio State
  currentFrequencies: CurrentFrequencies;
  isPlaying: boolean;
  liveMode: boolean;
  loopSequence: boolean;
  currentlyPlayingPlanet: string | undefined;
  audioError: string | null;
  audioHealthStatus: 'healthy' | 'degraded' | 'failed';

  // UI State
  sidebarCollapsed: boolean;
  activeTab: TabType;
  isInfoModalOpen: boolean;
  isInstructionsModalOpen: boolean;
}

/**
 * Discriminated union type for reducer actions
 */
type OrbitalStateAction =
  // Orbit actions
  | { type: 'SET_ORBIT_DATA'; payload: Planet[] }
  | { type: 'TOGGLE_PLANET'; payload: string }
  | { type: 'SET_ANIMATION_SPEED'; payload: number }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_DISTANCE_MODE'; payload: FrequencyMode }
  | { type: 'SET_POSITION_MODE'; payload: PositionMode }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }

  // Audio actions
  | { type: 'SET_CURRENT_FREQUENCIES'; payload: CurrentFrequencies }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'TOGGLE_LIVE_MODE' }
  | { type: 'TOGGLE_LOOP_SEQUENCE' }
  | { type: 'SET_CURRENTLY_PLAYING_PLANET'; payload: string | undefined }
  | { type: 'SET_AUDIO_ERROR'; payload: string | null }
  | { type: 'SET_AUDIO_HEALTH_STATUS'; payload: 'healthy' | 'degraded' | 'failed' }

  // UI actions
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_INFO_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_INSTRUCTIONS_MODAL_OPEN'; payload: boolean }

  // Bulk actions
  | { type: 'TOGGLE_ALL_PLANETS'; payload: boolean }
  | { type: 'RESET_TO_DEFAULTS' };

const getInitialState = (): OrbitalState => ({
  // Orbital
  orbitData: getDefaultOrbitData(),
  animationSpeed: DEFAULT_ANIMATION_SPEED,
  isPaused: true,
  distanceMode: 'titiusBode',
  positionMode: 'average',
  zoomLevel: DEFAULT_ZOOM_LEVEL,

  // Audio
  currentFrequencies: {},
  isPlaying: false,
  liveMode: false,
  loopSequence: false,
  currentlyPlayingPlanet: undefined,
  audioError: null,
  audioHealthStatus: 'healthy',

  // UI
  sidebarCollapsed: false,
  activeTab: 'controls',
  isInfoModalOpen: false,
  isInstructionsModalOpen: false
});

/**
 * Reducer function for orbital state
 */
const orbitalStateReducer = (state: OrbitalState, action: OrbitalStateAction): OrbitalState => {
  switch (action.type) {
    // Orbit actions
    case 'SET_ORBIT_DATA':
      return { ...state, orbitData: action.payload };

    case 'TOGGLE_PLANET':
      return {
        ...state,
        orbitData: state.orbitData.map(planet =>
          planet.name === action.payload
            ? { ...planet, enabled: !planet.enabled }
            : planet
        )
      };

    case 'TOGGLE_ALL_PLANETS':
      return {
        ...state,
        orbitData: state.orbitData.map(planet => ({
          ...planet,
          enabled: action.payload
        }))
      };

    case 'SET_ANIMATION_SPEED':
      return { ...state, animationSpeed: action.payload };

    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused };

    case 'SET_DISTANCE_MODE':
      return { ...state, distanceMode: action.payload };

    case 'SET_POSITION_MODE':
      return { ...state, positionMode: action.payload };

    case 'SET_ZOOM_LEVEL':
      return { ...state, zoomLevel: action.payload };

    // Audio actions
    case 'SET_CURRENT_FREQUENCIES':
      return { ...state, currentFrequencies: action.payload };

    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.payload };

    case 'TOGGLE_LIVE_MODE':
      return { ...state, liveMode: !state.liveMode };

    case 'TOGGLE_LOOP_SEQUENCE':
      return { ...state, loopSequence: !state.loopSequence };

    case 'SET_CURRENTLY_PLAYING_PLANET':
      return { ...state, currentlyPlayingPlanet: action.payload };

    case 'SET_AUDIO_ERROR':
      return { ...state, audioError: action.payload };

    case 'SET_AUDIO_HEALTH_STATUS':
      return { ...state, audioHealthStatus: action.payload };

    // UI actions
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_INFO_MODAL_OPEN':
      return { ...state, isInfoModalOpen: action.payload };

    case 'SET_INSTRUCTIONS_MODAL_OPEN':
      return { ...state, isInstructionsModalOpen: action.payload };

    case 'RESET_TO_DEFAULTS':
      return getInitialState();

    default:
      return state;
  }
};

/**
 * Context type definition with both state and dispatch
 */
export interface OrbitalStateContextType {
  state: OrbitalState;
  dispatch: React.Dispatch<OrbitalStateAction>;

  // Convenience methods (no-op wrappers around dispatch for easier consumption)
  // Orbit methods
  setOrbitData: (data: Planet[]) => void;
  togglePlanet: (name: string) => void;
  toggleAllPlanets: (enable: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  togglePause: () => void;
  setDistanceMode: (mode: FrequencyMode) => void;
  setPositionMode: (mode: PositionMode) => void;
  setZoomLevel: (level: number) => void;

  // Audio methods
  setCurrentFrequencies: (frequencies: CurrentFrequencies) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleLiveMode: () => void;
  toggleLoopSequence: () => void;
  setCurrentlyPlayingPlanet: (planet: string | undefined) => void;
  setAudioError: (error: string | null) => void;
  setAudioHealthStatus: (status: 'healthy' | 'degraded' | 'failed') => void;

  // UI methods
  toggleSidebar: () => void;
  setActiveTab: (tab: TabType) => void;
  setIsInfoModalOpen: (open: boolean) => void;
  setIsInstructionsModalOpen: (open: boolean) => void;

  // Reset
  resetToDefaults: () => void;
}

const OrbitalStateContext = createContext<OrbitalStateContextType | undefined>(undefined);

interface OrbitalStateProviderProps {
  children: ReactNode;
}

export const OrbitalStateProvider: React.FC<OrbitalStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(orbitalStateReducer, undefined, getInitialState);

  // Orbit methods
  const setOrbitData = useCallback(
    (data: Planet[]) => dispatch({ type: 'SET_ORBIT_DATA', payload: data }),
    []
  );
  const togglePlanet = useCallback(
    (name: string) => dispatch({ type: 'TOGGLE_PLANET', payload: name }),
    []
  );
  const toggleAllPlanets = useCallback(
    (enable: boolean) => dispatch({ type: 'TOGGLE_ALL_PLANETS', payload: enable }),
    []
  );
  const setAnimationSpeed = useCallback(
    (speed: number) => dispatch({ type: 'SET_ANIMATION_SPEED', payload: speed }),
    []
  );
  const togglePause = useCallback(
    () => dispatch({ type: 'TOGGLE_PAUSE' }),
    []
  );
  const setDistanceMode = useCallback(
    (mode: FrequencyMode) => dispatch({ type: 'SET_DISTANCE_MODE', payload: mode }),
    []
  );
  const setPositionMode = useCallback(
    (mode: PositionMode) => dispatch({ type: 'SET_POSITION_MODE', payload: mode }),
    []
  );
  const setZoomLevel = useCallback(
    (level: number) => dispatch({ type: 'SET_ZOOM_LEVEL', payload: level }),
    []
  );

  // Audio methods
  const setCurrentFrequencies = useCallback(
    (frequencies: CurrentFrequencies) => dispatch({ type: 'SET_CURRENT_FREQUENCIES', payload: frequencies }),
    []
  );
  const setIsPlaying = useCallback(
    (playing: boolean) => dispatch({ type: 'SET_IS_PLAYING', payload: playing }),
    []
  );
  const toggleLiveMode = useCallback(
    () => dispatch({ type: 'TOGGLE_LIVE_MODE' }),
    []
  );
  const toggleLoopSequence = useCallback(
    () => dispatch({ type: 'TOGGLE_LOOP_SEQUENCE' }),
    []
  );
  const setCurrentlyPlayingPlanet = useCallback(
    (planet: string | undefined) => dispatch({ type: 'SET_CURRENTLY_PLAYING_PLANET', payload: planet }),
    []
  );
  const setAudioError = useCallback(
    (error: string | null) => dispatch({ type: 'SET_AUDIO_ERROR', payload: error }),
    []
  );
  const setAudioHealthStatus = useCallback(
    (status: 'healthy' | 'degraded' | 'failed') => dispatch({ type: 'SET_AUDIO_HEALTH_STATUS', payload: status }),
    []
  );

  // UI methods
  const toggleSidebar = useCallback(
    () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    []
  );
  const setActiveTab = useCallback(
    (tab: TabType) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }),
    []
  );
  const setIsInfoModalOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_INFO_MODAL_OPEN', payload: open }),
    []
  );
  const setIsInstructionsModalOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_INSTRUCTIONS_MODAL_OPEN', payload: open }),
    []
  );

  // Reset
  const resetToDefaults = useCallback(
    () => dispatch({ type: 'RESET_TO_DEFAULTS' }),
    []
  );

  const value: OrbitalStateContextType = {
    state,
    dispatch,
    setOrbitData,
    togglePlanet,
    toggleAllPlanets,
    setAnimationSpeed,
    togglePause,
    setDistanceMode,
    setPositionMode,
    setZoomLevel,
    setCurrentFrequencies,
    setIsPlaying,
    toggleLiveMode,
    toggleLoopSequence,
    setCurrentlyPlayingPlanet,
    setAudioError,
    setAudioHealthStatus,
    toggleSidebar,
    setActiveTab,
    setIsInfoModalOpen,
    setIsInstructionsModalOpen,
    resetToDefaults
  };

  return (
    <OrbitalStateContext.Provider value={value}>
      {children}
    </OrbitalStateContext.Provider>
  );
};

export { OrbitalStateContext };
export type { OrbitalStateContextType, OrbitalState };
