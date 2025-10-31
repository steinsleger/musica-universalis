import { useState, Dispatch, SetStateAction } from 'react';
import { CurrentFrequencies } from '../utils/types';

interface PlaybackState {
  isPlaying: boolean;
  liveMode: boolean;
  setLiveMode: (mode: boolean) => void;
  currentFrequencies: CurrentFrequencies;
  setCurrentFrequencies: Dispatch<SetStateAction<CurrentFrequencies>>;
  loopSequence: boolean;
  setLoopSequence: (loop: boolean) => void;
}

export const usePlaybackState = (): PlaybackState => {
  const [isPlaying] = useState<boolean>(false);
  const [liveMode, setLiveMode] = useState<boolean>(false);
  const [currentFrequencies, setCurrentFrequencies] = useState<CurrentFrequencies>({});
  const [loopSequence, setLoopSequence] = useState<boolean>(false);

  return {
    isPlaying,
    liveMode,
    setLiveMode,
    currentFrequencies,
    setCurrentFrequencies,
    loopSequence,
    setLoopSequence
  };
};
