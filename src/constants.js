// Color threshold constants for temperature and wind speed

// --- Temperature thresholds (Fahrenheit) ---
export const DEFAULT_THRESHOLDS_F = [
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
export const DEFAULT_THRESHOLDS_C = [
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

// Backward compatibility aliases
export const DEFAULT_THRESHOLDS = DEFAULT_THRESHOLDS_F;
export const DEFAULT_THRESHOLDS_CELSIUS = DEFAULT_THRESHOLDS_C;

// --- Humidity thresholds (percentage, 0-100%) ---
// Comfort zones: symmetric red-orange-yellow-green-yellow-orange-red
// Both extremes (very dry / very humid) are uncomfortable; 40-55% is ideal
export const DEFAULT_THRESHOLDS_HUMIDITY = [
  { value: 0,  color: '#f44336' },  // 0%: Very dry (red)
  { value: 20, color: '#ff9800' },  // 20%: Dry (orange)
  { value: 30, color: '#ffeb3b' },  // 30%: Slightly dry (yellow)
  { value: 45, color: '#4caf50' },  // 45%: Ideal (green)
  { value: 60, color: '#ffeb3b' },  // 60%: Slightly humid (yellow)
  { value: 70, color: '#ff9800' },  // 70%: Humid (orange)
  { value: 85, color: '#f44336' },  // 85%: Very humid (red)
];

// --- Wind speed thresholds based on Beaufort scale ---

export const DEFAULT_THRESHOLDS_MPH = [
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

export const DEFAULT_THRESHOLDS_MS = [
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

export const DEFAULT_THRESHOLDS_KMH = [
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

export const DEFAULT_THRESHOLDS_KTS = [
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
export function getTemperatureThresholdsForUnit(unit) {
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
export function getWindThresholdsForUnit(unit) {
  if (!unit) return DEFAULT_THRESHOLDS_MPH;
  const u = unit.toLowerCase().trim();
  if (u === 'm/s' || u === 'mps') return DEFAULT_THRESHOLDS_MS;
  if (u === 'km/h' || u === 'kph' || u === 'kmh') return DEFAULT_THRESHOLDS_KMH;
  if (u === 'kn' || u === 'kt' || u === 'kts' || u === 'knot' || u === 'knots') return DEFAULT_THRESHOLDS_KTS;
  return DEFAULT_THRESHOLDS_MPH;
}

// Card version
export const VERSION = '1.3.1';
