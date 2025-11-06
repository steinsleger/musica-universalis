// src/OrbitalSonification.tsx
import React from 'react';
import { AudioConfigProvider } from './context/AudioConfigContext';
import { OrbitStateProvider } from './context/OrbitStateContext';
import OrbitalSonificationContainer from './components/OrbitalSonificationContainer';

/**
 * OrbitalSonification
 *
 * Entry point component that wraps the application with base contexts:
 * - AudioConfigProvider: Base audio configuration (masterVolume, baseFrequency, sequenceBPM, etc.)
 * - OrbitStateProvider: Base orbital state (orbitData, animationSpeed, distanceMode, etc.)
 *
 * The actual orchestration and presentation logic is delegated to:
 * - OrbitalSonificationContainer: State management and context building
 * - OrbitalSonificationPresenter: Pure presentation component
 */
const OrbitalSonification: React.FC = () => (
  <AudioConfigProvider>
    <OrbitStateProvider>
      <OrbitalSonificationContainer />
    </OrbitStateProvider>
  </AudioConfigProvider>
);

export default OrbitalSonification;
