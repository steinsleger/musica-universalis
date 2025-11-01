import React from 'react';
import { ControlsProvider } from '../context/ControlsContext';
import { VisualizationProvider } from '../context/VisualizationContext';
import PlanetarySystem from '../PlanetarySystem';
import FloatingControlsBar from './FloatingControlsBar';
import SidebarContent from './SidebarContent';
import InfoModal from './InfoModal';
import InstructionsModal from './InstructionsModal';
import { ControlsContextType } from '../context/ControlsContext';
import { VisualizationContextType } from '../context/VisualizationContext';

interface OrbitalSonificationLayoutProps {
  controlsValue: ControlsContextType;
  visualizationValue: VisualizationContextType;
  needsUserInteraction: boolean;
  handleUserInteraction: () => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  isInstructionsModalOpen: boolean;
  setIsInstructionsModalOpen: (open: boolean) => void;
}

const OrbitalSonificationLayout: React.FC<OrbitalSonificationLayoutProps> = ({
  controlsValue,
  visualizationValue,
  needsUserInteraction,
  handleUserInteraction,
  isInfoModalOpen,
  setIsInfoModalOpen,
  isInstructionsModalOpen,
  setIsInstructionsModalOpen
}) => {
  return (
    <ControlsProvider value={controlsValue}>
      <div
        className="container"
        onClick={needsUserInteraction ? handleUserInteraction : undefined}
      >
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
      </div>
    </ControlsProvider>
  );
};

export default OrbitalSonificationLayout;
