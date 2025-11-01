import { useMemo } from 'react';
import { Planet, FrequencyMode, CurrentFrequencies } from '../utils/types';

interface UseVisualizationContextValueParams {
  orbitData: Planet[];
  animationSpeed: number;
  baseFrequency: number;
  onFrequencyChange: (frequencies: CurrentFrequencies) => void;
  isPaused: boolean;
  setToAverageDistance: boolean;
  setToAphelion: boolean;
  setToPerihelion: boolean;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  distanceMode: FrequencyMode;
  currentlyPlayingPlanet: string | null;
  sequenceBPM: number;
}

export const useVisualizationContextValue = (params: UseVisualizationContextValueParams) => {
  return useMemo(() => ({
    orbitData: params.orbitData,
    animationSpeed: params.animationSpeed,
    baseFrequency: params.baseFrequency,
    onFrequencyChange: params.onFrequencyChange,
    isPaused: params.isPaused,
    setToAverageDistance: params.setToAverageDistance,
    setToAphelion: params.setToAphelion,
    setToPerihelion: params.setToPerihelion,
    zoomLevel: params.zoomLevel,
    setZoomLevel: params.setZoomLevel,
    distanceMode: params.distanceMode,
    currentlyPlayingPlanet: params.currentlyPlayingPlanet,
    sequenceBPM: params.sequenceBPM
  }), [
    params.orbitData,
    params.animationSpeed,
    params.baseFrequency,
    params.onFrequencyChange,
    params.isPaused,
    params.setToAverageDistance,
    params.setToAphelion,
    params.setToPerihelion,
    params.zoomLevel,
    params.setZoomLevel,
    params.distanceMode,
    params.currentlyPlayingPlanet,
    params.sequenceBPM
  ]);
};
