import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

interface UseAudioContextReturn {
  needsUserInteraction: boolean;
  startAudio: () => Promise<boolean>;
  audioContextReady: boolean;
}

export const useAudioContext = (): UseAudioContextReturn => {
  const [needsUserInteraction, setNeedsUserInteraction] = useState(true);
  const audioContextStarted = useRef(false);

  useEffect(() => {
    const initializeTone = async (): Promise<void> => {
      try {
        if (Tone.context.state !== 'running') {
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
        Tone.Transport.stop();
        Tone.Transport.cancel();
      } catch {
        console.error('Error cleaning up Tone.js');
      }
    };
  }, []);

  const startAudio = useCallback(async (): Promise<boolean> => {
    if (!audioContextStarted.current) {
      try {
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }

        await Tone.start();
        audioContextStarted.current = true;

        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }

        setNeedsUserInteraction(false);
        return true;
      } catch (error) {
        console.error('Could not start AudioContext:', error);
        setNeedsUserInteraction(true);
        return false;
      }
    } else if (Tone.context.state !== 'running') {
      try {
        await Tone.context.resume();
        setNeedsUserInteraction(false);
        return true;
      } catch (error) {
        console.error('Could not resume AudioContext:', error);
        setNeedsUserInteraction(true);
        return false;
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
    needsUserInteraction,
    startAudio,
    audioContextReady: !needsUserInteraction
  };
};
