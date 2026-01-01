import { useState, useEffect, useCallback } from 'react';
import { 
  ColorBlindnessType, 
  FilterConfig,
  FILTER_INFO,
  getAllFilterTypes,
  getFiltersByCategory,
  isAnomalyType,
  getDefaultSeverity,
  isValidType,
  sanitizeSeverity
} from '../../lib/colorblind-filters';
import {
  getPreferences,
  getCurrentFilter,
  getIsEnabled,
  setCurrentFilter,
  setIsEnabled
} from '../../lib/storage';
import { createLogger } from '../../lib/logger';

const logger = createLogger('DevToolsPanel');

export function DevToolsPanel() {
  const [selectedFilter, setSelectedFilter] = useState<ColorBlindnessType>('deuteranopia');
  const [severity, setSeverity] = useState(100);
  const [isEnabled, setIsEnabledState] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const [prefs, currentFilter, enabled] = await Promise.all([
          getPreferences(),
          getCurrentFilter(),
          getIsEnabled()
        ]);
        
        setSelectedFilter(currentFilter.type || prefs.defaultFilter);
        setSeverity(currentFilter.severity ?? prefs.defaultSeverity);
        setIsEnabledState(enabled);
        setDarkMode(prefs.darkMode);
        
        if (prefs.darkMode) {
          document.documentElement.classList.add('dark');
        }
      } catch (error) {
        logger.error('Error loading state:', error);
      }
    };
    
    loadState();
  }, []);

  // Apply filter
  const applyFilter = useCallback(async (config: FilterConfig, enabled: boolean) => {
    try {
      // Get inspected window tab
      const tabId = chrome.devtools.inspectedWindow.tabId;
      
      await chrome.runtime.sendMessage({
        action: 'setFilter',
        config,
        enabled,
        tabId
      });
      
      await setCurrentFilter(config);
      await setIsEnabled(enabled);
    } catch (error) {
      logger.error('Error applying filter:', error);
    }
  }, []);

  // Handle filter change with validation
  const handleFilterChange = useCallback(async (type: ColorBlindnessType) => {
    // Validate filter type
    if (!isValidType(type)) {
      logger.warn('Invalid filter type:', type);
      return;
    }
    
    setSelectedFilter(type);
    const newSeverity = isAnomalyType(type) ? severity : getDefaultSeverity(type);
    const sanitized = sanitizeSeverity(newSeverity);
    setSeverity(sanitized);
    
    if (isEnabled && type !== 'normal') {
      await applyFilter({ type, severity: sanitized }, true);
    } else if (type === 'normal') {
      await applyFilter({ type, severity: sanitized }, false);
      setIsEnabledState(false);
    }
  }, [severity, isEnabled, applyFilter]);

  // Handle toggle
  const handleToggle = useCallback(async () => {
    if (selectedFilter === 'normal') return;
    
    const newEnabled = !isEnabled;
    setIsEnabledState(newEnabled);
    await applyFilter({ type: selectedFilter, severity }, newEnabled);
  }, [selectedFilter, severity, isEnabled, applyFilter]);

  // Handle severity change with validation
  const handleSeverityChange = useCallback(async (value: number) => {
    const sanitized = sanitizeSeverity(value);
    setSeverity(sanitized);
    if (isEnabled && isValidType(selectedFilter)) {
      await applyFilter({ type: selectedFilter, severity: sanitized }, true);
    }
  }, [selectedFilter, isEnabled, applyFilter]);

  // Apply quick filter (for grid mode)
  const applyQuickFilter = useCallback(async (type: ColorBlindnessType) => {
    setSelectedFilter(type);
    const sev = getDefaultSeverity(type);
    setSeverity(sev);
    setIsEnabledState(true);
    await applyFilter({ type, severity: sev }, true);
  }, [applyFilter]);

  const categories = getFiltersByCategory();
  const allTypes = getAllFilterTypes().filter(t => t !== 'normal');

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Color Blindness Simulator</h1>
              <p className="text-white/70 text-sm">DevTools Panel</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isEnabled && selectedFilter !== 'normal'
                ? 'bg-emerald-400/20 text-emerald-100' 
                : 'bg-white/10 text-white/60'
            }`}>
              {isEnabled && selectedFilter !== 'normal' 
                ? `${FILTER_INFO[selectedFilter].shortName} Active` 
                : 'Inactive'}
            </div>
            
            {/* Dark mode toggle */}
            <button
              onClick={() => {
                setDarkMode(!darkMode);
                document.documentElement.classList.toggle('dark');
              }}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* View mode toggles */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setGridMode(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !gridMode
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Single Filter
          </button>
          <button
            onClick={() => setGridMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              gridMode
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Quick Select Grid
          </button>
        </div>

        {/* Grid mode */}
        {gridMode ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {allTypes.map((type) => (
              <button
                key={type}
                onClick={() => applyQuickFilter(type)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedFilter === type && isEnabled
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300'
                }`}
              >
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {FILTER_INFO[type].shortName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {FILTER_INFO[type].affectedCone}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {FILTER_INFO[type].prevalence}
                  </p>
                </div>
              </button>
            ))}
            
            {/* Disable button */}
            <button
              onClick={() => {
                setIsEnabledState(false);
                applyFilter({ type: 'normal', severity: 100 }, false);
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                !isEnabled
                  ? 'border-gray-500 bg-gray-100 dark:bg-gray-700'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400'
              }`}
            >
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Disable
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Normal vision
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* Single filter mode */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filter Controls
              </h2>
              
              {/* Filter selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Blindness Type
                </label>
                <select
                  value={selectedFilter}
                  onChange={(e) => handleFilterChange(e.target.value as ColorBlindnessType)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  {Object.entries(categories).map(([category, types]) => (
                    <optgroup key={category} label={category}>
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {FILTER_INFO[type].name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Simulation
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Apply filter to the inspected page
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={selectedFilter === 'normal'}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                    isEnabled && selectedFilter !== 'normal'
                      ? 'bg-emerald-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                    isEnabled && selectedFilter !== 'normal' ? 'translate-x-9' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Severity slider */}
              {isAnomalyType(selectedFilter) && (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Severity
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {severity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={severity}
                    onChange={(e) => handleSeverityChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Info panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {FILTER_INFO[selectedFilter].name}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {FILTER_INFO[selectedFilter].description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Affected</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {FILTER_INFO[selectedFilter].affectedCone}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Prevalence</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {FILTER_INFO[selectedFilter].prevalence}
                  </span>
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Testing Tip
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  When this filter is active, check if important information is still accessible. 
                  Avoid relying solely on color to convey meaning.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Keyboard shortcut hint */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Alt+Shift+C</kbd> to toggle the filter
        </div>
      </div>
    </div>
  );
}

export default DevToolsPanel;
