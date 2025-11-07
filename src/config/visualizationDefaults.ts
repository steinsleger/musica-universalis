/**
 * Visualization Configuration Defaults
 *
 * Centralized settings for SVG rendering, zooming, panning, and UI
 */

/**
 * SVG Canvas settings
 */
export const SVG_CANVAS = {
  size: 600,           // Canvas dimensions (600x600)
  center: 300,         // Center point
  minPlanetSize: 3,
  sunRadius: 10
} as const;

/**
 * Zoom settings
 */
export const ZOOM_DEFAULTS = {
  level: 20,           // Default zoom level
  minZoom: 1,          // Minimum zoom (1x)
  maxZoom: 40,         // Maximum zoom (40x)
  speed: 0.1,          // Zoom sensitivity
  step: 1.1            // Zoom multiplier per wheel increment
} as const;

/**
 * Pan/drag settings
 */
export const PAN_DEFAULTS = {
  enabled: true,
  minPan: 0,           // Will be calculated based on canvas
  maxPan: 600,
  speed: 1             // Pan sensitivity
} as const;

/**
 * Orbit path rendering settings
 */
export const ORBIT_DEFAULTS = {
  ellipsePoints: 100,        // Points used to draw orbit ellipse
  strokeWidth: 1,
  strokeColor: 'rgba(255,255,255,0.2)',
  scaleFactorMultiplier: 0.98  // Orbital scale calculation
} as const;

/**
 * Animation and update settings
 */
export const ANIMATION_RENDER_DEFAULTS = {
  targetFrameRate: 60,       // Target FPS
  minZoomScale: 0.25,        // Minimum scale factor
  glow: {
    enabled: true,
    intensity: 1,
    duration: 0.5             // Seconds
  }
} as const;

/**
 * Distance mode settings
 * Two ways to calculate planet distances
 */
export const DISTANCE_MODES = {
  titiusBode: {
    name: 'Titius-Bode Law',
    description: 'Modified Titius-Bode formula: distance = 1 + 2^n × 3'
  },
  actual: {
    name: 'Actual Distance',
    description: 'Real astronomical distances from NASA data'
  }
} as const;

/**
 * Position presets for visualization
 */
export const POSITION_PRESETS = {
  normal: {
    name: 'Dynamic',
    description: 'Planets move in real-time'
  },
  average: {
    name: 'Average Distance',
    description: 'All planets at average orbital distance'
  },
  aphelion: {
    name: 'Aphelion',
    description: 'All planets at farthest point'
  },
  perihelion: {
    name: 'Perihelion',
    description: 'All planets at closest point'
  }
} as const;

/**
 * UI state defaults
 */
export const UI_DEFAULTS = {
  sidebarCollapsed: false,
  activeTab: 'controls' as const,
  modals: {
    infoOpen: false,
    instructionsOpen: false
  }
} as const;

/**
 * Sidebar tab configuration
 */
export const SIDEBAR_TABS = {
  controls: {
    id: 'controls',
    label: 'Visualization',
    description: 'Orbit animation and visualization settings'
  },
  planets: {
    id: 'planets',
    label: 'Planets',
    description: 'Toggle planets on/off'
  },
  audio: {
    id: 'audio',
    label: 'Audio',
    description: 'Audio and synthesis settings'
  }
} as const;

/**
 * Responsive breakpoints for mobile/tablet support
 */
export const RESPONSIVE_BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440
} as const;

/**
 * All visualization defaults combined
 */
export const ALL_VISUALIZATION_DEFAULTS = {
  svg: SVG_CANVAS,
  zoom: ZOOM_DEFAULTS,
  pan: PAN_DEFAULTS,
  orbit: ORBIT_DEFAULTS,
  animation: ANIMATION_RENDER_DEFAULTS,
  distanceModes: DISTANCE_MODES,
  positionPresets: POSITION_PRESETS,
  ui: UI_DEFAULTS,
  tabs: SIDEBAR_TABS,
  responsive: RESPONSIVE_BREAKPOINTS
} as const;
