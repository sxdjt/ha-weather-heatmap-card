/* Last modified: 19-Mar-2026 20:38 */
// Card CSS styles

/**
 * Create and return a <style> element with all card CSS rules.
 * @returns {HTMLStyleElement} - Style element with card CSS
 */
function createStyleElement() {
  const style = document.createElement('style');
  style.textContent = `
    /* Main container */
    ha-card {
      display: block;
      padding: 0;
      overflow: hidden;
    }

    /* Card header with title and navigation */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--divider-color);
      flex-wrap: wrap;
      gap: 8px;
    }

    .title {
      font-size: 20px;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    /* Navigation controls */
    .nav-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-btn {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      border: none;
      border-radius: 4px;
      width: 32px;
      height: 32px;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease;
    }

    .nav-btn:hover:not(:disabled) {
      opacity: 0.8;
    }

    .nav-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .nav-btn:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .nav-btn-current {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .nav-btn-current:hover {
      opacity: 0.8;
    }

    .nav-btn-current:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .nav-btn-current.hidden {
      visibility: hidden;
      pointer-events: none;
    }

    .date-range {
      font-size: 14px;
      color: var(--secondary-text-color);
      min-width: 120px;
      text-align: center;
    }

    /* Heatmap grid container */
    .heatmap-grid {
      padding: 16px;
    }

    .month-header {
      text-align: center;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color);
      margin-bottom: 12px;
    }

    /* Grid wrapper with time labels and data grid */
    .grid-wrapper {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
      align-items: start;
    }

    /* Time labels column */
    .time-labels {
      display: flex;
      flex-direction: column;
      gap: var(--cell-gap, 2px);
      padding-top: 28px;  /* Align with data grid (after date headers) */
    }

    .time-label {
      height: var(--cell-height, 36px);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      font-size: var(--cell-font-size, 11px);
      color: var(--secondary-text-color);
      font-weight: 500;
    }

    /* Data grid container */
    .data-grid-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* Date headers row */
    .date-headers {
      display: grid;
      grid-template-columns: repeat(var(--days-count, 7), 1fr);
      gap: 2px;
      margin-bottom: 4px;
    }

    .date-header {
      text-align: center;
      font-weight: bold;
      font-size: 12px;
      color: var(--primary-text-color);
      padding: 4px;
    }

    /* Data cells grid */
    .data-grid {
      display: grid;
      grid-template-columns: repeat(var(--days-count, 7), var(--cell-width, 1fr));
      grid-auto-rows: var(--cell-height, 36px);
      gap: var(--cell-gap, 2px);
    }

    /* Individual cells */
    .cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: var(--cell-border-radius, 4px);
      cursor: pointer;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
      position: relative;
      font-size: var(--cell-font-size, 11px);
      padding: var(--cell-padding, 2px);
      box-sizing: border-box;
    }

    /* Only apply hover effects on devices with a true hover-capable pointer.
       On touch devices, :hover is sticky after tap and can cause the cell to
       render on top of the more-info popup due to the transform stacking context. */
    @media (hover: hover) {
      .cell:hover:not(.no-data) {
        transform: scale(1.08);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 10;
      }

      .cell.no-data:hover {
        transform: none;
        box-shadow: none;
      }
    }

    .cell:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .cell.no-data {
      background-color: var(--disabled-color, #f0f0f0);
      cursor: default;
      opacity: 0.4;
    }

    .cell.partial {
      border: 2px dashed currentColor;
      opacity: 0.9;
    }

    /* Gap-filled cell: estimated value from last known reading (temperature mode) */
    .cell.filled {
      opacity: 0.6;
      border: 1px dashed currentColor;
    }

    /* Primary value text (temperature or wind speed) */
    .value {
      font-weight: bold;
      line-height: 1.1;
    }

    /* Wind direction overlay (rendered below speed value) */
    .direction {
      font-size: 0.9em;
      line-height: 1.1;
      opacity: 0.85;
    }

    /* Footer with statistics */
    .footer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--divider-color);
      background: var(--card-background-color);
      font-size: 13px;
      color: var(--secondary-text-color);
    }

    .footer-stats {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }

    .footer-stats span {
      font-weight: 500;
    }

    .entity-name {
      text-align: center;
      font-size: 11px;
      color: var(--secondary-text-color);
      opacity: 0.8;
    }

    /* Loading state - subtle opacity pulse on existing content, no layout shift */
    .is-loading {
      animation: loading-pulse 1.2s ease-in-out infinite;
    }

    @keyframes loading-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.55; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Error message */
    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      margin: 16px;
      background: rgba(244, 67, 54, 0.1);
      color: var(--error-color, #f44336);
      border-radius: 4px;
      border-left: 4px solid var(--error-color, #f44336);
    }

    .error-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .error-text {
      flex: 1;
    }

    .error-details {
      font-size: 11px;
      margin-top: 4px;
      opacity: 0.8;
    }

    /* Tooltip */
    .tooltip {
      position: absolute;
      z-index: 1000;
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      padding: 8px 12px;
      font-size: 12px;
      pointer-events: none;
      max-width: 250px;
      line-height: 1.4;
    }

    .tooltip div {
      margin: 2px 0;
    }

    .tooltip strong {
      color: var(--primary-text-color);
    }

    /* Legend bar */
    .legend {
      padding: 8px 16px 12px;
      border-top: 1px solid var(--divider-color);
    }

    .legend-bar {
      height: 12px;
      border-radius: 3px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .legend-labels {
      position: relative;
      height: 14px;
      margin-top: 4px;
      font-size: 9px;
      color: var(--secondary-text-color);
    }

    .legend-labels span {
      white-space: nowrap;
    }

    /* Compact header: reduces padding, title size, and nav arrow size */
    .compact-header .card-header {
      padding: 4px 8px;
      gap: 4px;
    }

    .compact-header .title {
      font-size: 14px;
    }

    .compact-header .nav-btn {
      width: 20px;
      height: 20px;
      font-size: 12px;
    }

    .compact-header .nav-btn-current {
      padding: 2px 6px;
      font-size: 11px;
    }

    .compact-header .month-header {
      font-size: 13px;
      margin-bottom: 4px;
      padding: 2px 0;
    }

    .compact-header .footer {
      padding: 6px 8px;
      gap: 4px;
      font-size: 11px;
    }

    /* Responsive adjustments */
    @media (max-width: 600px) {
      .data-grid {
        grid-auto-rows: calc(var(--cell-height, 36px) * 0.83);
      }

      .time-label {
        height: calc(var(--cell-height, 36px) * 0.83);
        font-size: calc(var(--cell-font-size, 11px) * 0.91);
      }

      .cell {
        font-size: calc(var(--cell-font-size, 11px) * 0.91);
      }

      .date-header {
        font-size: 11px;
      }
    }

    @media (max-width: 400px) {
      .card-header {
        flex-direction: column;
        align-items: stretch;
      }

      .nav-controls {
        justify-content: center;
      }
    }

    /* Accessibility: High contrast mode support */
    @media (prefers-contrast: high) {
      .cell:not(.no-data) {
        border: 1px solid currentColor;
      }
    }

    /* Accessibility: Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .cell,
      .nav-btn,
      .loading-spinner {
        transition: none;
        animation: none;
      }
    }
  `;
  return style;
}

// Color threshold constants for temperature and wind speed

// --- Temperature thresholds (Fahrenheit) ---
const DEFAULT_THRESHOLDS_F = [
  { value: 0,  color: '#1a237e' },  // 0F: Deep freeze (dark blue)
  { value: 32, color: '#42a5f5' },  // 32F: Freezing (light blue)
  { value: 40, color: '#80deea' },  // 40F: Cold (cyan)
  { value: 50, color: '#66bb6a' },  // 50F: Cool/comfortable start (green)
  { value: 60, color: '#4caf50' },  // 60F: Comfortable (medium green)
  { value: 70, color: '#81c784' },  // 70F: Comfortable (light green)
  { value: 75, color: '#ffeb3b' },  // 75F: Getting warm (yellow)
  { value: 80, color: '#ff9800' },  // 80F: Warm (orange)
  { value: 85, color: '#f44336' }   // 85F: Hot (red)
];

// --- Temperature thresholds (Celsius) ---
const DEFAULT_THRESHOLDS_C = [
  { value: -18, color: '#1a237e' },  // -18C: Deep freeze (dark blue)
  { value: 0,   color: '#42a5f5' },  // 0C: Freezing (light blue)
  { value: 4,   color: '#80deea' },  // 4C: Cold (cyan)
  { value: 10,  color: '#66bb6a' },  // 10C: Cool/comfortable start (green)
  { value: 16,  color: '#4caf50' },  // 16C: Comfortable (medium green)
  { value: 21,  color: '#81c784' },  // 21C: Comfortable (light green)
  { value: 24,  color: '#ffeb3b' },  // 24C: Getting warm (yellow)
  { value: 27,  color: '#ff9800' },  // 27C: Warm (orange)
  { value: 29,  color: '#f44336' }   // 29C: Hot (red)
];

// --- Wind speed thresholds based on Beaufort scale ---

