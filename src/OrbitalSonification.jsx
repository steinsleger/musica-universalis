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
  const [masterVolume, setMasterVolume] = useState(0.35); // -9dB approximately
  // Add user interaction handling state
  const [needsUserInteraction, setNeedsUserInteraction] = useState(true);
  
  // References to avoid audio/animation issues
  const audioContextStarted = useRef(false);
  const frequencyUpdateTimeoutRef = useRef(null);
  const gainNodeRef = useRef(null);
  const initFrequenciesRef = useRef(false);
  
  // New reference to keep individual synthesizers
  const synthsRef = useRef({});
  const mainSynthRef = useRef(null);
  
  // Save the last frequencies used when paused
  const lastFrequenciesRef = useRef({});
  
  // Reference to follow the orbital sequence timeout
  const sequenceTimeoutRef = useRef(null);
  
  // Reference to follow the previous state of pause
  const wasPausedRef = useRef(false);
  
  // Debug flag
  const debug = useRef(true);

  // Handle first user interaction on the page to initialize audio
  const handleUserInteraction = async () => {
    if (needsUserInteraction) {
      try {
        const started = await startAudioContext();
        if (started) {
          setNeedsUserInteraction(false);
          // Silent initialization - no console logs visible to user
        }
      } catch (error) {
        // Silent error handling - don't show errors to user
        console.error("Error initializing audio on user interaction:", error);
      }
    }
  };

  // Add a global click handler to capture user interaction - keep this to ensure
  // we get the first click anywhere on the page
  useEffect(() => {
    if (needsUserInteraction) {
      const handleGlobalClick = async () => {
        await handleUserInteraction();
      };
      
      // Add event listeners to increase chances of capturing user interaction
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
        // Create a gain node to control overall volume
        const gainNode = new Tone.Gain(masterVolume).toDestination();
        gainNodeRef.current = gainNode;
        
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
        }).connect(gainNode);
        
        mainSynthRef.current = mainSynth;
        
        // Create individual synthesizer for each planet
        orbitData.forEach(planet => {
          // Create a new synthesizer with a clean context
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
          }).connect(gainNode);
          
          // Store the synthesizer in the reference
          synthsRef.current[planet.name] = planetSynth;
        });
        
        // Try to start the audio context (may fail if no interaction)
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
      // Clean up all synthesizers
      if (gainNodeRef.current) {
        gainNodeRef.current.dispose();
      }
      if (frequencyUpdateTimeoutRef.current) {
        clearTimeout(frequencyUpdateTimeoutRef.current);
      }
      if (mainSynthRef.current) {
        mainSynthRef.current.dispose();
      }
      
      // Clean up all individual synthesizers
      Object.values(synthsRef.current).forEach(synth => {
        if (synth) synth.dispose();
      });
    };
  }, [orbitData, masterVolume]);
  
  // NEW: Effect to keep audio state synchronized with application state
  // This effect will now be responsible for managing audio independently
  useEffect(() => {
    if (!liveMode) return;
    
    // Ensure audio context is started
    const setupAudio = async () => {
      try {
        // Ensure Tone.js is ready
        if (!audioContextStarted.current) {
          await Tone.start();
          audioContextStarted.current = true;
        }
        
        // Resume audio context
        await Tone.context.resume();
        
        // Ensure the gain node has the current master volume value
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = masterVolume;
        }
        
        // Rebuild entire audio state based on current application state
        // This ensures we always have a coherent audio state
        orbitData.forEach(planet => {
          const synth = synthsRef.current[planet.name];
          if (!synth) return;
          
          // Stop any previous sound to start from a clean state
          synth.triggerRelease();
          
          // If the planet is enabled, start its sound
          if (planet.enabled && liveMode) {
            const freq = isPaused ? 
              (lastFrequenciesRef.current[planet.name] || currentFrequencies[planet.name]) : 
              currentFrequencies[planet.name];
              
            if (freq) {
              // Small delay to ensure previous release had effect
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
  }, [liveMode, orbitData, isPaused, masterVolume]); // Add masterVolume as dependency
  
  // Restore effect for master volume control
  useEffect(() => {
    if (gainNodeRef.current) {
      try {
        // Convert linear volume to a more suitable exponential scale for audio
        // This avoids silencing issues with small values
        const dbValue = masterVolume === 0 ? -Infinity : 20 * Math.log10(masterVolume);
        
        // Use rampTo to avoid clicks and abrupt transitions
        gainNodeRef.current.gain.rampTo(masterVolume, 0.05);
        
        if (debug.current) {
          console.log(`Volume set to ${masterVolume} (${dbValue.toFixed(1)} dB)`);
        }
      } catch (e) {
        console.error("Error setting volume:", e);
      }
    }
  }, [masterVolume]);
  
  // Toggle between pause and play - Now also attempts to start audio
  const togglePlayPause = async () => {
    // Always try to start audio context when user interacts with play button
    await startAudioContext();
    setIsPaused(!isPaused);
  };

  // Handle base frequency changes - also try to start audio
  const handleBaseFrequencyChange = async (e) => {
    // Try to start audio since user interacted with controls
    await startAudioContext();
    
    const newBaseFrequency = parseFloat(e.target.value);
    setBaseFrequency(newBaseFrequency);
    
    // Frequency update now happens automatically in useEffect,
    // which guarantees it will be updated everywhere needed
    
    // If we're in live mode and NOT paused, update sounds
    if (liveMode && !isPaused) {
      setTimeout(() => {
        // Update frequencies for active planets
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

  // Handle master volume changes - also try to start audio
  const handleVolumeChange = async (e) => {
    // Try to start audio since user interacted with controls
    await startAudioContext();
    
    const newVolume = parseFloat(e.target.value);
    setMasterVolume(newVolume);
  };

  // Function to activate/deactivate a planet - now also starts audio
  const togglePlanet = async (index) => {
    // Try to start audio since user interacted with controls
    await startAudioContext();
    
    // Create a copy of the data to modify
    const newData = [...orbitData];
    // Get the planet to modify
    const planet = newData[index];
    // Invert its state
    planet.enabled = !planet.enabled;
    // Update state - effect will handle updating audio
    setOrbitData(newData);
    
    // Force audio context resume - safety measure
    if (liveMode) {
      Tone.context.resume().catch(e => console.error("Error resuming audio context:", e));
    }
  };

  // New function to activate/deactivate all planets - also starts audio
  const toggleAllPlanets = async (enable) => {
    // Try to start audio since user interacted with controls
    await startAudioContext();
    
    // Create a copy of the data to modify
    const newData = orbitData.map(planet => ({
      ...planet,
      enabled: enable
    }));
    
    // Update state - effect will handle updating audio
    setOrbitData(newData);
    
    // Force audio context resume - safety measure
    if (liveMode) {
      Tone.context.resume().catch(e => console.error("Error resuming audio context:", e));
    }
  };

  // Activate/deactivate live mode - IMPROVED WITH AUDIO CONTEXT HANDLING
  const toggleLiveMode = async () => {
    try {
      // Get user interaction to start audio context
      const audioStarted = await startAudioContext();
      if (!audioStarted) {
        // Silently try again without alerts
        console.log("User interaction needed for audio");
        return;
      }
      
      // Simply toggle the state - effect will handle audio
      setLiveMode(!liveMode);
      
      if (liveMode) {
        // Deactivating live mode, stop all sounds
        Object.values(synthsRef.current).forEach(synth => {
          if (synth) synth.triggerRelease();
        });
      }
    } catch (error) {
      console.error("Error toggling live mode:", error);
    }
  };

  // Now when pausing doesn't affect sounds, only animation
  // and frequency update
  useEffect(() => {
    if (isPaused) {
      // Save current frequencies
      lastFrequenciesRef.current = { ...currentFrequencies };
      console.log("Animation paused. Frequencies frozen.");
      // Update pause state reference
      wasPausedRef.current = true;
    } else {
      // Only show message if previously paused
      if (wasPausedRef.current) {
        console.log("Animation resumed. Frequencies updating.");
        // Reset pause state
        wasPausedRef.current = false;
      }
    }
  }, [isPaused, currentFrequencies]);

  // Handle frequency changes from visualization - SIMPLIFIED
  const handleFrequencyChange = useCallback((frequencies) => {
    // Update state for interface
    const updatedFrequencies = { ...currentFrequencies, ...frequencies };
    setCurrentFrequencies(updatedFrequencies);
    
    // Also save the last frequencies used
    lastFrequenciesRef.current = { ...lastFrequenciesRef.current, ...frequencies };
    
    // Only update synthesizers if not paused and we're in live mode
    if (liveMode && !isPaused) {
      // Update frequencies for active synthesizers
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

  // Start audio context safely - IMPROVED WITH USER INTERACTION HANDLING
  const startAudioContext = async () => {
    if (!audioContextStarted.current) {
      try {
        // Attempt to resume the AudioContext first if it exists
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }
        
        // Then try to start Tone.js
        await Tone.start();
        audioContextStarted.current = true;
        console.log("AudioContext started successfully");
        
        // Force resume for Safari and mobile browsers
        if (Tone.context.state !== 'running') {
          console.log("Additional context resume needed");
          await Tone.context.resume();
        }
        
        // Mark that we don't need user interaction anymore
        setNeedsUserInteraction(false);
        
        return true;
      } catch (error) {
        console.error("Could not start AudioContext:", error);
        console.log("Auto-play policy may be preventing audio. User interaction required.");
        // Make sure we still need user interaction
        setNeedsUserInteraction(true);
        return false;
      }
    } else if (Tone.context.state !== 'running') {
      // If context exists but is suspended, try to resume it
      try {
        await Tone.context.resume();
        console.log("AudioContext resumed successfully");
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

  // Play or stop orbital sequence using the main synthesizer
  const playOrbitalSequence = async () => {
    // Try to start audio context - uses user interaction
    const audioStarted = await startAudioContext();
    if (!audioStarted) {
      // Silently try again without alerts
      console.log("User interaction needed for audio");
      return;
    }
    
    // Rest of the playOrbitalSequence function
    // If already playing, stop the sequence
    if (isPlaying) {
      // Cancel pending timeout
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }
      
      // Stop all sounds in the main synthesizer
      if (mainSynthRef.current) {
        mainSynthRef.current.releaseAll();
        
        // Cancel all scheduled events in Tone.js
        Tone.Transport.cancel();
        
        // Create new synthesizer to avoid pending events
        const gainNode = gainNodeRef.current;
        if (gainNode) {
          // Dispose old synth
          if (mainSynthRef.current) {
            mainSynthRef.current.disconnect();
            mainSynthRef.current.dispose();
          }
          
          // Create new synth
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
          }).connect(gainNode);
          
          mainSynthRef.current = newMainSynth;
        }
      }
      
      // Update state
      setIsPlaying(false);
      
      if (debug.current) {
        console.log("Orbital sequence stopped");
      }
      
      return;
    }
    
    // If not playing, start new sequence
    if (!mainSynthRef.current || liveMode) return;
    
    try {
      setIsPlaying(true);
      
      const now = Tone.now();
      const enabledPlanets = orbitData.filter(planet => planet.enabled);
      
      // Use a more direct approach with individual scheduling instead of all at once
      const scheduleNote = (planet, index) => {
        const originalIndex = orbitData.findIndex(p => p.name === planet.name);
        const freq = calculateBaseFrequencies(baseFrequency, originalIndex - 2);
        const time = now + index * 0.75;
        
        // Schedule the note with a bit more precise timing
        mainSynthRef.current.triggerAttackRelease(freq, "1n", time, 0.3);
        
        if (debug.current) {
          console.log(`Scheduled ${planet.name} at ${freq.toFixed(1)} Hz, time: +${index * 0.75}s`);
        }
      };
      
      // Schedule each planet's note
      enabledPlanets.forEach(scheduleNote);
      
      // Save reference to timeout for canceling
      sequenceTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        sequenceTimeoutRef.current = null;
      }, enabledPlanets.length * 750 + 500);
    } catch (error) {
      console.error("Error playing orbital sequence:", error);
      setIsPlaying(false);
    }
  };

  // Convert volume to decibels for display in interface
  const volumeToDb = (volume) => {
    // Avoid log of 0
    if (volume <= 0.01) return "-∞";
    return (20 * Math.log10(volume)).toFixed(1);
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

  return (
    <div 
      className="container" 
      onClick={needsUserInteraction ? handleUserInteraction : undefined}
    >
      {/* Modal removed, but we still handle click events for audio initialization */}
      
      <h2 className="title">Planetary Orbits Sonification</h2>
      
      <div className="visualization-container">
        <div className="orbital-display">
          <PlanetarySystem 
            orbitData={orbitData} 
            animationSpeed={animationSpeed} 
            baseFrequency={baseFrequency}
            onFrequencyChange={handleFrequencyChange}
            isPaused={isPaused}
          />
        </div>
        <div className="controls">
          <div className="control-group">
            <label htmlFor="speed-slider" className="label">
              Animation Speed: {animationSpeed.toFixed(1)}x
            </label>
            <input 
              id="speed-slider"
              type="range" 
              value={animationSpeed}
              min={0.1}
              max={5}
              step={0.1}
              className="slider"
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            />
          </div>
          
          {/* Master volume control */}
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
            />
          </div>
          
          <div className="playback-controls">
            <button 
              onClick={togglePlayPause}
              className="button playback-button"
              disabled={isPlaying}
            >
              {isPaused ? '▶️ Resume Animation' : '⏸️ Pause Animation'}
            </button>
          </div>
          
          <div className="live-mode-toggle">
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={liveMode}
                onChange={toggleLiveMode}
                disabled={isPlaying}
              />
              Live mode (continuous sound following elliptical orbits)
            </label>
          </div>
          
          <p className="note">
            Orbital velocities and frequencies vary according to the distance from the Sun at each point of the elliptical orbit.
            {isPaused && liveMode && (
              <strong> The animation is paused, but the sound continues with fixed frequencies.</strong>
            )}
          </p>
        </div>
      </div>
      
      <div className="slider-container">
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

      <button 
        onClick={playOrbitalSequence}
        disabled={liveMode}
        className="button"
      >
        {isPlaying ? 'Stop Orbital Sequence' : 'Play Orbital Sequence'}
      </button>

      <div className="table-container">
        <h3>Celestial Bodies and Frequencies</h3>
        
        {/* Checkbox to activate/deactivate all planets */}
        <div className="master-toggle">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={orbitData.every(planet => planet.enabled)}
              onChange={() => toggleAllPlanets(!orbitData.every(planet => planet.enabled))}
              disabled={isPlaying}
            />
            {orbitData.every(planet => planet.enabled) ? 'Disable All Planets' : 'Enable All Planets'}
          </label>
        </div>
        
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
                  {/* Use currentFrequencies for displaying actual values */}
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
    </div>
  );
};

export default OrbitalSonification;