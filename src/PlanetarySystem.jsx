// src/PlanetarySystem.jsx
import React, { useState, useEffect } from 'react';

const PlanetarySystem = ({ orbitData, animationSpeed = 1, baseFrequency = 440 }) => {
  const [animationTime, setAnimationTime] = useState(0);
  
  // Constants for visualization
  const svgSize = 600;
  const center = svgSize / 2;
  
  // Max distance to calculate scaling
  const maxDistance = Math.max(...orbitData.map(planet => planet.distance));
  
  // Scale factors
  const orbitScaleFactor = (svgSize / 2) * 0.85 / maxDistance; // 85% of available radius
  const minPlanetSize = 3; // Minimum size for visibility
  
  // Sun properties
  const sunRadius = 10; // Fixed size for better visualization
  
  // Calculate frequency factor - we use this to tie animation speed to base frequency
  // We normalize by a reference frequency of 220Hz so that speeds are visually appropriate
  const frequencyFactor = baseFrequency / 220;
  
  // Animation loop - use baseFrequency to adjust speed
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      // Multiply by frequencyFactor to tie animation to base frequency
      // The * 0.005 factor is to make it visually trackable
      setAnimationTime(prev => prev + 0.005 * animationSpeed * frequencyFactor);
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [animationTime, animationSpeed, frequencyFactor]);
  
  // Calculate planet position based on orbital parameters
  const getPlanetPosition = (distance, time, period) => {
    const angle = (time / period) * 2 * Math.PI;
    const scaledDistance = distance * orbitScaleFactor;
    
    return {
      x: center + scaledDistance * Math.cos(angle),
      y: center + scaledDistance * Math.sin(angle)
    };
  };
  
  // Calculate planetary size (not to scale, but preserving relative sizes)
  const getPlanetSize = (planet) => {
    // Using a fixed mapping to make planets visible while preserving relative sizes
    const baseSize = {
      "Mercury": 4,
      "Venus": 5,
      "Earth": 5,
      "Mars": 4.5,
      "Ceres": 3,
      "Jupiter": 9,
      "Saturn": 8
    };
    
    return planet.enabled ? baseSize[planet.name] || minPlanetSize : 0;
  };
  
  // Calculate orbital period using Kepler's Third Law
  const getOrbitalPeriod = (distance) => {
    return Math.pow(distance, 1.5);
  };
  
  return (
    <div className="orbital-visualization">
      <svg width="100%" height="100%" viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* Orbital paths */}
        {orbitData.map((planet) => (
          <circle
            key={`orbit-${planet.name}`}
            cx={center}
            cy={center}
            r={planet.distance * orbitScaleFactor}
            fill="none"
            stroke={planet.enabled ? "#666" : "#ddd"}
            strokeWidth={0.5}
            strokeDasharray={planet.enabled ? "none" : "2,2"}
          />
        ))}
        
        {/* Sun */}
        <circle
          cx={center}
          cy={center}
          r={sunRadius}
          fill="#FDB813"
        />
        
        {/* Planets */}
        {orbitData.map((planet) => {
          const period = getOrbitalPeriod(planet.distance);
          const position = getPlanetPosition(planet.distance, animationTime, period);
          const size = getPlanetSize(planet);
          
          // Skip rendering disabled planets
          if (!planet.enabled) return null;
          
          // Planet colors
          const planetColors = {
            "Mercury": "#A9A9A9",
            "Venus": "#E6D3A3",
            "Earth": "#1E90FF",
            "Mars": "#CD5C5C",
            "Ceres": "#8B8B83",
            "Jupiter": "#E59866",
            "Saturn": "#F4D03F"
          };
          
          return (
            <circle
              key={`planet-${planet.name}`}
              cx={position.x}
              cy={position.y}
              r={size}
              fill={planetColors[planet.name] || "#999"}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default PlanetarySystem;