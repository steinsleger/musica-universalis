import React, { useCallback } from 'react';
import PlanetarySystem from '../PlanetarySystem';
import FloatingControlsBar from './FloatingControlsBar';
import SidebarContent from './SidebarContent';
import InfoModal from './InfoModal';
import InstructionsModal from './InstructionsModal';
import { AudioErrorNotification } from './AudioErrorNotification';
import { CurrentFrequencies } from '../types';

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

      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <InstructionsModal isOpen={isInstructionsModalOpen} onClose={() => setIsInstructionsModalOpen(false)} />
      <AudioErrorNotification />
    </div>
  );
};

export default OrbitalSonificationLayout;
