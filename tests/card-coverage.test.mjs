// Branch coverage for the card (review sweep, step 6): config validation, fetch paths,
// forecast, processing, rendering variants and interaction.
import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Card, makeCard, makeHass, sensor, statRow, content, text, settle, cleanup, pinClock, window, document } from './helpers/env.mjs';

afterEach(() => { mock.restoreAll(); mock.timers.reset(); cleanup(); });
const quiet = () => { for (const m of ['log', 'warn', 'error']) mock.method(console, m, () => {}); };
const T = 'sensor.t';
const tempHass = (extra = {}) => makeHass({ states: { [T]: sensor(70, { unit_of_measurement: '°F', friendly_name: 'Outside' }) }, stats: { [T]: [statRow(3, { mean: 65, min: 60, max: 72 }), statRow(30, { mean: 50 })] }, ...extra });
const cells = (card) => card._processedData.rows.flatMap((r) => r.cells);
const newCard = (tag = 'ha-weather-heatmap-card') => document.createElement(tag);
const fakeCell = (data) => { const el = document.createElement('div'); Object.entries(data).forEach(([k, v]) => { el.dataset[k] = v; }); return el; };

describe('setConfig validation', () => {
  it('rejects each invalid option with its message', () => {
    const bad = [
      [{}, /'entity' is required/], [{ card_type: 'x' }, /card_type must be/], [{ time_interval: 5 }, /time_interval must be one of/],
      [{ days: 400 }, /days must be between/], [{ forecast_days: 9 }, /forecast_days must be an integer/],
      [{ forecast_entity: 'weather.x', card_type: 'humidity' }, /only supported when card_type is temperature/],
      [{ forecast_type: 'weekly' }, /forecast_type must be/], [{ forecast_dim: 2 }, /forecast_dim must be/],
      [{ color_interpolation: 'cmyk' }, /color_interpolation must be/], [{ data_source: 'db' }, /data_source must be/],
      [{ decimals: 3 }, /decimals must be between/], [{ start_hour: 24 }, /start_hour must be/], [{ end_hour: 1.5 }, /end_hour must be/],
      [{ statistic_type: 'median' }, /statistic_type must be/], [{ card_type: 'windspeed', statistic_type: 'median' }, /statistic_type must be/],
      [{ fill_gaps_style: 'x' }, /fill_gaps_style must be/], [{ cell_height: 5 }, /cell_height must be/], [{ cell_padding: '30' }, /cell_padding must be/],
      [{ cell_gap: 'x' }, /cell_gap must be/], [{ cell_font_size: 30 }, /cell_font_size must be/], [{ cell_width: 5 }, /cell_width as number must be/],
    ];
    for (const [cfg, msg] of bad) assert.throws(() => newCard().setConfig({ entity: T, ...cfg, ...(cfg.entity === undefined && Object.keys(cfg).length === 0 ? { entity: undefined } : {}) }), msg, JSON.stringify(cfg));
  });

  it('accepts string sizes; legacy tags pick their card type; default titles per type', () => {
    const c = newCard();
    c.setConfig({ entity: T, cell_height: '40px', cell_padding: 3, cell_gap: '4', cell_font_size: '12', cell_width: '60px' });
    assert.equal(c._getEffectiveSizing().cellHeight, '40px');
    const wind = newCard('windspeed-heatmap-card');
    wind.setConfig({ entity: 'sensor.w' });
    assert.equal(wind._config.card_type, 'windspeed');
    const legacy = newCard('ha-temperature-heatmap-card');
    legacy.setConfig({ entity: T });
    assert.equal(legacy._config.card_type, 'temperature');
    const title = (card_type) => { const x = newCard(); x.setConfig({ entity: T, card_type }); return x._config.title; };
    assert.deepEqual(['windspeed', 'humidity', 'generic', 'temperature'].map(title), ['Wind Speed History', 'Humidity History', 'Sensor History', 'Temperature History']);
  });

  it('custom thresholds are sorted; Celsius and wind units pick default scales', () => {
    const c = newCard();
    c.setConfig({ entity: T, color_thresholds: [{ value: 9, color: 'red' }, { value: 1, color: 'blue' }] });
    assert.deepEqual(c._config.color_thresholds.map((t) => t.value), [1, 9]);
    const celsius = newCard();
    celsius.setConfig({ entity: T, unit: '°C' });
    assert.equal(celsius._config.color_thresholds[0].value, -18);
    const generic = newCard();
    generic.setConfig({ entity: T, card_type: 'generic' });
    assert.deepEqual(generic._config.color_thresholds, []);
  });

  it('setConfig on a card that already has hass restarts polling', async () => {
    quiet();
    const card = await makeCard({ entity: T, days: 1 }, tempHass());
    const spy = mock.method(card, '_clearAndSetInterval');
    card.setConfig({ entity: T, days: 2 });
    assert.equal(spy.mock.callCount(), 1);
  });
});

