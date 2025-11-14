import React from 'react';
import { Planet, CurrentFrequencies, FrequencyMode, PlanetName } from '../../types/domain';

interface PlanetsTabContentProps {
  activeTab: string;
  playOrbitalSequence: () => void;
  liveMode: boolean;
  isPlaying: boolean;
  loopSequence: boolean;
  toggleLoopSequence: () => void;
  sequenceBPM: number;
  handleBPMChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  orbitData: Planet[];
  toggleAllPlanets: (enable: boolean) => void;
  togglePlanet: (index: number) => void;
  currentFrequencies: CurrentFrequencies;
  distanceModeForDisplay: FrequencyMode;
  getPlanetColor: (name: PlanetName) => string;
  frequencyToNote: (freq: number) => string;
}

const PlanetsTabContent: React.FC<PlanetsTabContentProps> = ({
  playOrbitalSequence,
  liveMode,
  isPlaying,
  loopSequence,
  toggleLoopSequence,
  sequenceBPM,
  handleBPMChange,
  orbitData,
  toggleAllPlanets,
  togglePlanet,
  currentFrequencies,
  distanceModeForDisplay,
  getPlanetColor,
  frequencyToNote
}) => {
  return (
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
  );
};

export default PlanetsTabContent;
