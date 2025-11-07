/**
 * Hooks Index - Central export point for all custom hooks
 *
 * Consolidated hooks (replacing multiple single-purpose hooks):
 * - useUIHandlers: Consolidates 6 UI-related hooks
 * - useAudioProvider: Consolidates 4 audio context/initialization hooks
 * - useAudioPlayback: Consolidates 3 audio playback hooks
 * - useFrequency: Consolidates 3 frequency calculation hooks
 *
 * Context consumer hooks:
 * - useAudioConfig: Consumer for AudioConfigContext
 * - useOrbitalState: Consumer for OrbitalStateContext
 * - useUIControls: Consumer for UIControlsContext (deprecated)
 * - useVisualizationControls: Consumer for VisualizationControlsContext (deprecated)
 *
 * Specialized hooks:
 * - useOrbitalAnimation: Manages orbital animation loop
 * - useGlowEffect: Creates glow animation for playing planets
 * - useFrequencyRef: Manages frequency updates in refs (separates audio from state)
 * - useAudioProviderRef: Consolidates 12 individual audio refs into 1 structured ref
 */

// Consolidated hooks
export { useUIHandlers, type UIHandlers } from './useUIHandlers';
export { useAudioProvider } from './useAudioProvider';
export { useAudioPlayback } from './useAudioPlayback';
export { useFrequency } from './useFrequency';

// Context consumer hooks
export { useAudioConfig } from './useAudioConfig';
export { useOrbitalState } from './useOrbitalState';

// Deprecated context hooks (to be removed in future refactor)
export { useUIControls } from './useUIControls';
export { useVisualizationControls } from './useVisualizationControls';

// Specialized hooks
export { useOrbitalAnimation } from './useOrbitalAnimation';
export { useGlowEffect } from './useGlowEffect';
export { useFrequencyRef } from './useFrequencyRef';
export { useAudioProviderRef, type AudioProviderRef } from './useAudioProviderRef';

// Legacy hooks (to be deprecated)
export { useAudioContext } from './useAudioContext';
export { useAudioState } from './useAudioState';
export { useUIState } from './useUIState';
export { useModals } from './useModals';
export { useControlHandlers } from './useControlHandlers';
export { useToggleControls } from './useToggleControls';
export { usePositionTracker } from './usePositionTracker';
export { useAudioReferences } from './useAudioReferences';
export { useFrequencyManager } from './useFrequencyManager';
export { useLiveModeAudio } from './useLiveModeAudio';
export { useAudioContextManager } from './useAudioContextManager';
export { useSequencePlayback } from './useSequencePlayback';
export { useFrequencyEffects } from './useFrequencyEffects';
export { useAudioInitialization } from './useAudioInitialization';
export { useOrbitState } from './useOrbitState';