describe('card picker, sizing and lifecycle', () => {
  it('getStubConfig, getConfigElement, getEntitySuggestion', () => {
    assert.deepEqual(Card.getStubConfig(), { card_type: 'temperature', entity: '' });
    assert.equal(Card.getConfigElement().tagName.toLowerCase(), 'ha-weather-heatmap-card-editor');
    const suggest = window.customCards[0].getEntitySuggestion;
    const hass = { states: {
      'sensor.t': sensor(1, { device_class: 'temperature' }), 'sensor.w': sensor(1, { device_class: 'wind_speed' }),
      'sensor.h': sensor(1, { device_class: 'humidity' }), 'sensor.p': sensor(1, { device_class: 'power' }), 'number.t': sensor(1, { device_class: 'temperature' }),
    } };
    assert.deepEqual(['sensor.t', 'sensor.w', 'sensor.h', 'sensor.p', 'number.t', 'sensor.gone'].map((id) => suggest(hass, id)?.config.card_type ?? null),
      ['temperature', 'windspeed', 'humidity', null, null, null]);
  });

  it('card size grows with rows and the daily forecast row', async () => {
    quiet();
    const card = newCard();
    card.setConfig({ entity: T });
    assert.equal(card.getCardSize(), Math.ceil((12 * 36 + 100) / 50));
    const withForecast = await makeCard({ entity: T, days: 1, forecast_entity: 'weather.home', cell_height: 40 }, tempHass());
    assert.equal(withForecast.getCardSize(), Math.ceil((12 * 40 + 40 + 100) / 50));
  });

  it('hass before connecting does nothing; connecting starts the fetch; disconnecting stops polling', async () => {
    quiet();
    const hass = tempHass();
    const card = newCard();
    card.setConfig({ entity: T, days: 1 });
    card.hass = hass;
    assert.equal(hass.calls.ws.length, 0);
    document.body.appendChild(card);
    await settle();
    assert.ok(hass.calls.ws.length > 0);
    card.disconnectedCallback();
    card.disconnectedCallback();
    assert.equal(card._interval, null);
  });

  it('fresh data is not refetched on every hass update; polling refetches on the current view only', async () => {
    quiet();
    mock.timers.enable({ apis: ['setInterval'] });
    const hass = tempHass();
    const card = await makeCard({ entity: T, days: 1, refresh_interval: 60 }, hass);
    const n = hass.calls.ws.length;
    card.hass = hass;
    assert.equal(hass.calls.ws.length, n);
    mock.timers.tick(60000);
    await settle();
    assert.ok(hass.calls.ws.length > n);
    card._viewOffset = -1;
    const m = hass.calls.ws.length;
    mock.timers.tick(60000);
    assert.equal(hass.calls.ws.length, m);
  });
});

describe('fetch paths', () => {
  it('history API: temperature, and wind with direction', async () => {
    quiet();
    pinClock();
    const at = new Date(Date.now() - 3 * 3600000).toISOString();
    const temp = makeHass({ states: { [T]: sensor(70) }, history: { [T]: [{ state: '61', last_changed: at }, { state: 'bad', last_updated: at }] } });
    const tc = await makeCard({ entity: T, days: 1, data_source: 'history' }, temp);
    assert.ok(cells(tc).some((c) => c.temperature === 61));
    const wind = makeHass({ states: { 'sensor.w': sensor(5), 'sensor.d': sensor(90) }, history: { 'sensor.w': [{ state: '12', last_changed: at }], 'sensor.d': [{ state: '180', last_changed: at }, { state: 'x', last_changed: at }] } });
    const wc = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', days: 1, data_source: 'history' }, wind);
    assert.equal(wind.calls.api.length, 2);
    assert.ok(cells(wc).some((c) => c.speed === 12 && c.direction === 180));
    const noDirection = makeHass({ states: { 'sensor.w': sensor(5) }, history: { 'sensor.w': [{ state: '12', last_changed: at }] } });
    await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', show_direction: false, days: 1, data_source: 'history' }, noDirection);
    assert.equal(noDirection.calls.api.length, 1);
  });

  it('statistics: wind speed with direction, and empty rows filtered', async () => {
    quiet();
    pinClock();
    const hass = makeHass({ states: { 'sensor.w': sensor(5), 'sensor.d': sensor('x') },
      stats: { 'sensor.w': [statRow(3, { mean: 8, min: 2, max: 15 }), { start: statRow(4).start, mean: null, min: null, max: null }], 'sensor.d': [{ start: statRow(3).start, mean: 270 }, { start: statRow(5).start, mean: null }] } });
    const card = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', days: 1 }, hass);
    assert.deepEqual(hass.calls.ws[0].statistic_ids, ['sensor.w', 'sensor.d']);
    const filled = cells(card).filter((c) => c.hasData && !c.isPartial);
    assert.deepEqual(filled.map((c) => [c.speed, c.direction]), [[15, 270]]);
    card._activeAggregationMode = 'average';
    card._processData();
    assert.equal(cells(card).find((c) => c.hasData && !c.isPartial).speed, 8);
    const none = makeHass({ states: { 'sensor.w': sensor(5) }, stats: { 'sensor.w': [statRow(3, { mean: 8 })] } });
    await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', days: 1, data_source: 'statistics' }, none);
  });

  it('a failed fetch shows the error; a fetch already running is not repeated', async () => {
    quiet();
    const hass = tempHass();
    hass.callWS = async () => { throw new Error('ws down'); };
    const card = await makeCard({ entity: T, days: 1 }, hass);
    assert.match(text(content(card).querySelector('.error-message')), /Failed to fetch temperature history ws down/);
    const wind = makeHass({ states: { 'sensor.w': sensor(1) } });
    wind.callWS = async () => { throw new Error('nope'); };
    const wc = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', days: 1 }, wind);
    assert.match(text(content(wc).querySelector('.error-message')), /wind speed/);
    card._isLoading = true;
    const calls = hass.calls.ws.length;
    await card._fetchHistoryData();
    assert.equal(hass.calls.ws.length, calls);
  });

  it('requests time out after 30 seconds', async () => {
    quiet();
    mock.timers.enable({ apis: ['setTimeout'] });
    const never = () => new Promise(() => {});
    for (const data_source of ['statistics', 'history']) {
      const hass = tempHass();
      hass.callWS = never;
      hass.callApi = never;
      const card = newCard();
      card.setConfig({ entity: T, days: 1, data_source });
      document.body.appendChild(card);
      card._hass = hass;
      const done = card._fetchHistoryData();
      mock.timers.tick(30000);
      await done;
      assert.match(card._error.details, /timeout/i, data_source);
      card.remove();
    }
    const fc = newCard();
    fc.setConfig({ entity: T, days: 1, forecast_entity: 'weather.home' });
    fc._hass = { callWS: never };
    const f = fc._fetchForecastData();
    mock.timers.tick(30000);
    await f;
    assert.equal(fc._forecastData, null);
  });
});

