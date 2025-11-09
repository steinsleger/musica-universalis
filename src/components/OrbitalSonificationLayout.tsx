import React, { useCallback, Suspense, lazy } from 'react';
import PlanetarySystem from '../PlanetarySystem';
import FloatingControlsBar from './FloatingControlsBar';
import SidebarContent from './SidebarContent';
import { AudioErrorNotification } from './AudioErrorNotification';
import { CurrentFrequencies } from '../types';

const InfoModal = lazy(() => import('./InfoModal'));
const InstructionsModal = lazy(() => import('./InstructionsModal'));

interface OrbitalSonificationLayoutProps {
  controlsValue: unknown;
  needsUserInteraction: boolean;
  handleUserInteraction: () => Promise<void>;
  onFrequencyChange?: (frequencies: CurrentFrequencies) => void;
}

const OrbitalSonificationLayout: React.FC<OrbitalSonificationLayoutProps> = ({
  controlsValue,
  needsUserInteraction,
  handleUserInteraction,
  onFrequencyChange
}) => {
  // Extract modal state from controlsValue to avoid redundant prop drilling
  const {
    isInfoModalOpen,
    setIsInfoModalOpen,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen
  } = controlsValue as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Memoize click handler
  const handleContainerClick = useCallback(async () => {
    if (needsUserInteraction) {
      await handleUserInteraction();
    }
  }, [needsUserInteraction, handleUserInteraction]);

  return (
    <div className="container" onClick={handleContainerClick}>
      <div className="visualization-container">
        <div className="orbital-display">
          <PlanetarySystem onFrequencyChange={onFrequencyChange} />
        </div>

        <FloatingControlsBar />
        <SidebarContent />
      </div>

      {isInfoModalOpen && (
        <Suspense fallback={null}>
          <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        </Suspense>
      )}
      {isInstructionsModalOpen && (
        <Suspense fallback={null}>
          <InstructionsModal isOpen={isInstructionsModalOpen} onClose={() => setIsInstructionsModalOpen(false)} />
        </Suspense>
      )}
      <AudioErrorNotification />
    </div>
  );
};

export default OrbitalSonificationLayout;
