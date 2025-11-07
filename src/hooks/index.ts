/**
 * Hooks Index - Public API for custom hooks
 *
 * This file exports the essential public hooks. Internal/deprecated hooks are
 * available in their individual files but not re-exported here.
 *
 * PUBLIC API (9 essential hooks):
 *
 * Context Consumers (2):
 *   - useAudioConfig: Audio configuration (baseFrequency, masterVolume, etc.)
 *   - useOrbitalState: Orbital state (orbitData, animationSpeed, isPaused, etc.)
 *
 * Consolidated Hooks (4):
 *   - useUIHandlers: All UI event handlers (play/pause, zoom, sidebar, etc.)
 *   - useAudioProvider: Audio lifecycle management
 *   - useAudioPlayback: Playback state and sequence operations
 *   - useFrequency: Frequency calculations and conversions
 *
 * Specialized Hooks (3):
 *   - useOrbitalAnimation: SVG animation loop (requestAnimationFrame)
 *   - useGlowEffect: Visual glow effect for playing planets
 *   - useAudioProviderRef: Consolidated 12 audio refs into 1 structured ref
 *
 * DEPRECATED HOOKS (available but not recommended):
 * These are kept for backward compatibility but should not be used in new code.
 * They will be removed in a future major release.
 *   - useAudioContext, useAudioContextManager, useAudioReferences
 *   - useAudioInitialization, useFrequencyManager, useFrequencyCalculation
 *   - useAudioState, useUIState, useModals, usePositionTracker
 *   - useControlHandlers, useToggleControls, useFrequencyEffects
 *   - useLiveModeAudio, useSequencePlayback, useAudioControls, useUIControls
 */

// PUBLIC API: Essential hooks
export { useAudioConfig } from './useAudioConfig';
export { useOrbitalState } from './useOrbitalState';
export { useUIHandlers, type UIHandlers } from './useUIHandlers';
export { useAudioProvider } from './useAudioProvider';
export { useAudioPlayback } from './useAudioPlayback';
export { useFrequency } from './useFrequency';
export { useOrbitalAnimation } from './useOrbitalAnimation';
export { useGlowEffect } from './useGlowEffect';
export { useAudioProviderRef, type AudioProviderRef } from './useAudioProviderRef';

// DEPRECATED: For backward compatibility only
export { useFrequencyRef } from './useFrequencyRef';
