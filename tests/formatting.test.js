import { describe, it, expect } from 'vitest';
import {
  formatHourLabel,
  degreesToCardinal,
  degreesToArrow,
  formatDirection,
  normalizeSize,
  getDateKey,
  getHourBucket,
  averageDirection,
} from '../src/formatting.js';

// NOTE: escapeHtml uses document.createElement and requires a DOM environment.
// It is a one-liner that delegates entirely to the browser's built-in text escaping,
// so it is not tested here.

// ------------------------------------------------------------
// formatHourLabel
// ------------------------------------------------------------

describe('formatHourLabel', () => {
  describe('24-hour format (default)', () => {
    it('pads single-digit hours', () => {
      expect(formatHourLabel(0)).toBe('00');
      expect(formatHourLabel(9)).toBe('09');
    });

    it('does not pad double-digit hours', () => {
      expect(formatHourLabel(10)).toBe('10');
      expect(formatHourLabel(23)).toBe('23');
    });
  });

  describe('12-hour format', () => {
    it('formats midnight as 12a', () => {
      expect(formatHourLabel(0, '12')).toBe('12a');
    });

    it('formats noon as 12p', () => {
      expect(formatHourLabel(12, '12')).toBe('12p');
    });

    it('formats AM hours', () => {
      expect(formatHourLabel(1, '12')).toBe('1a');
      expect(formatHourLabel(11, '12')).toBe('11a');
    });

    it('formats PM hours', () => {
      expect(formatHourLabel(13, '12')).toBe('1p');
      expect(formatHourLabel(23, '12')).toBe('11p');
    });
  });
});

// ------------------------------------------------------------
// degreesToCardinal
// ------------------------------------------------------------

describe('degreesToCardinal', () => {
  it('returns N for 0 degrees', () => {
    expect(degreesToCardinal(0)).toBe('N');
  });

  it('returns cardinal directions at 45-degree steps', () => {
    expect(degreesToCardinal(45)).toBe('NE');
    expect(degreesToCardinal(90)).toBe('E');
    expect(degreesToCardinal(135)).toBe('SE');
    expect(degreesToCardinal(180)).toBe('S');
    expect(degreesToCardinal(225)).toBe('SW');
    expect(degreesToCardinal(270)).toBe('W');
    expect(degreesToCardinal(315)).toBe('NW');
  });

  it('rounds to nearest cardinal', () => {
    // Math.round(22/45) = Math.round(0.489) = 0 -> N
    expect(degreesToCardinal(22)).toBe('N');
    // Math.round(23/45) = Math.round(0.511) = 1 -> NE
    expect(degreesToCardinal(23)).toBe('NE');
  });
});

// ------------------------------------------------------------
// degreesToArrow
// ------------------------------------------------------------

describe('degreesToArrow', () => {
  // Wind FROM north (0 deg) blows TO south -> down arrow
  it('wind FROM north points arrow south (down)', () => {
    expect(degreesToArrow(0)).toBe('\u2193');
  });

  // Wind FROM south (180 deg) blows TO north -> up arrow
  it('wind FROM south points arrow north (up)', () => {
    expect(degreesToArrow(180)).toBe('\u2191');
  });

  // Wind FROM east (90 deg) blows TO west -> left arrow
  it('wind FROM east points arrow west (left)', () => {
    expect(degreesToArrow(90)).toBe('\u2190');
  });

  // Wind FROM west (270 deg) blows TO east -> right arrow
  it('wind FROM west points arrow east (right)', () => {
    expect(degreesToArrow(270)).toBe('\u2192');
  });
});

// ------------------------------------------------------------
// formatDirection
// ------------------------------------------------------------

describe('formatDirection', () => {
  it('returns empty string for null', () => {
    expect(formatDirection(null, 'arrow')).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDirection(undefined, 'cardinal')).toBe('');
  });

  it('formats as arrow', () => {
    expect(formatDirection(180, 'arrow')).toBe('\u2191'); // FROM south -> points north
  });

  it('formats as cardinal', () => {
    expect(formatDirection(90, 'cardinal')).toBe('E');
  });

  it('formats as degrees', () => {
    expect(formatDirection(270, 'degrees')).toBe('270deg');
    expect(formatDirection(22.7, 'degrees')).toBe('23deg');
  });

  it('returns empty string for unknown format', () => {
    expect(formatDirection(90, 'unknown')).toBe('');
  });
});

