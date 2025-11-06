import React from 'react';
import { useUIControls } from '../hooks/useUIControls';
import { useAudioControls } from '../hooks/useAudioControls';
import { useVisualizationControls } from '../hooks/useVisualizationControls';
import ControlsTabContent from './ControlsTabContent';
import PlanetsTabContent from './PlanetsTabContent';
import AudioTabContent from './AudioTabContent';

const SidebarContent: React.FC = () => {
  const { sidebarCollapsed, activeTab, setActiveTab } = useUIControls();
  const audioControls = useAudioControls();
  const vizControls = useVisualizationControls();

  return (
    <div
      className={`controls-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
      role="region"
      aria-label="Advanced settings"
      aria-hidden={sidebarCollapsed}
    >
      <div className="sidebar-tabs" role="tablist" aria-label="Settings categories">
        <button
          className={`tab-button ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
          role="tab"
          aria-selected={activeTab === 'controls'}
          aria-controls="controls-tab-panel"
          id="controls-tab"
        >
          Controls
        </button>
        <button
          className={`tab-button ${activeTab === 'planets' ? 'active' : ''}`}
          onClick={() => setActiveTab('planets')}
          role="tab"
          aria-selected={activeTab === 'planets'}
          aria-controls="planets-tab-panel"
          id="planets-tab"
        >
          Planets
        </button>
        <button
          className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
          role="tab"
          aria-selected={activeTab === 'audio'}
          aria-controls="audio-tab-panel"
          id="audio-tab"
        >
          Audio
        </button>
      </div>

      <ControlsTabContent
        activeTab={activeTab}
        masterVolume={audioControls.masterVolume}
        handleVolumeChange={audioControls.handleVolumeChange}
        baseFrequency={audioControls.baseFrequency}
        handleBaseFrequencyChange={audioControls.handleBaseFrequencyChange}
        distanceMode={vizControls.distanceMode}
        handleDistanceModeChange={vizControls.handleDistanceModeChange}
        zoomLevel={vizControls.zoomLevel}
        handleZoomChange={vizControls.handleZoomChange}
        animationSpeed={vizControls.animationSpeed}
        setAnimationSpeed={vizControls.setAnimationSpeed}
        isPlaying={audioControls.isPlaying}
        volumeToDb={() => '0dB'}
      />

      {activeTab === 'planets' && (
        <PlanetsTabContent
          activeTab={activeTab}
          playOrbitalSequence={audioControls.playOrbitalSequence}
          liveMode={audioControls.liveMode}
          isPlaying={audioControls.isPlaying}
          loopSequence={audioControls.loopSequence}
          toggleLoopSequence={audioControls.toggleLoopSequence}
          sequenceBPM={audioControls.sequenceBPM}
          handleBPMChange={audioControls.handleBPMChange}
          orbitData={vizControls.orbitData}
          toggleAllPlanets={vizControls.toggleAllPlanets}
          togglePlanet={vizControls.togglePlanet}
          currentFrequencies={vizControls.currentFrequencies}
          distanceModeForDisplay={vizControls.distanceMode}
          getPlanetColor={() => '#fff'}
          frequencyToNote={vizControls.frequencyToNote}
        />
      )}

      {activeTab === 'audio' && (
        <AudioTabContent
          activeTab={activeTab}
          useFletcher={audioControls.useFletcher}
          toggleFletcherCurves={audioControls.toggleFletcherCurves}
          audioScalingConfig={audioControls.audioScalingConfig}
          setAudioScalingConfig={audioControls.setAudioScalingConfig}
          forceRecalculateAllGains={audioControls.forceRecalculateAllGains}
        />
      )}
    </div>
  );
};

export default SidebarContent;
