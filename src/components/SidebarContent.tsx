import React from 'react';
import { useControls } from '../context/ControlsContext';
import ControlsTabContent from './ControlsTabContent';
import PlanetsTabContent from './PlanetsTabContent';
import AudioTabContent from './AudioTabContent';

const SidebarContent: React.FC = () => {
  const controls = useControls();
  const { sidebarCollapsed, activeTab, setActiveTab } = controls;

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
        masterVolume={controls.masterVolume}
        handleVolumeChange={controls.handleVolumeChange}
        baseFrequency={controls.baseFrequency}
        handleBaseFrequencyChange={controls.handleBaseFrequencyChange}
        distanceMode={controls.distanceMode}
        handleDistanceModeChange={controls.handleDistanceModeChange}
        zoomLevel={controls.zoomLevel}
        handleZoomChange={controls.handleZoomChange}
        animationSpeed={controls.animationSpeed}
        setAnimationSpeed={controls.setAnimationSpeed}
        isPlaying={controls.isPlaying}
        volumeToDb={() => '0dB'}
      />

      {activeTab === 'planets' && (
        <PlanetsTabContent
          activeTab={activeTab}
          playOrbitalSequence={controls.playOrbitalSequence}
          liveMode={controls.liveMode}
          isPlaying={controls.isPlaying}
          loopSequence={controls.loopSequence}
          toggleLoopSequence={controls.toggleLoopSequence}
          sequenceBPM={controls.sequenceBPM}
          handleBPMChange={controls.handleBPMChange}
          orbitData={controls.orbitData}
          toggleAllPlanets={controls.toggleAllPlanets}
          togglePlanet={controls.togglePlanet}
          currentFrequencies={controls.currentFrequencies}
          distanceModeForDisplay={controls.distanceMode}
          getPlanetColor={() => '#fff'}
          frequencyToNote={controls.frequencyToNote}
        />
      )}

      {activeTab === 'audio' && (
        <AudioTabContent
          activeTab={activeTab}
          useFletcher={controls.useFletcher}
          toggleFletcherCurves={controls.toggleFletcherCurves}
          audioScalingConfig={controls.audioScalingConfig}
          setAudioScalingConfig={controls.setAudioScalingConfig}
          forceRecalculateAllGains={controls.forceRecalculateAllGains}
        />
      )}
    </div>
  );
};

export default SidebarContent;
