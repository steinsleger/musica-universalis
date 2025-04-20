// src/PlanetarySystem.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

const PlanetarySystem = ({ orbitData, animationSpeed = 1, baseFrequency = 220, onFrequencyChange, isPaused = false }) => {
  // Remove animation time state and just use a fixed angle for all planets
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  const [zoomLevel, setZoomLevel] = useState(1); // Default zoom level
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // Track panning offset
  const [isDragging, setIsDragging] = useState(false); // Track if user is dragging
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Starting point of drag
  
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const svgRef = useRef(null); // Reference to the SVG element
  
  // Fixed angle for all planets - 0 for horizontal right alignment
  const fixedAngle = 0; // Horizontal right alignment
  
  // To avoid excessive updates, we create an object to store frequencies
  const frequenciesRef = useRef({});
  // Reference to avoid infinite loops
  const lastBaseFrequencyRef = useRef(baseFrequency);
  
  // Constants for visualization
  const svgSize = 600;
  const center = svgSize / 2;
  
  // Max distance to calculate scaling
  const maxDistance = Math.max(...orbitData.map(planet => planet.distance * (1 + planet.eccentricity)));
  
  // Apply a non-linear zoom scaling for better orbit separation at low zoom values
  const getEffectiveZoom = (baseZoom) => {
    // This function makes zoom more aggressive for outer planets
    // which helps distinguish Neptune and Pluto orbits even at low zoom settings
    if (baseZoom <= 1) {
      // At zoom level 1, use a fixed value to ensure entire system is visible
      return 0.45;  // Reduced from 0.75 to ensure we see the full system
    } else if (baseZoom <= 2) {
      // Apply non-linear scaling for low zoom values to better separate outer orbits
      return baseZoom * (1 + (baseZoom - 1) * 0.2);
    }
    return baseZoom;
  };
  
  // Scale factors - now with improved zoom handling that ensures visibility at zoom=1
  const effectiveZoom = getEffectiveZoom(zoomLevel);
  const orbitScaleFactor = (svgSize / 2) * 0.98 / (maxDistance / effectiveZoom);
  const minPlanetSize = 3; // Minimum size for visibility
  
  // Sun properties
  const sunRadius = 10; // Fixed size for better visualization
  
  // Calculate frequency factor - we use this to tie animation speed to base frequency
  // We normalize by a reference frequency of 220Hz so that speeds are visually appropriate
  const frequencyFactor = baseFrequency / 220;
  
  // Mouse event handlers for panning
  const handleMouseDown = (e) => {
    // Only enable dragging if zoomed in
    if (zoomLevel > 1.1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - panOffset.x, 
        y: e.clientY - panOffset.y 
      });
    }
  };
  
  const handleMouseMove = (e) => {
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
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  // Reset pan offset when zoom level changes to 1
  useEffect(() => {
    if (zoomLevel <= 1.1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);
  
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
        
        // Always use the fixed angle for calculations
        const currentDistance = getCurrentDistance(planet.distance, planet.eccentricity, fixedAngle);
        
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
  }, [orbitData, baseFrequency, fixedAngle]);
  
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
    
    // Skip animation entirely - just use fixed position for all planets
    setCurrentFrequencies(calculateCurrentFrequencies(0));
    
    // Set up a notification interval regardless of animation state
    const notifyInterval = setInterval(() => {
      notifyFrequencyChanges();
    }, 16); // Notify every 16ms
    
    return () => {
      clearInterval(notifyInterval);
    };
  }, [orbitData, calculateCurrentFrequencies, notifyFrequencyChanges]);
  
  // Separate effect to update when baseFrequency changes
  useEffect(() => {
    // Check if baseFrequency has actually changed
    if (lastBaseFrequencyRef.current !== baseFrequency) {
      // Recalculate frequencies when the base frequency changes
      const newFrequencies = calculateCurrentFrequencies(0);
      setCurrentFrequencies(newFrequencies);
      frequenciesRef.current = newFrequencies;
      
      // Update the reference for the next comparison
      lastBaseFrequencyRef.current = baseFrequency;
    }
  }, [baseFrequency, calculateCurrentFrequencies]);
  
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
    
    // FIXED CALCULATION: Proper elliptical orbit coordinates
    // Use the polar form of an ellipse to get the distance from the focus
    const distance = (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) / 
                     (1 + eccentricity * Math.cos(angle));
    
    // Convert polar coordinates (distance, angle) to Cartesian (x, y)
    const rawX = distance * Math.cos(angle);
    const rawY = distance * Math.sin(angle);
    
    // Translate to center of SVG and apply pan offset
    const x = center + rawX * orbitScaleFactor + panOffset.x;
    const y = center + rawY * orbitScaleFactor + panOffset.y;
    
    return { x, y };
  };
  
  // Calculate minimum and maximum distances for a planet with given parameters
  const calculateOrbitalExtremes = (semiMajorAxis, eccentricity) => {
    // Perihelion - closest approach to sun
    const perihelion = semiMajorAxis * (1 - eccentricity);
    // Aphelion - furthest distance from sun
    const aphelion = semiMajorAxis * (1 + eccentricity);
    
    return { perihelion, aphelion };
  };
  
  // Generate points for elliptical orbit path
  const generateEllipticalPath = (semiMajorAxis, eccentricity, numPoints = 100) => {
    const path = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const position = getPlanetPosition(
        semiMajorAxis, 
        eccentricity,
        angle
      );
      path.push(position);
    }
    
    return path;
  };
  
  // Get the position for perihelion and aphelion points
  const getExtremePositions = (semiMajorAxis, eccentricity) => {
    // Perihelion is at angle = 0 (closest to Sun)
    const perihelion = getPlanetPosition(semiMajorAxis, eccentricity, 0);
    // Aphelion is at angle = PI (farthest from Sun)
    const aphelion = getPlanetPosition(semiMajorAxis, eccentricity, Math.PI);
    
    return { perihelion, aphelion };
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
        <div className="zoom-tip">
          {zoomLevel > 1.1 ? 
            "Drag the system with your mouse to pan the view" : 
            "Increase zoom to see outer planet orbits more clearly"}
        </div>
      </div>
      <style>
        {`
          .zoom-tip {
            font-size: 0.8rem;
            color: #AAA;
            margin-top: 4px;
            font-style: italic;
          }
          
          .orbital-visualization {
            background-color: #111;
            border-radius: 8px;
            overflow: hidden;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          
          .svg-container {
            cursor: ${zoomLevel > 1.1 ? (isDragging ? 'grabbing' : 'grab') : 'default'};
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 550px;
          }
          
          svg {
            max-width: 100%;
            height: auto;
            aspect-ratio: 1 / 1;
            display: block;
          }
        `}
      </style>
      <div 
        className="svg-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Orbital paths as ellipses */}
          {orbitData.map((planet) => {
            const pathPoints = generateEllipticalPath(
              planet.distance, 
              planet.eccentricity,
              100
            );
            
            const pathData = pathPoints
              .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
              .join(' ') + ' Z';
            
            // Get a color based on the planet's distance from the sun
            // This ensures visually distinct orbits, especially for outer planets
            const getOrbitColor = (name, enabled) => {
              if (!enabled) return "#333";
              
              // Custom colors for each planet to make orbits more distinguishable
              const planetColors = {
                "Mercury": "#AAA",
                "Venus": "#DAA",
                "Earth": "#5A5",
                "Mars": "#A55",
                "Ceres": "#AA8",
                "Jupiter": "#DA8",
                "Saturn": "#DD5",
                "Uranus": "#8DD",
                "Neptune": "#55D",
                "Pluto": "#D5D"
              };
              
              return planetColors[name] || "#666";
            };
            
            // For highly eccentric orbits, mark perihelion and aphelion
            const showOrbitExtremes = planet.eccentricity > 0.1;
            const { perihelion, aphelion } = showOrbitExtremes ? 
              getExtremePositions(planet.distance, planet.eccentricity) : 
              { perihelion: null, aphelion: null };
            
            const { perihelion: perihelionDist, aphelion: aphelionDist } = 
              calculateOrbitalExtremes(planet.distance, planet.eccentricity);
            
            return (
              <React.Fragment key={`orbit-${planet.name}`}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={getOrbitColor(planet.name, planet.enabled)}
                  strokeWidth={planet.name === "Neptune" || planet.name === "Pluto" ? 0.8 : 0.5}
                  strokeDasharray={planet.enabled ? "none" : "2,2"}
                />
                
                {/* Orbit label - visible at higher zoom levels or for outer planets */}
                {(zoomLevel > 3 || (zoomLevel > 1.5 && (planet.name === "Neptune" || planet.name === "Pluto" || planet.name === "Uranus"))) && (
                  <text
                    x={center + (planet.distance * 0.7) * orbitScaleFactor + panOffset.x}
                    y={center - (planet.distance * 0.7) * orbitScaleFactor + panOffset.y}
                    fontSize="7"
                    fill={getOrbitColor(planet.name, planet.enabled)}
                    opacity={planet.enabled ? 1 : 0.5}
                    textAnchor="middle"
                  >
                    {planet.name} orbit
                  </text>
                )}
                
                {/* Show perihelion and aphelion markers for eccentric orbits */}
                {planet.enabled && showOrbitExtremes && (
                  <>
                    {/* Perihelion marker */}
                    <circle
                      cx={perihelion.x}
                      cy={perihelion.y}
                      r={1.5}
                      fill="#f44"
                    />
                    {zoomLevel > 4 && (
                      <text
                        x={perihelion.x}
                        y={perihelion.y - 5}
                        fontSize="6"
                        textAnchor="middle"
                        fill="#f88"
                      >
                        {planet.name} perihelion
                        ({perihelionDist.toFixed(2)} AU)
                      </text>
                    )}
                    
                    {/* Aphelion marker */}
                    <circle
                      cx={aphelion.x}
                      cy={aphelion.y}
                      r={1.5}
                      fill="#88f"
                    />
                    {zoomLevel > 4 && (
                      <text
                        x={aphelion.x}
                        y={aphelion.y - 5}
                        fontSize="6"
                        textAnchor="middle"
                        fill="#88f"
                      >
                        {planet.name} aphelion
                        ({aphelionDist.toFixed(2)} AU)
                      </text>
                    )}
                  </>
                )}
              </React.Fragment>
            );
          })}
          
          {/* Sun label */}
          <text
            x={center + panOffset.x}
            y={center + panOffset.y - sunRadius - 5}
            fontSize="10"
            textAnchor="middle"
            fill="#FDB813"
          >
            Sun
          </text>
          
          {/* Sun */}
          <circle
            cx={center + panOffset.x}
            cy={center + panOffset.y}
            r={sunRadius}
            fill="#FDB813"
          />
          
          {/* Planets */}
          {orbitData.map((planet) => {
            if (!planet.enabled) return null;
            
            // Use fixed angle for all planets to ensure perfect alignment
            const position = getPlanetPosition(
              planet.distance,
              planet.eccentricity,
              fixedAngle
            );
            
            // Calculate current distance for display
            const currentDistance = getCurrentDistance(
              planet.distance,
              planet.eccentricity,
              fixedAngle
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
      </div>
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
          Fixed Planet Alignment
        </div>
      </div>
    </div>
  );
};

export default PlanetarySystem;