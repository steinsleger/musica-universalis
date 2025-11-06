import React from 'react';
import { AudioScalingConfig } from '../utils/types';

interface AudioTabContentProps {
  activeTab: string;
  useFletcher: boolean;
  toggleFletcherCurves: () => void;
  audioScalingConfig: AudioScalingConfig;
  setAudioScalingConfig: (config: AudioScalingConfig) => void;
  forceRecalculateAllGains: () => void;
}

const AudioTabContent: React.FC<AudioTabContentProps> = ({
  useFletcher,
  toggleFletcherCurves,
  audioScalingConfig,
  setAudioScalingConfig,
  forceRecalculateAllGains
}) => {
  return (
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
  );
};

export default React.memo(AudioTabContent);
