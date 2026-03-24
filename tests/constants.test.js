import { describe, it, expect } from 'vitest';
import {
  DEFAULT_THRESHOLDS_F,
  DEFAULT_THRESHOLDS_C,
  DEFAULT_THRESHOLDS_MPH,
  DEFAULT_THRESHOLDS_MS,
  DEFAULT_THRESHOLDS_KMH,
  DEFAULT_THRESHOLDS_KTS,
  getTemperatureThresholdsForUnit,
  getWindThresholdsForUnit,
  VERSION,
} from '../src/constants.js';

// ------------------------------------------------------------
// Threshold structure sanity checks
// ------------------------------------------------------------

describe('threshold arrays', () => {
  const sets = [
    ['F', DEFAULT_THRESHOLDS_F],
    ['C', DEFAULT_THRESHOLDS_C],
    ['mph', DEFAULT_THRESHOLDS_MPH],
    ['m/s', DEFAULT_THRESHOLDS_MS],
    ['km/h', DEFAULT_THRESHOLDS_KMH],
    ['kts', DEFAULT_THRESHOLDS_KTS],
  ];

  sets.forEach(([name, thresholds]) => {
    it(`${name}: is a non-empty array of {value, color} objects`, () => {
      expect(Array.isArray(thresholds)).toBe(true);
      expect(thresholds.length).toBeGreaterThan(0);
      thresholds.forEach(t => {
        expect(typeof t.value).toBe('number');
        expect(typeof t.color).toBe('string');
        expect(t.color.length).toBeGreaterThan(0);
      });
    });

    it(`${name}: values are sorted in ascending order`, () => {
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i].value).toBeGreaterThan(thresholds[i - 1].value);
      }
    });
  });
});

// ------------------------------------------------------------
// getTemperatureThresholdsForUnit
// ------------------------------------------------------------

describe('getTemperatureThresholdsForUnit', () => {
  it('returns Fahrenheit thresholds for "F"', () => {
    expect(getTemperatureThresholdsForUnit('F')).toEqual(DEFAULT_THRESHOLDS_F);
  });

  it('returns Fahrenheit thresholds for "°F"', () => {
    expect(getTemperatureThresholdsForUnit('°F')).toEqual(DEFAULT_THRESHOLDS_F);
  });

  it('returns Celsius thresholds for "C"', () => {
    expect(getTemperatureThresholdsForUnit('C')).toEqual(DEFAULT_THRESHOLDS_C);
  });

  it('returns Celsius thresholds for "°C"', () => {
    expect(getTemperatureThresholdsForUnit('°C')).toEqual(DEFAULT_THRESHOLDS_C);
  });

  it('returns Celsius thresholds for "celsius"', () => {
    expect(getTemperatureThresholdsForUnit('celsius')).toEqual(DEFAULT_THRESHOLDS_C);
  });

  it('returns Fahrenheit thresholds for null (default)', () => {
    expect(getTemperatureThresholdsForUnit(null)).toEqual(DEFAULT_THRESHOLDS_F);
  });

  it('returns Fahrenheit thresholds for undefined (default)', () => {
    expect(getTemperatureThresholdsForUnit(undefined)).toEqual(DEFAULT_THRESHOLDS_F);
  });

  it('returns Fahrenheit thresholds for unrecognized unit', () => {
    expect(getTemperatureThresholdsForUnit('K')).toEqual(DEFAULT_THRESHOLDS_F);
  });
});

// ------------------------------------------------------------
// getWindThresholdsForUnit
// ------------------------------------------------------------

describe('getWindThresholdsForUnit', () => {
  it('returns mph thresholds for "mph"', () => {
    expect(getWindThresholdsForUnit('mph')).toEqual(DEFAULT_THRESHOLDS_MPH);
  });

  it('returns m/s thresholds for "m/s"', () => {
    expect(getWindThresholdsForUnit('m/s')).toEqual(DEFAULT_THRESHOLDS_MS);
  });

  it('returns m/s thresholds for "mps"', () => {
    expect(getWindThresholdsForUnit('mps')).toEqual(DEFAULT_THRESHOLDS_MS);
  });

  it('returns km/h thresholds for "km/h"', () => {
    expect(getWindThresholdsForUnit('km/h')).toEqual(DEFAULT_THRESHOLDS_KMH);
  });

  it('returns km/h thresholds for "kph"', () => {
    expect(getWindThresholdsForUnit('kph')).toEqual(DEFAULT_THRESHOLDS_KMH);
  });

  it('returns km/h thresholds for "kmh"', () => {
    expect(getWindThresholdsForUnit('kmh')).toEqual(DEFAULT_THRESHOLDS_KMH);
  });

  it('returns knot thresholds for "kn"', () => {
    expect(getWindThresholdsForUnit('kn')).toEqual(DEFAULT_THRESHOLDS_KTS);
  });

  it('returns knot thresholds for "kt"', () => {
    expect(getWindThresholdsForUnit('kt')).toEqual(DEFAULT_THRESHOLDS_KTS);
  });

  it('returns knot thresholds for "kts"', () => {
    expect(getWindThresholdsForUnit('kts')).toEqual(DEFAULT_THRESHOLDS_KTS);
  });

  it('returns knot thresholds for "knots"', () => {
    expect(getWindThresholdsForUnit('knots')).toEqual(DEFAULT_THRESHOLDS_KTS);
  });

  it('returns mph thresholds for null (default)', () => {
    expect(getWindThresholdsForUnit(null)).toEqual(DEFAULT_THRESHOLDS_MPH);
  });

  it('returns mph thresholds for undefined (default)', () => {
    expect(getWindThresholdsForUnit(undefined)).toEqual(DEFAULT_THRESHOLDS_MPH);
  });

  it('returns mph thresholds for unrecognized unit', () => {
    expect(getWindThresholdsForUnit('furlongs')).toEqual(DEFAULT_THRESHOLDS_MPH);
  });
});

// ------------------------------------------------------------
// VERSION
// ------------------------------------------------------------

describe('VERSION', () => {
  it('is a non-empty string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION.length).toBeGreaterThan(0);
  });

  it('follows semver format', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
