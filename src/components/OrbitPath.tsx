import React from 'react';
import { Planet } from '../utils/types';

interface OrbitPathProps {
  planet: Planet;
  pathData: string;
  orbitColor: string;
  showExtremes: boolean;
  perihelionPos?: { x: number; y: number };
  aphelionPos?: { x: number; y: number };
}

const OrbitPath: React.FC<OrbitPathProps> = ({
  planet,
  pathData,
  orbitColor,
  showExtremes,
  perihelionPos,
  aphelionPos
}) => {
  if (!planet.enabled) return null;

  return (
    <g key={`orbit-${planet.name}`}>
      {/* Orbit path */}
      <path
        d={pathData}
        stroke={orbitColor}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />

      {/* Perihelion marker */}
      {showExtremes && perihelionPos && (
        <circle
          cx={perihelionPos.x}
          cy={perihelionPos.y}
          r="3"
          fill="none"
          stroke={orbitColor}
          strokeWidth="1"
          opacity="0.4"
        />
      )}

      {/* Aphelion marker */}
      {showExtremes && aphelionPos && (
        <circle
          cx={aphelionPos.x}
          cy={aphelionPos.y}
          r="3"
          fill="none"
          stroke={orbitColor}
          strokeWidth="1"
          opacity="0.4"
        />
      )}
    </g>
  );
};

export default OrbitPath;
