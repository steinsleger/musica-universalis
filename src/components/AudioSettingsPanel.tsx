import React from 'react';
import { useAudioConfig } from '../hooks/useAudioConfig';
import {
  DEFAULT_REFERENCE_FREQUENCY,
  DEFAULT_SCALING_FACTOR,
  DEFAULT_MINIMUM_GAIN,
  DEFAULT_MAXIMUM_GAIN
} from '../utils/constants';

const AudioSettingsPanel: React.FC = () => {
  const {
    baseFrequency,
    setBaseFrequency,
    masterVolume,
    setMasterVolume,
    useFletcher,
    setUseFletcher,
    audioScalingConfig,
    setAudioScalingConfig
  } = useAudioConfig();

  const handleReferenceFrqChange = (value: number) => {
    setAudioScalingConfig({
      ...audioScalingConfig,
      referenceFrequency: value
    });
  };

  const handleScalingFactorChange = (value: number) => {
    setAudioScalingConfig({
      ...audioScalingConfig,
      scalingFactor: value
    });
  };

  const handleResetConfig = () => {
    setAudioScalingConfig({
      referenceFrequency: DEFAULT_REFERENCE_FREQUENCY,
      scalingFactor: DEFAULT_SCALING_FACTOR,
      minimumGain: DEFAULT_MINIMUM_GAIN,
      maximumGain: DEFAULT_MAXIMUM_GAIN,
      highFrequencyCutoff: 2000,
      highFrequencyScalingFactor: 0.6
    });
  };

  return (
    <div className="audio-settings-panel">
      <div className="control-group">
        <label htmlFor="base-frequency">Base Frequency</label>
        <input
          id="base-frequency"
          type="number"
          min="10"
          max="440"
          value={baseFrequency}
          onChange={(e) => setBaseFrequency(Math.max(10, Math.min(440, parseInt(e.target.value))))}
        />
        <span className="unit">Hz</span>
      </div>

      <div className="control-group">
        <label htmlFor="master-volume">Master Volume</label>
        <input
          id="master-volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
        />
        <span className="value">{(masterVolume * 100).toFixed(0)}%</span>
      </div>

      <div className="control-group">
        <label htmlFor="reference-frequency">Reference Frequency (Hz)</label>
        <input
          id="reference-frequency"
          type="number"
          min="20"
          max="200"
          value={audioScalingConfig.referenceFrequency}
          onChange={(e) => handleReferenceFrqChange(parseInt(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label htmlFor="scaling-factor">Gain Scaling Factor</label>
        <input
          id="scaling-factor"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audioScalingConfig.scalingFactor}
          onChange={(e) => handleScalingFactorChange(parseFloat(e.target.value))}
        />
        <span className="value">{audioScalingConfig.scalingFactor.toFixed(2)}</span>
      </div>

      <div className="control-group fletcher">
        <label htmlFor="fletcher-munson">
          <input
            id="fletcher-munson"
            type="checkbox"
            checked={useFletcher}
            onChange={(e) => setUseFletcher(e.target.checked)}
          />
          <span>Use Fletcher-Munson Curves</span>
        </label>
        <p className="info">
          Applies equal-loudness curves to match human hearing sensitivity
        </p>
      </div>

      <button className="btn reset-btn" onClick={handleResetConfig}>
        Reset to Defaults
      </button>
    </div>
  );
};

export default AudioSettingsPanel;
