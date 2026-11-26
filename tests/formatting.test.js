import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
      assert.equal(formatHourLabel(0), '00');
      assert.equal(formatHourLabel(9), '09');
    });

    it('does not pad double-digit hours', () => {
      assert.equal(formatHourLabel(10), '10');
      assert.equal(formatHourLabel(23), '23');
    });
  });

  describe('12-hour format', () => {
    it('formats midnight as 12a', () => {
      assert.equal(formatHourLabel(0, '12'), '12a');
    });

    it('formats noon as 12p', () => {
      assert.equal(formatHourLabel(12, '12'), '12p');
    });

    it('formats AM hours', () => {
      assert.equal(formatHourLabel(1, '12'), '1a');
      assert.equal(formatHourLabel(11, '12'), '11a');
    });

    it('formats PM hours', () => {
      assert.equal(formatHourLabel(13, '12'), '1p');
      assert.equal(formatHourLabel(23, '12'), '11p');
    });
  });
});

// ------------------------------------------------------------
// degreesToCardinal
// ------------------------------------------------------------

describe('degreesToCardinal', () => {
  it('returns N for 0 degrees', () => {
    assert.equal(degreesToCardinal(0), 'N');
  });

  it('returns cardinal directions at 45-degree steps', () => {
    assert.equal(degreesToCardinal(45), 'NE');
    assert.equal(degreesToCardinal(90), 'E');
    assert.equal(degreesToCardinal(135), 'SE');
    assert.equal(degreesToCardinal(180), 'S');
    assert.equal(degreesToCardinal(225), 'SW');
    assert.equal(degreesToCardinal(270), 'W');
    assert.equal(degreesToCardinal(315), 'NW');
  });

  it('rounds to nearest cardinal', () => {
    // Math.round(22/45) = Math.round(0.489) = 0 -> N
    assert.equal(degreesToCardinal(22), 'N');
    // Math.round(23/45) = Math.round(0.511) = 1 -> NE
    assert.equal(degreesToCardinal(23), 'NE');
  });
});

// ------------------------------------------------------------
// degreesToArrow
// ------------------------------------------------------------

describe('degreesToArrow', () => {
  // Wind FROM north (0 deg) blows TO south -> down arrow
  it('wind FROM north points arrow south (down)', () => {
    assert.equal(degreesToArrow(0), '\u2193');
  });

  // Wind FROM south (180 deg) blows TO north -> up arrow
  it('wind FROM south points arrow north (up)', () => {
    assert.equal(degreesToArrow(180), '\u2191');
  });

  // Wind FROM east (90 deg) blows TO west -> left arrow
  it('wind FROM east points arrow west (left)', () => {
    assert.equal(degreesToArrow(90), '\u2190');
  });

  // Wind FROM west (270 deg) blows TO east -> right arrow
  it('wind FROM west points arrow east (right)', () => {
    assert.equal(degreesToArrow(270), '\u2192');
  });
});

// ------------------------------------------------------------
// formatDirection
// ------------------------------------------------------------

describe('formatDirection', () => {
  it('returns empty string for null', () => {
    assert.equal(formatDirection(null, 'arrow'), '');
  });

  it('returns empty string for undefined', () => {
    assert.equal(formatDirection(undefined, 'cardinal'), '');
  });

  it('formats as arrow', () => {
    assert.equal(formatDirection(180, 'arrow'), '\u2191'); // FROM south -> points north
  });

  it('formats as cardinal', () => {
    assert.equal(formatDirection(90, 'cardinal'), 'E');
  });

  it('formats as degrees', () => {
    assert.equal(formatDirection(270, 'degrees'), '270deg');
    assert.equal(formatDirection(22.7, 'degrees'), '23deg');
  });

  it('returns empty string for unknown format', () => {
    assert.equal(formatDirection(90, 'unknown'), '');
  });
});

// ------------------------------------------------------------
// normalizeSize
// ------------------------------------------------------------

