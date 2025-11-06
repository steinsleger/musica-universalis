import React, { useMemo, useCallback } from 'react';
import { useUIControls } from '../hooks/useUIControls';
import { useAudioControls } from '../hooks/useAudioControls';
import { useVisualizationControls } from '../hooks/useVisualizationControls';
import OrbitalSonificationLayout from './OrbitalSonificationLayout';
import { CurrentFrequencies } from '../utils/types';

interface OrbitalSonificationPresenterProps {
  needsUserInteraction: boolean;
  handleUserInteraction: () => Promise<void>;
  onFrequencyChange: (frequencies: CurrentFrequencies) => void;
}

/**
 * OrbitalSonificationPresenter
 *
 * Pure presentation component that:
 * - Consumes the 3 focused contexts via hooks
 * - Adapts context values for backward compatibility with OrbitalSonificationLayout
 * - Renders the layout
 *
 * This component is intentionally simple and focused on rendering.
 * All state management happens in OrbitalSonificationContainer.
 */
const OrbitalSonificationPresenter: React.FC<OrbitalSonificationPresenterProps> = ({
  needsUserInteraction,
  handleUserInteraction,
  onFrequencyChange
}) => {
  const uiControls = useUIControls();
  const audioControls = useAudioControls();
  const vizControls = useVisualizationControls();

  // Build controlsValue from split contexts for backward compatibility with OrbitalSonificationLayout
  const controlsValue = useMemo(
    () => ({
      // Audio Controls
      masterVolume: audioControls.masterVolume,
      handleVolumeChange: audioControls.handleVolumeChange,
      baseFrequency: audioControls.baseFrequency,
      handleBaseFrequencyChange: audioControls.handleBaseFrequencyChange,
      sequenceBPM: audioControls.sequenceBPM,
      handleBPMChange: audioControls.handleBPMChange,
      useFletcher: audioControls.useFletcher,
      toggleFletcherCurves: audioControls.toggleFletcherCurves,
      audioScalingConfig: audioControls.audioScalingConfig,
      setAudioScalingConfig: audioControls.setAudioScalingConfig,
      forceRecalculateAllGains: audioControls.forceRecalculateAllGains,

      // Visualization Controls
      distanceMode: vizControls.distanceMode,
      handleDistanceModeChange: vizControls.handleDistanceModeChange,
      zoomLevel: vizControls.zoomLevel,
      handleZoomChange: vizControls.handleZoomChange,
      animationSpeed: vizControls.animationSpeed,
      setAnimationSpeed: vizControls.setAnimationSpeed,

      // Playback Controls
      isPlaying: audioControls.isPlaying,
      setIsPlaying: audioControls.setIsPlaying,
      playOrbitalSequence: audioControls.playOrbitalSequence,
      loopSequence: audioControls.loopSequence,
      toggleLoopSequence: audioControls.toggleLoopSequence,
      liveMode: audioControls.liveMode,
      toggleLiveMode: audioControls.toggleLiveMode,
      togglePlayPause: audioControls.togglePlayPause,

      // Planet Controls
      orbitData: vizControls.orbitData,
      togglePlanet: vizControls.togglePlanet,
      toggleAllPlanets: vizControls.toggleAllPlanets,
      currentFrequencies: vizControls.currentFrequencies,
      frequencyToNote: vizControls.frequencyToNote,

      // UI State
      sidebarCollapsed: uiControls.sidebarCollapsed,
      toggleSidebar: uiControls.toggleSidebar,
      activeTab: uiControls.activeTab,
      setActiveTab: uiControls.setActiveTab,
      isInfoModalOpen: uiControls.isInfoModalOpen,
      setIsInfoModalOpen: uiControls.setIsInfoModalOpen,
      isInstructionsModalOpen: uiControls.isInstructionsModalOpen,
      setIsInstructionsModalOpen: uiControls.setIsInstructionsModalOpen,

      // Other
      isPaused: vizControls.isPaused,
      positionMode: vizControls.positionMode,
      setPositionMode: vizControls.setPositionMode
    }),
    [audioControls, vizControls, uiControls]
  );

  // Wrap handleZoomChange to accept number instead of event
  const handleZoomLevelChange = useCallback((zoom: number) => {
    const event = { target: { value: String(zoom) } } as React.ChangeEvent<HTMLInputElement>;
    vizControls.handleZoomChange(event);
  }, [vizControls]);

  // Build visualizationValue from split contexts for backward compatibility with OrbitalSonificationLayout
  const visualizationValue = useMemo(
    () => ({
      orbitData: vizControls.orbitData,
      animationSpeed: vizControls.animationSpeed,
      baseFrequency: audioControls.baseFrequency,
      onFrequencyChange,
      isPaused: vizControls.isPaused,
      setToAverageDistance: vizControls.positionMode === 'average',
      setToAphelion: vizControls.positionMode === 'aphelion',
      setToPerihelion: vizControls.positionMode === 'perihelion',
      zoomLevel: vizControls.zoomLevel,
      setZoomLevel: handleZoomLevelChange,
      distanceMode: vizControls.distanceMode,
      currentlyPlayingPlanet: vizControls.currentlyPlayingPlanet ?? null,
      sequenceBPM: audioControls.sequenceBPM
    }),
    [vizControls, audioControls, handleZoomLevelChange, onFrequencyChange]
  );

  return (
    <OrbitalSonificationLayout
      controlsValue={controlsValue}
      visualizationValue={visualizationValue}
      needsUserInteraction={needsUserInteraction}
      handleUserInteraction={handleUserInteraction}
    />
  );
};

export default OrbitalSonificationPresenter;
