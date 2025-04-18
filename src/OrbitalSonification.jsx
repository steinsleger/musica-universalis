// src/OrbitalSonification.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import PlanetarySystem from './PlanetarySystem';

const OrbitalSonification = () => {
/**
 * Orbital Sonification component.
 *
 * This component visualizes the planetary orbits and sonifies their orbital periods.
 * It also allows for user interaction with the animation speed and enables/disables
 * the sonification of individual planets.
 *
 * The component uses the Tone.js library for audio synthesis and the React library for
 * rendering the visualization.
 *
 * @returns A React component that renders a planetary orbits visualization with sonification.
 */
  const [orbitData, setOrbitData] = useState([
    { name: "Mercury", distance: 0.39, excentricity: 0.2056, enabled: true },
    { name: "Venus", distance: 0.72, excentricity: 0.0068, enabled: true },
    { name: "Earth", distance: 1.00, excentricity: 0.0167, enabled: true },
    { name: "Mars", distance: 1.52, excentricity: 0.0934, enabled: true },
    { name: "Ceres", distance: 2.77, excentricity: 0.0758, enabled: true },
    { name: "Jupiter", distance: 5.20, excentricity: 0.0484, enabled: true },
    { name: "Saturn", distance: 9.58, excentricity: 0.0539, enabled: true }
  ]);
  const [baseFrequency, setBaseFrequency] = useState(220);
  const [synth, setSynth] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [activeTones, setActiveTones] = useState({});
  const [liveMode, setLiveMode] = useState(false);
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  
  // Referencias para evitar problemas con audio/animación
  const audioContextStarted = useRef(false);
  const frequencyUpdateTimeoutRef = useRef(null);
  const gainNodeRef = useRef(null);
  const initFrequenciesRef = useRef(false);

  // Calculate frequencies based on the modified Bode law (Murch version)
  const calculateBaseFrequencies = useCallback((baseFreq, n) => {
    return (1 + Math.pow(2, n)) * 3 * baseFreq;
  }, []);

  // Función para calcular y actualizar todas las frecuencias
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
    console.log("Updated frequencies with base frequency:", baseFrequency, defaultFrequencies);
    
    return defaultFrequencies;
  }, [orbitData, baseFrequency, calculateBaseFrequencies]);

  // Initialize default frequencies if not provided by PlanetarySystem
  useEffect(() => {
    if (!initFrequenciesRef.current) {
      updateAllFrequencies();
      initFrequenciesRef.current = true;
    }
  }, [updateAllFrequencies]);

  // Función para actualizar sonidos cuando cambia la frecuencia base
  const updateLiveTonesWithNewFrequency = useCallback(() => {
    if (liveMode && synth && audioContextStarted.current) {
      console.log("Updating active tones with new base frequency:", baseFrequency);
      try {
        // Asegurarse de que las frecuencias estén actualizadas
        const newFrequencies = updateAllFrequencies();
        
        // Actualizar cada tono activo con su nueva frecuencia
        Object.keys(activeTones).forEach(planet => {
          if (newFrequencies[planet]) {
            console.log(`Updating tone for ${planet} to ${newFrequencies[planet].toFixed(1)} Hz`);
            synth.triggerRelease([planet]);
            synth.triggerAttack(newFrequencies[planet], undefined, 0.3, planet);
          }
        });
      } catch (e) {
        console.error("Error updating tones with new frequency:", e);
      }
    }
  }, [liveMode, synth, baseFrequency, activeTones, updateAllFrequencies]);

  // Initialize synthesizer with volume reduction to prevent saturation
  useEffect(() => {
    // Intentar inicializar Tone.js al cargar el componente
    const initTone = async () => {
      try {
        // Solo creamos el sintetizador, iniciaremos el contexto más tarde
        // Crear un nodo de ganancia para controlar el volumen general
        const gainNode = new Tone.Gain(0.3).toDestination(); // Reducimos el volumen general a 0.3 (-10dB aprox)
        gainNodeRef.current = gainNode;
        
        // Configuramos el sintetizador con opciones para evitar la saturación
        const newSynth = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,  // Reducimos el sustain para menos saturación
            release: 1
          },
          oscillator: {
            type: 'sine' // Usamos ondas sinusoidales que saturan menos que otros tipos
          }
        }).connect(gainNode); // Conectamos al nodo de ganancia en lugar de directamente a la salida
        
        setSynth(newSynth);
        
        // Intentar iniciar el contexto de audio (puede fallar si no hay interacción)
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
      // Limpieza cuando se desmonta el componente
      if (gainNodeRef.current) {
        gainNodeRef.current.dispose();
      }
      if (frequencyUpdateTimeoutRef.current) {
        clearTimeout(frequencyUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Toggle planet enabled state
  const togglePlanet = (index) => {
    setOrbitData(prevData => {
      const newData = prevData.map((planet, i) => 
        i === index ? { ...planet, enabled: !planet.enabled } : planet
      );
      
      // If in live mode, stop tone for disabled planet
      if (liveMode && synth && !newData[index].enabled) {
        const planetName = prevData[index].name;
        synth.triggerRelease([planetName]);
        setActiveTones(prev => {
          const newTones = { ...prev };
          delete newTones[planetName];
          return newTones;
        });
      }
      
      return newData;
    });
  };

  // Handle frequency updates from planetary visualization - throttled
  const handleFrequencyChange = useCallback((frequencies) => {
    // Usar un timeout para limitar la frecuencia de actualizaciones
    if (frequencyUpdateTimeoutRef.current) {
      clearTimeout(frequencyUpdateTimeoutRef.current);
    }
    
    frequencyUpdateTimeoutRef.current = setTimeout(() => {
      // Asegurarnos de que tenemos todas las frecuencias necesarias
      const updatedFrequencies = { ...currentFrequencies };
      
      // Actualizar solo las frecuencias que han cambiado
      Object.entries(frequencies).forEach(([planet, freq]) => {
        updatedFrequencies[planet] = freq;
      });
      
      setCurrentFrequencies(updatedFrequencies);
      
      // If in live mode, update the active tones with new frequencies
      if (liveMode && synth && audioContextStarted.current) {
        try {
          Object.entries(updatedFrequencies).forEach(([planet, freq]) => {
            if (activeTones[planet]) {
              // Individual note updating not supported in Tone.PolySynth
              // Instead, we'll retriggger with new frequency
              synth.triggerRelease([planet]);
              synth.triggerAttack(freq, undefined, 0.3, planet); // Reducimos la velocidad a 0.3
            }
          });
        } catch (e) {
          console.error("Error updating tone frequency:", e);
        }
      }
      
      frequencyUpdateTimeoutRef.current = null;
    }, 100); // Actualizar a lo sumo cada 100ms
    
  }, [liveMode, synth, activeTones, currentFrequencies]);

  // Función para iniciar Tone.js de forma segura
  const startAudioContext = async () => {
    if (!audioContextStarted.current) {
      try {
        await Tone.start();
        audioContextStarted.current = true;
        console.log("AudioContext started successfully");
        return true;
      } catch (error) {
        console.error("Could not start AudioContext:", error);
        return false;
      }
    }
    return true;
  };

  // Toggle live mode con manejo de errores mejorado
  const toggleLiveMode = async () => {
    // Si estamos activando el modo en vivo
    if (!liveMode) {
      // Iniciar el AudioContext primero con interacción del usuario
      try {
        const started = await startAudioContext();
        if (started && synth) {
          console.log("Starting live mode...");
          // Activar soporte para monitoreo
          Tone.context.resume();
          
          // Iniciar sonificación
          const success = await startLiveMode();
          if (success) {
            setLiveMode(true);
          } else {
            console.error("Failed to start live mode");
          }
        }
      } catch (error) {
        console.error("Error toggling live mode:", error);
      }
    } else {
      // Desactivar el modo en vivo
      console.log("Stopping live mode...");
      try {
        if (synth) {
          // Obtenemos todos los planetas activos y liberamos sus notas
          const planetNames = Object.keys(activeTones);
          console.log("Stopping tones for planets:", planetNames);
          
          // Si hay planetas activos, liberamos sus notas
          if (planetNames.length > 0) {
            // Detener cada nota individualmente
            planetNames.forEach(planet => {
              synth.triggerRelease(planet);
            });
            
            // También usamos releaseAll como respaldo
            synth.releaseAll();
          }
        }
      } catch (e) {
        console.error("Error stopping tones:", e);
      }
      
      // Limpiar el estado de tonos activos y desactivar modo en vivo
      setActiveTones({});
      setLiveMode(false);
    }
  };

  // Start live mode with all enabled planets - with comprehensive error handling
  const startLiveMode = async () => {
    if (!synth) {
      console.error("No synthesizer available");
      return false;
    }
    
    try {
      console.log("Starting tones for planets...");
      // Start tones for all enabled planets
      const enabledPlanets = orbitData.filter(p => p.enabled);
      const newActiveTones = {};
      
      // Asegurarnos de que el sintetizador esté listo
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      
      // Asegurarse de que las frecuencias están actualizadas
      const frequencies = updateAllFrequencies();
      
      enabledPlanets.forEach(planet => {
        // Encontrar la frecuencia del planeta
        let freq = frequencies[planet.name];
        
        if (freq) {
          console.log(`Starting tone for ${planet.name} at ${freq} Hz`);
          // Reduced velocity to 0.3 to mitigate saturation
          synth.triggerAttack(freq, undefined, 0.3, planet.name);
          newActiveTones[planet.name] = true;
        } else {
          console.error(`No frequency available for ${planet.name}`);
        }
      });
      
      console.log("Active tones:", newActiveTones);
      setActiveTones(newActiveTones);
      return Object.keys(newActiveTones).length > 0;
    } catch (error) {
      console.error("Error starting live mode:", error);
      return false;
    }
  };

  // Effect to handle changes to orbitData in live mode
  useEffect(() => {
    if (liveMode && synth && audioContextStarted.current) {
      try {
        // Asegurarse de que las frecuencias están actualizadas
        const frequencies = updateAllFrequencies();
        
        // Find enabled planets that aren't currently playing
        orbitData.forEach(planet => {
          if (planet.enabled && !activeTones[planet.name]) {
            // Obtener la frecuencia actualizada
            const freq = frequencies[planet.name];
            
            if (freq) {
              console.log(`Adding tone for ${planet.name} at ${freq} Hz`);
              synth.triggerAttack(freq, undefined, 0.3, planet.name); // Reducimos la velocidad a 0.3
              setActiveTones(prev => ({
                ...prev,
                [planet.name]: true
              }));
            }
          }
        });
      } catch (e) {
        console.error("Error updating tones based on orbitData:", e);
      }
    }
  }, [orbitData, liveMode, synth, activeTones, updateAllFrequencies]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (frequencyUpdateTimeoutRef.current) {
        clearTimeout(frequencyUpdateTimeoutRef.current);
      }
      
      if (synth) {
        try {
          console.log("Cleaning up synth");
          synth.releaseAll();
          synth.dispose();
        } catch (e) {
          console.error("Error cleaning up synth:", e);
        }
      }
    };
  }, [synth]);

  // Generate chord sequence based on orbits - with error handling
  const playOrbitalSequence = async () => {
    if (!synth || isPlaying || liveMode) return;
    
    // Iniciar el AudioContext primero con interacción del usuario
    try {
      const started = await startAudioContext();
      if (!started) {
        console.error("Could not start AudioContext");
        return;
      }
      
      setIsPlaying(true);
      
      const now = Tone.now();
      
      const enabledPlanets = orbitData.filter(planet => planet.enabled);
      
      enabledPlanets.forEach((orbit, index) => {
        // Find the original index to calculate the right frequency
        const originalIndex = orbitData.findIndex(planet => planet.name === orbit.name);
        const freq = calculateBaseFrequencies(baseFrequency, originalIndex - 2); // Adjust so Earth is index 0
        
        // Utilizamos una velocidad más baja (0.3) y un tiempo más corto para evitar saturación
        synth.triggerAttackRelease(freq, "1n", now + index * 0.75, 0.3);
      });
      
      // Reset play state after the sequence
      setTimeout(() => setIsPlaying(false), enabledPlanets.length * 750 + 500);
    } catch (error) {
      console.error("Error playing orbital sequence:", error);
      setIsPlaying(false); // Reset playing state if there's an error
    }
  };

  // Handle base frequency changes - Now directly updates all active tones
  const handleBaseFrequencyChange = (e) => {
    const newBaseFrequency = parseInt(e.target.value);
    setBaseFrequency(newBaseFrequency);
    
    // Actualizar inmediatamente los tonos si estamos en modo en vivo
    if (liveMode) {
      // Esperar a que React actualice el estado de baseFrequency
      setTimeout(() => {
        updateLiveTonesWithNewFrequency();
      }, 10);
    }
  };

  return (
    <div className="container">
      <h2 className="title">Planetary Orbits Sonification</h2>
      
      <div className="visualization-container">
        <div className="orbital-display">
          <PlanetarySystem 
            orbitData={orbitData} 
            animationSpeed={animationSpeed} 
            baseFrequency={baseFrequency}
            onFrequencyChange={handleFrequencyChange}
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
          
          <div className="live-mode-toggle">
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={liveMode}
                onChange={toggleLiveMode}
                disabled={isPlaying}
              />
              Modo en vivo (sonido continuo siguiendo las órbitas elípticas)
            </label>
          </div>
          
          <p className="note">
            Las velocidades orbitales y frecuencias varían según la distancia al Sol en cada punto de la órbita elíptica.
          </p>
        </div>
      </div>
      
      <div className="slider-container">
        <label htmlFor="frequency-slider" className="label">
          Base Frequency: {baseFrequency} Hz
        </label>
        <input 
          id="frequency-slider"
          type="range" 
          value={baseFrequency}
          min={55}
          max={330}
          step={1}
          className="slider"
          onChange={handleBaseFrequencyChange}
        />
      </div>

      <button 
        onClick={playOrbitalSequence}
        disabled={isPlaying || liveMode}
        className="button"
      >
        {isPlaying ? 'Playing...' : 'Play Orbital Sequence'}
      </button>

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
                  />
                </td>
                <td>{planet.name}</td>
                <td>{planet.distance.toFixed(2)}</td>
                <td>{planet.excentricity.toFixed(4)}</td>
                <td>{currentFrequencies[planet.name] 
                    ? currentFrequencies[planet.name].toFixed(1) 
                    : calculateBaseFrequencies(baseFrequency, index - 2).toFixed(1)}
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