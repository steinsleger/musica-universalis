import React from 'react';
import { FrequencyMode } from '../types';

interface ControlsTabContentProps {
  activeTab: string;
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
  volumeToDb: (volume: number) => string;
}

const ControlsTabContent: React.FC<ControlsTabContentProps> = ({
  activeTab,
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
  volumeToDb
}) => {
  if (activeTab !== 'controls') return null;

  return (
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
  );
};

export default React.memo(ControlsTabContent);
