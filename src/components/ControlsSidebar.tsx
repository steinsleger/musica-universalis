import React, { useState } from 'react';
import { TabType } from '../utils/types';
import PlaybackControls from './PlaybackControls';
import PlanetsList from './PlanetsList';
import AudioSettingsPanel from './AudioSettingsPanel';

interface ControlsSidebarProps {
  onClose?: () => void;
}

const ControlsSidebar: React.FC<ControlsSidebarProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('controls');

  return (
    <div className="controls-sidebar">
      <div className="sidebar-header">
        <h2>Controls</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        )}
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          Controls
        </button>
        <button
          className={`tab ${activeTab === 'planets' ? 'active' : ''}`}
          onClick={() => setActiveTab('planets')}
        >
          Planets
        </button>
        <button
          className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'controls' && <PlaybackControls />}
        {activeTab === 'planets' && <PlanetsList />}
        {activeTab === 'audio' && <AudioSettingsPanel />}
      </div>
    </div>
  );
};

export default ControlsSidebar;
