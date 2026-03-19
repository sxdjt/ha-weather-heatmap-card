# Changelog

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