const DEFAULT_THRESHOLDS_MPH = [
  { value: 0,  color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm
  { value: 1,  color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air
  { value: 4,  color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze
  { value: 8,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze
  { value: 13, color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze
  { value: 19, color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze
  { value: 25, color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze
  { value: 32, color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale
  { value: 39, color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale
  { value: 47, color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale
  { value: 55, color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm
  { value: 64, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm
  { value: 73, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force
];

const DEFAULT_THRESHOLDS_MS = [
  { value: 0,    color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm
  { value: 0.3,  color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air
  { value: 1.6,  color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze
  { value: 3.4,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze
  { value: 5.5,  color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze
  { value: 8.0,  color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze
  { value: 10.8, color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze
  { value: 13.9, color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale
  { value: 17.2, color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale
  { value: 20.8, color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale
  { value: 24.5, color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm
  { value: 28.5, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm
  { value: 32.7, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force
];

const DEFAULT_THRESHOLDS_KMH = [
  { value: 0,   color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm
  { value: 1,   color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air
  { value: 6,   color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze
  { value: 12,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze
  { value: 20,  color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze
  { value: 29,  color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze
  { value: 39,  color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze
  { value: 50,  color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale
  { value: 62,  color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale
  { value: 75,  color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale
  { value: 89,  color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm
  { value: 103, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm
  { value: 118, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force
];

const DEFAULT_THRESHOLDS_KTS = [
  { value: 0,  color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm
  { value: 1,  color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air
  { value: 4,  color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze
  { value: 7,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze
  { value: 11, color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze
  { value: 17, color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze
  { value: 22, color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze
  { value: 28, color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale
  { value: 34, color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale
  { value: 41, color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale
  { value: 48, color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm
  { value: 56, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm
  { value: 64, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force
];

/**
 * Get appropriate default temperature thresholds based on unit.
 * @param {string} unit - Unit of measurement (F, C, etc.)
 * @returns {Array} - Array of threshold objects
 */
function getTemperatureThresholdsForUnit(unit) {
  if (!unit) return DEFAULT_THRESHOLDS_F;
  const u = unit.toLowerCase().trim();
  if (u.includes('c') || u === '°c' || u === 'celsius') {
    return DEFAULT_THRESHOLDS_C;
  }
  return DEFAULT_THRESHOLDS_F;
}

/**
 * Get appropriate default wind speed thresholds based on unit.
 * @param {string} unit - Unit of measurement (mph, m/s, km/h, kn, etc.)
 * @returns {Array} - Array of threshold objects
 */
function getWindThresholdsForUnit(unit) {
  if (!unit) return DEFAULT_THRESHOLDS_MPH;
  const u = unit.toLowerCase().trim();
  if (u === 'm/s' || u === 'mps') return DEFAULT_THRESHOLDS_MS;
  if (u === 'km/h' || u === 'kph' || u === 'kmh') return DEFAULT_THRESHOLDS_KMH;
  if (u === 'kn' || u === 'kt' || u === 'kts' || u === 'knot' || u === 'knots') return DEFAULT_THRESHOLDS_KTS;
  return DEFAULT_THRESHOLDS_MPH;
}

// Card version
const VERSION = '1.0.2';

// Color parsing, interpolation, and utility functions

/**
 * Parse color string to RGB object.
 * Supports rgba(), rgb(), and hex formats.
 * @param {string} color - Color string
 * @returns {Object|null} - RGB object {r, g, b} or null if parsing fails
 */
function parseColor(color) {
  // Handle rgba() format
  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
      };
    }
  }
  // Handle rgb() format
  if (color.startsWith('rgb(')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
      };
    }
  }
  // Handle hex format
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16)
    };
  }
  return null;
}

/**
 * Linear RGB interpolation.
 * @param {Object} rgb1 - Start RGB color
 * @param {Object} rgb2 - End RGB color
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} - Interpolated color as rgb() string
 */
function interpolateRGB(rgb1, rgb2, t) {
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Gamma-corrected RGB interpolation.
 * @param {Object} rgb1 - Start RGB color
 * @param {Object} rgb2 - End RGB color
 * @param {number} t - Interpolation factor (0-1)
 * @param {number} gamma - Gamma value (default 2.2)
 * @returns {string} - Interpolated color as rgb() string
 */
function interpolateGamma(rgb1, rgb2, t, gamma = 2.2) {
  const r = Math.pow(Math.pow(rgb1.r / 255, gamma) * (1 - t) + Math.pow(rgb2.r / 255, gamma) * t, 1 / gamma) * 255;
  const g = Math.pow(Math.pow(rgb1.g / 255, gamma) * (1 - t) + Math.pow(rgb2.g / 255, gamma) * t, 1 / gamma) * 255;
  const b = Math.pow(Math.pow(rgb1.b / 255, gamma) * (1 - t) + Math.pow(rgb2.b / 255, gamma) * t, 1 / gamma) * 255;
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * Convert RGB to HSL color space.
 * @param {Object} rgb - RGB color object
 * @returns {Object} - HSL color object {h, s, l}
 */
function rgbToHsl(rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
    case g: h = ((b - r) / d + 2) * 60; break;
    case b: h = ((r - g) / d + 4) * 60; break;
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB color space.
 * @param {Object} hsl - HSL color object {h, s, l}
 * @returns {Object} - RGB color object {r, g, b}
 */
function hslToRgb(hsl) {
  const { h, s, l } = hsl;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255
  };
}

/**
 * HSL interpolation (takes shortest path around hue wheel).
 * @param {Object} rgb1 - Start RGB color
 * @param {Object} rgb2 - End RGB color
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} - Interpolated color as rgb() string
 */
function interpolateHSL(rgb1, rgb2, t) {
  const hsl1 = rgbToHsl(rgb1);
  const hsl2 = rgbToHsl(rgb2);

  // Handle hue interpolation (shortest path)
  let h;
  const hueDiff = hsl2.h - hsl1.h;
  if (Math.abs(hueDiff) > 180) {
    if (hueDiff > 0) {
      h = hsl1.h + (hueDiff - 360) * t;
    } else {
      h = hsl1.h + (hueDiff + 360) * t;
    }
  } else {
    h = hsl1.h + hueDiff * t;
  }
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;

  const s = hsl1.s + (hsl2.s - hsl1.s) * t;
  const l = hsl1.l + (hsl2.l - hsl1.l) * t;

  const rgb = hslToRgb({ h, s, l });
  return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
}

/**
 * Convert RGB to LAB color space.
 * @param {Object} rgb - RGB color object
 * @returns {Object} - LAB color object {L, a, b}
 */
function rgbToLab(rgb) {
  // RGB to XYZ
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750);
  const z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;

  // XYZ to LAB
  const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

  return {
    L: (116 * fy) - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

/**
 * Convert LAB to RGB color space.
 * @param {Object} lab - LAB color object {L, a, b}
 * @returns {Object} - RGB color object {r, g, b}
 */
function labToRgb(lab) {
  // LAB to XYZ
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const x = (Math.pow(fx, 3) > 0.008856 ? Math.pow(fx, 3) : (fx - 16 / 116) / 7.787) * 0.95047;
  const y = Math.pow(fy, 3) > 0.008856 ? Math.pow(fy, 3) : (fy - 16 / 116) / 7.787;
  const z = (Math.pow(fz, 3) > 0.008856 ? Math.pow(fz, 3) : (fz - 16 / 116) / 7.787) * 1.08883;

  // XYZ to RGB
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.969266 + y * 1.8760108 + z * 0.0415560;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return {
    r: Math.max(0, Math.min(255, r * 255)),
    g: Math.max(0, Math.min(255, g * 255)),
    b: Math.max(0, Math.min(255, b * 255))
  };
}

/**
 * LAB interpolation (perceptually uniform).
 * @param {Object} rgb1 - Start RGB color
 * @param {Object} rgb2 - End RGB color
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} - Interpolated color as rgb() string
 */
function interpolateLAB(rgb1, rgb2, t) {
  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);

  const L = lab1.L + (lab2.L - lab1.L) * t;
  const a = lab1.a + (lab2.a - lab1.a) * t;
  const b = lab1.b + (lab2.b - lab1.b) * t;

  const rgb = labToRgb({ L, a, b });
  return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
}

/**
 * Interpolate between two colors using the specified method.
 * @param {string} color1 - Start color string
 * @param {string} color2 - End color string
 * @param {number} t - Interpolation factor (0-1)
 * @param {string} method - Interpolation method ('rgb', 'gamma', 'hsl', 'lab')
 * @returns {string} - Interpolated color as rgb() string
 */
function interpolateColor(color1, color2, t, method = 'hsl') {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) return color1;

  switch (method) {
    case 'rgb':   return interpolateRGB(rgb1, rgb2, t);
    case 'gamma': return interpolateGamma(rgb1, rgb2, t);
    case 'hsl':   return interpolateHSL(rgb1, rgb2, t);
    case 'lab':   return interpolateLAB(rgb1, rgb2, t);
    default:      return interpolateHSL(rgb1, rgb2, t);
  }
}

/**
 * Get contrasting text color (black or white) for a background color.
 * Uses luminance calculation to determine optimal contrast.
 * @param {string} backgroundColor - Background color string
 * @returns {string} - '#000000' for light backgrounds, '#ffffff' for dark
 */
function getContrastTextColor(backgroundColor) {
  if (backgroundColor.startsWith('var(')) {
    return 'var(--primary-text-color)';
  }

  // Handle rgba() / rgb() format
  const rgbMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Handle hex format
  const hex = backgroundColor.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  return 'var(--primary-text-color)';
}

/**
 * Get color for a sensor value based on thresholds.
 * Works for both temperature and wind speed (same threshold logic).
 * @param {number} value - Sensor value
 * @param {Array} thresholds - Array of threshold objects {value, color}
 * @param {boolean} interpolate - Whether to interpolate between thresholds
 * @param {string} interpolationMethod - Interpolation method if enabled
 * @returns {string} - Color string for the value
 */
function getColorForValue(value, thresholds, interpolate = false, interpolationMethod = 'hsl') {
  if (value === null || value === undefined) {
    return 'var(--disabled-color, #f0f0f0)';
  }

  if (!interpolate) {
    // Threshold-based: use highest threshold that the value meets or exceeds
    let color = thresholds[0].color;
    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i].value) {
        color = thresholds[i].color;
      } else {
        break;
      }
    }
    return color;
  }

  // Interpolation mode: find the two thresholds to blend between
  if (value <= thresholds[0].value) return thresholds[0].color;
  if (value >= thresholds[thresholds.length - 1].value) return thresholds[thresholds.length - 1].color;

  for (let i = 0; i < thresholds.length - 1; i++) {
    if (value >= thresholds[i].value && value < thresholds[i + 1].value) {
      const t = (value - thresholds[i].value) / (thresholds[i + 1].value - thresholds[i].value);
      return interpolateColor(thresholds[i].color, thresholds[i + 1].color, t, interpolationMethod);
    }
  }

  return thresholds[thresholds.length - 1].color;
}

/**
 * Convert rgba() color to hex format (for color picker compatibility).
 * @param {string} color - Color string (rgba, rgb, or hex)
 * @returns {string} - Hex color string
 */
function rgbaToHex(color) {
  if (color.startsWith('#')) return color;
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#ffffff';
}

// Formatting and utility functions

/**
 * Escape HTML to prevent XSS via textContent/innerHTML conversion.
 * @param {string} text - Text to escape
 * @returns {string} - HTML-escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format hour as "12a", "3p", etc. (12-hour) or "00", "15", etc. (24-hour).
 * @param {number} hour - Hour (0-23)
 * @param {string} format - Time format ('12' or '24')
 * @returns {string} - Formatted hour string
 */
function formatHourLabel(hour, format = '24') {
  if (format === '24') {
    return String(hour).padStart(2, '0');
  }
  // 12-hour format
  const h = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  const suffix = hour < 12 ? 'a' : 'p';
  return `${h}${suffix}`;
}

/**
 * Convert degrees to arrow character.
 * Arrow points in the direction wind is blowing TO (not FROM).
 * @param {number} degrees - Wind direction in degrees (0-360)
 * @returns {string} - Arrow character
 */
function degreesToArrow(degrees) {
  const arrows = ['\u2191', '\u2197', '\u2192', '\u2198', '\u2193', '\u2199', '\u2190', '\u2196'];
  // Add 180 degrees to point arrow where wind is blowing TO (not FROM)
  const adjustedDegrees = (degrees + 180) % 360;
  const index = Math.round(adjustedDegrees / 45) % 8;
  return arrows[index];
}

/**
 * Convert degrees to cardinal direction.
 * @param {number} degrees - Wind direction in degrees (0-360)
 * @returns {string} - Cardinal direction (N, NE, E, SE, S, SW, W, NW)
 */
function degreesToCardinal(degrees) {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(Number(degrees) / 45) % 8;
  return cardinals[index];
}

/**
 * Format wind direction for display.
 * @param {number|null} degrees - Wind direction in degrees (0-360), or null
 * @param {string} format - Display format ('arrow', 'cardinal', 'degrees')
 * @returns {string} - Formatted direction string
 */
function formatDirection(degrees, format) {
  if (degrees === null || degrees === undefined) return '';

  switch (format) {
    case 'arrow':    return degreesToArrow(degrees);
    case 'cardinal': return degreesToCardinal(degrees);
    case 'degrees':  return `${Math.round(degrees)}deg`;
    default:         return '';
  }
}

/**
 * Normalize size values: numbers -> "Npx", strings -> pass through.
 * @param {number|string} value - Size value
 * @param {string} defaultValue - Default value if input is empty
 * @returns {string} - Normalized size string
 */
function normalizeSize(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return String(value);
}

/**
 * Get date key in format YYYY-MM-DD using LOCAL timezone.
 * @param {Date} date - Date object
 * @returns {string} - Date key string
 */
function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Bucket hour into interval (e.g., hour 7 with 2-hour interval -> 6).
 * @param {number} hour - Hour (0-23)
 * @param {number} intervalHours - Interval in hours
 * @returns {number} - Bucketed hour
 */
function getHourBucket(hour, intervalHours) {
  return Math.floor(hour / intervalHours) * intervalHours;
}

/**
 * Calculate circular mean for wind direction angles.
 * Uses vector averaging to correctly handle the 0/360 degree wrap-around.
 * @param {Array<number>} directions - Array of direction values in degrees
 * @returns {number|null} - Average direction in degrees (0-360) or null if empty
 */
function averageDirection(directions) {
  if (directions.length === 0) return null;

  let sumSin = 0;
  let sumCos = 0;

  directions.forEach(deg => {
    const rad = (deg * Math.PI) / 180;
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  });

  const avgRad = Math.atan2(sumSin / directions.length, sumCos / directions.length);
  let avgDeg = (avgRad * 180) / Math.PI;

  // Normalize to 0-360 range
  if (avgDeg < 0) avgDeg += 360;

  return Math.round(avgDeg);
}

// Weather Heatmap Card - merged temperature and wind speed heatmap card


/**
 * Sensor Heatmap Card - displays temperature or wind speed history as a color-coded heatmap.
 * Supports card_type: 'temperature' (default) or 'windspeed'.
 * Also registered as 'ha-temperature-heatmap-card' and 'windspeed-heatmap-card'
 * for backward compatibility with existing configurations.
 */
class SensorHeatmapCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Configuration and state
    this._config = {};
    this._hass = null;

    // Data caching
    this._historyData = null;
    this._processedData = null;
    this._lastFetch = 0;

    // Navigation state (0=current view, -7=one week back, etc.)
    this._viewOffset = 0;

    // UI state
    this._isLoading = false;
    this._error = null;
    this._interval = null;

    // Initialize Shadow DOM
    this.shadowRoot.appendChild(createStyleElement());
    this._content = document.createElement('ha-card');
    this.shadowRoot.appendChild(this._content);

    // Event delegation for all clicks
    this._content.addEventListener('click', this._handleClick.bind(this));

    // Response cache: url -> { data, expiry }
    this._responseCache = new Map();
  }

  // Home Assistant required method: set card configuration
  setConfig(config) {
    if (!config.entity) {
      throw new Error("'entity' is required");
    }

    // Auto-detect card_type from element tag name when not specified.
    // This provides backward compat for existing windspeed-heatmap-card configs.
    let card_type = config.card_type;
    if (!card_type) {
      const tag = this.tagName.toLowerCase();
      card_type = tag === 'windspeed-heatmap-card' ? 'windspeed' : 'temperature';
    }

    if (!['temperature', 'windspeed'].includes(card_type)) {
      throw new Error("card_type must be 'temperature' or 'windspeed'");
    }

    // Validate time_interval
    const validIntervals = [1, 2, 3, 4, 6, 8, 12, 24];
    if (config.time_interval && !validIntervals.includes(config.time_interval)) {
      throw new Error(`time_interval must be one of: ${validIntervals.join(', ')}`);
    }

    if (config.days && (config.days < 1 || config.days > 365)) {
      throw new Error('days must be between 1 and 365');
    }

    const validInterpolations = ['rgb', 'gamma', 'hsl', 'lab'];
    if (config.color_interpolation && !validInterpolations.includes(config.color_interpolation)) {
      throw new Error(`color_interpolation must be one of: ${validInterpolations.join(', ')}`);
    }

    const validDataSources = ['auto', 'history', 'statistics'];
    if (config.data_source && !validDataSources.includes(config.data_source)) {
      throw new Error(`data_source must be one of: ${validDataSources.join(', ')}`);
    }

    // Temperature-only validations
    if (card_type === 'temperature') {
      const validAggregations = ['average', 'min', 'max'];
      if (config.aggregation_mode && !validAggregations.includes(config.aggregation_mode)) {
        throw new Error(`aggregation_mode must be one of: ${validAggregations.join(', ')}`);
      }
      if (config.decimals !== undefined && (config.decimals < 0 || config.decimals > 2)) {
        throw new Error('decimals must be between 0 and 2');
      }
      if (config.start_hour !== undefined && (!Number.isInteger(config.start_hour) || config.start_hour < 0 || config.start_hour > 23)) {
        throw new Error('start_hour must be an integer between 0 and 23');
      }
      if (config.end_hour !== undefined && (!Number.isInteger(config.end_hour) || config.end_hour < 0 || config.end_hour > 23)) {
        throw new Error('end_hour must be an integer between 0 and 23');
      }
      const validStatTypes = ['mean', 'min', 'max'];
      if (config.statistic_type && !validStatTypes.includes(config.statistic_type)) {
        throw new Error(`statistic_type must be one of: ${validStatTypes.join(', ')}`);
      }
    }

    // Wind-only validations
    if (card_type === 'windspeed') {
      const validStatTypes = ['max', 'mean', 'min'];
      if (config.statistic_type && !validStatTypes.includes(config.statistic_type)) {
        throw new Error(`statistic_type must be one of: ${validStatTypes.join(', ')}`);
      }
    }

    const validFillGapsStyles = ['dimmed', 'none'];
    if (config.fill_gaps_style && !validFillGapsStyles.includes(config.fill_gaps_style)) {
      throw new Error(`fill_gaps_style must be one of: ${validFillGapsStyles.join(', ')}`);
    }

    // Validate cell sizing
    if (config.cell_height !== undefined) {
      const h = typeof config.cell_height === 'number' ? config.cell_height : parseFloat(config.cell_height);
      if (isNaN(h) || h < 10 || h > 200) throw new Error('cell_height must be between 10 and 200 pixels');
    }
    if (config.cell_padding !== undefined) {
      const p = typeof config.cell_padding === 'number' ? config.cell_padding : parseFloat(config.cell_padding);
      if (isNaN(p) || p < 0 || p > 20) throw new Error('cell_padding must be between 0 and 20 pixels');
    }
    if (config.cell_gap !== undefined) {
      const g = typeof config.cell_gap === 'number' ? config.cell_gap : parseFloat(config.cell_gap);
      if (isNaN(g) || g < 0 || g > 20) throw new Error('cell_gap must be between 0 and 20 pixels');
    }
    if (config.cell_font_size !== undefined) {
      const fs = typeof config.cell_font_size === 'number' ? config.cell_font_size : parseFloat(config.cell_font_size);
      if (isNaN(fs) || fs < 6 || fs > 24) throw new Error('cell_font_size must be between 6 and 24 pixels');
    }
    if (config.cell_width !== undefined && typeof config.cell_width !== 'string') {
      const w = parseFloat(config.cell_width);
      if (isNaN(w) || w < 10 || w > 500) throw new Error('cell_width as number must be between 10 and 500 pixels');
    }

    // Track whether user provided custom thresholds (wind uses this for auto-detection)
    const hasCustomThresholds = config.color_thresholds && config.color_thresholds.length > 0;

    // Default title based on type
    const defaultTitle = card_type === 'windspeed' ? 'Wind Speed History' : 'Temperature History';

    // Build configuration with defaults
    this._config = {
      card_type,

      // Required
      entity: config.entity,

      // Display options
      title: config.title || defaultTitle,
      days: config.days || 7,
      time_interval: config.time_interval || 2,
      time_format: config.time_format || '24',

      // Unit (null = auto-detect from entity attributes)
      unit: config.unit || null,

      // Refresh
      refresh_interval: config.refresh_interval || 300,

      // Interaction
      click_action: config.click_action || 'more-info',

      // Display options
      show_entity_name: config.show_entity_name || false,
      show_legend: config.show_legend || false,
      show_month_year: config.show_month_year !== false,  // Default true

      // Cell sizing
      cell_height: config.cell_height !== undefined ? config.cell_height : 36,
      cell_width: config.cell_width !== undefined ? config.cell_width : '1fr',
      cell_padding: config.cell_padding !== undefined ? config.cell_padding : 2,
      cell_gap: config.cell_gap !== undefined ? config.cell_gap : 2,
      cell_font_size: config.cell_font_size !== undefined ? config.cell_font_size : 11,
      compact: config.compact || false,
      compact_header: config.compact_header || false,

      // Visual options
      rounded_corners: config.rounded_corners !== false,
      interpolate_colors: config.interpolate_colors || false,
      color_interpolation: config.color_interpolation || 'hsl',

      // Data source options
      data_source: config.data_source || 'auto',
      // Temperature defaults to 'mean'; wind defaults to 'max'
      statistic_type: config.statistic_type || (card_type === 'windspeed' ? 'max' : 'mean'),

      // --- Temperature-only options ---
      aggregation_mode: config.aggregation_mode || 'average',
      decimals: config.decimals !== undefined ? config.decimals : 1,
      start_hour: config.start_hour !== undefined ? config.start_hour : 0,
      end_hour: config.end_hour !== undefined ? config.end_hour : 23,
      show_degree_symbol: config.show_degree_symbol !== false,
      fill_gaps: config.fill_gaps || false,
      fill_gaps_style: config.fill_gaps_style || 'dimmed',

      // --- Wind-only options ---
      direction_entity: config.direction_entity || null,
      show_direction: config.show_direction !== false,
      direction_format: config.direction_format || 'arrow',

      // Internal: track wind threshold auto-detection state
      _hasCustomThresholds: hasCustomThresholds,
      _thresholdsInitialized: card_type === 'temperature' || !!config.unit || hasCustomThresholds,

      // Color thresholds
      color_thresholds: hasCustomThresholds
        ? config.color_thresholds
        : this._defaultThresholdsForConfig(card_type, config.unit),
    };

    // Sort thresholds ascending
    this._config.color_thresholds = [...this._config.color_thresholds].sort((a, b) => a.value - b.value);

    if (this._hass) {
      this._clearAndSetInterval();
    }
  }

  // Get default thresholds at config time (unit may not be known yet for wind)
  _defaultThresholdsForConfig(card_type, unit) {
    if (card_type === 'windspeed') {
      return getWindThresholdsForUnit(unit).slice();
    }
    return getTemperatureThresholdsForUnit(unit).slice();
  }

  static getConfigElement() {
    return document.createElement('ha-weather-heatmap-card-editor');
  }

  static getStubConfig() {
    return { card_type: 'temperature', entity: '' };
  }

  // Home Assistant required method: receive hass object updates
  set hass(hass) {
    this._hass = hass;

    if (!this._config || !this.isConnected) return;

    // Auto-select wind thresholds based on detected unit (first time only, no custom thresholds)
    if (this._config.card_type === 'windspeed' &&
        !this._config._hasCustomThresholds &&
        !this._config._thresholdsInitialized) {
      const detectedUnit = this._getUnit();
      if (detectedUnit) {
        this._config.color_thresholds = getWindThresholdsForUnit(detectedUnit).slice();
        this._config._thresholdsInitialized = true;
        console.log(`Weather Heatmap: Auto-selected ${detectedUnit} thresholds`);
      }
    }

    if (this._viewOffset === 0 && this._isDataStale()) {
      this._fetchHistoryData();
    }
  }

  // Home Assistant required method: return card height hint
  getCardSize() {
    const rows = this._processedData ? this._processedData.rows.length : 12;
    const sizing = this._getEffectiveSizing();
    const cellHeightPx = parseFloat(sizing.cellHeight) || 36;
    return Math.ceil((rows * cellHeightPx + 100) / 50);
  }

  connectedCallback() {
    if (this._config && this._hass) {
      this._clearAndSetInterval();
    }
  }

  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _clearAndSetInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._fetchHistoryData();
    const intervalMs = this._config.refresh_interval * 1000;
    this._interval = setInterval(() => {
      if (this._viewOffset === 0) this._fetchHistoryData();
    }, intervalMs);
  }

  _isDataStale() {
    if (!this._historyData || !this._lastFetch) return true;
    return (Date.now() - this._lastFetch) > this._config.refresh_interval * 1000;
  }

  async fetchWithCache(url, timeoutMs = 30000, ttlMs = 5 * 60 * 1000) {
    const now = Date.now();
    const cacheKey = `${url}_offset${this._viewOffset}`;
    const cached = this._responseCache.get(cacheKey);
    if (cached && cached.expiry > now) return cached.data;

    const data = await Promise.race([
      this._hass.callApi('GET', url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);

    this._responseCache.set(cacheKey, { data, expiry: now + ttlMs });
    return data;
  }

  _getDataSource() {
    const source = this._config.data_source;
    if (source === 'history') return 'history';
    if (source === 'statistics') return 'statistics';
    // Auto: always use statistics - minimum bucket is 1 hour, so pre-aggregated stats are always appropriate
    return 'statistics';
  }

  // Fetch historical data from Home Assistant
  async _fetchHistoryData() {
    if (this._isLoading) return;

    this._isLoading = true;
    this._error = null;
    this._render();  // Show loading state

    const isWind = this._config.card_type === 'windspeed';
    const dataSource = this._getDataSource();
    console.log(`Weather Heatmap: Starting ${isWind ? 'wind' : 'temperature'} fetch using ${dataSource}...`);

    try {
      const now = new Date();
      let endTime;
      let partialBucketKey = null;

      if (this._viewOffset === 0) {
        endTime = new Date(now);
        const intervalHours = this._config.time_interval;
        const currentDateKey = getDateKey(now);
        const currentHourBucket = getHourBucket(now.getHours(), intervalHours);
        partialBucketKey = `${currentDateKey}_${currentHourBucket}`;
      } else {
        endTime = new Date(now);
        endTime.setDate(endTime.getDate() + this._viewOffset);
        endTime.setHours(23, 59, 59, 999);  // End of target day
      }

      const startTime = new Date(endTime);
      startTime.setDate(startTime.getDate() - this._config.days + 1);
      startTime.setHours(0, 0, 0, 0);  // Start of first day at midnight

      if (dataSource === 'statistics') {
        await this._fetchStatisticsData(startTime, endTime, partialBucketKey);
      } else {
        await this._fetchHistoryApiData(startTime, endTime, partialBucketKey);
      }

      this._lastFetch = Date.now();
      this._processData();
      this._isLoading = false;
      this._render();

    } catch (error) {
      console.error('Weather Heatmap: Fetch error:', error);
      this._isLoading = false;
      this._error = {
        message: `Failed to fetch ${isWind ? 'wind speed' : 'temperature'} history`,
        details: error.message
      };
      this._render();
    }
  }

  // Fetch data using the history/period REST API
  async _fetchHistoryApiData(startTime, endTime, partialBucketKey = null) {
    const startISO = startTime.toISOString();
    const endISO = endTime.toISOString();
    const isWind = this._config.card_type === 'windspeed';

    const primaryUrl = `history/period/${startISO}?` +
      `filter_entity_id=${this._config.entity}&` +
      `end_time=${endISO}&minimal_response&no_attributes`;

    const fetchPromises = [this._hass.callApi('GET', primaryUrl)];

    // Fetch direction data in parallel for wind cards
    if (isWind && this._config.direction_entity && this._config.show_direction) {
      const dirUrl = `history/period/${startISO}?` +
        `filter_entity_id=${this._config.direction_entity}&` +
        `end_time=${endISO}&minimal_response&no_attributes`;
      fetchPromises.push(this._hass.callApi('GET', dirUrl));
    }

    const fetchWithTimeout = (promise, timeoutMs = 30000) => Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), timeoutMs)
      )
    ]);

    const results = await fetchWithTimeout(Promise.all(fetchPromises));

    if (isWind) {
      this._historyData = {
        speed: results[0]?.[0] || [],
        direction: results[1] ? (results[1][0] || []) : [],
        startTime, endTime, partialBucketKey, dataSource: 'history'
      };
    } else {
      this._historyData = {
        temperature: results[0]?.[0] || [],
        startTime, endTime, partialBucketKey, dataSource: 'history'
      };
    }
  }

  // Fetch data using the recorder/statistics_during_period WebSocket API
  async _fetchStatisticsData(startTime, endTime, partialBucketKey = null) {
    const startISO = startTime.toISOString();
    const endISO = endTime.toISOString();
    const isWind = this._config.card_type === 'windspeed';

    const statisticIds = [this._config.entity];
    if (isWind && this._config.direction_entity && this._config.show_direction) {
      statisticIds.push(this._config.direction_entity);
    }

    const fetchWithTimeout = (promise, timeoutMs = 30000) => Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), timeoutMs)
      )
    ]);

    const statsResult = await fetchWithTimeout(
      this._hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: startISO,
        end_time: endISO,
        statistic_ids: statisticIds,
        period: 'hour',
      })
    );

    const statisticType = this._config.statistic_type;

    if (isWind) {
      const speedStats = statsResult[this._config.entity] || [];
      const directionStats = this._config.direction_entity
        ? (statsResult[this._config.direction_entity] || [])
        : [];

      const speedData = speedStats.map(stat => ({
        last_changed: stat.start,
        state: String(stat[statisticType] ?? stat.mean ?? ''),
      })).filter(p => p.state !== '' && p.state !== 'null');

      const directionData = directionStats.map(stat => ({
        last_changed: stat.start,
        state: String(stat.mean ?? ''),
      })).filter(p => p.state !== '' && p.state !== 'null');

      this._historyData = {
        speed: speedData, direction: directionData,
        startTime, endTime, partialBucketKey, dataSource: 'statistics'
      };
    } else {
      const tempStats = statsResult[this._config.entity] || [];
      const tempData = tempStats.map(stat => ({
        last_changed: stat.start,
        state: String(stat[statisticType] ?? stat.mean ?? ''),
      })).filter(p => p.state !== '' && p.state !== 'null');

      this._historyData = {
        temperature: tempData,
        startTime, endTime, partialBucketKey, dataSource: 'statistics'
      };
    }
  }

  // Process raw history data into grid structure
  _processData() {
    if (!this._historyData) {
      this._processedData = null;
      return;
    }

    if (this._config.card_type === 'windspeed') {
      this._processWindData();
    } else {
      this._processTemperatureData();
    }
  }

  _processTemperatureData() {
    const { temperature, startTime, partialBucketKey } = this._historyData;
    const intervalHours = this._config.time_interval;
    const rowsPerDay = 24 / intervalHours;

    // Build grid using running statistics (O(1) memory per bucket)
    const grid = {};

    temperature.forEach(point => {
      const timestamp = new Date(point.last_changed || point.last_updated);
      const dateKey = getDateKey(timestamp);
      const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
      const key = `${dateKey}_${hourKey}`;

      if (!grid[key]) grid[key] = { sum: 0, count: 0, min: null, max: null };

      const value = parseFloat(point.state);
      if (!isNaN(value)) {
        grid[key].sum += value;
        grid[key].count += 1;
        grid[key].min = grid[key].min === null ? value : Math.min(grid[key].min, value);
        grid[key].max = grid[key].max === null ? value : Math.max(grid[key].max, value);
      }
    });

    // Calculate aggregated value per bucket based on aggregation_mode
    Object.keys(grid).forEach(key => {
      const bucket = grid[key];
      if (bucket.count > 0) {
        switch (this._config.aggregation_mode) {
          case 'min': bucket.temperature = bucket.min; break;
          case 'max': bucket.temperature = bucket.max; break;
          default:    bucket.temperature = bucket.sum / bucket.count; break;
        }
      } else {
        bucket.temperature = null;
      }
    });

    const dates = this._buildDates(startTime);
    const rows = [];
    let allTemperatures = [];

    for (let h = 0; h < rowsPerDay; h++) {
      const hour = h * intervalHours;
      const row = {
        hour,
        label: formatHourLabel(hour, this._config.time_format),
        cells: dates.map(date => {
          const dateKey = getDateKey(date);
          const key = `${dateKey}_${hour}`;
          const bucket = grid[key];
          const cell = {
            date,
            temperature: bucket?.temperature ?? null,
            hasData: bucket && bucket.temperature !== null,
            isPartial: partialBucketKey && key === partialBucketKey
          };
          if (cell.temperature !== null) allTemperatures.push(cell.temperature);
          return cell;
        })
      };
      rows.push(row);
    }

    // Optional gap filling: forward-fill last known value into empty past buckets per column.
    // Future buckets (beyond "now") are intentionally left empty.
    if (this._config.fill_gaps) {
      const now = Date.now();
      for (let colIndex = 0; colIndex < dates.length; colIndex++) {
        let lastKnownTemp = null;
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const cell = row.cells[colIndex];

          // Reconstruct the bucket's start time to check if it is in the past
          const bucketTime = new Date(cell.date);
          bucketTime.setHours(row.hour, 0, 0, 0);
          const isFuture = bucketTime.getTime() > now;

          if (cell.hasData) {
            lastKnownTemp = cell.temperature;
          } else if (!isFuture && lastKnownTemp !== null) {
            cell.temperature = lastKnownTemp;
            cell.hasData = true;
            cell.isFilled = true;
          }
        }
      }
    }

    // Filter rows by start_hour/end_hour configuration
    const filteredRows = rows.filter(row => this._shouldDisplayRow(row.hour));

    // Recalculate statistics from filtered rows only
    allTemperatures = [];
    filteredRows.forEach(row => {
      row.cells.forEach(cell => {
        if (cell.temperature !== null) allTemperatures.push(cell.temperature);
      });
    });

    const stats = {
      min: allTemperatures.length > 0 ? Math.min(...allTemperatures) : 0,
      max: allTemperatures.length > 0 ? Math.max(...allTemperatures) : 0,
      avg: allTemperatures.length > 0
        ? allTemperatures.reduce((a, b) => a + b, 0) / allTemperatures.length : 0
    };

    this._processedData = { rows: filteredRows, dates, stats };
  }

  _processWindData() {
    const { speed, direction, startTime, partialBucketKey } = this._historyData;
    const intervalHours = this._config.time_interval;
    const rowsPerDay = 24 / intervalHours;

    const grid = {};

    // Process speed data - track maximum speed per bucket (peak gust is most relevant)
    speed.forEach(point => {
      const timestamp = new Date(point.last_changed || point.last_updated);
      const dateKey = getDateKey(timestamp);
      const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
      const key = `${dateKey}_${hourKey}`;

      if (!grid[key]) grid[key] = { maxSpeed: null, directions: [] };

      const value = parseFloat(point.state);
      if (!isNaN(value)) {
        if (grid[key].maxSpeed === null || value > grid[key].maxSpeed) {
          grid[key].maxSpeed = value;
        }
      }
    });

    // Process direction data - collect all readings per bucket for circular averaging
    if (direction && direction.length > 0) {
      direction.forEach(point => {
        const timestamp = new Date(point.last_changed || point.last_updated);
        const dateKey = getDateKey(timestamp);
        const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
        const key = `${dateKey}_${hourKey}`;

        if (grid[key]) {
          const value = parseFloat(point.state);
          if (!isNaN(value)) grid[key].directions.push(value);
        }
      });
    }

    // Calculate circular mean direction for each bucket
    Object.keys(grid).forEach(key => {
      const bucket = grid[key];
      bucket.avgDirection = bucket.directions.length > 0
        ? averageDirection(bucket.directions)
        : null;
    });

    const dates = this._buildDates(startTime);
    const rows = [];
    const allSpeeds = [];

    for (let h = 0; h < rowsPerDay; h++) {
      const hour = h * intervalHours;
      const row = {
        hour,
        label: formatHourLabel(hour, this._config.time_format),
        cells: dates.map(date => {
          const dateKey = getDateKey(date);
          const key = `${dateKey}_${hour}`;
          const bucket = grid[key];
          const cell = {
            date,
            speed: bucket?.maxSpeed ?? null,
            direction: bucket?.avgDirection ?? null,
            hasData: bucket && bucket.maxSpeed !== null,
            isPartial: partialBucketKey && key === partialBucketKey
          };
          if (cell.speed !== null) allSpeeds.push(cell.speed);
          return cell;
        })
      };
      rows.push(row);
    }

    // Optional gap filling: forward-fill last known value into empty past buckets per column.
    // Future buckets (beyond "now") are intentionally left empty.
    if (this._config.fill_gaps) {
      const now = Date.now();
      for (let colIndex = 0; colIndex < dates.length; colIndex++) {
        let lastKnownSpeed = null;
        let lastKnownDirection = null;
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const cell = row.cells[colIndex];

          const bucketTime = new Date(cell.date);
          bucketTime.setHours(row.hour, 0, 0, 0);
          const isFuture = bucketTime.getTime() > now;

          if (cell.hasData) {
            lastKnownSpeed = cell.speed;
            lastKnownDirection = cell.direction;
          } else if (!isFuture && lastKnownSpeed !== null) {
            cell.speed = lastKnownSpeed;
            cell.direction = lastKnownDirection;
            cell.hasData = true;
            cell.isFilled = true;
            allSpeeds.push(cell.speed);
          }
        }
      }
    }

    const stats = {
      min: allSpeeds.length > 0 ? Math.min(...allSpeeds) : 0,
      max: allSpeeds.length > 0 ? Math.max(...allSpeeds) : 0,
      avg: allSpeeds.length > 0
        ? allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length : 0
    };

    this._processedData = { rows, dates, stats };
  }

  // Build array of date objects for grid columns
  _buildDates(startTime) {
    const dates = [];
    for (let d = 0; d < this._config.days; d++) {
      const date = new Date(startTime);
      date.setDate(date.getDate() + d);
      dates.push(date);
    }
    return dates;
  }

  // Check if a temperature row hour falls within the configured display range
  _shouldDisplayRow(rowHour) {
    const startHour = this._config.start_hour;
    const endHour = this._config.end_hour;
    if (startHour <= endHour) {
      // Normal range (e.g., 8-17)
      return rowHour >= startHour && rowHour <= endHour;
    }
    // Wrap-around range (e.g., 22-5 crosses midnight)
    return rowHour >= startHour || rowHour <= endHour;
  }

  // Main render method
  _render() {
    if (!this._config || !this._hass) return;

    this._content.innerHTML = `
      <div class="card-header">
        <span class="title">${escapeHtml(this._config.title)}</span>
        ${this._renderNavControls()}
      </div>

      ${this._error ? this._renderError() : ''}
      ${this._processedData && !this._error ? this._renderGrid() : ''}
      ${this._processedData && !this._error && this._config.show_legend ? this._renderLegend() : ''}
      ${this._processedData && !this._error ? this._renderFooter() : ''}
    `;

    this._content.classList.toggle('compact-header', !!this._config.compact_header);
    this._content.classList.toggle('is-loading', !!this._isLoading);

    if (this._processedData) {
      this._content.style.setProperty('--days-count', this._config.days);
      const sizing = this._getEffectiveSizing();
      this._content.style.setProperty('--cell-height', sizing.cellHeight);
      this._content.style.setProperty('--cell-width', sizing.cellWidth);
      this._content.style.setProperty('--cell-padding', sizing.cellPadding);
      this._content.style.setProperty('--cell-gap', sizing.cellGap);
      this._content.style.setProperty('--cell-font-size', sizing.cellFontSize);
      this._content.style.setProperty('--cell-border-radius', this._config.rounded_corners ? '4px' : '0');
    }
  }

  _renderNavControls() {
    const canGoForward = this._viewOffset < 0;
    const showCurrentButton = this._viewOffset < 0;
    const dateRange = this._getDateRangeLabel();

    return `
      <div class="nav-controls">
        <button class="nav-btn" data-direction="back" aria-label="Previous period">&#8592;</button>
        <span class="date-range">${dateRange}</span>
        <button class="nav-btn" data-direction="forward"
                ${canGoForward ? '' : 'disabled'}
                aria-label="Next period">&#8594;</button>
        <button class="nav-btn-current ${showCurrentButton ? '' : 'hidden'}"
                data-direction="current"
                aria-label="Jump to current"
                ${showCurrentButton ? '' : 'aria-hidden="true"'}>Current</button>
      </div>
    `;
  }

  _getDateRangeLabel() {
    if (!this._processedData) return '';
    const { dates } = this._processedData;
    const start = dates[0];
    const end = dates[dates.length - 1];
    const formatOpts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, formatOpts)} - ${end.toLocaleDateString(undefined, formatOpts)}`;
  }

  _renderLoading() {
    const isWind = this._config.card_type === 'windspeed';
    return `
      <div class="loading">
        <div class="loading-spinner"></div>
        <div style="margin-top: 8px;">Loading ${isWind ? 'wind' : 'temperature'} data...</div>
      </div>
    `;
  }

  _renderError() {
    return `
      <div class="error-message">
        <div class="error-icon">!</div>
        <div class="error-text">
          <strong>${escapeHtml(this._error.message)}</strong>
          <div class="error-details">${escapeHtml(this._error.details)}</div>
        </div>
      </div>
    `;
  }

  _renderGrid() {
    const { rows, dates } = this._processedData;
    const monthName = dates[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const dateHeaders = dates.map(date => `<div class="date-header">${date.getDate()}</div>`).join('');
    const timeLabels = rows.map(row => `<div class="time-label">${row.label}</div>`).join('');
    const dataCells = rows.map(row => row.cells.map(cell => this._renderCell(cell)).join('')).join('');

    const monthHeader = this._config.show_month_year
      ? `<div class="month-header">${monthName}</div>`
      : '';

    return `
      <div class="heatmap-grid">
        ${monthHeader}
        <div class="grid-wrapper">
          <div class="time-labels">${timeLabels}</div>
          <div class="data-grid-container">
            <div class="date-headers">${dateHeaders}</div>
            <div class="data-grid">${dataCells}</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderCell(cell) {
    if (this._config.card_type === 'windspeed') {
      return this._renderWindCell(cell);
    }
    return this._renderTemperatureCell(cell);
  }

  _renderTemperatureCell(cell) {
    if (!cell.hasData) {
      return `<div class="cell no-data"><span class="value">-</span></div>`;
    }

    const bgColor = getColorForValue(
      cell.temperature,
      this._config.color_thresholds,
      this._config.interpolate_colors,
      this._config.color_interpolation
    );
    const textColor = getContrastTextColor(bgColor);
    const decimals = this._config.decimals;
    const partialIndicator = cell.isPartial ? '*' : '';
    const partialLabel = cell.isPartial ? ' (in progress)' : '';
    const filledLabel = cell.isFilled ? ' (estimated)' : '';

    let cellClass = 'cell';
    if (cell.isPartial) cellClass += ' partial';
    // Apply filled styling only when fill_gaps_style is 'dimmed' (default); 'none' renders like real data
    if (cell.isFilled && this._config.fill_gaps_style !== 'none') cellClass += ' filled';

    return `
      <div class="${cellClass}"
           style="background-color: ${bgColor}; color: ${textColor}"
           data-value="${cell.temperature}"
           data-date="${cell.date.toISOString()}"
           data-partial="${cell.isPartial ? 'true' : 'false'}"
           data-filled="${cell.isFilled ? 'true' : 'false'}"
           tabindex="0"
           role="button"
           aria-label="Temperature ${cell.temperature.toFixed(decimals)}${partialLabel}${filledLabel}">
        <span class="value">${cell.temperature.toFixed(decimals)}${partialIndicator}</span>
      </div>
    `;
  }

  _renderWindCell(cell) {
    if (!cell.hasData) {
      return `<div class="cell no-data"><span class="value">-</span></div>`;
    }

    const bgColor = getColorForValue(
      cell.speed,
      this._config.color_thresholds,
      this._config.interpolate_colors,
      this._config.color_interpolation
    );
    const textColor = getContrastTextColor(bgColor);
    const directionStr = this._config.show_direction
      ? formatDirection(cell.direction, this._config.direction_format)
      : '';
    const partialIndicator = cell.isPartial ? '*' : '';
    const partialLabel = cell.isPartial ? ' (in progress)' : '';
    const filledLabel = cell.isFilled ? ' (estimated)' : '';

    let cellClass = 'cell';
    if (cell.isPartial) cellClass += ' partial';
    // Apply filled styling only when fill_gaps_style is 'dimmed' (default); 'none' renders like real data
    if (cell.isFilled && this._config.fill_gaps_style !== 'none') cellClass += ' filled';

    return `
      <div class="${cellClass}"
           style="background-color: ${bgColor}; color: ${textColor}"
           data-value="${cell.speed}"
           data-direction="${cell.direction !== null ? cell.direction : ''}"
           data-date="${cell.date.toISOString()}"
           data-partial="${cell.isPartial ? 'true' : 'false'}"
           data-filled="${cell.isFilled ? 'true' : 'false'}"
           tabindex="0"
           role="button"
           aria-label="Wind speed ${cell.speed.toFixed(1)}${partialLabel}${filledLabel}">
        <span class="value">${cell.speed.toFixed(1)}${partialIndicator}</span>
        ${directionStr ? `<span class="direction">${directionStr}</span>` : ''}
      </div>
    `;
  }

  _renderLegend() {
    const thresholds = this._config.color_thresholds;
    if (!thresholds || thresholds.length === 0) return '';

    const unit = this._getUnit();
    const interpolate = this._config.interpolate_colors;
    const method = this._config.color_interpolation;
    const isWind = this._config.card_type === 'windspeed';

    if (isWind) {
      // Wind: logarithmic-ish scaling anchored to max value or 75 (whichever is larger)
      const maxValue = thresholds[thresholds.length - 1].value;
      const denominator = Math.max(maxValue, 75);
      const gradientStops = thresholds.map(t => {
        const percent = Math.min((t.value / denominator) * 100, 100);
        return `${t.color} ${percent.toFixed(0)}%`;
      }).join(', ');

      const MIN_LABEL_SPACING = 8;
      let lastLabelPct = -Infinity;
      const labelHtml = thresholds.map((t, i) => {
        const pct = Math.min((t.value / denominator) * 100, 100);
        if (pct - lastLabelPct < MIN_LABEL_SPACING) return '';
        lastLabelPct = pct;
        const isLast = i === thresholds.length - 1;
        return `<span style="position:absolute; left:${pct.toFixed(1)}%;">${t.value}${isLast ? '+' : ''}</span>`;
      }).join('');

      return `
        <div class="legend">
          <div class="legend-bar" style="background: linear-gradient(to right, ${gradientStops});"></div>
          <div class="legend-labels" style="position:relative;">${labelHtml}</div>
        </div>
      `;
    } else {
      // Temperature: proportional scaling across the threshold value range
      const minVal = thresholds[0].value;
      const maxVal = thresholds[thresholds.length - 1].value;
      const range = maxVal - minVal || 1;

      let gradientStops;
      if (interpolate && thresholds.length >= 2) {
        const stops = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const value = minVal + t * range;
          const color = getColorForValue(value, thresholds, true, method);
          stops.push(`${color} ${(t * 100).toFixed(1)}%`);
        }
        gradientStops = stops.join(', ');
      } else {
        const stops = [];
        for (let i = 0; i < thresholds.length; i++) {
          const current = thresholds[i];
          const pct = ((current.value - minVal) / range) * 100;
          stops.push(`${current.color} ${pct.toFixed(1)}%`);
          if (i < thresholds.length - 1) {
            const next = thresholds[i + 1];
            const nextPct = ((next.value - minVal) / range) * 100;
            stops.push(`${current.color} ${nextPct.toFixed(1)}%`);
          }
        }
        gradientStops = stops.join(', ');
      }

      // Label positioning with collision detection to avoid crowding
      const MIN_LABEL_SPACING = 8;
      let lastLabelPct = -Infinity;
      const labels = thresholds.map(t => {
        const pct = ((t.value - minVal) / range) * 100;
        if (pct - lastLabelPct < MIN_LABEL_SPACING) return '';
        lastLabelPct = pct;
        return `<span style="position:absolute; left:${pct.toFixed(1)}%;">${t.value}${unit}</span>`;
      }).join('');

      return `
        <div class="legend">
          <div class="legend-bar" style="background: linear-gradient(to right, ${gradientStops})"></div>
          <div class="legend-labels" style="position:relative;">${labels}</div>
        </div>
      `;
    }
  }

  _renderFooter() {
    const { stats } = this._processedData;
    const unit = this._getUnit();
    const isWind = this._config.card_type === 'windspeed';
    // Temperature uses configurable decimal places; wind always shows 1 decimal
    const decimals = isWind ? 1 : this._config.decimals;

    let entityName = '';
    if (this._config.show_entity_name) {
      const stateObj = this._hass?.states[this._config.entity];
      const friendlyName = stateObj?.attributes?.friendly_name || this._config.entity;
      entityName = `<div class="entity-name">${escapeHtml(friendlyName)}</div>`;
    }

    return `
      <div class="footer">
        <div class="footer-stats">
          <span>Min: ${stats.min.toFixed(decimals)} ${unit}</span>
          <span>Max: ${stats.max.toFixed(decimals)} ${unit}</span>
          <span>Avg: ${stats.avg.toFixed(decimals)} ${unit}</span>
        </div>
        ${entityName}
      </div>
    `;
  }

  // Get unit of measurement, handling degree symbol option for temperature
  _getUnit() {
    let unit;

    if (this._config.unit) {
      unit = this._config.unit;
    } else {
      const stateObj = this._hass?.states[this._config.entity];
      const detected = stateObj?.attributes?.unit_of_measurement;

      if (this._config.card_type === 'windspeed') {
        unit = detected || 'mph';
      } else {
        unit = detected || '°F';
      }
    }

    // Strip degree symbol for temperature if show_degree_symbol is false
    if (this._config.card_type === 'temperature' && !this._config.show_degree_symbol) {
      unit = unit.replace('°', '');
    }

    return unit;
  }

  // Handle all click events (event delegation)
  _handleClick(e) {
    const navBtn = e.target.closest('.nav-btn, .nav-btn-current');
    if (navBtn && !navBtn.disabled) {
      this._handleNavigation(navBtn.dataset.direction);
      return;
    }

    const cell = e.target.closest('.cell');
    if (cell && !cell.classList.contains('no-data')) {
      this._handleCellClick(cell);
    }
  }

  _handleNavigation(direction) {
    if (direction === 'back') {
      this._viewOffset -= this._config.days;
    } else if (direction === 'forward') {
      this._viewOffset += this._config.days;
      if (this._viewOffset > 0) this._viewOffset = 0;
    } else if (direction === 'current') {
      this._viewOffset = 0;
    }
    this._fetchHistoryData();
  }

  _handleCellClick(cellElement) {
    switch (this._config.click_action) {
      case 'more-info': this._showMoreInfo(); break;
      case 'tooltip':   this._showTooltip(cellElement); break;
    }
  }

  _showMoreInfo() {
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._config.entity }
    }));
  }

  _showTooltip(cellElement) {
    // Remove any existing tooltip
    const existing = this.shadowRoot.querySelector('.tooltip');
    if (existing) existing.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';

    const date = new Date(cellElement.dataset.date);
    const dateStr = date.toLocaleString(undefined, { month: 'short', day: 'numeric' });
    const unit = this._getUnit();
    const isWind = this._config.card_type === 'windspeed';
    const isPartial = cellElement.dataset.partial === 'true';
    const partialNote = isPartial ? '<div><em>(in progress)</em></div>' : '';

    if (isWind) {
      const speed = parseFloat(cellElement.dataset.value);
      const directionDeg = cellElement.dataset.direction;
      const dirText = directionDeg
        ? ` ${degreesToCardinal(parseFloat(directionDeg))} (${Math.round(parseFloat(directionDeg))}deg)`
        : '';
      tooltip.innerHTML = `
        <div><strong>${dateStr}</strong></div>
        <div>Speed: ${speed.toFixed(1)} ${unit}${dirText}</div>
        ${partialNote}
      `;
    } else {
      const temperature = parseFloat(cellElement.dataset.value);
      const decimals = this._config.decimals;
      const isFilled = cellElement.dataset.filled === 'true';
      const filledNote = isFilled ? '<div><em>(estimated - gap filled)</em></div>' : '';
      tooltip.innerHTML = `
        <div><strong>${dateStr}</strong></div>
        <div>Temperature: ${temperature.toFixed(decimals)} ${unit}</div>
        <div>Mode: ${this._config.aggregation_mode}</div>
        ${partialNote}
        ${filledNote}
      `;
    }

    // Position tooltip near the cell
    const rect = cellElement.getBoundingClientRect();
    const parentRect = this._content.getBoundingClientRect();
    tooltip.style.left = `${rect.left - parentRect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom - parentRect.top + 4}px`;
    tooltip.style.transform = 'translateX(-50%)';

    this._content.appendChild(tooltip);

    // Auto-hide after 3 seconds
    setTimeout(() => { if (tooltip.parentElement) tooltip.remove(); }, 3000);
  }

  _getEffectiveSizing() {
    if (this._config.compact) {
      return {
        cellHeight: '24px',
        cellWidth: '1fr',
        cellPadding: '1px',
        cellGap: '1px',
        cellFontSize: '9px',
      };
    }
    return {
      cellHeight: normalizeSize(this._config.cell_height, '36px'),
      cellWidth: normalizeSize(this._config.cell_width, '1fr'),
      cellPadding: normalizeSize(this._config.cell_padding, '2px'),
      cellGap: normalizeSize(this._config.cell_gap, '2px'),
      cellFontSize: normalizeSize(this._config.cell_font_size, '11px'),
    };
  }
}

// Visual configuration editor for the Sensor Heatmap Card


/**
 * Visual editor for the Sensor Heatmap Card.
 * Shows all common fields, and conditionally shows temperature-only or
 * wind-only fields based on the card_type selection.
 */
class SensorHeatmapCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this.content = null;
    this.fields = {};
    this.container_threshold = null;
  }

  set hass(hass) {
    this._hass = hass;
    // Build the editor the first time hass is received
    if (!this.content) {
      this._buildEditor();
    } else {
      // Propagate updated hass to all ha-selector and ha-entity-picker inputs
      for (const key in this.fields) {
        const { input, type } = this.fields[key];
        if (input && (type === 'select' || type === 'entity')) {
          input.hass = hass;
        }
      }
    }
  }

  async setConfig(config) {
    this._config = { ...(config || {}) };

    // Ensure ha-entity-picker is registered before we try to create one
    const helpers = await window.loadCardHelpers();
    if (!customElements.get('ha-entity-picker')) {
      const entitiesCard = await helpers.createCardElement({ type: 'entities', entities: [] });
      await entitiesCard.constructor.getConfigElement();
    }

    // Merged defaults covering both card types
    const defaults = {
      card_type: 'temperature',
      entity: '',
      title: '',
      days: 7,
      time_interval: 2,
      time_format: '24',
      refresh_interval: 300,
      click_action: 'more-info',
      show_entity_name: false,
      show_month_year: true,
      show_legend: false,
      cell_height: 36,
      cell_width: '1fr',
      cell_padding: 2,
      cell_gap: 2,
      cell_font_size: 11,
      compact: false,
      compact_header: false,
      rounded_corners: true,
      interpolate_colors: false,
      color_interpolation: 'hsl',
      color_thresholds: [],
      data_source: 'auto',
      // Temperature-specific defaults
      start_hour: 0,
      end_hour: 23,
      aggregation_mode: 'average',
      decimals: 1,
      unit: '',
      show_degree_symbol: true,
      fill_gaps: false,
      statistic_type: 'mean',
      // Wind-specific defaults
      direction_entity: '',
      show_direction: true,
      direction_format: 'arrow',
    };

    this._config = { ...defaults, ...this._config };

    if (this.content) {
      this._updateValues();
      this._updateFieldVisibility();
    }
  }

  getConfig() {
    return { ...this._config };
  }

  _buildEditor() {
    this.content = document.createElement('div');
    this.content.style.display = 'grid';
    this.content.style.gridGap = '8px';
    this.content.style.padding = '8px';
    this.appendChild(this.content);

    this.fields = {};

    // Field definitions.
    // showWhen: undefined = always visible
    //           'temperature' = only shown when card_type is 'temperature'
    //           'windspeed'   = only shown when card_type is 'windspeed'
    //
    // Virtual keys 'unit_temp' / 'unit_wind' and 'statistic_type_temp' / 'statistic_type_wind'
    // both write to 'unit' and 'statistic_type' in the config respectively.
    // This lets us show different option sets for the same config key per card type.
    const fields = [
      // Card type selector - always visible, drives field visibility
      { type: 'select', key: 'card_type', label: 'Card Type',
        options: { temperature: 'Temperature', windspeed: 'Wind Speed' } },

      // Common fields
      { type: 'entity', key: 'entity', label: 'Entity', required: true },
      { type: 'text', key: 'title', label: 'Title' },
      { type: 'number', key: 'days', label: 'Days', min: 1, max: 365 },
      { type: 'number', key: 'time_interval', label: 'Time Interval (hours)', min: 1, max: 24 },
      { type: 'select', key: 'time_format', label: 'Time Format',
        options: { 24: '24h', 12: '12h' } },
      { type: 'select', key: 'data_source', label: 'Data Source',
        options: {
          'auto': 'Auto (statistics for past, history for current)',
          'history': 'History only (limited by purge_keep_days)',
          'statistics': 'Statistics only (long-term hourly data)'
        } },

      // Data aggregation section - prominent placement since these affect what values are shown
      { type: 'section', key: 'section_aggregation', label: 'Data Aggregation',
        options: { description:
          'Aggregation Mode: how multiple raw sensor readings within a single time cell are combined ' +
          '(average, min, or max of all history readings in that interval). ' +
          'Statistic Type: which pre-computed value to pull when fetching long-term statistics ' +
          '(HA records mean, max, and min per hour — used when data is older than your recorder history).'
        } },
      { type: 'select', key: 'aggregation_mode', label: 'Aggregation Mode',
        options: { average: 'Average', min: 'Min', max: 'Max' }, showWhen: 'temperature' },
      // Virtual keys: both write to 'statistic_type' in config with different option sets per card type
      { type: 'select', key: 'statistic_type_temp', label: 'Statistic Type',
        options: { 'mean': 'Average (mean)', 'max': 'Maximum', 'min': 'Minimum' }, showWhen: 'temperature' },
      { type: 'select', key: 'statistic_type_wind', label: 'Statistic Type',
        options: { 'max': 'Maximum', 'mean': 'Average (mean)', 'min': 'Minimum' }, showWhen: 'windspeed' },

      { type: 'number', key: 'refresh_interval', label: 'Refresh Interval (s)', min: 10, max: 3600 },
      { type: 'select', key: 'click_action', label: 'Click Action',
        options: { none: 'None', 'more-info': 'More Info', tooltip: 'Tooltip' } },
      { type: 'switch', key: 'show_entity_name', label: 'Show Entity Name' },
      { type: 'switch', key: 'show_month_year', label: 'Show Month/Year Label' },
      { type: 'switch', key: 'show_legend', label: 'Show Legend' },
      { type: 'number', key: 'cell_height', label: 'Cell Height', min: 10, max: 200 },
      { type: 'text', key: 'cell_width', label: 'Cell Width (px or fr)' },
      { type: 'number', key: 'cell_padding', label: 'Cell Padding', min: 0, max: 20 },
      { type: 'number', key: 'cell_gap', label: 'Cell Gap', min: 0, max: 20 },
      { type: 'number', key: 'cell_font_size', label: 'Cell Font Size', min: 6, max: 24 },
      { type: 'switch', key: 'compact', label: 'Compact Mode' },
      { type: 'switch', key: 'compact_header', label: 'Compact Header' },
      { type: 'switch', key: 'rounded_corners', label: 'Rounded Corners' },
      { type: 'switch', key: 'interpolate_colors', label: 'Interpolate Colors' },
      { type: 'select', key: 'color_interpolation', label: 'Color Interpolation',
        options: { rgb: 'RGB', gamma: 'Gamma RGB', hsl: 'HSL', lab: 'LAB' } },

      // Temperature-only fields
      { type: 'number', key: 'start_hour', label: 'Start Hour', min: 0, max: 23, showWhen: 'temperature' },
      { type: 'number', key: 'end_hour', label: 'End Hour', min: 0, max: 23, showWhen: 'temperature' },
      { type: 'number', key: 'decimals', label: 'Decimals', min: 0, max: 2, showWhen: 'temperature' },
      // Virtual key: writes to 'unit' in config, temperature unit options
      { type: 'select', key: 'unit_temp', label: 'Unit',
        options: { '': 'Auto-detect', '\u00b0C': 'Celsius', '\u00b0F': 'Fahrenheit' }, showWhen: 'temperature' },
      { type: 'switch', key: 'show_degree_symbol', label: 'Show Degree Symbol', showWhen: 'temperature' },
      { type: 'switch', key: 'fill_gaps', label: 'Fill Gaps (forward-fill last known value - use with care)', showWhen: 'temperature' },

      // Wind-only fields
      { type: 'entity', key: 'direction_entity', label: 'Wind Direction Entity', showWhen: 'windspeed' },
      // Virtual key: writes to 'unit' in config, wind unit options
      { type: 'select', key: 'unit_wind', label: 'Unit',
        options: { '': 'Auto-detect', 'mph': 'mph', 'km/h': 'km/h', 'm/s': 'm/s', 'kn': 'knots' }, showWhen: 'windspeed' },
      { type: 'switch', key: 'show_direction', label: 'Show Direction', showWhen: 'windspeed' },
      { type: 'select', key: 'direction_format', label: 'Direction Format',
        options: { arrow: 'Arrow', cardinal: 'Cardinal', degrees: 'Degrees' }, showWhen: 'windspeed' },

      // Threshold editor - always visible
      { type: 'thresholds', key: 'color_thresholds', label: 'Colors' },
    ];

    fields.forEach(f => this._createField(f));

    this._updateValues();
    this._updateFieldVisibility();
  }

  // Show or hide conditional fields based on current card_type
  _updateFieldVisibility() {
    const cardType = this._config.card_type || 'temperature';
    for (const key in this.fields) {
      const field = this.fields[key];
      if (!field.showWhen) continue;  // Always-visible fields have no showWhen
      field.wrapper.style.display = field.showWhen === cardType ? '' : 'none';
    }
  }

  _createField({ type, key, label, min, max, options, required, showWhen }) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.marginBottom = '8px';

    let input;

    if (type === 'section') {
      // Section header with optional description — no input element
      wrapper.style.marginTop = '12px';
      wrapper.style.marginBottom = '4px';
      wrapper.style.borderBottom = '1px solid var(--divider-color, #e0e0e0)';
      wrapper.style.paddingBottom = '4px';

      const heading = document.createElement('div');
      heading.style.fontWeight = 'bold';
      heading.textContent = label;
      wrapper.appendChild(heading);

      if (options && options.description) {
        const desc = document.createElement('div');
        desc.style.fontSize = '0.82em';
        desc.style.color = 'var(--secondary-text-color)';
        desc.style.lineHeight = '1.4';
        desc.style.marginTop = '4px';
        desc.textContent = options.description;
        wrapper.appendChild(desc);
      }

      this.fields[key] = { input: null, type, wrapper, showWhen };
      this.content.appendChild(wrapper);
      return;

    } else if (type === 'switch') {
      wrapper.style.flexDirection = 'row';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '8px';

      input = document.createElement('ha-switch');
      const lbl = document.createElement('label');
      lbl.textContent = label;
      wrapper.appendChild(input);
      wrapper.appendChild(lbl);

      input.addEventListener('change', (e) => {
        e.stopPropagation();
        this._onFieldChange(key, input.checked);
      });

    } else if (type === 'thresholds') {
      const lbl = document.createElement('label');
      lbl.textContent = label;
      wrapper.appendChild(lbl);

      const list = document.createElement('div');
      list.style.display = 'grid';
      list.style.gridGap = '8px';
      wrapper.appendChild(list);

      this.container_threshold = list;

      const addBtn = document.createElement('button');
      addBtn.textContent = 'Add Threshold';
      addBtn.style.marginTop = '8px';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        newThresholds.push({ value: 0, color: '#ffffff' });
        this._onFieldChange('color_thresholds', newThresholds);
      });
      wrapper.appendChild(addBtn);

    } else {
      // ha-selector renders its own label; other types get an explicit <label>
      if (type !== 'select') {
        const lbl = document.createElement('label');
        lbl.textContent = label;
        wrapper.appendChild(lbl);
      }

      if (type === 'entity') {
        input = document.createElement('ha-entity-picker');
        input.setAttribute('allow-custom-entity', '');
        input.hass = this._hass;

        input.addEventListener('value-changed', (e) => {
          e.stopPropagation();
          this._onFieldChange(key, e.detail.value);
        });

      } else if (type === 'number' || type === 'text') {
        input = document.createElement('ha-textfield');
        input.type = type;
        if (min !== undefined) input.min = min;
        if (max !== undefined) input.max = max;
        if (required) input.required = true;

        input.addEventListener('change', (e) => {
          e.stopPropagation();
          const value = type === 'number' ? Number(input.value) : input.value;
          this._onFieldChange(key, value);
        });

      } else if (type === 'select') {
        input = document.createElement('ha-selector');
        input.hass = this._hass;
        input.selector = {
          select: {
            options: Object.entries(options).map(([value, label]) => ({ value, label })),
            mode: 'dropdown',
          }
        };
        input.label = label;

        input.addEventListener('value-changed', (e) => {
          e.stopPropagation();
          this._onFieldChange(key, e.detail.value);
        });
      }

      wrapper.appendChild(input);
    }

    // Store the wrapper and metadata for visibility control and value updates
    this.fields[key] = { input, type, wrapper, showWhen };
    this.content.appendChild(wrapper);
  }

  // Map virtual field keys to real config keys, then dispatch config-changed
  _onFieldChange(key, value) {
    let configKey = key;

    // Virtual key mapping: both variants write to the same real config key
    if (key === 'unit_temp' || key === 'unit_wind') configKey = 'unit';
    if (key === 'statistic_type_temp' || key === 'statistic_type_wind') configKey = 'statistic_type';

    const updated = { ...this._config, [configKey]: value };
    this._config = updated;

    // Update field visibility whenever card_type changes
    if (key === 'card_type') {
      this._updateFieldVisibility();
    }

    // Reconstruct with type and card_type first so YAML view has them at the top
    const { type, card_type, ...rest } = updated;
    const ordered = {};
    if (type !== undefined) ordered.type = type;
    if (card_type !== undefined) ordered.card_type = card_type;
    Object.assign(ordered, rest);

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: ordered },
      bubbles: true,
      composed: true,
    }));
  }

  _updateValues() {
    if (!this._config) return;

    for (const key in this.fields) {
      const field = this.fields[key];
      const input = field.input;

      if (field.type === 'thresholds') {
        this._refreshThresholdEditor();
        continue;
      }

      if (!input) continue;

      // Map virtual keys to the real config key for reading
      let configKey = key;
      if (key === 'unit_temp' || key === 'unit_wind') configKey = 'unit';
      if (key === 'statistic_type_temp' || key === 'statistic_type_wind') configKey = 'statistic_type';

      const value = this._config[configKey];

      if (field.type === 'switch') {
        input.checked = !!value;
      } else {
        input.value = value !== undefined ? value : '';
      }
    }
  }

  _createThresholdEditor() {
    const createRow = (threshold, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';

      const valueInput = document.createElement('ha-textfield');
      valueInput.type = 'number';
      valueInput.value = threshold.value;
      valueInput.addEventListener('change', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        const updated = { ...this._config.color_thresholds[index] };
        updated.value = Number(e.target.value);
        newThresholds[index] = updated;
        this._onFieldChange('color_thresholds', newThresholds);
        this._refreshThresholdEditor();
      });

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      // Convert rgba() to hex for browser color picker compatibility
      colorInput.value = rgbaToHex(threshold.color);
      colorInput.addEventListener('change', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        const updated = { ...this._config.color_thresholds[index] };
        updated.color = e.target.value;
        newThresholds[index] = updated;
        this._onFieldChange('color_thresholds', newThresholds);
        this._refreshThresholdEditor();
      });

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'X';
      removeBtn.style.cursor = 'pointer';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        newThresholds.splice(index, 1);
        this._onFieldChange('color_thresholds', newThresholds);
        this._refreshThresholdEditor();
      });

      row.appendChild(valueInput);
      row.appendChild(colorInput);
      row.appendChild(removeBtn);
      this.container_threshold.appendChild(row);
    };

    if (!this._config.color_thresholds) this._config.color_thresholds = [];
    this._config.color_thresholds.forEach((t, i) => createRow(t, i));
  }

  _refreshThresholdEditor() {
    if (!this.container_threshold) return;
    while (this.container_threshold.firstChild) {
      this.container_threshold.removeChild(this.container_threshold.firstChild);
    }
    this._createThresholdEditor();
  }

  disconnectedCallback() {
    this.fields = {};
    this.container_threshold = null;
  }
}

// Entry point: register all custom elements and announce card to Home Assistant


// Register the primary element name - guard prevents DOMException on duplicate load
if (!customElements.get('ha-weather-heatmap-card')) {
  customElements.define('ha-weather-heatmap-card', SensorHeatmapCard);
}

// Register legacy element names for backward compatibility.
// The Custom Elements registry requires a unique constructor per tag name, so
// empty subclasses are used here. They inherit all behavior from SensorHeatmapCard.
// this.tagName in setConfig() still returns the actual element name, so the
// card_type auto-detection logic works correctly for each legacy name.
// Guard with customElements.get() so the old standalone cards can coexist as
// HA resources without causing a DOMException on duplicate registration.
class TemperatureHeatmapCardLegacy extends SensorHeatmapCard {}
class WindspeedHeatmapCardLegacy extends SensorHeatmapCard {}

if (!customElements.get('ha-temperature-heatmap-card')) {
  customElements.define('ha-temperature-heatmap-card', TemperatureHeatmapCardLegacy);
}
if (!customElements.get('windspeed-heatmap-card')) {
  customElements.define('windspeed-heatmap-card', WindspeedHeatmapCardLegacy);
}

// Register the shared visual editor element
if (!customElements.get('ha-weather-heatmap-card-editor')) {
  customElements.define('ha-weather-heatmap-card-editor', SensorHeatmapCardEditor);
}

// Register all three card names with Home Assistant's card picker
window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: 'ha-weather-heatmap-card',
    name: 'Weather Heatmap Card',
    description: 'Heatmap visualization for temperature or wind speed sensors',
    preview: false,
  },
  {
    type: 'ha-temperature-heatmap-card',
    name: 'Temperature Heatmap Card (legacy)',
    description: 'Legacy name - use ha-weather-heatmap-card instead',
    preview: false,
  },
  {
    type: 'windspeed-heatmap-card',
    name: 'Windspeed Heatmap Card (legacy)',
    description: 'Legacy name - use ha-weather-heatmap-card instead',
    preview: false,
  }
);

console.info(
  '%c WEATHER-HEATMAP-CARD %c v' + VERSION + ' ',
  'color: black; background: #F2720C; font-weight: 600;',
  'color: black; background: #00a5c9; font-weight: 600;'
);
