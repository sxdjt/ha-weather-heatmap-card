// Visual configuration editor for the Sensor Heatmap Card

import { rgbaToHex } from './color-utils.js';

// Unique per editor instance, so aria-describedby ids do not collide when two editors share a root
let editorInstanceCount = 0;

// The editor renders into light DOM, so rules are scoped under its tag name
const EDITOR_STYLES = `
  ha-weather-heatmap-card-editor .visually-hidden {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }
  ha-weather-heatmap-card-editor .threshold-row {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  }
  ha-weather-heatmap-card-editor .threshold-value { width: 80px; }
  ha-weather-heatmap-card-editor .threshold-color { flex: 1 1 120px; }
  ha-weather-heatmap-card-editor .row-input {
    box-sizing: border-box; min-width: 0;
    padding: 4px 8px; font-size: 14px; border-radius: 4px;
    border: 1px solid var(--secondary-text-color, #727272);
    background: var(--card-background-color, #fff); color: var(--primary-text-color);
  }
  ha-weather-heatmap-card-editor .row-input[aria-invalid='true'] {
    border: 2px solid var(--error-color, #db4437);
  }
  ha-weather-heatmap-card-editor .color-swatch {
    width: 36px; height: 30px; padding: 0; border-radius: 4px; cursor: pointer;
    border: 1px solid var(--secondary-text-color, #727272); background: none;
  }
  /* Text stays primary color for 4.5:1; red only on non-text parts, which need 3:1 */
  ha-weather-heatmap-card-editor .error-text {
    display: flex; align-items: flex-start; gap: 6px;
    font-size: 12px; color: var(--primary-text-color);
    margin-top: 6px; padding: 4px 8px;
    border-left: 3px solid var(--error-color, #db4437);
  }
  ha-weather-heatmap-card-editor .error-text:empty { display: none; }
  ha-weather-heatmap-card-editor .error-text ha-icon {
    flex: 0 0 auto; color: var(--error-color, #db4437); --mdc-icon-size: 16px;
  }
`;

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
    this._addThresholdButton = null;
    this._idPrefix = `whc-editor-${++editorInstanceCount}`;
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
        if (input && (type === 'select' || type === 'entity' || type === 'number' || type === 'text')) {
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
      show_footer: true,
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
      // Forecast (temperature-only)
      forecast_entity: '',
      forecast_days: 3,
      forecast_type: 'daily',
      forecast_dim: 0.5,
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
    // minmax(0, 1fr) lets items shrink to the editor width. With the default auto column,
    // HA's dropdowns with long option text (Data Source) widened every row past the
    // editor under increased text spacing.
    this.content.style.gridTemplateColumns = 'minmax(0, 1fr)';
    this.content.style.gridGap = '8px';
    this.content.style.padding = '8px';
    this.appendChild(this.content);

    const style = document.createElement('style');
    style.textContent = EDITOR_STYLES;
    this.content.appendChild(style);

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
        options: { temperature: 'Temperature', windspeed: 'Wind Speed', humidity: 'Humidity', generic: 'Generic' } },

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
        options: { average: 'Average', min: 'Min', max: 'Max' }, showWhen: ['temperature', 'humidity', 'generic'] },
      // Virtual keys: both write to 'statistic_type' in config with different option sets per card type
      { type: 'select', key: 'statistic_type_temp', label: 'Statistic Type',
        options: { 'mean': 'Average (mean)', 'max': 'Maximum', 'min': 'Minimum' }, showWhen: ['temperature', 'humidity', 'generic'] },
      { type: 'select', key: 'statistic_type_wind', label: 'Statistic Type',
        options: { 'max': 'Maximum', 'mean': 'Average (mean)', 'min': 'Minimum' }, showWhen: 'windspeed' },

      { type: 'number', key: 'refresh_interval', label: 'Refresh Interval (s)', min: 10, max: 3600 },
      { type: 'select', key: 'click_action', label: 'Click Action',
        options: { none: 'None', 'more-info': 'More Info', tooltip: 'Tooltip' } },
      { type: 'switch', key: 'show_entity_name', label: 'Show Entity Name' },
      { type: 'switch', key: 'show_month_year', label: 'Show Month/Year Label' },
      { type: 'switch', key: 'show_legend', label: 'Show Legend' },
      { type: 'switch', key: 'show_footer', label: 'Show Footer (Min/Max/Avg)' },
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
      { type: 'number', key: 'start_hour', label: 'Start Hour', min: 0, max: 23, showWhen: ['temperature', 'humidity', 'generic'] },
      { type: 'number', key: 'end_hour', label: 'End Hour', min: 0, max: 23, showWhen: ['temperature', 'humidity', 'generic'] },
      { type: 'number', key: 'decimals', label: 'Decimals', min: 0, max: 2 },
      { type: 'switch', key: 'fill_gaps', label: 'Fill Gaps (forward-fill last known value - use with care)', showWhen: ['temperature', 'humidity', 'generic'] },
      // Temperature-only fields
      { type: 'select', key: 'unit_temp', label: 'Unit',
        options: { '': 'Auto-detect', '\u00b0C': 'Celsius', '\u00b0F': 'Fahrenheit' }, showWhen: 'temperature' },
      { type: 'switch', key: 'show_degree_symbol', label: 'Show Degree Symbol', showWhen: 'temperature' },

      // Forecast (temperature-only): a weather.* entity supplies the forecast
      { type: 'entity', key: 'forecast_entity', label: 'Forecast Weather Entity (optional)', showWhen: 'temperature' },
      { type: 'select', key: 'forecast_type', label: 'Forecast Type',
        options: { daily: 'Daily (high/low row)', hourly: 'Hourly (dimmed cells)' }, showWhen: 'temperature' },
      { type: 'number', key: 'forecast_days', label: 'Forecast Days', min: 1, max: 7, showWhen: 'temperature' },
      { type: 'number', key: 'forecast_dim', label: 'Forecast Dim (0 = none, 1 = invisible)', min: 0, max: 1, step: 0.1, showWhen: 'temperature' },

      // Generic-only fields
      { type: 'text', key: 'unit_generic', label: 'Unit (e.g. %, ppm, lux)', showWhen: 'generic' },

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

  _createField({ type, key, label, min, max, step, options, required, showWhen }) {
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

      // A <label> beside ha-switch is not associated with it (shadow DOM), so the visible
      // text is a plain span. In current HA (Web Awesome) only slotted text names the
      // switch's inner input, so the label is slotted visually hidden; the host aria-label
      // covers older MWC-based releases.
      input = document.createElement('ha-switch');
      input.setAttribute('aria-label', label);
      const switchName = document.createElement('span');
      switchName.className = 'visually-hidden';
      switchName.textContent = label;
      input.appendChild(switchName);
      const text = document.createElement('span');
      text.textContent = label;
      wrapper.appendChild(input);
      wrapper.appendChild(text);

      input.addEventListener('change', (e) => {
        e.stopPropagation();
        this._onFieldChange(key, input.checked);
      });

    } else if (type === 'thresholds') {
      const heading = document.createElement('div');
      heading.style.fontWeight = 'bold';
      heading.textContent = label;
      wrapper.appendChild(heading);

      const list = document.createElement('div');
      list.style.display = 'grid';
      list.style.gridGap = '8px';
      wrapper.appendChild(list);

      this.container_threshold = list;

      const addBtn = document.createElement('ha-button');
      addBtn.textContent = 'Add Threshold';
      addBtn.style.marginTop = '8px';
      addBtn.style.alignSelf = 'flex-start';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        newThresholds.push({ value: 0, color: '#ffffff' });
        this._onFieldChange('color_thresholds', newThresholds);
        this._refreshThresholdEditor();
      });
      wrapper.appendChild(addBtn);
      this._addThresholdButton = addBtn;

    } else {
      // ha-selector and ha-entity-picker render their own labels
      if (type === 'entity') {
        input = document.createElement('ha-entity-picker');
        input.setAttribute('allow-custom-entity', '');
        input.hass = this._hass;
        input.label = label;
        input.required = !!required;

        input.addEventListener('value-changed', (e) => {
          e.stopPropagation();
          this._onFieldChange(key, e.detail.value);
        });

      } else if (type === 'number' || type === 'text') {
        input = document.createElement('ha-selector');
        input.hass = this._hass;
        // ha-selector marks fields required (label asterisk) unless told otherwise
        input.required = false;
        input.label = label;
        if (type === 'number') {
          const selectorConfig = { mode: 'box', step: step !== undefined ? step : 1 };
          if (min !== undefined) selectorConfig.min = min;
          if (max !== undefined) selectorConfig.max = max;
          input.selector = { number: selectorConfig };
        } else {
          input.selector = { text: {} };
        }

        input.addEventListener('value-changed', (e) => {
          e.stopPropagation();
          const value = type === 'number' ? Number(e.detail.value) : e.detail.value;
          this._onFieldChange(key, value);
        });

      } else if (type === 'select') {
        input = document.createElement('ha-selector');
        input.hass = this._hass;
        input.required = false;
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

    // Virtual key mapping: all variants write to the same real config key
    if (key === 'unit_temp' || key === 'unit_wind' || key === 'unit_generic') configKey = 'unit';
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
        this._syncThresholdEditor();
        continue;
      }

      if (!input) continue;

      // Map virtual keys to the real config key for reading
      let configKey = key;
      if (key === 'unit_temp' || key === 'unit_wind' || key === 'unit_generic') configKey = 'unit';
      if (key === 'statistic_type_temp' || key === 'statistic_type_wind') configKey = 'statistic_type';

      const value = this._config[configKey];

      if (field.type === 'switch') {
        input.checked = !!value;
      } else {
        input.value = value !== undefined ? value : '';
      }
    }
  }

  // Hex value for the color picker, or null when the color cannot be shown there
  // (invalid, or a var(--token) that only resolves inside the card)
  _resolveColorToHex(color) {
    if (!color || color.startsWith('var(') || !CSS.supports('color', color)) return null;
    if (!this._colorContext) this._colorContext = document.createElement('canvas').getContext('2d');
    if (!this._colorContext) return null;
    // Canvas normalizes any CSS color to #rrggbb or rgba(...)
    this._colorContext.fillStyle = '#000000';
    this._colorContext.fillStyle = color;
    return rgbaToHex(this._colorContext.fillStyle);
  }

  _updateThreshold(index, key, value) {
    const newThresholds = [...this._config.color_thresholds];
    newThresholds[index] = { ...newThresholds[index], [key]: value };
    this._onFieldChange('color_thresholds', newThresholds);
  }

  _createThresholdEditor() {
    const createRow = (threshold, index) => {
      const n = index + 1;
      const errorId = `${this._idPrefix}-threshold-${index}-error`;

      const item = document.createElement('div');
      const row = document.createElement('div');
      row.className = 'threshold-row';

      const valueInput = document.createElement('input');
      valueInput.type = 'number';
      valueInput.className = 'row-input threshold-value';
      valueInput.setAttribute('aria-label', `Threshold ${n} value`);
      valueInput.value = threshold.value;
      valueInput.addEventListener('change', (e) => {
        e.stopPropagation();
        this._updateThreshold(index, 'value', Number(e.target.value));
      });

      const colorInput = document.createElement('input');
      colorInput.type = 'text';
      colorInput.className = 'row-input threshold-color';
      colorInput.placeholder = 'e.g., #FF0000';
      colorInput.setAttribute('aria-label', `Threshold ${n} color`);
      colorInput.value = threshold.color || '';

      const swatch = document.createElement('input');
      swatch.type = 'color';
      swatch.className = 'color-swatch';
      swatch.title = 'Pick a color';
      swatch.setAttribute('aria-label', `Threshold ${n} color picker`);

      const removeBtn = document.createElement('ha-button');
      removeBtn.setAttribute('appearance', 'plain');
      removeBtn.setAttribute('variant', 'danger');
      const hidden = document.createElement('span');
      hidden.className = 'visually-hidden';
      hidden.textContent = ` threshold ${n}`;
      removeBtn.append('Remove', hidden);
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newThresholds = [...this._config.color_thresholds];
        newThresholds.splice(index, 1);
        this._onFieldChange('color_thresholds', newThresholds);
        this._refreshThresholdEditor();
        // The removed row took the focused button with it; keep focus in the list
        this._addThresholdButton?.focus();
      });

      // Live region exists from the start so screen readers announce the error
      // when it appears; it is empty while the value is valid or blank
      const error = document.createElement('div');
      error.className = 'error-text';
      error.id = errorId;
      error.setAttribute('aria-live', 'polite');

      // Rebuild the message only when validity flips, so the live region announces
      // once per transition rather than on every keystroke
      let shown = false;
      const updateError = (v) => {
        const invalid = Boolean(v) && !CSS.supports('color', v);
        if (invalid === shown) return;
        shown = invalid;
        colorInput.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        if (invalid) {
          colorInput.setAttribute('aria-describedby', errorId);
        } else {
          colorInput.removeAttribute('aria-describedby');
        }
        error.replaceChildren();
        if (!invalid) return;
        const icon = document.createElement('ha-icon');
        icon.icon = 'mdi:alert-circle';
        icon.setAttribute('aria-hidden', 'true');
        const prefix = document.createElement('strong');
        prefix.textContent = 'Error: ';
        const message = document.createElement('span');
        message.append(prefix, `Threshold ${n} color is not a valid color. Use a hex code (#FF0000), a color name (red), or var(--token).`);
        error.append(icon, message);
      };

      const syncSwatch = (v) => {
        const hex = this._resolveColorToHex(v);
        if (hex) swatch.value = hex;
      };

      colorInput.setAttribute('aria-invalid', 'false');
      updateError(colorInput.value);
      syncSwatch(colorInput.value);

      colorInput.addEventListener('input', (e) => {
        e.stopPropagation();
        updateError(e.target.value);
        syncSwatch(e.target.value);
        this._updateThreshold(index, 'color', e.target.value);
      });
      colorInput.addEventListener('change', (e) => e.stopPropagation());

      swatch.addEventListener('input', (e) => {
        e.stopPropagation();
        colorInput.value = e.target.value;
        updateError(e.target.value);
        this._updateThreshold(index, 'color', e.target.value);
      });
      swatch.addEventListener('change', (e) => e.stopPropagation());

      // Called when the config comes back from HA: update values in place so the
      // focused control (or the one Tab just moved to) is never destroyed
      item._syncThreshold = (t) => {
        const color = t.color || '';
        if (!valueInput.matches(':focus') && valueInput.value !== String(t.value)) {
          valueInput.value = t.value;
        }
        if (!colorInput.matches(':focus') && colorInput.value !== color) {
          colorInput.value = color;
          updateError(color);
          syncSwatch(color);
        }
      };

      row.append(valueInput, colorInput, swatch, removeBtn);
      item.append(row, error);
      this.container_threshold.appendChild(item);
    };

    if (!this._config.color_thresholds) this._config.color_thresholds = [];
    this._config.color_thresholds.forEach((t, i) => createRow(t, i));
  }

  // Rebuild rows only when the number of thresholds changed; otherwise update in place
  _syncThresholdEditor() {
    if (!this.container_threshold) return;
    const thresholds = this._config.color_thresholds || [];
    const items = this.container_threshold.children;
    if (items.length !== thresholds.length) {
      this._refreshThresholdEditor();
      return;
    }
    thresholds.forEach((t, i) => items[i]._syncThreshold(t));
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
