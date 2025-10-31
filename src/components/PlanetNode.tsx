import React from 'react';
import { Planet } from '../utils/types';

interface PlanetNodeProps {
  planet: Planet;
  position: { x: number; y: number };
  size: number;
  planetColors: Record<string, string>;
  currentlyPlayingPlanet: string | null;
  frequencyNote: string;
  frequencyValue: number;
}

const PlanetNode: React.FC<PlanetNodeProps> = ({
  planet,
  position,
  size,
  planetColors,
  currentlyPlayingPlanet,
  frequencyNote,
  frequencyValue
}) => {
  if (!planet.enabled || size === 0) return null;

  const isPlaying = planet.name === currentlyPlayingPlanet;
  const planetColor = planetColors[planet.name] || '#999';

  return (
    <g key={`planet-${planet.name}`}>
      {/* Glow effect for playing planet */}
      {isPlaying && (
        <circle
          cx={position.x}
          cy={position.y}
          r={size + 8}
          fill="none"
          stroke={planetColor}
          strokeWidth="2"
          opacity="0.3"
          className="glow-ring"
          style={{
            animation: 'pulse 1s infinite'
          }}
        />
      )}

      {/* Planet circle */}
      <circle
        cx={position.x}
        cy={position.y}
        r={size}
        fill={planetColor}
        opacity="0.9"
      />

      {/* Frequency label */}
      <text
        x={position.x}
        y={position.y - size - 12}
        textAnchor="middle"
        fontSize="11"
        fill="#ccc"
        fontFamily="monospace"
        opacity="0.8"
      >
        {planet.name}
      </text>

      {/* Frequency note */}
      <text
        x={position.x}
        y={position.y + size + 20}
        textAnchor="middle"
        fontSize="9"
        fill="#999"
        fontFamily="monospace"
        opacity="0.7"
      >
        {frequencyNote}
      </text>

      {/* Frequency value */}
      <text
        x={position.x}
        y={position.y + size + 32}
        textAnchor="middle"
        fontSize="8"
        fill="#666"
        fontFamily="monospace"
        opacity="0.6"
      >
        {frequencyValue.toFixed(1)} Hz
      </text>
    </g>
  );
};

export default PlanetNode;
