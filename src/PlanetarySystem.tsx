// src/PlanetarySystem.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Planet, CurrentFrequencies, PlanetarySystemProps } from './utils/types';
import { useOrbitalCalculations } from './hooks/useOrbitalCalculations';
import OrbitPath from './components/OrbitPath';
import PlanetNode from './components/PlanetNode';
import { getOrbitColor } from './utils/visualizationHelpers';

const PlanetarySystem: React.FC<PlanetarySystemProps> = ({
  orbitData,
  animationSpeed = 1,
  baseFrequency = 220,
  onFrequencyChange,
  isPaused = false,
  setToAverageDistance = false,
  setToAphelion = false,
  setToPerihelion = false,
  zoomLevel = 1,
  setZoomLevel,
  distanceMode = 'titiusBode',
  currentlyPlayingPlanet = null,
  sequenceBPM = 60
}) => {

  const [currentFrequencies, setCurrentFrequencies] = useState<CurrentFrequencies>({});
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [planetAngles, setPlanetAngles] = useState<Record<string, number>>({});
  const [glowOpacity, setGlowOpacity] = useState<number>(1);

  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frequenciesRef = useRef<Record<string, number>>({});
  const lastBaseFrequencyRef = useRef<number>(baseFrequency);
  const distanceModeRef = useRef<'titiusBode' | 'actual'>(distanceMode);
  const initializedRef = useRef<boolean>(false);
  const glowAnimationRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for visualization
  const svgSize = 600;
  const center = svgSize / 2;
  const minPlanetSize = 3;
  const sunRadius = 10;

  // Use orbital calculations hook
  const {
    getDistance,
    maxDistance,
    getEffectiveZoom,
    effectiveZoom,
    orbitScaleFactor,
    getCurrentDistance,
    getPlanetPosition,
    calculateOrbitalExtremes,
    generateEllipticalPath,
    getExtremePositions,
    getAverageDistanceAngle,
    getAphelionAngle,
    getPerihelionAngle,
    getPlanetSize,
    getOrbitalPeriod,
    frequencyToNote,
    calculateFrequencies
  } = useOrbitalCalculations({
    svgSize,
    center,
    zoomLevel,
    panOffset,
    orbitData,
    distanceMode,
    baseFrequency
  });

  // Animation loop - updates planet positions over time
  const animate = useCallback((time: number): void => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }

    // Calculate elapsed time since last frame
    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;

    // Always update positions if not paused
    if (!isPaused) {
      // Update planet angles based on animation speed and orbital periods
      setPlanetAngles(prevAngles => {
        const newAngles = { ...prevAngles };

        orbitData.forEach(planet => {
          // Calculate orbital period (Kepler's Third Law)
          const period = getOrbitalPeriod(getDistance(planet));

          // Convert period to radians per millisecond, scale by animation speed
          const angularVelocity = (2 * Math.PI / (period * 20000)) * animationSpeed;

          // Update the angle
          newAngles[planet.name] = (prevAngles[planet.name] || 0) + angularVelocity * deltaTime;

          // Normalize angle to keep within 0-2π range
          while (newAngles[planet.name] >= 2 * Math.PI) {
            newAngles[planet.name] -= 2 * Math.PI;
          }
        });

        return newAngles;
      });
    }

    // Calculate and update frequencies based on current positions
    const newFrequencies: Record<string, number> = {};
    orbitData.forEach((planet, index) => {
      const angle = planetAngles[planet.name] || 0;
      const currentDistance = getCurrentDistance(getDistance(planet), planet.eccentricity, angle);

      // Calculate base frequency for this planet based on distance mode
      const baseFreq = calculateFrequencies(baseFrequency, planet, index);

      // Modulate frequency based on current distance
      const avgDistance = getDistance(planet);
      const ratio = currentDistance / avgDistance;
      const modifiedFreq = baseFreq * Math.sqrt(ratio);

      newFrequencies[planet.name] = modifiedFreq;
    });

    // Store frequencies for parent component
    setCurrentFrequencies(newFrequencies);
    frequenciesRef.current = newFrequencies;

    // Request next frame
    requestRef.current = requestAnimationFrame(animate);
  }, [isPaused, animationSpeed, orbitData, baseFrequency, planetAngles, distanceMode]);

  // Function to notify frequency changes to the parent component
  // Throttled to avoid excessive updates
  const notifyFrequencyChanges = useCallback((): void => {
    if (onFrequencyChange) {
      onFrequencyChange(frequenciesRef.current);
    }
  }, [onFrequencyChange]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY;
    const zoomSpeed = 0.1;

    // Calculate new zoom level
    const newZoom = zoomLevel * (1 + (delta > 0 ? -zoomSpeed : zoomSpeed));

    // Clamp zoom level between 1 and 20
    const clampedZoom = Math.max(1, Math.min(40, newZoom));

    // Update zoom level through prop
    if (setZoomLevel) {
      setZoomLevel(clampedZoom);
    }
  }, [zoomLevel, setZoomLevel]);

  // Effect to update calculations when distance mode changes
  useEffect(() => {
    if (distanceModeRef.current !== distanceMode) {
      // Distance mode changed, update reference
      distanceModeRef.current = distanceMode;

      // Recalculate frequencies if callback is provided
      if (onFrequencyChange && !isPaused) {
        const updatedFrequencies: Record<string, number> = {};

        orbitData.forEach((planet, index) => {
          const angle = planetAngles[planet.name] || 0;
          const currentDistance = getCurrentDistance(getDistance(planet), planet.eccentricity, angle);

          // Calculate base frequency based on distance mode
          const baseFreq = calculateFrequencies(baseFrequency, planet, index);

          // Modulate frequency based on current distance
          const avgDistance = getDistance(planet);
          const ratio = currentDistance / avgDistance;
          const modifiedFreq = baseFreq * Math.sqrt(ratio);

          updatedFrequencies[planet.name] = modifiedFreq;
        });

        onFrequencyChange(updatedFrequencies);
      }
    }
  }, [distanceMode, orbitData, planetAngles, onFrequencyChange, isPaused, baseFrequency]);

  // Initialize planet angles when orbitData changes
  useEffect(() => {
    if (!orbitData || orbitData.length === 0) return;
    if (Object.keys(planetAngles).length > 0) return; // Don't reset if already set

    // Initialize angles for all planets - all at 0 for a straight line
    const initialAngles: Record<string, number> = {};
    orbitData.forEach(planet => {
      // Set all planets at angle 0 for straight line to the right
      initialAngles[planet.name] = 0;
    });

    setPlanetAngles(initialAngles);
  }, [orbitData]);

  // Initialize frequencies when component mounts or baseFrequency changes
  useEffect(() => {
    if (initializedRef.current) return;

    const initialFrequencies: Record<string, number> = {};
    orbitData.forEach((planet, index) => {
      const baseFreq = calculateFrequencies(baseFrequency, planet, index);
      initialFrequencies[planet.name] = baseFreq;
    });

    setCurrentFrequencies(initialFrequencies);
    frequenciesRef.current = initialFrequencies;
    if (onFrequencyChange) {
      onFrequencyChange(initialFrequencies);
    }

    initializedRef.current = true;
  }, [baseFrequency, orbitData, onFrequencyChange, distanceMode]);

  // Add wheel event listener with non-passive option
  useEffect((): void | (() => void) => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  // Reset pan offset when zoom level changes to 1
  useEffect(() => {
    if (zoomLevel <= 1.1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Set up a notification interval
  useEffect(() => {
    const notifyInterval = setInterval(() => {
      notifyFrequencyChanges();
    }, 16); // Notify every 16ms

    return () => {
      clearInterval(notifyInterval);
    };
  }, [notifyFrequencyChanges]);

  // Separate effect to update when baseFrequency changes
  useEffect(() => {
    // Check if baseFrequency has actually changed
    if (lastBaseFrequencyRef.current !== baseFrequency) {
      lastBaseFrequencyRef.current = baseFrequency;
    }
  }, [baseFrequency]);

  // Add effect to handle position jumps
  useEffect(() => {
    if (setToAverageDistance || setToAphelion || setToPerihelion) {
      setPlanetAngles(prevAngles => {
        const newAngles = { ...prevAngles };
        orbitData.forEach(planet => {
          if (setToAverageDistance) {
            newAngles[planet.name] = getAverageDistanceAngle(planet.eccentricity);
          } else if (setToAphelion) {
            newAngles[planet.name] = getAphelionAngle();
          } else if (setToPerihelion) {
            newAngles[planet.name] = getPerihelionAngle();
          }
        });
        return newAngles;
      });
    }
  }, [setToAverageDistance, setToAphelion, setToPerihelion, orbitData, distanceMode]);

  // Start/stop animation loop based on component lifecycle
  useEffect(() => {
    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);

    // Clean up on unmount
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);


  // Mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Only enable dragging if zoomed in
    if (zoomLevel > 1.1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      // Limit panning based on zoom level - the more zoomed in, the more you can pan
      const maxPan = (zoomLevel - 1) * svgSize / 2;
      const newX = Math.max(-maxPan, Math.min(maxPan, dx));
      const newY = Math.max(-maxPan, Math.min(maxPan, dy));

      setPanOffset({ x: newX, y: newY });
    }
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
  };

  const handleMouseLeave = (): void => {
    setIsDragging(false);
  };

  // Glow animation effect synced with BPM
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
      }, pulseDuration / 20); // Adjust this for smoother or faster pulsing

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

  return (
    <div className="orbital-visualization">
      <div
        ref={containerRef}
        className="svg-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        role="application"
        aria-label="Solar system visualization"
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="solar-system-title solar-system-desc"
        >
          <title id="solar-system-title">Interactive Solar System Visualization</title>
          <desc id="solar-system-desc">
            A visualization of the planets in our solar system orbiting the sun.
            Each planet follows an elliptical path at varying distances.
          </desc>

          {/* Orbital paths using OrbitPath component */}
          {orbitData.map((planet) => {
            const pathPoints = generateEllipticalPath(
              getDistance(planet),
              planet.eccentricity,
              100
            );

            const pathData = pathPoints
              .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
              .join(' ') + ' Z';

            const showOrbitExtremes = planet.eccentricity > 0.1;
            const { perihelion, aphelion } = showOrbitExtremes ?
              getExtremePositions(getDistance(planet), planet.eccentricity) :
              { perihelion: null, aphelion: null };

            const { perihelion: perihelionDist, aphelion: aphelionDist } =
              calculateOrbitalExtremes(getDistance(planet), planet.eccentricity);

            return (
              <OrbitPath
                key={`orbit-${planet.name}`}
                planet={planet}
                pathData={pathData}
                orbitColor={getOrbitColor(planet.name, planet.enabled)}
                showExtremes={showOrbitExtremes}
                perihelionPos={perihelion}
                perihelionDist={perihelionDist}
                aphelionPos={aphelion}
                aphelionDist={aphelionDist}
                zoomLevel={zoomLevel}
                distanceMode={distanceMode}
                center={center}
                orbitScaleFactor={orbitScaleFactor}
                distance={getDistance(planet)}
                panOffset={panOffset}
              />
            );
          })}

          {/* Sun label */}
          <text
            x={center + panOffset.x}
            y={center + panOffset.y - sunRadius - 5}
            fontSize="10"
            textAnchor="middle"
            fill="#FDB813"
            aria-hidden="true"
          >
            Sun
          </text>

          {/* Sun */}
          <circle
            cx={center + panOffset.x}
            cy={center + panOffset.y}
            r={sunRadius}
            fill="#FDB813"
            role="img"
            aria-label="Sun at the center of the solar system"
          />

          {/* Planets using PlanetNode component */}
          {orbitData.map((planet) => {
            if (!planet.enabled) return null;

            const angle = planetAngles[planet.name] || 0;
            const position = getPlanetPosition(
              getDistance(planet),
              planet.eccentricity,
              angle
            );

            const currentDistance = getCurrentDistance(getDistance(planet), planet.eccentricity, angle);
            const size = getPlanetSize(planet);

            const planetColors: Record<string, string> = {
              'Mercury': '#A9A9A9',
              'Venus': '#E6D3A3',
              'Earth': '#1E90FF',
              'Mars': '#CD5C5C',
              'Ceres': '#8B8B83',
              'Jupiter': '#E59866',
              'Saturn': '#F4D03F',
              'Uranus': '#73C6B6',
              'Neptune': '#5DADE2',
              'Pluto': '#C39BD3'
            };

            return (
              <PlanetNode
                key={`planet-${planet.name}`}
                planet={planet}
                position={position}
                size={size}
                planetColors={planetColors}
                currentlyPlayingPlanet={currentlyPlayingPlanet}
                frequencyNote={frequencyToNote(currentFrequencies[planet.name] || 0)}
                frequencyValue={currentFrequencies[planet.name] || 0}
                glowOpacity={glowOpacity}
                currentDistance={currentDistance}
                distanceMode={distanceMode}
                sunPosition={{ x: center + panOffset.x, y: center + panOffset.y }}
              />
            );
          })}
        </svg>
      </div>
      <div className="frequency-display" aria-label="Current planetary frequencies" role="region">
        <div className="frequency-header">Current Frequencies:</div>
        {Object.entries(currentFrequencies).map(([planet, freq]) => {
          const planetData = orbitData.find(p => p.name === planet);
          if (!planetData) return null;

          return (
            <div key={planet} className="planet-frequency">
              <span className="planet-name">{planet}:</span>
              <span className="frequency-value">
                {freq.toFixed(1)} Hz <small>(~{frequencyToNote(freq)})</small>
              </span>
            </div>
          );
        })}
      </div>
      <style>
        {`
          .svg-container {
            cursor: ${zoomLevel > 1.1 ? (isDragging ? 'grabbing' : 'grab') : 'default'};
          }
        `}
      </style>
    </div>
  );
};

export default PlanetarySystem;
