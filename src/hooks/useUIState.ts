import { useState } from 'react';
import { TabType } from '../utils/types';

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const useUIState = (): UIState => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('controls');

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    activeTab,
    setActiveTab
  };
};