// ------------------------------------------------------------
// normalizeSize
// ------------------------------------------------------------

describe('normalizeSize', () => {
  it('appends px to numbers', () => {
    expect(normalizeSize(36)).toBe('36px');
    expect(normalizeSize(0)).toBe('0px');
  });

  it('passes strings through unchanged', () => {
    expect(normalizeSize('1fr')).toBe('1fr');
    expect(normalizeSize('100px')).toBe('100px');
  });

  it('returns default for null', () => {
    expect(normalizeSize(null, '36px')).toBe('36px');
  });

  it('returns default for undefined', () => {
    expect(normalizeSize(undefined, '1fr')).toBe('1fr');
  });

  it('returns default for empty string', () => {
    expect(normalizeSize('', '36px')).toBe('36px');
  });
});

// ------------------------------------------------------------
// getDateKey
// ------------------------------------------------------------

describe('getDateKey', () => {
  it('formats date as YYYY-MM-DD', () => {
    // Use a fixed local date to avoid timezone issues in CI
    const d = new Date(2024, 0, 5); // January 5, 2024 (month is 0-indexed)
    expect(getDateKey(d)).toBe('2024-01-05');
  });

  it('pads month and day with leading zeros', () => {
    const d = new Date(2024, 8, 3); // September 3
    expect(getDateKey(d)).toBe('2024-09-03');
  });
});

// ------------------------------------------------------------
// getHourBucket
// ------------------------------------------------------------

describe('getHourBucket', () => {
  it('buckets into 1-hour intervals', () => {
    expect(getHourBucket(7, 1)).toBe(7);
    expect(getHourBucket(0, 1)).toBe(0);
  });

  it('buckets into 2-hour intervals', () => {
    expect(getHourBucket(0, 2)).toBe(0);
    expect(getHourBucket(1, 2)).toBe(0);
    expect(getHourBucket(2, 2)).toBe(2);
    expect(getHourBucket(7, 2)).toBe(6);
    expect(getHourBucket(23, 2)).toBe(22);
  });

  it('buckets into 6-hour intervals', () => {
    expect(getHourBucket(0, 6)).toBe(0);
    expect(getHourBucket(5, 6)).toBe(0);
    expect(getHourBucket(6, 6)).toBe(6);
    expect(getHourBucket(11, 6)).toBe(6);
    expect(getHourBucket(23, 6)).toBe(18);
  });

  it('buckets into 12-hour intervals', () => {
    expect(getHourBucket(0, 12)).toBe(0);
    expect(getHourBucket(11, 12)).toBe(0);
    expect(getHourBucket(12, 12)).toBe(12);
    expect(getHourBucket(23, 12)).toBe(12);
  });
});

// ------------------------------------------------------------
// averageDirection
// ------------------------------------------------------------

describe('averageDirection', () => {
  it('returns null for empty array', () => {
    expect(averageDirection([])).toBeNull();
  });

  it('returns the same value for a single direction', () => {
    expect(averageDirection([90])).toBe(90);
    expect(averageDirection([0])).toBe(0);
  });

  it('averages simple non-wrapping directions', () => {
    expect(averageDirection([80, 100])).toBe(90);
    expect(averageDirection([10, 20, 30])).toBe(20);
  });

  it('correctly handles the 0/360 wrap-around (the circular mean problem)', () => {
    // Simple arithmetic average of 350 and 10 would give 180 (south) - wrong
    // Circular mean should give north (0 or 360 are equivalent)
    const result = averageDirection([350, 10]);
    expect(result === 0 || result === 360).toBe(true);
  });

  it('handles wrap-around with multiple directions near north', () => {
    const result = averageDirection([355, 5, 350, 10]);
    // All near north; result should be near 0/360
    expect(result === 0 || result === 360 || (result >= 355 || result <= 5)).toBe(true);
  });

  it('handles all-same directions', () => {
    expect(averageDirection([90, 90, 90])).toBe(90);
    expect(averageDirection([270, 270])).toBe(270);
  });
});
