// src/OrbitalSonification.tsx
import React from 'react';
import { AudioConfigProvider } from './context/AudioConfigContext';
import { OrbitStateProvider } from './context/OrbitStateContext';
import OrbitalSonificationContainer from './components/OrbitalSonificationContainer';

/**
 * OrbitalSonification
 *
 * Entry point component that wraps the application with base contexts:
 * - AudioConfigProvider: Audio configuration (masterVolume, baseFrequency, sequenceBPM)
 * - OrbitalStateProvider: Unified state for orbital + audio + UI (merged contexts)
 *
 * The actual orchestration and presentation logic is delegated to:
 * - OrbitalSonificationContainer: Orchestrates services and state
 * - OrbitalSonificationPresenter: Pure presentation component
 *
 * This refactored version uses:
 * - Service-based architecture (AudioProvider, FrequencyCalculator, AudioSafetyService)
 * - Consolidated hooks (useAudioProvider, useAudioPlayback, useFrequency)
 * - Merged contexts (OrbitalStateContext combines 4 previous contexts)
 */
const OrbitalSonification: React.FC = () => (
  <AudioConfigProvider>
    <OrbitStateProvider>
      <OrbitalSonificationContainer />
    </OrbitStateProvider>
  </AudioConfigProvider>
);

export default OrbitalSonification;
