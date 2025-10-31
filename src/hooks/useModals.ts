import { useState, useCallback, useEffect } from 'react';

interface UseModalsParams {
  onEscapePressed?: () => void;
}

/**
 * Custom hook for managing modal state and keyboard interactions
 */
export const useModals = ({ onEscapePressed }: UseModalsParams = {}) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState<boolean>(false);

  // Handle Escape key to close modals and call optional callback
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsInfoModalOpen(false);
        setIsInstructionsModalOpen(false);
        onEscapePressed?.();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onEscapePressed]);

  const openInfoModal = useCallback(() => {
    setIsInfoModalOpen(true);
  }, []);

  const closeInfoModal = useCallback(() => {
    setIsInfoModalOpen(false);
  }, []);

  const openInstructionsModal = useCallback(() => {
    setIsInstructionsModalOpen(true);
  }, []);

  const closeInstructionsModal = useCallback(() => {
    setIsInstructionsModalOpen(false);
  }, []);

  return {
    isInfoModalOpen,
    setIsInfoModalOpen,
    openInfoModal,
    closeInfoModal,
    isInstructionsModalOpen,
    setIsInstructionsModalOpen,
    openInstructionsModal,
    closeInstructionsModal
  };
};
