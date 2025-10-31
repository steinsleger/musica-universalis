import React from 'react';
import { Planet, CurrentFrequencies, AudioScalingConfig, FrequencyMode, TabType } from '../utils/types';
import ControlsTabContent from './ControlsTabContent';
import PlanetsTabContent from './PlanetsTabContent';
import AudioTabContent from './AudioTabContent';

interface SidebarContentProps {
  sidebarCollapsed: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  masterVolume: number;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  baseFrequency: number;
  handleBaseFrequencyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  distanceMode: FrequencyMode;
  handleDistanceModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  zoomLevel: number;
  handleZoomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  isPlaying: boolean;
  playOrbitalSequence: () => void;
  loopSequence: boolean;
  toggleLoopSequence: () => void;
  sequenceBPM: number;
  handleBPMChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  liveMode: boolean;
  orbitData: Planet[];
  toggleAllPlanets: (enable: boolean) => void;
  togglePlanet: (index: number) => void;
  currentFrequencies: CurrentFrequencies;
  distanceModeForDisplay: FrequencyMode;
  getPlanetColor: (name: string) => string;
  frequencyToNote: (freq: number) => string;
  volumeToDb: (volume: number) => string;
  useFletcher: boolean;
  toggleFletcherCurves: () => void;
  audioScalingConfig: AudioScalingConfig;
  setAudioScalingConfig: (config: AudioScalingConfig) => void;
  forceRecalculateAllGains: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  sidebarCollapsed,
  activeTab,
  setActiveTab,
  masterVolume,
  handleVolumeChange,
  baseFrequency,
  handleBaseFrequencyChange,
  distanceMode,
  handleDistanceModeChange,
  zoomLevel,
  handleZoomChange,
  animationSpeed,
  setAnimationSpeed,
  isPlaying,
  playOrbitalSequence,
  loopSequence,
  toggleLoopSequence,
  sequenceBPM,
  handleBPMChange,
  liveMode,
  orbitData,
  toggleAllPlanets,
  togglePlanet,
  currentFrequencies,
  distanceModeForDisplay,
  getPlanetColor,
  frequencyToNote,
  volumeToDb,
  useFletcher,
  toggleFletcherCurves,
  audioScalingConfig,
  setAudioScalingConfig,
  forceRecalculateAllGains
}) => {
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
        masterVolume={masterVolume}
        handleVolumeChange={handleVolumeChange}
        baseFrequency={baseFrequency}
        handleBaseFrequencyChange={handleBaseFrequencyChange}
        distanceMode={distanceMode}
        handleDistanceModeChange={handleDistanceModeChange}
        zoomLevel={zoomLevel}
        handleZoomChange={handleZoomChange}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        isPlaying={isPlaying}
        volumeToDb={volumeToDb}
      />

      {activeTab === 'planets' && (
        <PlanetsTabContent
          activeTab={activeTab}
          playOrbitalSequence={playOrbitalSequence}
          liveMode={liveMode}
          isPlaying={isPlaying}
          loopSequence={loopSequence}
          toggleLoopSequence={toggleLoopSequence}
          sequenceBPM={sequenceBPM}
          handleBPMChange={handleBPMChange}
          orbitData={orbitData}
          toggleAllPlanets={toggleAllPlanets}
          togglePlanet={togglePlanet}
          currentFrequencies={currentFrequencies}
          distanceModeForDisplay={distanceModeForDisplay}
          getPlanetColor={getPlanetColor}
          frequencyToNote={frequencyToNote}
        />
      )}

      {activeTab === 'audio' && (
        <AudioTabContent
          activeTab={activeTab}
          useFletcher={useFletcher}
          toggleFletcherCurves={toggleFletcherCurves}
          audioScalingConfig={audioScalingConfig}
          setAudioScalingConfig={setAudioScalingConfig}
          forceRecalculateAllGains={forceRecalculateAllGains}
        />
      )}
    </div>
  );
};

export default SidebarContent;
