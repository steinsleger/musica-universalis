import React, { createContext, ReactNode } from 'react';
import { TabType } from '../types';

/**
 * UIControlsContext manages UI-only state
 * Includes sidebar, tab, and modal visibility
 * Separated from business logic contexts to avoid unnecessary re-renders
 */
export interface UIControlsContextType {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  isInstructionsModalOpen: boolean;
  setIsInstructionsModalOpen: (open: boolean) => void;
}

const UIControlsContext = createContext<UIControlsContextType | undefined>(undefined);

interface UIControlsProviderProps {
  children: ReactNode;
  value: UIControlsContextType;
}

export const UIControlsProvider: React.FC<UIControlsProviderProps> = ({ children, value }) => (
  <UIControlsContext.Provider value={value}>
    {children}
  </UIControlsContext.Provider>
);

export { UIControlsContext };