describe('forecast', () => {
  const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(12, 0, 0, 0); return d.toISOString(); };

  it('daily: forecast row cells, missing and partial values, click opens the weather entity', async () => {
    quiet();
    const hass = tempHass({ forecast: { 'weather.home': [
      { datetime: day(0), temperature: 72, templow: 50, condition: 'sunny' },
      { datetime: day(1), temperature: null, templow: 45 },
      { datetime: day(2), temperature: null, templow: null },
      { temperature: 1 },
    ] } });
    const card = await makeCard({ entity: T, days: 2, forecast_entity: 'weather.home', forecast_days: 3 }, hass);
    const row = [...card.shadowRoot.querySelectorAll('.forecast-row .forecast-cell')];
    assert.deepEqual(row.map((c) => c.classList.contains('empty')), [true, false, false, true, true]);
    assert.match(row[1].getAttribute('aria-label'), /Forecast sunny, high 72.0°, low 50.0°/);
    assert.match(row[2].getAttribute('aria-label'), /high -, low 45.0°/);
    row[1].click();
    assert.deepEqual(card.events, [{ entityId: 'weather.home' }]);
    assert.equal(cells(card).filter((c) => c.isForecast).every((c) => !c.hasData), true);
  });

  it('hourly: buckets and averages forecast hours, dims cells, fills the rest of today', async () => {
    quiet();
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-15T09:30:00Z').getTime() });
    const hour = (d, h) => new Date(Date.UTC(2026, 0, 15 + d, h)).toISOString();
    const hass = tempHass({ forecast: { 'weather.home': [
      { datetime: hour(1, 0), temperature: 40, condition: 'cloudy' }, { datetime: hour(1, 1), temperature: 44, condition: 'rainy' },
      { datetime: hour(0, 20), temperature: 60 }, { datetime: hour(1, 2), temperature: null }, { temperature: 5 },
    ] } });
    hass.states[T] = sensor('n/a');
    const card = await makeCard({ entity: T, days: 1, forecast_entity: 'weather.home', forecast_type: 'hourly', forecast_days: 1, forecast_dim: 0.25 }, hass);
    assert.equal(card._forecastHourly['2026-01-16_0'].temperature, 42);
    assert.equal(card._forecastHourly['2026-01-16_0'].condition, 'cloudy');
    const forecastCell = card.shadowRoot.querySelector('.cell.forecast');
    assert.match(forecastCell.getAttribute('style'), /opacity: 0.750/);
    assert.match(forecastCell.getAttribute('aria-label'), /\(forecast\)/);
    assert.ok(cells(card).some((c) => c.isForecast && c.temperature === 60), 'today is filled from the forecast');
    assert.equal(card.shadowRoot.querySelectorAll('.cell.forecast-blank').length > 0, true);
    forecastCell.click();
    assert.deepEqual(card.events.at(-1), { entityId: 'weather.home' });
  });

  it('a forecast failure keeps the heatmap; browsing back hides the forecast', async () => {
    quiet();
    const hass = tempHass();
    const ws = hass.callWS;
    hass.callWS = async (msg) => { if (msg.type === 'call_service') throw new Error('no forecast'); return ws(msg); };
    const card = await makeCard({ entity: T, days: 1, forecast_entity: 'weather.home' }, hass);
    assert.equal(card._forecastData, null);
    assert.ok(card._processedData);
    card._viewOffset = -1;
    await card._fetchHistoryData();
    assert.equal(card._forecastActive(), false);
    assert.equal(card._forecastData, null);
  });
});

