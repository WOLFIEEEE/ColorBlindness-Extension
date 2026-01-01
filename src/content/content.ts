/**
 * Content Script for Color Blindness Simulator
 * 
 * Handles injecting SVG filters into the page and applying/removing
 * color blindness simulation filters.
 */

import type { FilterConfig } from '../lib/colorblind-filters';
import { getColorMatrix } from '../lib/colorblind-filters';
import { createLogger } from '../lib/logger';
import { isRestrictedPage } from '../lib/errors';

const logger = createLogger('ContentScript');

// Check if we're on a restricted page
const restrictedCheck = isRestrictedPage(window.location.href);
if (restrictedCheck.restricted) {
  logger.debug('Content script loaded on restricted page, skipping initialization');
}

// Filter element ID
const FILTER_SVG_ID = 'colorblind-simulator-svg';
const FILTER_ID = 'colorblind-filter';

// Current state
let currentConfig: FilterConfig | null = null;
let isEnabled = false;

/**
 * Generate SVG filter string based on configuration
 * Uses the shared getColorMatrix function from colorblind-filters module
 */
function generateSVGFilterString(config: FilterConfig): string {
  const matrix = getColorMatrix(config);
  return matrix.join(' ');
}

/**
 * Inject SVG filter into the page
 */
function injectSVGFilter(config: FilterConfig): void {
  // Remove existing filter
  removeFilter();

  if (config.type === 'normal') {
    return;
  }

  const matrixValues = generateSVGFilterString(config);

  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', FILTER_SVG_ID);
  svg.setAttribute('style', 'position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;');
  svg.setAttribute('aria-hidden', 'true');

  svg.innerHTML = `
    <defs>
      <filter id="${FILTER_ID}" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="${matrixValues}"/>
      </filter>
    </defs>
  `;

  // Insert at the beginning of body
  if (document.body) {
    document.body.insertBefore(svg, document.body.firstChild);
  }
}

/**
 * Apply the CSS filter to the page
 */
function applyFilter(): void {
  document.documentElement.style.setProperty('filter', `url(#${FILTER_ID})`);
  document.documentElement.style.setProperty('-webkit-filter', `url(#${FILTER_ID})`);
  
  // Add class for potential CSS hooks
  document.documentElement.classList.add('colorblind-filter-active');
}

/**
 * Remove the filter from the page
 */
function removeFilter(): void {
  // Remove SVG element
  const existingSvg = document.getElementById(FILTER_SVG_ID);
  if (existingSvg) {
    existingSvg.remove();
  }

  // Remove CSS filter
  document.documentElement.style.removeProperty('filter');
  document.documentElement.style.removeProperty('-webkit-filter');
  
  // Remove class
  document.documentElement.classList.remove('colorblind-filter-active');
}

/**
 * Apply color blindness filter
 */
function applyColorBlindFilter(config: FilterConfig): void {
  currentConfig = config;
  isEnabled = true;

  if (config.type === 'normal') {
    removeFilter();
    return;
  }

  injectSVGFilter(config);
  applyFilter();
}

/**
 * Disable filter
 */
function disableFilter(): void {
  isEnabled = false;
  removeFilter();
}

/**
 * Toggle filter on/off
 */
function toggleFilter(): void {
  if (isEnabled && currentConfig) {
    disableFilter();
  } else if (currentConfig && currentConfig.type !== 'normal') {
    applyColorBlindFilter(currentConfig);
  }
}

/**
 * Get current filter state
 */
function getFilterState(): { isEnabled: boolean; config: FilterConfig | null } {
  return { isEnabled, config: currentConfig };
}

// Message types
interface ApplyFilterMessage {
  action: 'applyFilter';
  config: FilterConfig;
}

interface RemoveFilterMessage {
  action: 'removeFilter';
}

interface ToggleFilterMessage {
  action: 'toggleFilter';
}

interface GetStateMessage {
  action: 'getFilterState';
}

interface UpdateSeverityMessage {
  action: 'updateSeverity';
  severity: number;
}

type ContentMessage = 
  | ApplyFilterMessage 
  | RemoveFilterMessage 
  | ToggleFilterMessage 
  | GetStateMessage
  | UpdateSeverityMessage;

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((
  message: ContentMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  try {
    switch (message.action) {
      case 'applyFilter':
        applyColorBlindFilter(message.config);
        sendResponse({ success: true });
        break;

      case 'removeFilter':
        disableFilter();
        sendResponse({ success: true });
        break;

      case 'toggleFilter':
        toggleFilter();
        sendResponse({ success: true, isEnabled });
        break;

      case 'getFilterState':
        sendResponse(getFilterState());
        break;

      case 'updateSeverity':
        if (currentConfig) {
          currentConfig.severity = message.severity;
          if (isEnabled) {
            applyColorBlindFilter(currentConfig);
          }
        }
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    logger.error('Content script error:', error);
    sendResponse({ success: false, error: String(error) });
  }

  return true; // Keep message channel open for async response
});

// Initialize - check if there's a stored filter state
async function initialize(): Promise<void> {
  try {
    // Request initial state from background
    const response = await chrome.runtime.sendMessage({ action: 'getInitialState' });
    
    if (response && response.isEnabled && response.config) {
      applyColorBlindFilter(response.config);
    }
  } catch (error) {
    // Background may not be ready yet, that's ok
    logger.debug('Content script initialized, waiting for commands');
  }
}

// Run initialization when DOM is ready (skip on restricted pages)
if (!restrictedCheck.restricted) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
}

// Export for potential testing
export {
  applyColorBlindFilter,
  disableFilter,
  toggleFilter,
  getFilterState,
  removeFilter
};
