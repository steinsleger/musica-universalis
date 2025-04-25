// src/OrbitalSonification.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import PlanetarySystem from './PlanetarySystem';

const OrbitalSonification = () => {
  // State for the data of planetary orbits
  const [orbitData, setOrbitData] = useState([
    { name: "Mercury", distance: 0.39, eccentricity: 0.2056, enabled: true },
    { name: "Venus", distance: 0.72, eccentricity: 0.0068, enabled: true },
    { name: "Earth", distance: 1.00, eccentricity: 0.0167, enabled: true },
    { name: "Mars", distance: 1.52, eccentricity: 0.0934, enabled: true },
    { name: "Ceres", distance: 2.77, eccentricity: 0.0758, enabled: true },
    { name: "Jupiter", distance: 5.20, eccentricity: 0.0484, enabled: true },
    { name: "Saturn", distance: 9.58, eccentricity: 0.0539, enabled: true },
    { name: "Uranus", distance: 19.22, eccentricity: 0.0473, enabled: true },
    { name: "Neptune", distance: 30.05, eccentricity: 0.0086, enabled: true },
    { name: "Pluto", distance: 39.48, eccentricity: 0.2488, enabled: true }
  ]);
  const [baseFrequency, setBaseFrequency] = useState(27.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [liveMode, setLiveMode] = useState(false);
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  const [isPaused, setIsPaused] = useState(true);
  const [positionMode, setPositionMode] = useState('normal'); // 'normal', 'average', 'aphelion', 'perihelion'
  const [masterVolume, setMasterVolume] = useState(0.35); // -9dB approximately
  const [needsUserInteraction, setNeedsUserInteraction] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Added zoomLevel state
  
  // Estado de la UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('controls'); // 'controls' o 'planets'
  
  // Referencias para evitar problemas con audio/animación
  const audioContextStarted = useRef(false);
  const frequencyUpdateTimeoutRef = useRef(null);
  const gainNodeRef = useRef(null);
  const initFrequenciesRef = useRef(false);
  const synthsRef = useRef({});
  const mainSynthRef = useRef(null);
  const lastFrequenciesRef = useRef({});
  const sequenceTimeoutRef = useRef(null);
  const wasPausedRef = useRef(false);
  const debug = useRef(true);
  const activeSynthsRef = useRef(new Set());
  const audioInitializedRef = useRef(false);

  // Handle first user interaction on the page to initialize audio
  const handleUserInteraction = async () => {
    if (needsUserInteraction) {
      try {
        const started = await startAudioContext();
        if (started) {
          setNeedsUserInteraction(false);
        }
      } catch (error) {
        console.error("Error initializing audio on user interaction:", error);
      }
    }
  };

  useEffect(() => {
    if (needsUserInteraction) {
      const handleGlobalClick = async () => {
        await handleUserInteraction();
      };
      
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('touchstart', handleGlobalClick);
      
      return () => {
        document.removeEventListener('click', handleGlobalClick);
        document.removeEventListener('touchstart', handleGlobalClick);
      };
    }
  }, [needsUserInteraction]);

  // Utility function to convert frequency to closest musical note
  const frequencyToNote = (frequency) => {
    if (!frequency) return "";
    
    const A4 = 440.0;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / C0));
    
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(halfStepsFromC0 / 12);
    const noteIndex = halfStepsFromC0 % 12;
    
    return noteNames[noteIndex] + octave;
  };

  // Calculate frequencies based on the modified Bode law (Murch version)
  const calculateBaseFrequencies = useCallback((baseFreq, n) => {
    return (1 + Math.pow(2, n)) * 3 * baseFreq;
  }, []);

  // Function to calculate and update all frequencies
  const updateAllFrequencies = useCallback(() => {
    // Initialize default frequencies for all planets
    const defaultFrequencies = {};
    orbitData.forEach((planet, index) => {
      // Calculate using the Bode law formula
      const n = index - 2; // Adjust so Earth is index 0
      const freq = calculateBaseFrequencies(baseFrequency, n);
      defaultFrequencies[planet.name] = freq;
    });
    
    setCurrentFrequencies(defaultFrequencies);
    
    return defaultFrequencies;
  }, [orbitData, baseFrequency, calculateBaseFrequencies]);

  // Initialize default frequencies if not provided by PlanetarySystem
  useEffect(() => {
    if (!initFrequenciesRef.current) {
      updateAllFrequencies();
      initFrequenciesRef.current = true;
    }
  }, [updateAllFrequencies]);

  // Update frequencies every time the base frequency changes
  useEffect(() => {
    updateAllFrequencies();
  }, [baseFrequency, updateAllFrequencies]);

  // Initialize synthesizer system once
  useEffect(() => {
    if (audioInitializedRef.current) return;
    
    const initTone = async () => {
      try {
        console.log("Initializing Tone.js with master volume:", masterVolume);
        
        // Create a master gain node first
        const masterGain = new Tone.Gain(masterVolume).toDestination();
        gainNodeRef.current = masterGain;
        
        // Set the master volume directly from the start
        Tone.Destination.volume.value = Tone.gainToDb(masterVolume);
        
        // Configure the main synthesizer for the sequence
        const mainSynth = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 1
          },
          oscillator: {
            type: 'sine'
          }
        }).connect(masterGain);
        
        mainSynthRef.current = mainSynth;
        
        // Create individual synthesizer for each planet - only once
        orbitData.forEach(planet => {
          const planetSynth = new Tone.Synth({
            envelope: {
              attack: 0.02,
              decay: 0.1,
              sustain: 0.3,
              release: 1
            },
            oscillator: {
              type: 'sine'
            }
          }).connect(masterGain);
          
          synthsRef.current[planet.name] = planetSynth;
        });
        
        try {
          await Tone.start();
          audioContextStarted.current = true;
          console.log("AudioContext started successfully on load");
        } catch (err) {
          console.log("AudioContext couldn't start automatically, will try on user interaction");
        }
        
        audioInitializedRef.current = true;
      } catch (error) {
        console.error("Error initializing audio components:", error);
      }
    };
    
    initTone();
    
    return () => {
      if (frequencyUpdateTimeoutRef.current) {
        clearTimeout(frequencyUpdateTimeoutRef.current);
      }
      
      // Clean up all synths
      if (mainSynthRef.current) {
        mainSynthRef.current.dispose();
      }
      
      Object.values(synthsRef.current).forEach(synth => {
        if (synth) synth.dispose();
      });
      
      if (gainNodeRef.current) {
        gainNodeRef.current.dispose();
      }
    };
  }, [orbitData, masterVolume]);
  
  // Separate effect to handle live mode changes
  useEffect(() => {
    // This is only for handling live mode status changes
    const handleLiveModeChange = async () => {
      if (!audioContextStarted.current) {
        await startAudioContext();
      }
      
      // Make sure all synths are stopped first
      Object.values(synthsRef.current).forEach(synth => {
        if (synth) {
          synth.triggerRelease();
        }
      });
      
      // Clear the active synths set
      activeSynthsRef.current.clear();
    };
    
    handleLiveModeChange();
  }, [liveMode]); // Only trigger when liveMode changes

  // Effect for continuous audio updates - completely separate from live mode toggling
  useEffect(() => {
    if (!liveMode) return;
    
    // Don't do anything until audio is initialized
    if (!audioInitializedRef.current) return;
    
    // Use stable interval rather than timeout for better timing
    const intervalId = setInterval(() => {
      if (!audioContextStarted.current) return;
      
      try {
        // Ensure audio context is running
        if (Tone.context.state !== 'running') {
          Tone.context.resume();
        }
        
        // Update master volume
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = masterVolume;
        }
        
        // Process each planet's synth
        orbitData.forEach(planet => {
          const synth = synthsRef.current[planet.name];
          if (!synth) return;
          
          if (planet.enabled) {
            const freq = currentFrequencies[planet.name];
            if (freq) {
              // Only update frequency if synth is already active
              if (activeSynthsRef.current.has(planet.name)) {
                synth.frequency.value = freq;
              } else {
                // Start synth if not active
                synth.triggerAttack(freq);
                activeSynthsRef.current.add(planet.name);
              }
            }
          } else if (activeSynthsRef.current.has(planet.name)) {
            // Release synth if planet is disabled but synth is active
            synth.triggerRelease();
            activeSynthsRef.current.delete(planet.name);
          }
        });
      } catch (err) {
        console.error("Error in audio update interval:", err);
      }
    }, 50); // Update every 50ms for smooth changes
    
    return () => {
      clearInterval(intervalId);
    };
  }, [liveMode, orbitData, currentFrequencies, masterVolume]);
  
  // Handle master volume changes
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    
    setMasterVolume(newVolume);
    
    const updateAudioVolume = async () => {
      try {
        if (!audioContextStarted.current) {
          await startAudioContext();
        }
        
        const dbValue = Tone.gainToDb(newVolume);
        
        Tone.Destination.volume.value = dbValue;
        
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = newVolume;
        }
      } catch (error) {
        console.error("Error updating audio volume:", error);
      }
    };
    
    updateAudioVolume();
  };

  // Handle zoom level changes
  const handleZoomChange = (e) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  // Toggle between pause and play
  const togglePlayPause = async () => {
    await startAudioContext();
    if (isPaused) {
      setPositionMode('normal'); // Reset position mode when resuming
    }
    setIsPaused(!isPaused);
  };

  // Handle base frequency changes
  const handleBaseFrequencyChange = (e) => {
    // Immediately update the UI with the new value
    const newBaseFrequency = parseFloat(e.target.value);
    setBaseFrequency(newBaseFrequency);
    
    // Use a separate function for the async operations
    updateAudioFrequency(newBaseFrequency);
  };
  
  // Separate function for audio context and synth updates
  const updateAudioFrequency = async (newBaseFrequency) => {
    try {
      await startAudioContext();
      
      // Recalculate the frequencies based on the new base frequency
      const recalculatedFrequencies = {};
      orbitData.forEach((planet, index) => {
        if (planet.enabled) {
          // Calculate using the Bode law formula
          const n = index - 2; // Adjust so Earth is index 0
          const baseFreq = calculateBaseFrequencies(newBaseFrequency, n);
          recalculatedFrequencies[planet.name] = baseFreq;
        }
      });
      
      // Update the frequencies in the state 
      setCurrentFrequencies(prevFreqs => ({
        ...prevFreqs,
        ...recalculatedFrequencies
      }));
    } catch (error) {
      console.error("Error updating audio frequency:", error);
    }
  };

  // Function to activate/deactivate a planet
  const togglePlanet = async (index) => {
    await startAudioContext();
    
    const newData = [...orbitData];
    const planet = newData[index];
    const wasEnabled = planet.enabled;
    planet.enabled = !wasEnabled;
    setOrbitData(newData);
    
    // If disabling a planet in live mode, release its synth
    if (liveMode && wasEnabled) {
      const synth = synthsRef.current[planet.name];
      if (synth) {
        synth.triggerRelease();
        activeSynthsRef.current.delete(planet.name);
      }
    }
  };

  // Function to activate/deactivate all planets
  const toggleAllPlanets = async (enable) => {
    await startAudioContext();
    
    const newData = orbitData.map(planet => ({
      ...planet,
      enabled: enable
    }));
    
    setOrbitData(newData);
    
    // If disabling planets in live mode, release their synths
    if (liveMode && !enable) {
      Object.values(synthsRef.current).forEach(synth => {
        if (synth) synth.triggerRelease();
      });
      activeSynthsRef.current.clear();
    }
  };

  // Activate/deactivate live mode
  const toggleLiveMode = async () => {
    try {
      const audioStarted = await startAudioContext();
      if (!audioStarted) {
        console.log("User interaction needed for audio");
        return;
      }
      
      // If turning off live mode, make sure to release all synths first
      if (liveMode) {
        Object.values(synthsRef.current).forEach(synth => {
          if (synth) synth.triggerRelease();
        });
        activeSynthsRef.current.clear();
      }
      
      // Then update state
      setLiveMode(!liveMode);
    } catch (error) {
      console.error("Error toggling live mode:", error);
    }
  };

  // Effect for pause state
  useEffect(() => {
    if (isPaused) {
      lastFrequenciesRef.current = { ...currentFrequencies };
      wasPausedRef.current = true;
    } else {
      if (wasPausedRef.current) {
        console.log("Animation resumed. Frequencies updating.");
        wasPausedRef.current = false;
      }
    }
  }, [isPaused, currentFrequencies]);

  // Handle frequency changes from visualization
  const handleFrequencyChange = useCallback((frequencies) => {
    const updatedFrequencies = { ...currentFrequencies, ...frequencies };
    setCurrentFrequencies(updatedFrequencies);
    
    lastFrequenciesRef.current = { ...lastFrequenciesRef.current, ...frequencies };
  }, [currentFrequencies]);

  // Start audio context safely
  const startAudioContext = async () => {
    if (!audioContextStarted.current) {
      try {
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }
        
        await Tone.start();
        audioContextStarted.current = true;
        
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }
        
        setNeedsUserInteraction(false);
        
        return true;
      } catch (error) {
        console.error("Could not start AudioContext:", error);
        setNeedsUserInteraction(true);
        return false;
      }
    } else if (Tone.context.state !== 'running') {
      try {
        await Tone.context.resume();
        setNeedsUserInteraction(false);
        return true;
      } catch (error) {
        console.error("Could not resume AudioContext:", error);
        setNeedsUserInteraction(true);
        return false;
      }
    }
    return true;
  };

  // Play or stop orbital sequence
  const playOrbitalSequence = async () => {
    const audioStarted = await startAudioContext();
    if (!audioStarted) {
      console.log("User interaction needed for audio");
      return;
    }
    
    if (isPlaying) {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }
      
      if (mainSynthRef.current) {
        mainSynthRef.current.releaseAll();
        
        Tone.Transport.cancel();
        
        if (mainSynthRef.current) {
          mainSynthRef.current.disconnect();
          mainSynthRef.current.dispose();
        }
          
        const newMainSynth = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 1
          },
          oscillator: {
            type: 'sine'
          }
        }).connect(gainNodeRef.current || Tone.Destination);
        
        mainSynthRef.current = newMainSynth;
      }
      
      setIsPlaying(false);
      
      return;
    }
    
    if (!mainSynthRef.current || liveMode) return;
    
    try {
      setIsPlaying(true);
      
      const now = Tone.now();
      const enabledPlanets = orbitData.filter(planet => planet.enabled);
      
      const scheduleNote = (planet, index) => {
        const originalIndex = orbitData.findIndex(p => p.name === planet.name);
        const freq = calculateBaseFrequencies(baseFrequency, originalIndex - 2);
        const time = now + index * 0.75;
        
        mainSynthRef.current.triggerAttackRelease(freq, "1n", time, 0.3);
      };
      
      enabledPlanets.forEach(scheduleNote);
      
      sequenceTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        sequenceTimeoutRef.current = null;
      }, enabledPlanets.length * 750 + 500);
    } catch (error) {
      console.error("Error playing orbital sequence:", error);
      setIsPlaying(false);
    }
  };

  // Convert volume to decibels for display
  const volumeToDb = (volume) => {
    if (volume <= 0.01) return "-∞";
    return Tone.gainToDb(volume).toFixed(1);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Obtener colores de planetas para los toggle switches
  const getPlanetColor = (name) => {
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
    
    return planetColors[name] || "#999";
  };

  // Update frequencies and synths when base frequency changes in live mode
  useEffect(() => {
    if (liveMode && !isPaused) {
      // Recalculate frequencies based on the new base frequency
      const updatedFrequencies = {};
      orbitData.forEach((planet, index) => {
        if (planet.enabled) {
          const n = index - 2; // Adjust so Earth is index 0
          const baseFreq = calculateBaseFrequencies(baseFrequency, n);
          updatedFrequencies[planet.name] = baseFreq;
        }
      });
      
      // Update the frequencies in state
      setCurrentFrequencies(prevFreqs => ({
        ...prevFreqs,
        ...updatedFrequencies
      }));
    }
  }, [baseFrequency, liveMode, isPaused, orbitData, calculateBaseFrequencies]);

  return (
    <div 
      className="container" 
      onClick={needsUserInteraction ? handleUserInteraction : undefined}
    >
      <div className="visualization-container">
        <div className="orbital-display">
          <PlanetarySystem 
            orbitData={orbitData} 
            animationSpeed={animationSpeed} 
            setAnimationSpeed={setAnimationSpeed}
            baseFrequency={baseFrequency}
            onFrequencyChange={handleFrequencyChange}
            isPaused={isPaused}
            setToAverageDistance={positionMode === 'average'}
            setToAphelion={positionMode === 'aphelion'}
            setToPerihelion={positionMode === 'perihelion'}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
          />
        </div>
        
        {/* Controles flotantes minimizados (siempre visibles) */}
        <div className="floating-controls fade-in">
          <button 
            className="floating-button"
            onClick={togglePlayPause}
            disabled={isPlaying}
            title={isPaused ? "Play Animation" : "Pause Animation"}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          
          <button 
            className="floating-button"
            onClick={() => setPositionMode('average')}
            disabled={isPlaying}
            title="Set to Average Distance"
          >
            🔄
          </button>
          
          <button 
            className="floating-button"
            onClick={() => setPositionMode('aphelion')}
            disabled={isPlaying}
            title="Set to Aphelion"
          >
            🌞
          </button>
          
          <button 
            className="floating-button"
            onClick={() => setPositionMode('perihelion')}
            disabled={isPlaying}
            title="Set to Perihelion"
          >
            ☀️
          </button>
          
          <button 
            className="floating-button"
            onClick={toggleLiveMode}
            disabled={isPlaying}
            title={liveMode ? "Disable Live Mode" : "Enable Live Mode"}
            style={{backgroundColor: liveMode ? 'rgba(69, 160, 73, 0.5)' : 'rgba(76, 175, 80, 0.5)'}}
          >
            🔊
          </button>
        </div>
        
        {/* Botón para acceder a más configuraciones */}
        <button 
          className="more-settings-button" 
          onClick={toggleSidebar}
          title="More Settings"
        >
          {sidebarCollapsed ? '⚙️' : '✖️'}
        </button>
        
        {/* Panel lateral de configuraciones avanzadas */}
        <div className={`controls-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {/* Pestañas de navegación */}
          <div className="sidebar-tabs">
            <button 
              className={`tab-button ${activeTab === 'controls' ? 'active' : ''}`}
              onClick={() => setActiveTab('controls')}
            >
              Controls
            </button>
            <button 
              className={`tab-button ${activeTab === 'planets' ? 'active' : ''}`}
              onClick={() => setActiveTab('planets')}
            >
              Planets
            </button>
          </div>
          
          {/* Contenido de la pestaña de controles */}
          {activeTab === 'controls' && (
            <div className="sidebar-content fade-in">
              <div className="control-group">
                <label htmlFor="volume-slider" className="label">
                  Master Volume: {volumeToDb(masterVolume)} dB
                </label>
                <input 
                  id="volume-slider"
                  type="range" 
                  value={masterVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  className="slider"
                  onChange={handleVolumeChange}
                  onInput={handleVolumeChange}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              
              <div className="control-group">
                <label htmlFor="frequency-slider" className="label">
                  Base Frequency: {baseFrequency.toFixed(1)} Hz
                </label>
                <input 
                  id="frequency-slider"
                  type="range" 
                  value={baseFrequency}
                  min={27.5}
                  max={110}
                  step={0.5}
                  className="slider"
                  onChange={handleBaseFrequencyChange}
                  onInput={handleBaseFrequencyChange}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Base Frequency"
                  aria-valuemin={27.5}
                  aria-valuemax={110}
                  aria-valuenow={baseFrequency}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              
              {/* Zoom control moved to sidebar */}
              <div className="control-group">
                <label htmlFor="zoom-slider" className="label">
                  Zoom Level: {zoomLevel.toFixed(1)}x
                </label>
                <input 
                  id="zoom-slider"
                  type="range" 
                  value={zoomLevel}
                  min={1}
                  max={20}
                  step={0.1}
                  className="slider"
                  onChange={handleZoomChange}
                />
                <div className="control-tip">
                  {zoomLevel > 1.1 ? 
                    "Drag the system with your mouse to pan the view" : 
                    "Increase zoom to see outer planet orbits more clearly"}
                </div>
              </div>
              
              {/* Animation speed control moved to sidebar */}
              <div className="control-group">
                <label htmlFor="speed-slider" className="label">
                  Animation Speed: {animationSpeed.toFixed(1)}x
                </label>
                <input 
                  id="speed-slider"
                  type="range" 
                  min={1}
                  max={50}
                  step={0.1}
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                  className="slider"
                />
                <div className="control-tip">
                  Adjust speed to observe orbital relationships
                </div>
              </div>
              
              <div className="live-mode-toggle">
                <label className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={liveMode}
                    onChange={toggleLiveMode}
                    disabled={isPlaying}
                  />
                  Live mode (continuous sound)
                </label>
              </div>
              
              <button 
                onClick={playOrbitalSequence}
                disabled={liveMode}
                className="button"
                style={{marginTop: '10px'}}
              >
                {isPlaying ? 'Stop Sequence' : 'Play Orbital Sequence'}
              </button>
              
              <p className="note" style={{marginTop: '15px'}}>
                {isPaused && liveMode ? (
                  <strong>Animation paused, sound continues with fixed frequencies.</strong>
                ) : (
                  "Orbital velocities and frequencies vary with distance from the Sun."
                )}
              </p>
            </div>
          )}
          
          {/* Contenido de la pestaña de planetas */}
          {activeTab === 'planets' && (
            <div className="sidebar-content planets-tab fade-in">
              <div className="master-toggle">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={orbitData.every(planet => planet.enabled)}
                    onChange={() => toggleAllPlanets(!orbitData.every(planet => planet.enabled))}
                    disabled={isPlaying}
                  />
                  {orbitData.every(planet => planet.enabled) ? 'Disable All' : 'Enable All'}
                </label>
              </div>
              
              <div className="planets-list">
                {orbitData.map((planet, index) => (
                  <div 
                    key={planet.name} 
                    className={`planet-item ${planet.enabled ? 'enabled' : 'disabled'}`}
                    style={{
                      borderLeft: `4px solid ${getPlanetColor(planet.name)}`
                    }}
                  >
                    <label className="planet-toggle-label">
                      <input 
                        type="checkbox" 
                        checked={planet.enabled}
                        onChange={() => togglePlanet(index)}
                        disabled={isPlaying}
                      />
                      <span className="planet-name">{planet.name}</span>
                    </label>
                    
                    <div className="planet-info">
                      <div className="planet-data">
                        <span className="data-label">Dist:</span>
                        <span className="data-value">{planet.distance.toFixed(2)} AU</span>
                      </div>
                      <div className="planet-data">
                        <span className="data-label">Freq:</span>
                        <span className="data-value">
                          {currentFrequencies[planet.name] 
                            ? `${currentFrequencies[planet.name].toFixed(1)} Hz`
                            : "Calculating..."}
                        </span>
                      </div>
                      <div className="planet-data">
                        <span className="data-label">Note:</span>
                        <span className="data-value note-value">
                          {currentFrequencies[planet.name] 
                            ? frequencyToNote(currentFrequencies[planet.name])
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrbitalSonification;