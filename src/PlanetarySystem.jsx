// src/PlanetarySystem.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

const PlanetarySystem = ({
    orbitData,
    animationSpeed = 1,
    setAnimationSpeed,
    baseFrequency = 220,
    onFrequencyChange,
    isPaused = false,
    setToAverageDistance = false,
    setToAphelion = false,
    setToPerihelion = false,
    zoomLevel = 1,
    setZoomLevel,
    distanceMode = 'titiusBode'
  }) => {
  // Add animation time state that advances based on the animation speed
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // Track panning offset
  const [isDragging, setIsDragging] = useState(false); // Track if user is dragging
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Starting point of drag
  // Add animation angle state to track planet positions
  const [planetAngles, setPlanetAngles] = useState({});
  const [lastAnimatedAngles, setLastAnimatedAngles] = useState({});
  const [isInPositionMode, setIsInPositionMode] = useState(false);
  
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const svgRef = useRef(null); // Reference to the SVG element
  const containerRef = useRef(null); // Add new ref for the container
  
  // Fixed angle for all planets - 0 for horizontal right alignment
  const fixedAngle = 0; // Initial angle for all planets
  
  // To avoid excessive updates, we create an object to store frequencies
  const frequenciesRef = useRef({});
  // Reference to avoid infinite loops
  const lastBaseFrequencyRef = useRef(baseFrequency);
  
  // Reference for distance mode to detect changes
  const distanceModeRef = useRef(distanceMode);
  
  // Constants for visualization
  const svgSize = 600;
  const center = svgSize / 2;

  // Function to get the correct distance based on the mode
  const getDistance = (planet) => {
    return distanceMode === 'titiusBode' ? planet.distance : planet.actualDistance;
  };
  
  // Max distance to calculate scaling
  const maxDistance = Math.max(...orbitData.map(planet => getDistance(planet) * (1 + planet.eccentricity)));
  
  // Effect to update calculations when distance mode changes
  useEffect(() => {
    if (distanceModeRef.current !== distanceMode) {
      // Distance mode changed, update reference
      distanceModeRef.current = distanceMode;
      
      // Recalculate frequencies if callback is provided
      if (onFrequencyChange && !isPaused) {
        const updatedFrequencies = {};
        
        orbitData.forEach((planet) => {
          if (planet.enabled) {
            const angle = planetAngles[planet.name] || 0;
            const currentDistance = getCurrentDistance(getDistance(planet), planet.eccentricity, angle);
            
            // Calculate base frequency for this planet
            const n = orbitData.indexOf(planet) - 2; // Adjust so Earth is index 0
            const baseFreq = (1 + Math.pow(2, n)) * 3 * (baseFrequency || 220);
            
            // Modulate frequency based on current distance
            const avgDistance = getDistance(planet);
            const ratio = avgDistance / currentDistance;
            const modifiedFreq = baseFreq * Math.sqrt(ratio);
            
            updatedFrequencies[planet.name] = modifiedFreq;
          }
        });
        
        onFrequencyChange(updatedFrequencies);
      }
    }
  }, [distanceMode, orbitData, planetAngles, onFrequencyChange, isPaused, baseFrequency]);
  
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
  
  // Calculate frequency based on the modified Bode law
  const calculateFrequencies = (baseFreq, n) => {
    return (1 + Math.pow(2, n)) * 3 * baseFreq;
  };
  
  // Add a ref to track initialization
  const initializedRef = useRef(false);
  
  // Add a ref to track the last position mode
  const lastPositionModeRef = useRef({
    average: false,
    aphelion: false,
    perihelion: false
  });

  // Add a ref to store the initial angles when position mode changes
  const initialPositionAnglesRef = useRef({});
  
  // Initialize planet angles when orbitData changes
  useEffect(() => {
    if (!orbitData || orbitData.length === 0) return;
    
    // Initialize angles for all planets - all at 0 for a straight line
    const initialAngles = {};
    orbitData.forEach(planet => {
      // Set all planets at angle 0 for straight line to the right
      initialAngles[planet.name] = 0;
    });
    
    setPlanetAngles(initialAngles);
  }, [orbitData]);
  
  // Initialize frequencies when component mounts or baseFrequency changes
  useEffect(() => {
    if (initializedRef.current) return;
    
    const initialFrequencies = {};
    orbitData.forEach((planet, index) => {
      if (planet.enabled) {
        const n = index - 2; // Adjust so Earth is index 0
        const baseFreq = calculateFrequencies(baseFrequency, n);
        initialFrequencies[planet.name] = baseFreq;
      }
    });
    
    setCurrentFrequencies(initialFrequencies);
    frequenciesRef.current = initialFrequencies;
    if (onFrequencyChange) {
      onFrequencyChange(initialFrequencies);
    }
    
    initializedRef.current = true;
  }, [baseFrequency, orbitData, onFrequencyChange, calculateFrequencies]);
  
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
  
  // Handle mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY;
    const zoomSpeed = 0.1;
    
    // Calculate new zoom level
    const newZoom = zoomLevel * (1 + (delta > 0 ? -zoomSpeed : zoomSpeed));
    
    // Clamp zoom level between 1 and 20
    const clampedZoom = Math.max(1, Math.min(20, newZoom));
    
    // Update zoom level through prop
    if (setZoomLevel) {
      setZoomLevel(clampedZoom);
    }
  }, [zoomLevel, setZoomLevel]);
  
  // Add wheel event listener with non-passive option
  useEffect(() => {
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
  
  // Calculate the angle at which a planet is at its average distance
  const getAverageDistanceAngle = (eccentricity) => {
    // For an ellipse, the average distance occurs at an angle where r = a
    // Using the polar equation of an ellipse: r = a(1-e²)/(1+e·cos(θ))
    // Setting r = a and solving for θ:
    // a = a(1-e²)/(1+e·cos(θ))
    // 1 = (1-e²)/(1+e·cos(θ))
    // 1+e·cos(θ) = 1-e²
    // e·cos(θ) = -e²
    // cos(θ) = -e
    // θ = arccos(-e)
    return Math.acos(-eccentricity);
  };
  
  // Calculate the angle at which a planet is at its aphelion
  const getAphelionAngle = () => {
    // Aphelion occurs at angle π (180 degrees) in our coordinate system
    return Math.PI;
  };
  
  // Calculate the angle at which a planet is at its perihelion
  const getPerihelionAngle = () => {
    // Perihelion occurs at angle 0 (0 degrees) in our coordinate system
    return 0;
  };
  
  // Add effect to handle position jumps
  useEffect(() => {
    if (setToAverageDistance || setToAphelion || setToPerihelion) {
      setPlanetAngles(prevAngles => {
        const newAngles = { ...prevAngles };
        orbitData.forEach(planet => {
          if (planet.enabled) {
            if (setToAverageDistance) {
              newAngles[planet.name] = getAverageDistanceAngle(planet.eccentricity);
            } else if (setToAphelion) {
              newAngles[planet.name] = getAphelionAngle();
            } else if (setToPerihelion) {
              newAngles[planet.name] = getPerihelionAngle();
            }
          }
        });
        return newAngles;
      });
    }
  }, [setToAverageDistance, setToAphelion, setToPerihelion, orbitData]);
  
  // Animation loop - updates planet positions over time
  const animate = useCallback((time) => {
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
          if (planet.enabled) {
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
          }
        });
        
        return newAngles;
      });
    }
    
    // Calculate and update frequencies based on current positions
    const newFrequencies = {};
    orbitData.forEach((planet, index) => {
      if (planet.enabled) {
        const angle = planetAngles[planet.name] || 0;
        const currentDistance = getCurrentDistance(getDistance(planet), planet.eccentricity, angle);
        
        // Base frequency for this planet (when at average distance)
        const n = index - 2; // Adjust so Earth is index 0
        const baseFreq = calculateFrequencies(baseFrequency, n);
        
        // Modulate frequency based on current distance
        const avgDistance = getDistance(planet);
        const ratio = avgDistance / currentDistance;
        const modifiedFreq = baseFreq * Math.sqrt(ratio);
        
        newFrequencies[planet.name] = modifiedFreq;
      }
    });
    
    // Store frequencies for parent component
    setCurrentFrequencies(newFrequencies);
    frequenciesRef.current = newFrequencies;
    
    // Request next frame
    requestRef.current = requestAnimationFrame(animate);
  }, [isPaused, animationSpeed, orbitData, baseFrequency, planetAngles]);
  
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
  
  // Function to notify frequency changes to the parent component
  // Throttled to avoid excessive updates
  const notifyFrequencyChanges = useCallback(() => {
    if (onFrequencyChange) {
      onFrequencyChange(frequenciesRef.current);
    }
  }, [onFrequencyChange]);
  
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
  
  return (
    <div className="orbital-visualization">
      <div 
        ref={containerRef}
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
              getDistance(planet), 
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
              getExtremePositions(getDistance(planet), planet.eccentricity) : 
              { perihelion: null, aphelion: null };
            
            const { perihelion: perihelionDist, aphelion: aphelionDist } = 
              calculateOrbitalExtremes(getDistance(planet), planet.eccentricity);
            
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
                    x={center + (getDistance(planet) * 0.7) * orbitScaleFactor + panOffset.x}
                    y={center - (getDistance(planet) * 0.7) * orbitScaleFactor + panOffset.y}
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
          
          {/* Planets - now use dynamic angles from state */}
          {orbitData.map((planet) => {
            if (!planet.enabled) return null;
            
            const angle = planetAngles[planet.name] || 0;
            const position = getPlanetPosition(
              getDistance(planet),
              planet.eccentricity,
              angle
            );
            
            // Calculate current distance for display
            const currentDistance = getCurrentDistance(getDistance(planet), planet.eccentricity, angle);
            
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
                  x1={center + panOffset.x}
                  y1={center + panOffset.y}
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
      </div>
      <style>
        {`
          .orbital-visualization {
            background-color: #111;
            border-radius: 8px;
            overflow: hidden;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          
          .svg-container {
            cursor: ${zoomLevel > 1.1 ? (isDragging ? 'grabbing' : 'grab') : 'default'};
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 550px;
            position: relative;
          }
          
          svg {
            max-width: 100%;
            height: auto;
            aspect-ratio: 1 / 1;
            display: block;
          }
        `}
      </style>
    </div>
  );
};

export default PlanetarySystem;