// src/PlanetarySystem.jsx
import React, { useState, useEffect, useRef } from 'react';

const PlanetarySystem = ({ orbitData, animationSpeed = 1, baseFrequency = 220, onFrequencyChange }) => {
  const [animationTime, setAnimationTime] = useState(0);
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  const requestRef = useRef();
  
  // Constants for visualization
  const svgSize = 600;
  const center = svgSize / 2;
  
  // Max distance to calculate scaling
  const maxDistance = Math.max(...orbitData.map(planet => planet.distance * (1 + planet.excentricity)));
  
  // Scale factors
  const orbitScaleFactor = (svgSize / 2) * 0.85 / maxDistance; // 85% of available radius
  const minPlanetSize = 3; // Minimum size for visibility
  
  // Sun properties
  const sunRadius = 10; // Fixed size for better visualization
  
  // Calculate frequency factor - we use this to tie animation speed to base frequency
  // We normalize by a reference frequency of 220Hz so that speeds are visually appropriate
  const frequencyFactor = baseFrequency / 220;
  
  // Animation loop with immediate frequency updates
  useEffect(() => {
    const animate = () => {
      setAnimationTime(prevTime => {
        const newTime = prevTime + 0.005 * animationSpeed * frequencyFactor;
        
        // Calculate and update frequencies immediately on each frame
        const newFrequencies = {};
        orbitData.forEach((planet, index) => {
          if (planet.enabled) {
            const period = getOrbitalPeriod(planet.distance);
            const angle = (newTime / period) * 2 * Math.PI;
            
            // Calculate current distance using the polar equation of an ellipse
            const currentDistance = getCurrentDistance(planet.distance, planet.excentricity, angle);
            
            // Base frequency for this planet (when at average distance)
            const n = index - 2; // Adjust so Earth is index 0
            const baseFreq = calculateFrequencies(baseFrequency, n);
            
            // Modulate frequency based on current distance
            const avgDistance = planet.distance;
            const ratio = avgDistance / currentDistance;
            const modifiedFreq = baseFreq * Math.sqrt(ratio);
            
            newFrequencies[planet.name] = modifiedFreq;
          }
        });
        
        // Update frequencies with each animation frame
        setCurrentFrequencies(newFrequencies);
        if (onFrequencyChange) {
          onFrequencyChange(newFrequencies);
        }
        
        return newTime;
      });
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animationSpeed, frequencyFactor, orbitData, baseFrequency, onFrequencyChange]);
  
  // Calculate current distance using the polar equation of an ellipse
  // r = a(1-e²)/(1+e·cos(θ))
  const getCurrentDistance = (semiMajorAxis, eccentricity, angle) => {
    return (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) / 
           (1 + eccentricity * Math.cos(angle));
  };
  
  // Get the x,y coordinates for a planet at a given angle in its elliptical orbit
  const getPlanetPosition = (semiMajorAxis, eccentricity, angle) => {
    // Semi-minor axis
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - Math.pow(eccentricity, 2));
    
    // Distance focal
    const focalDistance = semiMajorAxis * eccentricity;
    
    // CORRECCIÓN: Ecuación paramétrica correcta de la elipse con el Sol en un foco
    // El Sol está en el origen (0,0) y la elipse está alrededor de él
    const rawX = semiMajorAxis * Math.cos(angle) - focalDistance;
    const rawY = semiMinorAxis * Math.sin(angle);
    
    // Trasladamos al centro del SVG
    const x = center + rawX * orbitScaleFactor;
    const y = center + rawY * orbitScaleFactor;
    
    return { x, y };
  };
  
  // Generate points for elliptical orbit path
  const generateEllipticalPath = (semiMajorAxis, eccentricity, numPoints = 100) => {
    const path = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const position = getPlanetPosition(semiMajorAxis, eccentricity, angle);
      path.push(position);
    }
    
    return path;
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
  
  // Calculate frequency based on the modified Bode law
  const calculateFrequencies = (baseFreq, n) => {
    return (1 + Math.pow(2, n)) * 3 * baseFreq;
  };
  
  return (
    <div className="orbital-visualization">
      <svg width="100%" height="100%" viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* Orbital paths as ellipses */}
        {orbitData.map((planet) => {
          const pathPoints = generateEllipticalPath(
            planet.distance, 
            planet.excentricity,
            100
          );
          
          const pathData = pathPoints
            .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
            .join(' ') + ' Z';
          
          return (
            <path
              key={`orbit-${planet.name}`}
              d={pathData}
              fill="none"
              stroke={planet.enabled ? "#666" : "#333"}
              strokeWidth={0.5}
              strokeDasharray={planet.enabled ? "none" : "2,2"}
            />
          );
        })}
        
        {/* Sol label */}
        <text
          x={center}
          y={center - sunRadius - 5}
          fontSize="10"
          textAnchor="middle"
          fill="#FDB813"
        >
          Sol
        </text>
        
        {/* Sun */}
        <circle
          cx={center}
          cy={center}
          r={sunRadius}
          fill="#FDB813"
        />
        
        {/* Planets */}
        {orbitData.map((planet) => {
          if (!planet.enabled) return null;
          
          const period = getOrbitalPeriod(planet.distance);
          const angle = (animationTime / period) * 2 * Math.PI;
          const position = getPlanetPosition(
            planet.distance,
            planet.excentricity,
            angle
          );
          
          // Calculate current distance for display
          const currentDistance = getCurrentDistance(
            planet.distance,
            planet.excentricity,
            angle
          );
          
          const size = getPlanetSize(planet);
          
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
            <g key={`planet-${planet.name}`}>
              <circle
                cx={position.x}
                cy={position.y}
                r={size}
                fill={planetColors[planet.name] || "#999"}
              />
              <text
                x={position.x}
                y={position.y - size - 2}
                fontSize="8"
                textAnchor="middle"
                fill="#ccc"
              >
                {planet.name}
              </text>
              {/* Distancia actual */}
              <text
                x={position.x}
                y={position.y + size + 8}
                fontSize="6"
                textAnchor="middle"
                fill="#aaa"
              >
                {currentDistance.toFixed(2)} AU
              </text>
              {/* Línea desde el sol hasta el planeta */}
              <line
                x1={center}
                y1={center}
                x2={position.x}
                y2={position.y}
                stroke="#333"
                strokeWidth="0.3"
                strokeDasharray="1,2"
              />
            </g>
          );
        })}
      </svg>
      <div className="frequency-display">
        <div className="frequency-header">Frecuencias actuales:</div>
        {Object.entries(currentFrequencies).map(([planet, freq]) => (
          <div key={planet} className="planet-frequency">
            <span className="planet-name">{planet}:</span>
            <span className="frequency-value">{freq.toFixed(1)} Hz</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanetarySystem;