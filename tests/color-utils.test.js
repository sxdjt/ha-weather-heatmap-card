import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
    assert.deepEqual(parseColor('#ff0000'), { r: 255, g: 0, b: 0 });
    assert.deepEqual(parseColor('#1a237e'), { r: 26, g: 35, b: 126 });
  });

  it('parses rgb()', () => {
    assert.deepEqual(parseColor('rgb(100, 200, 50)'), { r: 100, g: 200, b: 50 });
  });

  it('parses rgba()', () => {
    assert.deepEqual(parseColor('rgba(30, 136, 229, 1)'), { r: 30, g: 136, b: 229 });
  });

  it('returns null for unrecognized format', () => {
    assert.equal(parseColor('hsl(120, 50%, 50%)'), null);
    assert.equal(parseColor('notacolor'), null);
  });
});

// ------------------------------------------------------------
// rgbaToHex
// ------------------------------------------------------------

describe('rgbaToHex', () => {
  it('passes hex through unchanged', () => {
    assert.equal(rgbaToHex('#abc123'), '#abc123');
  });

  it('converts rgb() to hex', () => {
    assert.equal(rgbaToHex('rgb(255, 0, 0)'), '#ff0000');
  });

  it('converts rgba() to hex (ignores alpha)', () => {
    assert.equal(rgbaToHex('rgba(0, 255, 0, 0.5)'), '#00ff00');
  });

  it('returns #ffffff for unrecognized input', () => {
    assert.equal(rgbaToHex('notacolor'), '#ffffff');
  });
});

// ------------------------------------------------------------
// getContrastTextColor
// ------------------------------------------------------------

describe('getContrastTextColor', () => {
  it('returns black for a light background', () => {
    assert.equal(getContrastTextColor('#ffffff'), '#000000');
    assert.equal(getContrastTextColor('#ffeb3b'), '#000000'); // yellow
  });

  it('returns white for a dark background', () => {
    assert.equal(getContrastTextColor('#000000'), '#ffffff');
    assert.equal(getContrastTextColor('#1a237e'), '#ffffff'); // dark blue
  });

  it('picks black on mid-tone fills where white is under 4.5:1', () => {
    assert.equal(getContrastTextColor('#f44336'), '#000000'); // red: white 3.7:1, black 5.7:1
    assert.equal(getContrastTextColor('rgba(244, 81, 30, 1)'), '#000000'); // Force 10: white 3.5:1
    assert.equal(getContrastTextColor('rgba(30, 136, 229, 1)'), '#000000'); // Force 4: white 3.7:1
  });

  it('gives at least 4.5:1 on every default threshold fill', async () => {
    const constants = await import('../src/constants.js');
    const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    const fills = Object.values(constants).filter(Array.isArray).flat()
      .map((t) => t && t.color).filter((c) => typeof c === 'string');
    assert.ok(fills.length > 0);
    for (const fill of fills) {
      const hex = rgbaToHex(fill);
      const rgb = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
      const text = getContrastTextColor(fill) === '#000000' ? [0, 0, 0] : [255, 255, 255];
      assert.ok(ratio(rgb, text), fill >= 4.5);
    }
  });

  it('handles rgba() format', () => {
    assert.equal(getContrastTextColor('rgba(255, 255, 255, 1)'), '#000000');
    assert.equal(getContrastTextColor('rgba(0, 0, 0, 1)'), '#ffffff');
  });

  it('returns CSS variable for var() colors', () => {
    assert.equal(getContrastTextColor('var(--primary-color)'), 'var(--primary-text-color)');
  });

  it('falls back to CSS variable for unrecognized format', () => {
    assert.equal(getContrastTextColor('notacolor'), 'var(--primary-text-color)');
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
    assert.ok(result.includes('disabled'));
  });

  it('returns disabled color for undefined', () => {
    const result = getColorForValue(undefined, THRESHOLDS);
    assert.ok(result.includes('disabled'));
  });

  it('returns first threshold color for value below minimum', () => {
    assert.equal(getColorForValue(-10, THRESHOLDS), '#0000ff');
  });

  it('returns color for exact threshold match', () => {
    assert.equal(getColorForValue(50, THRESHOLDS), '#00ff00');
  });

  it('returns correct color between thresholds', () => {
    // 75 is between 50 and 100 - should use the 50 threshold color
    assert.equal(getColorForValue(75, THRESHOLDS), '#00ff00');
  });

  it('returns last threshold color for value above maximum', () => {
    assert.equal(getColorForValue(200, THRESHOLDS), '#ff0000');
  });
});

