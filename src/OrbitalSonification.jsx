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

  // Efecto para actualizar el volumen maestro de forma segura
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

  // Función para activar/desactivar un planeta
  const togglePlanet = (index) => {
    // Crear una copia de los datos para modificar
    const newData = [...orbitData];
    // Obtener el planeta a modificar
    const planet = newData[index];
    // Invertir su estado
    planet.enabled = !planet.enabled;
    // Actualizar el estado
    setOrbitData(newData);
    
    // Si estamos en modo en vivo, actualizar el sonido
    if (liveMode) {
      try {
        const planetSynth = synthsRef.current[planet.name];
        if (!planetSynth) return;
        
        if (planet.enabled) {
          // Obtener la frecuencia actual
          const freq = isPaused ? 
            (lastFrequenciesRef.current[planet.name] || currentFrequencies[planet.name]) : 
            currentFrequencies[planet.name];
            
          if (freq) {
            // Iniciar el sonido
            planetSynth.triggerAttack(freq);
            if (debug.current) {
              console.log(`Activado planeta ${planet.name} con frecuencia ${freq.toFixed(1)} Hz`);
            }
          }
        } else {
          // Detener el sonido
          planetSynth.triggerRelease();
          
          // Medida adicional - silenciar completamente en caso de problemas
          setTimeout(() => {
            planetSynth.volume.value = -Infinity;
            setTimeout(() => {
              planetSynth.volume.value = 0;
            }, 100);
          }, 10);
          
          if (debug.current) {
            console.log(`Desactivado planeta ${planet.name}`);
          }
        }
      } catch (e) {
        console.error("Error updating sound:", e);
      }
    }
  };

  // Nueva función para activar/desactivar todos los planetas
  const toggleAllPlanets = (enable) => {
    // Crear una copia de los datos para modificar
    const newData = orbitData.map(planet => ({
      ...planet,
      enabled: enable
    }));
    
    // Actualizar el estado
    setOrbitData(newData);
    
    // Si estamos en modo en vivo, actualizar los sonidos
    if (liveMode) {
      try {
        newData.forEach(planet => {
          const planetSynth = synthsRef.current[planet.name];
          if (!planetSynth) return;
          
          if (planet.enabled) {
            // Obtener la frecuencia actual
            const freq = isPaused ? 
              (lastFrequenciesRef.current[planet.name] || currentFrequencies[planet.name]) : 
              currentFrequencies[planet.name];
              
            if (freq) {
              // Iniciar el sonido
              planetSynth.triggerAttack(freq);
            }
          } else {
            // Detener el sonido
            planetSynth.triggerRelease();
            
            // Medida adicional - silenciar completamente
            setTimeout(() => {
              planetSynth.volume.value = -Infinity;
              setTimeout(() => {
                planetSynth.volume.value = 0;
              }, 100);
            }, 10);
          }
        });
        
        if (debug.current) {
          console.log(`Se han ${enable ? 'activado' : 'desactivado'} todos los planetas`);
        }
      } catch (e) {
        console.error("Error updating sounds:", e);
      }
    }
  };

  // Comprobar si todos los planetas están activados
  const areAllPlanetsEnabled = orbitData.every(planet => planet.enabled);

  // Manejar cambios de frecuencia desde la visualización - REVISADO Y CORREGIDO
  const handleFrequencyChange = useCallback((frequencies) => {
    // Cancelar cualquier timeout pendiente para evitar problemas
    if (frequencyUpdateTimeoutRef.current) {
      clearTimeout(frequencyUpdateTimeoutRef.current);
    }
    
    // Actualizar inmediatamente sin timeout para garantizar respuesta en tiempo real
    // Actualizar el estado para la interfaz
    const updatedFrequencies = { ...currentFrequencies, ...frequencies };
    setCurrentFrequencies(updatedFrequencies);
    
    // Incrementar contador para monitoreo (solo debug)
    setFrequencyUpdateCount(prev => prev + 1);
    
    // También guardar las últimas frecuencias utilizadas
    lastFrequenciesRef.current = { ...lastFrequenciesRef.current, ...frequencies };
    
    // Solo actualizar los sintetizadores si no está pausado
    if (liveMode && !isPaused) {
      // Actualizar las frecuencias de todos los sintetizadores activos inmediatamente
      Object.entries(frequencies).forEach(([planetName, freq]) => {
        const planet = orbitData.find(p => p.name === planetName);
        if (planet && planet.enabled) {
          const planetSynth = synthsRef.current[planetName];
          if (planetSynth) {
            // Usar setValue inmediato en lugar de rampTo para frecuencias
            // Esto proporciona cambios más rápidos y nítidos
            planetSynth.frequency.value = freq;
            
            // Solo log ocasional para no saturar la consola
            if (debug.current && Math.random() < 0.01) { // Solo 1% de las actualizaciones
              console.log(`Actualizada frecuencia de ${planetName} a ${freq.toFixed(1)} Hz`);
            }
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

  // Activar/desactivar el modo en vivo
  const toggleLiveMode = async () => {
    if (!liveMode) {
      try {
        const started = await startAudioContext();
        if (started) {
          await Tone.context.resume();
          
          // Activar sonidos para todos los planetas habilitados
          orbitData.forEach(planet => {
            if (planet.enabled) {
              const planetSynth = synthsRef.current[planet.name];
              const freq = isPaused ? 
                (lastFrequenciesRef.current[planet.name] || currentFrequencies[planet.name]) : 
                currentFrequencies[planet.name];
                
              if (planetSynth && freq) {
                planetSynth.triggerAttack(freq);
                if (debug.current) {
                  console.log(`Iniciado sonido para ${planet.name} a ${freq.toFixed(1)} Hz`);
                }
              }
            }
          });
          
          setLiveMode(true);
        }
      } catch (error) {
        console.error("Error starting live mode:", error);
      }
    } else {
      // Detener todos los sonidos
      orbitData.forEach(planet => {
        const planetSynth = synthsRef.current[planet.name];
        if (planetSynth) {
          planetSynth.triggerRelease();
        }
      });
      
      // Desactivar modo en vivo
      setLiveMode(false);
      if (debug.current) {
        console.log("Modo en vivo desactivado");
      }
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
              checked={areAllPlanetsEnabled}
              onChange={() => toggleAllPlanets(!areAllPlanetsEnabled)}
            />
            {areAllPlanetsEnabled ? 'Disable All Planets' : 'Enable All Planets'}
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