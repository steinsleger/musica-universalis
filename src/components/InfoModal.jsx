import React from 'react';

const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="info-modal-title"
    >
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button 
          className="modal-close" 
          onClick={onClose} 
          aria-label="Close information modal"
        >×</button>
        <div className="modal-body">
          <h1 id="info-modal-title">Musica Universalis</h1>
          <p>A web-based interactive visualization and sonification of planetary orbits using the modified Titius-Bode Law proposed by Walter Murch.</p>
          
          <h2>Overview</h2>
          <p>This application allows users to explore the relationship between planetary orbits and musical harmonies by transforming astronomical data into sound. It implements Walter Murch's modification of the Titius-Bode Law, which reveals fascinating connections between the mathematical ratios of orbital distances and musical intervals.</p>

          <div className="features-list">
            <p>The tool allows you to:</p>
            <ul>
              <li>Visualize planetary orbits in real-time with accurate elliptical paths</li>
              <li>Hear the corresponding musical tones for each planet</li>
              <li>Adjust the base frequency to explore different harmonic relationships</li>
              <li>Toggle planets on and off to hear specific combinations</li>
              <li>Experience the frequency shifts that occur as planets move through their orbits</li>
              <li>Play sequential harmonies with adjustable tempo and looping</li>
            </ul>
          </div>

          <h2>Features</h2>
          
          <h3>Visualization</h3>
          <ul>
            <li>Interactive Orbital Display with real-time animated view of planetary orbits</li>
            <li>Orbital Details with perihelion and aphelion markers with distance information</li>
            <li>Zoom and Pan to examine orbits in detail with intuitive controls</li>
            <li>Position Controls to set planets at average distance, perihelion, or aphelion</li>
            <li>Multiple Distance Modes to switch between Murch's Modified Titius-Bode Law and actual astronomical distances</li>
            <li>Customizable Animation Speed to observe slow or rapid motion</li>
          </ul>

          <h3>Audio</h3>
          <ul>
            <li>Live Sonification of planetary frequencies in real-time</li>
            <li>Real-time Frequency Modulation as planets move through elliptical orbits</li>
            <li>Sequence Playback with adjustable tempo</li>
            <li>Loop Controls for continuous listening</li>
            <li>Advanced Audio Safety with frequency-dependent volume scaling</li>
            <li>Fletcher-Munson Curves for balanced sound through human ear sensitivity modeling</li>
            <li>Musical Note Display showing corresponding notes for each frequency</li>
          </ul>

          <h3>Interface</h3>
          <ul>
            <li>Responsive Layout that works on various screen sizes</li>
            <li>Planet Management with color-coded toggles</li>
            <li>Detailed Information Panels showing frequencies, notes, and audio gain</li>
            <li>Touch-friendly Controls for mobile devices and tablets</li>
            <li>Visual Gain Indicators showing volume adjustments</li>
          </ul>

          <h2>Murch's Modified Titius-Bode Formula</h2>
          <p>This project utilizes Walter Murch's version of the Titius-Bode formula:</p>
          <code>r = 1 + 2^n × 3</code>
          <p>Where:</p>
          <ul>
            <li><code>r</code> is the distance from the Sun in units of β (the minimum stable orbit distance)</li>
            <li><code>n</code> is an integer that can be positive or negative, representing the orbital position</li>
            <li><code>β</code> is the reference unit, representing the theoretical minimum distance at which an object could maintain a stable orbit around the Sun</li>
          </ul>
          
          <p>The n-values used for the planets in our solar system are:</p>
          <ul>
            <li>Mercury: n = -10 (approaching the β limit)</li>
            <li>Venus: n = -2</li>
            <li>Earth: n = -1</li>
            <li>Mars: n = 0</li>
            <li>Ceres: n = 1</li>
            <li>Jupiter: n = 2</li>
            <li>Saturn: n = 3</li>
            <li>Uranus: n = 4</li>
            <li>Neptune: n = 5</li>
            <li>Pluto: n = 6</li>
          </ul>
          
          <p>For audio conversion, we map these orbital distances to frequencies using:</p>
          <code>frequency = baseFrequency × r</code>
          <p>Where <code>baseFrequency</code> is a user-adjustable reference frequency.</p>

          <p>Murch's insight was to establish β as the reference point (instead of Earth's distance as in the original formulation), which considerably simplifies the mathematical expression while maintaining the same ratio relationships between orbits.</p>

          <h2>How to Use</h2>

          <h3>Main Controls</h3>
          <ol>
            <li><strong>Orbit Visualization:</strong> The central display shows the planets orbiting the sun</li>
            <li><strong>Play/Pause Animation:</strong> Use the ▶️/⏸️ button to control the orbital animation</li>
            <li><strong>Live Mode:</strong> Toggle 🔊 to hear continuous sound for each planet</li>
            <li><strong>Position Settings:</strong> Use 🔄/🌞/☀️ buttons to position planets at average distance, aphelion, or perihelion</li>
          </ol>

          <h3>Advanced Controls (Gear Menu ⚙️)</h3>
          <h4>Controls Tab</h4>
          <ul>
            <li>Adjust master volume</li>
            <li>Change base frequency</li>
            <li>Switch between Murch's Modified Titius-Bode Law and actual distances</li>
            <li>Control zoom level</li>
            <li>Adjust animation speed</li>
          </ul>

          <h4>Planets Tab</h4>
          <ul>
            <li>Play sequential harmonic pattern</li>
            <li>Set tempo (BPM) for sequence playback</li>
            <li>Toggle loop mode for continuous playing</li>
            <li>Enable/disable individual planets</li>
            <li>View frequencies and musical notes for each planet</li>
            <li>See gain levels with visual indicators</li>
          </ul>

          <h4>Audio Tab</h4>
          <ul>
            <li>Toggle Fletcher-Munson equal-loudness curves</li>
            <li>Adjust reference frequency for volume scaling</li>
            <li>Modify scaling factor for frequency-based volume</li>
            <li>Learn about audio safety features</li>
          </ul>

          <h3>Interaction Tips</h3>
          <ul>
            <li><strong>Zoom:</strong> Use the slider or mouse wheel to zoom in/out</li>
            <li><strong>Pan:</strong> When zoomed in, click and drag to move the view</li>
            <li><strong>Planet Information:</strong> Hover over planets to see detailed information</li>
            <li><strong>Touch Support:</strong> All controls work with touch gestures on mobile devices</li>
          </ul>

          <h2>Technical Implementation</h2>
          <p>This application is built with:</p>
          <ul>
            <li>React for the UI components and state management</li>
            <li>Tone.js for high-quality audio synthesis and processing</li>
            <li>Mathematical models based on Kepler's laws of planetary motion</li>
            <li>SVG for smooth, scalable orbit visualization</li>
          </ul>

          <h3>Audio Safety Measures</h3>
          <p>The application implements sophisticated frequency-dependent volume scaling to protect users' hearing. Features include:</p>
          <ol>
            <li>Logarithmic Volume Scaling: Higher frequencies are automatically attenuated based on a logarithmic curve</li>
            <li>Fletcher-Munson Equal-Loudness Contours: Optional modeling of human hearing sensitivity across the frequency spectrum</li>
            <li>High-Frequency Protection: Additional volume reduction for potentially harmful high frequencies</li>
            <li>Smooth Transitions: Gradual volume changes to prevent clicks and pops</li>
            <li>Volume Limits: Minimum and maximum gain thresholds to ensure audibility without distortion</li>
          </ol>

          <h2>Visualization Details</h2>
          <p>The orbital visualization implements these features:</p>
          <ol>
            <li><strong>Elliptical Orbits:</strong> Planets follow elliptical paths based on their eccentricity</li>
            <li><strong>Orbital Markers:</strong> Visual indicators for perihelion (closest approach) and aphelion (furthest distance)</li>
            <li><strong>Distance Display:</strong> Real-time calculation and display of current distance in astronomical units (AU)</li>
            <li><strong>Relative Sizing:</strong> Planets are shown with relative sizing (not to astronomical scale)</li>
            <li><strong>Color Coding:</strong> Each planet has a distinctive color for easy identification</li>
          </ol>

          <h2>Academic Background</h2>
          <p>This project is based on Walter Murch's research on the Titius-Bode Law and its relationship to musical harmonies. Murch, an acclaimed film editor and sound designer, has extensively studied and refined this astronomical theory, showing how the mathematical ratios of planetary orbits correspond to musical intervals.</p>
          <p>His work suggests that there may be deeper underlying patterns in the structure of planetary systems that can be perceived through both visual and auditory means, revealing a fascinating connection between astronomy, mathematics, and music.</p>

          <div className="references">
            <h2>References</h2>
            <ul>
              <li>Murch, W. (2015). "New Evidence Confirms 18th Century Conjecture on Orbital Harmonies." Presentation at the New School at Commonweal.</li>
              <li>Weschler, L. (2017). "Waves Passing in the Night: Walter Murch in the Land of the Astrophysicists." Bloomsbury Publishing.</li>
              <li>Lineweaver, C. H., & Bovaird, T. (2015). "Using the Inclinations of Kepler Systems to Prioritize New Titius-Bode-based Exoplanet Predictions." Monthly Notices of the Royal Astronomical Society.</li>
            </ul>
          </div>

          <div className="credits">
            <p>Created by <a className="credits__link" href='https://www.linkedin.com/in/adriansteinsleger/' aria-label="Adrian Steinsleger's LinkedIn profile">Adrián Steinsleger</a><br />Got feedback? <a className="credits__link" href='mailto:astein@gmail.com' aria-label="Contact the creator via email">Contact me</a></p>
            <ul>
              <li>Concept based on Walter Murch's research on the Titius-Bode Law</li>
              <li>Planetary data from NASA</li>
              <li>Audio synthesis using Tone.js</li>
            </ul>
            <p className="license">License: CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
