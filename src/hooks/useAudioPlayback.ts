import { useCallback, useRef, useMemo } from 'react';
import { AudioProvider } from '../services/audio/AudioProvider';
import { Planet, CurrentFrequencies, AudioScalingConfig } from '../types';
import { AudioSafetyService } from '../services/audio/AudioSafetyService';

interface PlaybackState {
  isPlaying: boolean;
  liveMode: boolean;
  loopSequence: boolean;
  currentlyPlayingPlanet: string | undefined;
}

interface PlaybackHandlers {
  togglePlayPause: (audioProvider: AudioProvider, _planets: Planet[], _baseFrequency: number) => Promise<void>;
  playOrbitalSequence: (audioProvider: AudioProvider, planets: Planet[], bpm: number, frequencies: CurrentFrequencies) => Promise<void>;
  stopAll: (audioProvider: AudioProvider) => void;
  updateFrequencies: (audioProvider: AudioProvider, frequencies: CurrentFrequencies, audioScalingConfig: AudioScalingConfig, useFletcher: boolean) => void;
}

/**
 * Hook to manage audio playback state and operations
 * Handles play/pause, sequence playback, and live mode
 * Replaces: useLiveModeAudio + useSequencePlayback + useAudioState
 */
export const useAudioPlayback = (
  initialState: PlaybackState,
  onStateChange: (state: Partial<PlaybackState>) => void
) => {
  const sequenceTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const sequenceSynthRef = useRef<unknown | null>(null);

  /**
   * Stop all active sequences and sounds
   */
  const stopAll = useCallback((audioProvider: AudioProvider) => {
    // Clear any pending sequence timeouts
    sequenceTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    sequenceTimeoutsRef.current = [];

    // Dispose sequence synth if it exists
    if (sequenceSynthRef.current) {
      sequenceSynthRef.current = audioProvider.disposePolySynth(sequenceSynthRef.current);
    }

    // Stop all planet synths
    const activeSynths = audioProvider.getActiveSynths();
    activeSynths.forEach(planetName => {
      audioProvider.stopSound(planetName);
    });
  }, []);

  /**
   * Play orbital sequence - plays planets in sequence with timing
   */
  const playOrbitalSequence = useCallback(
    async (
      audioProvider: AudioProvider,
      planets: Planet[],
      bpm: number,
      frequencies: CurrentFrequencies
    ): Promise<void> => {
      // Stop any existing sequence
      stopAll(audioProvider);

      const enabledPlanets = planets.filter(p => p.enabled);
      if (enabledPlanets.length === 0) return;

      const timing = audioProvider.calculateSequenceTiming(bpm);
      let delay = 0;

      // Create sequence synth for playback
      sequenceSynthRef.current = audioProvider.createPolySynth();
      if (!sequenceSynthRef.current) {
        console.error('[PLAYBACK] Failed to create sequence synth');
        return;
      }

      // Schedule each planet to play in sequence
      enabledPlanets.forEach((planet, _index) => {
        const timeout = setTimeout(() => {
          const frequency = frequencies[planet.name];
          if (frequency && sequenceSynthRef.current) {
            try {
              const gain = AudioSafetyService.calculateFrequencyGain(frequency);
              audioProvider.triggerNote(planet.name, frequency, gain, timing.noteDuration);
              onStateChange({ currentlyPlayingPlanet: planet.name });
            } catch (error) {
              console.error(`[PLAYBACK] Error playing ${planet.name}:`, error);
            }
          }
        }, delay);

        sequenceTimeoutsRef.current.push(timeout);
        delay += timing.interval * 1000;
      });

      // Schedule loop if enabled
      if (initialState.loopSequence) {
        const loopTimeout = setTimeout(
          () => playOrbitalSequence(audioProvider, planets, bpm, frequencies),
          delay
        );
        sequenceTimeoutsRef.current.push(loopTimeout);
      } else {
        // Clear playing indicator after sequence ends
        const clearTimeout = setTimeout(
          () => onStateChange({ currentlyPlayingPlanet: undefined }),
          delay + 500
        );
        sequenceTimeoutsRef.current.push(clearTimeout);
      }
    },
    [initialState.loopSequence, onStateChange, stopAll]
  );

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(
    async (
      audioProvider: AudioProvider,
      _planets: Planet[],
      _baseFrequency: number
    ): Promise<void> => {
      if (initialState.isPlaying) {
        // Stop playback
        stopAll(audioProvider);
        onStateChange({ isPlaying: false, currentlyPlayingPlanet: undefined });
      } else {
        // Start sequence playback
        try {
          await audioProvider.resumeIfNeeded();
          onStateChange({ isPlaying: true });
          // The actual sequence playback should be triggered by parent component
          // after this state is updated
        } catch (error) {
          console.error('[PLAYBACK] Failed to start playback:', error);
          onStateChange({ isPlaying: false });
        }
      }
    },
    [initialState.isPlaying, onStateChange, stopAll]
  );

  /**
   * Update frequencies during live mode
   */
  const updateFrequencies = useCallback(
    (
      audioProvider: AudioProvider,
      frequencies: CurrentFrequencies,
      audioScalingConfig: AudioScalingConfig,
      useFletcher: boolean
    ) => {
      // Update gains for all active synths
      audioProvider.updateAllGains(frequencies, audioScalingConfig, useFletcher);
    },
    []
  );

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    sequenceTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    sequenceTimeoutsRef.current = [];
  }, []);

  const handlers: PlaybackHandlers = useMemo(
    () => ({
      togglePlayPause,
      playOrbitalSequence,
      stopAll,
      updateFrequencies
    }),
    [togglePlayPause, playOrbitalSequence, stopAll, updateFrequencies]
  );

  return {
    handlers,
    cleanup,
    state: initialState
  };
};
