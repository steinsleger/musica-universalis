// src/OrbitalSonification.tsx
import React from 'react';
import { OrbitalStateProvider } from './context/OrbitalStateContext';
import OrbitalSonificationContainer from './components/OrbitalSonificationContainer';

/**
 * OrbitalSonification
 *
 * Entry point component that wraps the application with base contexts:
 * - OrbitalStateProvider: Unified state for orbital + audio + UI + configuration
 *   (merged from: OrbitStateContext, AudioControlsContext, UIControlsContext,
 *    VisualizationControlsContext, and AudioConfigContext)
 *
 * The actual orchestration and presentation logic is delegated to:
 * - OrbitalSonificationContainer: Orchestrates services and state
 * - OrbitalSonificationPresenter: Pure presentation component
 *
 * This refactored version uses:
 * - Single source of truth: OrbitalStateContext for all state
 * - Service-based architecture (AudioProvider, FrequencyCalculator, AudioSafetyService)
 * - Consolidated hooks (useAudioProvider, useAudioPlayback, useFrequency)
 */
const OrbitalSonification: React.FC = () => (
  <OrbitalStateProvider>
    <OrbitalSonificationContainer />
  </OrbitalStateProvider>
);

export default OrbitalSonification;
