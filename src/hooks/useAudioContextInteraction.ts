import { useEffect, useCallback } from 'react';

interface UseAudioContextInteractionParams {
  needsUserInteraction: boolean;
  onUserInteraction: () => Promise<void>;
}

export const useAudioContextInteraction = ({
  needsUserInteraction,
  onUserInteraction
}: UseAudioContextInteractionParams): void => {
  const handleGlobalClick = useCallback(async (): Promise<void> => {
    await onUserInteraction();
  }, [onUserInteraction]);

  useEffect((): void | (() => void) => {
    if (needsUserInteraction) {
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('touchstart', handleGlobalClick);

      return () => {
        document.removeEventListener('click', handleGlobalClick);
        document.removeEventListener('touchstart', handleGlobalClick);
      };
    }
  }, [needsUserInteraction, handleGlobalClick]);
};
