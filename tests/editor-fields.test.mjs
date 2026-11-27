// Editor coverage (review sweep, step 6): build, every field type, virtual keys,
// visibility, threshold rows and color resolution.
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeEditor, makeHass, fireValue, lastConfig, field, settle, cleanup, window, document } from './helpers/env.mjs';

afterEach(cleanup);
const change = (el, checked) => { el.checked = checked; el.dispatchEvent(new window.Event('change')); };
const rows = (editor) => [...editor.container_threshold.children];
const inputs = (row) => row.querySelectorAll('input');  // value, color, swatch
const setInput = (el, value, type = 'change') => { el.value = value; el.dispatchEvent(new window.Event(type, { bubbles: true })); };

describe('build and config', () => {
  it('builds on the first hass; later hass reaches the selectors; getConfig returns a copy', async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    const hass = makeHass();
    editor.hass = hass;
    assert.ok(field(editor, 'title').hass === hass, 'text selector');
    assert.ok(field(editor, 'entity').hass === hass, 'entity picker');
    const copy = editor.getConfig();
    copy.title = 'x';
    assert.equal(editor._config.title, undefined);
  });

  it('setConfig(null) is an empty config; setConfig after the build updates fields and visibility', async () => {
    const editor = await makeEditor(null);
    assert.deepEqual(editor._config, {});
    await editor.setConfig({ entity: 'sensor.w', card_type: 'windspeed', title: 'Wind' });
    assert.equal(field(editor, 'title').value, 'Wind');
    assert.equal(editor.fields.direction_entity.wrapper.style.display, '');
    assert.equal(editor.fields.start_hour.wrapper.style.display, 'none');
  });

  it('loads the entity picker through card helpers only when it is not registered', async () => {
    let loads = 0;
    const real = window.loadCardHelpers;
    window.loadCardHelpers = async () => ({ createCardElement: async () => { loads++; return { constructor: { getConfigElement: async () => {} } }; } });
    await makeEditor({ entity: 'sensor.t' });
    assert.equal(loads, 1);
    window.customElements.define('ha-entity-picker', class extends window.HTMLElement {});
    await makeEditor({ entity: 'sensor.t' });
    assert.equal(loads, 1);
    window.loadCardHelpers = real;
  });
});

describe('field types', () => {
  it('switch, entity, number, numeric select, text select and virtual unit keys', async () => {
    const editor = await makeEditor({ type: 'custom:ha-weather-heatmap-card', entity: 'sensor.t', card_type: 'generic' });
    change(field(editor, 'show_legend'), true);
    assert.equal(lastConfig(editor).show_legend, true);
    fireValue(field(editor, 'entity'), 'sensor.co2');
    assert.equal(lastConfig(editor).entity, 'sensor.co2');
    fireValue(field(editor, 'days'), '14');
    assert.equal(lastConfig(editor).days, 14);
    fireValue(field(editor, 'days'), 'abc');
    assert.equal('days' in lastConfig(editor), false);
    fireValue(field(editor, 'forecast_offset'), '-1.5');
    assert.equal(lastConfig(editor).forecast_offset, -1.5);
    fireValue(field(editor, 'forecast_offset'), '');
    assert.equal('forecast_offset' in lastConfig(editor), false, 'a cleared offset unsets the key');
    fireValue(field(editor, 'click_action'), 'tooltip');
    assert.equal(lastConfig(editor).click_action, 'tooltip');
    fireValue(field(editor, 'unit_generic'), 'ppm');
    assert.equal(lastConfig(editor).unit, 'ppm');
    fireValue(field(editor, 'unit_temp'), '°C');
    fireValue(field(editor, 'unit_wind'), 'kn');
    assert.equal(lastConfig(editor).unit, 'kn');
    assert.deepEqual(Object.keys(lastConfig(editor)).slice(0, 2), ['type', 'card_type']);
  });

  it('changing the card type updates which fields show; a config without type keeps card_type first', async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    fireValue(field(editor, 'card_type'), 'windspeed');
    assert.equal(editor.fields.show_direction.wrapper.style.display, '');
    assert.equal(editor.fields.forecast_entity.wrapper.style.display, 'none');
    assert.equal(Object.keys(lastConfig(editor))[0], 'card_type');
    const bare = await makeEditor({});
    fireValue(field(bare, 'title'), 'T');
    assert.deepEqual(Object.keys(lastConfig(bare)), ['title']);
  });
});

