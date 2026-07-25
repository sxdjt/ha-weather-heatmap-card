// Entry point: register all custom elements and announce card to Home Assistant

import { SensorHeatmapCard } from './weather-heatmap-card.js';
import { SensorHeatmapCardEditor } from './editor.js';
import { VERSION } from './constants.js';

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

    // Suggest this card when the user picks a sensor whose device_class matches
    // a supported card_type. Only these three device classes are a clear fit -
    // generic sensors are not suggested since there is no device class to match on.
    getEntitySuggestion: (hass, entityId) => {
      const entityState = hass.states[entityId];
      if (!entityState) return null;

      if (entityId.split('.')[0] !== 'sensor') return null;

      const deviceClass = entityState.attributes.device_class;

      if (deviceClass === 'temperature') {
        return { config: { type: 'custom:ha-weather-heatmap-card', entity: entityId, card_type: 'temperature' } };
      }
      if (deviceClass === 'wind_speed') {
        return { config: { type: 'custom:ha-weather-heatmap-card', entity: entityId, card_type: 'windspeed' } };
      }
      if (deviceClass === 'humidity') {
        return { config: { type: 'custom:ha-weather-heatmap-card', entity: entityId, card_type: 'humidity' } };
      }

      return null;
    }
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
  '%c WEATHER-HEATMAP-CARD %c ' + VERSION + ' ',
  'color: black; background: #F2720C; font-weight: 600;',
  'color: black; background: #00a5c9; font-weight: 600;'
);
