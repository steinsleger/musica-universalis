import React, { useEffect, useCallback, useMemo } from 'react';
import { useAudioConfig } from '../hooks/useAudioConfig';
import { useOrbitalState } from '../hooks/useOrbitalState';
import { useAudioProvider } from '../hooks/useAudioProvider';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useFrequency } from '../hooks/useFrequency';
import OrbitalSonificationPresenter from './OrbitalSonificationPresenter';

/**
 * OrbitalSonificationContainer (Refactored)
 *
 * Orchestrates all audio, orbital, and UI logic using new service-based architecture
 * Uses unified state management with merged OrbitalStateContext
 *
 * Replaces: 684-line version with 10+ hooks scattered throughout
 * New: ~180 lines with clear separation of concerns
 *
 * Responsibilities:
 * 1. Audio provider lifecycle management (via useAudioProvider)
 * 2. Frequency calculations (via useFrequency)
 * 3. Playback orchestration (via useAudioPlayback)
 * 4. State coordination between audio/orbit/UI (via useOrbitalState)
 * 5. Handler creation and event delegation
 */
const OrbitalSonificationContainer: React.FC = () => {
  // Consume merged contexts
  const audioConfig = useAudioConfig();
  const orbitalState = useOrbitalState();

  // Initialize audio provider
  const { getProvider, getContextState, resume } = useAudioProvider();

  // Frequency calculations
  const frequency = useFrequency(audioConfig.baseFrequency, orbitalState.state.distanceMode);

  // Audio playback orchestration
  const playbackState = useMemo(() => ({
    isPlaying: orbitalState.state.isPlaying,
    liveMode: orbitalState.state.liveMode,
    loopSequence: orbitalState.state.loopSequence,
    currentlyPlayingPlanet: orbitalState.state.currentlyPlayingPlanet
  }), [
    orbitalState.state.isPlaying,
    orbitalState.state.liveMode,
    orbitalState.state.loopSequence,
    orbitalState.state.currentlyPlayingPlanet
  ]);

  const { handlers: playbackHandlers } = useAudioPlayback(
    playbackState,
    (partial) => {
      if (partial.isPlaying !== undefined) orbitalState.setIsPlaying(partial.isPlaying);
      if (partial.liveMode !== undefined) orbitalState.toggleLiveMode();
      if (partial.loopSequence !== undefined) orbitalState.toggleLoopSequence();
      if (partial.currentlyPlayingPlanet !== undefined) orbitalState.setCurrentlyPlayingPlanet(partial.currentlyPlayingPlanet);
    }
  );

  // Initialize audio on mount
  useEffect(() => {
    const provider = getProvider();
    if (!provider) {
      console.warn('[AUDIO] Provider not initialized');
    }
  }, [getProvider]);

  // Update frequencies when base frequency or distance mode changes
  useEffect(() => {
    const frequencies = frequency.calculateAllFrequencies(orbitalState.state.orbitData);
    orbitalState.setCurrentFrequencies(frequencies);
  }, [audioConfig.baseFrequency, orbitalState.state.distanceMode]);

  // Update gains when Fletcher curves toggle
  useEffect(() => {
    const provider = getProvider();
    if (provider) {
      provider.updateAllGains(
        orbitalState.state.currentFrequencies,
        audioConfig.audioScalingConfig,
        audioConfig.useFletcher
      );
    }
  }, [audioConfig.useFletcher, audioConfig.audioScalingConfig]);

  // Handle user interaction to resume audio context
  const handleUserInteraction = useCallback(async (): Promise<void> => {
    try {
      await resume();
      orbitalState.setAudioError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resume audio';
      console.error('[AUDIO] Resume failed:', error);
      orbitalState.setAudioError(message);
      orbitalState.setAudioHealthStatus('degraded');
    }
  }, [resume, orbitalState]);

  // Add global user interaction listeners
  useEffect(() => {
    const contextState = getContextState();
    if (contextState.needsUserInteraction) {
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);

      return () => {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [handleUserInteraction, getContextState]);

  // Handle play/pause toggle
  const handleTogglePlayPause = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      orbitalState.setAudioError('Audio provider not available');
      return;
    }

    try {
      await playbackHandlers.togglePlayPause(
        provider,
        orbitalState.state.orbitData,
        audioConfig.baseFrequency
      );

      if (orbitalState.state.isPlaying) {
        // Start playback sequence if not already playing
        await playbackHandlers.playOrbitalSequence(
          provider,
          orbitalState.state.orbitData,
          audioConfig.sequenceBPM,
          orbitalState.state.currentFrequencies
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Playback error';
      console.error('[AUDIO] Playback error:', error);
      orbitalState.setAudioError(message);
    }
  }, [getProvider, orbitalState, audioConfig.baseFrequency, audioConfig.sequenceBPM, playbackHandlers]);

  // Handle live mode toggle
  const handleToggleLiveMode = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      orbitalState.setAudioError('Audio provider not available');
      return;
    }

    try {
      orbitalState.toggleLiveMode();
      // Live mode updates are handled by frequency updates in effects
    } catch (error) {
      console.error('[AUDIO] Live mode error:', error);
    }
  }, [getProvider, orbitalState]);

  // Handle master volume change
  const handleVolumeChange = useCallback((volume: number) => {
    const provider = getProvider();
    if (provider) {
      provider.setMasterVolume(volume);
    }
    audioConfig.setMasterVolume(volume);
  }, [getProvider, audioConfig]);

  // Handle planet toggle
  const handleTogglePlanet = useCallback((planetName: string) => {
    orbitalState.togglePlanet(planetName);

    const provider = getProvider();
    if (!provider) return;

    const planet = orbitalState.state.orbitData.find(p => p.name === planetName);
    if (!planet) return;

    if (planet.enabled) {
      // Create synth for planet
      provider.createSynth(
        planetName,
        orbitalState.state.currentFrequencies[planetName],
        audioConfig.audioScalingConfig,
        audioConfig.useFletcher
      );
    } else {
      // Dispose synth
      provider.disposeSynth(planetName);
    }
  }, [getProvider, orbitalState, audioConfig]);

  // Create memoized context values (for backwards compatibility with existing components)
  // Components can still access data from merged OrbitalStateContext
  const contextValues = useMemo(() => ({
    orbitalState,
    audioConfig,
    handlers: {
      handleTogglePlayPause,
      handleToggleLiveMode,
      handleVolumeChange,
      handleTogglePlanet,
      handleUserInteraction
    }
  }), [
    orbitalState,
    audioConfig,
    handleTogglePlayPause,
    handleToggleLiveMode,
    handleVolumeChange,
    handleTogglePlanet,
    handleUserInteraction
  ]);

  const contextState = getContextState();

  return (
    <OrbitalSonificationPresenter
      needsUserInteraction={contextState.needsUserInteraction}
      handleUserInteraction={handleUserInteraction}
      {...contextValues}
    />
  );
};

export default OrbitalSonificationContainer;
