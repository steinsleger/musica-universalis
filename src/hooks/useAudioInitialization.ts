import { useCallback } from 'react';
import * as Tone from 'tone';
import { Planet, CurrentFrequencies } from '../types/domain';
import { AudioScalingConfig, SynthObject } from '../types/audio';
import { SynthManager } from '@/services/audio/SynthManager';

interface UseAudioInitializationParams {
  gainNodeRef: React.RefObject<Tone.Gain | null>;
  reverbRef: React.RefObject<Tone.Reverb | null>;
  synthManagerRef: React.RefObject<SynthManager>;
  synthsRef: React.RefObject<Record<string, SynthObject>>;
  gainNodesRef: React.RefObject<Record<string, Tone.Gain>>;
  activeSynthsRef: React.RefObject<Set<string>>;
  audioContextStarted: React.RefObject<boolean>;
  masterVolume: number;
  liveMode: boolean;
  orbitData: Planet[];
  currentFrequencies: CurrentFrequencies;
  audioScalingConfig: AudioScalingConfig;
  useFletcher: boolean;
  debugAudio: (message: string) => void;
  createIsolatedSynth: (planetName: string) => SynthObject | null;
  startPlanetSound: (planetName: string, frequency: number) => boolean;
}

interface AudioInitializationFunctions {
  initializeAudioContext: () => Promise<boolean>;
  recreateAllAudio: () => Promise<boolean>;
  forceRecalculateAllGains: () => void;
}

export const useAudioInitialization = ({
  gainNodeRef,
  reverbRef,
  synthManagerRef,
  synthsRef,
  gainNodesRef,
  activeSynthsRef,
  audioContextStarted,
  masterVolume,
  liveMode,
  orbitData,
  currentFrequencies,
  audioScalingConfig,
  useFletcher,
  debugAudio,
  createIsolatedSynth,
  startPlanetSound
}: UseAudioInitializationParams): AudioInitializationFunctions => {
  const initializeAudioContext = useCallback(async (): Promise<boolean> => {
    try {
      debugAudio('Initializing audio context');
      try {
        await Tone.start();
      } catch {
        debugAudio('Error starting Tone');
      }
      const context = Tone.getContext();
      if (context.state !== 'running') {
        try {
          await context.resume();
          debugAudio('Resumed Tone context');
        } catch {
          debugAudio('Error resuming Tone context');
        }
      }
      debugAudio(`Tone context state: ${context.state}`);
      if (gainNodeRef.current) {
        try {
          gainNodeRef.current.dispose();
        } catch {
          // Ignore disposal errors
        }
      }
      if (reverbRef.current) {
        try {
          reverbRef.current.dispose();
        } catch {
          // Ignore disposal errors
        }
      }
      const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.5 }).toDestination();
      await reverb.generate();
      reverbRef.current = reverb;
      synthManagerRef.current.setReverbNode(reverb);
      try {
        const masterGain = new Tone.Gain(masterVolume).connect(reverb);
        gainNodeRef.current = masterGain;
        Tone.getDestination().volume.value = Tone.gainToDb(masterVolume);
        audioContextStarted.current = true;
        return true;
      } catch {
        console.error('Error creating master gain node:');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }, [gainNodeRef, reverbRef, synthManagerRef, masterVolume, debugAudio, audioContextStarted]);

  const recreateAllAudio = useCallback(async (): Promise<boolean> => {
    debugAudio('FULL AUDIO SYSTEM RESET');
    try {
      synthManagerRef.current.disposeAll();
      synthsRef.current = {};
      gainNodesRef.current = {};
      activeSynthsRef.current.clear();
      await new Promise(resolve => setTimeout(resolve, 50));
      try {
        await Tone.start();
        debugAudio('Tone restarted');
      } catch {
        debugAudio('Error restarting Tone');
      }
      try {
        const context = Tone.getContext();
        if (context.state !== 'running') {
          await context.resume();
          debugAudio('Tone context resumed');
        }
      } catch {
        debugAudio('Error resuming Tone context');
      }
      for (const planet of orbitData) {
        try {
          createIsolatedSynth(planet.name);
        } catch {
          console.error(`Failed to create synth for ${planet.name} during reset:`);
        }
      }
      if (liveMode) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const enabledPlanets = orbitData.filter(planet => planet.enabled);
        let startedCount = 0;
        for (const planet of enabledPlanets) {
          try {
            if (currentFrequencies[planet.name]) {
              const success = startPlanetSound(planet.name, currentFrequencies[planet.name]);
              if (success) {
                startedCount++;
                debugAudio(`Successfully restarted sound for ${planet.name}`);
              }
            }
          } catch {
            console.error(`Failed to restart sound for ${planet.name}:`);
          }
        }
        debugAudio(`Restarted sounds for ${startedCount}/${enabledPlanets.length} planets`);
        if (enabledPlanets.length > 0 && startedCount === 0) {
          console.error('Failed to start any planet sounds during reset');
          return false;
        }
        setTimeout(() => {
          const enabledFrequencies: CurrentFrequencies = {};
          Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
            const planet = orbitData.find(p => p.name === planetName);
            if (planet && planet.enabled && freq) {
              enabledFrequencies[planetName] = freq;
            }
          });
          synthManagerRef.current.updateAllGains(enabledFrequencies, audioScalingConfig, useFletcher);
          Object.keys(enabledFrequencies).forEach(planetName => {
            const synthObj = synthManagerRef.current.getSynth(planetName);
            if (synthObj) {
              synthsRef.current[planetName] = synthObj;
              gainNodesRef.current[planetName] = synthObj.gain;
            }
          });
        }, 100);
      }
      return true;
    } catch {
      console.error('Failed to recreate audio system:');
      return false;
    }
  }, [synthManagerRef, synthsRef, gainNodesRef, activeSynthsRef, orbitData, liveMode, currentFrequencies, createIsolatedSynth, startPlanetSound, debugAudio, audioScalingConfig, useFletcher]);

  const forceRecalculateAllGains = useCallback((): void => {
    const enabledFrequencies: CurrentFrequencies = {};
    Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
      const planet = orbitData.find(p => p.name === planetName);
      if (planet && planet.enabled && freq) {
        enabledFrequencies[planetName] = freq;
      }
    });

    synthManagerRef.current.updateAllGains(enabledFrequencies, audioScalingConfig, useFletcher);

    Object.keys(enabledFrequencies).forEach(planetName => {
      const synthObj = synthManagerRef.current.getSynth(planetName);
      if (synthObj) {
        synthsRef.current[planetName] = synthObj;
        gainNodesRef.current[planetName] = synthObj.gain;
      }
    });
  }, [currentFrequencies, orbitData, synthManagerRef, synthsRef, gainNodesRef, audioScalingConfig, useFletcher]);

  return {
    initializeAudioContext,
    recreateAllAudio,
    forceRecalculateAllGains
  };
};
