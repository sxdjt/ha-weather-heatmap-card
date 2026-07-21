// Weather Heatmap Card - merged temperature and wind speed heatmap card

import { createStyleElement } from './styles.js';
import {
  getTemperatureThresholdsForUnit,
  getWindThresholdsForUnit,
  DEFAULT_THRESHOLDS_HUMIDITY,
  getWeatherConditionIcon,
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

    // Daily forecast data: map of dateKey -> { high, low, condition }
    // Populated from the weather.get_forecasts service (type: daily) when
    // forecast_entity is set and forecast_type is 'daily'.
    this._forecastData = null;

    // Hourly forecast data: map of `${dateKey}_${hourBucket}` -> { temperature, condition }
    // Populated from the weather.get_forecasts service (type: hourly) when
    // forecast_entity is set and forecast_type is 'hourly'.
    this._forecastHourly = null;

    // Navigation state (0=current view, -7=one week back, etc.)
    this._viewOffset = 0;

    // Active aggregation mode for non-wind cards - runtime state, separate from config
    // so the user can toggle it on the fly without modifying the saved config.
    this._activeAggregationMode = null;

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

    if (!['temperature', 'windspeed', 'humidity', 'generic'].includes(card_type)) {
      throw new Error("card_type must be 'temperature', 'windspeed', 'humidity', or 'generic'");
    }

    // Validate time_interval
    const validIntervals = [1, 2, 3, 4, 6, 8, 12, 24];
    if (config.time_interval && !validIntervals.includes(config.time_interval)) {
      throw new Error(`time_interval must be one of: ${validIntervals.join(', ')}`);
    }

    if (config.days && (config.days < 1 || config.days > 365)) {
      throw new Error('days must be between 1 and 365');
    }

    // Forecast is a temperature-only feature. Validate forecast_days when configured.
    if (config.forecast_days !== undefined &&
        (!Number.isInteger(config.forecast_days) || config.forecast_days < 1 || config.forecast_days > 7)) {
      throw new Error('forecast_days must be an integer between 1 and 7');
    }
    if (config.forecast_entity && card_type !== 'temperature') {
      throw new Error('forecast_entity is only supported when card_type is temperature');
    }
    if (config.forecast_type !== undefined && !['daily', 'hourly'].includes(config.forecast_type)) {
      throw new Error("forecast_type must be 'daily' or 'hourly'");
    }
    // forecast_dim is the fraction by which forecast cells are dimmed relative to
    // live data (0 = no dimming, 1 = fully transparent). Only applies to hourly forecast.
    if (config.forecast_dim !== undefined &&
        (typeof config.forecast_dim !== 'number' || config.forecast_dim < 0 || config.forecast_dim > 1)) {
      throw new Error('forecast_dim must be a number between 0 and 1');
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

    // Temperature, humidity, and generic share the same validation rules
    if (card_type === 'temperature' || card_type === 'humidity' || card_type === 'generic') {
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
      : card_type === 'generic' ? 'Sensor History'
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
      show_footer: config.show_footer !== false,           // Default true

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

      // --- Forecast options (temperature card only) ---
      // A weather.* entity supplies the daily high/low forecast; when set, future
      // day columns are appended to the grid with a forecast header row.
      forecast_entity: config.forecast_entity || null,
      forecast_days: config.forecast_days || 3,
      // 'daily' appends a high/low header row over future day columns.
      // 'hourly' fills the future day columns' hourly cells with forecast temps,
      // rendered dimmer than live data (see forecast_dim).
      forecast_type: config.forecast_type || 'daily',
      forecast_dim: config.forecast_dim !== undefined ? config.forecast_dim : 0.5,

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

    // Initialize active aggregation mode from config.
    // Wind defaults to 'max' (peak gust); other types default to 'average'.
    if (card_type === 'windspeed') {
      this._activeAggregationMode = 'max';
    } else {
      this._activeAggregationMode = config.aggregation_mode || 'average';
    }

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
    if (card_type === 'generic') {
      // No default color scale - user must configure thresholds for their specific sensor
      return [];
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

  // Home Assistant required method: return card height hint (legacy)
  getCardSize() {
    const rows = this._processedData ? this._processedData.rows.length : 12;
    const sizing = this._getEffectiveSizing();
    const cellHeightPx = parseFloat(sizing.cellHeight) || 36;
    // The daily high/low forecast row adds roughly one extra cell height.
    // Hourly forecast reuses the existing hourly cells, so it adds no height.
    const forecastPx = this._showForecastRow() ? cellHeightPx : 0;
    return Math.ceil((rows * cellHeightPx + forecastPx + 100) / 50);
  }

  // Home Assistant grid layout options (HA 2024.x+); suppresses the resize warning
  // and enables proper full-width / custom-size support in the Layout tab
  getGridOptions() {
    const rows = this._processedData ? this._processedData.rows.length : 12;
    const sizing = this._getEffectiveSizing();
    const cellHeightPx = parseFloat(sizing.cellHeight) || 36;
    const forecastPx = this._showForecastRow() ? cellHeightPx : 0;
    const gridRows = Math.ceil((rows * cellHeightPx + forecastPx + 100) / 50);
    return {
      columns: 12,
      rows: gridRows,
      min_columns: 6,
      min_rows: 4,
    };
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

      // Fetch daily forecast for future columns (temperature card, current view only).
      // A forecast failure must not break the historical heatmap, so it is best-effort.
      if (this._forecastActive()) {
        await this._fetchForecastData();
      } else {
        this._forecastData = null;
        this._forecastHourly = null;
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

      // Store all three HA pre-computed stats per hourly bucket so the aggregation
      // toggle can switch between them without a refetch.
      const speedData = speedStats.map(stat => ({
        last_changed: stat.start,
        mean: stat.mean ?? null,
        max: stat.max ?? null,
        min: stat.min ?? null,
      })).filter(p => p.mean !== null || p.max !== null || p.min !== null);

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

  /**
   * Whether the forecast feature is active for the current view.
   * Forecast is a temperature-only feature and only shown on the current view
   * (offset 0) since it describes future days - browsing history hides it.
   * @returns {boolean}
   */
  _forecastActive() {
    return !!this._config.forecast_entity
      && this._config.card_type === 'temperature'
      && this._viewOffset === 0;
  }

  /**
   * Whether the hourly forecast mode is active. In this mode the appended future
   * day columns have their hourly cells filled with forecast temperatures.
   * @returns {boolean}
   */
  _hourlyForecast() {
    return this._forecastActive() && this._config.forecast_type === 'hourly';
  }

  /**
   * Whether the separate daily high/low forecast row should be rendered.
   * Only the 'daily' forecast type uses that row; hourly forecast uses the grid cells.
   * @returns {boolean}
   */
  _showForecastRow() {
    return this._forecastActive() && this._config.forecast_type === 'daily';
  }

  /**
   * Fetch the forecast from the configured weather entity via the
   * weather.get_forecasts service. Daily forecast is stored as a
   * dateKey -> {high, low, condition} map; hourly forecast is bucketed into the
   * grid's time buckets as a `${dateKey}_${hourBucket}` -> {temperature, condition} map.
   * Best-effort: any failure logs a warning and clears forecast data without
   * disrupting the historical heatmap.
   */
  async _fetchForecastData() {
    const entityId = this._config.forecast_entity;
    const isHourly = this._config.forecast_type === 'hourly';
    try {
      const fetchWithTimeout = (promise, timeoutMs = 30000) => Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Forecast request timeout after 30 seconds')), timeoutMs)
        )
      ]);

      // weather.get_forecasts returns { <entity_id>: { forecast: [ {datetime, temperature, templow, condition}, ... ] } }
      const result = await fetchWithTimeout(this._hass.callWS({
        type: 'call_service',
        domain: 'weather',
        service: 'get_forecasts',
        service_data: { type: isHourly ? 'hourly' : 'daily' },
        target: { entity_id: entityId },
        return_response: true,
      }));

      const forecastList = result?.response?.[entityId]?.forecast || [];

      if (isHourly) {
        this._forecastHourly = this._bucketHourlyForecast(forecastList);
        this._forecastData = null;
      } else {
        const forecastMap = {};
        forecastList.forEach(item => {
          if (!item.datetime) return;
          const dateKey = getDateKey(new Date(item.datetime));
          forecastMap[dateKey] = {
            // 'temperature' is the daily high, 'templow' is the daily low
            high: item.temperature ?? null,
            low: item.templow ?? null,
            condition: item.condition || null,
          };
        });
        this._forecastData = forecastMap;
        this._forecastHourly = null;
      }
    } catch (error) {
      console.warn('Weather Heatmap: Forecast fetch failed:', error.message);
      this._forecastData = null;
      this._forecastHourly = null;
    }
  }

  /**
   * Bucket an hourly forecast list into the same time buckets the heatmap grid uses,
   * so forecast temperatures line up with the hourly rows. Multiple forecast hours
   * that land in one bucket (when time_interval > 1) are averaged.
   * @param {Array} forecastList - hourly forecast items with datetime/temperature/condition
   * @returns {Object} map of `${dateKey}_${hourBucket}` -> { temperature, condition }
   */
  _bucketHourlyForecast(forecastList) {
    const intervalHours = this._config.time_interval;
    const buckets = {};

    forecastList.forEach(item => {
      if (!item.datetime || item.temperature === null || item.temperature === undefined) return;
      const timestamp = new Date(item.datetime);
      const dateKey = getDateKey(timestamp);
      const hourBucket = getHourBucket(timestamp.getHours(), intervalHours);
      const key = `${dateKey}_${hourBucket}`;

      if (!buckets[key]) buckets[key] = { sum: 0, count: 0, condition: null };
      buckets[key].sum += item.temperature;
      buckets[key].count += 1;
      // Keep the condition from the first forecast hour that falls in the bucket
      if (buckets[key].condition === null && item.condition) buckets[key].condition = item.condition;
    });

    const map = {};
    Object.keys(buckets).forEach(key => {
      const bucket = buckets[key];
      map[key] = {
        temperature: bucket.count > 0 ? bucket.sum / bucket.count : null,
        condition: bucket.condition,
      };
    });
    return map;
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

    // Calculate aggregated value per bucket based on active aggregation mode.
    // Uses _activeAggregationMode (runtime) so the user can toggle without a refetch.
    Object.keys(grid).forEach(key => {
      const bucket = grid[key];
      if (bucket.count > 0) {
        switch (this._activeAggregationMode || 'average') {
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

    // Forecast columns are the future days appended after the historical days.
    // In 'daily' mode their hourly cells carry no data and render blank (the daily
    // high/low is shown in the forecast row). In 'hourly' mode the cells are filled
    // with forecast temperatures, rendered dimmer than live data.
    const forecastActive = this._forecastActive();
    const hourlyForecast = this._hourlyForecast() ? this._forecastHourly : null;
    const historyColumnCount = this._config.days;
    // Today is the last historical column; live data only covers it up to "now".
    // In hourly forecast mode, its remaining future hours are forward-filled from
    // the forecast so today joins seamlessly with the appended forecast columns.
    const todayColumnIndex = historyColumnCount - 1;
    const nowMs = Date.now();

    // The current (partial) hourly bucket often has no aggregated reading yet - the
    // statistics API only finalizes an hour once it completes, so the in-progress
    // bucket comes back empty. Fall back to the entity's live state so the current
    // bucket shows the latest value instead of a blank cell.
    let liveTemperature = null;
    if (partialBucketKey) {
      const liveState = this._hass?.states?.[this._config.entity]?.state;
      const parsedLive = parseFloat(liveState);
      if (!isNaN(parsedLive)) liveTemperature = parsedLive;
    }

    for (let h = 0; h < rowsPerDay; h++) {
      const hour = h * intervalHours;
      const row = {
        hour,
        label: formatHourLabel(hour, this._config.time_format),
        cells: dates.map((date, colIndex) => {
          const dateKey = getDateKey(date);
          const key = `${dateKey}_${hour}`;
          const isForecastCol = forecastActive && colIndex >= historyColumnCount;

          // Forecast columns: use the hourly forecast value in hourly mode,
          // otherwise leave blank (daily mode shows high/low in the forecast row).
          if (isForecastCol) {
            const forecast = hourlyForecast ? hourlyForecast[key] : null;
            const forecastTemp = forecast ? forecast.temperature : null;
            return {
              date,
              temperature: forecastTemp,
              hasData: forecastTemp !== null,
              isPartial: false,
              isForecast: true,
            };
          }

          const bucket = grid[key];
          const cell = {
            date,
            temperature: bucket?.temperature ?? null,
            hasData: bucket && bucket.temperature !== null,
            isPartial: partialBucketKey && key === partialBucketKey,
            isForecast: false
          };

          // Partial (current) bucket with no aggregated reading yet: use the live
          // entity state so the in-progress hour shows the current value.
          if (cell.isPartial && !cell.hasData && liveTemperature !== null) {
            cell.temperature = liveTemperature;
            cell.hasData = true;
          }

          // Forward-fill today's remaining hours with hourly forecast values so the
          // current day is continuous. Only future, still-empty buckets are filled;
          // real/live readings and past gaps are left untouched.
          if (hourlyForecast && !cell.hasData && colIndex === todayColumnIndex) {
            const bucketTime = new Date(date);
            bucketTime.setHours(hour, 0, 0, 0);
            if (bucketTime.getTime() > nowMs) {
              const forecast = hourlyForecast[key];
              if (forecast && forecast.temperature !== null) {
                cell.temperature = forecast.temperature;
                cell.hasData = true;
                cell.isForecast = true;
              }
            }
          }

          // Live/historical temperatures drive the color scale; forecast fills do not.
          if (cell.temperature !== null && !cell.isForecast) allTemperatures.push(cell.temperature);
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

    // Recalculate statistics from filtered rows only.
    // Forecast cells are excluded so Min/Max/Avg reflect measured history only.
    allTemperatures = [];
    filteredRows.forEach(row => {
      row.cells.forEach(cell => {
        if (cell.temperature !== null && !cell.isForecast) allTemperatures.push(cell.temperature);
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
    const { speed, direction, startTime, partialBucketKey, dataSource } = this._historyData;
    const intervalHours = this._config.time_interval;
    const rowsPerDay = 24 / intervalHours;
    const activeMode = this._activeAggregationMode || 'max';
    const isStatistics = dataSource === 'statistics';

    // Maps toggle mode to the HA statistics field name (statistics path only)
    const modeToStatField = { average: 'mean', max: 'max', min: 'min' };
    const statField = modeToStatField[activeMode] || 'max';

    const grid = {};

    // Process speed data.
    // Statistics path: each point covers exactly one HA hourly bucket with pre-computed
    //   mean/max/min - select the relevant field so toggling modes needs no refetch.
    // History path: multiple raw readings may fall in one bucket - track all stats so
    //   any aggregation mode can be applied without re-fetching.
    speed.forEach(point => {
      const timestamp = new Date(point.last_changed || point.last_updated);
      const dateKey = getDateKey(timestamp);
      const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
      const key = `${dateKey}_${hourKey}`;

      if (!grid[key]) grid[key] = { sum: 0, count: 0, min: null, max: null, directions: [] };

      const value = isStatistics
        ? parseFloat(point[statField] ?? point.mean ?? '')
        : parseFloat(point.state);

      if (!isNaN(value)) {
        grid[key].sum += value;
        grid[key].count += 1;
        grid[key].min = grid[key].min === null ? value : Math.min(grid[key].min, value);
        grid[key].max = grid[key].max === null ? value : Math.max(grid[key].max, value);
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

    // Compute final speed and direction for each bucket.
    // Both history and statistics paths apply the same aggregation logic.
    // With time_interval > 1, multiple HA hourly stat buckets may land in the same
    // heatmap cell (e.g. time_interval: 2 gives two hourly stats per cell), so the
    // statistics path must aggregate just like the history path does.
    Object.keys(grid).forEach(key => {
      const bucket = grid[key];
      if (bucket.count > 0) {
        switch (activeMode) {
          case 'min':     bucket.speed = bucket.min; break;
          case 'average': bucket.speed = bucket.sum / bucket.count; break;
          default:        bucket.speed = bucket.max; break;  // 'max' is wind default
        }
      } else {
        bucket.speed = null;
      }
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
            speed: bucket?.speed ?? null,
            direction: bucket?.avgDirection ?? null,
            hasData: bucket && bucket.speed !== null,
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

  // Build array of date objects for grid columns.
  // When forecast is active, additional future day columns are appended after the
  // historical days so the grid spans a continuous past -> future timeline.
  _buildDates(startTime) {
    const dates = [];
    const totalDays = this._config.days + (this._forecastActive() ? this._config.forecast_days : 0);
    for (let d = 0; d < totalDays; d++) {
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
      ${this._isLoading ? '<div class="loading-bar"></div>' : ''}
      <div class="card-header">
        <span class="title">${escapeHtml(this._config.title)}</span>
        ${this._renderNavControls()}
      </div>

      ${this._error ? this._renderError() : ''}
      ${this._processedData && !this._error ? this._renderGrid() : ''}
      ${this._processedData && !this._error && this._config.show_legend ? this._renderLegend() : ''}
      ${this._processedData && !this._error && this._config.show_footer ? this._renderFooter() : ''}
    `;

    this._content.classList.toggle('compact-header', !!this._config.compact_header);

    if (this._processedData) {
      // Column count includes appended forecast days when forecast is active.
      const columnCount = this._processedData.dates.length;
      this._content.style.setProperty('--days-count', columnCount);
      const sizing = this._getEffectiveSizing();
      this._content.style.setProperty('--cell-height', sizing.cellHeight);
      this._content.style.setProperty('--cell-width', sizing.cellWidth);
      this._content.style.setProperty('--cell-padding', sizing.cellPadding);
      this._content.style.setProperty('--cell-gap', sizing.cellGap);
      this._content.style.setProperty('--cell-font-size', sizing.cellFontSize);
      // Rounded corners only make sense with a visible gap; when gap is 0
      // the curved edges of adjacent cells reveal the card background and look like lines.
      const gapIsZero = parseFloat(sizing.cellGap) === 0;
      this._content.style.setProperty('--cell-border-radius', this._config.rounded_corners && !gapIsZero ? '6px' : '0');

      // Apply sizing directly on the grid element in addition to CSS variables,
      // in case CSS variable inheritance through ha-card is unreliable.
      const dataGrid = this._content.querySelector('.data-grid');
      if (dataGrid) {
        dataGrid.style.gap = sizing.cellGap;
        dataGrid.style.gridAutoRows = sizing.cellHeight;
        dataGrid.style.gridTemplateColumns = `repeat(${columnCount}, ${sizing.cellWidth})`;
      }
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
        ${this._renderAggregationToggle()}
      </div>
    `;
  }

  /**
   * Render the aggregation mode toggle button (non-wind cards only).
   * Shows the current mode (Avg/Min/Max) and cycles on click.
   * A non-default mode is highlighted so the user knows they are not viewing averages.
   * @returns {string} HTML string for the toggle button
   */
  _renderAggregationToggle() {
    const AGG_LABELS = { average: 'Avg', min: 'Min', max: 'Max' };
    const mode = this._activeAggregationMode || 'average';
    const label = AGG_LABELS[mode] || mode;
    return `
      <button class="nav-btn-current"
              data-action="toggle-aggregation"
              title="Switch aggregation mode (current: ${mode})"
              aria-label="Switch aggregation mode, currently ${mode}">${label}</button>
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
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const sameMonth = firstDate.getMonth() === lastDate.getMonth() && firstDate.getFullYear() === lastDate.getFullYear();
    let monthName;
    if (sameMonth) {
      monthName = firstDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } else if (firstDate.getFullYear() === lastDate.getFullYear()) {
      // Same year, different months: "April - June 2026"
      const firstMonth = firstDate.toLocaleDateString(undefined, { month: 'long' });
      const lastMonthYear = lastDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      monthName = `${firstMonth} - ${lastMonthYear}`;
    } else {
      // Different years: "December 2025 - June 2026"
      const firstMonthYear = firstDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const lastMonthYear = lastDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      monthName = `${firstMonthYear} - ${lastMonthYear}`;
    }
    const todayKey = new Date().toDateString();
    const dateHeaders = dates.map(date => {
      const isToday = date.toDateString() === todayKey;
      return `<div class="date-header${isToday ? ' today' : ''}">${date.getDate()}</div>`;
    }).join('');
    const timeLabels = rows.map(row => `<div class="time-label">${row.label}</div>`).join('');
    const dataCells = rows.map(row => row.cells.map(cell => this._renderCell(cell)).join('')).join('');

    const monthHeader = this._config.show_month_year
      ? `<div class="month-header">${monthName}</div>`
      : '';

    // The daily high/low forecast row sits between the date headers and the hourly
    // grid, aligned to the future day columns. Only rendered in 'daily' forecast
    // mode; 'hourly' mode fills the grid cells instead of using a separate row.
    const showForecastRow = this._showForecastRow();
    const forecastSection = showForecastRow
      ? `<div class="forecast-spacer"></div>
         <div class="forecast-row">${this._renderForecastRow(dates)}</div>`
      : '';

    return `
      <div class="heatmap-grid">
        ${monthHeader}
        <div class="grid-wrapper${showForecastRow ? ' has-forecast' : ''}">
          <div class="date-header-spacer"></div>
          <div class="date-headers">${dateHeaders}</div>
          ${forecastSection}
          <div class="time-labels">${timeLabels}</div>
          <div class="data-grid">${dataCells}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render the forecast row: one cell per grid column, aligned to the columns
   * of the hourly grid. Historical columns render empty placeholders; future
   * (forecast) columns show the daily condition icon and high/low temperature.
   * @param {Array<Date>} dates - Full column date list (historical + forecast)
   * @returns {string} HTML string for the forecast row cells
   */
  _renderForecastRow(dates) {
    const historyColumnCount = this._config.days;
    const decimals = this._config.decimals;
    const degree = this._config.show_degree_symbol ? '°' : '';

    // Today is the last historical column; the forecast covers it too, so render
    // forecast cells from today's column onward. Earlier historical columns stay empty.
    const firstForecastColumn = historyColumnCount - 1;

    return dates.map((date, colIndex) => {
      // Past historical columns have no forecast - keep an empty cell to preserve column width
      if (colIndex < firstForecastColumn) {
        return '<div class="forecast-cell empty"></div>';
      }

      const dateKey = getDateKey(date);
      const forecast = this._forecastData ? this._forecastData[dateKey] : null;
      if (!forecast || (forecast.high === null && forecast.low === null)) {
        return '<div class="forecast-cell empty"></div>';
      }

      // Tint the cell by the day's high using the same threshold scale as the heatmap
      let styleAttr = '';
      if (forecast.high !== null) {
        const bgColor = getColorForValue(
          forecast.high,
          this._config.color_thresholds,
          this._config.interpolate_colors,
          this._config.color_interpolation
        );
        const textColor = getContrastTextColor(bgColor);
        styleAttr = ` style="background-color: ${bgColor}; color: ${textColor}"`;
      }

      const iconName = forecast.condition ? getWeatherConditionIcon(forecast.condition) : null;
      const iconHtml = iconName
        ? `<ha-icon class="forecast-icon" icon="${iconName}"></ha-icon>`
        : '';
      const highStr = forecast.high !== null ? `${forecast.high.toFixed(decimals)}${degree}` : '-';
      const lowStr = forecast.low !== null ? `${forecast.low.toFixed(decimals)}${degree}` : '-';
      const conditionLabel = forecast.condition ? ` ${forecast.condition}` : '';

      return `
        <div class="forecast-cell"
             data-forecast="true"
             data-date="${date.toISOString()}"
             tabindex="0"
             role="button"
             aria-label="Forecast${conditionLabel}, high ${highStr}, low ${lowStr}"${styleAttr}>
          ${iconHtml}
          <span class="forecast-high">${highStr}</span>
          <span class="forecast-low">${lowStr}</span>
        </div>
      `;
    }).join('');
  }

  _renderCell(cell) {
    if (this._config.card_type === 'windspeed') {
      return this._renderWindCell(cell);
    }
    return this._renderTemperatureCell(cell);
  }

  _renderTemperatureCell(cell) {
    // Forecast columns with no value render as a blank, non-interactive cell.
    // This covers all daily-mode forecast columns and any hourly-mode bucket the
    // forecast does not cover (e.g. beyond the weather entity's hourly range).
    if (cell.isForecast && !cell.hasData) {
      return `<div class="cell forecast-blank"></div>`;
    }
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
    const forecastLabel = cell.isForecast ? ' (forecast)' : '';

    let cellClass = 'cell';
    if (cell.isPartial) cellClass += ' partial';
    // Apply filled styling only when fill_gaps_style is 'dimmed' (default); 'none' renders like real data
    if (cell.isFilled && this._config.fill_gaps_style !== 'none') cellClass += ' filled';
    if (cell.isForecast) cellClass += ' forecast';

    // Dim forecast cells relative to live data. opacity = 1 - forecast_dim,
    // so forecast_dim 0.5 renders forecast cells at half opacity.
    const forecastStyle = cell.isForecast
      ? ` opacity: ${(1 - this._config.forecast_dim).toFixed(3)};`
      : '';

    return `
      <div class="${cellClass}"
           style="background-color: ${bgColor}; color: ${textColor};${forecastStyle}"
           data-value="${cell.temperature}"
           data-date="${cell.date.toISOString()}"
           data-partial="${cell.isPartial ? 'true' : 'false'}"
           data-filled="${cell.isFilled ? 'true' : 'false'}"
           data-forecast="${cell.isForecast ? 'true' : 'false'}"
           tabindex="0"
           role="button"
           aria-label="Temperature ${cell.temperature.toFixed(decimals)}${partialLabel}${filledLabel}${forecastLabel}">
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
          <div class="stat">
            <span class="stat-label">Min</span>
            <span class="stat-value">${stats.min.toFixed(decimals)} ${unit}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-label">Max</span>
            <span class="stat-value">${stats.max.toFixed(decimals)} ${unit}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-label">Avg</span>
            <span class="stat-value">${stats.avg.toFixed(decimals)} ${unit}</span>
          </div>
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
    // Check for aggregation toggle before the nav-btn-current check since the
    // agg button reuses that class - data-action is the reliable discriminator.
    const aggBtn = e.target.closest('[data-action="toggle-aggregation"]');
    if (aggBtn) {
      this._cycleAggregationMode();
      return;
    }

    const navBtn = e.target.closest('.nav-btn, .nav-btn-current');
    if (navBtn && !navBtn.disabled) {
      this._handleNavigation(navBtn.dataset.direction);
      return;
    }

    // Forecast cells open more-info for the weather entity (not the sensor entity)
    const forecastCell = e.target.closest('.forecast-cell');
    if (forecastCell && forecastCell.dataset.forecast === 'true') {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        bubbles: true,
        composed: true,
        detail: { entityId: this._config.forecast_entity }
      }));
      return;
    }

    const cell = e.target.closest('.cell');
    if (cell && !cell.classList.contains('no-data') && !cell.classList.contains('forecast-blank')) {
      // Hourly forecast cells describe the weather entity, not the sensor -
      // open more-info for the weather entity to match the daily forecast row.
      if (cell.classList.contains('forecast')) {
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          bubbles: true,
          composed: true,
          detail: { entityId: this._config.forecast_entity }
        }));
        return;
      }
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

  /**
   * Cycle the active aggregation mode through average -> min -> max -> average.
   * Re-processes the already-cached raw history data - no network fetch needed.
   */
  _cycleAggregationMode() {
    const CYCLE = ['average', 'min', 'max'];
    const currentIndex = CYCLE.indexOf(this._activeAggregationMode || 'average');
    this._activeAggregationMode = CYCLE[(currentIndex + 1) % CYCLE.length];
    this._processData();
    this._render();
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
        <div>Mode: ${this._activeAggregationMode || 'max'}</div>
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
        <div>Mode: ${this._activeAggregationMode || 'average'}</div>
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
    return {
      cellHeight: normalizeSize(this._config.cell_height, '36px'),
      cellWidth: normalizeSize(this._config.cell_width, '1fr'),
      cellPadding: normalizeSize(this._config.cell_padding, '2px'),
      cellGap: normalizeSize(this._config.cell_gap, '2px'),
      cellFontSize: normalizeSize(this._config.cell_font_size, '11px'),
    };
  }
}
