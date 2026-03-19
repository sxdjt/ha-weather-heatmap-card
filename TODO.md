# TODO

## Planned Features

### card_type: rainfall

Add support for rainfall/precipitation sensors.

- New `card_type: 'rainfall'`
- Default color thresholds for mm and inches (dry / light / moderate / heavy / extreme)
- Auto-detect unit: mm, in
- Aggregation: **sum** — rainfall accumulates over an interval, not an instantaneous reading
- No legacy element name needed (no prior card to be backward-compatible with)

### card_type: humidity

Add support for relative humidity sensors.

- New `card_type: 'humidity'`
- Fixed 0-100% scale, no unit auto-detection needed
- Default color thresholds: dry / comfortable / humid / very humid
- Aggregation: average
- No decimal needed by default

### card_type: pressure

Add support for barometric pressure sensors.

- New `card_type: 'pressure'`
- Auto-detect unit: hPa, mbar, inHg, mmHg
- Default color thresholds per unit (low / normal / high pressure bands)
- Aggregation: average
- Wider value range than temperature — verify legend scaling handles it

## Architecture Notes

- **humidity** and **pressure** both use average aggregation, same as temperature.
  They can share the existing `_processTemperatureData()` code path with minimal
  branching — no separate processing method needed.
- **rainfall** requires a sum aggregation path (new).
- **windspeed** requires its own path (max aggregation + circular mean for direction).
