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
  const [synth, setSynth] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [activeTones, setActiveTones] = useState({});
  const [liveMode, setLiveMode] = useState(false);
  const [currentFrequencies, setCurrentFrequencies] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  
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
    
    return defaultFrequencies;
  }, [orbitData, baseFrequency, calculateBaseFrequencies]);

  // Initialize default frequencies if not provided by PlanetarySystem
  useEffect(() => {
    if (!initFrequenciesRef.current) {
      updateAllFrequencies();
      initFrequenciesRef.current = true;
    }
  }, [updateAllFrequencies]);

  // Initialize synthesizer 
  useEffect(() => {
    const initTone = async () => {
      try {
        // Crear un nodo de ganancia para controlar el volumen general
        const gainNode = new Tone.Gain(0.3).toDestination();
        gainNodeRef.current = gainNode;
        
        // Configuramos el sintetizador con opciones para evitar la saturación
        const newSynth = new Tone.PolySynth(Tone.Synth, {
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
      if (gainNodeRef.current) {
        gainNodeRef.current.dispose();
      }
      if (frequencyUpdateTimeoutRef.current) {
        clearTimeout(frequencyUpdateTimeoutRef.current);
      }
      if (synth) {
        synth.dispose();
      }
    };
  }, []);

  // Función simple y directa para activar/desactivar un planeta
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
    if (liveMode && synth && !isPaused) {
      try {
        if (planet.enabled) {
          // Si el planeta se ha activado, iniciar su sonido
          const freq = currentFrequencies[planet.name];
          if (freq) {
            synth.triggerAttack(freq, undefined, 0.3, planet.name);
            setActiveTones(prev => ({
              ...prev,
              [planet.name]: true
            }));
          }
        } else {
          // Si el planeta se ha desactivado, detener su sonido
          synth.triggerRelease(planet.name);
          setActiveTones(prev => {
            const newTones = { ...prev };
            delete newTones[planet.name];
            return newTones;
          });
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
      
      if (liveMode && synth && !isPaused) {
        Object.entries(activeTones).forEach(([planet, isActive]) => {
          if (isActive && updatedFrequencies[planet]) {
            synth.triggerRelease(planet);
            setTimeout(() => {
              synth.triggerAttack(updatedFrequencies[planet], undefined, 0.3, planet);
            }, 10);
          }
        });
      }
      
      frequencyUpdateTimeoutRef.current = null;
    }, 100);
  }, [liveMode, synth, activeTones, currentFrequencies, isPaused]);

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
        if (started && synth) {
          await Tone.context.resume();
          
          // Obtener los planetas habilitados y reproducir sus sonidos
          const enabledPlanets = orbitData.filter(p => p.enabled);
          const newActiveTones = {};
          
          if (!isPaused) {
            enabledPlanets.forEach((planet) => {
              const freq = currentFrequencies[planet.name];
              if (freq) {
                synth.triggerAttack(freq, undefined, 0.3, planet.name);
                newActiveTones[planet.name] = true;
              }
            });
          } else {
            // Si está pausado, solo registrar los planetas activos
            enabledPlanets.forEach(planet => {
              newActiveTones[planet.name] = true;
            });
          }
          
          setActiveTones(newActiveTones);
          setLiveMode(true);
        }
      } catch (error) {
        console.error("Error starting live mode:", error);
      }
    } else {
      // Detener todos los sonidos
      if (synth) {
        synth.releaseAll();
      }
      
      // Limpiar el estado de tonos activos y desactivar modo en vivo
      setActiveTones({});
      setLiveMode(false);
    }
  };

  // Manejar cambios en el estado de pausa/reproducción
  useEffect(() => {
    if (liveMode && synth) {
      if (isPaused) {
        // Detener todos los sonidos
        synth.releaseAll();
      } else {
        // Reanudar todos los sonidos para planetas habilitados
        const enabledPlanets = orbitData.filter(p => 
          p.enabled && activeTones[p.name]
        );
        
        enabledPlanets.forEach(planet => {
          const freq = currentFrequencies[planet.name];
          if (freq) {
            synth.triggerAttack(freq, undefined, 0.3, planet.name);
          }
        });
      }
    }
  }, [isPaused, liveMode, synth, orbitData, activeTones, currentFrequencies]);

  // Manejar cambios en la frecuencia base
  const handleBaseFrequencyChange = (e) => {
    const newBaseFrequency = parseInt(e.target.value);
    setBaseFrequency(newBaseFrequency);
    
    // Actualizar las frecuencias basadas en la nueva frecuencia base
    if (liveMode && synth && !isPaused) {
      setTimeout(() => {
        // Recalcular todas las frecuencias
        const newFrequencies = updateAllFrequencies();
        
        // Detener todos los sonidos
        synth.releaseAll();
        
        // Reproducir sonidos con las nuevas frecuencias
        Object.entries(activeTones).forEach(([planet, isActive]) => {
          if (isActive && orbitData.find(p => p.name === planet)?.enabled) {
            const freq = newFrequencies[planet];
            if (freq) {
              synth.triggerAttack(freq, undefined, 0.3, planet);
            }
          }
        });
      }, 10);
    }
  };

  // Reproducir secuencia orbital
  const playOrbitalSequence = async () => {
    if (!synth || isPlaying || liveMode) return;
    
    try {
      const started = await startAudioContext();
      if (!started) return;
      
      setIsPlaying(true);
      
      const now = Tone.now();
      const enabledPlanets = orbitData.filter(planet => planet.enabled);
      
      enabledPlanets.forEach((orbit, index) => {
        const originalIndex = orbitData.findIndex(planet => planet.name === orbit.name);
        const freq = calculateBaseFrequencies(baseFrequency, originalIndex - 2);
        synth.triggerAttackRelease(freq, "1n", now + index * 0.75, 0.3);
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