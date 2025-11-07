import { useState } from 'react';
import { TabType } from '../types';

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

/**
 * @deprecated Use useUIHandlers instead, which consolidates UI state and event handling.
 * useUIState will be removed in a future refactor after the container is migrated.
 */
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
