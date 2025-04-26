# Musica Universalis

A web-based interactive visualization and sonification of planetary orbits using the modified Titius-Bode Law proposed by Walter Murch.

![Musica Universalis](https://i.imgur.com/7khbPqt.png "Musica Universalis")

## Overview

This application allows users to explore the relationship between planetary orbits and musical harmonies by transforming astronomical data into sound. It implements Walter Murch's modification of the Titius-Bode Law, which reveals fascinating connections between the mathematical ratios of orbital distances and musical intervals.

The tool allows users to:
- Visualize planetary orbits in real-time with accurate elliptical paths
- Hear the corresponding musical tones for each planet
- Adjust the base frequency to explore different harmonic relationships
- Toggle planets on and off to hear specific combinations
- Experience the frequency shifts that occur as planets move through their orbits
- Play sequential harmonies with adjustable tempo and looping

## The Modified Titius-Bode Formula

This project utilizes Walter Murch's version of the Titius-Bode formula:

`f(n) = (1 + 2^n) × 3 × baseFrequency`

Where:
- `n` is an integer representing the orbital position (-2 for Venus, -1 for Earth, 0 for Mars, etc.)
- `baseFrequency` is a user-adjustable reference frequency

This formula demonstrates how orbital distances follow a mathematical pattern that, when converted to sound, creates harmonious musical relationships. Walter Murch's insight connects the mathematical logic of Johannes Kepler's "Music of the Spheres" with modern astronomical observations.

## Features

### Visualization
- **Interactive Orbital Display**: Real-time animated view of planetary orbits with accurate elliptical paths
- **Orbital Details**: Perihelion and aphelion markers with distance information
- **Zoom and Pan**: Examine orbits in detail with intuitive controls
- **Position Controls**: Position planets at average distance, perihelion, or aphelion
- **Multiple Distance Modes**: Switch between Titius-Bode Law and actual astronomical distances
- **Customizable Animation Speed**: Adjust the orbital velocity to observe slow or rapid motion

### Audio
- **Live Sonification**: Hear frequencies associated with each planet in real-time
- **Real-time Frequency Modulation**: Experience how frequencies change as planets move through elliptical orbits
- **Sequence Playback**: Play all enabled planets in sequence with adjustable tempo
- **Loop Controls**: Repeat sequences for continued listening
- **Advanced Audio Safety**: Frequency-dependent volume scaling to protect hearing and hardware
- **Fletcher-Munson Curves**: Optional human ear sensitivity modeling for more balanced sound
- **Musical Note Display**: See the corresponding musical notes for each frequency

### Interface
- **Responsive Layout**: Works on various screen sizes with intuitive controls
- **Planet Management**: Enable/disable individual planets with color-coded toggles
- **Detailed Information Panels**: View frequencies, notes, and audio gain for each planet
- **Touch-friendly Controls**: Works on mobile devices and tablets
- **Visual Gain Indicators**: See how volume is adjusted for each frequency

## How to Use

### Main Controls
1. **Orbit Visualization**: The central display shows the planets orbiting the sun
2. **Play/Pause Animation**: Use the ▶️/⏸️ button to control the orbital animation
3. **Live Mode**: Toggle 🔊 to hear continuous sound for each planet
4. **Position Settings**: Use 🔄/🌞/☀️ buttons to position planets at average distance, aphelion, or perihelion

### Advanced Controls (Gear Menu ⚙️)
- **Controls Tab**:
  - Adjust master volume
  - Change base frequency
  - Switch between Titius-Bode and actual distances
  - Control zoom level
  - Adjust animation speed

- **Planets Tab**:
  - Play sequential harmonic pattern
  - Set tempo (BPM) for sequence playback
  - Toggle loop mode for continuous playing
  - Enable/disable individual planets
  - View frequencies and musical notes for each planet
  - See gain levels with visual indicators

- **Audio Tab**:
  - Toggle Fletcher-Munson equal-loudness curves
  - Adjust reference frequency for volume scaling
  - Modify scaling factor for frequency-based volume
  - Learn about audio safety features

### Interaction
- **Zoom**: Use the slider or mouse wheel to zoom in/out
- **Pan**: When zoomed in, click and drag to move the view
- **Planet Information**: Hover over planets to see detailed information
- **Touch Support**: All controls work with touch gestures on mobile devices

## Technical Implementation

This application is built with:
- React for the UI components and state management
- Tone.js for high-quality audio synthesis and processing
- Mathematical models based on Kepler's laws of planetary motion
- SVG for smooth, scalable orbit visualization

### Audio Safety Measures

The application implements sophisticated frequency-dependent volume scaling to protect users' hearing. Features include:

1. **Logarithmic Volume Scaling**: Higher frequencies are automatically attenuated based on a logarithmic curve
2. **Fletcher-Munson Equal-Loudness Contours**: Optional modeling of human hearing sensitivity across the frequency spectrum
3. **High-Frequency Protection**: Additional volume reduction for potentially harmful high frequencies
4. **Smooth Transitions**: Gradual volume changes to prevent clicks and pops
5. **Volume Limits**: Minimum and maximum gain thresholds to ensure audibility without distortion

This comprehensive approach ensures a pleasant and safe listening experience across the entire frequency range, from the lowest notes of the outer planets to the highest tones of the inner solar system.

## Visualization Details

The orbital visualization implements these features:

1. **Elliptical Orbits**: Planets follow elliptical paths based on their eccentricity
2. **Orbital Markers**: Visual indicators for perihelion (closest approach) and aphelion (furthest distance)
3. **Distance Display**: Real-time calculation and display of current distance in astronomical units (AU)
4. **Relative Sizing**: Planets are shown with relative sizing (not to astronomical scale)
5. **Color Coding**: Each planet has a distinctive color for easy identification

## Academic Background

This project is based on Walter Murch's research on the Titius-Bode Law and its relationship to musical harmonies. Murch, an acclaimed film editor and sound designer, has extensively studied and refined this astronomical theory, showing how the mathematical ratios of planetary orbits correspond to musical intervals.

His work suggests that there may be deeper underlying patterns in the structure of planetary systems that can be perceived through both visual and auditory means, revealing a fascinating connection between astronomy, mathematics, and music.

## Development

### Prerequisites
- Node.js (v14.0.0 or higher)
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/musica-universalis.git

# Navigate to the project directory
cd musica-universalis

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## Credits

- Concept based on Walter Murch's research on the Titius-Bode Law
- Planetary data from NASA
- Audio synthesis using Tone.js
- Created by Adrián Steinsleger

## License

CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International)

## References

- Murch, W. (2015). "New Evidence Confirms 18th Century Conjecture on Orbital Harmonies." Presentation at the New School at Commonweal.
- Weschler, L. (2017). "Waves Passing in the Night: Walter Murch in the Land of the Astrophysicists." Bloomsbury Publishing.
- Lineweaver, C. H., & Bovaird, T. (2015). "Using the Inclinations of Kepler Systems to Prioritize New Titius-Bode-based Exoplanet Predictions." Monthly Notices of the Royal Astronomical Society.
