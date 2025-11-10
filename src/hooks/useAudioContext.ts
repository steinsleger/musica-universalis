import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

interface UseAudioContextReturn {
  needsUserInteraction: boolean;
}

/**
 * @deprecated Use useAudioProvider instead, which provides comprehensive audio context management.
 * useAudioContext will be removed in a future refactor after the container is migrated.
 */
export const useAudioContext = (): UseAudioContextReturn => {
  const [needsUserInteraction, setNeedsUserInteraction] = useState(true);
  const audioContextStarted = useRef(false);

  // Note: startAudio is kept private as it's used internally by the hook
  // to manage audio context state in response to user interactions

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
