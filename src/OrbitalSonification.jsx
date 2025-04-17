// src/OrbitalSonification.jsx
import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';

const OrbitalSonification = () => {
  const [orbitData, setOrbitData] = useState([
    { name: "Mercury", distance: 0.39, enabled: true },
    { name: "Venus", distance: 0.72, enabled: true },
    { name: "Earth", distance: 1.00, enabled: true },
    { name: "Mars", distance: 1.52, enabled: true },
    { name: "Ceres", distance: 2.77, enabled: true },
    { name: "Jupiter", distance: 5.20, enabled: true },
    { name: "Saturn", distance: 9.58, enabled: true }
  ]);
  const [baseFrequency, setBaseFrequency] = useState(440);
  const [synth, setSynth] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize synthesizer
  useEffect(() => {
    const newSynth = new Tone.PolySynth().toDestination();
    setSynth(newSynth);
    return () => {
      newSynth.dispose();
    };
  }, []);

  // Calculate frequencies based on the modified Bode law (Murch version)
  const calculateFrequencies = (baseFreq, n) => {
    return (1 + Math.pow(2, n)) * 3 * baseFreq;
  };

  // Toggle planet enabled state
  const togglePlanet = (index) => {
    setOrbitData(prevData => 
      prevData.map((planet, i) => 
        i === index ? { ...planet, enabled: !planet.enabled } : planet
      )
    );
  };

  // Generate chord sequence based on orbits
  const playOrbitalSequence = async () => {
    if (!synth || isPlaying) return;
    
    setIsPlaying(true);
    await Tone.start();
    const now = Tone.now();
    
    const enabledPlanets = orbitData.filter(planet => planet.enabled);
    
    enabledPlanets.forEach((orbit, index) => {
      // Find the original index to calculate the right frequency
      const originalIndex = orbitData.findIndex(planet => planet.name === orbit.name);
      const freq = calculateFrequencies(baseFrequency, originalIndex - 2); // Adjust so Earth is index 0
      synth.triggerAttackRelease(freq, "1n", now + index * 0.75);
    });
    
    // Reset play state after the sequence
    setTimeout(() => setIsPlaying(false), enabledPlanets.length * 750 + 500);
  };

  return (
    <div className="container">
      <h2 className="title">Planetary Orbits Sonification</h2>
      
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
        disabled={isPlaying}
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
              <th>Frequency (Hz)</th>
            </tr>
          </thead>
          <tbody>
            {orbitData.map((planet, index) => (
              <tr key={planet.name}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={planet.enabled}
                    onChange={() => togglePlanet(index)}
                  />
                </td>
                <td>{planet.name}</td>
                <td>{planet.distance.toFixed(2)}</td>
                <td>{calculateFrequencies(baseFrequency, index - 2).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrbitalSonification;