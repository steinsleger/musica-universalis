import { useState, Dispatch, SetStateAction } from 'react';
import { CurrentFrequencies } from '../utils/types';

interface PlaybackState {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  liveMode: boolean;
  setLiveMode: (mode: boolean) => void;
  currentFrequencies: CurrentFrequencies;
  setCurrentFrequencies: Dispatch<SetStateAction<CurrentFrequencies>>;
  loopSequence: boolean;
  setLoopSequence: (loop: boolean) => void;
  currentlyPlayingPlanet: string | null;
  setCurrentlyPlayingPlanet: (planet: string | null) => void;
}

export const usePlaybackState = (): PlaybackState => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [liveMode, setLiveMode] = useState<boolean>(false);
  const [currentFrequencies, setCurrentFrequencies] = useState<CurrentFrequencies>({});
  const [loopSequence, setLoopSequence] = useState<boolean>(false);
  const [currentlyPlayingPlanet, setCurrentlyPlayingPlanet] = useState<string | null>(null);

  return {
    isPlaying,
    setIsPlaying,
    liveMode,
    setLiveMode,
    currentFrequencies,
    setCurrentFrequencies,
    loopSequence,
    setLoopSequence,
    currentlyPlayingPlanet,
    setCurrentlyPlayingPlanet
  };
};
