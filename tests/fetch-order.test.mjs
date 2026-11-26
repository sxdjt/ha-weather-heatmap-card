// Fetch ordering (B13, 2026-11 card review sweep). The card runs one fetch at a time;
// a request made while one is out (paging, a saved edit) used to be dropped, so the
// answer for the old window was drawn under the new one.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, makeHass, sensor, statRow, settle, cleanup } from './helpers/env.mjs';

after(cleanup);

// A hass whose statistics answers the test releases one at a time.
function slowHass() {
  const hass = makeHass({ states: { 'sensor.t': sensor(20, { unit_of_measurement: '°C', state_class: 'measurement' }) } });
  const pending = [];
  hass.callWS = (msg) => new Promise((resolve) => {
    hass.calls.ws.push(msg);
    pending.push((rows) => resolve({ 'sensor.t': rows }));
  });
  return { hass, pending };
}

const statsRequests = (hass) => hass.calls.ws.filter((m) => m.type === 'recorder/statistics_during_period');

test('W-B13: paging during a load fetches the new window and draws only its data', async () => {
  const { hass, pending } = slowHass();
  const card = await makeCard({ entity: 'sensor.t', days: 3, forecast_entity: undefined }, hass);
  assert.equal(statsRequests(hass).length, 1);

  card._handleNavigation('back');                 // while the first load is out
  pending[0]([statRow(2, { mean: 11 })]);
  await settle();
  assert.equal(statsRequests(hass).length, 2, 'the paged window is fetched');
  assert.notEqual(statsRequests(hass)[1].end_time, statsRequests(hass)[0].end_time);
  assert.equal(card._processedData, null, 'the old window is not drawn');

  const pagedEnd = new Date(statsRequests(hass)[1].end_time);
  pending[1]([{ start: new Date(pagedEnd.getTime() - 5 * 3600000).toISOString(), mean: 22, min: 22, max: 22 }]);
  await settle();
  const values = card._processedData.rows.flatMap((r) => r.cells).map((c) => c.temperature).filter((v) => typeof v === 'number');
  assert.ok(values.includes(22));
  assert.ok(!values.includes(11));
});

test('W-B13: a failure of a superseded fetch shows no error; the newer fetch runs', async () => {
  const { hass, pending } = slowHass();
  let failFirst;
  const first = new Promise((_, reject) => { failFirst = reject; });
  const callWS = hass.callWS;
  let calls = 0;
  hass.callWS = (msg) => (++calls === 1 ? (hass.calls.ws.push(msg), first) : callWS(msg));
  const card = await makeCard({ entity: 'sensor.t', days: 3 }, hass);
  card._handleNavigation('back');
  const error = console.error;
  console.error = () => {};
  try {
    failFirst(new Error('late failure'));
    await settle();
  } finally {
    console.error = error;
  }
  assert.equal(card._error, null);
  assert.equal(statsRequests(hass).length, 2);
  pending[0]([]);
  await settle();
});
