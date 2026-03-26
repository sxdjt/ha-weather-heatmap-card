// Color parsing, interpolation, and utility functions

/**
 * Parse color string to RGB object.
 * Supports rgba(), rgb(), and hex formats.
 * @param {string} color - Color string
 * @returns {Object|null} - RGB object {r, g, b} or null if parsing fails
 */
export function parseColor(color) {
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
export function interpolateRGB(rgb1, rgb2, t) {
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
export function interpolateGamma(rgb1, rgb2, t, gamma = 2.2) {
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
export function rgbToHsl(rgb) {
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
export function hslToRgb(hsl) {
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
export function interpolateHSL(rgb1, rgb2, t) {
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
export function rgbToLab(rgb) {
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
export function labToRgb(lab) {
  // LAB to XYZ
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const x = (Math.pow(fx, 3) > 0.008856 ? Math.pow(fx, 3) : (fx - 16 / 116) / 7.787) * 0.95047;
  const y = Math.pow(fy, 3) > 0.008856 ? Math.pow(fy, 3) : (fy - 16 / 116) / 7.787;
  const z = (Math.pow(fz, 3) > 0.008856 ? Math.pow(fz, 3) : (fz - 16 / 116) / 7.787) * 1.08883;

  // XYZ to RGB
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
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
export function interpolateLAB(rgb1, rgb2, t) {
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
export function interpolateColor(color1, color2, t, method = 'hsl') {
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
export function getContrastTextColor(backgroundColor) {
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
export function getColorForValue(value, thresholds, interpolate = false, interpolationMethod = 'hsl') {
  if (value === null || value === undefined) {
    return 'var(--disabled-color, #f0f0f0)';
  }

  // No thresholds defined - return a neutral default (generic card type with no color config)
  if (!thresholds || thresholds.length === 0) {
    return 'var(--secondary-background-color, #e0e0e0)';
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
export function rgbaToHex(color) {
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
