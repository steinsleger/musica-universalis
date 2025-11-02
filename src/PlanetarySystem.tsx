// src/PlanetarySystem.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVisualization } from './context/VisualizationContext';
import { useOrbitalCalculations } from './hooks/useOrbitalCalculations';
import { useOrbitalAnimation } from './hooks/useOrbitalAnimation';
import { useGlowEffect } from './hooks/useGlowEffect';
import OrbitPath from './components/OrbitPath';
import PlanetNode from './components/PlanetNode';
import { getOrbitColor } from './utils/visualizationHelpers';

const PlanetarySystem: React.FC = () => {
  const {
    orbitData,
    animationSpeed,
    baseFrequency,
    onFrequencyChange,
    isPaused,
    setToAverageDistance,
    setToAphelion,
    setToPerihelion,
    zoomLevel,
    setZoomLevel,
    distanceMode,
    currentlyPlayingPlanet,
    sequenceBPM
  } = useVisualization();

  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Constants for visualization
  const svgSize = 600;
  const center = svgSize / 2;
  const sunRadius = 10;

  // Use orbital calculations hook
  const {
    getDistance,
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

  // Use orbital animation hook for animation logic
  const { planetAngles, currentFrequencies } = useOrbitalAnimation({
    orbitData,
    animationSpeed,
    baseFrequency,
    isPaused,
    distanceMode,
    setToAverageDistance,
    setToAphelion,
    setToPerihelion,
    onFrequencyChange,
    getDistance,
    getOrbitalPeriod,
    getCurrentDistance,
    calculateFrequencies,
    getAverageDistanceAngle,
    getAphelionAngle,
    getPerihelionAngle
  });

  // Use glow effect hook for glow animation
  const glowOpacity = useGlowEffect({
    currentlyPlayingPlanet,
    sequenceBPM
  });

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
              { perihelion: undefined, aphelion: undefined };

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
