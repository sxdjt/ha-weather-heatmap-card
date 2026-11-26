# Tests

Run with `npm test`. It runs every `*.test.js` / `*.test.mjs` file here with Node's built-in test runner (the same runner as the other cards in this monorepo; vitest was dropped 2026-11-26). Node 20.11 or newer is required. `happy-dom` is a dev dependency only; nothing here ships with the card.

`npm test` runs under `tests/run-capped.sh`, which kills the run past 1 GB of memory or 60 seconds (`MAX_RSS_MB`, `MAX_SECONDS` to override). IMPORTANT: never pass a DOM node to `assert`; a failing assertion inspects the node and walks the whole happy-dom window without end (2026-11-25: over 70 GB). Assert on strings, numbers and booleans.

## How it works

- `color-utils.test.js`, `constants.test.js`, `formatting.test.js` import the `src/` utility modules directly; no DOM.
- `card.test.mjs` and `editor.test.mjs` import `helpers/env.mjs` first. It sets up a happy-dom window, then loads `src/index.js`, which registers every element the shipped bundle registers (`dist/` is a plain rollup concatenation of `src/`).
  - `makeHass({ states, stats, history, forecast })`: fake `callWS` (statistics, `weather.get_forecasts`) and `callApi` (history), recording every call in `hass.calls`. No network.
  - `statRow(hoursAgo, { mean, min, max })`, `sensor(state, attributes)`: data fixtures.
  - `await makeCard(config, hass, tag)`, `content(card)`, `text(el)`: a connected card after its first fetch settles; `card.events` records `hass-more-info`.
  - `await makeEditor(config, hass)`, `field(editor, key)`, `fireValue(el, value)`, `lastConfig(editor)`: editor fixtures.
  - The timezone is UTC; timers are unref'd; `CSS.supports('color', v)` and `window.loadCardHelpers` have stand-ins.

## Coverage

```bash
npm run coverage
```

Every line, function and branch in `src/` is covered (157 functions, 1011 branches). Keep it at 100%: a change that adds a function or branch should add the test that covers it. For a per-line list of gaps, add `--test-reporter=lcov --test-reporter-destination=<file>` and look for `FNDA:0` and `BRDA:...,0` lines.

## Files

| File | Covers |
|------|--------|
| `color-utils.test.js`, `constants.test.js`, `formatting.test.js` | Color parsing and interpolation (every color space), contrast text, thresholds per unit, formatting helpers |
| `card.test.mjs` | Registration, rendering, escaping, `refresh_interval`, `show_title`, units and labels per card type, the Avg/Min/Max model, `data_source: auto` fallback, wind unit detection |
| `card-coverage.test.mjs` | Config validation, card picker, sizing, lifecycle and polling, every fetch path with timeouts and errors, daily and hourly forecast, gap filling, hour filter, live buckets, legends, month header, footer, navigation, toggle, keyboard, focus restore, tooltips |
| `editor.test.mjs` | Defaults not written back, Time Interval values, cleared numbers, Fill Gaps fields, Data Source label, starting mode display |
| `editor-fields.test.mjs` | Build, every field type, virtual unit keys, card type visibility, threshold rows (add, edit, swatch, remove, in-place sync), color resolution |

## Known issues

Record a known bug as a test with the `todo` option, describing the intended behavior. It runs and reports as `todo` without failing the suite. When a fix lands, remove the `todo` option. A `todo` test reports the same whether it passes or fails; check with `--test-reporter=tap` that each one is `not ok`.

There are no open `todo` tests.
