// src/OrbitalSonification.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import PlanetarySystem from './PlanetarySystem';
import InfoModal from './components/InfoModal';
import { calculatePlanetaryFrequency } from './utils/calculatePlanetaryFrequency';
import { 
  calculateFrequencyGain, 
  safelyTriggerNote, 
  calculateAdvancedFrequencyGain,
  getHumanHearingSensitivity
} from './utils/audioScaling';

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

  const [baseFrequency, setBaseFrequency] = useState(110);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [liveMode, setLiveMode] = useState(false);
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  const [isPaused, setIsPaused] = useState(true);
  const [positionMode, setPositionMode] = useState('average'); // Changed from 'normal' to 'average'
  const [masterVolume, setMasterVolume] = useState(0.35); // -9dB approximately
  const [needsUserInteraction, setNeedsUserInteraction] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(20); // Added zoomLevel state
  const [distanceMode, setDistanceMode] = useState('titiusBode'); // 'titiusBode' or 'actual'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('controls'); // 'controls' o 'planets'
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [loopSequence, setLoopSequence] = useState(false);
  const [sequenceBPM, setSequenceBPM] = useState(60); // Default to 60 BPM
  const [useFletcher, setUseFletcher] = useState(false); // Toggle for advanced gain scaling
  const [audioScalingConfig, setAudioScalingConfig] = useState({
    referenceFrequency: 55,
    scalingFactor: 0.4,
    minimumGain: 0.05,
    maximumGain: 1.2,
    highFrequencyCutoff: 2000,
    highFrequencyScalingFactor: 0.6,
  });
  
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
  const gainNodesRef = useRef({});

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
        /*if (debug.current && Math.random() < 0.05) { // Only log 5% of the time to prevent console spam
          debugAudio(`Enabled planets: ${Array.from(enabledPlanetNames).join(', ')}`);
          debugAudio(`Active synths: ${Array.from(activeSynthsRef.current).join(', ')}`);
        }*/
        
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

  // Initialize Tone.js when the component mounts - just once
  useEffect(() => {
    const initializeTone = async () => {
      try {
        // Force a clean start for Tone.js
        if (Tone.context.state !== 'running') {
          try {
            await Tone.start();
            //console.log("Tone.js initialized");
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
      //console.log("Cleaning up Tone.js");
      try {
        // Try to clean up Tone.js resources
        Tone.Transport.stop();
        Tone.Transport.cancel();
      } catch (err) {
        console.error("Error cleaning up Tone.js:", err);
      }
    };
  }, []);

  // When Fletcher, reference frequency, or scaling factor changes, update all gains
  useEffect(() => {
    if (!liveMode) return; // Only update if in live mode

    /*console.log('[DEBUG] Audio scaling update:', {
      useFletcher,
      audioScalingConfig,
      activeSynths: Array.from(activeSynthsRef.current)
    });*/

    // Force a reinitialization flag on audio scaling config change
    window.lastAudioUpdate = Date.now();
  
    Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
      const planet = orbitData.find(p => p.name === planetName);
      if (planet && planet.enabled) {
        const synthObj = synthsRef.current[planetName];
        if (synthObj && synthObj.gain && freq) {
          const gain = useFletcher
            ? calculateAdvancedFrequencyGain(freq, audioScalingConfig)
            : calculateFrequencyGain(freq, audioScalingConfig);
  
          //console.log(`[DEBUG] Setting gain for ${planetName}: ${gain.toFixed(3)} (freq: ${freq.toFixed(1)}Hz, useFletcher: ${useFletcher})`);
  
          // Apply gain with both methods for maximum compatibility
          try {
            // Method 1: Parameter automation (works well in development)
            const now = Tone.now();
            synthObj.gain.gain.cancelScheduledValues(now);
            synthObj.gain.gain.setValueAtTime(synthObj.gain.gain.value, now);
            synthObj.gain.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);
            
            // Method 2: Direct value setting with delay (works better in production)
            setTimeout(() => {
              try {
                synthObj.gain.gain.value = gain;
                //console.log(`[CONFIG] Direct gain set for ${planetName}: ${gain.toFixed(3)}`);
              } catch (directErr) {
                console.error(`[CONFIG] Error in direct gain set:`, directErr);
              }
            }, 60);
          } catch (err) {
            console.error(`[CONFIG] Error updating gain for ${planetName}:`, err);
            
            // Fallback: try direct value setting immediately
            try {
              synthObj.gain.gain.value = gain;
            } catch (directErr) {
              console.error(`[CONFIG] Fallback direct gain set also failed:`, directErr);
            }
          }
        }
      }
    });
  }, [
    useFletcher,
    audioScalingConfig.referenceFrequency,
    audioScalingConfig.scalingFactor,
    liveMode,
    orbitData,
    currentFrequencies
  ]);

  // Orbital sequence player
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
  
      const enabledPlanets = orbitData.filter(planet => planet.enabled);
  
      debugAudio(`Playing sequence with ${enabledPlanets.length} planets`);
  
      // Calculate note duration and interval based on BPM
      const beatDuration = 60 / sequenceBPM; // seconds per beat
      const noteDuration = beatDuration; // 1 beat per note
      const interval = beatDuration; // time between notes
  
      // Schedule notes for each planet
      const now = Tone.now();
      enabledPlanets.forEach((planet, index) => {
        const originalIndex = orbitData.findIndex(p => p.name === planet.name);
        const freq = calculateBaseFrequencies(baseFrequency, planet, originalIndex);
        const time = now + index * interval;
  
        try {
          mainSynth.triggerAttackRelease(freq, noteDuration, time, 0.3);
          debugAudio(`Scheduled note for ${planet.name} at ${freq.toFixed(1)}Hz`);
        } catch (err) {
          console.error(`Error scheduling note for ${planet.name}:`, err);
        }
      });
  
      // Calculate total sequence duration
      const sequenceDuration = enabledPlanets.length * interval;
  
      // Set timeout to end playing state or loop
      sequenceTimeoutRef.current = setTimeout(() => {
        if (loopSequence) {
          playOrbitalSequence();
        } else {
          setIsPlaying(false);
          sequenceTimeoutRef.current = null;
          debugAudio("Sequence playback complete");
        }
      }, sequenceDuration * 1000 + 100); // Convert to ms, add a small buffer
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
      gainNodesRef.current = {};
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
      //console.log('[RECREATE] Creating synths with volume scaling applied');
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
        
        // Force immediate volume scaling recalculation on all active planets
        setTimeout(() => {
          forceRecalculateAllGains();
        }, 100);
      }
      
      return true;
    } catch (err) {
      console.error("Failed to recreate audio system:", err);
      return false;
    }
  };
  
  // Function to force recalculation of all gain values
  const forceRecalculateAllGains = () => {
    //console.log("[FORCE RECALC] Recalculating all gains");
    
    Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
      const planet = orbitData.find(p => p.name === planetName);
      if (planet && planet.enabled) {
        const synthObj = synthsRef.current[planetName];
        if (synthObj && synthObj.gain && freq) {
          try {
            // Calculate gain using current settings
            const gain = useFletcher
              ? calculateAdvancedFrequencyGain(freq, audioScalingConfig)
              : calculateFrequencyGain(freq, audioScalingConfig);
            
            //console.log(`[FORCE RECALC] ${planetName}: freq=${freq.toFixed(1)}, gain=${gain.toFixed(3)}`);
            
            // Apply gain with both methods
            try {
              // Set gain immediately
              synthObj.gain.gain.value = gain;
              
              // Also use parameter automation for smoothness
              const now = Tone.now();
              synthObj.gain.gain.cancelScheduledValues(now);
              synthObj.gain.gain.setValueAtTime(synthObj.gain.gain.value, now);
              synthObj.gain.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);
            } catch (err) {
              console.error(`[FORCE RECALC] Error setting gain:`, err);
            }
          } catch (err) {
            console.error(`[FORCE RECALC] Error calculating gain:`, err);
          }
        }
      }
    });
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
            // debugAudio(`Starting sound for ${planet.name} at ${freq}Hz`);
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
        
        // Force recalculation of all gains right after enabling live mode
        // Use multiple timeouts at different intervals for maximum reliability
        setTimeout(() => forceRecalculateAllGains(), 100);
        setTimeout(() => forceRecalculateAllGains(), 300);
        setTimeout(() => forceRecalculateAllGains(), 1000);
      }
      
      // Update the state last, after audio operations are complete
      setLiveMode(newLiveMode);
    } catch (error) {
      console.error("Error toggling live mode:", error);
    }
  };

  // Handle BPM change
  const handleBPMChange = (e) => {
    setSequenceBPM(parseInt(e.target.value, 10));
  };

  // Toggle loop setting
  const toggleLoopSequence = () => {
    setLoopSequence(!loopSequence);
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
      
      // For initial gain value, calculate based on frequency if available
      let initialGain = 1.0;
      
      // Pre-calculate appropriate gain if frequency is available
      if (currentFrequencies[planetName]) {
        try {
          const frequency = currentFrequencies[planetName];
          //console.log(`[CREATE SYNTH] Pre-calculating gain for ${planetName} at ${frequency}Hz`);
          
          initialGain = useFletcher 
            ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
            : calculateFrequencyGain(frequency, audioScalingConfig);
            
          //console.log(`[CREATE SYNTH] Initial gain will be ${initialGain.toFixed(3)}`);
        } catch (err) {
          console.error(`[CREATE SYNTH] Error pre-calculating gain:`, err);
        }
      }
      
      // Create a fresh planet-specific gain node for complete isolation
      const planetGain = new Tone.Gain(initialGain);
      //console.log(`[CREATE SYNTH] Created gain node with initial value ${planetGain.gain.value}`);
      
      // Create a fresh synth with improved settings for better sound quality
      const newSynth = new Tone.Synth({
        envelope: {
          attack: 0.05, // Slightly softer attack to reduce clicks
          decay: 0.1,
          sustain: 0.4, // Increased sustain for better presence
          release: 1.2  // Slightly longer release for smoother sound
        },
        oscillator: {
          type: 'sine' // Using 'sine' for cleaner sound, especially at high frequencies
        }
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
      
      // Also store in gainNodesRef for consistent access
      gainNodesRef.current[planetName] = planetGain;
      
      return synthsRef.current[planetName];
    } catch (err) {
      console.error(`Failed to create isolated synth for ${planetName}:`, err);
      return null;
    }
  };

  // Safe method to start a planet's sound
  const startPlanetSound = (planetName, frequency) => {
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
      
      // Calculate gain using the selected scaling method - with more debugging
      //console.log(`[DEBUG startPlanetSound] Calculating gain for ${planetName} at ${frequency}Hz (useFletcher=${useFletcher})`);
      //console.log(`[DEBUG startPlanetSound] audioScalingConfig:`, audioScalingConfig);
      
      let gain;
      try {
        gain = useFletcher
          ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
          : calculateFrequencyGain(frequency, audioScalingConfig);
          
        //(`[DEBUG startPlanetSound] Calculated gain: ${gain}`);
      } catch (err) {
        console.error(`[ERROR] Failed to calculate gain for ${planetName}:`, err);
        gain = 0.5; // Fallback value
      }
      
      // Debug log
      //console.log(`[DEBUG] Starting ${planetName} sound at ${frequency.toFixed(1)}Hz with gain ${gain.toFixed(3)} (useFletcher: ${useFletcher})`);
      
      // Apply gain to the gain node
      if (synthObj.gain) {
        synthObj.gain.gain.value = gain;
        
        // Store in gainNodesRef for later access
        gainNodesRef.current[planetName] = synthObj.gain;
      }
      
      // Start the sound with safe triggering
      safelyTriggerNote(
        synthObj.synth,
        frequency,
        0.7, // Default velocity
        null, // No duration for sustained notes
        synthObj.gain,
        audioScalingConfig
      );
      
      activeSynthsRef.current.add(planetName);
      return true;
    } catch (err) {
      console.error(`Failed to start sound for ${planetName}:`, err);
      return false;
    }
  };

  // Safe method to stop a planet's sound
  const stopPlanetSound = (planetName) => {
    //debugAudio(`Stopping sound for ${planetName}`);
    
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
        
        // Calculate new gain based on frequency using getAdjustedGain for consistency
        const gain = getAdjustedGain(frequency);
        
        // Log for debugging in production
        //console.log(`[UPDATE FREQ] ${planetName}: freq=${frequency.toFixed(1)}, gain=${gain.toFixed(3)}, useFletcher=${useFletcher}`);
        
        // Update frequency
        synthObj.synth.frequency.value = frequency;
        
        // Update gain with smooth transition AND direct value setting for production compatibility
        if (synthObj.gain) {
          try {
            // Method 1: Use parameter automation (works well in development)
            const now = Tone.now();
            synthObj.gain.gain.cancelScheduledValues(now);
            synthObj.gain.gain.setValueAtTime(synthObj.gain.gain.value, now);
            synthObj.gain.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);
            
            // Method 2: Direct value setting with delay (works better in production)
            setTimeout(() => {
              try {
                synthObj.gain.gain.value = gain;
               //console.log(`[UPDATE FREQ] Direct gain set: ${gain.toFixed(3)}`);
              } catch (directErr) {
                console.error(`[UPDATE FREQ] Error in direct gain set:`, directErr);
              }
            }, 60);
          } catch (err) {
            console.error(`[UPDATE FREQ] Error updating gain:`, err);
            
            // Fallback: try direct value setting
            try {
              synthObj.gain.gain.value = gain;
            } catch (directErr) {
              console.error(`[UPDATE FREQ] Fallback direct gain set also failed:`, directErr);
            }
          }
        }
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

  // Get the current gain for each planet
  const getFrequencyGain = (planetName) => {
    const freq = currentFrequencies[planetName];
    if (!freq) return "N/A";
    
    const gain = getAdjustedGain(freq);
    return gain.toFixed(2);
  };

  // Get human hearing sensitivity at a given frequency - for informational display
  const getHearingSensitivity = (planetName) => {
    const freq = currentFrequencies[planetName];
    if (!freq) return "N/A";
    
    const sensitivity = getHumanHearingSensitivity(freq);
    return (sensitivity * 100).toFixed(0) + "%";
  };

  // Calculate gain based on frequency - using imported utility with better error handling
  const getAdjustedGain = useCallback((frequency) => {
    if (!frequency) return 1.0;
    
    // Add debugging
    //console.log(`[DEBUG getAdjustedGain] frequency=${frequency}, useFletcher=${useFletcher}, config=`, audioScalingConfig);
    
    // First try the regular functions with error handling
    try {
      const result = useFletcher 
        ? calculateAdvancedFrequencyGain(frequency, audioScalingConfig)
        : calculateFrequencyGain(frequency, audioScalingConfig);
      
      //console.log(`[DEBUG getAdjustedGain] result=${result}`);
      return result;
    } catch (err) {
      console.error(`[ERROR getAdjustedGain] Error using regular functions:`, err);
      
      // If regular functions fail, try the test functions
      try {
        //console.log(`[DEBUG getAdjustedGain] Falling back to test functions`);
        const result = useFletcher 
          ? testCalculateAdvancedFrequencyGain(frequency, audioScalingConfig)
          : testCalculateFrequencyGain(frequency, audioScalingConfig);
        
        //console.log(`[DEBUG getAdjustedGain] test result=${result}`);
        return result;
      } catch (testErr) {
        console.error(`[ERROR getAdjustedGain] Error using test functions:`, testErr);
        
        // If all else fails, use a safe fallback
        //console.log(`[DEBUG getAdjustedGain] Using fallback value of 1.0`);
        return 1.0;
      }
    }
  }, [useFletcher, audioScalingConfig]);

  // Toggle advanced Fletcher-Munson curves for even better audio quality
  const toggleFletcherCurves = useCallback(() => {
    //console.log(`[DEBUG] Toggling Fletcher curves from ${useFletcher} to ${!useFletcher}`);
    
    setUseFletcher(prev => {
      const newValue = !prev;
      //console.log(`[DEBUG] Fletcher toggle new value: ${newValue}`);
      
      // Force immediate gain recalculation for all active planets
      if (liveMode) {
        Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
          const planet = orbitData.find(p => p.name === planetName);
          if (planet && planet.enabled) {
            const synthObj = synthsRef.current[planetName];
            if (synthObj && synthObj.gain && freq) {
              // Force recalculation with the new Fletcher mode value
              const gain = newValue
                ? calculateAdvancedFrequencyGain(freq, audioScalingConfig)
                : calculateFrequencyGain(freq, audioScalingConfig);
              
              //console.log(`[DEBUG] Toggle recalculated gain for ${planetName}: ${gain.toFixed(4)}`);
                
              // Apply gain with both methods for maximum compatibility
              try {
                // Method 1: Parameter automation (works well in development)
                const now = Tone.now();
                synthObj.gain.gain.cancelScheduledValues(now);
                synthObj.gain.gain.setValueAtTime(synthObj.gain.gain.value, now);
                synthObj.gain.gain.linearRampToValueAtTime(Math.max(0.001, gain), now + 0.05);
                
                // Method 2: Direct value setting with delay (works better in production)
                setTimeout(() => {
                  try {
                    synthObj.gain.gain.value = gain;
                    //console.log(`[FLETCHER] Direct gain set for ${planetName}: ${gain.toFixed(3)}`);
                  } catch (directErr) {
                    console.error(`[FLETCHER] Error in direct gain set:`, directErr);
                  }
                }, 60);
              } catch (err) {
                console.error(`[FLETCHER] Error updating gain for ${planetName}:`, err);
                
                // Fallback: try direct value setting immediately
                try {
                  synthObj.gain.gain.value = gain;
                } catch (directErr) {
                  console.error(`[FLETCHER] Fallback direct gain set also failed:`, directErr);
                }
              }
            }
          }
        });
      }
      
      return newValue;
    });
  }, [liveMode, orbitData, currentFrequencies, audioScalingConfig]);

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
            onClick={playOrbitalSequence}
            title={isPlaying ? 'Stop Sequence' : 'Play Orbital Sequence'}
            disabled={liveMode}
            className="floating-button"
          >
            {isPlaying ? '⏹️' : '🪐'}
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
            <button 
              className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveTab('audio')}
            >
              Audio
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
                  disabled={!isPaused}
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
                  max={40}
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
                
              {/* Loop checkbox */}
              <div className="loop-control">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={loopSequence}
                    onChange={toggleLoopSequence}
                    disabled={liveMode || isPlaying}
                  />
                  Loop Sequence
                </label>
              </div>
                
              {/* BPM control */}
              <div className="bpm-control">
                <label htmlFor="bpm-slider" className="label">
                  Tempo: {sequenceBPM} BPM
                </label>
                <input 
                  id="bpm-slider"
                  type="range" 
                  value={sequenceBPM}
                  min={30}
                  max={240}
                  step={1}
                  className="slider"
                  onChange={handleBPMChange}
                  disabled={liveMode || isPlaying}
                />
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
                    </div>

                    
                    {/* Note info section */}
                    <div className="planet-info">
                      <div className="planet-data planet-data__note">
                        <span className="data-label">Note:</span>
                        <span className="data-value note-value">
                          {currentFrequencies[planet.name] 
                            ? frequencyToNote(currentFrequencies[planet.name])
                            : ""}
                        </span>
                      </div>
                    </div>
                    
                    {/* Gain info section */}
                    <div className="planet-gain-info">
                      <span className="data-label">Gain:</span>
                      <span className="data-value gain-value">
                        {getFrequencyGain(planet.name)}
                      </span>
                      <div className="gain-bar-container">
                        <div 
                          className="gain-bar" 
                          style={{
                            width: `${parseFloat(getFrequencyGain(planet.name)) * 100}%`,
                            backgroundColor: getPlanetColor(planet.name),
                            opacity: planet.enabled ? 0.8 : 0.3
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Ear sensitivity indicator */}
                    {useFletcher && (
                    <div className="planet-sensitivity-info">
                      <span className="data-label">Ear Sensitivity:</span>
                      <span className="data-value sensitivity-value">
                        {getHearingSensitivity(planet.name)}
                      </span>
                      <div className="sensitivity-bar-container">
                        <div 
                          className="sensitivity-bar" 
                          style={{
                            width: `${parseFloat(getHearingSensitivity(planet.name))}%`,
                            backgroundColor: `rgba(255, ${200 - parseInt(getHearingSensitivity(planet.name)) * 2}, 0, 0.8)`,
                            opacity: planet.enabled ? 0.8 : 0.3
                          }}
                        ></div>
                      </div>
                    </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Audio tab with advanced settings */}
          {activeTab === 'audio' && (
            <div className="sidebar-content audio-tab fade-in">
              <div className="audio-info-banner">
                <h3>Audio Safety Features</h3>
                <p>
                  This application includes several features to protect your hearing:
                </p>
                <ul>
                  <li>Automatic frequency-dependent volume scaling</li>
                  <li>Extra attenuation for high frequencies</li>
                  <li>Optional Fletcher-Munson equal-loudness contour modeling</li>
                </ul>
              </div>
              
              <div className="audio-settings">
                <h3>Advanced Settings</h3>
                
                <div className="fletcher-toggle">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={useFletcher}
                      onChange={toggleFletcherCurves}
                    />
                    Use Fletcher-Munson equal-loudness curves
                  </label>
                  <p className="setting-description">
                    Models how human hearing perceives different frequencies for more balanced sound
                  </p>
                </div>
                
                {/* Reference frequency setting */}
                <div className="control-group">
                  <label htmlFor="reference-frequency" className="label">
                    Reference Frequency: {audioScalingConfig.referenceFrequency.toFixed(1)} Hz
                  </label>
                  <input 
                    id="reference-frequency"
                    type="range" 
                    value={audioScalingConfig.referenceFrequency}
                    min={27.5}
                    max={110}
                    step={0.5}
                    className="slider"
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      //console.log(`[REF FREQ] Changing to ${newValue}`);
                      
                      setAudioScalingConfig(cfg => ({
                        ...cfg,
                        referenceFrequency: newValue
                      }));
                      
                      // Force immediate recalculation
                      setTimeout(() => {
                        forceRecalculateAllGains();
                      }, 10);
                    }}
                  />
                  <p className="setting-description">
                    The frequency at which volume is not reduced (baseline)
                  </p>
                </div>
                
                {/* Scaling factor setting */}
                <div className="control-group">
                  <label htmlFor="scaling-factor" className="label">
                    Scaling Factor: {audioScalingConfig.scalingFactor.toFixed(1)}
                  </label>
                  <input 
                    id="scaling-factor"
                    type="range" 
                    value={audioScalingConfig.scalingFactor}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    className="slider"
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      //console.log(`[SCALING] Changing to ${newValue}`);
                      
                      setAudioScalingConfig(cfg => ({
                        ...cfg,
                        scalingFactor: newValue
                      }));
                      
                      // Force immediate recalculation
                      setTimeout(() => {
                        forceRecalculateAllGains();
                      }, 10);
                    }}
                  />
                  <p className="setting-description">
                    How aggressively to reduce volume at higher frequencies
                  </p>
                </div>
                
                <div className="audio-explanation">
                  <h4>Safety Measures Explained</h4>
                  <p>
                    Higher frequencies can be more damaging to hearing at the same volume level.
                    Our audio engine automatically reduces volume for higher notes to create a
                    safer and more balanced listening experience.
                  </p>
                  <p>
                    The Fletcher-Munson curves model how human ears perceive loudness
                    differently at different frequencies, providing even more natural sound.
                  </p>
                </div>
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