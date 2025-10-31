import { useState, useEffect, useRef } from 'react';

interface UseGlowEffectParams {
  currentlyPlayingPlanet: string | null;
  sequenceBPM: number;
}

export const useGlowEffect = ({
  currentlyPlayingPlanet,
  sequenceBPM
}: UseGlowEffectParams) => {
  const [glowOpacity, setGlowOpacity] = useState<number>(1);
  const glowAnimationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect((): void | (() => void) => {
    if (currentlyPlayingPlanet) {
      // Calculate pulse duration based on BPM
      const pulseDuration = 60 / sequenceBPM * 1000; // Convert to ms

      // Clear any existing interval
      if (glowAnimationRef.current) {
        clearInterval(glowAnimationRef.current);
      }

      // Create pulsing effect
      let increasing = false;
      let opacity = 0.5;

      glowAnimationRef.current = setInterval(() => {
        if (increasing) {
          opacity += 0.05;
          if (opacity >= 1) {
            opacity = 1;
            increasing = false;
          }
        } else {
          opacity -= 0.05;
          if (opacity <= 0.5) {
            opacity = 0.5;
            increasing = true;
          }
        }

        setGlowOpacity(opacity);
      }, pulseDuration / 20); // Adjust for smoother pulsing

      return () => {
        if (glowAnimationRef.current) {
          clearInterval(glowAnimationRef.current);
          glowAnimationRef.current = null;
        }
      };
    } else if (glowAnimationRef.current) {
      clearInterval(glowAnimationRef.current);
      glowAnimationRef.current = null;
    }
  }, [currentlyPlayingPlanet, sequenceBPM]);

  return glowOpacity;
};
