import React, { useState } from 'react';
import { useOrbitState } from '../context/OrbitStateContext';
import { useAudioConfig } from '../context/AudioConfigContext';
import PlanetarySystem from '../PlanetarySystem';

interface OrbitVisualizationProps {
  onFrequencyChange?: (frequencies: Record<string, number>) => void;
  currentlyPlayingPlanet?: string | null;
}

const OrbitVisualization: React.FC<OrbitVisualizationProps> = ({
  onFrequencyChange,
  currentlyPlayingPlanet
}) => {
  const { orbitData, isPaused, animationSpeed, zoomLevel, setZoomLevel, distanceMode, positionMode, setPositionMode } = useOrbitState();
  const { baseFrequency, sequenceBPM } = useAudioConfig();
  const [showPositionMenu, setShowPositionMenu] = useState(false);

  const handlePositionPreset = (preset: 'average' | 'aphelion' | 'perihelion') => {
    setPositionMode(preset);
    setShowPositionMenu(false);
  };

  return (
    <div className="orbit-visualization-wrapper">
      <div className="visualization-header">
        <h1>Musica Universalis</h1>
        <div className="visualization-controls">
          <button
            className="btn menu-btn"
            onClick={() => setShowPositionMenu(!showPositionMenu)}
          >
            Position Presets
          </button>

          {showPositionMenu && (
            <div className="position-menu">
              <button onClick={() => handlePositionPreset('average')}>
                Average Distance
              </button>
              <button onClick={() => handlePositionPreset('aphelion')}>
                Aphelion (Farthest)
              </button>
              <button onClick={() => handlePositionPreset('perihelion')}>
                Perihelion (Closest)
              </button>
            </div>
          )}

          <div className="zoom-control">
            <label htmlFor="zoom-level">Zoom</label>
            <input
              id="zoom-level"
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            />
            <span className="zoom-value">{zoomLevel.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      <div className="visualization-info">
        <div className="info-item">
          <span className="label">Planets Enabled:</span>
          <span className="value">{orbitData.filter(p => p.enabled).length}</span>
        </div>
        <div className="info-item">
          <span className="label">Distance Mode:</span>
          <span className="value">{distanceMode === 'titiusBode' ? "Murch's Formula" : 'Actual'}</span>
        </div>
        {currentlyPlayingPlanet && (
          <div className="info-item now-playing">
            <span className="label">Now Playing:</span>
            <span className="value">{currentlyPlayingPlanet}</span>
          </div>
        )}
      </div>

      <PlanetarySystem
        orbitData={orbitData}
        animationSpeed={animationSpeed}
        baseFrequency={baseFrequency}
        onFrequencyChange={onFrequencyChange || (() => {})}
        isPaused={isPaused}
        setToAverageDistance={positionMode === 'average'}
        setToAphelion={positionMode === 'aphelion'}
        setToPerihelion={positionMode === 'perihelion'}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        distanceMode={distanceMode}
        currentlyPlayingPlanet={currentlyPlayingPlanet}
        sequenceBPM={sequenceBPM}
      />
    </div>
  );
};

export default OrbitVisualization;
