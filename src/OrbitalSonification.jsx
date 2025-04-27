// src/OrbitalSonification.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import PlanetarySystem from './PlanetarySystem';
import InfoModal from './components/InfoModal';
import { calculatePlanetaryFrequency } from './utils/calculatePlanetaryFrequency';

const OrbitalSonification = () => {
  // State for planetary orbit data - with Titius-Bode law distances and actual distances in AU
  const [orbitData, setOrbitData] = useState([
    { name: "Mercury", distance: 0.4, actualDistance: 0.39, eccentricity: 0.2056, enabled: true },
    { name: "Venus", distance: 0.7, actualDistance: 0.72, eccentricity: 0.0068, enabled: true },
    { name: "Earth", distance: 1.0, actualDistance: 1.00, eccentricity: 0.0167, enabled: true },
    { name: "Mars", distance: 1.6, actualDistance: 1.52, eccentricity: 0.0934, enabled: true },
    { name: "Ceres", distance: 2.8, actualDistance: 2.77, eccentricity: 0.0758, enabled: true },
    { name: "Jupiter", distance: 5.2, actualDistance: 5.20, eccentricity: 0.0484, enabled: true },
    { name: "Saturn", distance: 10.0, actualDistance: 9.58, eccentricity: 0.0539, enabled: true },
    { name: "Uranus", distance: 19.6, actualDistance: 19.20, eccentricity: 0.0473, enabled: true },
    { name: "Neptune", distance: 38.8, actualDistance: 30.05, eccentricity: 0.0086, enabled: true },
    { name: "Pluto", distance: 77.2, actualDistance: 39.48, eccentricity: 0.2488, enabled: true }
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
  const [distanceMode, setDistanceMode] = useState('titiusBode'); // 'titiusBode' or 'actual'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('controls'); // 'controls' o 'planets'
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  const audioContextStarted = useRef(false);
  const gainNodeRef = useRef(null);
  const initFrequenciesRef = useRef(false);
  const synthsRef = useRef({});
  const mainSynthRef = useRef(null);
  const lastFrequenciesRef = useRef({});
  const sequenceTimeoutRef = useRef(null);
  const debug = useRef(true);
  const activeSynthsRef = useRef(new Set());
  const audioInitializedRef = useRef(false);
  const prevPositionMode = useRef(positionMode);

  // Calculate frequencies based on the modified Bode law or actual distances
  const calculateBaseFrequencies = useCallback((baseFreq, planet, index) => {
    return calculatePlanetaryFrequency(baseFreq, planet, distanceMode);
  }, [distanceMode]);

  // Function to calculate and update all frequencies
  const updateAllFrequencies = useCallback(() => {
    const defaultFrequencies = {};
    orbitData.forEach((planet, index) => {
      // Calculate frequencies based on the selected distance mode
      const freq = calculateBaseFrequencies(baseFrequency, planet, index);
      defaultFrequencies[planet.name] = freq;
    });
    
    setCurrentFrequencies(defaultFrequencies);
    
    return defaultFrequencies;
  }, [orbitData, baseFrequency, calculateBaseFrequencies]);

  // Handle frequency changes from visualization
  const handleFrequencyChange = useCallback((frequencies) => {    
    const updatedFrequencies = { ...currentFrequencies, ...frequencies };
    
    // Store the new frequencies in state
    setCurrentFrequencies(updatedFrequencies);
    
    // Store in ref for the animation loop to access
    lastFrequenciesRef.current = { ...lastFrequenciesRef.current, ...frequencies };
    
    // If in live mode, immediately update the frequencies of active synths
    if (liveMode) {
      Object.entries(frequencies).forEach(([planetName, freq]) => {
        if (activeSynthsRef.current.has(planetName)) {
          updatePlanetFrequency(planetName, freq);
        }
      });
    }
  }, [currentFrequencies, liveMode]);

  // Initialize audio when component loads
  useEffect(() => {
    if (!audioInitializedRef.current) {
      initializeAudioContext().then(success => {
        if (success) {
          audioInitializedRef.current = true;
          debugAudio("Audio initialized on component load");
        } else {
          debugAudio("Failed to initialize audio on component load");
        }
      });
    }
    
    return () => {
      // Clean up all audio on unmount
      debugAudio("Component unmounting, cleaning up audio");
      
      Object.values(synthsRef.current).forEach(synthObj => {
        if (synthObj && synthObj.synth) {
          try {
            synthObj.synth.dispose();
          } catch (err) {
            // Ignore disposal errors
          }
        }
        if (synthObj && synthObj.gain) {
          try {
            synthObj.gain.dispose();
          } catch (err) {
            // Ignore disposal errors
          }
        }
      });
      
      if (mainSynthRef.current) {
        try {
          mainSynthRef.current.dispose();
        } catch (err) {
          // Ignore disposal errors
        }
      }
      
      if (gainNodeRef.current) {
        try {
          gainNodeRef.current.dispose();
        } catch (err) {
          // Ignore disposal errors
        }
      }
    };
  }, []);

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
  
  // Effect to apply frequency changes when animation status changes
  useEffect(() => {
    const positionModeHasChanged = prevPositionMode.current !== positionMode;

    if (liveMode && (!isPaused || positionModeHasChanged)) {
      // When animation starts or resumes, or position mode has changed, update all active frequencies
      Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
        if (activeSynthsRef.current.has(planetName)) {
          // debugAudio(`Updating ${planetName} frequency to ${freq.toFixed(2)} Hz on animation status change`);
          updatePlanetFrequency(planetName, freq);
        }
      });      
    }

    prevPositionMode.current = positionMode;
  }, [liveMode, isPaused, positionMode]);
  
  // Effect to force position mode to normal so when the animation is playing,
  // a user can click back on the same button and reset that position mode
  useEffect(() => {
    if (positionMode !== 'normal') {
      setPositionMode('normal');
    }
  }, [positionMode]);
  
  // Now let's update the continuous audio update effect to properly check enabled status
  useEffect(() => {
    // Don't do anything if not in live mode
    if (!liveMode) return;
    
    // Don't run until audio is initialized
    if (!audioInitializedRef.current) {
      // Try to initialize audio
      initializeAudioContext().then(success => {
        if (success) {
          audioInitializedRef.current = true;
        }
      });
      return;
    }
    
    debugAudio("Starting live mode audio interval");
    
    let recoveryCounter = 0;
    let lastFrequencyUpdate = Date.now();
    
    // Create interval to update audio
    const intervalId = setInterval(async () => {
      try {
        // Check audio context health periodically
        if (Tone.context.state !== "running") {
          try {
            await Tone.context.resume();
            debugAudio("Resumed audio context");
          } catch (resumeErr) {
            console.error("Failed to resume audio context:", resumeErr);
          }
        }
        
        // Check if gain node is healthy
        if (!gainNodeRef.current || gainNodeRef.current.disposed) {
          debugAudio("Gain node is missing or disposed, recreating");
          await initializeAudioContext();
        }
        
        // Get the current enabled planets directly from state
        const enabledPlanets = orbitData.filter(p => p.enabled);
        const enabledPlanetNames = new Set(enabledPlanets.map(p => p.name));
        
        // Log status for debugging
        if (debug.current && Math.random() < 0.05) { // Only log 5% of the time to prevent console spam
          debugAudio(`Enabled planets: ${Array.from(enabledPlanetNames).join(', ')}`);
          debugAudio(`Active synths: ${Array.from(activeSynthsRef.current).join(', ')}`);
        }
        
        // Emergency recovery if no sounds are working but should be
        const shouldHaveSounds = enabledPlanets.length > 0;
        const hasSounds = activeSynthsRef.current.size > 0;
        
        // Check if there's a mismatch between what should be playing and what is playing
        const shouldBePlayingButIsnt = enabledPlanets.some(p => 
          !activeSynthsRef.current.has(p.name) && currentFrequencies[p.name]
        );
        
        const shouldNotBePlayingButIs = Array.from(activeSynthsRef.current).some(name => 
          !enabledPlanetNames.has(name)
        );
        
        if ((shouldHaveSounds && !hasSounds) || shouldBePlayingButIsnt || shouldNotBePlayingButIs) {
          recoveryCounter++;
          
          if (recoveryCounter >= 3) {
            debugAudio("EMERGENCY RECOVERY: Sound state mismatch detected");
            
            // Handle planet-by-planet, with complete separation between operations
            let recoverySucceeded = true;
            let planetsFixed = 0;
            
            // First, stop planets that shouldn't be playing
            for (const name of Array.from(activeSynthsRef.current)) {
              if (!enabledPlanetNames.has(name)) {
                try {
                  // Create a fresh synth first to ensure full isolation
                  createIsolatedSynth(name);
                  const success = stopPlanetSound(name);
                  if (success) planetsFixed++;
                  else recoverySucceeded = false;
                } catch (err) {
                  console.error(`Error stopping ${name} during recovery:`, err);
                  recoverySucceeded = false;
                }
              }
            }
            
            // Next, start planets that should be playing but aren't
            for (const planet of enabledPlanets) {
              if (!activeSynthsRef.current.has(planet.name) && currentFrequencies[planet.name]) {
                try {
                  // Always create a fresh synth for maximum reliability
                  createIsolatedSynth(planet.name);
                  // Short delay to ensure audio graph is stable
                  await new Promise(resolve => setTimeout(resolve, 10));
                  const success = startPlanetSound(planet.name, currentFrequencies[planet.name]);
                  if (success) {
                    planetsFixed++;
                    debugAudio(`Recovery: Started sound for ${planet.name}`);
                  } else {
                    recoverySucceeded = false;
                  }
                } catch (err) {
                  console.error(`Error starting ${planet.name} during recovery:`, err);
                  recoverySucceeded = false;
                }
              }
            }
            
            // Only do a full reset if targeted recovery failed completely
            if (!recoverySucceeded && planetsFixed === 0) {
              debugAudio("Targeted recovery failed completely, attempting full audio system reset");
              await recreateAllAudio();
            } else {
              debugAudio(`Recovery fixed ${planetsFixed} planets`);
            }
            
            recoveryCounter = 0;
          }
        } else {
          recoveryCounter = 0;
        }
        
        // Update frequencies for all active synths if animation is running
        if (!isPaused) {
          const now = Date.now();
          // Update frequencies at most every 50ms to avoid overloading
          if (now - lastFrequencyUpdate > 50) {
            Array.from(activeSynthsRef.current).forEach(planetName => {
              const freq = currentFrequencies[planetName];
              if (freq && synthsRef.current[planetName] && synthsRef.current[planetName].synth) {
                updatePlanetFrequency(planetName, freq);
              }
            });
            lastFrequencyUpdate = now;
          }
        }
        
        // Process each planet's playing state - ensure only enabled planets are playing
        orbitData.forEach(planet => {
          // Check if planet is enabled in the current state
          const isEnabled = planet.enabled;
          const isPlaying = activeSynthsRef.current.has(planet.name);
          const freq = currentFrequencies[planet.name];
          
          if (!freq) return; // Skip if no frequency data
          
          if (isEnabled && !isPlaying) {
            // Should be playing but isn't
            startPlanetSound(planet.name, freq);
          } else if (!isEnabled && isPlaying) {
            // Shouldn't be playing but is
            stopPlanetSound(planet.name);
          }
        });
      } catch (err) {
        console.error("Error in audio update interval:", err);
        
        // Try to recover from serious errors
        recoveryCounter++;
        if (recoveryCounter >= 3) {
          debugAudio("Critical error in audio update, attempting full reset");
          await recreateAllAudio();
          recoveryCounter = 0;
        }
      }
    }, 100); // Slightly slower update rate to reduce CPU usage
    
    // Cleanup function
    return () => {
      clearInterval(intervalId);
      debugAudio("Stopped live mode audio interval");
      
      // Stop all sounds when leaving live mode
      Array.from(activeSynthsRef.current).forEach(planetName => {
        stopPlanetSound(planetName);
      });
    };
  }, [liveMode, distanceMode]); // The dependency array contains ONLY liveMode to prevent rerunning unnecessarily

  // Update frequencies and synths when base frequency changes in live mode
  useEffect(() => {
    if (liveMode && !isPaused) {
      // Recalculate frequencies based on the new base frequency
      const updatedFrequencies = {};
      orbitData.forEach((planet, index) => {
        if (planet.enabled) {
          const n = index - 2; // Adjust so Earth is index 0
          const baseFreq = calculateBaseFrequencies(baseFrequency, planet, n);
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

  // Add this useEffect before any audio implementation functions to log initialization
  useEffect(() => {
    console.log("Component initialized");
    
    // Set debug flag for audio diagnostics
    debug.current = true;
    
    // Cleanup function
    return () => {
      console.log("Component unmounting");
    };
  }, []);

  // Initialize Tone.js when the component mounts - just once
  useEffect(() => {
    const initializeTone = async () => {
      try {
        // Force a clean start for Tone.js
        if (Tone.context.state !== 'running') {
          try {
            await Tone.start();
            console.log("Tone.js initialized");
          } catch (err) {
            console.error("Failed to start Tone:", err);
          }
        }
      } catch (err) {
        console.error("Error initializing Tone.js:", err);
      }
    };
    
    initializeTone();
    
    // Cleanup when component unmounts
    return () => {
      console.log("Cleaning up Tone.js");
      try {
        // Try to clean up Tone.js resources
        Tone.Transport.stop();
        Tone.Transport.cancel();
      } catch (err) {
        console.error("Error cleaning up Tone.js:", err);
      }
    };
  }, []);

  // Completely rebuilt orbital sequence player
  const playOrbitalSequence = async () => {
    try {
      const audioStarted = await initializeAudioContext();
      if (!audioStarted) {
        debugAudio("Audio context couldn't be started");
        return;
      }
      
      if (isPlaying) {
        debugAudio("Stopping orbital sequence");
        
        // Stop sequence
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = null;
        }
        
        // Safely dispose the main synth
        if (mainSynthRef.current) {
          try {
            mainSynthRef.current.releaseAll();
            mainSynthRef.current.dispose();
          } catch (err) {
            console.error("Error disposing main synth:", err);
          }
          
          // Create a new clean synth
          const newMainSynth = new Tone.PolySynth(Tone.Synth, {
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
            oscillator: { type: 'sine' }
          });
          
          // Connect to master gain or destination
          if (gainNodeRef.current && !gainNodeRef.current.disposed) {
            newMainSynth.connect(gainNodeRef.current);
          } else {
            newMainSynth.toDestination();
          }
          
          mainSynthRef.current = newMainSynth;
        }
        
        setIsPlaying(false);
        return;
      }
      
      debugAudio("Starting orbital sequence");
      
      // Create a fresh synth for the sequence
      if (mainSynthRef.current) {
        try {
          mainSynthRef.current.dispose();
        } catch (err) {
          // Ignore disposal errors
        }
      }
      
      const mainSynth = new Tone.PolySynth(Tone.Synth, {
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
        oscillator: { type: 'sine' }
      });
      
      // Connect to master gain or destination
      if (gainNodeRef.current && !gainNodeRef.current.disposed) {
        mainSynth.connect(gainNodeRef.current);
      } else {
        mainSynth.toDestination();
      }
      
      mainSynthRef.current = mainSynth;
      
      setIsPlaying(true);
      
      const now = Tone.now();
      const enabledPlanets = orbitData.filter(planet => planet.enabled);
      
      debugAudio(`Playing sequence with ${enabledPlanets.length} planets`);
      
      // Schedule notes for each planet
      enabledPlanets.forEach((planet, index) => {
        const originalIndex = orbitData.findIndex(p => p.name === planet.name);
        const freq = calculateBaseFrequencies(baseFrequency, planet, originalIndex);
        const time = now + index * 0.75;
        
        try {
          mainSynth.triggerAttackRelease(freq, "1n", time, 0.3);
          debugAudio(`Scheduled note for ${planet.name} at ${freq.toFixed(1)}Hz`);
        } catch (err) {
          console.error(`Error scheduling note for ${planet.name}:`, err);
        }
      });
      
      // Set timeout to end playing state
      sequenceTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        sequenceTimeoutRef.current = null;
        debugAudio("Sequence playback complete");
      }, enabledPlanets.length * 750 + 500);
    } catch (error) {
      console.error("Error playing orbital sequence:", error);
      setIsPlaying(false);
    }
  };

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

  // Toggle between pause and play
  const togglePlayPause = async () => {
    await startAudioContext();
    if (isPaused) {
      setPositionMode('normal'); // Reset position mode when resuming
    }
    setIsPaused(!isPaused);
  };

  // Function to recreate and restart all audio
  const recreateAllAudio = async () => {
    debugAudio("FULL AUDIO SYSTEM RESET");
    
    try {
      // 1. Stop all active synths
      const activeList = Array.from(activeSynthsRef.current);
      for (const planetName of activeList) {
        try {
          stopPlanetSound(planetName);
        } catch (err) {
          console.error(`Error stopping ${planetName} during reset:`, err);
          // Continue with other planets
        }
      }
      
      // 2. Dispose all synths
      for (const [name, synthObj] of Object.entries(synthsRef.current)) {
        try {
          if (synthObj && synthObj.synth) synthObj.synth.dispose();
          if (synthObj && synthObj.gain) synthObj.gain.dispose();
        } catch (err) {
          // Ignore disposal errors
        }
      }
      
      // 3. Clear references
      synthsRef.current = {};
      activeSynthsRef.current.clear();
      
      // 4. Wait a small amount of time to allow audio system to stabilize
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 5. Recreate the audio context
      try {
        await Tone.start();
        debugAudio("Tone restarted");
      } catch (err) {
        debugAudio("Error restarting Tone:", err);
      }
      
      try {
        if (Tone.context.state !== "running") {
          await Tone.context.resume();
          debugAudio("Tone context resumed");
        }
      } catch (err) {
        debugAudio("Error resuming Tone context:", err);
      }
      
      // 6. Create fresh synths for all planets
      for (const planet of orbitData) {
        try {
          createIsolatedSynth(planet.name);
        } catch (err) {
          console.error(`Failed to create synth for ${planet.name} during reset:`, err);
          // Continue with other planets
        }
      }
      
      // 7. Restart sounds for enabled planets if in live mode
      if (liveMode) {
        // Wait a bit more to ensure synths are ready
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const enabledPlanets = orbitData.filter(planet => planet.enabled);
        let startedCount = 0;
        
        for (const planet of enabledPlanets) {
          try {
            if (currentFrequencies[planet.name]) {
              const success = startPlanetSound(planet.name, currentFrequencies[planet.name]);
              if (success) {
                startedCount++;
                debugAudio(`Successfully restarted sound for ${planet.name}`);
              }
            }
          } catch (err) {
            console.error(`Failed to restart sound for ${planet.name}:`, err);
            // Continue with other planets
          }
        }
        
        debugAudio(`Restarted sounds for ${startedCount}/${enabledPlanets.length} planets`);
        
        if (enabledPlanets.length > 0 && startedCount === 0) {
          console.error("Failed to start any planet sounds during reset");
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error("Failed to recreate audio system:", err);
      return false;
    }
  };

  // Audio Context Management - Completely independent of other systems
  const initializeAudioContext = async () => {
    try {
      debugAudio("Initializing audio context");
      
      // First try to start/resume Tone's context
      try {
        await Tone.start();
      } catch (err) {
        debugAudio("Error starting Tone:", err);
        // Continue anyway - user interaction might be needed
      }
      
      if (Tone.context.state !== "running") {
        try {
          await Tone.context.resume();
          debugAudio("Resumed Tone context");
        } catch (err) {
          debugAudio("Error resuming Tone context:", err);
          // Continue anyway - user interaction might be needed
        }
      }
      
      debugAudio(`Tone context state: ${Tone.context.state}`);
      
      // Create a fresh master gain node
      if (gainNodeRef.current) {
        try {
          gainNodeRef.current.dispose();
        } catch (err) {
          // Ignore disposal errors
        }
      }
      
      // Create a new master gain
      try {
        const masterGain = new Tone.Gain(masterVolume).toDestination();
        gainNodeRef.current = masterGain;
        
        // Set master volume
        Tone.Destination.volume.value = Tone.gainToDb(masterVolume);
        
        audioContextStarted.current = true;
        return true;
      } catch (err) {
        console.error("Error creating master gain node:", err);
        return false;
      }
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  };

  // Function to activate/deactivate a planet with completely isolated audio handling
  const togglePlanet = async (index, forceState = null) => {
    try {
      // Get the current planet state before changing it
      const newData = [...orbitData];
      const planet = newData[index];
      const wasEnabled = planet.enabled;
  
      // Determine the new state
      const newEnabled = forceState !== null ? forceState : !wasEnabled;
  
      // Update the state immediately
      planet.enabled = newEnabled;
      setOrbitData(newData);
  
      debugAudio(`Toggling planet ${planet.name}, was ${wasEnabled ? 'enabled' : 'disabled'}, now ${newEnabled ? 'enabled' : 'disabled'}`);
  
      // Handle audio changes if in live mode
      if (liveMode) {
        if (wasEnabled && !newEnabled) {
          // Was enabled, now disabled - stop sound for THIS PLANET ONLY
          debugAudio(`Stopping sound for ${planet.name} only`);
          try {
            stopPlanetSound(planet.name);
          } catch (err) {
            console.error(`Error stopping sound for ${planet.name}:`, err);
            // Create a fresh isolated synth for this planet only
            createIsolatedSynth(planet.name);
          }
        } else if (!wasEnabled && newEnabled) {
          // Was disabled, now enabled - start sound for THIS PLANET ONLY
          const freq = currentFrequencies[planet.name];
          if (freq) {
            debugAudio(`Starting sound for ${planet.name} at ${freq}Hz`);
            try {
              // Ensure we have a fresh synth
              createIsolatedSynth(planet.name);
              startPlanetSound(planet.name, freq);
            } catch (err) {
              console.error(`Error starting sound for ${planet.name}:`, err);
              // Try one more time
              try {
                createIsolatedSynth(planet.name);
                startPlanetSound(planet.name, freq);
              } catch (retryErr) {
                console.error(`Retry failed for ${planet.name}:`, retryErr);
              }
            }
          }
        }
  
        // Log the active synths to verify
        debugAudio(`Active synths after toggle: ${Array.from(activeSynthsRef.current).join(', ')}`);
      }
    } catch (error) {
      console.error("Error toggling planet:", error);
      // No recovery here - just log the error
    }
  };

  // Toggle all planets with improved audio isolation
  const toggleAllPlanets = async (enable) => {
    try {
      await Promise.all(orbitData.map((_, index) => togglePlanet(index, enable)));
    } catch (error) {
      console.error("Error toggling all planets:", error);
    }
  };

  // Toggle live mode with completely rebuilt implementation
  const toggleLiveMode = async () => {
    try {
      const success = await initializeAudioContext();
      if (!success) {
        console.error("Could not initialize audio context when toggling live mode");
        return;
      }
      
      const newLiveMode = !liveMode;
      debugAudio(`Toggling live mode to ${newLiveMode ? 'on' : 'off'}`);
      
      if (!newLiveMode) {
        // Turning off - stop all sounds
        Array.from(activeSynthsRef.current).forEach(planetName => {
          stopPlanetSound(planetName);
        });
      } else {
        // Turning on - recreate everything and start enabled planets
        const resetSuccess = await recreateAllAudio();
        if (!resetSuccess) {
          console.error("Failed to reset audio system when entering live mode");
          return;
        }
      }
      
      // Update the state last, after audio operations are complete
      setLiveMode(newLiveMode);
    } catch (error) {
      console.error("Error toggling live mode:", error);
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

  // Get planet colors for the toggle switches
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

  // Handle distance mode change
  const handleDistanceModeChange = (e) => {
    const newMode = e.target.value;
    setDistanceMode(newMode);
    
    // When distance mode changes, update the frequencies if in live mode
    if (liveMode) {
      updateAllFrequencies();
    }
  };

  // Handle zoom level changes
  const handleZoomChange = (e) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  // Debug monitoring function
  const debugAudio = (message, obj = null) => {
    if (debug.current) {
      if (obj) {
        console.log(`[AUDIO DEBUG] ${message}`, obj);
      } else {
        console.log(`[AUDIO DEBUG] ${message}`);
      }
    }
  };

  // Function to create or recreate a single synth - with complete isolation
  const createIsolatedSynth = (planetName) => {
    debugAudio(`Creating completely isolated synth for ${planetName}`);
    
    try {
      // First clean up old synth if it exists
      if (synthsRef.current[planetName]) {
        try {
          if (activeSynthsRef.current.has(planetName)) {
            synthsRef.current[planetName].synth.triggerRelease();
            activeSynthsRef.current.delete(planetName);
          }
          synthsRef.current[planetName].synth.dispose();
          if (synthsRef.current[planetName].gain) {
            synthsRef.current[planetName].gain.dispose();
          }
        } catch (err) {
          debugAudio(`Error cleaning up old synth for ${planetName}:`, err);
          // Continue anyway - we'll create new ones
        }
      }
      
      // Create a fresh planet-specific gain node for complete isolation
      const planetGain = new Tone.Gain(masterVolume);
      
      // Create a fresh synth
      const newSynth = new Tone.Synth({
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
        oscillator: { type: 'sine' }
      });
      
      // Connect the synth to its own gain node
      newSynth.connect(planetGain);
      
      // Connect the planet gain to the master destination
      planetGain.toDestination();
      
      // Store both the synth and its gain node for isolated control
      synthsRef.current[planetName] = {
        synth: newSynth,
        gain: planetGain
      };
      
      return synthsRef.current[planetName];
    } catch (err) {
      console.error(`Failed to create isolated synth for ${planetName}:`, err);
      return null;
    }
  };

  // Safe method to start a planet's sound
  const startPlanetSound = (planetName, frequency) => {
    debugAudio(`Starting sound for ${planetName} at ${frequency}Hz`);
    
    try {
      // Skip if we're already playing this planet
      if (activeSynthsRef.current.has(planetName)) {
        // Just update the frequency instead
        updatePlanetFrequency(planetName, frequency);
        return true;
      }
      
      // Ensure we have a working synth for this planet
      let synthObj = synthsRef.current[planetName];
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
        synthObj = createIsolatedSynth(planetName);
        if (!synthObj || !synthObj.synth) return false;
      }
      
      // Start the sound
      synthObj.synth.triggerAttack(frequency);
      activeSynthsRef.current.add(planetName);
      return true;
    } catch (err) {
      console.error(`Failed to start sound for ${planetName}:`, err);
      return false;
    }
  };

  // Safe method to stop a planet's sound
  const stopPlanetSound = (planetName) => {
    debugAudio(`Stopping sound for ${planetName}`);
    
    try {
      const synthObj = synthsRef.current[planetName];
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) {
        activeSynthsRef.current.delete(planetName);
        return true;
      }
      
      // Use try-catch specifically around triggerRelease to isolate potential Tone.js errors
      try {
        synthObj.synth.triggerRelease();
      } catch (releaseErr) {
        console.error(`Error releasing synth for ${planetName}:`, releaseErr);
        // If triggerRelease fails, try to recreate the synth without affecting others
        createIsolatedSynth(planetName);
      }
      
      // Always remove from active set regardless of errors
      activeSynthsRef.current.delete(planetName);
      return true;
    } catch (err) {
      console.error(`Failed to stop sound for ${planetName}:`, err);
      // Still remove from active set to keep state clean
      activeSynthsRef.current.delete(planetName);
      
      // Try to recreate the synth for this planet without disturbing others
      try {
        createIsolatedSynth(planetName);
      } catch (recreateErr) {
        // Just log, don't let errors cascade
        console.error(`Failed to recreate synth for ${planetName}:`, recreateErr);
      }
      
      return false;
    }
  };
  
  // Safe method to update a planet's frequency
  const updatePlanetFrequency = (planetName, frequency) => {
    try {
      const synthObj = synthsRef.current[planetName];
      if (!synthObj || !synthObj.synth || synthObj.synth.disposed) return false;
      
      // Set a minimum frequency change threshold to reduce unnecessary updates
      const currentFreq = synthObj.synth.frequency.value;
      const freqDiff = Math.abs(currentFreq - frequency);
      const freqRatio = frequency / currentFreq;
      
      // Only update if the change is significant (more than 1Hz or 2% change)
      if (freqDiff > 1 || freqRatio < 0.98 || freqRatio > 1.02) {
        if (debug.current && Math.random() < 0.01) { // Log only occasionally to reduce spam
          debugAudio(`${planetName} freq change: ${currentFreq.toFixed(2)} → ${frequency.toFixed(2)} Hz`);
        }
        synthObj.synth.frequency.value = frequency;
      }
      
      return true;
    } catch (err) {
      console.error(`Error updating frequency for ${planetName}:`, err);
      // On error, try to recreate the synth if it was active
      const wasActive = activeSynthsRef.current.has(planetName);
      if (wasActive) {
        stopPlanetSound(planetName);
        const synthObj = createIsolatedSynth(planetName);
        if (synthObj && synthObj.synth) {
          startPlanetSound(planetName, frequency);
        }
      }
      return false;
    }
  };

  // Safe method to update the master volume - now updates each planet individually
  const updateMasterVolume = (newVolume) => {
    debugAudio(`Updating master volume to ${newVolume}`);
    
    try {
      // Update global Tone volume (backup)
      Tone.Destination.volume.value = Tone.gainToDb(newVolume);
      
      // Update each planet's gain individually
      Object.entries(synthsRef.current).forEach(([name, synthObj]) => {
        if (synthObj && synthObj.gain && !synthObj.gain.disposed) {
          try {
            synthObj.gain.gain.value = newVolume;
          } catch (err) {
            debugAudio(`Failed to update gain for ${name}:`, err);
          }
        }
      });
      
      return true;
    } catch (err) {
      console.error("Failed to update master volume:", err);
      return false;
    }
  };

  // Handle master volume changes with isolated volume system
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setMasterVolume(newVolume);
    updateMasterVolume(newVolume);
  };

  // Handle base frequency changes with new isolated approach
  const handleBaseFrequencyChange = (e) => {
    const newBaseFrequency = parseFloat(e.target.value);
    setBaseFrequency(newBaseFrequency);
    
    // Recalculate frequencies for all planets
    const recalculatedFrequencies = {};
    orbitData.forEach((planet, index) => {
      if (planet.enabled) {
        const n = index - 2; // Adjust so Earth is index 0
        const baseFreq = calculateBaseFrequencies(newBaseFrequency, planet, index);
        recalculatedFrequencies[planet.name] = baseFreq;
        
        // Update active synths immediately in live mode
        if (liveMode && activeSynthsRef.current.has(planet.name)) {
          updatePlanetFrequency(planet.name, baseFreq);
        }
      }
    });
    
    // Update the frequencies in the state 
    setCurrentFrequencies(prevFreqs => ({
      ...prevFreqs,
      ...recalculatedFrequencies
    }));
  };

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

  return (
    <div 
      className="container" 
      onClick={needsUserInteraction ? handleUserInteraction : undefined}
    >
      <div className="visualization-container">
        <div className="orbital-display">
          <PlanetarySystem 
            animationSpeed={animationSpeed} 
            baseFrequency={baseFrequency}
            distanceMode={distanceMode}
            isPaused={isPaused}
            onFrequencyChange={handleFrequencyChange}
            orbitData={orbitData} 
            setToAverageDistance={positionMode === 'average'}
            setToAphelion={positionMode === 'aphelion'}
            setToPerihelion={positionMode === 'perihelion'}
            setZoomLevel={setZoomLevel}
            zoomLevel={zoomLevel}
          />
        </div>
        
        {/* Floating controls */}
        <div className="floating-controls fade-in">
          <button 
            className="floating-button"
            onClick={togglePlayPause}
            title={isPaused ? "Play Animation" : "Pause Animation"}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          
          <button 
            className="floating-button"
            onClick={() => setPositionMode('average')}
            title="Set to Average Distance"
          >
            🔄
          </button>
          
          <button 
            className="floating-button"
            onClick={() => setPositionMode('aphelion')}
            title="Set to Aphelion"
          >
            🌞
          </button>
          
          <button 
            className="floating-button"
            onClick={() => setPositionMode('perihelion')}
            title="Set to Perihelion"
          >
            ☀️
          </button>
          
          <button 
            className="floating-button"
            onClick={toggleLiveMode}
            disabled={isPlaying}
            title={liveMode ? "Disable Live Mode" : "Enable Live Mode"}
            style={{
              backgroundColor: liveMode ? 'rgba(69, 160, 73, 0.5)' : 'rgba(0, 0, 0, 0)',
              opacity: isPlaying ? 0.5 : 1
            }}
          >
            🔊
          </button>
        </div>
        
        {/* Info and Settings buttons */}
        <button 
          className="info-button" 
          onClick={() => setIsInfoModalOpen(!isInfoModalOpen)}
          title={isInfoModalOpen ? "Close" : "About"}
        >
          ℹ️
        </button>
        <button 
          className="more-settings-button" 
          onClick={toggleSidebar}
          title="More Settings"
          disabled={isInfoModalOpen}
        >
          {sidebarCollapsed ? '⚙️' : '✖️'}
        </button>
        
        {/* Advanced settings sidebar */}
        <div className={`controls-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {/* Navigation tabs */}
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

              <div className="control-group">
                <label htmlFor="distance-mode" className="label">
                  Distance Mode:
                </label>
                <select
                  id="distance-mode"
                  value={distanceMode}
                  onChange={handleDistanceModeChange}
                  className="select-dropdown"
                >
                  <option value="titiusBode">Modified Titius-Bode Law</option>
                  <option value="actual">Actual Distances</option>
                </select>
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
              </div>
              
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
              </div>
            </div>
          )}
          
          {/* Content of the planets tab */}
          {activeTab === 'planets' && (
            <div className="sidebar-content planets-tab fade-in">
              <div className="sequence-controls">
                <button 
                  onClick={playOrbitalSequence}
                  disabled={liveMode}
                  className={`button ${liveMode ? 'disabled' : ''}`}
                >
                  {isPlaying ? 'Stop Sequence' : 'Play Orbital Sequence'}
                </button>
              </div>

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
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
    </div>
  );
};

export default OrbitalSonification;