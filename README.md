# Weather Heatmap Card

![GitHub Release](https://img.shields.io/github/v/release/sxdjt/ha-weather-heatmap-card?style=for-the-badge)
[![AI Assisted](https://img.shields.io/badge/AI-Claude%20Code-AAAAAA.svg?style=for-the-badge)](https://claude.ai/code)
![GitHub License](https://img.shields.io/github/license/sxdjt/ha-weather-heatmap-card?style=for-the-badge)

A custom Home Assistant Lovelace card that displays temperature, wind speed, or humidity data as a color-coded heatmap, showing hourly patterns across multiple days. A single card handles all sensor types via the `card_type` configuration option.

Replaces and supersedes the separate [Temperature Heatmap Card](https://github.com/sxdjt/ha-temperature-heatmap) and [Windspeed Heatmap Card](https://github.com/sxdjt/ha-windspeed-heatmap). Existing configurations using the legacy element names (`ha-temperature-heatmap-card`, `windspeed-heatmap-card`) continue to work without changes.

<img width="800" height="602" alt="example" src="https://github.com/user-attachments/assets/3b97d750-5037-45f5-a74a-7842b99564dc" />

## Features

- Single card handles temperature, wind speed, and humidity sensors via `card_type`
- Visual configuration editor with context-sensitive fields
- Color interpolation with multiple methods (RGB, HSL, LAB, Gamma)
- Configurable time periods (1-365 days) and intervals (1-24 hours)
- Long-term statistics support (data beyond recorder history)
- Navigation between time periods (previous/next/current)
- Min/Max/Avg statistics footer with legend bar
- Compact mode and cell sizing customization
- Tooltip on cell click

**Temperature mode** (`card_type: temperature`):
- Average, min, or max aggregation per time cell
- Auto-detection of Fahrenheit/Celsius with matching default color scale
- Hour filtering (e.g., daytime only)
- Configurable decimal precision and degree symbol
- Gap filling (forward-fill last known value)

**Wind speed mode** (`card_type: windspeed`):
- Default colors based on the Beaufort scale (Force 0-12)
- Auto-detection of unit (mph, km/h, m/s, knots) with matching thresholds
- Optional wind direction overlay (arrow, cardinal, or degrees)
- Circular mean averaging for direction data

**Humidity mode** (`card_type: humidity`):
- Comfort-based color scale: yellow for dry (0-30%), green for comfortable (30-50%), yellow/orange/red for humid (above 55%)
- Fixed % unit — no configuration needed
- Shares temperature's aggregation, hour filtering, and gap filling options

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=ha-weather-heatmap-card)

## Configuration

### Minimal Configuration

```yaml
type: custom:ha-weather-heatmap-card
card_type: temperature
entity: sensor.outdoor_temperature
```

```yaml
type: custom:ha-weather-heatmap-card
card_type: windspeed
entity: sensor.wind_speed
direction_entity: sensor.wind_direction
```

```yaml
type: custom:ha-weather-heatmap-card
card_type: humidity
entity: sensor.outdoor_humidity
```

### Migrating from legacy cards

No changes required. Legacy element names continue to work:

```yaml
# These still work as before
type: custom:ha-temperature-heatmap-card
entity: sensor.outdoor_temperature
```

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
```

## Configuration Options

### Common Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **Required** | Sensor entity ID |
| `aggregation_mode` | string | `"average"` | How history readings are combined per cell: `"average"`, `"min"`, or `"max"` |
| `card_type` | string | `"temperature"` | Card mode: `"temperature"`, `"windspeed"`, or `"humidity"` |
| `cell_font_size` | number/string | `11` | Cell font size |
| `cell_gap` | number/string | `2` | Gap between cells |
| `cell_height` | number/string | `36` | Cell height in pixels |
| `cell_padding` | number/string | `2` | Padding inside cells |
| `cell_width` | number/string | `"1fr"` | Column width (1fr, auto, 60px, 25%, etc.) |
| `click_action` | string | `"more-info"` | Cell click: `"more-info"`, `"tooltip"`, or `"none"` |
| `color_interpolation` | string | `"hsl"` | Interpolation method: `"rgb"`, `"gamma"`, `"hsl"`, or `"lab"` |
| `color_thresholds` | array | See below | Custom color mapping |
| `compact` | boolean | `false` | Compact preset (overrides cell sizing) |
| `compact_header` | boolean | `false` | Reduce header/footer padding and nav size |
| `data_source` | string | `"auto"` | `"auto"`, `"history"`, or `"statistics"` |
| `days` | number | `7` | Number of days to display (1-365) |
| `fill_gaps` | boolean | `false` | Forward-fill last known value into empty past cells. **NOTE:** displays carried-forward data where none exists — use with care |
| `fill_gaps_style` | string | `"dimmed"` | How filled cells appear: `"dimmed"` (reduced opacity + dashed border) or `"none"` (same as real data). Tooltips always label estimated values. |
| `interpolate_colors` | boolean | `false` | Smooth color gradient between thresholds |
| `refresh_interval` | number | `300` | Refresh interval in seconds |
| `rounded_corners` | boolean | `true` | Rounded cell corners |
| `show_entity_name` | boolean | `false` | Show entity name in footer |
| `show_legend` | boolean | `false` | Show color legend bar |
| `show_month_year` | boolean | `true` | Show month/year label above the grid |
| `statistic_type` | string | `"mean"` (temp) / `"max"` (wind) | Pre-computed statistic from long-term data: `"mean"`, `"min"`, or `"max"` |
| `time_format` | string | `"24"` | Time format: `"12"` or `"24"` |
| `time_interval` | number | `2` | Hours per row (1-24) |
| `title` | string | | Card title |

### Temperature and Humidity Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `decimals` | number | `1` (temp) / `0` (humidity) | Decimal places shown (0-2) |
| `end_hour` | number | `23` | Last hour to display (0-23) |
| `start_hour` | number | `0` | First hour to display (0-23) |

### Temperature-Only Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `show_degree_symbol` | boolean | `true` | Show degree symbol in cells |
| `unit` | string | auto-detect | Override unit (`"°F"`, `"°C"`) |

### Wind Speed Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `decimals` | number | `1` | Decimal places shown (0-2) |
| `direction_entity` | string | | Entity ID for wind direction sensor |
| `direction_format` | string | `"arrow"` | Direction display: `"arrow"`, `"cardinal"`, or `"degrees"` |
| `show_direction` | boolean | `true` | Show direction overlay on cells |
| `unit` | string | auto-detect | Override unit (`"mph"`, `"km/h"`, `"m/s"`, `"kn"`) |

## Default Color Thresholds

### Temperature - Fahrenheit

```yaml
color_thresholds:
  - { value: 0,  color: "#1a237e" }  # Deep freeze
  - { value: 32, color: "#42a5f5" }  # Freezing
  - { value: 40, color: "#80deea" }  # Cold
  - { value: 50, color: "#66bb6a" }  # Cool
  - { value: 60, color: "#4caf50" }  # Comfortable
  - { value: 70, color: "#81c784" }  # Warm-comfortable
  - { value: 75, color: "#ffeb3b" }  # Getting warm
  - { value: 80, color: "#ff9800" }  # Warm
  - { value: 85, color: "#f44336" }  # Hot
```

### Temperature - Celsius

```yaml
color_thresholds:
  - { value: -18, color: "#1a237e" }
  - { value: 0,   color: "#42a5f5" }
  - { value: 4,   color: "#80deea" }
  - { value: 10,  color: "#66bb6a" }
  - { value: 16,  color: "#4caf50" }
  - { value: 21,  color: "#81c784" }
  - { value: 24,  color: "#ffeb3b" }
  - { value: 27,  color: "#ff9800" }
  - { value: 29,  color: "#f44336" }
```

### Humidity

```yaml
color_thresholds:
  - { value: 0,  color: "#fff176" }  # Very dry
  - { value: 15, color: "#ffee58" }  # Dry
  - { value: 30, color: "#4caf50" }  # Comfortable low
  - { value: 45, color: "#81c784" }  # Comfortable
  - { value: 55, color: "#ffeb3b" }  # Getting humid
  - { value: 65, color: "#ff9800" }  # Humid
  - { value: 80, color: "#f44336" }  # Very humid
```

### Wind Speed - Beaufort Scale

Thresholds are automatically selected based on the detected unit (mph, km/h, m/s, or knots). Custom `color_thresholds` override auto-detection.

## Data Aggregation

Two independent settings control how data is summarized:

**Aggregation Mode** (`aggregation_mode`): How raw sensor readings within a single time cell are combined when using history API data. For example, with a 2-hour cell and `average`, all readings from 14:00-15:59 are averaged together.

**Statistic Type** (`statistic_type`): Which pre-computed value to fetch when using long-term statistics (data older than your recorder's `purge_keep_days`). Home Assistant records hourly mean, min, and max for statistics-enabled entities.

## Color Interpolation

By default, cell colors snap to the nearest threshold. Set `interpolate_colors: true` for smooth gradients:

| Method | Description |
|--------|-------------|
| `rgb` | Linear RGB - simple, can produce muddy intermediate colors |
| `gamma` | Gamma-corrected RGB - perceptually more uniform than linear |
| `hsl` | HSL color space (default) - vibrant, takes shortest hue path |
| `lab` | LAB color space - perceptually uniform, best for scientific use |

## License

This project is licensed under the MIT License.

## Support

For issues or feature requests, please visit the [GitHub repository](https://github.com/sxdjt/ha-weather-heatmap-card).
