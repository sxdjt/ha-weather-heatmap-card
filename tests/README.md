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

The target is 100% function and branch coverage of `src/`.

## Known issues

Record a known bug as a test with the `todo` option, describing the intended behavior. It runs and reports as `todo` without failing the suite. When a fix lands, remove the `todo` option. A `todo` test reports the same whether it passes or fails; check with `--test-reporter=tap` that each one is `not ok`.

Open `todo` tests: see `npm test` output.
