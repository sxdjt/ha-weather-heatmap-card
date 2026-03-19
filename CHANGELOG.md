# Changelog

## v1.0.0 (2026-03-18)

Initial release - merged temperature and wind speed heatmap cards into a single component.

### Features

- Single card type handles both temperature and wind speed sensors
- `card_type: temperature` - all temperature heatmap features:
  - avg/min/max aggregation modes
  - Fahrenheit and Celsius auto-detection
  - Configurable hour range (start_hour/end_hour)
  - Configurable decimal precision
  - Optional degree symbol display
  - Gap filling (forward-fill)
- `card_type: windspeed` - all wind speed heatmap features:
  - Max speed aggregation per bucket
  - Beaufort scale color defaults for mph, km/h, m/s, knots
  - Optional direction overlay (arrow, cardinal, degrees)
  - Auto-detection of wind unit from entity attributes
- Visual editor with conditional field visibility - only relevant fields shown per card type
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