describe('processing', () => {
  it('fill_gaps carries the last value forward (temperature and wind); style none renders like data', async () => {
    quiet();
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-15T23:30:00Z').getTime() });
    const at = (h) => new Date(Date.UTC(2026, 0, 15, h)).toISOString();
    const temp = makeHass({ states: { [T]: sensor('x') }, stats: { [T]: [{ start: at(2), mean: 50 }] } });
    const tc = await makeCard({ entity: T, days: 1, fill_gaps: true, fill_gaps_style: 'none' }, temp);
    assert.ok(cells(tc).filter((c) => c.isFilled).length > 3);
    assert.equal(tc.shadowRoot.querySelectorAll('.cell.filled').length, 0);
    const wind = makeHass({ states: { 'sensor.w': sensor('x') }, stats: { 'sensor.w': [{ start: at(2), mean: 5, min: 1, max: 9 }] } });
    const wc = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', days: 1, fill_gaps: true }, wind);
    assert.ok(cells(wc).filter((c) => c.isFilled).length > 3);
    assert.ok(wc.shadowRoot.querySelectorAll('.cell.filled').length > 0);
  });

  it('start_hour/end_hour filter rows, including a range across midnight', async () => {
    quiet();
    const day = await makeCard({ entity: T, days: 1, start_hour: 8, end_hour: 17 }, tempHass());
    assert.deepEqual(day._processedData.rows.map((r) => r.hour), [8, 10, 12, 14, 16]);
    const night = await makeCard({ entity: T, days: 1, start_hour: 22, end_hour: 3 }, tempHass());
    assert.deepEqual(night._processedData.rows.map((r) => r.hour), [0, 2, 22]);
  });

  it('the in-progress bucket uses the live state, with live direction for wind', async () => {
    quiet();
    const wind = makeHass({ states: { 'sensor.w': sensor(7), 'sensor.d': sensor(45) }, stats: {} });
    const wc = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', days: 1, data_source: 'statistics' }, wind);
    const live = cells(wc).find((c) => c.isPartial);
    assert.deepEqual([live.speed, live.direction], [7, 45]);
    const nodir = makeHass({ states: { 'sensor.w': sensor(7), 'sensor.d': sensor('x') }, stats: {} });
    const nc = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', days: 1, data_source: 'statistics' }, nodir);
    assert.equal(cells(nc).find((c) => c.isPartial).direction, null);
    const dead = makeHass({ states: { 'sensor.w': sensor('unavailable') }, stats: {} });
    const dc = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', days: 1, data_source: 'statistics' }, dead);
    assert.deepEqual(dc._processedData.stats, { min: 0, max: 0, avg: 0 });
  });

  it('no data at all: empty stats; _processData without history clears the grid', async () => {
    quiet();
    const card = await makeCard({ entity: T, days: 1, data_source: 'statistics' }, makeHass({ states: { [T]: sensor('x') } }));
    assert.deepEqual(card._processedData.stats, { min: 0, max: 0, avg: 0 });
    card._historyData = null;
    card._processData();
    assert.equal(card._processedData, null);
  });

  it('wind thresholds follow the detected unit once', async () => {
    quiet();
    const hass = makeHass({ states: { 'sensor.w': sensor(5, { unit_of_measurement: 'km/h' }) }, stats: {} });
    const card = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', days: 1 }, hass);
    assert.equal(card._config.color_thresholds[12].value, 118);
    const unknown = await makeCard({ entity: 'sensor.w2', card_type: 'windspeed', days: 1 }, makeHass({ states: {} }));
    assert.equal(unknown._config.color_thresholds[12].value, 73, 'no unit: mph scale');
  });
});

