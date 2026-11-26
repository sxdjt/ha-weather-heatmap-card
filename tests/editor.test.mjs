import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeEditor, fireValue, lastConfig, field, cleanup } from './helpers/env.mjs';

afterEach(cleanup);

describe('editor basics', () => {
  it('title change fires config-changed', async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    fireValue(field(editor, 'title'), 'Outside');
    assert.equal(lastConfig(editor).title, 'Outside');
  });
});

describe('review sweep findings', () => {
  // W15 (B8): the editor writes its defaults into the saved config
  it('editing a humidity card keeps its 0-decimal default', async () => {
    const editor = await makeEditor({ entity: 'sensor.h', card_type: 'humidity' });
    fireValue(field(editor, 'title'), 'Humidity');
    assert.equal('decimals' in lastConfig(editor), false);
  });

  // W16 (B5): the card accepts only 1, 2, 3, 4, 6, 8, 12, 24
  it('Time Interval offers only the values the card accepts', async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    assert.deepEqual(field(editor, 'time_interval').selector.select.options.map((o) => o.value), ['1', '2', '3', '4', '6', '8', '12', '24']);
    assert.equal(field(editor, 'time_interval').value, '2');
    fireValue(field(editor, 'time_interval'), '6');
    assert.equal(lastConfig(editor).time_interval, 6);
  });

  it('unset keys show the card defaults for the card type', async () => {
    const humidity = await makeEditor({ entity: 'sensor.h', card_type: 'humidity' });
    assert.equal(field(humidity, 'decimals').value, 0);
    assert.equal(field(humidity, 'show_month_year').checked, true);
    const wind = await makeEditor({ entity: 'sensor.w', card_type: 'windspeed' });
    assert.equal(field(wind, 'aggregation_mode').value, 'max');
    const legacy = await makeEditor({ entity: 'sensor.t', statistic_type: 'min' });
    assert.equal(field(legacy, 'aggregation_mode').value, 'min');
    assert.equal('statistic_type_temp' in legacy.fields, false);
    assert.equal(field(wind, 'decimals').value, 1);
  });

  // W17 (B4): clearing a number field must unset it, not store 0
  it('clearing a number field removes the key', async () => {
    const editor = await makeEditor({ entity: 'sensor.t', cell_height: 40 });
    fireValue(field(editor, 'cell_height'), '');
    assert.equal('cell_height' in lastConfig(editor), false);
  });

  // W18 (B6): fill_gaps works on wind cards; fill_gaps_style has no field
  it('fill gaps options are available for wind cards', async () => {
    const editor = await makeEditor({ entity: 'sensor.w', card_type: 'windspeed' });
    assert.notEqual(editor.fields.fill_gaps.wrapper.style.display, 'none');
    assert.ok(editor.fields.fill_gaps_style, 'expected a Fill Gaps Style field');
  });

  // W19 (B8): auto always uses statistics (card _getDataSource)
  it('the Data Source Auto label matches the card', async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    const auto = field(editor, 'data_source').selector.select.options.find((o) => o.value === 'auto');
    assert.doesNotMatch(auto.label, /history for current/);
  });
});
