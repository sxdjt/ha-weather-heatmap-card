// Formatting and utility functions

/**
 * Escape HTML to prevent XSS via textContent/innerHTML conversion.
 * @param {string} text - Text to escape
 * @returns {string} - HTML-escaped text
 */
export function escapeHtml(text) {
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
export function formatHourLabel(hour, format = '24') {
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
export function degreesToArrow(degrees) {
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
export function degreesToCardinal(degrees) {
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
export function formatDirection(degrees, format) {
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
export function normalizeSize(value, defaultValue) {
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
export function getDateKey(date) {
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
export function getHourBucket(hour, intervalHours) {
  return Math.floor(hour / intervalHours) * intervalHours;
}

/**
 * Calculate circular mean for wind direction angles.
 * Uses vector averaging to correctly handle the 0/360 degree wrap-around.
 * @param {Array<number>} directions - Array of direction values in degrees
 * @returns {number|null} - Average direction in degrees (0-360) or null if empty
 */
export function averageDirection(directions) {
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
