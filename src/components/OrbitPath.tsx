import React from 'react';
import { Planet } from '../utils/types';

interface OrbitPathProps {
  planet: Planet;
  pathData: string;
  orbitColor: string;
  showExtremes: boolean;
  perihelionPos?: { x: number; y: number };
  perihelionDist?: number;
  aphelionPos?: { x: number; y: number };
  aphelionDist?: number;
  zoomLevel: number;
  distanceMode: 'titiusBode' | 'actual';
  center: number;
  orbitScaleFactor: number;
  distance: number;
  panOffset: { x: number; y: number };
}

const OrbitPath: React.FC<OrbitPathProps> = ({
  planet,
  pathData,
  orbitColor,
  showExtremes,
  perihelionPos,
  perihelionDist,
  aphelionPos,
  aphelionDist,
  zoomLevel,
  distanceMode,
  center,
  orbitScaleFactor,
  distance,
  panOffset
}) => {
  return (
    <React.Fragment key={`orbit-${planet.name}`}>
      {/* Orbit path */}
      <path
        d={pathData}
        fill="none"
        stroke={orbitColor}
        strokeWidth={planet.name === 'Neptune' || planet.name === 'Pluto' ? 0.8 : 0.5}
        strokeDasharray={planet.enabled ? 'none' : '2,2'}
        aria-hidden="true"
      />

      {/* Orbit label - visible at higher zoom levels or for outer planets */}
      {(zoomLevel > 3 || (zoomLevel > 1.5 && (planet.name === 'Neptune' || planet.name === 'Pluto' || planet.name === 'Uranus'))) && (
        <text
          x={center + (distance * 0.7) * orbitScaleFactor + panOffset.x}
          y={center - (distance * 0.7) * orbitScaleFactor + panOffset.y}
          fontSize="7"
          fill={orbitColor}
          opacity={planet.enabled ? 1 : 0.5}
          textAnchor="middle"
          aria-hidden={!planet.enabled}
        >
          {planet.name} orbit
        </text>
      )}

      {/* Show perihelion and aphelion markers for eccentric orbits */}
      {planet.enabled && showExtremes && perihelionPos && aphelionPos && (
        <>
          {/* Perihelion marker */}
          <circle
            cx={perihelionPos.x}
            cy={perihelionPos.y}
            r={1.5}
            fill="#f44"
            aria-hidden="true"
          />
          {zoomLevel > 4 && perihelionDist && (
            <text
              x={perihelionPos.x}
              y={perihelionPos.y - 5}
              fontSize="6"
              textAnchor="middle"
              fill="#f88"
              aria-hidden="true"
            >
              {planet.name} perihelion
              ({perihelionDist.toFixed(2)} {distanceMode === 'titiusBode' ? 'β' : 'AU'})
            </text>
          )}

          {/* Aphelion marker */}
          <circle
            cx={aphelionPos.x}
            cy={aphelionPos.y}
            r={1.5}
            fill="#88f"
            aria-hidden="true"
          />
          {zoomLevel > 4 && aphelionDist && (
            <text
              x={aphelionPos.x}
              y={aphelionPos.y - 5}
              fontSize="6"
              textAnchor="middle"
              fill="#88f"
              aria-hidden="true"
            >
              {planet.name} aphelion
              ({aphelionDist.toFixed(2)} {distanceMode === 'titiusBode' ? 'β' : 'AU'})
            </text>
          )}
        </>
      )}
    </React.Fragment>
  );
};

export default OrbitPath;