describe('rendering', () => {
  it('month header: one month, two months, two years, or hidden', async () => {
    quiet();
    const header = async (now, days, extra = {}) => {
      mock.timers.reset();
      mock.timers.enable({ apis: ['Date'], now: new Date(now).getTime() });
      const card = await makeCard({ entity: T, days, ...extra }, tempHass());
      return card.shadowRoot.querySelector('.month-header')?.textContent ?? null;
    };
    assert.equal(await header('2026-01-20T12:00:00Z', 3), 'January 2026');
    assert.equal(await header('2026-02-02T12:00:00Z', 7), 'January - February 2026');
    assert.equal(await header('2026-01-02T12:00:00Z', 7), 'December 2025 - January 2026');
    assert.equal(await header('2026-01-20T12:00:00Z', 3, { show_month_year: false }), null);
  });

  it('legends: wind (scaled, labels spaced), temperature stepped and interpolated, none without thresholds', async () => {
    quiet();
    const wind = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', days: 1, show_legend: true }, makeHass({ states: { 'sensor.w': sensor(5) }, stats: {} }));
    assert.match(wind.shadowRoot.querySelector('.legend-labels').textContent, /73\+/);
    const stepped = await makeCard({ entity: T, days: 1, show_legend: true }, tempHass());
    assert.match(stepped.shadowRoot.querySelector('.legend-bar').getAttribute('style'), /#1a237e 0.0%, #1a237e 37.6%/);
    const smooth = await makeCard({ entity: T, days: 1, show_legend: true, interpolate_colors: true }, tempHass());
    assert.equal(smooth.shadowRoot.querySelector('.legend-bar').getAttribute('style').split('%').length - 1, 21);
    const generic = await makeCard({ entity: T, card_type: 'generic', days: 1, show_legend: true }, tempHass());
    assert.equal(generic.shadowRoot.querySelectorAll('.legend').length, 0);
    const single = await makeCard({ entity: T, days: 1, show_legend: true, color_thresholds: [{ value: 5, color: 'red' }] }, tempHass());
    assert.match(single.shadowRoot.querySelector('.legend-labels').textContent, /5°F/);
  });

  it('footer entity name, no footer, compact header, square corners at gap 0', async () => {
    quiet();
    const named = await makeCard({ entity: T, days: 1, show_entity_name: true }, tempHass());
    assert.equal(text(named.shadowRoot.querySelector('.entity-name')), 'Outside');
    const bare = await makeCard({ entity: 'sensor.none', days: 1, show_entity_name: true }, tempHass({ states: {} }));
    assert.equal(text(bare.shadowRoot.querySelector('.entity-name')), 'sensor.none');
    const nofoot = await makeCard({ entity: T, days: 1, show_footer: false, compact_header: true, cell_gap: 0 }, tempHass());
    assert.equal(nofoot.shadowRoot.querySelectorAll('.footer').length, 0);
    assert.equal(content(nofoot).classList.contains('compact-header'), true);
    assert.equal(content(nofoot).style.getPropertyValue('--cell-border-radius'), '0');
  });

  it('units: configured, wind detected or default, degree symbol stripped', async () => {
    quiet();
    const unit = async (config, states = {}) => (await makeCard({ days: 1, ...config }, makeHass({ states }))).__proto__._getUnit.call(await makeCard({ days: 1, ...config }, makeHass({ states })));
    const c = newCard();
    c.setConfig({ entity: T, unit: '°C', show_degree_symbol: false });
    c._hass = makeHass();
    assert.equal(c._getUnit(), 'C');
    const w = newCard();
    w.setConfig({ entity: 'sensor.w', card_type: 'windspeed' });
    w._hass = makeHass({ states: { 'sensor.w': sensor(1, { unit_of_measurement: 'm/s' }) } });
    assert.equal(w._getUnit(), 'm/s');
    w._hass = makeHass();
    assert.equal(w._getUnit(), 'mph');
    const h = newCard();
    h.setConfig({ entity: T, card_type: 'humidity' });
    assert.equal(h._getUnit(), '%');
    void unit;
  });

  it('wind cells show direction in the chosen format, or none', async () => {
    quiet();
    const hass = makeHass({ states: { 'sensor.w': sensor(5), 'sensor.d': sensor(90) }, stats: { 'sensor.w': [statRow(3, { mean: 8, max: 9, min: 1 })], 'sensor.d': [{ start: statRow(3).start, mean: 90 }] } });
    const card = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', direction_format: 'cardinal', days: 1 }, hass);
    assert.equal(text(card.shadowRoot.querySelector('.cell .direction')), 'E');
    const hidden = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', show_direction: false, days: 1 }, hass);
    assert.equal(hidden.shadowRoot.querySelectorAll('.cell .direction').length, 0);
  });
});

describe('interaction', () => {
  it('navigation: back, forward (capped at now), current; disabled buttons do nothing', async () => {
    quiet();
    const card = await makeCard({ entity: T, days: 3 }, tempHass());
    const btn = (d) => card.shadowRoot.querySelector(`[data-direction="${d}"]`);
    btn('forward').click();
    assert.equal(card._viewOffset, 0);
    btn('back').click();
    await settle();
    assert.equal(card._viewOffset, -3);
    btn('back').click();
    await settle();
    btn('forward').click();
    await settle();
    assert.equal(card._viewOffset, -3);
    card._viewOffset = -1;
    card._handleNavigation('forward');
    await settle();
    assert.equal(card._viewOffset, 0);
    card._viewOffset = -6;
    btn('current').click();
    await settle();
    assert.equal(card._viewOffset, 0);
  });

  it('the aggregation button cycles modes; keyboard Enter activates cells but not buttons', async () => {
    quiet();
    const card = await makeCard({ entity: T, days: 1 }, tempHass());
    const agg = () => card.shadowRoot.querySelector('[data-action="toggle-aggregation"]');
    assert.equal(agg().textContent, 'Avg');
    agg().click();
    assert.equal(agg().textContent, 'Min');
    agg().click();
    agg().click();
    assert.equal(agg().textContent, 'Avg');
    const cell = card.shadowRoot.querySelector('.data-grid .cell:not(.no-data)');
    const key = (el, k) => { const e = new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; };
    assert.equal(key(cell, 'Enter'), true);
    assert.deepEqual(card.events.at(-1), { entityId: T });
    assert.equal(key(cell, 'a'), false);
    assert.equal(key(agg(), ' '), false);
    assert.equal(key(card.shadowRoot.querySelector('.title'), 'Enter'), false);
  });

  it('focus returns to the same control after a re-render, or to Previous', async () => {
    quiet();
    const card = await makeCard({ entity: T, days: 1 }, tempHass());
    card.shadowRoot.querySelector('[data-action="toggle-aggregation"]').focus();
    card._render();
    assert.equal(card.shadowRoot.activeElement?.dataset.action, 'toggle-aggregation');
    card.shadowRoot.querySelector('.data-grid .cell:not(.no-data)').focus();
    const date = card.shadowRoot.activeElement.dataset.date;
    card._render();
    assert.equal(card.shadowRoot.activeElement?.dataset.date, date);
    // A focused cell whose date is gone after the re-render: focus falls back to Previous
    card.shadowRoot.querySelector('.data-grid .cell:not(.no-data)').focus();
    card._processedData = { ...card._processedData, dates: card._processedData.dates.map((d) => new Date(d.getTime() - 86400000 * 30)),
      rows: card._processedData.rows.map((r) => ({ ...r, cells: r.cells.map((c) => ({ ...c, date: new Date(c.date.getTime() - 86400000 * 30) })) })) };
    card._render();
    assert.equal(card.shadowRoot.activeElement?.dataset.direction, 'back');
    card.shadowRoot.querySelector('.title').setAttribute('tabindex', '0');
    card.shadowRoot.querySelector('.title').focus();
    card._render();
    assert.equal(card._focusKeyOf(null), null);
  });

  it('click actions: tooltip (temperature, wind, partial, filled), none, no-data cells ignored', async () => {
    quiet();
    pinClock(['setTimeout']);
    const card = await makeCard({ entity: T, days: 1, click_action: 'tooltip' }, tempHass());
    const valueCell = card.shadowRoot.querySelector('.data-grid .cell:not(.no-data):not(.partial)');
    valueCell.click();
    valueCell.click();
    assert.equal(card.shadowRoot.querySelectorAll('.tooltip').length, 1);
    assert.match(text(card.shadowRoot.querySelector('.tooltip')), /Temperature: \d+\.\d °F Mode: average/);
    card.shadowRoot.querySelector('.cell.partial').click();
    assert.match(text(card.shadowRoot.querySelector('.tooltip')), /in progress/);
    mock.timers.tick(3000);
    assert.equal(card.shadowRoot.querySelectorAll('.tooltip').length, 0);
    card._showTooltip(fakeCell({ date: new Date().toISOString(), value: '5', filled: 'true' }));
    assert.match(text(card.shadowRoot.querySelector('.tooltip')), /gap filled/);
    card.shadowRoot.querySelector('.cell.no-data')?.click();
    const wind = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', days: 1, click_action: 'tooltip' },
      makeHass({ states: { 'sensor.w': sensor(5), 'sensor.d': sensor(200) }, stats: { 'sensor.w': [statRow(3, { mean: 8, max: 9, min: 1 })], 'sensor.d': [{ start: statRow(3).start, mean: 200 }] } }));
    wind.shadowRoot.querySelector('.data-grid .cell:not(.no-data):not(.partial)').click();
    assert.match(text(wind.shadowRoot.querySelector('.tooltip')), /Speed: 9.0 mph S \(200deg\) Mode: max/);
    wind._showTooltip(fakeCell({ date: new Date().toISOString(), value: '5', direction: '' }));
    assert.doesNotMatch(text(wind.shadowRoot.querySelector('.tooltip')), /deg/);
    const none = await makeCard({ entity: T, days: 1, click_action: 'none' }, tempHass());
    none.shadowRoot.querySelector('.data-grid .cell:not(.no-data)').click();
    assert.equal(none.events.length + none.shadowRoot.querySelectorAll('.tooltip').length, 0);
  });

  it('_render before config or hass does nothing', () => {
    const card = newCard();
    card._render();
    card._config = null;
    card._render();
    assert.equal(card.shadowRoot.querySelector('ha-card').innerHTML, '');
  });
});

