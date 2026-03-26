// Weather Heatmap Card - merged temperature and wind speed heatmap card

import { createStyleElement } from './styles.js';
import {
  getTemperatureThresholdsForUnit,
  getWindThresholdsForUnit,
  DEFAULT_THRESHOLDS_HUMIDITY,
} from './constants.js';
import {
  getColorForValue,
  getContrastTextColor,
} from './color-utils.js';
import {
  escapeHtml,
  formatHourLabel,
  formatDirection,
  degreesToCardinal,
  normalizeSize,
  getDateKey,
  getHourBucket,
  averageDirection
} from './formatting.js';

/**
 * Sensor Heatmap Card - displays temperature or wind speed history as a color-coded heatmap.
 * Supports card_type: 'temperature' (default) or 'windspeed'.
 * Also registered as 'ha-temperature-heatmap-card' and 'windspeed-heatmap-card'
 * for backward compatibility with existing configurations.
 */
export class SensorHeatmapCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Configuration and state
    this._config = {};
    this._hass = null;

    // Data caching
    this._historyData = null;
    this._processedData = null;
    this._lastFetch = 0;

    // Navigation state (0=current view, -7=one week back, etc.)
    this._viewOffset = 0;

    // UI state
    this._isLoading = false;
    this._error = null;
    this._interval = null;

    // Initialize Shadow DOM
    this.shadowRoot.appendChild(createStyleElement());
    this._content = document.createElement('ha-card');
    this.shadowRoot.appendChild(this._content);

    // Event delegation for all clicks
    this._content.addEventListener('click', this._handleClick.bind(this));

    // Response cache: url -> { data, expiry }
    this._responseCache = new Map();
  }

  // Home Assistant required method: set card configuration
  setConfig(config) {
    if (!config.entity) {
      throw new Error("'entity' is required");
    }

    // Auto-detect card_type from element tag name when not specified.
    // This provides backward compat for existing windspeed-heatmap-card configs.
    let card_type = config.card_type;
    if (!card_type) {
      const tag = this.tagName.toLowerCase();
      card_type = tag === 'windspeed-heatmap-card' ? 'windspeed' : 'temperature';
    }

    if (!['temperature', 'windspeed', 'humidity'].includes(card_type)) {
      throw new Error("card_type must be 'temperature', 'windspeed', or 'humidity'");
    }

    // Validate time_interval
    const validIntervals = [1, 2, 3, 4, 6, 8, 12, 24];
    if (config.time_interval && !validIntervals.includes(config.time_interval)) {
      throw new Error(`time_interval must be one of: ${validIntervals.join(', ')}`);
    }

    if (config.days && (config.days < 1 || config.days > 365)) {
      throw new Error('days must be between 1 and 365');
    }

    const validInterpolations = ['rgb', 'gamma', 'hsl', 'lab'];
    if (config.color_interpolation && !validInterpolations.includes(config.color_interpolation)) {
      throw new Error(`color_interpolation must be one of: ${validInterpolations.join(', ')}`);
    }

    const validDataSources = ['auto', 'history', 'statistics'];
    if (config.data_source && !validDataSources.includes(config.data_source)) {
      throw new Error(`data_source must be one of: ${validDataSources.join(', ')}`);
    }

    // Decimals applies to all card types
    if (config.decimals !== undefined && (config.decimals < 0 || config.decimals > 2)) {
      throw new Error('decimals must be between 0 and 2');
    }

    // Temperature and humidity share the same validation rules
    if (card_type === 'temperature' || card_type === 'humidity') {
      const validAggregations = ['average', 'min', 'max'];
      if (config.aggregation_mode && !validAggregations.includes(config.aggregation_mode)) {
        throw new Error(`aggregation_mode must be one of: ${validAggregations.join(', ')}`);
      }
      if (config.start_hour !== undefined && (!Number.isInteger(config.start_hour) || config.start_hour < 0 || config.start_hour > 23)) {
        throw new Error('start_hour must be an integer between 0 and 23');
      }
      if (config.end_hour !== undefined && (!Number.isInteger(config.end_hour) || config.end_hour < 0 || config.end_hour > 23)) {
        throw new Error('end_hour must be an integer between 0 and 23');
      }
      const validStatTypes = ['mean', 'min', 'max'];
      if (config.statistic_type && !validStatTypes.includes(config.statistic_type)) {
        throw new Error(`statistic_type must be one of: ${validStatTypes.join(', ')}`);
      }
    }

    // Wind-only validations
    if (card_type === 'windspeed') {
      const validStatTypes = ['max', 'mean', 'min'];
      if (config.statistic_type && !validStatTypes.includes(config.statistic_type)) {
        throw new Error(`statistic_type must be one of: ${validStatTypes.join(', ')}`);
      }
    }

    const validFillGapsStyles = ['dimmed', 'none'];
    if (config.fill_gaps_style && !validFillGapsStyles.includes(config.fill_gaps_style)) {
      throw new Error(`fill_gaps_style must be one of: ${validFillGapsStyles.join(', ')}`);
    }

    // Validate cell sizing
    if (config.cell_height !== undefined) {
      const h = typeof config.cell_height === 'number' ? config.cell_height : parseFloat(config.cell_height);
      if (isNaN(h) || h < 10 || h > 200) throw new Error('cell_height must be between 10 and 200 pixels');
    }
    if (config.cell_padding !== undefined) {
      const p = typeof config.cell_padding === 'number' ? config.cell_padding : parseFloat(config.cell_padding);
      if (isNaN(p) || p < 0 || p > 20) throw new Error('cell_padding must be between 0 and 20 pixels');
    }
    if (config.cell_gap !== undefined) {
      const g = typeof config.cell_gap === 'number' ? config.cell_gap : parseFloat(config.cell_gap);
      if (isNaN(g) || g < 0 || g > 20) throw new Error('cell_gap must be between 0 and 20 pixels');
    }
    if (config.cell_font_size !== undefined) {
      const fs = typeof config.cell_font_size === 'number' ? config.cell_font_size : parseFloat(config.cell_font_size);
      if (isNaN(fs) || fs < 6 || fs > 24) throw new Error('cell_font_size must be between 6 and 24 pixels');
    }
    if (config.cell_width !== undefined && typeof config.cell_width !== 'string') {
      const w = parseFloat(config.cell_width);
      if (isNaN(w) || w < 10 || w > 500) throw new Error('cell_width as number must be between 10 and 500 pixels');
    }

    // Track whether user provided custom thresholds (wind uses this for auto-detection)
    const hasCustomThresholds = config.color_thresholds && config.color_thresholds.length > 0;

    // Default title based on type
    const defaultTitle = card_type === 'windspeed' ? 'Wind Speed History'
      : card_type === 'humidity' ? 'Humidity History'
      : 'Temperature History';

    // Build configuration with defaults
    this._config = {
      card_type,

      // Required
      entity: config.entity,

      // Display options
      title: config.title || defaultTitle,
      days: config.days || 7,
      time_interval: config.time_interval || 2,
      time_format: config.time_format || '24',

      // Unit (null = auto-detect from entity attributes)
      unit: config.unit || null,

      // Refresh
      refresh_interval: config.refresh_interval || 300,

      // Interaction
      click_action: config.click_action || 'more-info',

      // Display options
      show_entity_name: config.show_entity_name || false,
      show_legend: config.show_legend || false,
      show_month_year: config.show_month_year !== false,  // Default true

      // Cell sizing
      cell_height: config.cell_height !== undefined ? config.cell_height : 36,
      cell_width: config.cell_width !== undefined ? config.cell_width : '1fr',
      cell_padding: config.cell_padding !== undefined ? config.cell_padding : 2,
      cell_gap: config.cell_gap !== undefined ? config.cell_gap : 2,
      cell_font_size: config.cell_font_size !== undefined ? config.cell_font_size : 11,
      compact: config.compact || false,
      compact_header: config.compact_header || false,

      // Visual options
      rounded_corners: config.rounded_corners !== false,
      interpolate_colors: config.interpolate_colors || false,
      color_interpolation: config.color_interpolation || 'hsl',

      // Data source options
      data_source: config.data_source || 'auto',
      // Temperature defaults to 'mean'; wind defaults to 'max'
      statistic_type: config.statistic_type || (card_type === 'windspeed' ? 'max' : 'mean'),

      // --- Temperature-only options ---
      aggregation_mode: config.aggregation_mode || 'average',
      // Humidity sensors typically report integer percentages; temperature defaults to 1 decimal
      decimals: config.decimals !== undefined ? config.decimals : (card_type === 'humidity' ? 0 : 1),
      start_hour: config.start_hour !== undefined ? config.start_hour : 0,
      end_hour: config.end_hour !== undefined ? config.end_hour : 23,
      show_degree_symbol: config.show_degree_symbol !== false,
      fill_gaps: config.fill_gaps || false,
      fill_gaps_style: config.fill_gaps_style || 'dimmed',

      // --- Wind-only options ---
      direction_entity: config.direction_entity || null,
      show_direction: config.show_direction !== false,
      direction_format: config.direction_format || 'arrow',

      // Internal: track wind threshold auto-detection state
      // Humidity and temperature thresholds are fixed at config time; only wind needs runtime unit detection
      _hasCustomThresholds: hasCustomThresholds,
      _thresholdsInitialized: card_type !== 'windspeed' || !!config.unit || hasCustomThresholds,

      // Color thresholds
      color_thresholds: hasCustomThresholds
        ? config.color_thresholds
        : this._defaultThresholdsForConfig(card_type, config.unit),
    };

    // Sort thresholds ascending
    this._config.color_thresholds = [...this._config.color_thresholds].sort((a, b) => a.value - b.value);

    if (this._hass) {
      this._clearAndSetInterval();
    }
  }

  // Get default thresholds at config time (unit may not be known yet for wind)
  _defaultThresholdsForConfig(card_type, unit) {
    if (card_type === 'windspeed') {
      return getWindThresholdsForUnit(unit).slice();
    }
    if (card_type === 'humidity') {
      return DEFAULT_THRESHOLDS_HUMIDITY.slice();
    }
    return getTemperatureThresholdsForUnit(unit).slice();
  }

  static getConfigElement() {
    return document.createElement('ha-weather-heatmap-card-editor');
  }

  static getStubConfig() {
    return { card_type: 'temperature', entity: '' };
  }

  // Home Assistant required method: receive hass object updates
  set hass(hass) {
    this._hass = hass;

    if (!this._config || !this.isConnected) return;

    // Auto-select wind thresholds based on detected unit (first time only, no custom thresholds)
    if (this._config.card_type === 'windspeed' &&
        !this._config._hasCustomThresholds &&
        !this._config._thresholdsInitialized) {
      const detectedUnit = this._getUnit();
      if (detectedUnit) {
        this._config.color_thresholds = getWindThresholdsForUnit(detectedUnit).slice();
        this._config._thresholdsInitialized = true;
        console.log(`Weather Heatmap: Auto-selected ${detectedUnit} thresholds`);
      }
    }

    if (this._viewOffset === 0 && this._isDataStale()) {
      this._fetchHistoryData();
    }
  }

  // Home Assistant required method: return card height hint
  getCardSize() {
    const rows = this._processedData ? this._processedData.rows.length : 12;
    const sizing = this._getEffectiveSizing();
    const cellHeightPx = parseFloat(sizing.cellHeight) || 36;
    return Math.ceil((rows * cellHeightPx + 100) / 50);
  }

  connectedCallback() {
    if (this._config && this._hass) {
      this._clearAndSetInterval();
    }
  }

  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _clearAndSetInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._fetchHistoryData();
    const intervalMs = this._config.refresh_interval * 1000;
    this._interval = setInterval(() => {
      if (this._viewOffset === 0) this._fetchHistoryData();
    }, intervalMs);
  }

  _isDataStale() {
    if (!this._historyData || !this._lastFetch) return true;
    return (Date.now() - this._lastFetch) > this._config.refresh_interval * 1000;
  }

  async fetchWithCache(url, timeoutMs = 30000, ttlMs = 5 * 60 * 1000) {
    const now = Date.now();
    const cacheKey = `${url}_offset${this._viewOffset}`;
    const cached = this._responseCache.get(cacheKey);
    if (cached && cached.expiry > now) return cached.data;

    const data = await Promise.race([
      this._hass.callApi('GET', url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);

    this._responseCache.set(cacheKey, { data, expiry: now + ttlMs });
    return data;
  }

  _getDataSource() {
    const source = this._config.data_source;
    if (source === 'history') return 'history';
    if (source === 'statistics') return 'statistics';
    // Auto: always use statistics - minimum bucket is 1 hour, so pre-aggregated stats are always appropriate
    return 'statistics';
  }

  // Fetch historical data from Home Assistant
  async _fetchHistoryData() {
    if (this._isLoading) return;

    this._isLoading = true;
    this._error = null;
    this._render();  // Show loading state

    const isWind = this._config.card_type === 'windspeed';
    const dataSource = this._getDataSource();
    console.log(`Weather Heatmap: Starting ${isWind ? 'wind' : 'temperature'} fetch using ${dataSource}...`);

    try {
      const now = new Date();
      let endTime;
      let partialBucketKey = null;

      if (this._viewOffset === 0) {
        endTime = new Date(now);
        const intervalHours = this._config.time_interval;
        const currentDateKey = getDateKey(now);
        const currentHourBucket = getHourBucket(now.getHours(), intervalHours);
        partialBucketKey = `${currentDateKey}_${currentHourBucket}`;
      } else {
        endTime = new Date(now);
        endTime.setDate(endTime.getDate() + this._viewOffset);
        endTime.setHours(23, 59, 59, 999);  // End of target day
      }

      const startTime = new Date(endTime);
      startTime.setDate(startTime.getDate() - this._config.days + 1);
      startTime.setHours(0, 0, 0, 0);  // Start of first day at midnight

      if (dataSource === 'statistics') {
        await this._fetchStatisticsData(startTime, endTime, partialBucketKey);
      } else {
        await this._fetchHistoryApiData(startTime, endTime, partialBucketKey);
      }

      this._lastFetch = Date.now();
      this._processData();
      this._isLoading = false;
      this._render();

    } catch (error) {
      console.error('Weather Heatmap: Fetch error:', error);
      this._isLoading = false;
      this._error = {
        message: `Failed to fetch ${isWind ? 'wind speed' : 'temperature'} history`,
        details: error.message
      };
      this._render();
    }
  }

  // Fetch data using the history/period REST API
  async _fetchHistoryApiData(startTime, endTime, partialBucketKey = null) {
    const startISO = startTime.toISOString();
    const endISO = endTime.toISOString();
    const isWind = this._config.card_type === 'windspeed';

    const primaryUrl = `history/period/${startISO}?` +
      `filter_entity_id=${this._config.entity}&` +
      `end_time=${endISO}&minimal_response&no_attributes`;

    const fetchPromises = [this._hass.callApi('GET', primaryUrl)];

    // Fetch direction data in parallel for wind cards
    if (isWind && this._config.direction_entity && this._config.show_direction) {
      const dirUrl = `history/period/${startISO}?` +
        `filter_entity_id=${this._config.direction_entity}&` +
        `end_time=${endISO}&minimal_response&no_attributes`;
      fetchPromises.push(this._hass.callApi('GET', dirUrl));
    }

    const fetchWithTimeout = (promise, timeoutMs = 30000) => Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), timeoutMs)
      )
    ]);

    const results = await fetchWithTimeout(Promise.all(fetchPromises));

    if (isWind) {
      this._historyData = {
        speed: results[0]?.[0] || [],
        direction: results[1] ? (results[1][0] || []) : [],
        startTime, endTime, partialBucketKey, dataSource: 'history'
      };
    } else {
      this._historyData = {
        temperature: results[0]?.[0] || [],
        startTime, endTime, partialBucketKey, dataSource: 'history'
      };
    }
  }

  // Fetch data using the recorder/statistics_during_period WebSocket API
  async _fetchStatisticsData(startTime, endTime, partialBucketKey = null) {
    const startISO = startTime.toISOString();
    const endISO = endTime.toISOString();
    const isWind = this._config.card_type === 'windspeed';

    const statisticIds = [this._config.entity];
    if (isWind && this._config.direction_entity && this._config.show_direction) {
      statisticIds.push(this._config.direction_entity);
    }

    const fetchWithTimeout = (promise, timeoutMs = 30000) => Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), timeoutMs)
      )
    ]);

    const statsResult = await fetchWithTimeout(
      this._hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: startISO,
        end_time: endISO,
        statistic_ids: statisticIds,
        period: 'hour',
      })
    );

    const statisticType = this._config.statistic_type;

    if (isWind) {
      const speedStats = statsResult[this._config.entity] || [];
      const directionStats = this._config.direction_entity
        ? (statsResult[this._config.direction_entity] || [])
        : [];

      const speedData = speedStats.map(stat => ({
        last_changed: stat.start,
        state: String(stat[statisticType] ?? stat.mean ?? ''),
      })).filter(p => p.state !== '' && p.state !== 'null');

      const directionData = directionStats.map(stat => ({
        last_changed: stat.start,
        state: String(stat.mean ?? ''),
      })).filter(p => p.state !== '' && p.state !== 'null');

      this._historyData = {
        speed: speedData, direction: directionData,
        startTime, endTime, partialBucketKey, dataSource: 'statistics'
      };
    } else {
      const tempStats = statsResult[this._config.entity] || [];
      const tempData = tempStats.map(stat => ({
        last_changed: stat.start,
        state: String(stat[statisticType] ?? stat.mean ?? ''),
      })).filter(p => p.state !== '' && p.state !== 'null');

      this._historyData = {
        temperature: tempData,
        startTime, endTime, partialBucketKey, dataSource: 'statistics'
      };
    }
  }

  // Process raw history data into grid structure
  _processData() {
    if (!this._historyData) {
      this._processedData = null;
      return;
    }

    if (this._config.card_type === 'windspeed') {
      this._processWindData();
    } else {
      this._processTemperatureData();
    }
  }

  _processTemperatureData() {
    const { temperature, startTime, partialBucketKey } = this._historyData;
    const intervalHours = this._config.time_interval;
    const rowsPerDay = 24 / intervalHours;

    // Build grid using running statistics (O(1) memory per bucket)
    const grid = {};

    temperature.forEach(point => {
      const timestamp = new Date(point.last_changed || point.last_updated);
      const dateKey = getDateKey(timestamp);
      const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
      const key = `${dateKey}_${hourKey}`;

      if (!grid[key]) grid[key] = { sum: 0, count: 0, min: null, max: null };

      const value = parseFloat(point.state);
      if (!isNaN(value)) {
        grid[key].sum += value;
        grid[key].count += 1;
        grid[key].min = grid[key].min === null ? value : Math.min(grid[key].min, value);
        grid[key].max = grid[key].max === null ? value : Math.max(grid[key].max, value);
      }
    });

    // Calculate aggregated value per bucket based on aggregation_mode
    Object.keys(grid).forEach(key => {
      const bucket = grid[key];
      if (bucket.count > 0) {
        switch (this._config.aggregation_mode) {
          case 'min': bucket.temperature = bucket.min; break;
          case 'max': bucket.temperature = bucket.max; break;
          default:    bucket.temperature = bucket.sum / bucket.count; break;
        }
      } else {
        bucket.temperature = null;
      }
    });

    const dates = this._buildDates(startTime);
    const rows = [];
    let allTemperatures = [];

    for (let h = 0; h < rowsPerDay; h++) {
      const hour = h * intervalHours;
      const row = {
        hour,
        label: formatHourLabel(hour, this._config.time_format),
        cells: dates.map(date => {
          const dateKey = getDateKey(date);
          const key = `${dateKey}_${hour}`;
          const bucket = grid[key];
          const cell = {
            date,
            temperature: bucket?.temperature ?? null,
            hasData: bucket && bucket.temperature !== null,
            isPartial: partialBucketKey && key === partialBucketKey
          };
          if (cell.temperature !== null) allTemperatures.push(cell.temperature);
          return cell;
        })
      };
      rows.push(row);
    }

    // Optional gap filling: forward-fill last known value into empty past buckets per column.
    // Future buckets (beyond "now") are intentionally left empty.
    if (this._config.fill_gaps) {
      const now = Date.now();
      for (let colIndex = 0; colIndex < dates.length; colIndex++) {
        let lastKnownTemp = null;
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const cell = row.cells[colIndex];

          // Reconstruct the bucket's start time to check if it is in the past
          const bucketTime = new Date(cell.date);
          bucketTime.setHours(row.hour, 0, 0, 0);
          const isFuture = bucketTime.getTime() > now;

          if (cell.hasData) {
            lastKnownTemp = cell.temperature;
          } else if (!isFuture && lastKnownTemp !== null) {
            cell.temperature = lastKnownTemp;
            cell.hasData = true;
            cell.isFilled = true;
          }
        }
      }
    }

    // Filter rows by start_hour/end_hour configuration
    const filteredRows = rows.filter(row => this._shouldDisplayRow(row.hour));

    // Recalculate statistics from filtered rows only
    allTemperatures = [];
    filteredRows.forEach(row => {
      row.cells.forEach(cell => {
        if (cell.temperature !== null) allTemperatures.push(cell.temperature);
      });
    });

    const stats = {
      min: allTemperatures.length > 0 ? Math.min(...allTemperatures) : 0,
      max: allTemperatures.length > 0 ? Math.max(...allTemperatures) : 0,
      avg: allTemperatures.length > 0
        ? allTemperatures.reduce((a, b) => a + b, 0) / allTemperatures.length : 0
    };

    this._processedData = { rows: filteredRows, dates, stats };
  }

  _processWindData() {
    const { speed, direction, startTime, partialBucketKey } = this._historyData;
    const intervalHours = this._config.time_interval;
    const rowsPerDay = 24 / intervalHours;

    const grid = {};

    // Process speed data - track maximum speed per bucket (peak gust is most relevant)
    speed.forEach(point => {
      const timestamp = new Date(point.last_changed || point.last_updated);
      const dateKey = getDateKey(timestamp);
      const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
      const key = `${dateKey}_${hourKey}`;

      if (!grid[key]) grid[key] = { maxSpeed: null, directions: [] };

      const value = parseFloat(point.state);
      if (!isNaN(value)) {
        if (grid[key].maxSpeed === null || value > grid[key].maxSpeed) {
          grid[key].maxSpeed = value;
        }
      }
    });

    // Process direction data - collect all readings per bucket for circular averaging
    if (direction && direction.length > 0) {
      direction.forEach(point => {
        const timestamp = new Date(point.last_changed || point.last_updated);
        const dateKey = getDateKey(timestamp);
        const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
        const key = `${dateKey}_${hourKey}`;

        if (grid[key]) {
          const value = parseFloat(point.state);
          if (!isNaN(value)) grid[key].directions.push(value);
        }
      });
    }

    // Calculate circular mean direction for each bucket
    Object.keys(grid).forEach(key => {
      const bucket = grid[key];
      bucket.avgDirection = bucket.directions.length > 0
        ? averageDirection(bucket.directions)
        : null;
    });

    const dates = this._buildDates(startTime);
    const rows = [];
    const allSpeeds = [];

    for (let h = 0; h < rowsPerDay; h++) {
      const hour = h * intervalHours;
      const row = {
        hour,
        label: formatHourLabel(hour, this._config.time_format),
        cells: dates.map(date => {
          const dateKey = getDateKey(date);
          const key = `${dateKey}_${hour}`;
          const bucket = grid[key];
          const cell = {
            date,
            speed: bucket?.maxSpeed ?? null,
            direction: bucket?.avgDirection ?? null,
            hasData: bucket && bucket.maxSpeed !== null,
            isPartial: partialBucketKey && key === partialBucketKey
          };
          if (cell.speed !== null) allSpeeds.push(cell.speed);
          return cell;
        })
      };
      rows.push(row);
    }

    // Optional gap filling: forward-fill last known value into empty past buckets per column.
    // Future buckets (beyond "now") are intentionally left empty.
    if (this._config.fill_gaps) {
      const now = Date.now();
      for (let colIndex = 0; colIndex < dates.length; colIndex++) {
        let lastKnownSpeed = null;
        let lastKnownDirection = null;
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const cell = row.cells[colIndex];

          const bucketTime = new Date(cell.date);
          bucketTime.setHours(row.hour, 0, 0, 0);
          const isFuture = bucketTime.getTime() > now;

          if (cell.hasData) {
            lastKnownSpeed = cell.speed;
            lastKnownDirection = cell.direction;
          } else if (!isFuture && lastKnownSpeed !== null) {
            cell.speed = lastKnownSpeed;
            cell.direction = lastKnownDirection;
            cell.hasData = true;
            cell.isFilled = true;
            allSpeeds.push(cell.speed);
          }
        }
      }
    }

    const stats = {
      min: allSpeeds.length > 0 ? Math.min(...allSpeeds) : 0,
      max: allSpeeds.length > 0 ? Math.max(...allSpeeds) : 0,
      avg: allSpeeds.length > 0
        ? allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length : 0
    };

    this._processedData = { rows, dates, stats };
  }

  // Build array of date objects for grid columns
  _buildDates(startTime) {
    const dates = [];
    for (let d = 0; d < this._config.days; d++) {
      const date = new Date(startTime);
      date.setDate(date.getDate() + d);
      dates.push(date);
    }
    return dates;
  }

  // Check if a temperature row hour falls within the configured display range
  _shouldDisplayRow(rowHour) {
    const startHour = this._config.start_hour;
    const endHour = this._config.end_hour;
    if (startHour <= endHour) {
      // Normal range (e.g., 8-17)
      return rowHour >= startHour && rowHour <= endHour;
    }
    // Wrap-around range (e.g., 22-5 crosses midnight)
    return rowHour >= startHour || rowHour <= endHour;
  }

  // Main render method
  _render() {
    if (!this._config || !this._hass) return;

    this._content.innerHTML = `
      <div class="card-header">
        <span class="title">${escapeHtml(this._config.title)}</span>
        ${this._renderNavControls()}
      </div>

      ${this._error ? this._renderError() : ''}
      ${this._processedData && !this._error ? this._renderGrid() : ''}
      ${this._processedData && !this._error && this._config.show_legend ? this._renderLegend() : ''}
      ${this._processedData && !this._error ? this._renderFooter() : ''}
    `;

    this._content.classList.toggle('compact-header', !!this._config.compact_header);
    this._content.classList.toggle('is-loading', !!this._isLoading);

    if (this._processedData) {
      this._content.style.setProperty('--days-count', this._config.days);
      const sizing = this._getEffectiveSizing();
      this._content.style.setProperty('--cell-height', sizing.cellHeight);
      this._content.style.setProperty('--cell-width', sizing.cellWidth);
      this._content.style.setProperty('--cell-padding', sizing.cellPadding);
      this._content.style.setProperty('--cell-gap', sizing.cellGap);
      this._content.style.setProperty('--cell-font-size', sizing.cellFontSize);
      this._content.style.setProperty('--cell-border-radius', this._config.rounded_corners ? '4px' : '0');
    }
  }

  _renderNavControls() {
    const canGoForward = this._viewOffset < 0;
    const showCurrentButton = this._viewOffset < 0;
    const dateRange = this._getDateRangeLabel();

    return `
      <div class="nav-controls">
        <button class="nav-btn" data-direction="back" aria-label="Previous period">&#8592;</button>
        <span class="date-range">${dateRange}</span>
        <button class="nav-btn" data-direction="forward"
                ${canGoForward ? '' : 'disabled'}
                aria-label="Next period">&#8594;</button>
        <button class="nav-btn-current ${showCurrentButton ? '' : 'hidden'}"
                data-direction="current"
                aria-label="Jump to current"
                ${showCurrentButton ? '' : 'aria-hidden="true"'}>Current</button>
      </div>
    `;
  }

  _getDateRangeLabel() {
    if (!this._processedData) return '';
    const { dates } = this._processedData;
    const start = dates[0];
    const end = dates[dates.length - 1];
    const formatOpts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, formatOpts)} - ${end.toLocaleDateString(undefined, formatOpts)}`;
  }

  _renderLoading() {
    const type = this._config.card_type;
    const label = type === 'windspeed' ? 'wind' : type === 'humidity' ? 'humidity' : 'temperature';
    return `
      <div class="loading">
        <div class="loading-spinner"></div>
        <div style="margin-top: 8px;">Loading ${label} data...</div>
      </div>
    `;
  }

  _renderError() {
    return `
      <div class="error-message">
        <div class="error-icon">!</div>
        <div class="error-text">
          <strong>${escapeHtml(this._error.message)}</strong>
          <div class="error-details">${escapeHtml(this._error.details)}</div>
        </div>
      </div>
    `;
  }

  _renderGrid() {
    const { rows, dates } = this._processedData;
    const monthName = dates[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const dateHeaders = dates.map(date => `<div class="date-header">${date.getDate()}</div>`).join('');
    const timeLabels = rows.map(row => `<div class="time-label">${row.label}</div>`).join('');
    const dataCells = rows.map(row => row.cells.map(cell => this._renderCell(cell)).join('')).join('');

    const monthHeader = this._config.show_month_year
      ? `<div class="month-header">${monthName}</div>`
      : '';

    return `
      <div class="heatmap-grid">
        ${monthHeader}
        <div class="grid-wrapper">
          <div class="time-labels">${timeLabels}</div>
          <div class="data-grid-container">
            <div class="date-headers">${dateHeaders}</div>
            <div class="data-grid">${dataCells}</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderCell(cell) {
    if (this._config.card_type === 'windspeed') {
      return this._renderWindCell(cell);
    }
    return this._renderTemperatureCell(cell);
  }

  _renderTemperatureCell(cell) {
    if (!cell.hasData) {
      return `<div class="cell no-data"><span class="value">-</span></div>`;
    }

    const bgColor = getColorForValue(
      cell.temperature,
      this._config.color_thresholds,
      this._config.interpolate_colors,
      this._config.color_interpolation
    );
    const textColor = getContrastTextColor(bgColor);
    const decimals = this._config.decimals;
    const partialIndicator = cell.isPartial ? '*' : '';
    const partialLabel = cell.isPartial ? ' (in progress)' : '';
    const filledLabel = cell.isFilled ? ' (estimated)' : '';

    let cellClass = 'cell';
    if (cell.isPartial) cellClass += ' partial';
    // Apply filled styling only when fill_gaps_style is 'dimmed' (default); 'none' renders like real data
    if (cell.isFilled && this._config.fill_gaps_style !== 'none') cellClass += ' filled';

    return `
      <div class="${cellClass}"
           style="background-color: ${bgColor}; color: ${textColor}"
           data-value="${cell.temperature}"
           data-date="${cell.date.toISOString()}"
           data-partial="${cell.isPartial ? 'true' : 'false'}"
           data-filled="${cell.isFilled ? 'true' : 'false'}"
           tabindex="0"
           role="button"
           aria-label="Temperature ${cell.temperature.toFixed(decimals)}${partialLabel}${filledLabel}">
        <span class="value">${cell.temperature.toFixed(decimals)}${partialIndicator}</span>
      </div>
    `;
  }

  _renderWindCell(cell) {
    if (!cell.hasData) {
      return `<div class="cell no-data"><span class="value">-</span></div>`;
    }

    const bgColor = getColorForValue(
      cell.speed,
      this._config.color_thresholds,
      this._config.interpolate_colors,
      this._config.color_interpolation
    );
    const textColor = getContrastTextColor(bgColor);
    const directionStr = this._config.show_direction
      ? formatDirection(cell.direction, this._config.direction_format)
      : '';
    const partialIndicator = cell.isPartial ? '*' : '';
    const partialLabel = cell.isPartial ? ' (in progress)' : '';
    const filledLabel = cell.isFilled ? ' (estimated)' : '';

    let cellClass = 'cell';
    if (cell.isPartial) cellClass += ' partial';
    // Apply filled styling only when fill_gaps_style is 'dimmed' (default); 'none' renders like real data
    if (cell.isFilled && this._config.fill_gaps_style !== 'none') cellClass += ' filled';

    return `
      <div class="${cellClass}"
           style="background-color: ${bgColor}; color: ${textColor}"
           data-value="${cell.speed}"
           data-direction="${cell.direction !== null ? cell.direction : ''}"
           data-date="${cell.date.toISOString()}"
           data-partial="${cell.isPartial ? 'true' : 'false'}"
           data-filled="${cell.isFilled ? 'true' : 'false'}"
           tabindex="0"
           role="button"
           aria-label="Wind speed ${cell.speed.toFixed(this._config.decimals)}${partialLabel}${filledLabel}">
        <span class="value">${cell.speed.toFixed(this._config.decimals)}${partialIndicator}</span>
        ${directionStr ? `<span class="direction">${directionStr}</span>` : ''}
      </div>
    `;
  }

  _renderLegend() {
    const thresholds = this._config.color_thresholds;
    if (!thresholds || thresholds.length === 0) return '';

    const unit = this._getUnit();
    const interpolate = this._config.interpolate_colors;
    const method = this._config.color_interpolation;
    const isWind = this._config.card_type === 'windspeed';

    if (isWind) {
      // Wind: logarithmic-ish scaling anchored to max value or 75 (whichever is larger)
      const maxValue = thresholds[thresholds.length - 1].value;
      const denominator = Math.max(maxValue, 75);
      const gradientStops = thresholds.map(t => {
        const percent = Math.min((t.value / denominator) * 100, 100);
        return `${t.color} ${percent.toFixed(0)}%`;
      }).join(', ');

      const MIN_LABEL_SPACING = 8;
      let lastLabelPct = -Infinity;
      const labelHtml = thresholds.map((t, i) => {
        const pct = Math.min((t.value / denominator) * 100, 100);
        if (pct - lastLabelPct < MIN_LABEL_SPACING) return '';
        lastLabelPct = pct;
        const isLast = i === thresholds.length - 1;
        return `<span style="position:absolute; left:${pct.toFixed(1)}%;">${t.value}${isLast ? '+' : ''}</span>`;
      }).join('');

      return `
        <div class="legend">
          <div class="legend-bar" style="background: linear-gradient(to right, ${gradientStops});"></div>
          <div class="legend-labels" style="position:relative;">${labelHtml}</div>
        </div>
      `;
    } else {
      // Temperature: proportional scaling across the threshold value range
      const minVal = thresholds[0].value;
      const maxVal = thresholds[thresholds.length - 1].value;
      const range = maxVal - minVal || 1;

      let gradientStops;
      if (interpolate && thresholds.length >= 2) {
        const stops = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const value = minVal + t * range;
          const color = getColorForValue(value, thresholds, true, method);
          stops.push(`${color} ${(t * 100).toFixed(1)}%`);
        }
        gradientStops = stops.join(', ');
      } else {
        const stops = [];
        for (let i = 0; i < thresholds.length; i++) {
          const current = thresholds[i];
          const pct = ((current.value - minVal) / range) * 100;
          stops.push(`${current.color} ${pct.toFixed(1)}%`);
          if (i < thresholds.length - 1) {
            const next = thresholds[i + 1];
            const nextPct = ((next.value - minVal) / range) * 100;
            stops.push(`${current.color} ${nextPct.toFixed(1)}%`);
          }
        }
        gradientStops = stops.join(', ');
      }

      // Label positioning with collision detection to avoid crowding
      const MIN_LABEL_SPACING = 8;
      let lastLabelPct = -Infinity;
      const labels = thresholds.map(t => {
        const pct = ((t.value - minVal) / range) * 100;
        if (pct - lastLabelPct < MIN_LABEL_SPACING) return '';
        lastLabelPct = pct;
        return `<span style="position:absolute; left:${pct.toFixed(1)}%;">${t.value}${unit}</span>`;
      }).join('');

      return `
        <div class="legend">
          <div class="legend-bar" style="background: linear-gradient(to right, ${gradientStops})"></div>
          <div class="legend-labels" style="position:relative;">${labels}</div>
        </div>
      `;
    }
  }

  _renderFooter() {
    const { stats } = this._processedData;
    const unit = this._getUnit();
    const decimals = this._config.decimals;

    let entityName = '';
    if (this._config.show_entity_name) {
      const stateObj = this._hass?.states[this._config.entity];
      const friendlyName = stateObj?.attributes?.friendly_name || this._config.entity;
      entityName = `<div class="entity-name">${escapeHtml(friendlyName)}</div>`;
    }

    return `
      <div class="footer">
        <div class="footer-stats">
          <span>Min: ${stats.min.toFixed(decimals)} ${unit}</span>
          <span>Max: ${stats.max.toFixed(decimals)} ${unit}</span>
          <span>Avg: ${stats.avg.toFixed(decimals)} ${unit}</span>
        </div>
        ${entityName}
      </div>
    `;
  }

  // Get unit of measurement, handling degree symbol option for temperature
  _getUnit() {
    // Humidity is always percent — no auto-detection or config override needed
    if (this._config.card_type === 'humidity') {
      return '%';
    }

    let unit;

    if (this._config.unit) {
      unit = this._config.unit;
    } else {
      const stateObj = this._hass?.states[this._config.entity];
      const detected = stateObj?.attributes?.unit_of_measurement;

      if (this._config.card_type === 'windspeed') {
        unit = detected || 'mph';
      } else {
        unit = detected || '°F';
      }
    }

    // Strip degree symbol for temperature if show_degree_symbol is false
    if (this._config.card_type === 'temperature' && !this._config.show_degree_symbol) {
      unit = unit.replace('°', '');
    }

    return unit;
  }

  // Handle all click events (event delegation)
  _handleClick(e) {
    const navBtn = e.target.closest('.nav-btn, .nav-btn-current');
    if (navBtn && !navBtn.disabled) {
      this._handleNavigation(navBtn.dataset.direction);
      return;
    }

    const cell = e.target.closest('.cell');
    if (cell && !cell.classList.contains('no-data')) {
      this._handleCellClick(cell);
    }
  }

  _handleNavigation(direction) {
    if (direction === 'back') {
      this._viewOffset -= this._config.days;
    } else if (direction === 'forward') {
      this._viewOffset += this._config.days;
      if (this._viewOffset > 0) this._viewOffset = 0;
    } else if (direction === 'current') {
      this._viewOffset = 0;
    }
    this._fetchHistoryData();
  }

  _handleCellClick(cellElement) {
    switch (this._config.click_action) {
      case 'more-info': this._showMoreInfo(); break;
      case 'tooltip':   this._showTooltip(cellElement); break;
    }
  }

  _showMoreInfo() {
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._config.entity }
    }));
  }

  _showTooltip(cellElement) {
    // Remove any existing tooltip
    const existing = this.shadowRoot.querySelector('.tooltip');
    if (existing) existing.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';

    const date = new Date(cellElement.dataset.date);
    const dateStr = date.toLocaleString(undefined, { month: 'short', day: 'numeric' });
    const unit = this._getUnit();
    const isWind = this._config.card_type === 'windspeed';
    const isPartial = cellElement.dataset.partial === 'true';
    const partialNote = isPartial ? '<div><em>(in progress)</em></div>' : '';

    if (isWind) {
      const speed = parseFloat(cellElement.dataset.value);
      const directionDeg = cellElement.dataset.direction;
      const dirText = directionDeg
        ? ` ${degreesToCardinal(parseFloat(directionDeg))} (${Math.round(parseFloat(directionDeg))}deg)`
        : '';
      tooltip.innerHTML = `
        <div><strong>${dateStr}</strong></div>
        <div>Speed: ${speed.toFixed(1)} ${unit}${dirText}</div>
        ${partialNote}
      `;
    } else {
      const temperature = parseFloat(cellElement.dataset.value);
      const decimals = this._config.decimals;
      const isFilled = cellElement.dataset.filled === 'true';
      const filledNote = isFilled ? '<div><em>(estimated - gap filled)</em></div>' : '';
      tooltip.innerHTML = `
        <div><strong>${dateStr}</strong></div>
        <div>Temperature: ${temperature.toFixed(decimals)} ${unit}</div>
        <div>Mode: ${this._config.aggregation_mode}</div>
        ${partialNote}
        ${filledNote}
      `;
    }

    // Position tooltip near the cell
    const rect = cellElement.getBoundingClientRect();
    const parentRect = this._content.getBoundingClientRect();
    tooltip.style.left = `${rect.left - parentRect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom - parentRect.top + 4}px`;
    tooltip.style.transform = 'translateX(-50%)';

    this._content.appendChild(tooltip);

    // Auto-hide after 3 seconds
    setTimeout(() => { if (tooltip.parentElement) tooltip.remove(); }, 3000);
  }

  _getEffectiveSizing() {
    if (this._config.compact) {
      return {
        cellHeight: '24px',
        cellWidth: '1fr',
        cellPadding: '1px',
        cellGap: '1px',
        cellFontSize: '9px',
      };
    }
    return {
      cellHeight: normalizeSize(this._config.cell_height, '36px'),
      cellWidth: normalizeSize(this._config.cell_width, '1fr'),
      cellPadding: normalizeSize(this._config.cell_padding, '2px'),
      cellGap: normalizeSize(this._config.cell_gap, '2px'),
      cellFontSize: normalizeSize(this._config.cell_font_size, '11px'),
    };
  }
}
