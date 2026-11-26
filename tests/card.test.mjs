import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Card, makeCard, makeHass, sensor, statRow, content, text, settle, cleanup, window } from './helpers/env.mjs';

afterEach(() => { mock.restoreAll(); mock.timers.reset(); cleanup(); });
const quiet = () => { for (const m of ['log', 'warn', 'error']) mock.method(console, m, () => {}); };
const temp = (extra = {}) => makeHass({ states: { 'sensor.t': sensor(70, { unit_of_measurement: '°F' }) }, stats: { 'sensor.t': [statRow(3, { mean: 65, min: 60, max: 72 })] }, ...extra });

describe('registration', () => {
  it('registers the card, legacy names and the editor', () => {
    assert.ok(Card);
    assert.deepEqual(window.customCards.map((c) => c.type), ['ha-weather-heatmap-card', 'ha-temperature-heatmap-card', 'windspeed-heatmap-card']);
  });
});

describe('rendering', () => {
  it('renders a cell per day and bucket with the footer stats', async () => {
    quiet();
    const card = await makeCard({ entity: 'sensor.t', days: 2 }, temp());
    assert.equal(content(card).querySelectorAll('.data-grid .cell').length, 24);
    assert.match(text(content(card).querySelector('.footer')), /Min .* °F/);
  });
});

describe('review sweep findings', () => {
  // W-D6 (B11): unit_of_measurement comes from the integration and is written raw
  it('a unit_of_measurement cannot inject markup', async () => {
    quiet();
    const hass = temp({ states: { 'sensor.t': sensor(70, { unit_of_measurement: '<img src=x>' }) } });
    const card = await makeCard({ entity: 'sensor.t', days: 1, show_legend: true, click_action: 'tooltip' }, hass);
    content(card).querySelector('.data-grid .cell:not(.no-data)')?.click();
    assert.equal(card.shadowRoot.querySelectorAll('img').length, 0, 'unit markup was rendered');
  });

  it('a forecast condition cannot add attributes', async () => {
    quiet();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const hass = temp({ forecast: { 'weather.home': [{ datetime: tomorrow, temperature: 70, templow: 50, condition: 'x" onfocus="alert(1)' }] } });
    const card = await makeCard({ entity: 'sensor.t', days: 1, forecast_entity: 'weather.home' }, hass);
    assert.equal(card.shadowRoot.querySelectorAll('[onfocus]').length, 0, 'injected attribute was rendered');
  });

  // W4 (B5): refresh_interval 0/negative/invalid polls without delay
  it('an invalid refresh_interval does not poll continuously', () => {
    for (const refresh_interval of [-1, 0.01, 'abc']) {
      const card = document.createElement('ha-weather-heatmap-card');
      card.setConfig({ entity: 'sensor.t', refresh_interval });
      assert.ok(card._config.refresh_interval >= 10, `${refresh_interval} -> ${card._config.refresh_interval}`);
    }
  });

  // W3 (B4): waterfall precedent - an empty title hides the header title
  it("show_title: false hides the title; title: '' keeps the default", async () => {
    quiet();
    const hidden = await makeCard({ entity: 'sensor.t', days: 1, show_title: false }, temp());
    assert.equal(content(hidden).querySelectorAll('.title').length, 0);
    const blank = await makeCard({ entity: 'sensor.t', days: 1, title: '' }, temp());
    assert.equal(text(content(blank).querySelector('.title')), 'Temperature History');
  });

  // W9 (B8): generic sensors have no default unit
  it('a generic card without a unit shows no unit', { todo: "_getUnit falls back to '°F' for every non-wind type" }, async () => {
    quiet();
    const hass = makeHass({ states: { 'sensor.co2': sensor(500) }, stats: { 'sensor.co2': [statRow(3, { mean: 500 })] } });
    const card = await makeCard({ entity: 'sensor.co2', card_type: 'generic', days: 1 }, hass);
    assert.doesNotMatch(text(content(card).querySelector('.footer')), /°F/);
  });

  // W10 (B8): humidity and generic cells are not temperatures
  it('humidity and generic cells are not labelled Temperature', { todo: "aria-label, tooltip and fetch error always say 'Temperature'" }, async () => {
    quiet();
    const hass = makeHass({ states: { 'sensor.h': sensor(40) }, stats: { 'sensor.h': [statRow(3, { mean: 40 })] } });
    const card = await makeCard({ entity: 'sensor.h', card_type: 'humidity', days: 1 }, hass);
    const cell = content(card).querySelector('.data-grid .cell:not(.no-data)');
    assert.doesNotMatch(cell.getAttribute('aria-label'), /Temperature/);
  });

  // W1/W12 (B8): wind ignores aggregation_mode and statistic_type
  it('a wind card starts in the configured mode', { todo: 'wind always starts at max; aggregation_mode and statistic_type are ignored' }, () => {
    const card = document.createElement('ha-weather-heatmap-card');
    card.setConfig({ entity: 'sensor.w', card_type: 'windspeed', aggregation_mode: 'average' });
    assert.equal(card._activeAggregationMode, 'average');
  });

  // W14 (B3): README: "Compact preset (overrides cell sizing)"
  it('compact: true reduces cell sizing', { todo: 'config.compact is stored but never applied' }, () => {
    const card = document.createElement('ha-weather-heatmap-card');
    card.setConfig({ entity: 'sensor.t', compact: true });
    assert.notEqual(card._getEffectiveSizing().cellHeight, '36px');
  });

  // W13 (B7/B8): the Min/Max toggle on statistics data uses the hourly means
  it('Min and Max on statistics data use the hourly min and max', { todo: 'only statistic_type (mean) is stored, so Min/Max pick among means' }, async () => {
    quiet();
    const card = await makeCard({ entity: 'sensor.t', days: 1, time_interval: 1 }, temp());
    card._activeAggregationMode = 'max';
    card._processData();
    const values = card._processedData.rows.flatMap((r) => r.cells).filter((c) => c.hasData && !c.isPartial).map((c) => c.temperature);
    assert.deepEqual(values, [72]);
  });

  // W2 (B8): editor label promises history for current data; a sensor without
  // statistics (no state_class) shows an empty card with the default data_source
  it('data_source auto falls back to history when there are no statistics', { todo: 'auto always uses statistics and never falls back' }, async () => {
    quiet();
    const now = new Date(Date.now() - 3 * 3600000).toISOString();
    const hass = makeHass({ states: { 'sensor.t': sensor(70) }, history: { 'sensor.t': [{ state: '66', last_changed: now }] } });
    const card = await makeCard({ entity: 'sensor.t', days: 1 }, hass);
    assert.equal(hass.calls.api.length, 1);
    assert.ok(card._processedData.rows.flatMap((r) => r.cells).some((c) => c.temperature === 66));
  });
});
