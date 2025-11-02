import React from 'react';
import { useOrbitState } from '../context/OrbitStateContext';
import { useAudioConfig } from '../context/AudioConfigContext';

interface PlaybackControlsProps {
  isPlaying?: boolean;
  onPlay?: () => void;
  isPlayingSequence?: boolean;
  onPlaySequence?: () => void;
  liveMode?: boolean;
  onLiveModeToggle?: (enabled: boolean) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  _isPlaying = false,
  onPlay,
  isPlayingSequence = false,
  onPlaySequence,
  liveMode = false,
  onLiveModeToggle
}) => {
  const { isPaused, setIsPaused, animationSpeed, setAnimationSpeed } = useOrbitState();
  const { sequenceBPM, setSequenceBPM } = useAudioConfig();

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
    onPlay?.();
  };

  const handleSequence = () => {
    onPlaySequence?.();
  };

  const handleLiveModeToggle = () => {
    onLiveModeToggle?.(!liveMode);
  };

  return (
    <div className="playback-controls">
      <div className="control-group">
        <label>Playback</label>
        <button
          className={`btn play-pause-btn ${isPaused ? 'paused' : 'playing'}`}
          onClick={handlePlayPause}
        >
          {isPaused ? '▶ Play' : '⏸ Pause'}
        </button>
      </div>

      <div className="control-group">
        <label htmlFor="animation-speed">Animation Speed</label>
        <input
          id="animation-speed"
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
        />
        <span className="value">{animationSpeed.toFixed(1)}x</span>
      </div>

      <div className="control-group">
        <label>Live Mode</label>
        <button
          className={`btn toggle-btn ${liveMode ? 'active' : ''}`}
          onClick={handleLiveModeToggle}
        >
          {liveMode ? '🔊 Live' : '🔈 Off'}
        </button>
      </div>

      <div className="control-group">
        <label>Sequence Playback</label>
        <button
          className={`btn sequence-btn ${isPlayingSequence ? 'playing' : ''}`}
          onClick={handleSequence}
        >
          {isPlayingSequence ? '⏹ Stop' : '▶ Play Sequence'}
        </button>
      </div>

      <div className="control-group">
        <label htmlFor="bpm">Sequence BPM</label>
        <input
          id="bpm"
          type="number"
          min="20"
          max="300"
          value={sequenceBPM}
          onChange={(e) => setSequenceBPM(Math.max(20, Math.min(300, parseInt(e.target.value))))}
        />
      </div>
    </div>
  );
};

export default PlaybackControls;