describe('remaining branches', () => {
  it('statistics rows with missing fields; several rows per bucket; buckets without a usable value', async () => {
    quiet();
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-15T23:30:00Z').getTime() });
    const at = (h) => new Date(Date.UTC(2026, 0, 15, h)).toISOString();
    const stats = { [T]: [
      { start: at(2), mean: 50, min: 45, max: 55 }, { start: at(3), mean: 52, min: 40, max: 60 },
      { start: at(6), mean: 30, max: null, min: null }, { start: at(8), mean: null, max: 70, min: null }, { start: at(10), mean: null, max: null, min: null },
    ] };
    const card = await makeCard({ entity: T, days: 1, decimals: 2 }, makeHass({ states: { [T]: sensor('x') }, stats }));
    assert.equal(card._config.decimals, 2);
    const byHour = (c) => Object.fromEntries(c._processedData.rows.map((r) => [r.hour, r.cells[0].temperature]));
    assert.deepEqual([byHour(card)[2], byHour(card)[6], byHour(card)[8]], [51, 30, null]);
    card._activeAggregationMode = 'max';
    card._processData();
    assert.deepEqual([byHour(card)[2], byHour(card)[6], byHour(card)[8]], [60, 30, 70]);
    card._activeAggregationMode = 'min';
    card._processData();
    assert.equal(byHour(card)[2], 40);
    const hist = makeHass({ states: { [T]: sensor('x') }, history: { [T]: [{ state: 'bad', last_changed: at(4) }] } });
    const hc = await makeCard({ entity: T, days: 1, data_source: 'history' }, hist);
    assert.equal(byHour(hc)[4], null);
  });

  it('wind: last_updated timestamps, several readings per bucket, min mode, unusable readings', async () => {
    quiet();
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-15T23:30:00Z').getTime() });
    const at = (h, m = 0) => new Date(Date.UTC(2026, 0, 15, h, m)).toISOString();
    const hass = makeHass({ states: { 'sensor.w': sensor('x'), 'sensor.d': sensor('x') }, history: {
      'sensor.w': [{ state: '10', last_updated: at(2) }, { state: '4', last_changed: at(2, 30) }, { state: '7', last_changed: at(3) }, { state: 'calm', last_changed: at(6) }],
      'sensor.d': [{ state: '90', last_updated: at(2) }, { state: '0', last_changed: at(12) }],
    } });
    const card = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', direction_entity: 'sensor.d', days: 1, data_source: 'history', aggregation_mode: 'min' }, hass);
    const bucket = (h) => card._processedData.rows.find((r) => r.hour === h).cells[0];
    assert.deepEqual([bucket(2).speed, bucket(6).speed], [4, null]);
    const stats = makeHass({ states: { 'sensor.w': sensor('x') }, stats: { 'sensor.w': [{ start: at(2), mean: 5, max: null, min: null }, { start: at(4), mean: null, max: null, min: 2 }] } });
    const sc = await makeCard({ entity: 'sensor.w', card_type: 'windspeed', days: 1 }, stats);
    assert.equal(sc._processedData.rows.find((r) => r.hour === 2).cells[0].speed, 5);
    assert.equal(sc._processedData.rows.find((r) => r.hour === 4).cells[0].speed, null);
  });

  it('a hass update on a connected card refetches once the data is stale', async () => {
    quiet();
    const hass = tempHass();
    const card = await makeCard({ entity: T, days: 1 }, hass);
    const n = hass.calls.ws.length;
    card._lastFetch = 1;
    card.hass = hass;
    await settle();
    assert.ok(hass.calls.ws.length > n);
  });

  it('staleness, hass while browsing history, forecast response without data', async () => {
    quiet();
    const hass = tempHass();
    const card = await makeCard({ entity: T, days: 1, forecast_entity: 'weather.home' }, hass);
    card._lastFetch = 0;
    assert.equal(card._isDataStale(), true);
    card._viewOffset = -1;
    const n = hass.calls.ws.length;
    card.hass = hass;
    assert.equal(hass.calls.ws.length, n);
    const empty = tempHass();
    const ws = empty.callWS;
    empty.callWS = async (msg) => (msg.type === 'call_service' ? {} : ws(msg));
    const ec = await makeCard({ entity: T, days: 1, forecast_entity: 'weather.home' }, empty);
    assert.deepEqual(ec._forecastData, {});
  });

  it('forecast row without degree symbol and with a missing low; filled cells dimmed by default', async () => {
    quiet();
    pinClock();
    const tomorrow = new Date(Date.now() + 86400000);
    tomorrow.setHours(12, 0, 0, 0);
    // Two readings today with a gap between them, at fixed hours: rows relative to now
    // left no gap inside today at some times of day, and the test failed then
    const at = (hour, mean) => { const d = new Date(); d.setHours(hour, 0, 0, 0); return { start: d.toISOString(), mean, min: mean, max: mean }; };
    const hass = tempHass({
      stats: { [T]: [at(6, 60), at(9, 66)] },
      forecast: { 'weather.home': [{ datetime: tomorrow.toISOString(), temperature: 70, templow: null, condition: 'rainy' }] },
    });
    const card = await makeCard({ entity: T, days: 1, forecast_entity: 'weather.home', show_degree_symbol: false, fill_gaps: true }, hass);
    const cell = [...card.shadowRoot.querySelectorAll('.forecast-row .forecast-cell')].find((c) => !c.classList.contains('empty'));
    assert.match(cell.getAttribute('aria-label'), /high 70.0, low -/);
    assert.ok(card.shadowRoot.querySelectorAll('.cell.filled').length > 0);
  });

  it('focus keys for navigation buttons and forecast cells', async () => {
    quiet();
    const tomorrow = new Date(Date.now() + 86400000);
    tomorrow.setHours(12, 0, 0, 0);
    const card = await makeCard({ entity: T, days: 1, forecast_entity: 'weather.home' }, tempHass({ forecast: { 'weather.home': [{ datetime: tomorrow.toISOString(), temperature: 70, templow: 50 }] } }));
    card.shadowRoot.querySelector('[data-direction="back"]').focus();
    card._render();
    assert.equal(card.shadowRoot.activeElement?.dataset.direction, 'back');
    const fc = [...card.shadowRoot.querySelectorAll('.forecast-cell')].find((c) => c.dataset.date);
    fc.focus();
    const date = fc.dataset.date;
    card._render();
    assert.ok(card.shadowRoot.activeElement?.classList.contains('forecast-cell'));
    assert.equal(card.shadowRoot.activeElement?.dataset.date, date);
  });
});

