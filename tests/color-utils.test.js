import { describe, it, expect } from 'vitest';
import {
  parseColor,
  interpolateColor,
  getContrastTextColor,
  getColorForValue,
  rgbaToHex,
} from '../src/color-utils.js';

// ------------------------------------------------------------
// parseColor
// ------------------------------------------------------------

describe('parseColor', () => {
  it('parses hex', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('#1a237e')).toEqual({ r: 26, g: 35, b: 126 });
  });

  it('parses rgb()', () => {
    expect(parseColor('rgb(100, 200, 50)')).toEqual({ r: 100, g: 200, b: 50 });
  });

  it('parses rgba()', () => {
    expect(parseColor('rgba(30, 136, 229, 1)')).toEqual({ r: 30, g: 136, b: 229 });
  });

  it('returns null for unrecognized format', () => {
    expect(parseColor('hsl(120, 50%, 50%)')).toBeNull();
    expect(parseColor('notacolor')).toBeNull();
  });
});

// ------------------------------------------------------------
// rgbaToHex
// ------------------------------------------------------------

describe('rgbaToHex', () => {
  it('passes hex through unchanged', () => {
    expect(rgbaToHex('#abc123')).toBe('#abc123');
  });

  it('converts rgb() to hex', () => {
    expect(rgbaToHex('rgb(255, 0, 0)')).toBe('#ff0000');
  });

  it('converts rgba() to hex (ignores alpha)', () => {
    expect(rgbaToHex('rgba(0, 255, 0, 0.5)')).toBe('#00ff00');
  });

  it('returns #ffffff for unrecognized input', () => {
    expect(rgbaToHex('notacolor')).toBe('#ffffff');
  });
});

// ------------------------------------------------------------
// getContrastTextColor
// ------------------------------------------------------------

describe('getContrastTextColor', () => {
  it('returns black for a light background', () => {
    expect(getContrastTextColor('#ffffff')).toBe('#000000');
    expect(getContrastTextColor('#ffeb3b')).toBe('#000000'); // yellow
  });

  it('returns white for a dark background', () => {
    expect(getContrastTextColor('#000000')).toBe('#ffffff');
    expect(getContrastTextColor('#1a237e')).toBe('#ffffff'); // dark blue
  });

  it('handles rgba() format', () => {
    expect(getContrastTextColor('rgba(255, 255, 255, 1)')).toBe('#000000');
    expect(getContrastTextColor('rgba(0, 0, 0, 1)')).toBe('#ffffff');
  });

  it('returns CSS variable for var() colors', () => {
    expect(getContrastTextColor('var(--primary-color)')).toBe('var(--primary-text-color)');
  });

  it('falls back to CSS variable for unrecognized format', () => {
    expect(getContrastTextColor('notacolor')).toBe('var(--primary-text-color)');
  });
});

// ------------------------------------------------------------
// getColorForValue
// ------------------------------------------------------------

const THRESHOLDS = [
  { value: 0,  color: '#0000ff' },
  { value: 50, color: '#00ff00' },
  { value: 100, color: '#ff0000' },
];

describe('getColorForValue - step mode', () => {
  it('returns disabled color for null', () => {
    const result = getColorForValue(null, THRESHOLDS);
    expect(result).toContain('disabled');
  });

  it('returns disabled color for undefined', () => {
    const result = getColorForValue(undefined, THRESHOLDS);
    expect(result).toContain('disabled');
  });

  it('returns first threshold color for value below minimum', () => {
    expect(getColorForValue(-10, THRESHOLDS)).toBe('#0000ff');
  });

  it('returns color for exact threshold match', () => {
    expect(getColorForValue(50, THRESHOLDS)).toBe('#00ff00');
  });

  it('returns correct color between thresholds', () => {
    // 75 is between 50 and 100 - should use the 50 threshold color
    expect(getColorForValue(75, THRESHOLDS)).toBe('#00ff00');
  });

  it('returns last threshold color for value above maximum', () => {
    expect(getColorForValue(200, THRESHOLDS)).toBe('#ff0000');
  });
});

describe('getColorForValue - interpolation mode', () => {
  it('returns first color for value at or below minimum', () => {
    expect(getColorForValue(0, THRESHOLDS, true)).toBe('#0000ff');
    expect(getColorForValue(-5, THRESHOLDS, true)).toBe('#0000ff');
  });

  it('returns last color for value at or above maximum', () => {
    expect(getColorForValue(100, THRESHOLDS, true)).toBe('#ff0000');
    expect(getColorForValue(150, THRESHOLDS, true)).toBe('#ff0000');
  });

  it('returns an interpolated rgb() string for midpoint value', () => {
    const result = getColorForValue(25, THRESHOLDS, true, 'rgb');
    expect(result).toMatch(/^rgb\(/);
  });

  it('produces distinct interpolated colors at different points', () => {
    const a = getColorForValue(10, THRESHOLDS, true, 'hsl');
    const b = getColorForValue(40, THRESHOLDS, true, 'hsl');
    expect(a).not.toBe(b);
  });
});

// ------------------------------------------------------------
// interpolateColor (smoke tests for each method)
// ------------------------------------------------------------

describe('interpolateColor', () => {
  const black = '#000000';
  const white = '#ffffff';

  it('rgb: midpoint is grey', () => {
    const result = interpolateColor(black, white, 0.5, 'rgb');
    expect(result).toBe('rgb(128, 128, 128)');
  });

  it('gamma: returns an rgb() string', () => {
    const result = interpolateColor(black, white, 0.5, 'gamma');
    expect(result).toMatch(/^rgb\(/);
  });

  it('hsl: returns an rgb() string', () => {
    const result = interpolateColor(black, white, 0.5, 'hsl');
    expect(result).toMatch(/^rgb\(/);
  });

  it('lab: returns an rgb() string', () => {
    const result = interpolateColor(black, white, 0.5, 'lab');
    expect(result).toMatch(/^rgb\(/);
  });

  it('t=0 returns first color', () => {
    expect(interpolateColor('#ff0000', '#0000ff', 0, 'rgb')).toBe('rgb(255, 0, 0)');
  });

  it('t=1 returns second color', () => {
    expect(interpolateColor('#ff0000', '#0000ff', 1, 'rgb')).toBe('rgb(0, 0, 255)');
  });

  it('falls back to first color when input is unrecognized', () => {
    expect(interpolateColor('notacolor', '#ffffff', 0.5, 'rgb')).toBe('notacolor');
  });
});
