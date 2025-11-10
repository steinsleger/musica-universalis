import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

interface UseAudioProviderReturn {
  needsUserInteraction: boolean;
}

/**
 * useAudioProvider - Comprehensive audio context management hook
 *
 * Manages:
 * - Tone.js audio context initialization
 * - User interaction requirements for audio playback
 * - Audio context lifecycle and cleanup
 *
 * Benefits:
 * - Single responsibility for audio context management
 * - Handles browser autoplay restrictions
 * - Proper cleanup on unmount
 */
export const useAudioProvider = (): UseAudioProviderReturn => {
  const [needsUserInteraction, setNeedsUserInteraction] = useState(true);
  const audioContextStarted = useRef(false);

  useEffect(() => {
    const initializeTone = async (): Promise<void> => {
      try {
        const context = Tone.getContext();
        if (context.state !== 'running') {
          try {
            await Tone.start();
          } catch {
            console.error('Failed to start Tone.js');
          }
        }
      } catch {
        console.error('Error initializing Tone.js');
      }
    };

    initializeTone();

    return () => {
      try {
        const transport = Tone.getTransport();
        transport.stop();
        transport.cancel();
      } catch {
        console.error('Error cleaning up Tone.js');
      }
    };
  }, []);

  const startAudio = useCallback(async (): Promise<boolean> => {
    if (!audioContextStarted.current) {
      try {
        const context = Tone.getContext();
        if (context.state !== 'running') {
          await context.resume();
        }

        await Tone.start();
        audioContextStarted.current = true;

        const contextAfterStart = Tone.getContext();
        if (contextAfterStart.state !== 'running') {
          await contextAfterStart.resume();
        }

        setNeedsUserInteraction(false);
        return true;
      } catch (error) {
        console.error('Could not start AudioContext:', error);
        setNeedsUserInteraction(true);
        return false;
      }
    } else {
      const context = Tone.getContext();
      if (context.state !== 'running') {
        try {
          await context.resume();
          setNeedsUserInteraction(false);
          return true;
        } catch (error) {
          console.error('Could not resume AudioContext:', error);
          setNeedsUserInteraction(true);
          return false;
        }
      }
    }

    return true;
  }, []);

  useEffect((): void | (() => void) => {
    if (!needsUserInteraction) {
      return;
    }

    const handleGlobalClick = async (): Promise<void> => {
      await startAudio();
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [needsUserInteraction, startAudio]);

  return {
    needsUserInteraction
  };
};
