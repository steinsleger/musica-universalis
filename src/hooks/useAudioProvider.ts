import { useEffect, useRef } from 'react';
import { AudioProvider, AudioContextState } from '../services/audio/AudioProvider';
import { ToneAudioProvider } from '../services/audio/ToneAudioProvider';

/**
 * Hook to manage the AudioProvider lifecycle
 * Initializes audio system on mount, handles resume on user interaction
 * Replaces: useAudioContext + useAudioContextManager + useAudioInitialization + useAudioReferences
 */
export const useAudioProvider = () => {
  const providerRef = useRef<AudioProvider | null>(null);
  const initializationAttemptsRef = useRef(0);
  const maxInitializationAttempts = 3;

  useEffect(() => {
    // Initialize audio provider
    const initializeAudio = async () => {
      try {
        if (!providerRef.current) {
          const provider = new ToneAudioProvider();
          await provider.initialize();
          providerRef.current = provider;
          initializationAttemptsRef.current = 0;
        }
      } catch (error) {
        console.error('[AUDIO PROVIDER] Initialization failed:', error);
        initializationAttemptsRef.current += 1;

        // Retry with exponential backoff
        if (initializationAttemptsRef.current < maxInitializationAttempts) {
          const delay = Math.pow(2, initializationAttemptsRef.current) * 1000;
          setTimeout(initializeAudio, delay);
        }
      }
    };

    initializeAudio();

    // Cleanup on unmount
    return () => {
      if (providerRef.current) {
        try {
          providerRef.current.disposeAll();
          providerRef.current = null;
        } catch (error) {
          console.error('[AUDIO PROVIDER] Cleanup failed:', error);
        }
      }
    };
  }, []);

  // Handle document click to resume audio context if needed
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (providerRef.current) {
        try {
          await providerRef.current.resumeIfNeeded();
        } catch (error) {
          console.error('[AUDIO PROVIDER] Resume failed:', error);
        }
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  /**
   * Get the audio provider instance
   */
  const getProvider = (): AudioProvider | null => {
    return providerRef.current;
  };

  /**
   * Get current audio context state
   */
  const getContextState = (): AudioContextState => {
    if (!providerRef.current) {
      return {
        isRunning: false,
        needsUserInteraction: true
      };
    }
    return providerRef.current.getContextState();
  };

  /**
   * Check if audio context is ready
   */
  const isReady = (): boolean => {
    const state = getContextState();
    return state.isRunning;
  };

  /**
   * Resume audio context if needed
   */
  const resume = async (): Promise<void> => {
    if (providerRef.current) {
      await providerRef.current.resumeIfNeeded();
    }
  };

  return {
    getProvider,
    getContextState,
    isReady,
    resume,
    providerRef
  };
};
