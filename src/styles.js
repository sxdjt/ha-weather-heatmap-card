// Card CSS styles

/**
 * Create and return a <style> element with all card CSS rules.
 * @returns {HTMLStyleElement} - Style element with card CSS
 */
export function createStyleElement() {
  const style = document.createElement('style');
  style.textContent = `
    /* Main container */
    ha-card {
      display: block;
      padding: 0;
      overflow: hidden;
      position: relative;
    }

    /* Card header with title and navigation */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--divider-color);
      flex-wrap: wrap;
      gap: 8px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.2px;
      color: var(--primary-text-color);
    }

    /* Navigation controls */
    .nav-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-btn {
      background: transparent;
      color: var(--secondary-text-color);
      border: 1.5px solid var(--divider-color);
      border-radius: 8px;
      width: 30px;
      height: 30px;
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .nav-btn:hover:not(:disabled) {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      border-color: var(--primary-color);
    }

    .nav-btn:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }

    .nav-btn:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .nav-btn-current {
      background: transparent;
      color: var(--primary-color);
      border: 1.5px solid var(--primary-color);
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .nav-btn-current:hover {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
    }

    .nav-btn-current:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .nav-btn-current.hidden {
      visibility: hidden;
      pointer-events: none;
    }

    .date-range {
      font-size: 13px;
      font-weight: 500;
      color: var(--secondary-text-color);
      min-width: 130px;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    /* Heatmap grid container */
    .heatmap-grid {
      padding: 16px;
    }

    .month-header {
      text-align: center;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color);
      margin-bottom: 12px;
    }

    /* Grid wrapper with time labels and data grid */
    .grid-wrapper {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
      align-items: start;
    }

    /* Time labels column */
    .time-labels {
      display: flex;
      flex-direction: column;
      gap: var(--cell-gap, 2px);
      padding-top: 28px;  /* Align with data grid (after date headers) */
    }

    .time-label {
      height: var(--cell-height, 36px);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      font-size: var(--cell-font-size, 11px);
      color: var(--secondary-text-color);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.1px;
    }

    /* Data grid container */
    .data-grid-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* Date headers row */
    .date-headers {
      display: grid;
      grid-template-columns: repeat(var(--days-count, 7), 1fr);
      gap: 2px;
      margin-bottom: 4px;
    }

    .date-header {
      text-align: center;
      font-weight: 500;
      font-size: 12px;
      color: var(--secondary-text-color);
      padding: 4px 2px;
      position: relative;
    }

    /* Today's date column: accent color + dot below the number */
    .date-header.today {
      color: var(--primary-color);
      font-weight: 700;
    }

    .date-header.today::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--primary-color);
    }

    /* Data cells grid */
    .data-grid {
      display: grid;
      grid-template-columns: repeat(var(--days-count, 7), var(--cell-width, 1fr));
      grid-auto-rows: var(--cell-height, 36px);
      gap: var(--cell-gap, 2px);
    }

    /* Individual cells */
    .cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: var(--cell-border-radius, 6px);
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      position: relative;
      font-size: var(--cell-font-size, 11px);
      padding: var(--cell-padding, 2px);
      box-sizing: border-box;
    }

    /* Only apply hover effects on devices with a true hover-capable pointer.
       On touch devices, :hover is sticky after tap and can cause the cell to
       render on top of the more-info popup due to the transform stacking context. */
    @media (hover: hover) {
      .cell:hover:not(.no-data) {
        transform: scale(1.1);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25), 0 0 0 1.5px rgba(255, 255, 255, 0.35);
        z-index: 10;
      }

      .cell.no-data:hover {
        transform: none;
        box-shadow: none;
      }
    }

    .cell:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .cell.no-data {
      background-color: var(--disabled-color, #f0f0f0);
      cursor: default;
      opacity: 0.4;
    }

    .cell.partial {
      border: 2px dashed currentColor;
      opacity: 0.9;
    }

    /* Gap-filled cell: estimated value from last known reading (temperature mode) */
    .cell.filled {
      opacity: 0.6;
      border: 1px dashed currentColor;
    }

    /* Primary value text (temperature or wind speed) */
    .value {
      font-weight: 700;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }

    /* Wind direction overlay (rendered below speed value) */
    .direction {
      font-size: 0.9em;
      line-height: 1.1;
      opacity: 0.85;
    }

    /* Footer with statistics */
    .footer {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px 16px 12px;
      border-top: 1px solid var(--divider-color);
      background: var(--card-background-color);
    }

    /* Three equal stat columns with thin vertical dividers */
    .footer-stats {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      align-items: center;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      padding: 4px 0;
    }

    .stat-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: var(--secondary-text-color);
      font-weight: 500;
      opacity: 0.85;
    }

    .stat-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.2px;
    }

    .stat-divider {
      width: 1px;
      height: 24px;
      background: var(--divider-color);
      margin: 0 4px;
    }

    .entity-name {
      text-align: center;
      font-size: 11px;
      color: var(--secondary-text-color);
      opacity: 0.8;
    }

    /* Loading indicator - thin bar at top of card, no layout shift */
    .loading-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      overflow: hidden;
      z-index: 10;
    }

    .loading-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: -60%;
      width: 60%;
      height: 100%;
      background: linear-gradient(
        to right,
        transparent 0%,
        var(--primary-color) 40%,
        var(--primary-color) 60%,
        transparent 100%
      );
      animation: loading-bar-slide 1.4s ease-in-out infinite;
    }

    @keyframes loading-bar-slide {
      0%   { left: -60%; }
      100% { left: 110%; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Error message */
    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      margin: 16px;
      background: rgba(244, 67, 54, 0.1);
      color: var(--error-color, #f44336);
      border-radius: 4px;
      border-left: 4px solid var(--error-color, #f44336);
    }

    .error-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .error-text {
      flex: 1;
    }

    .error-details {
      font-size: 11px;
      margin-top: 4px;
      opacity: 0.8;
    }

    /* Tooltip */
    .tooltip {
      position: absolute;
      z-index: 1000;
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.16),
        0 1px 4px rgba(0, 0, 0, 0.08);
      padding: 9px 13px;
      font-size: 12px;
      pointer-events: none;
      max-width: 240px;
      line-height: 1.5;
    }

    .tooltip div {
      margin: 1px 0;
    }

    .tooltip strong {
      color: var(--primary-text-color);
      font-weight: 600;
      display: block;
      margin-bottom: 3px;
      font-size: 12px;
    }

    /* Legend bar */
    .legend {
      padding: 8px 16px 14px;
      border-top: 1px solid var(--divider-color);
    }

    .legend-bar {
      height: 14px;
      border-radius: 7px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
    }

    .legend-labels {
      position: relative;
      height: 16px;
      margin-top: 5px;
      font-size: 10px;
      font-weight: 500;
      color: var(--secondary-text-color);
      font-variant-numeric: tabular-nums;
    }

    .legend-labels span {
      white-space: nowrap;
    }

    /* Compact header: reduces padding, title size, and nav arrow size */
    .compact-header .card-header {
      padding: 4px 8px;
      gap: 4px;
    }

    .compact-header .title {
      font-size: 13px;
    }

    .compact-header .nav-btn {
      width: 22px;
      height: 22px;
      font-size: 12px;
    }

    .compact-header .nav-btn-current {
      padding: 2px 6px;
      font-size: 10px;
    }

    .compact-header .month-header {
      font-size: 13px;
      margin-bottom: 4px;
      padding: 2px 0;
    }

    .compact-header .footer {
      padding: 6px 8px;
      gap: 3px;
    }

    .compact-header .stat-label {
      font-size: 8px;
    }

    .compact-header .stat-value {
      font-size: 11px;
    }

    /* Responsive adjustments */
    @media (max-width: 600px) {
      .data-grid {
        grid-auto-rows: calc(var(--cell-height, 36px) * 0.83);
      }

      .time-label {
        height: calc(var(--cell-height, 36px) * 0.83);
        font-size: calc(var(--cell-font-size, 11px) * 0.91);
      }

      .cell {
        font-size: calc(var(--cell-font-size, 11px) * 0.91);
      }

      .date-header {
        font-size: 11px;
      }
    }

    @media (max-width: 400px) {
      .card-header {
        flex-direction: column;
        align-items: stretch;
      }

      .nav-controls {
        justify-content: center;
      }
    }

    /* Accessibility: High contrast mode support */
    @media (prefers-contrast: high) {
      .cell:not(.no-data) {
        border: 1px solid currentColor;
      }
    }

    /* Accessibility: Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .cell,
      .nav-btn,
      .loading-bar::after {
        transition: none;
        animation: none;
      }
    }
  `;
  return style;
}
