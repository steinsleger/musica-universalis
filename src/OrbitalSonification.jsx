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
  
  // Referencias para evitar problemas con audio/animación
  const audioContextStarted = useRef(false);
  const frequencyUpdateTimeoutRef = useRef(null);
  const gainNodeRef = useRef(null);
  const initFrequenciesRef = useRef(false);
  
  // Nueva referencia para mantener los sintetizadores individuales
  const synthsRef = useRef({});
  const mainSynthRef = useRef(null);

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

  // Initialize synthesizer system
  useEffect(() => {
    const initTone = async () => {
      try {
        // Crear un nodo de ganancia para controlar el volumen general
        const gainNode = new Tone.Gain(0.3).toDestination();
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

  // Función completamente rediseñada para activar/desactivar un planeta
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
    if (liveMode && !isPaused) {
      try {
        const planetSynth = synthsRef.current[planet.name];
        if (!planetSynth) return;
        
        if (planet.enabled) {
          // Obtener la frecuencia actual
          const freq = currentFrequencies[planet.name];
          if (freq) {
            // Iniciar el sonido
            planetSynth.triggerAttack(freq);
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
        }
      } catch (e) {
        console.error("Error updating sound:", e);
      }
    }
  };

  // Manejar cambios de frecuencia desde la visualización
  const handleFrequencyChange = useCallback((frequencies) => {
    if (frequencyUpdateTimeoutRef.current) {
      clearTimeout(frequencyUpdateTimeoutRef.current);
    }
    
    frequencyUpdateTimeoutRef.current = setTimeout(() => {
      const updatedFrequencies = { ...currentFrequencies, ...frequencies };
      setCurrentFrequencies(updatedFrequencies);
      
      if (liveMode && !isPaused) {
        // Actualizar las frecuencias de todos los sintetizadores activos
        orbitData.forEach(planet => {
          if (planet.enabled && updatedFrequencies[planet.name]) {
            const planetSynth = synthsRef.current[planet.name];
            if (planetSynth) {
              // Establecer nueva frecuencia
              planetSynth.frequency.value = updatedFrequencies[planet.name];
            }
          }
        });
      }
      
      frequencyUpdateTimeoutRef.current = null;
    }, 100);
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

  // Activar/desactivar el modo en vivo - completamente rediseñado
  const toggleLiveMode = async () => {
    if (!liveMode) {
      try {
        const started = await startAudioContext();
        if (started) {
          await Tone.context.resume();
          
          if (!isPaused) {
            // Activar sonidos para todos los planetas habilitados
            orbitData.forEach(planet => {
              if (planet.enabled) {
                const planetSynth = synthsRef.current[planet.name];
                const freq = currentFrequencies[planet.name];
                if (planetSynth && freq) {
                  planetSynth.triggerAttack(freq);
                }
              }
            });
          }
          
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
    }
  };

  // Manejar cambios en el estado de pausa/reproducción
  useEffect(() => {
    if (liveMode) {
      if (isPaused) {
        // Detener todos los sonidos al pausar
        orbitData.forEach(planet => {
          const planetSynth = synthsRef.current[planet.name];
          if (planetSynth) {
            planetSynth.triggerRelease();
          }
        });
      } else {
        // Reanudar sonidos para planetas habilitados
        orbitData.forEach(planet => {
          if (planet.enabled) {
            const planetSynth = synthsRef.current[planet.name];
            const freq = currentFrequencies[planet.name];
            if (planetSynth && freq) {
              planetSynth.triggerAttack(freq);
            }
          }
        });
      }
    }
  }, [isPaused, liveMode, orbitData, currentFrequencies]);

  // Manejar cambios en la frecuencia base
  const handleBaseFrequencyChange = (e) => {
    const newBaseFrequency = parseInt(e.target.value);
    setBaseFrequency(newBaseFrequency);
    
    // Actualizar las frecuencias basadas en la nueva frecuencia base
    if (liveMode && !isPaused) {
      setTimeout(() => {
        // Recalcular todas las frecuencias
        const newFrequencies = updateAllFrequencies();
        
        // Actualizar frecuencias para planetas activos
        orbitData.forEach(planet => {
          if (planet.enabled) {
            const planetSynth = synthsRef.current[planet.name];
            const freq = newFrequencies[planet.name];
            if (planetSynth && freq) {
              planetSynth.frequency.value = freq;
            }
          }
        });
      }, 10);
    }
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

  // Alternar entre pausa y reproducción
  const togglePlayPause = () => {
    setIsPaused(!isPaused);
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
          
          <div className="playback-controls">
            <button 
              onClick={togglePlayPause}
              className="button playback-button"
              disabled={isPlaying}
            >
              {isPaused ? '▶️ Play' : '⏸️ Pause'}
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