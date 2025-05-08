import React from 'react';

const InstructionsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-modal-title"
    >
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button 
          className="modal-close" 
          onClick={onClose}
          aria-label="Close help instructions"
        >×</button>
        <div className="modal-body">
          <h1 id="instructions-modal-title">Help</h1>
          
          <h2>Getting Started</h2>
          <p>Welcome to Musica Universalis. Here's how to get started exploring the musical harmonies of our solar system:</p>
          
          <h3>Basic Controls</h3>
          <ol>
            <li><strong>Play/Pause:</strong> Start or stop the orbital animation using the ▶️/⏸️ button</li>
            <li><strong>Play Sequence:</strong> Start sequential planet sounds using the central 🪐 button</li>
            <li><strong>Live Audio:</strong> Enable 🔊 to hear continuous sound changes as planets orbit</li>
            <li><strong>Position Controls:</strong> Use 🔄 (average), 🌞 (aphelion), or ☀️ (perihelion) to reposition planets</li>
          </ol>
          
          <h3>Navigation</h3>
          <ul>
            <li><strong>Zoom:</strong> Use mouse scroll wheel to zoom in and out of the visualization</li>
            <li><strong>Pan:</strong> Click and drag to move around the view when zoomed in</li>
          </ul>
          
          <h3>Settings (⚙️)</h3>
          <p>Click the ⚙️ button to access detailed controls:</p>
          <ul>
            <li><strong>Controls Tab:</strong> Adjust master volume, base frequency, distance mode, zoom, and animation speed</li>
            <li><strong>Planets Tab:</strong> Play sequential patterns, adjust tempo, enable/disable planets</li>
            <li><strong>Audio Tab:</strong> Configure advanced audio settings</li>
          </ul>
          
          <h3>Quick Tips</h3>
          <ul>
            <li>Enable Live Mode to hear orbital frequencies change in real time</li>
            <li>Try different base frequencies to explore harmonies</li>
            <li>Use the sequence player to hear each planet's tone in order</li>
            <li>Toggle planets on/off to hear specific combinations</li>
            <li>Adjust zoom to view more or less of the solar system</li>
          </ul>
          
          <h3>Understanding the Display</h3>
          <ul>
            <li>Colored rings show orbital paths</li>
            <li>Planets move along their orbits with accurate elliptical paths</li>
            <li>The sun appears at the center of the display</li>
            <li>Orbital markers show perihelion (closest) and aphelion (furthest) points</li>
          </ul>
          
          <h2>For More Information</h2>
          <p>Visit the ℹ️ section to learn about the mathematical and musical theory behind this visualization.</p>
        </div>
      </div>
    </div>
  );
};

export default InstructionsModal; 