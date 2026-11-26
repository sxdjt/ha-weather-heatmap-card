import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THRESHOLDS_F,
  DEFAULT_THRESHOLDS_C,
  DEFAULT_THRESHOLDS_MPH,
  DEFAULT_THRESHOLDS_MS,
  DEFAULT_THRESHOLDS_KMH,
  DEFAULT_THRESHOLDS_KTS,
  getTemperatureThresholdsForUnit,
  getWindThresholdsForUnit,
  getWeatherConditionIcon,
  WEATHER_CONDITION_ICONS,
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
      assert.equal(Array.isArray(thresholds), true);
      assert.ok(thresholds.length > 0);
      thresholds.forEach(t => {
        assert.equal(typeof t.value, 'number');
        assert.equal(typeof t.color, 'string');
        assert.ok(t.color.length > 0);
      });
    });

    it(`${name}: values are sorted in ascending order`, () => {
      for (let i = 1; i < thresholds.length; i++) {
        assert.ok(thresholds[i].value > thresholds[i - 1].value);
      }
    });
  });
});

// ------------------------------------------------------------
// getTemperatureThresholdsForUnit
// ------------------------------------------------------------

describe('getTemperatureThresholdsForUnit', () => {
  it('returns Fahrenheit thresholds for "F"', () => {
    assert.deepEqual(getTemperatureThresholdsForUnit('F'), DEFAULT_THRESHOLDS_F);
  });

  it('returns Fahrenheit thresholds for "°F"', () => {
    assert.deepEqual(getTemperatureThresholdsForUnit('°F'), DEFAULT_THRESHOLDS_F);
  });

  it('returns Celsius thresholds for "C"', () => {
    assert.deepEqual(getTemperatureThresholdsForUnit('C'), DEFAULT_THRESHOLDS_C);
  });

  it('returns Celsius thresholds for "°C"', () => {
    assert.deepEqual(getTemperatureThresholdsForUnit('°C'), DEFAULT_THRESHOLDS_C);
  });

  it('returns Celsius thresholds for "celsius"', () => {
    assert.deepEqual(getTemperatureThresholdsForUnit('celsius'), DEFAULT_THRESHOLDS_C);
  });

  it('returns Fahrenheit thresholds for null (default)', () => {
    assert.deepEqual(getTemperatureThresholdsForUnit(null), DEFAULT_THRESHOLDS_F);
  });

  it('returns Fahrenheit thresholds for undefined (default)', () => {
    assert.deepEqual(getTemperatureThresholdsForUnit(undefined), DEFAULT_THRESHOLDS_F);
  });

  it('returns Fahrenheit thresholds for unrecognized unit', () => {
    assert.deepEqual(getTemperatureThresholdsForUnit('K'), DEFAULT_THRESHOLDS_F);
  });
});

// ------------------------------------------------------------
// getWindThresholdsForUnit
// ------------------------------------------------------------

describe('getWindThresholdsForUnit', () => {
  it('returns mph thresholds for "mph"', () => {
    assert.deepEqual(getWindThresholdsForUnit('mph'), DEFAULT_THRESHOLDS_MPH);
  });

  it('returns m/s thresholds for "m/s"', () => {
    assert.deepEqual(getWindThresholdsForUnit('m/s'), DEFAULT_THRESHOLDS_MS);
  });

  it('returns m/s thresholds for "mps"', () => {
    assert.deepEqual(getWindThresholdsForUnit('mps'), DEFAULT_THRESHOLDS_MS);
  });

  it('returns km/h thresholds for "km/h"', () => {
    assert.deepEqual(getWindThresholdsForUnit('km/h'), DEFAULT_THRESHOLDS_KMH);
  });

  it('returns km/h thresholds for "kph"', () => {
    assert.deepEqual(getWindThresholdsForUnit('kph'), DEFAULT_THRESHOLDS_KMH);
  });

  it('returns km/h thresholds for "kmh"', () => {
    assert.deepEqual(getWindThresholdsForUnit('kmh'), DEFAULT_THRESHOLDS_KMH);
  });

  it('returns knot thresholds for "kn"', () => {
    assert.deepEqual(getWindThresholdsForUnit('kn'), DEFAULT_THRESHOLDS_KTS);
  });

  it('returns knot thresholds for "kt"', () => {
    assert.deepEqual(getWindThresholdsForUnit('kt'), DEFAULT_THRESHOLDS_KTS);
  });

  it('returns knot thresholds for "kts"', () => {
    assert.deepEqual(getWindThresholdsForUnit('kts'), DEFAULT_THRESHOLDS_KTS);
  });

  it('returns knot thresholds for "knots"', () => {
    assert.deepEqual(getWindThresholdsForUnit('knots'), DEFAULT_THRESHOLDS_KTS);
  });

  it('returns mph thresholds for null (default)', () => {
    assert.deepEqual(getWindThresholdsForUnit(null), DEFAULT_THRESHOLDS_MPH);
  });

  it('returns mph thresholds for undefined (default)', () => {
    assert.deepEqual(getWindThresholdsForUnit(undefined), DEFAULT_THRESHOLDS_MPH);
  });

  it('returns mph thresholds for unrecognized unit', () => {
    assert.deepEqual(getWindThresholdsForUnit('furlongs'), DEFAULT_THRESHOLDS_MPH);
  });
});

// ------------------------------------------------------------
// getWeatherConditionIcon
// ------------------------------------------------------------

describe('getWeatherConditionIcon', () => {
  it('maps every known condition to a non-empty mdi icon name', () => {
    Object.entries(WEATHER_CONDITION_ICONS).forEach(([condition, icon]) => {
      assert.equal(getWeatherConditionIcon(condition), icon);
      assert.match(icon, /^mdi:/);
    });
  });

  it('returns the sunny icon for "sunny"', () => {
    assert.equal(getWeatherConditionIcon('sunny'), 'mdi:weather-sunny');
  });

  it('falls back to a generic icon for an unknown condition', () => {
    assert.equal(getWeatherConditionIcon('meteor-shower'), 'mdi:weather-cloudy');
  });

  it('falls back to a generic icon for null/undefined', () => {
    assert.equal(getWeatherConditionIcon(null), 'mdi:weather-cloudy');
    assert.equal(getWeatherConditionIcon(undefined), 'mdi:weather-cloudy');
  });
});

// ------------------------------------------------------------
// VERSION
// ------------------------------------------------------------

describe('VERSION', () => {
  it('is a non-empty string', () => {
    assert.equal(typeof VERSION, 'string');
    assert.ok(VERSION.length > 0);
  });

  it('follows semver format', () => {
    assert.match(VERSION, /^\d+\.\d+\.\d+/);
  });
});