describe('getColorForValue - interpolation mode', () => {
  it('returns first color for value at or below minimum', () => {
    assert.equal(getColorForValue(0, THRESHOLDS, true), '#0000ff');
    assert.equal(getColorForValue(-5, THRESHOLDS, true), '#0000ff');
  });

  it('returns last color for value at or above maximum', () => {
    assert.equal(getColorForValue(100, THRESHOLDS, true), '#ff0000');
    assert.equal(getColorForValue(150, THRESHOLDS, true), '#ff0000');
  });

  it('returns an interpolated rgb() string for midpoint value', () => {
    const result = getColorForValue(25, THRESHOLDS, true, 'rgb');
    assert.match(result, /^rgb\(/);
  });

  it('produces distinct interpolated colors at different points', () => {
    const a = getColorForValue(10, THRESHOLDS, true, 'hsl');
    const b = getColorForValue(40, THRESHOLDS, true, 'hsl');
    assert.notEqual(a, b);
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
    assert.equal(result, 'rgb(128, 128, 128)');
  });

  it('gamma: returns an rgb() string', () => {
    const result = interpolateColor(black, white, 0.5, 'gamma');
    assert.match(result, /^rgb\(/);
  });

  it('hsl: returns an rgb() string', () => {
    const result = interpolateColor(black, white, 0.5, 'hsl');
    assert.match(result, /^rgb\(/);
  });

  it('lab: returns an rgb() string', () => {
    const result = interpolateColor(black, white, 0.5, 'lab');
    assert.match(result, /^rgb\(/);
  });

  it('t=0 returns first color', () => {
    assert.equal(interpolateColor('#ff0000', '#0000ff', 0, 'rgb'), 'rgb(255, 0, 0)');
  });

  it('t=1 returns second color', () => {
    assert.equal(interpolateColor('#ff0000', '#0000ff', 1, 'rgb'), 'rgb(0, 0, 255)');
  });

  it('falls back to first color when input is unrecognized', () => {
    assert.equal(interpolateColor('notacolor', '#ffffff', 0.5, 'rgb'), 'notacolor');
  });
});

// Branch coverage for the color-space math (review sweep, step 6)
import { rgbToHsl, hslToRgb, interpolateHSL, labToRgb, rgbToLab } from '../src/color-utils.js';

const rgbOf = (str) => str.match(/\d+/g).slice(0, 3).map(Number);

describe('color-space branches', () => {
  it('rgbToHsl: light colors and red hues with blue above green', () => {
    const { h, s: sat, l } = rgbToHsl({ r: 255, g: 200, b: 220 });
    assert.ok(l > 0.5 && sat > 0 && h > 300);
  });

  it('hslToRgb covers every 60-degree sector', () => {
    const at = (h) => { const c = hslToRgb({ h, s: 1, l: 0.5 }); return [c.r, c.g, c.b].map(Math.round); };
    assert.deepEqual([at(90), at(210)], [[128, 255, 0], [0, 128, 255]]);
  });

  it('interpolateHSL takes the short way round and wraps the hue', () => {
    const [r1, , b1] = rgbOf(interpolateHSL({ r: 255, g: 0, b: 64 }, { r: 255, g: 64, b: 0 }, 0.5));
    assert.ok(r1 > 200 && b1 < 64);
    const [r2] = rgbOf(interpolateHSL({ r: 255, g: 64, b: 0 }, { r: 255, g: 0, b: 64 }, 0.9));
    assert.ok(r2 > 200);
  });

  it('labToRgb handles very dark colors (linear segments)', () => {
    const black = labToRgb(rgbToLab({ r: 1, g: 1, b: 1 }));
    assert.deepEqual([black.r, black.g, black.b].map(Math.round), [1, 1, 1]);
    const dark = labToRgb({ L: 1, a: 0, b: 0 });
    assert.ok(dark.r <= 5);
  });

  it('an unknown interpolation method uses HSL; a NaN value gets the top color; no thresholds give the neutral fill', () => {
    assert.equal(interpolateColor('#ff0000', '#0000ff', 0.5, 'bogus'), interpolateColor('#ff0000', '#0000ff', 0.5, 'hsl'));
    const t = [{ value: 0, color: '#000000' }, { value: 10, color: '#ffffff' }];
    assert.equal(getColorForValue(NaN, t, true), '#ffffff');
    assert.equal(getColorForValue(5, []), 'var(--secondary-background-color, #e0e0e0)');
    assert.equal(getColorForValue(5, undefined), 'var(--secondary-background-color, #e0e0e0)');
  });
});
