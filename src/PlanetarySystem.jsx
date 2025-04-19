// src/PlanetarySystem.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

const PlanetarySystem = ({ orbitData, animationSpeed = 1, baseFrequency = 220, onFrequencyChange, isPaused = false }) => {
  const [animationTime, setAnimationTime] = useState(0);
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  const [zoomLevel, setZoomLevel] = useState(1); // Default zoom level
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  // To avoid excessive updates, we create an object to store frequencies
  const frequenciesRef = useRef({});
  // Reference to avoid infinite loops
  const lastBaseFrequencyRef = useRef(baseFrequency);
  
  // Constants for visualization
  const svgSize = 600;
  const center = svgSize / 2;
  
  // Max distance to calculate scaling
  const maxDistance = Math.max(...orbitData.map(planet => planet.distance * (1 + planet.excentricity)));
  
  // Scale factors - now affected by zoom level
  const orbitScaleFactor = (svgSize / 2) * 0.85 / (maxDistance / zoomLevel); // Apply zoom to scaling
  const minPlanetSize = 3; // Minimum size for visibility
  
  // Sun properties
  const sunRadius = 10; // Fixed size for better visualization
  
  // Calculate frequency factor - we use this to tie animation speed to base frequency
  // We normalize by a reference frequency of 220Hz so that speeds are visually appropriate
  const frequencyFactor = baseFrequency / 220;
  
  // Utility function to convert frequency to closest musical note
  const frequencyToNote = (frequency) => {
    if (!frequency) return "";
    
    // A4 is 440Hz, which is the reference
    const A4 = 440.0;
    // C0 is the 0th note in our system (by convention)
    const C0 = A4 * Math.pow(2, -4.75);
    
    // Calculate how many half steps from C0
    const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / C0));
    
    // Convert to note
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(halfStepsFromC0 / 12);
    const noteIndex = halfStepsFromC0 % 12;
    
    return noteNames[noteIndex] + octave;
  };
  
  // Function to handle zoom changes
  const handleZoomChange = (e) => {
    setZoomLevel(parseFloat(e.target.value));
  };
  
  // Function to calculate frequencies - now outside the animation loop
  const calculateCurrentFrequencies = useCallback((time) => {
    const newFrequencies = {};
    
    orbitData.forEach((planet, index) => {
      if (planet.enabled) {
        const period = getOrbitalPeriod(planet.distance);
        const angle = (time / period) * 2 * Math.PI;
        
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
    
    return newFrequencies;
  }, [orbitData, baseFrequency]);
  
  // Function to notify frequency changes to the parent component
  // Throttled to avoid excessive updates
  const notifyFrequencyChanges = useCallback(() => {
    if (onFrequencyChange) {
      onFrequencyChange(frequenciesRef.current);
    }
  }, [onFrequencyChange]);
  
  // Animation loop with throttled frequency updates
  useEffect(() => {
    if (!orbitData || orbitData.length === 0) return;
    
    // If animation is paused, do nothing
    if (isPaused) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = undefined;
      }
      return;
    }
    
    // Function that handles animation
    const animate = (time) => {
      if (previousTimeRef.current === undefined) {
        previousTimeRef.current = time;
      }
      
      // Calculate delta time to make animation frame rate independent
      const deltaTime = time - previousTimeRef.current;
      previousTimeRef.current = time;
      
      // Only update time if we have a reasonable deltaTime and animation isn't paused
      if (deltaTime < 100 && !isPaused) { // Ignore large time jumps
        setAnimationTime(prevTime => {
          const newTime = prevTime + (deltaTime * 0.001 * animationSpeed * frequencyFactor);
          
          // Calculate new frequencies and store them in the ref
          frequenciesRef.current = calculateCurrentFrequencies(newTime);
          
          // Update local frequency state less frequently
          // Only when animation frame changes
          setCurrentFrequencies(frequenciesRef.current);
          
          return newTime;
        });
      }
      
      // Only continue animation if not paused
      if (!isPaused) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Start animation only if not paused
    if (!isPaused) {
      requestRef.current = requestAnimationFrame(animate);
      
      // Set up an interval to notify frequency changes
      // instead of doing it on every frame
      const notifyInterval = setInterval(() => {
        if (!isPaused) {
          notifyFrequencyChanges();
        }
      }, 16); // Notify every 16ms
      
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
        clearInterval(notifyInterval);
      };
    }
  }, [animationSpeed, frequencyFactor, orbitData, calculateCurrentFrequencies, notifyFrequencyChanges, isPaused]);
  
  // Separate effect to update when baseFrequency changes
  // This effect was causing the infinite recursion
  useEffect(() => {
    // Check if baseFrequency has actually changed
    if (lastBaseFrequencyRef.current !== baseFrequency) {
      if (orbitData && orbitData.length > 0 && !isPaused) {
        // Recalculate frequencies when the base frequency changes
        const newFrequencies = calculateCurrentFrequencies(animationTime);
        setCurrentFrequencies(newFrequencies);
        frequenciesRef.current = newFrequencies;
        
        // Don't notify here to avoid an infinite loop
        // The notification interval will handle this
      }
      // Update the reference for the next comparison
      lastBaseFrequencyRef.current = baseFrequency;
    }
  }, [baseFrequency, calculateCurrentFrequencies, animationTime, orbitData, isPaused]);
  
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
    
    // CORRECTION: Correct parametric equation of the ellipse with the Sun at one focus
    // The Sun is at the origin (0,0) and the ellipse is around it
    const rawX = semiMajorAxis * Math.cos(angle) - focalDistance;
    const rawY = semiMinorAxis * Math.sin(angle);
    
    // Translate to center of SVG
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
      "Saturn": 8,
      "Uranus": 7,
      "Neptune": 7,
      "Pluto": 2.5
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
      <div className="zoom-control">
        <label htmlFor="zoom-slider" className="zoom-label">
          Zoom: {zoomLevel.toFixed(1)}x
        </label>
        <input 
          id="zoom-slider"
          type="range" 
          min="1"
          max="20"
          step="0.1"
          value={zoomLevel}
          onChange={handleZoomChange}
          className="zoom-slider"
        />
      </div>
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
            "Saturn": "#F4D03F",
            "Uranus": "#73C6B6",
            "Neptune": "#5DADE2",
            "Pluto": "#C39BD3"
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
              {/* Current distance */}
              <text
                x={position.x}
                y={position.y + size + 8}
                fontSize="6"
                textAnchor="middle"
                fill="#aaa"
              >
                {currentDistance.toFixed(2)} AU
              </text>
              {/* Line from sun to planet */}
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
        <div className="frequency-header">Current Frequencies:</div>
        {Object.entries(currentFrequencies).map(([planet, freq]) => (
          <div key={planet} className="planet-frequency">
            <span className="planet-name">{planet}:</span>
            <span className="frequency-value">
              {freq.toFixed(1)} Hz <small>({frequencyToNote(freq)})</small>
            </span>
          </div>
        ))}
        <div className="animation-status">
          {isPaused ? "Animation Paused" : "Animation Active"}
        </div>
      </div>
    </div>
  );
};

export default PlanetarySystem;