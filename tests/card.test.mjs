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
  it('a generic card without a unit shows no unit', async () => {
    quiet();
    const hass = makeHass({ states: { 'sensor.co2': sensor(500) }, stats: { 'sensor.co2': [statRow(3, { mean: 500 })] } });
    const card = await makeCard({ entity: 'sensor.co2', card_type: 'generic', days: 1 }, hass);
    assert.doesNotMatch(text(content(card).querySelector('.footer')), /°F/);
  });

  // W10 (B8): humidity and generic cells are not temperatures
  it('humidity and generic cells are not labelled Temperature', async () => {
    quiet();
    const hass = makeHass({ states: { 'sensor.h': sensor(40) }, stats: { 'sensor.h': [statRow(3, { mean: 40 })] } });
    const card = await makeCard({ entity: 'sensor.h', card_type: 'humidity', days: 1 }, hass);
    const cell = content(card).querySelector('.data-grid .cell:not(.no-data)');
    assert.match(cell.getAttribute('aria-label'), /^Humidity 40/);
    const generic = await makeCard({ entity: 'sensor.h', card_type: 'generic', days: 1 }, hass);
    assert.match(content(generic).querySelector('.data-grid .cell:not(.no-data)').getAttribute('aria-label'), /^Value 40/);
  });

  // W1/W12 (B8): wind ignores aggregation_mode and statistic_type
  it('a wind card starts in the configured mode', () => {
    const card = document.createElement('ha-weather-heatmap-card');
    card.setConfig({ entity: 'sensor.w', card_type: 'windspeed', aggregation_mode: 'average' });
    assert.equal(card._activeAggregationMode, 'average');
  });

  it('starting mode: statistic_type when aggregation_mode is unset, else the type default', () => {
    const mode = (config) => { const c = document.createElement('ha-weather-heatmap-card'); c.setConfig({ entity: 'sensor.x', ...config }); return c._activeAggregationMode; };
    assert.deepEqual(
      [mode({ statistic_type: 'max' }), mode({ statistic_type: 'mean', card_type: 'windspeed' }), mode({ card_type: 'windspeed' }), mode({}), mode({ aggregation_mode: 'min', statistic_type: 'max' })],
      ['max', 'average', 'max', 'average', 'min'],
    );
    assert.throws(() => mode({ card_type: 'windspeed', aggregation_mode: 'median' }), /aggregation_mode must be one of/);
  });

  // W14 (B3): compact did nothing since 2919098; removed
  it('a config that still sets compact loads; the option is gone', () => {
    const card = document.createElement('ha-weather-heatmap-card');
    card.setConfig({ entity: 'sensor.t', compact: true });
    assert.equal('compact' in card._config, false);
    assert.equal(card._getEffectiveSizing().cellHeight, '36px');
  });

  // W13 (B7/B8): the Min/Max toggle on statistics data uses the hourly means
  it('Min and Max on statistics data use the hourly min and max', async () => {
    quiet();
    const card = await makeCard({ entity: 'sensor.t', days: 1, time_interval: 1 }, temp());
    card._activeAggregationMode = 'max';
    card._processData();
    const values = card._processedData.rows.flatMap((r) => r.cells).filter((c) => c.hasData && !c.isPartial).map((c) => c.temperature);
    assert.deepEqual(values, [72]);
    card._activeAggregationMode = 'min';
    card._processData();
    assert.deepEqual(card._processedData.rows.flatMap((r) => r.cells).filter((c) => c.hasData && !c.isPartial).map((c) => c.temperature), [60]);
  });

  // W2 (B8): editor label promises history for current data; a sensor without
  // statistics (no state_class) shows an empty card with the default data_source
  it('data_source auto falls back to history when there are no statistics', async () => {
    quiet();
    const now = new Date(Date.now() - 3 * 3600000).toISOString();
    const hass = makeHass({ states: { 'sensor.t': sensor(70) }, history: { 'sensor.t': [{ state: '66', last_changed: now }] } });
    const card = await makeCard({ entity: 'sensor.t', days: 1 }, hass);
    assert.equal(hass.calls.api.length, 1);
    assert.ok(card._processedData.rows.flatMap((r) => r.cells).some((c) => c.temperature === 66));
  });

  it('data_source statistics never falls back; auto with statistics does not fetch history', async () => {
    quiet();
    const empty = makeHass({ states: { 'sensor.t': sensor(70) } });
    await makeCard({ entity: 'sensor.t', days: 1, data_source: 'statistics' }, empty);
    assert.equal(empty.calls.api.length, 0);
    const hass = temp();
    await makeCard({ entity: 'sensor.t', days: 1 }, hass);
    assert.equal(hass.calls.api.length, 0);
  });

  it('auto falls back to history for a wind card too', async () => {
    quiet();
    const at = new Date(Date.now() - 3 * 3600000).toISOString();
    const hass = makeHass({ states: { 'sensor.w': sensor(5) }, history: { 'sensor.w': [{ state: '12', last_changed: at }] } });
    const card = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', days: 1 }, hass);
    assert.ok(card._processedData.rows.flatMap((r) => r.cells).some((c) => c.speed === 12));
  });
});

describe('wind unit detection', () => {
  it('a km/h wind card uses the km/h scale from the first fetch (HA sets hass before connecting)', async () => {
    quiet();
    const hass = makeHass({ states: { 'sensor.w': sensor(5, { unit_of_measurement: 'km/h' }) }, stats: { 'sensor.w': [statRow(3, { mean: 30, max: 30, min: 30 })] } });
    const card = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', days: 1 }, hass);
    assert.equal(card._config.color_thresholds[12].value, 118);
  });
});
