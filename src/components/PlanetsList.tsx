import React from 'react';
import { useVisualizationControls } from '../hooks/useVisualizationControls';
import { useFrequencyCalculation } from '../hooks/useFrequencyCalculation';
import { useAudioConfig } from '../hooks/useAudioConfig';

const PlanetsList: React.FC = () => {
  const { orbitData, togglePlanet } = useVisualizationControls();
  const { baseFrequency } = useAudioConfig();
  const { calculateFrequency, frequencyToNote } = useFrequencyCalculation();

  return (
    <div className="planets-list">
      <div className="planets-header">
        <h3>Enabled Planets</h3>
      </div>

      <div className="planets-container">
        {orbitData.map((planet, index) => {
          const frequency = calculateFrequency(baseFrequency, planet, 'titiusBode');
          const note = frequencyToNote(frequency);

          return (
            <div key={planet.name} className="planet-item">
              <label className="planet-checkbox">
                <input
                  type="checkbox"
                  checked={planet.enabled}
                  onChange={() => togglePlanet(index)}
                />
                <span className="planet-name">{planet.name}</span>
              </label>
              <div className="planet-info">
                <span className="frequency">{frequency.toFixed(1)} Hz</span>
                <span className="note">{note}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="planets-stats">
        <p>
          Enabled: {orbitData.filter(p => p.enabled).length} / {orbitData.length}
        </p>
      </div>
    </div>
  );
};

export default PlanetsList;
