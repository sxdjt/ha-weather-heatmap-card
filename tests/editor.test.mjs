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
  it('editing a humidity card keeps its 0-decimal default', { todo: 'editor defaults (decimals 1, statistic_type mean, ...) are written into the config' }, async () => {
    const editor = await makeEditor({ entity: 'sensor.h', card_type: 'humidity' });
    fireValue(field(editor, 'title'), 'Humidity');
    assert.equal('decimals' in lastConfig(editor), false);
  });

  // W16 (B5): the card accepts only 1, 2, 3, 4, 6, 8, 12, 24
  it('Time Interval offers only the values the card accepts', { todo: 'number field 1-24 allows 5, which makes the card throw' }, async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    assert.ok(field(editor, 'time_interval').selector.select, 'expected a select');
  });

  // W17 (B4): clearing a number field must unset it, not store 0
  it('clearing a number field removes the key', { todo: "Number('') is 0: cleared Cell Height becomes 0 and the card throws" }, async () => {
    const editor = await makeEditor({ entity: 'sensor.t', cell_height: 40 });
    fireValue(field(editor, 'cell_height'), '');
    assert.equal('cell_height' in lastConfig(editor), false);
  });

  // W18 (B6): fill_gaps works on wind cards; fill_gaps_style has no field
  it('fill gaps options are available for wind cards', { todo: 'fill_gaps hidden for windspeed; fill_gaps_style missing' }, async () => {
    const editor = await makeEditor({ entity: 'sensor.w', card_type: 'windspeed' });
    assert.equal(editor.fields.fill_gaps.wrapper.style.display, '');
    assert.ok(editor.fields.fill_gaps_style, 'expected a Fill Gaps Style field');
  });

  // W19 (B8): auto always uses statistics (card _getDataSource)
  it('the Data Source Auto label matches the card', { todo: "label says 'statistics for past, history for current'" }, async () => {
    const editor = await makeEditor({ entity: 'sensor.t' });
    const auto = field(editor, 'data_source').selector.select.options.find((o) => o.value === 'auto');
    assert.doesNotMatch(auto.label, /history for current/);
  });
});
