// src/OrbitalSonification.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import PlanetarySystem from './PlanetarySystem';

const OrbitalSonification = () => {
  // Estado para los datos de órbitas de planetas
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [liveMode, setLiveMode] = useState(false);
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.5); // Valor inicial: 0.5 (0dB)
  const [frequencyUpdateCount, setFrequencyUpdateCount] = useState(0); // Para monitorear actualizaciones
  
  // Referencias para evitar problemas con audio/animación
  const audioContextStarted = useRef(false);
  const frequencyUpdateTimeoutRef = useRef(null);
  const gainNodeRef = useRef(null);
  const initFrequenciesRef = useRef(false);
  
  // Nueva referencia para mantener los sintetizadores individuales
  const synthsRef = useRef({});
  const mainSynthRef = useRef(null);
  
  // Guardar las últimas frecuencias utilizadas cuando se pausa
  const lastFrequenciesRef = useRef({});
  
  // Debug flag
  const debug = useRef(true);

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
    
    return defaultFrequencies;
  }, [orbitData, baseFrequency, calculateBaseFrequencies]);

  // Initialize default frequencies if not provided by PlanetarySystem
  useEffect(() => {
    if (!initFrequenciesRef.current) {
      updateAllFrequencies();
      initFrequenciesRef.current = true;
    }
  }, [updateAllFrequencies]);

  // Actualizar las frecuencias cada vez que cambie la frecuencia base
  useEffect(() => {
    updateAllFrequencies();
  }, [baseFrequency, updateAllFrequencies]);

  // Initialize synthesizer system
  useEffect(() => {
    const initTone = async () => {
      try {
        // Crear un nodo de ganancia para controlar el volumen general
        const gainNode = new Tone.Gain(0.5).toDestination();
        gainNodeRef.current = gainNode;
        
        // Configuramos el sintetizador principal para la secuencia
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
        
        // Crear un sintetizador individual para cada planeta
        orbitData.forEach(planet => {
          // Crear un nuevo sintetizador con un contexto limpio
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
          
          // Almacenar el sintetizador en la referencia
          synthsRef.current[planet.name] = planetSynth;
        });
        
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
      // Limpiar todos los sintetizadores
      if (gainNodeRef.current) {
        gainNodeRef.current.dispose();
      }
      if (frequencyUpdateTimeoutRef.current) {
        clearTimeout(frequencyUpdateTimeoutRef.current);
      }
      if (mainSynthRef.current) {
        mainSynthRef.current.dispose();
      }
      
      // Limpiar todos los sintetizadores individuales
      Object.values(synthsRef.current).forEach(synth => {
        if (synth) synth.dispose();
      });
    };
  }, [orbitData]);
  
  // NEW: Efecto para mantener el estado de audio sincronizado con el estado de la aplicación
  // Este efecto ahora será el responsable de gestionar el audio de forma independiente
  useEffect(() => {
    if (!liveMode) return;
    
    // Asegurarnos de que el contexto de audio está iniciado
    const setupAudio = async () => {
      try {
        // Asegurarse de que Tone.js está listo
        if (!audioContextStarted.current) {
          await Tone.start();
          audioContextStarted.current = true;
        }
        
        // Reanudar el contexto de audio
        await Tone.context.resume();
        
        // Reconstruir todo el estado de audio basado en el estado actual de la aplicación
        // Esto asegura que siempre tenemos un estado de audio coherente
        orbitData.forEach(planet => {
          const synth = synthsRef.current[planet.name];
          if (!synth) return;
          
          // Detener cualquier sonido previo para empezar desde un estado limpio
          synth.triggerRelease();
          
          // Si el planeta está habilitado, iniciar su sonido
          if (planet.enabled && liveMode) {
            const freq = isPaused ? 
              (lastFrequenciesRef.current[planet.name] || currentFrequencies[planet.name]) : 
              currentFrequencies[planet.name];
              
            if (freq) {
              // Pequeño retraso para asegurar que el release anterior ha tenido efecto
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
  }, [liveMode, orbitData, isPaused]); // Dependencias clave para reaccionar a cambios
  
  // Restaurar el efecto para el control de volumen maestro
  useEffect(() => {
    if (gainNodeRef.current) {
      try {
        // Convertir el volumen lineal a una escala exponencial más adecuada para el audio
        // Esto evita los problemas de silenciamiento con valores pequeños
        const dbValue = masterVolume === 0 ? -Infinity : 20 * Math.log10(masterVolume);
        
        // Usar rampTo para evitar clics y transiciones bruscas
        gainNodeRef.current.gain.rampTo(masterVolume, 0.1);
        
        if (debug.current) {
          console.log(`Volume set to ${masterVolume} (${dbValue.toFixed(1)} dB)`);
        }
      } catch (e) {
        console.error("Error setting volume:", e);
      }
    }
  }, [masterVolume]);
  
  // Función para activar/desactivar un planeta - SIMPLIFICADA
  const togglePlanet = (index) => {
    // Crear una copia de los datos para modificar
    const newData = [...orbitData];
    // Obtener el planeta a modificar
    const planet = newData[index];
    // Invertir su estado
    planet.enabled = !planet.enabled;
    // Actualizar el estado - el efecto se encargará de actualizar el audio
    setOrbitData(newData);
    
    // No hacemos nada con el audio aquí - el efecto se encargará
    if (debug.current) {
      console.log(`${planet.enabled ? 'Activado' : 'Desactivado'} planeta ${planet.name}`);
    }
    
    // Force audio context resume - safety measure
    if (liveMode) {
      Tone.context.resume().catch(e => console.error("Error resuming audio context:", e));
    }
  };

  // Nueva función para activar/desactivar todos los planetas - SIMPLIFICADA
  const toggleAllPlanets = (enable) => {
    // Crear una copia de los datos para modificar
    const newData = orbitData.map(planet => ({
      ...planet,
      enabled: enable
    }));
    
    // Actualizar el estado - el efecto se encargará de actualizar el audio
    setOrbitData(newData);
    
    if (debug.current) {
      console.log(`Se han ${enable ? 'activado' : 'desactivado'} todos los planetas`);
    }
    
    // Force audio context resume - safety measure
    if (liveMode) {
      Tone.context.resume().catch(e => console.error("Error resuming audio context:", e));
    }
  };

  // Activar/desactivar el modo en vivo - SIMPLIFICADA
  const toggleLiveMode = async () => {
    try {
      // Asegurarse de que el contexto de audio está activo
      await startAudioContext();
      
      // Simplemente alternar el estado - el efecto se encargará del audio
      setLiveMode(!liveMode);
      
      if (liveMode) {
        // Desactivando el modo en vivo, detener todos los sonidos
        Object.values(synthsRef.current).forEach(synth => {
          if (synth) synth.triggerRelease();
        });
        
        if (debug.current) {
          console.log("Modo en vivo desactivado");
        }
      } else {
        if (debug.current) {
          console.log("Modo en vivo activado");
        }
      }
    } catch (error) {
      console.error("Error toggling live mode:", error);
    }
  };

  // Ahora cuando pausamos no afecta a los sonidos, solo a la animación
  // y actualización de frecuencias
  useEffect(() => {
    if (isPaused) {
      // Guardar las frecuencias actuales
      lastFrequenciesRef.current = { ...currentFrequencies };
      console.log("Animation paused. Frequencies frozen.");
    } else {
      console.log("Animation resumed. Frequencies updating.");
    }
  }, [isPaused, currentFrequencies]);

  // Manejar cambios de frecuencia desde la visualización - SIMPLIFICADO
  const handleFrequencyChange = useCallback((frequencies) => {
    // Actualizar el estado para la interfaz
    const updatedFrequencies = { ...currentFrequencies, ...frequencies };
    setCurrentFrequencies(updatedFrequencies);
    
    // Incrementar contador para monitoreo (solo debug)
    setFrequencyUpdateCount(prev => prev + 1);
    
    // También guardar las últimas frecuencias utilizadas
    lastFrequenciesRef.current = { ...lastFrequenciesRef.current, ...frequencies };
    
    // Solo actualizar los sintetizadores si no está pausado y estamos en modo en vivo
    if (liveMode && !isPaused) {
      // Actualizar las frecuencias de los sintetizadores activos
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

  // Iniciar el contexto de audio de forma segura
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

  // Manejar cambios en la frecuencia base
  const handleBaseFrequencyChange = (e) => {
    const newBaseFrequency = parseInt(e.target.value);
    setBaseFrequency(newBaseFrequency);
    
    // La actualización de frecuencias ahora se hace automáticamente en el useEffect,
    // lo que garantiza que se actualice en todos los lugares necesarios
    
    // Si estamos en modo en vivo y NO está pausado, actualizar los sonidos
    if (liveMode && !isPaused) {
      setTimeout(() => {
        // Actualizar frecuencias para planetas activos
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

  // Manejar cambios en el volumen maestro
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setMasterVolume(newVolume);
  };

  // Reproducir secuencia orbital usando el sintetizador principal
  const playOrbitalSequence = async () => {
    if (!mainSynthRef.current || isPlaying || liveMode) return;
    
    try {
      const started = await startAudioContext();
      if (!started) return;
      
      setIsPlaying(true);
      
      const now = Tone.now();
      const enabledPlanets = orbitData.filter(planet => planet.enabled);
      
      enabledPlanets.forEach((orbit, index) => {
        const originalIndex = orbitData.findIndex(planet => planet.name === orbit.name);
        const freq = calculateBaseFrequencies(baseFrequency, originalIndex - 2);
        mainSynthRef.current.triggerAttackRelease(freq, "1n", now + index * 0.75, 0.3);
      });
      
      setTimeout(() => {
        setIsPlaying(false);
      }, enabledPlanets.length * 750 + 500);
    } catch (error) {
      console.error("Error playing orbital sequence:", error);
      setIsPlaying(false);
    }
  };

  // Alternar entre pausa y reproducción - Ahora solo afecta a la animación
  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  // Convertir el volumen a decibelios para mostrar en la interfaz
  const volumeToDb = (volume) => {
    // Evitar logaritmo de 0
    if (volume <= 0.01) return "-∞";
    return (20 * Math.log10(volume)).toFixed(1);
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
          
          {/* Control de volumen maestro */}
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
              Modo en vivo (sonido continuo siguiendo las órbitas elípticas)
            </label>
          </div>
          
          <p className="note">
            Las velocidades orbitales y frecuencias varían según la distancia al Sol en cada punto de la órbita elíptica.
            {isPaused && liveMode && (
              <strong> La animación está pausada, pero el sonido continúa con frecuencias fijas.</strong>
            )}
          </p>
          
          {/* Información de debugging */}
          <p className="debug-info">
            <small>Actualizaciones de frecuencia: {frequencyUpdateCount}</small>
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
        
        {/* Checkbox para activar/desactivar todos los planetas */}
        <div className="master-toggle">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={orbitData.every(planet => planet.enabled)}
              onChange={() => toggleAllPlanets(!orbitData.every(planet => planet.enabled))}
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
                <td>
                  {/* Usar siempre currentFrequencies para mostrar los valores actuales */}
                  {currentFrequencies[planet.name] 
                    ? currentFrequencies[planet.name].toFixed(1) 
                    : "Calculando..."}
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