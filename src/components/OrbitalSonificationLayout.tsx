import React, { useCallback } from 'react';
import { ControlsProvider, ControlsContextType } from '../context/ControlsContext';
import { VisualizationProvider, VisualizationContextType } from '../context/VisualizationContext';
import PlanetarySystem from '../PlanetarySystem';
import FloatingControlsBar from './FloatingControlsBar';
import SidebarContent from './SidebarContent';
import InfoModal from './InfoModal';
import InstructionsModal from './InstructionsModal';
import { AudioErrorNotification } from './AudioErrorNotification';

interface OrbitalSonificationLayoutProps {
  controlsValue: ControlsContextType;
  visualizationValue: VisualizationContextType;
  needsUserInteraction: boolean;
  handleUserInteraction: () => Promise<void>;
}

const OrbitalSonificationLayout: React.FC<OrbitalSonificationLayoutProps> = ({
  controlsValue,
  visualizationValue,
  needsUserInteraction,
  handleUserInteraction
}) => {
  // Extract modal state from controlsValue to avoid redundant prop drilling
  const {
    isInfoModalOpen,
    setIsInfoModalOpen,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen
  } = controlsValue;

  // Memoize click handler
  const handleContainerClick = useCallback(async () => {
    if (needsUserInteraction) {
      await handleUserInteraction();
    }
  }, [needsUserInteraction, handleUserInteraction]);

  return (
    <ControlsProvider value={controlsValue}>
      <div className="container" onClick={handleContainerClick}>
        <div className="visualization-container">
          <div className="orbital-display">
            <VisualizationProvider value={visualizationValue}>
              <PlanetarySystem />
            </VisualizationProvider>
          </div>

          <FloatingControlsBar />
          <SidebarContent />
        </div>

        <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        <InstructionsModal isOpen={isInstructionsModalOpen} onClose={() => setIsInstructionsModalOpen(false)} />
        <AudioErrorNotification />
      </div>
    </ControlsProvider>
  );
};

export default OrbitalSonificationLayout;
