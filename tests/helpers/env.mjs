// Test environment for the card and editor (src/), in a happy-dom window.
//
// The utility tests (color-utils, constants, formatting) import src/ modules directly
// and need no DOM. Card and editor tests import this helper first: it sets up the
// window, then loads src/index.js, which registers every element the bundle registers.
// The shipped dist/ha-weather-heatmap-card.js is a plain rollup concatenation of src/.
//
// No network: hass.callWS / hass.callApi are fakes answering from `data`.
//
// IMPORTANT: never pass a DOM node to assert. A failing assertion inspects the node,
// which walks the whole happy-dom window without end (see tests/README.md).

import { Window } from 'happy-dom';

process.env.TZ = 'UTC';

export const window = new Window({
  url: 'http://localhost:8123/lovelace/0',
  settings: {
    disableJavaScriptEvaluation: true,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
    handleDisabledFileLoadingAsSuccess: true,
  },
});
for (const key of ['document', 'HTMLElement', 'customElements', 'CustomEvent', 'Event', 'KeyboardEvent', 'CSS']) {
  globalThis[key] = window[key];
}
globalThis.window = window;

// Polling intervals and tooltip timers must not keep the run alive
const realSetInterval = globalThis.setInterval;
const realSetTimeout = globalThis.setTimeout;
globalThis.setInterval = (...a) => { const t = realSetInterval(...a); t.unref?.(); return t; };
globalThis.setTimeout = (...a) => { const t = realSetTimeout(...a); t.unref?.(); return t; };

// happy-dom's CSS.supports accepts anything; deterministic stand-in for ('color', v).
// window.CSS returns a new object on each access, so patch the global the code reads.
const NAMED = new Set(['red', 'green', 'blue', 'black', 'white', 'gray', 'orange', 'yellow', 'transparent']);
globalThis.CSS.supports = (property, value) => {
  if (property !== 'color') throw new Error(`CSS.supports stand-in only handles 'color', got '${property}'`);
  const v = String(value).trim().toLowerCase();
  return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(v) || /^(rgb|rgba|hsl|hsla|var)\(.+\)$/.test(v) || NAMED.has(v);
};

// The editor awaits HA's loadCardHelpers before building
window.loadCardHelpers = async () => ({ createCardElement: async () => ({ constructor: { getConfigElement: async () => {} } }) });

await import('../../src/index.js');

export const document = window.document;
export const Card = window.customElements.get('ha-weather-heatmap-card');
export const Editor = window.customElements.get('ha-weather-heatmap-card-editor');

// --- fixtures ---

export const settle = async (rounds = 5) => { for (let i = 0; i < rounds; i++) await new Promise((r) => setImmediate(r)); };

// A fake hass. `stats` answers recorder/statistics_during_period (id -> rows),
// `history` answers history/period (id -> [{ state, last_changed }]),
// `forecast` answers weather.get_forecasts (entity -> forecast list).
export function makeHass({ states = {}, stats = {}, history = {}, forecast = {} } = {}) {
  const calls = { ws: [], api: [] };
  return {
    states, calls, themes: { darkMode: false },
    callWS: async (msg) => {
      calls.ws.push(msg);
      if (msg.type === 'recorder/statistics_during_period') {
        return Object.fromEntries(msg.statistic_ids.filter((id) => stats[id]).map((id) => [id, stats[id]]));
      }
      if (msg.type === 'call_service' && msg.service === 'get_forecasts') {
        const id = msg.target.entity_id;
        return { response: { [id]: { forecast: forecast[id] || [] } } };
      }
      throw new Error(`unexpected callWS ${msg.type}`);
    },
    callApi: async (method, url) => {
      calls.api.push(url);
      const id = new URL(`http://x/${url}`).searchParams.get('filter_entity_id');
      return history[id] ? [history[id]] : [];
    },
  };
}

export const sensor = (state, attributes = {}) => ({ state: String(state), attributes });

// One hourly statistics row starting `hoursAgo` hours before now
export function statRow(hoursAgo, { mean, min = mean, max = mean } = {}) {
  const start = new Date(Date.now() - hoursAgo * 3600000);
  start.setMinutes(0, 0, 0);
  return { start: start.toISOString(), mean, min, max };
}

const cards = [];
export async function makeCard(config, hass, tag = 'ha-weather-heatmap-card') {
  const card = document.createElement(tag);
  cards.push(card);
  card.events = [];
  card.addEventListener('hass-more-info', (e) => card.events.push(e.detail));
  card.setConfig(config);
  document.body.appendChild(card);
  if (hass) card.hass = hass;
  await settle();
  return card;
}

export const content = (card) => card.shadowRoot.querySelector('ha-card');
export const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

export async function makeEditor(config = {}, hass = makeHass()) {
  const editor = document.createElement('ha-weather-heatmap-card-editor');
  editor.changes = [];
  editor.addEventListener('config-changed', (e) => editor.changes.push(structuredClone(e.detail.config)));
  document.body.appendChild(editor);
  await editor.setConfig(config);
  editor.hass = hass;
  await settle();
  return editor;
}
export const lastConfig = (editor) => editor.changes.at(-1);
export function fireValue(el, value) {
  el.dispatchEvent(new window.CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
}
export const field = (editor, key) => editor.fields[key].input;

export function cleanup() {
  for (const c of cards.splice(0)) c.disconnectedCallback();
  document.body.innerHTML = '';
}
