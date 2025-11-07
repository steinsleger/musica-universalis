/**
 * Configuration Index - Central export point for all configuration
 *
 * This file exports all application configuration in one place.
 * Configurations are organized by concern:
 * - Planet data and visual properties
 * - Audio synthesis and safety settings
 * - Visualization and UI settings
 */

export {
  MURCH_N_VALUES,
  PLANETARY_SIZES,
  PLANET_COLORS,
  PLANET_THEMES,
  SUN_CONFIG,
  PLANET_ORDER,
  type PlanetTheme
} from './planetConfig';

export {
  AUDIO_FREQUENCY_DEFAULTS,
  AUDIO_VOLUME_DEFAULTS,
  AUDIO_PLAYBACK_DEFAULTS,
  SYNTH_ENVELOPE,
  SYNTH_OSCILLATOR,
  REVERB_DEFAULTS,
  SEQUENCE_SYNTH_ENVELOPE,
  AUDIO_SAFETY_DEFAULTS,
  FLETCHER_MUNSON_DEFAULTS,
  ANIMATION_DEFAULTS,
  ALL_AUDIO_DEFAULTS
} from './audioDefaults';

export {
  SVG_CANVAS,
  ZOOM_DEFAULTS,
  PAN_DEFAULTS,
  ORBIT_DEFAULTS,
  ANIMATION_RENDER_DEFAULTS,
  DISTANCE_MODES,
  POSITION_PRESETS,
  UI_DEFAULTS,
  SIDEBAR_TABS,
  RESPONSIVE_BREAKPOINTS,
  ALL_VISUALIZATION_DEFAULTS
} from './visualizationDefaults';