describe('threshold rows', () => {
  it('add, edit value and color, pick from the swatch, remove; focus moves to Add', async () => {
    const editor = await makeEditor({ entity: 'sensor.t', color_thresholds: [{ value: 10, color: 'red' }] });
    assert.equal(rows(editor).length, 1);
    editor._addThresholdButton.click();
    assert.equal(rows(editor).length, 2);
    assert.deepEqual(lastConfig(editor).color_thresholds[1], { value: 0, color: '#ffffff' });
    const [value, color, swatch] = inputs(rows(editor)[1]);
    setInput(value, '20');
    assert.equal(lastConfig(editor).color_thresholds[1].value, 20);
    setInput(color, 'bad', 'input');
    assert.equal(color.getAttribute('aria-invalid'), 'true');
    assert.match(rows(editor)[1].querySelector('.error-text').textContent, /Threshold 2 color is not a valid color/);
    setInput(color, 'bad2', 'input');
    setInput(color, 'blue', 'input');
    assert.equal(color.getAttribute('aria-invalid'), 'false');
    assert.equal(color.hasAttribute('aria-describedby'), false);
    setInput(swatch, '#123456', 'input');
    assert.equal(lastConfig(editor).color_thresholds[1].color, '#123456');
    color.dispatchEvent(new window.Event('change'));
    swatch.dispatchEvent(new window.Event('change'));
    let focused = false;
    editor._addThresholdButton.focus = () => { focused = true; };
    rows(editor)[0].querySelector('ha-button').click();
    assert.deepEqual(lastConfig(editor).color_thresholds.map((t) => t.value), [20]);
    assert.equal(focused, true);
  });

  it('a config from HA updates rows in place, or rebuilds them when the count changes', async () => {
    const editor = await makeEditor({ entity: 'sensor.t', color_thresholds: [{ value: 10, color: 'red' }] });
    const row = rows(editor)[0];
    await editor.setConfig({ entity: 'sensor.t', color_thresholds: [{ value: 15, color: 'green' }] });
    assert.ok(rows(editor)[0] === row, 'row was rebuilt');
    assert.deepEqual([inputs(row)[0].value, inputs(row)[1].value], ['15', 'green']);
    await editor.setConfig({ entity: 'sensor.t', color_thresholds: [{ value: 15, color: 'green' }] });
    await editor.setConfig({ entity: 'sensor.t', color_thresholds: [{ value: 1 }, { value: 2, color: 'blue' }] });
    assert.equal(rows(editor).length, 2);
    assert.equal(inputs(rows(editor)[0])[1].value, '');
  });

  it('rows built with a canvas show the swatch color; an in-place update to a row without color clears it', async () => {
    const proto = window.HTMLCanvasElement.prototype;
    const real = proto.getContext;
    proto.getContext = () => { let v = '#000000'; return { get fillStyle() { return v; }, set fillStyle(x) { v = x === 'red' ? '#ff0000' : x; } }; };
    const editor = await makeEditor({ entity: 'sensor.t', color_thresholds: [{ value: 10, color: 'red' }] });
    assert.equal(inputs(rows(editor)[0])[2].value, '#ff0000');
    proto.getContext = real;
    await editor.setConfig({ entity: 'sensor.t', color_thresholds: [{ value: 10 }] });
    assert.equal(inputs(rows(editor)[0])[1].value, '');
  });

  it('a focused input is not overwritten while typing', async () => {
    const editor = await makeEditor({ entity: 'sensor.t', color_thresholds: [{ value: 10, color: 'red' }] });
    const [value, color] = inputs(rows(editor)[0]);
    value.focus();
    await editor.setConfig({ entity: 'sensor.t', color_thresholds: [{ value: 99, color: 'red' }] });
    assert.equal(value.value, '10');
    color.focus();
    await editor.setConfig({ entity: 'sensor.t', color_thresholds: [{ value: 99, color: 'blue' }] });
    assert.equal(color.value, 'red');
  });

  it('no thresholds in the config: Add starts the list; disconnect drops the rows', async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    editor._addThresholdButton.click();
    assert.equal(lastConfig(editor).color_thresholds.length, 1);
    editor._updateThreshold(0, 'value', 3);
    editor.remove();
    assert.equal(editor.container_threshold, null);
    editor._syncThresholdEditor();
    editor._refreshThresholdEditor();
    const empty = await makeEditor({ entity: 'sensor.t' });
    empty._config = { entity: 'sensor.t' };
    empty._updateThreshold(0, 'value', 5);
    assert.deepEqual(lastConfig(empty).color_thresholds, [{ value: 5 }]);
  });
});

describe('_resolveColorToHex', () => {
  it('rejects var() and invalid colors; uses a canvas to normalize, when one is available', async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    assert.equal(editor._resolveColorToHex(''), null);
    assert.equal(editor._resolveColorToHex('var(--x)'), null);
    assert.equal(editor._resolveColorToHex('nope'), null);
    const proto = window.HTMLCanvasElement.prototype;
    const real = proto.getContext;
    proto.getContext = () => null;
    editor._colorContext = null;
    assert.equal(editor._resolveColorToHex('red'), null);
    proto.getContext = () => {
      let style = '#000000';
      return { get fillStyle() { return style; }, set fillStyle(v) { style = v === 'red' ? '#ff0000' : v; } };
    };
    editor._colorContext = null;
    assert.equal(editor._resolveColorToHex('red'), '#ff0000');
    proto.getContext = real;
  });
});
