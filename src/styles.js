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
      padding: 16px;
      border-bottom: 1px solid var(--divider-color);
      flex-wrap: wrap;
      gap: 8px;
    }

    .title {
      font-size: 20px;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    /* Navigation controls */
    .nav-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-btn {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      border: none;
      border-radius: 4px;
      width: 32px;
      height: 32px;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease;
    }

    .nav-btn:hover:not(:disabled) {
      opacity: 0.8;
    }

    .nav-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .nav-btn:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .nav-btn-current {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .nav-btn-current:hover {
      opacity: 0.8;
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
      font-size: 14px;
      color: var(--secondary-text-color);
      min-width: 120px;
      text-align: center;
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
      font-weight: bold;
      font-size: 12px;
      color: var(--primary-text-color);
      padding: 4px;
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
      border-radius: var(--cell-border-radius, 4px);
      cursor: pointer;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
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
        transform: scale(1.08);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
      font-weight: bold;
      line-height: 1.1;
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
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--divider-color);
      background: var(--card-background-color);
      font-size: 13px;
      color: var(--secondary-text-color);
    }

    .footer-stats {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }

    .footer-stats span {
      font-weight: 500;
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
      background: var(--primary-color);
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
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      padding: 8px 12px;
      font-size: 12px;
      pointer-events: none;
      max-width: 250px;
      line-height: 1.4;
    }

    .tooltip div {
      margin: 2px 0;
    }

    .tooltip strong {
      color: var(--primary-text-color);
    }

    /* Legend bar */
    .legend {
      padding: 8px 16px 12px;
      border-top: 1px solid var(--divider-color);
    }

    .legend-bar {
      height: 12px;
      border-radius: 3px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .legend-labels {
      position: relative;
      height: 14px;
      margin-top: 4px;
      font-size: 9px;
      color: var(--secondary-text-color);
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
      font-size: 14px;
    }

    .compact-header .nav-btn {
      width: 20px;
      height: 20px;
      font-size: 12px;
    }

    .compact-header .nav-btn-current {
      padding: 2px 6px;
      font-size: 11px;
    }

    .compact-header .month-header {
      font-size: 13px;
      margin-bottom: 4px;
      padding: 2px 0;
    }

    .compact-header .footer {
      padding: 6px 8px;
      gap: 4px;
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
