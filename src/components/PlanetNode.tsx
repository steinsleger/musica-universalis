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
  glowOpacity: number;
  currentDistance: number;
  distanceMode: 'titiusBode' | 'actual';
  sunPosition: { x: number; y: number };
}

const PlanetNode: React.FC<PlanetNodeProps> = ({
  planet,
  position,
  size,
  planetColors,
  currentlyPlayingPlanet,
  frequencyNote,
  frequencyValue,
  glowOpacity,
  currentDistance,
  distanceMode,
  sunPosition
}) => {
  if (!planet.enabled || size === 0) return null;

  const isPlaying = planet.name === currentlyPlayingPlanet;
  const planetColor = planetColors[planet.name] || '#999';

  return (
    <g key={`planet-${planet.name}`}>
      {/* Add glow effect behind the planet when it's playing */}
      {isPlaying && (
        <>
          {/* Outer glow */}
          <circle
            cx={position.x}
            cy={position.y}
            r={size * 3}
            fill={planetColor}
            opacity={glowOpacity * 0.2}
            filter="blur(3px)"
            aria-hidden="true"
          />
          {/* Middle glow */}
          <circle
            cx={position.x}
            cy={position.y}
            r={size * 2}
            fill={planetColor}
            opacity={glowOpacity * 0.4}
            filter="blur(2px)"
            aria-hidden="true"
          />
          {/* Inner glow */}
          <circle
            cx={position.x}
            cy={position.y}
            r={size * 1.5}
            fill={planetColor}
            opacity={glowOpacity * 0.6}
            filter="blur(1px)"
            aria-hidden="true"
          />
        </>
      )}

      {/* Planet circle */}
      <circle
        cx={position.x}
        cy={position.y}
        r={size}
        fill={planetColor}
        stroke={isPlaying ? 'white' : 'none'}
        strokeWidth={isPlaying ? 0.5 : 0}
        role="img"
        aria-label={`${planet.name} at ${currentDistance.toFixed(2)} ${distanceMode === 'titiusBode' ? 'beta' : 'astronomical units'} from sun ${isPlaying ? ', currently playing' : ''}`}
      />

      {/* Planet name */}
      <text
        x={position.x}
        y={position.y - size - 2}
        fontSize="8"
        textAnchor="middle"
        fill="#ccc"
        aria-hidden="true"
      >
        {planet.name}
      </text>

      {/* Current distance */}
      <text
        x={position.x}
        y={position.y + size + 8}
        fontSize="6"
        textAnchor="middle"
        fill="#aaa"
        aria-hidden="true"
      >
        {currentDistance.toFixed(2)} {distanceMode === 'titiusBode' ? 'β' : 'AU'}
      </text>

      {/* Line from sun to planet */}
      <line
        x1={sunPosition.x}
        y1={sunPosition.y}
        x2={position.x}
        y2={position.y}
        stroke="#333"
        strokeWidth="0.3"
        strokeDasharray="1,2"
        aria-hidden="true"
      />
    </g>
  );
};

export default PlanetNode;
