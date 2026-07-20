# Changelog

## v1.7.0 (2026-07-21)

Resumes SemVer versioning (following v1.6.3); the interim `2026.7.x` CalVer releases were prereleases.

### New Features

- Hourly forecast mode for the temperature card. Set `forecast_type: hourly` (with a `forecast_entity`) and the appended future day columns' hourly cells are filled with forecast temperatures instead of showing a daily high/low row. Forecast cells are rendered dimmer than live data; `forecast_dim` (default 0.5, range 0-1) controls how much dimmer, where 0 is no dimming and 1 is fully transparent. Use `forecast_days: 1` for the next day only. Forecast values are excluded from the Min/Max/Avg footer statistics, and clicking a forecast cell opens the more-info dialog for the weather entity. The default `forecast_type` remains `daily`, so existing configurations are unchanged. Resolves the hourly forecast request (#3).

## 2026.7.20 (2026-07-20)

### New Features

- Optional daily forecast for the temperature card. Set `forecast_entity` to a `weather.*` entity and the card appends future day columns with a forecast header row showing the condition icon and daily high/low. `forecast_days` (default 3, range 1-7) controls how many days are appended. Forecast data is fetched via the `weather.get_forecasts` service and is shown only on the current view; hourly cells under forecast columns are left blank since forecasts are daily. Clicking a forecast cell opens the more-info dialog for the weather entity. Resolves the forecast feature request (#3).

## 2026.7.6 (2026-07-06)

### Maintenance

- Adopted CalVer versioning (`YYYY.M.D`); this release follows 1.6.3.
- Updated dev/build dependencies: rollup 4.60.1 -> 4.62.2, vitest 4.1.2 -> 4.1.10. No functional changes to the card; the shipped bundle is unchanged aside from the version banner.

## v1.6.3 (2026-06-12)

### Bug Fixes

- Fixed the month header banner showing only the first month when the selected date range spans multiple months. It now displays the full range (e.g., "April - June 2026"). When the range spans different years, both year values are shown (e.g., "December 2025 - June 2026").

## v1.6.2 (2026-06-09)

### Bug Fixes

- Added `getGridOptions()` method to suppress the "This card does not fully support resizing yet" warning shown in the HA Layout tab. The method returns `columns: 12` (full-width default), `min_columns: 6`, and a computed `rows` value matching `getCardSize()`. The old `getCardSize()` is retained for backward compatibility with older HA versions.

## v1.6.1 (2026-06-09)

### Bug Fixes

- Fixed wind speed cells showing lower-than-actual peak values when `time_interval` is greater than 1 and `data_source` is `auto` or `statistics`. With a 2-hour interval, two HA hourly stat buckets land in each heatmap cell; the statistics path was always averaging those values regardless of the configured aggregation mode. Wind cards default to `max` aggregation (peak gust), so a cell spanning 04:00-05:59 would show the average of the two hourly peaks instead of the highest peak. The statistics path now applies the same aggregation logic as the history path.

## v1.6.0 (2026-06-04)

### New Features

- Card suggestion support for HA 2026.6+: the card now appears in the "Community" section of the card picker when the user selects a `temperature`, `wind_speed`, or `humidity` sensor. The suggestion automatically sets `card_type` to match the entity's device class.

## v1.5.1 (2026-05-14)

### Bug Fixes

- Fixed time label column drifting out of sync with data rows on narrow screens (Android companion app). The responsive CSS was shrinking `.time-label` heights at viewport widths below 600px, but an inline style on `.data-grid` prevented the same scaling from applying to the grid rows, causing the two columns to accumulate ~5px of drift per row. Cell heights are now controlled exclusively by the `cell_height` config value, consistent across all viewports.

## v1.5.0 (2026-05-13)

### New Features

- Added `show_footer` option (default: `true`) to show or hide the Min/Max/Avg statistics footer panel. Also exposed in the visual editor as "Show Footer (Min/Max/Avg)".

### Bug Fixes

- Fixed time label column misalignment in the Android companion app and at non-default system font sizes. The previous layout used a hardcoded `padding-top: 28px` to offset the time labels below the date-header row - a magic number that breaks when font metrics differ across environments. The layout has been restructured as a proper 2x2 CSS Grid so the browser aligns the time labels automatically, with no pixel offset required.
- Date column headers now use `cell_gap` and `cell_width` to match the data grid exactly. Previously, the date headers had a hardcoded `gap: 2px` and `1fr` column widths regardless of config, causing a slight column misalignment when those values were customized.

## v1.4.1 (2026-05-13)

### Bug Fixes

- Editor number and text fields (Cell Height, Cell Gap, Start Hour, Decimals, etc.) were invisible in HA 2026.5.1 due to `ha-textfield` being removed. Replaced with `ha-selector` using `number`/`text` selector types. Threshold row value inputs replaced with styled native `<input type="number">`.
- Setting `cell_gap: 0` had no effect when `compact: true` because the compact sizing override hardcoded `cellGap: 1px` and ignored all configured cell dimensions. The compact override has been removed; `compact` now only affects header/footer styling (which was already handled by CSS). Cell sizing is always taken from config.
- Rounded corners now automatically disable when `cell_gap` is 0. With zero gap, 6px border-radius on adjacent cells creates visible "pinch" artifacts where the card background shows through at cell corners.
- Cell sizing (gap, height, column widths) is now also applied directly as inline styles on the `.data-grid` element, in addition to CSS custom properties, to ensure values take effect regardless of CSS variable inheritance behavior.

## v1.4.0 (2026-05-12)

### New Features

- Added an Avg/Min/Max toggle button to the card header for all card types. Clicking cycles through aggregation modes instantly without refetching - cached data is re-processed in place. Wind cards default to Max (peak gust); all others default to Average. The `aggregation_mode` config option sets the initial mode.

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
