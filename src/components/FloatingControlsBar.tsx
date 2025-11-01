import React from 'react';
import { useControls } from '../context/ControlsContext';

const FloatingControlsBar: React.FC = () => {
  const {
    isPaused,
    togglePlayPause,
    isPlaying,
    liveMode,
    playOrbitalSequence,
    toggleLiveMode,
    positionMode,
    setPositionMode,
    isInfoModalOpen,
    setIsInfoModalOpen,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen,
    sidebarCollapsed,
    toggleSidebar
  } = useControls();
  return (
    <>
      <div className="floating-controls fade-in" role="toolbar" aria-label="Playback and visualization controls">
        <button
          className="floating-button"
          onClick={togglePlayPause}
          title={isPaused ? 'Play Animation' : 'Pause Animation'}
          aria-label={isPaused ? 'Play orbital animation' : 'Pause orbital animation'}
        >
          {isPaused ? '▶️' : '⏸️'}
        </button>

        <button
          onClick={playOrbitalSequence}
          title={isPlaying ? 'Stop Sequence' : 'Play Orbital Sequence'}
          disabled={liveMode}
          className="floating-button"
          aria-label={isPlaying ? 'Stop orbital sequence' : 'Play orbital sequence'}
          aria-disabled={liveMode}
        >
          {isPlaying ? '⏹️' : '🪐'}
        </button>

        <button
          className="floating-button"
          onClick={toggleLiveMode}
          disabled={isPlaying}
          title={liveMode ? 'Disable Live Mode' : 'Enable Live Mode'}
          aria-label={liveMode ? 'Disable live audio mode' : 'Enable live audio mode'}
          aria-disabled={isPlaying}
          aria-pressed={liveMode}
          style={{
            backgroundColor: liveMode ? 'rgba(69, 160, 73, 0.5)' : 'rgba(0, 0, 0, 0)',
            opacity: isPlaying ? 0.5 : 1
          }}
        >
          🔊
        </button>

        <button
          className="floating-button"
          onClick={() => setPositionMode('average')}
          title="Set to Average Distance"
          aria-label="Set planets to average orbital distance"
          aria-pressed={positionMode === 'average'}
        >
          🔄
        </button>

        <button
          className="floating-button"
          onClick={() => setPositionMode('aphelion')}
          title="Set to Aphelion"
          aria-label="Set planets to aphelion (farthest position from sun)"
          aria-pressed={positionMode === 'aphelion'}
        >
          🌞
        </button>

        <button
          className="floating-button"
          onClick={() => setPositionMode('perihelion')}
          title="Set to Perihelion"
          aria-label="Set planets to perihelion (closest position to sun)"
          aria-pressed={positionMode === 'perihelion'}
        >
          ☀️
        </button>
      </div>

      <button
        className="instructions-button"
        onClick={() => setIsInstructionsModalOpen(!isInstructionsModalOpen)}
        title={isInstructionsModalOpen ? 'Close' : 'Help'}
        aria-label="Open help instructions"
        aria-expanded={isInstructionsModalOpen}
      >
        ❔
      </button>

      <button
        className="info-button"
        onClick={() => setIsInfoModalOpen(!isInfoModalOpen)}
        title={isInfoModalOpen ? 'Close' : 'About'}
        aria-label="Open information about the application"
        aria-expanded={isInfoModalOpen}
      >
        ℹ️
      </button>

      <button
        className="more-settings-button"
        onClick={toggleSidebar}
        title="More Settings"
        aria-label="Toggle settings sidebar"
        aria-expanded={!sidebarCollapsed}
        aria-disabled={isInfoModalOpen || isInstructionsModalOpen}
        disabled={isInfoModalOpen || isInstructionsModalOpen}
      >
        {sidebarCollapsed ? '⚙️' : '✖️'}
      </button>
    </>
  );
};

export default FloatingControlsBar;
