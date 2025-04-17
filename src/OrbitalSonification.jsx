// src/OrbitalSonification.jsx
import React, { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import PlanetarySystem from './PlanetarySystem';

const OrbitalSonification = () => {
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

  // Initialize synthesizer
  useEffect(() => {
    const newSynth = new Tone.PolySynth().toDestination();
    setSynth(newSynth);
    return () => {
      newSynth.dispose();
    };
  }, []);

  // Calculate frequencies based on the modified Bode law (Murch version)
  const calculateBaseFrequencies = (baseFreq, n) => {
    return (1 + Math.pow(2, n)) * 3 * baseFreq;
  };

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

  // Handle frequency updates from planetary visualization
  const handleFrequencyChange = useCallback((frequencies) => {
    setCurrentFrequencies(frequencies);
    
    // If in live mode, update the active tones with new frequencies
    if (liveMode && synth) {
      Object.entries(frequencies).forEach(([planet, freq]) => {
        if (activeTones[planet]) {
          // Individual note updating not supported in Tone.PolySynth
          // Instead, we'll retriggger with new frequency
          synth.triggerRelease([planet]);
          synth.triggerAttack(freq, undefined, 0.5, planet);
        }
      });
    }
  }, [liveMode, synth, activeTones]);

  // Toggle live mode
  const toggleLiveMode = () => {
    if (liveMode) {
      // Stop all tones when turning off live mode
      if (synth) {
        const planetNames = Object.keys(activeTones);
        if (planetNames.length > 0) {
          synth.triggerRelease(planetNames);
        }
        setActiveTones({});
      }
    } else {
      // Start live mode
      startLiveMode();
    }
    setLiveMode(!liveMode);
  };

  // Start live mode with all enabled planets
  const startLiveMode = async () => {
    if (!synth) return;
    
    await Tone.start();
    
    // Start tones for all enabled planets
    const enabledPlanets = orbitData.filter(p => p.enabled);
    const newActiveTones = {};
    
    enabledPlanets.forEach(planet => {
      const freq = currentFrequencies[planet.name];
      if (freq) {
        synth.triggerAttack(freq, undefined, 0.5, planet.name);
        newActiveTones[planet.name] = true;
      }
    });
    
    setActiveTones(newActiveTones);
  };

  // Effect to handle changes to orbitData in live mode
  useEffect(() => {
    if (liveMode && synth) {
      // Find enabled planets that aren't currently playing
      orbitData.forEach(planet => {
        if (planet.enabled && !activeTones[planet.name]) {
          const freq = currentFrequencies[planet.name];
          if (freq) {
            synth.triggerAttack(freq, undefined, 0.5, planet.name);
            setActiveTones(prev => ({
              ...prev,
              [planet.name]: true
            }));
          }
        }
      });
    }
  }, [orbitData, liveMode, synth, activeTones, currentFrequencies]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (synth) {
        const planetNames = Object.keys(activeTones);
        if (planetNames.length > 0) {
          synth.triggerRelease(planetNames);
        }
      }
    };
  }, [synth, activeTones]);

  // Effect to handle changes in frequency
  useEffect(() => {
    if (liveMode && synth) {
      // Update tones with new frequencies
      Object.entries(currentFrequencies).forEach(([planetName, freq]) => {
        if (activeTones[planetName]) {
          // Retriggering the tone with the new frequency
          synth.triggerRelease([planetName]);
          synth.triggerAttack(freq, undefined, 0.5, planetName);
        }
      });
    }
  }, [currentFrequencies, liveMode, synth, activeTones]);

  // Generate chord sequence based on orbits
  const playOrbitalSequence = async () => {
    if (!synth || isPlaying || liveMode) return;
    
    setIsPlaying(true);
    await Tone.start();
    const now = Tone.now();
    
    const enabledPlanets = orbitData.filter(planet => planet.enabled);
    
    enabledPlanets.forEach((orbit, index) => {
      // Find the original index to calculate the right frequency
      const originalIndex = orbitData.findIndex(planet => planet.name === orbit.name);
      const freq = calculateBaseFrequencies(baseFrequency, originalIndex - 2); // Adjust so Earth is index 0
      synth.triggerAttackRelease(freq, "1n", now + index * 0.75);
    });
    
    // Reset play state after the sequence
    setTimeout(() => setIsPlaying(false), enabledPlanets.length * 750 + 500);
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
          onChange={(e) => setBaseFrequency(parseInt(e.target.value))}
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