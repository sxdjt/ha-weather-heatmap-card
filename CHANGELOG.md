# Changelog

## v1.3.2 (2026-04-30)

### Bug Fixes

- Humidity dry-end colors changed from purple/lavender to deep blue/cyan, matching the temperature card's cold-to-hot logic. The full spectrum now reads blue (very dry) through cyan, green (ideal), yellow, orange, to red (very humid) - making dry and humid extremes immediately distinguishable.

## v1.3.1 (2026-04-30)

### Bug Fixes

- Humidity color thresholds now use a symmetric comfort-based scale: red at both extremes (very dry below 20%, very humid above 70%), orange at 20% and 70%, yellow at 30% and 60%, green at the comfortable mid-range (~45%). Previously the dry end used an amber/yellow scale that did not reflect discomfort at low humidity.

## v1.3.0 (2026-04-29)

### New Features

- Today's date column is now highlighted in the grid: the date number renders in the primary accent color with a dot indicator beneath it, making the current day immediately identifiable
- Redesigned footer statistics panel: Min, Max, and Avg are now displayed as a proper three-column panel with uppercase labels above the values, separated by thin vertical dividers

### Improvements

- Navigation buttons changed from solid filled to ghost/outlined style - lighter visual weight that fills on hover for clear affordance
- "Current" button is now outlined in the primary accent color rather than filled
- Cell border-radius increased from 4px to 6px
- Cell hover effect adds a subtle white ring highlight in addition to the scale
- Time labels now use tabular numbers for consistent column alignment
- Legend bar is taller (14px) with pill-shaped ends
- Tooltip has larger border-radius (8px) and layered shadows for better depth
- Loading bar uses a gradient shimmer instead of a hard-edged block

## v1.2.1 (2026-03-28)

### Bug Fixes

- Replaced cross-browser-unreliable opacity pulse animation with a thin sliding progress bar at the top of the card. The pulse did not stop reliably on Chrome and Safari after data loaded. The new indicator does not affect card layout and disappears cleanly when loading completes.

## v1.2.0 (2026-03-25)

### New Features

- Added `card_type: 'generic'` — displays any numeric sensor as a heatmap. No default color scale is provided; configure `color_thresholds` for your sensor's value range. Supports all standard options: aggregation mode, hour filtering, gap filling, statistics, and decimal precision.

## v1.1.0 (2026-03-25)

### New Features

- Added `card_type: 'humidity'` — displays relative humidity history as a heatmap with comfort-based color thresholds (yellow for dry 0-30%, green for comfortable 30-50%, yellow/orange/red above 55%). Color palette mirrors the temperature scale.
- `decimals` option now applies to all card types including wind speed. Wind speed was previously hardcoded to 1 decimal place; it still defaults to 1 but can now be configured.

## v1.0.2 (2026-03-19)

### New Features

- Added `fill_gaps_style` option: controls how forward-filled cells appear — `"dimmed"` (default: reduced opacity + dashed border) or `"none"` (identical to real data). Tooltips always label estimated values regardless of style.

### Bug Fixes

- `fill_gaps` and `fill_gaps_style` now apply to both temperature and wind speed cards (were temperature-only)
- `data_source: auto` now always uses the statistics API — the minimum display bucket is 1 hour, making pre-aggregated statistics always the appropriate and more efficient source

## v1.0.1 (2026-03-19)

### Bug Fixes

- Fixed wind speed legend labels rendering as a concatenated string instead of positioned labels (missing `position:absolute`)
- Replaced layout-shifting loading spinner with a subtle opacity pulse that preserves card dimensions during data fetch
- Fixed `fill_gaps` forward-filling future (empty) time buckets — now only fills past buckets
- Fixed `show_month_year` toggle missing from merged card

## v1.0.0 (2026-03-19)

Initial release - merged temperature and wind speed heatmap cards into a single component.

### Features

- Single card handles both temperature and wind speed sensors via `card_type`
- `card_type: temperature` - all temperature heatmap features:
  - avg/min/max aggregation modes
  - Fahrenheit and Celsius auto-detection with matching default color scales
  - Configurable hour range (start_hour/end_hour)
  - Configurable decimal precision
  - Optional degree symbol display
  - Gap filling: forward-fills last known value into empty past buckets only
  - `show_month_year` toggle
- `card_type: windspeed` - all wind speed heatmap features:
  - Max speed aggregation per bucket
  - Beaufort scale color defaults for mph, km/h, m/s, knots
  - Optional direction overlay (arrow, cardinal, degrees)
  - Auto-detection of wind unit from entity attributes
- Visual editor with conditional field visibility - only relevant fields shown per card type
- Data Aggregation section in editor with explanatory text distinguishing aggregation mode from statistic type
- Compatible with Home Assistant 2026.3+ (uses ha-selector instead of deprecated mwc-list-item)
- All color interpolation methods (RGB, Gamma, HSL, LAB)
- Navigation controls (back/forward/current)
- Long-term statistics support (data_source: statistics)
- Compact mode and compact header mode
- Legend bar with label collision detection
- Tooltip on cell click

### Backward Compatibility

Existing configurations using `ha-temperature-heatmap-card` or `windspeed-heatmap-card`
continue to work without changes. The card auto-detects its type from the element name
when `card_type` is not specified in the config.
