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

  // Initialize synthesizer system
  useEffect(() => {
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
        
        // Create individual synthesizer for each planet
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
      } catch (error) {
        console.error("Error initializing audio components:", error);
      }
    };
    
    initTone();
    
    return () => {
      if (frequencyUpdateTimeoutRef.current) {
        clearTimeout(frequencyUpdateTimeoutRef.current);
      }
      if (mainSynthRef.current) {
        mainSynthRef.current.dispose();
      }
      
      Object.values(synthsRef.current).forEach(synth => {
        if (synth) synth.dispose();
      });
    };
  }, [orbitData]);
  
  // Effect to keep audio state synchronized with application state
  useEffect(() => {
    if (!liveMode) return;
    
    const setupAudio = async () => {
      try {
        if (!audioContextStarted.current) {
          await Tone.start();
          audioContextStarted.current = true;
        }
        
        await Tone.context.resume();
        
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = masterVolume;
          
          try {
            gainNodeRef.current.gain.rampTo(masterVolume, 0.05);
          } catch (e) {
            console.log("Using direct volume setting");
          }
        }
        
        orbitData.forEach(planet => {
          const synth = synthsRef.current[planet.name];
          if (!synth) return;
          
          synth.triggerRelease();
          
          if (planet.enabled && liveMode) {
            const freq = isPaused ? 
              (lastFrequenciesRef.current[planet.name] || currentFrequencies[planet.name]) : 
              currentFrequencies[planet.name];
              
            if (freq) {
              setTimeout(() => {
                synth.triggerAttack(freq);
              }, 50);
            }
          }
        });
      } catch (err) {
        console.error("Error setting up audio state:", err);
      }
    };
    
    setupAudio();
  }, [liveMode, orbitData, isPaused, masterVolume]);
  
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

  // Toggle between pause and play
  const togglePlayPause = async () => {
    await startAudioContext();
    if (isPaused) {
      setPositionMode('normal'); // Reset position mode when resuming
    }
    setIsPaused(!isPaused);
  };

  // Handle base frequency changes
  const handleBaseFrequencyChange = async (e) => {
    await startAudioContext();
    
    const newBaseFrequency = parseFloat(e.target.value);
    setBaseFrequency(newBaseFrequency);
    
    if (liveMode && !isPaused) {
      setTimeout(() => {
        orbitData.forEach(planet => {
          if (planet.enabled) {
            const planetSynth = synthsRef.current[planet.name];
            const freq = currentFrequencies[planet.name];
            if (planetSynth && freq) {
              planetSynth.frequency.value = freq;
            }
          }
        });
      }, 10);
    }
  };

  // Function to activate/deactivate a planet
  const togglePlanet = async (index) => {
    await startAudioContext();
    
    const newData = [...orbitData];
    const planet = newData[index];
    planet.enabled = !planet.enabled;
    setOrbitData(newData);
    
    if (liveMode) {
      Tone.context.resume().catch(e => console.error("Error resuming audio context:", e));
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
    
    if (liveMode) {
      Tone.context.resume().catch(e => console.error("Error resuming audio context:", e));
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
      
      setLiveMode(!liveMode);
      
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = masterVolume;
      }
      
      if (liveMode) {
        Object.values(synthsRef.current).forEach(synth => {
          if (synth) synth.triggerRelease();
        });
      }
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
    
    if (liveMode && !isPaused) {
      Object.entries(frequencies).forEach(([planetName, freq]) => {
        const planet = orbitData.find(p => p.name === planetName);
        if (planet && planet.enabled) {
          const planetSynth = synthsRef.current[planetName];
          if (planetSynth) {
            planetSynth.frequency.value = freq;
          }
        }
      });
    }
  }, [liveMode, currentFrequencies, isPaused, orbitData]);

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

  // Clean up timeouts on component unmount
  useEffect(() => {
    return () => {
      if (frequencyUpdateTimeoutRef.current) {
        clearTimeout(frequencyUpdateTimeoutRef.current);
      }
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

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
            ⏹️
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
            style={{background: liveMode ? '#45a049' : '#4CAF50'}}
          >
            🔊
          </button>
        </div>
        
        {/* Control compacto de velocidad */}
        <div className="speed-control-compact fade-in">
          <div className="speed-label">Animation Speed: {animationSpeed.toFixed(1)}x</div>
          <input 
            type="range" 
            min="0.1"
            max="10"
            step="0.1"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="speed-slider"
          />
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
                />
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
      
      {/* Contenido desplazable */}
      <div className="table-container">
        <h3>Celestial Bodies and Frequencies</h3>
        
        <table className="table">
          <thead>
            <tr>
              <th>Enable</th>
              <th>Planet</th>
              <th>Distance (AU)</th>
              <th>Eccentricity</th>
              <th>Current Freq (Hz)</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {orbitData.map((planet, index) => (
              <tr key={planet.name} className={planet.enabled ? 'enabled' : 'disabled'}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={planet.enabled}
                    onChange={() => togglePlanet(index)}
                    disabled={isPlaying}
                  />
                </td>
                <td>{planet.name}</td>
                <td>{planet.distance.toFixed(2)}</td>
                <td>{planet.eccentricity.toFixed(4)}</td>
                <td>
                  {currentFrequencies[planet.name] 
                    ? currentFrequencies[planet.name].toFixed(1) 
                    : "Calculating..."}
                </td>
                <td>
                  {currentFrequencies[planet.name] 
                    ? frequencyToNote(currentFrequencies[planet.name])
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Espacio al final para mejor desplazamiento */}
      <div className="content-end-spacer"></div>
    </div>
  );
};

export default OrbitalSonification;