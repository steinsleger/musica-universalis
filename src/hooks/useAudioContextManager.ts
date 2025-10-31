import { useCallback, MutableRefObject } from 'react';
import * as Tone from 'tone';

interface UseAudioContextManagerProps {
  audioContextStarted: MutableRefObject<boolean>;
  gainNodeRef: MutableRefObject<Tone.Gain | null>;
  debugAudio: (message: string) => void;
}

interface AudioContextManager {
  startAudioContext: () => Promise<boolean>;
  resumeAudioContextIfNeeded: () => Promise<boolean>;
  ensureGainNode: () => Tone.Gain | null;
}

/**
 * Hook for managing Tone.js audio context operations
 * Handles initialization, resumption, and state management
 */
export const useAudioContextManager = ({
  audioContextStarted,
  gainNodeRef,
  debugAudio
}: UseAudioContextManagerProps): AudioContextManager => {
  const startAudioContext = useCallback(async (): Promise<boolean> => {
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

        debugAudio('Audio context started');
        return true;
      } catch (error) {
        console.error('Could not start AudioContext:', error);
        return false;
      }
    } else if (Tone.context.state !== 'running') {
      try {
        await Tone.context.resume();
        debugAudio('Audio context resumed');
        return true;
      } catch (error) {
        console.error('Could not resume AudioContext:', error);
        return false;
      }
    }
    return true;
  }, [audioContextStarted, debugAudio]);

  const resumeAudioContextIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
        debugAudio('Audio context resumed');
      }
      return true;
    } catch (error) {
      console.error('Failed to resume audio context:', error);
      return false;
    }
  }, [debugAudio]);

  const ensureGainNode = useCallback((): Tone.Gain | null => {
    try {
      if (!gainNodeRef.current || gainNodeRef.current.disposed) {
        debugAudio('Creating new gain node');
        gainNodeRef.current = new Tone.Gain(1.0).toDestination();
      }
      return gainNodeRef.current;
    } catch (error) {
      console.error('Failed to ensure gain node:', error);
      return null;
    }
  }, [gainNodeRef, debugAudio]);

  return {
    startAudioContext,
    resumeAudioContextIfNeeded,
    ensureGainNode
  };
};