describe('normalizeSize', () => {
  it('appends px to numbers', () => {
    assert.equal(normalizeSize(36), '36px');
    assert.equal(normalizeSize(0), '0px');
  });

  it('passes strings through unchanged', () => {
    assert.equal(normalizeSize('1fr'), '1fr');
    assert.equal(normalizeSize('100px'), '100px');
  });

  it('returns default for null', () => {
    assert.equal(normalizeSize(null, '36px'), '36px');
  });

  it('returns default for undefined', () => {
    assert.equal(normalizeSize(undefined, '1fr'), '1fr');
  });

  it('returns default for empty string', () => {
    assert.equal(normalizeSize('', '36px'), '36px');
  });
});

// ------------------------------------------------------------
// getDateKey
// ------------------------------------------------------------

describe('getDateKey', () => {
  it('formats date as YYYY-MM-DD', () => {
    // Use a fixed local date to avoid timezone issues in CI
    const d = new Date(2024, 0, 5); // January 5, 2024 (month is 0-indexed)
    assert.equal(getDateKey(d), '2024-01-05');
  });

  it('pads month and day with leading zeros', () => {
    const d = new Date(2024, 8, 3); // September 3
    assert.equal(getDateKey(d), '2024-09-03');
  });
});

// ------------------------------------------------------------
// getHourBucket
// ------------------------------------------------------------

describe('getHourBucket', () => {
  it('buckets into 1-hour intervals', () => {
    assert.equal(getHourBucket(7, 1), 7);
    assert.equal(getHourBucket(0, 1), 0);
  });

  it('buckets into 2-hour intervals', () => {
    assert.equal(getHourBucket(0, 2), 0);
    assert.equal(getHourBucket(1, 2), 0);
    assert.equal(getHourBucket(2, 2), 2);
    assert.equal(getHourBucket(7, 2), 6);
    assert.equal(getHourBucket(23, 2), 22);
  });

  it('buckets into 6-hour intervals', () => {
    assert.equal(getHourBucket(0, 6), 0);
    assert.equal(getHourBucket(5, 6), 0);
    assert.equal(getHourBucket(6, 6), 6);
    assert.equal(getHourBucket(11, 6), 6);
    assert.equal(getHourBucket(23, 6), 18);
  });

  it('buckets into 12-hour intervals', () => {
    assert.equal(getHourBucket(0, 12), 0);
    assert.equal(getHourBucket(11, 12), 0);
    assert.equal(getHourBucket(12, 12), 12);
    assert.equal(getHourBucket(23, 12), 12);
  });
});

// ------------------------------------------------------------
// averageDirection
// ------------------------------------------------------------

describe('averageDirection', () => {
  it('returns null for empty array', () => {
    assert.equal(averageDirection([]), null);
  });

  it('returns the same value for a single direction', () => {
    assert.equal(averageDirection([90]), 90);
    assert.equal(averageDirection([0]), 0);
  });

  it('averages simple non-wrapping directions', () => {
    assert.equal(averageDirection([80, 100]), 90);
    assert.equal(averageDirection([10, 20, 30]), 20);
  });

  it('correctly handles the 0/360 wrap-around (the circular mean problem)', () => {
    // Simple arithmetic average of 350 and 10 would give 180 (south) - wrong
    // Circular mean should give north (0 or 360 are equivalent)
    const result = averageDirection([350, 10]);
    assert.equal(result === 0 || result === 360, true);
  });

  it('handles wrap-around with multiple directions near north', () => {
    const result = averageDirection([355, 5, 350, 10]);
    // All near north; result should be near 0/360
    assert.equal(result === 0 || result === 360 || (result >= 355 || result <= 5), true);
  });

  it('handles all-same directions', () => {
    assert.equal(averageDirection([90, 90, 90]), 90);
    assert.equal(averageDirection([270, 270]), 270);
  });
});
