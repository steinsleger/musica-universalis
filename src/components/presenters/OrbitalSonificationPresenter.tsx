import React, { useMemo } from 'react';
import { useUIControls } from '../../hooks/useUIControls';
import { useAudioControls } from '../../hooks/useAudioControls';
import { useVisualizationControls } from '../../hooks/useVisualizationControls';
import OrbitalSonificationLayout from '../layouts/OrbitalSonificationLayout';
import { CurrentFrequencies } from '../../types/domain';

interface OrbitalSonificationPresenterProps {
  needsUserInteraction: boolean;
  handleUserInteraction: () => Promise<void>;
  onFrequencyChange: (frequencies: CurrentFrequencies) => void;
}

/**
 * Presentation component that renders layout
 * Consumes contexts via hooks and adapts values for OrbitalSonificationLayout
 * Memoized to avoid re-renders when parent updates
 */
const OrbitalSonificationPresenterComponent: React.FC<OrbitalSonificationPresenterProps> = ({
  needsUserInteraction,
  handleUserInteraction,
  onFrequencyChange
}) => {
  const uiControls = useUIControls();
  const audioControls = useAudioControls();
  const vizControls = useVisualizationControls();

  // Adapt contexts for OrbitalSonificationLayout
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

  return (
    <OrbitalSonificationLayout
      controlsValue={controlsValue}
      needsUserInteraction={needsUserInteraction}
      handleUserInteraction={handleUserInteraction}
      onFrequencyChange={onFrequencyChange}
    />
  );
};

const OrbitalSonificationPresenter = React.memo(OrbitalSonificationPresenterComponent);

export default OrbitalSonificationPresenter;
