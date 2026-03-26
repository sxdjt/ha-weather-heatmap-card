// Visual configuration editor for the Sensor Heatmap Card

import { rgbaToHex } from './color-utils.js';

/**
 * Visual editor for the Sensor Heatmap Card.
 * Shows all common fields, and conditionally shows temperature-only or
 * wind-only fields based on the card_type selection.
 */
export class SensorHeatmapCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this.content = null;
    this.fields = {};
    this.container_threshold = null;
  }

  set hass(hass) {
    this._hass = hass;
    // Build the editor the first time hass is received
    if (!this.content) {
      this._buildEditor();
    } else {
      // Propagate updated hass to all ha-selector and ha-entity-picker inputs
      for (const key in this.fields) {
        const { input, type } = this.fields[key];
        if (input && (type === 'select' || type === 'entity')) {
          input.hass = hass;
        }
      }
    }
  }

  async setConfig(config) {
    this._config = { ...(config || {}) };

    // Ensure ha-entity-picker is registered before we try to create one
    const helpers = await window.loadCardHelpers();
    if (!customElements.get('ha-entity-picker')) {
      const entitiesCard = await helpers.createCardElement({ type: 'entities', entities: [] });
      await entitiesCard.constructor.getConfigElement();
    }

    // Merged defaults covering both card types
    const defaults = {
      card_type: 'temperature',
      entity: '',
      title: '',
      days: 7,
      time_interval: 2,
      time_format: '24',
      refresh_interval: 300,
      click_action: 'more-info',
      show_entity_name: false,
      show_month_year: true,
      show_legend: false,
      cell_height: 36,
      cell_width: '1fr',
      cell_padding: 2,
      cell_gap: 2,
      cell_font_size: 11,
      compact: false,
      compact_header: false,
      rounded_corners: true,
      interpolate_colors: false,
      color_interpolation: 'hsl',
      color_thresholds: [],
      data_source: 'auto',
      // Temperature-specific defaults
      start_hour: 0,
      end_hour: 23,
      aggregation_mode: 'average',
      decimals: 1,
      unit: '',
      show_degree_symbol: true,
      fill_gaps: false,
      statistic_type: 'mean',
      // Wind-specific defaults
      direction_entity: '',
      show_direction: true,
      direction_format: 'arrow',
    };

    this._config = { ...defaults, ...this._config };

    if (this.content) {
      this._updateValues();
      this._updateFieldVisibility();
    }
  }

  getConfig() {
    return { ...this._config };
  }

  _buildEditor() {
    this.content = document.createElement('div');
    this.content.style.display = 'grid';
    this.content.style.gridGap = '8px';
    this.content.style.padding = '8px';
    this.appendChild(this.content);

    this.fields = {};

    // Field definitions.
    // showWhen: undefined = always visible
    //           'temperature' = only shown when card_type is 'temperature'
    //           'windspeed'   = only shown when card_type is 'windspeed'
    //
    // Virtual keys 'unit_temp' / 'unit_wind' and 'statistic_type_temp' / 'statistic_type_wind'
    // both write to 'unit' and 'statistic_type' in the config respectively.
    // This lets us show different option sets for the same config key per card type.
    const fields = [
      // Card type selector - always visible, drives field visibility
      { type: 'select', key: 'card_type', label: 'Card Type',
        options: { temperature: 'Temperature', windspeed: 'Wind Speed', humidity: 'Humidity' } },

      // Common fields
      { type: 'entity', key: 'entity', label: 'Entity', required: true },
      { type: 'text', key: 'title', label: 'Title' },
      { type: 'number', key: 'days', label: 'Days', min: 1, max: 365 },
      { type: 'number', key: 'time_interval', label: 'Time Interval (hours)', min: 1, max: 24 },
      { type: 'select', key: 'time_format', label: 'Time Format',
        options: { 24: '24h', 12: '12h' } },
      { type: 'select', key: 'data_source', label: 'Data Source',
        options: {
          'auto': 'Auto (statistics for past, history for current)',
          'history': 'History only (limited by purge_keep_days)',
          'statistics': 'Statistics only (long-term hourly data)'
        } },

      // Data aggregation section - prominent placement since these affect what values are shown
      { type: 'section', key: 'section_aggregation', label: 'Data Aggregation',
        options: { description:
          'Aggregation Mode: how multiple raw sensor readings within a single time cell are combined ' +
          '(average, min, or max of all history readings in that interval). ' +
          'Statistic Type: which pre-computed value to pull when fetching long-term statistics ' +
          '(HA records mean, max, and min per hour — used when data is older than your recorder history).'
        } },
      { type: 'select', key: 'aggregation_mode', label: 'Aggregation Mode',
        options: { average: 'Average', min: 'Min', max: 'Max' }, showWhen: ['temperature', 'humidity'] },
      // Virtual keys: both write to 'statistic_type' in config with different option sets per card type
      { type: 'select', key: 'statistic_type_temp', label: 'Statistic Type',
        options: { 'mean': 'Average (mean)', 'max': 'Maximum', 'min': 'Minimum' }, showWhen: ['temperature', 'humidity'] },
      { type: 'select', key: 'statistic_type_wind', label: 'Statistic Type',
        options: { 'max': 'Maximum', 'mean': 'Average (mean)', 'min': 'Minimum' }, showWhen: 'windspeed' },

      { type: 'number', key: 'refresh_interval', label: 'Refresh Interval (s)', min: 10, max: 3600 },
      { type: 'select', key: 'click_action', label: 'Click Action',
        options: { none: 'None', 'more-info': 'More Info', tooltip: 'Tooltip' } },
      { type: 'switch', key: 'show_entity_name', label: 'Show Entity Name' },
      { type: 'switch', key: 'show_month_year', label: 'Show Month/Year Label' },
      { type: 'switch', key: 'show_legend', label: 'Show Legend' },
      { type: 'number', key: 'cell_height', label: 'Cell Height', min: 10, max: 200 },
      { type: 'text', key: 'cell_width', label: 'Cell Width (px or fr)' },
      { type: 'number', key: 'cell_padding', label: 'Cell Padding', min: 0, max: 20 },
      { type: 'number', key: 'cell_gap', label: 'Cell Gap', min: 0, max: 20 },
      { type: 'number', key: 'cell_font_size', label: 'Cell Font Size', min: 6, max: 24 },
      { type: 'switch', key: 'compact', label: 'Compact Mode' },
      { type: 'switch', key: 'compact_header', label: 'Compact Header' },
      { type: 'switch', key: 'rounded_corners', label: 'Rounded Corners' },
      { type: 'switch', key: 'interpolate_colors', label: 'Interpolate Colors' },
      { type: 'select', key: 'color_interpolation', label: 'Color Interpolation',
        options: { rgb: 'RGB', gamma: 'Gamma RGB', hsl: 'HSL', lab: 'LAB' } },

      // Temperature and humidity shared fields
      { type: 'number', key: 'start_hour', label: 'Start Hour', min: 0, max: 23, showWhen: ['temperature', 'humidity'] },
      { type: 'number', key: 'end_hour', label: 'End Hour', min: 0, max: 23, showWhen: ['temperature', 'humidity'] },
      { type: 'number', key: 'decimals', label: 'Decimals', min: 0, max: 2 },
      { type: 'switch', key: 'fill_gaps', label: 'Fill Gaps (forward-fill last known value - use with care)', showWhen: ['temperature', 'humidity'] },
      // Temperature-only fields
      { type: 'select', key: 'unit_temp', label: 'Unit',
        options: { '': 'Auto-detect', '\u00b0C': 'Celsius', '\u00b0F': 'Fahrenheit' }, showWhen: 'temperature' },
      { type: 'switch', key: 'show_degree_symbol', label: 'Show Degree Symbol', showWhen: 'temperature' },

      // Wind-only fields
      { type: 'entity', key: 'direction_entity', label: 'Wind Direction Entity', showWhen: 'windspeed' },
      // Virtual key: writes to 'unit' in config, wind unit options
      { type: 'select', key: 'unit_wind', label: 'Unit',
        options: { '': 'Auto-detect', 'mph': 'mph', 'km/h': 'km/h', 'm/s': 'm/s', 'kn': 'knots' }, showWhen: 'windspeed' },
      { type: 'switch', key: 'show_direction', label: 'Show Direction', showWhen: 'windspeed' },
      { type: 'select', key: 'direction_format', label: 'Direction Format',
        options: { arrow: 'Arrow', cardinal: 'Cardinal', degrees: 'Degrees' }, showWhen: 'windspeed' },

      // Threshold editor - always visible
      { type: 'thresholds', key: 'color_thresholds', label: 'Colors' },
    ];

    fields.forEach(f => this._createField(f));

    this._updateValues();
    this._updateFieldVisibility();
  }

  // Show or hide conditional fields based on current card_type.
  // showWhen can be a string (single type) or array (multiple types).
  _updateFieldVisibility() {
    const cardType = this._config.card_type || 'temperature';
    for (const key in this.fields) {
      const field = this.fields[key];
      if (!field.showWhen) continue;  // Always-visible fields have no showWhen
      const visible = Array.isArray(field.showWhen)
        ? field.showWhen.includes(cardType)
        : field.showWhen === cardType;
      field.wrapper.style.display = visible ? '' : 'none';
    }
  }

  _createField({ type, key, label, min, max, options, required, showWhen }) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.marginBottom = '8px';

    let input;

    if (type === 'section') {
      // Section header with optional description — no input element
      wrapper.style.marginTop = '12px';
      wrapper.style.marginBottom = '4px';
      wrapper.style.borderBottom = '1px solid var(--divider-color, #e0e0e0)';
      wrapper.style.paddingBottom = '4px';

      const heading = document.createElement('div');
      heading.style.fontWeight = 'bold';
      heading.textContent = label;
      wrapper.appendChild(heading);

      if (options && options.description) {
        const desc = document.createElement('div');
        desc.style.fontSize = '0.82em';
        desc.style.color = 'var(--secondary-text-color)';
        desc.style.lineHeight = '1.4';
        desc.style.marginTop = '4px';
        desc.textContent = options.description;
        wrapper.appendChild(desc);
      }

      this.fields[key] = { input: null, type, wrapper, showWhen };
      this.content.appendChild(wrapper);
      return;

    } else if (type === 'switch') {
      wrapper.style.flexDirection = 'row';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '8px';

      input = document.createElement('ha-switch');
      const lbl = document.createElement('label');
      lbl.textContent = label;
      wrapper.appendChild(input);
      wrapper.appendChild(lbl);

      input.addEventListener('change', (e) => {
        e.stopPropagation();
        this._onFieldChange(key, input.checked);
      });

    } else if (type === 'thresholds') {
      const lbl = document.createElement('label');
      lbl.textContent = label;
      wrapper.appendChild(lbl);

      const list = document.createElement('div');
      list.style.display = 'grid';
      list.style.gridGap = '8px';
      wrapper.appendChild(list);

      this.container_threshold = list;

      const addBtn = document.createElement('button');
      addBtn.textContent = 'Add Threshold';
      addBtn.style.marginTop = '8px';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        newThresholds.push({ value: 0, color: '#ffffff' });
        this._onFieldChange('color_thresholds', newThresholds);
      });
      wrapper.appendChild(addBtn);

    } else {
      // ha-selector renders its own label; other types get an explicit <label>
      if (type !== 'select') {
        const lbl = document.createElement('label');
        lbl.textContent = label;
        wrapper.appendChild(lbl);
      }

      if (type === 'entity') {
        input = document.createElement('ha-entity-picker');
        input.setAttribute('allow-custom-entity', '');
        input.hass = this._hass;

        input.addEventListener('value-changed', (e) => {
          e.stopPropagation();
          this._onFieldChange(key, e.detail.value);
        });

      } else if (type === 'number' || type === 'text') {
        input = document.createElement('ha-textfield');
        input.type = type;
        if (min !== undefined) input.min = min;
        if (max !== undefined) input.max = max;
        if (required) input.required = true;

        input.addEventListener('change', (e) => {
          e.stopPropagation();
          const value = type === 'number' ? Number(input.value) : input.value;
          this._onFieldChange(key, value);
        });

      } else if (type === 'select') {
        input = document.createElement('ha-selector');
        input.hass = this._hass;
        input.selector = {
          select: {
            options: Object.entries(options).map(([value, label]) => ({ value, label })),
            mode: 'dropdown',
          }
        };
        input.label = label;

        input.addEventListener('value-changed', (e) => {
          e.stopPropagation();
          this._onFieldChange(key, e.detail.value);
        });
      }

      wrapper.appendChild(input);
    }

    // Store the wrapper and metadata for visibility control and value updates
    this.fields[key] = { input, type, wrapper, showWhen };
    this.content.appendChild(wrapper);
  }

  // Map virtual field keys to real config keys, then dispatch config-changed
  _onFieldChange(key, value) {
    let configKey = key;

    // Virtual key mapping: both variants write to the same real config key
    if (key === 'unit_temp' || key === 'unit_wind') configKey = 'unit';
    if (key === 'statistic_type_temp' || key === 'statistic_type_wind') configKey = 'statistic_type';

    const updated = { ...this._config, [configKey]: value };
    this._config = updated;

    // Update field visibility whenever card_type changes
    if (key === 'card_type') {
      this._updateFieldVisibility();
    }

    // Reconstruct with type and card_type first so YAML view has them at the top
    const { type, card_type, ...rest } = updated;
    const ordered = {};
    if (type !== undefined) ordered.type = type;
    if (card_type !== undefined) ordered.card_type = card_type;
    Object.assign(ordered, rest);

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: ordered },
      bubbles: true,
      composed: true,
    }));
  }

  _updateValues() {
    if (!this._config) return;

    for (const key in this.fields) {
      const field = this.fields[key];
      const input = field.input;

      if (field.type === 'thresholds') {
        this._refreshThresholdEditor();
        continue;
      }

      if (!input) continue;

      // Map virtual keys to the real config key for reading
      let configKey = key;
      if (key === 'unit_temp' || key === 'unit_wind') configKey = 'unit';
      if (key === 'statistic_type_temp' || key === 'statistic_type_wind') configKey = 'statistic_type';

      const value = this._config[configKey];

      if (field.type === 'switch') {
        input.checked = !!value;
      } else {
        input.value = value !== undefined ? value : '';
      }
    }
  }

  _createThresholdEditor() {
    const createRow = (threshold, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';

      const valueInput = document.createElement('ha-textfield');
      valueInput.type = 'number';
      valueInput.value = threshold.value;
      valueInput.addEventListener('change', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        const updated = { ...this._config.color_thresholds[index] };
        updated.value = Number(e.target.value);
        newThresholds[index] = updated;
        this._onFieldChange('color_thresholds', newThresholds);
        this._refreshThresholdEditor();
      });

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      // Convert rgba() to hex for browser color picker compatibility
      colorInput.value = rgbaToHex(threshold.color);
      colorInput.addEventListener('change', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        const updated = { ...this._config.color_thresholds[index] };
        updated.color = e.target.value;
        newThresholds[index] = updated;
        this._onFieldChange('color_thresholds', newThresholds);
        this._refreshThresholdEditor();
      });

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'X';
      removeBtn.style.cursor = 'pointer';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        newThresholds.splice(index, 1);
        this._onFieldChange('color_thresholds', newThresholds);
        this._refreshThresholdEditor();
      });

      row.appendChild(valueInput);
      row.appendChild(colorInput);
      row.appendChild(removeBtn);
      this.container_threshold.appendChild(row);
    };

    if (!this._config.color_thresholds) this._config.color_thresholds = [];
    this._config.color_thresholds.forEach((t, i) => createRow(t, i));
  }

  _refreshThresholdEditor() {
    if (!this.container_threshold) return;
    while (this.container_threshold.firstChild) {
      this.container_threshold.removeChild(this.container_threshold.firstChild);
    }
    this._createThresholdEditor();
  }

  disconnectedCallback() {
    this.fields = {};
    this.container_threshold = null;
  }
}
