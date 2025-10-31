import React from 'react';
import { Planet, CurrentFrequencies, AudioScalingConfig, FrequencyMode, TabType } from '../utils/types';

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

      {activeTab === 'controls' && (
        <div
          className="sidebar-content fade-in"
          role="tabpanel"
          id="controls-tab-panel"
          aria-labelledby="controls-tab"
        >
          <div className="control-group">
            <label htmlFor="volume-slider" className="label">
              Master Volume: {volumeToDb(masterVolume)} dB
            </label>
            <input
              id="volume-slider"
              type="range"
              value={masterVolume}
              min={0}
              max={1}
              step={0.01}
              className="slider"
              onChange={handleVolumeChange}
              onInput={handleVolumeChange}
              style={{ cursor: 'pointer' }}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={masterVolume}
              aria-valuetext={`${volumeToDb(masterVolume)} decibels`}
            />
          </div>

          <div className="control-group">
            <label htmlFor="frequency-slider" className="label">
              Base Frequency: {baseFrequency.toFixed(1)} Hz
            </label>
            <input
              id="frequency-slider"
              type="range"
              value={baseFrequency}
              min={27.5}
              max={110}
              step={0.1}
              className="slider"
              onChange={handleBaseFrequencyChange}
              onInput={handleBaseFrequencyChange}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Base Frequency"
              aria-valuemin={27.5}
              aria-valuemax={110}
              aria-valuenow={baseFrequency}
              aria-valuetext={`${baseFrequency.toFixed(1)} hertz`}
              style={{ cursor: 'pointer' }}
              disabled={isPlaying}
            />
          </div>

          <div className="control-group">
            <label htmlFor="distance-mode" className="label">
              Distance Mode:
            </label>
            <select
              id="distance-mode"
              value={distanceMode}
              onChange={handleDistanceModeChange}
              className="select-dropdown"
              disabled={!isPlaying}
              aria-disabled={!isPlaying}
            >
              <option value="titiusBode">Murch's Modified Titius-Bode Law</option>
              <option value="actual">Actual Distances</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="zoom-slider" className="label">
              Zoom Level: {zoomLevel.toFixed(1)}x
            </label>
            <input
              id="zoom-slider"
              type="range"
              value={zoomLevel}
              min={1}
              max={40}
              step={0.1}
              className="slider"
              onChange={handleZoomChange}
              aria-valuemin={1}
              aria-valuemax={40}
              aria-valuenow={zoomLevel}
              aria-valuetext={`${zoomLevel.toFixed(1)} times magnification`}
            />
          </div>

          <div className="control-group">
            <label htmlFor="speed-slider" className="label">
              Animation Speed: {animationSpeed.toFixed(1)}x
            </label>
            <input
              id="speed-slider"
              type="range"
              min={1}
              max={50}
              step={0.1}
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="slider"
              aria-valuemin={1}
              aria-valuemax={50}
              aria-valuenow={animationSpeed}
              aria-valuetext={`${animationSpeed.toFixed(1)} times normal speed`}
            />
          </div>
        </div>
      )}

      {activeTab === 'planets' && (
        <div
          className="sidebar-content planets-tab fade-in"
          role="tabpanel"
          id="planets-tab-panel"
          aria-labelledby="planets-tab"
        >
          <div className="sequence-controls">
            <button
              onClick={playOrbitalSequence}
              disabled={liveMode}
              className={`button ${liveMode ? 'disabled' : ''}`}
              aria-disabled={liveMode}
            >
              {isPlaying ? 'Stop Sequence' : 'Play Orbital Sequence'}
            </button>
          </div>

          <div className="loop-control">
            <label className="checkbox-label" htmlFor="loop-checkbox">
              <input
                id="loop-checkbox"
                type="checkbox"
                checked={loopSequence}
                onChange={toggleLoopSequence}
                disabled={liveMode || isPlaying}
                aria-disabled={liveMode || isPlaying}
              />
              Loop Sequence
            </label>
          </div>

          <div className="bpm-control">
            <label htmlFor="bpm-slider" className="label">
              Tempo: {sequenceBPM} BPM
            </label>
            <input
              id="bpm-slider"
              type="range"
              value={sequenceBPM}
              min={30}
              max={240}
              step={1}
              className="slider"
              onChange={handleBPMChange}
              disabled={liveMode || isPlaying}
              aria-disabled={liveMode || isPlaying}
              aria-valuemin={30}
              aria-valuemax={240}
              aria-valuenow={sequenceBPM}
              aria-valuetext={`${sequenceBPM} beats per minute`}
            />
          </div>

          <div className="master-toggle">
            <label className="checkbox-label" htmlFor="toggle-all-planets">
              <input
                id="toggle-all-planets"
                type="checkbox"
                checked={orbitData.every(planet => planet.enabled)}
                onChange={() => toggleAllPlanets(!orbitData.every(planet => planet.enabled))}
                disabled={isPlaying}
                aria-disabled={isPlaying}
              />
              {orbitData.every(planet => planet.enabled) ? 'Disable All' : 'Enable All'}
            </label>
          </div>

          <div className="planets-list" role="group" aria-label="Planet toggles">
            {orbitData.map((planet, index) => (
              <div
                key={planet.name}
                className={`planet-item ${planet.enabled ? 'enabled' : 'disabled'}`}
                style={{
                  borderLeft: `4px solid ${getPlanetColor(planet.name)}`
                }}
              >
                <label className="planet-toggle-label" htmlFor={`planet-toggle-${index}`}>
                  <input
                    id={`planet-toggle-${index}`}
                    type="checkbox"
                    checked={planet.enabled}
                    onChange={() => togglePlanet(index)}
                    disabled={isPlaying}
                    aria-disabled={isPlaying}
                    aria-label={`Enable ${planet.name}`}
                  />
                  <span className="planet-name">{planet.name}</span>
                </label>

                <div className="planet-info" aria-live="polite">
                  <div className="planet-data">
                    <span className="data-label">Dist:</span>
                    <span className="data-value">
                      {distanceModeForDisplay === 'titiusBode'
                        ? `${planet.distance.toFixed(2)} β`
                        : `${planet.actualDistance.toFixed(2)} AU`}
                    </span>
                  </div>
                  <div className="planet-data">
                    <span className="data-label">Freq:</span>
                    <span className="data-value">
                      {currentFrequencies[planet.name]
                        ? `${currentFrequencies[planet.name].toFixed(1)} Hz`
                        : 'Calculating...'}
                    </span>
                  </div>
                  <div className="planet-data planet-data__note">
                    <span className="data-label">Note:</span>
                    <span className="data-value note-value">
                      ~{currentFrequencies[planet.name]
                        ? frequencyToNote(currentFrequencies[planet.name])
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audio' && (
        <div
          className="sidebar-content audio-tab fade-in"
          role="tabpanel"
          id="audio-tab-panel"
          aria-labelledby="audio-tab"
        >

          <div className="audio-settings">
            <h3>Advanced Audio Settings</h3>

            <div className="fletcher-toggle">
              <label className="checkbox-label" htmlFor="fletcher-toggle">
                <input
                  id="fletcher-toggle"
                  type="checkbox"
                  checked={useFletcher}
                  onChange={toggleFletcherCurves}
                  aria-label="Enable Fletcher-Munson equal-loudness curves"
                />
                Use Fletcher-Munson equal-loudness curves
              </label>
              <p className="setting-description">
                Models how human hearing perceives different frequencies for more balanced sound
              </p>
            </div>

            <div className="control-group">
              <label htmlFor="reference-frequency" className="label">
                Reference Frequency: {audioScalingConfig.referenceFrequency.toFixed(1)} Hz
              </label>
              <input
                id="reference-frequency"
                type="range"
                value={audioScalingConfig.referenceFrequency}
                min={27.5}
                max={110}
                step={0.5}
                className="slider"
                aria-valuemin={27.5}
                aria-valuemax={110}
                aria-valuenow={audioScalingConfig.referenceFrequency}
                aria-valuetext={`${audioScalingConfig.referenceFrequency.toFixed(1)} hertz`}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);

                  setAudioScalingConfig({
                    ...audioScalingConfig,
                    referenceFrequency: newValue
                  });

                  setTimeout(() => {
                    forceRecalculateAllGains();
                  }, 10);
                }}
              />
              <p className="setting-description">
                The frequency at which volume is not reduced (baseline)
              </p>
            </div>

            <div className="control-group">
              <label htmlFor="scaling-factor" className="label">
                Scaling Factor: {audioScalingConfig.scalingFactor.toFixed(1)}
              </label>
              <input
                id="scaling-factor"
                type="range"
                value={audioScalingConfig.scalingFactor}
                min={0.1}
                max={1.0}
                step={0.1}
                className="slider"
                aria-valuemin={0.1}
                aria-valuemax={1.0}
                aria-valuenow={audioScalingConfig.scalingFactor}
                aria-valuetext={`${audioScalingConfig.scalingFactor.toFixed(1)}`}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);

                  setAudioScalingConfig({
                    ...audioScalingConfig,
                    scalingFactor: newValue
                  });

                  setTimeout(() => {
                    forceRecalculateAllGains();
                  }, 10);
                }}
              />
              <p className="setting-description">
                How aggressively to reduce volume at higher frequencies
              </p>
            </div>

            <div className="audio-explanation">
              <h4>Safety Measures Explained</h4>
              <p>
                Higher frequencies can be more damaging to hearing at the same volume level.
                Our audio engine automatically reduces volume for higher notes to create a
                safer and more balanced listening experience.
              </p>
              <p>
                The Fletcher-Munson curves model how human ears perceive loudness
                differently at different frequencies, providing even more natural sound.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarContent;