// Guide D7 (2026-11-26, found on the ha-test Variety page): the card must stay inside its slot
describe('layout stays inside the card (D7)', () => {
  it('the sections view sizes the card to its content, not a row estimate', () => {
    // The estimate (rows x cell height + 100px) missed a wrapped title, the month label,
    // the date row and the footer, so the card below drew over this one
    const card = newCard();
    card.setConfig({ entity: T });
    assert.equal(card.getGridOptions().rows, 'auto');
    assert.equal(card.getGridOptions().columns, 12);
    assert.equal(card.getCardSize(), Math.ceil((12 * 36 + 100) / 50), 'masonry still gets the estimate');
  });
});

// D7, decided 2026-11-26 (option A): columns always fit the card; when a column is too
// narrow for its numbers, the numbers are hidden and the colors stay (the value is still
// in each cell's aria-label and tooltip), as heatmap-card does with its labels
describe('narrow columns fit the card (D7)', () => {
  const css = (card) => [...card.shadowRoot.querySelectorAll('style')].map((s) => s.textContent).join(' ').replace(/\s+/g, ' ');
  // Every block for exactly this selector (a media query may add another), joined
  const rule = (card, sel) => [...css(card).matchAll(new RegExp(`(?:^|[}/] )${sel.replace(/[.]/g, '\\.')} \\{[^}]*\\}`, 'g'))]
    .map((m) => m[0]).join(' ');
  const grid = (card) => content(card).querySelector('.data-grid');
  const setWidth = (el, px) => Object.defineProperty(el, 'clientWidth', { configurable: true, value: px });

  it('columns can shrink below their numbers instead of running past the card', async () => {
    quiet();
    const card = await makeCard({ entity: T, days: 14 }, tempHass());
    assert.match(grid(card).style.gridTemplateColumns, /repeat\(14, minmax\(0(px)?, 1fr\)\)/);
    assert.match(content(card).style.getPropertyValue('--cell-width'), /minmax\(0(px)?, 1fr\)/);
    assert.match(rule(card, '.cell'), /min-width: 0;/);
    assert.match(rule(card, '.cell'), /overflow: hidden;/);
    const fixed = await makeCard({ entity: T, days: 3, cell_width: 60 }, tempHass());
    assert.match(grid(fixed).style.gridTemplateColumns, /repeat\(3, minmax\(0(px)?, 60px\)\)/);
  });

  it('numbers hide when a column is too narrow for them, and come back when it widens', async () => {
    quiet();
    const card = await makeCard({ entity: T, days: 14 }, tempHass());
    assert.match(css(card), /\.values-hidden \.cell \.value[^{]*\{ visibility: hidden; \}/);
    setWidth(grid(card), 100);           // 14 columns of about 5px
    card._updateValueFit();
    assert.equal(content(card).classList.contains('values-hidden'), true);
    setWidth(grid(card), 2000);          // about 140px each
    card._updateValueFit();
    assert.equal(content(card).classList.contains('values-hidden'), false);
    setWidth(grid(card), 0);             // not laid out (hidden tab): keep the numbers
    card._updateValueFit();
    assert.equal(content(card).classList.contains('values-hidden'), false);
  });

  it('a resize re-checks the fit; the observer stops when the card is removed', async () => {
    quiet();
    const observers = [];
    globalThis.ResizeObserver = class {
      constructor(cb) { this.cb = cb; this.disconnected = false; observers.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
    };
    try {
      const card = await makeCard({ entity: T, days: 14 }, tempHass());
      const ro = observers.at(-1);
      assert.ok(ro, 'the card watches its size');
      setWidth(grid(card), 100);
      ro.cb([]);
      assert.equal(content(card).classList.contains('values-hidden'), true);
      card.remove();
      assert.equal(ro.disconnected, true);

      // A resize before any data (no grid yet) changes nothing
      const empty = newCard();
      empty.setConfig({ entity: T });
      document.body.appendChild(empty);
      assert.doesNotThrow(() => observers.at(-1).cb([]));
      assert.equal(content(empty).classList.contains('values-hidden'), false);
      empty.remove();
    } finally {
      delete globalThis.ResizeObserver;
    }
  });
});
