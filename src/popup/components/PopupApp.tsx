import { useState, useEffect, useCallback } from 'react'
import { RGB, parseColor, rgbToHex } from '@/lib/color-utils'
import { analyzeContrast, ContrastResult } from '@/lib/contrast'
import { getSuggestions, SuggestionResult } from '@/lib/suggestions'
import { 
  addToHistory, 
  getColorHistory, 
  ColorPair,
  getPendingEyedropper,
  clearPendingEyedropper,
  setEyedropperActive,
  onStorageChange
} from '@/lib/storage'
import { isRestrictedUrl, getRestrictedPageMessage, getRestrictedPageTitle } from '@/lib/content-script-helper'
import { ColorInput } from './ColorInput'
import { ContrastDisplay } from './ContrastDisplay'
import { SuggestionsList } from './SuggestionsList'
import { ColorHistory } from './ColorHistory'
import { Header } from './Header'
import { Tabs } from './Tabs'
import { Settings } from './Settings'
import { ToastContainer, useToast } from './Toast'

type TabId = 'checker' | 'history' | 'settings'

export function PopupApp() {
  const [foregroundHex, setForegroundHex] = useState('#1F1F1E')
  const [backgroundHex, setBackgroundHex] = useState('#FFFDF9')
  const [foregroundRgb, setForegroundRgb] = useState<RGB>({ r: 31, g: 31, b: 30 })
  const [backgroundRgb, setBackgroundRgb] = useState<RGB>({ r: 255, g: 253, b: 249 })
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionResult | null>(null)
  const [history, setHistory] = useState<ColorPair[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('checker')
  const [targetLevel, setTargetLevel] = useState<'AA' | 'AAA'>('AA')
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal')
  const [error, setError] = useState<{ title?: string; message: string } | null>(null)
  const { toasts, dismissToast, showSuccess, showError } = useToast()

  // Handle copy feedback
  const handleCopy = useCallback((success: boolean) => {
    if (success) {
      showSuccess('Color copied!')
    } else {
      showError('Failed to copy')
    }
  }, [showSuccess, showError])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Update colors and calculate contrast
  const updateColors = useCallback((fg: RGB, bg: RGB) => {
    setForegroundRgb(fg)
    setBackgroundRgb(bg)
    setForegroundHex(rgbToHex(fg))
    setBackgroundHex(rgbToHex(bg))

    const result = analyzeContrast(fg, bg)
    setContrastResult(result)

    // Get suggestions if contrast fails
    if (result.score === 'fail' || result.score === 'aa-large') {
      const suggestionResult = getSuggestions(fg, bg, targetLevel, textSize)
      setSuggestions(suggestionResult)
    } else {
      setSuggestions(null)
    }

    // Add to history
    addToHistory(fg, bg, result.ratio)
  }, [targetLevel, textSize])

  // Handle foreground color change
  const handleForegroundChange = useCallback((colorString: string) => {
    setForegroundHex(colorString)
    const rgb = parseColor(colorString)
    if (rgb) {
      updateColors(rgb, backgroundRgb)
    }
  }, [backgroundRgb, updateColors])

  // Handle background color change
  const handleBackgroundChange = useCallback((colorString: string) => {
    setBackgroundHex(colorString)
    const rgb = parseColor(colorString)
    if (rgb) {
      updateColors(foregroundRgb, rgb)
    }
  }, [foregroundRgb, updateColors])

  // Swap colors
  const handleSwapColors = useCallback(() => {
    updateColors(backgroundRgb, foregroundRgb)
  }, [foregroundRgb, backgroundRgb, updateColors])

  // Apply suggestion
  const handleApplySuggestion = useCallback((type: 'foreground' | 'background', rgb: RGB) => {
    if (type === 'foreground') {
      updateColors(rgb, backgroundRgb)
    } else {
      updateColors(foregroundRgb, rgb)
    }
  }, [foregroundRgb, backgroundRgb, updateColors])

  // Load history on mount
  useEffect(() => {
    getColorHistory().then(setHistory)
  }, [])

  // Check for pending eyedropper color on mount
  useEffect(() => {
    const checkPendingEyedropper = async () => {
      const pending = await getPendingEyedropper()
      if (pending) {
        const rgb = parseColor(pending.color)
        if (rgb) {
          if (pending.colorType === 'foreground') {
            updateColors(rgb, backgroundRgb)
          } else {
            updateColors(foregroundRgb, rgb)
          }
        }
        // Clear the pending state after applying
        await clearPendingEyedropper()
        // Clear the badge
        chrome.action.setBadgeText({ text: '' })
      }
    }
    
    checkPendingEyedropper()
  }, []) // Only run on mount

  // Listen for storage changes (for real-time eyedropper updates)
  useEffect(() => {
    const cleanup = onStorageChange((changes) => {
      if (changes.wcag_pending_eyedropper?.newValue) {
        const pending = changes.wcag_pending_eyedropper.newValue
        const rgb = parseColor(pending.color)
        if (rgb) {
          if (pending.colorType === 'foreground') {
            updateColors(rgb, backgroundRgb)
          } else {
            updateColors(foregroundRgb, rgb)
          }
        }
        // Clear the pending state after applying
        clearPendingEyedropper()
        chrome.action.setBadgeText({ text: '' })
      }
    })
    
    return cleanup
  }, [foregroundRgb, backgroundRgb, updateColors])

  // Recalculate when target level or text size changes
  useEffect(() => {
    if (foregroundRgb && backgroundRgb) {
      const result = analyzeContrast(foregroundRgb, backgroundRgb)
      setContrastResult(result)

      if (result.score === 'fail' || result.score === 'aa-large') {
        const suggestionResult = getSuggestions(foregroundRgb, backgroundRgb, targetLevel, textSize)
        setSuggestions(suggestionResult)
      } else {
        setSuggestions(null)
      }
    }
  }, [targetLevel, textSize, foregroundRgb, backgroundRgb])

  // Initial calculation
  useEffect(() => {
    updateColors(foregroundRgb, backgroundRgb)
  }, [])

  // Handle history item click
  const handleHistorySelect = useCallback((pair: ColorPair) => {
    updateColors(pair.foreground, pair.background)
    setActiveTab('checker')
  }, [updateColors])

  // Open eyedropper (sends message to content script)
  const handleEyedropper = useCallback(async (type: 'foreground' | 'background') => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab?.id || !tab.url) {
        setError({ message: 'No active tab found. Please open a webpage first.' })
        return
      }
      
      // Check if this is a restricted page
      if (isRestrictedUrl(tab.url)) {
        setError({
          title: getRestrictedPageTitle(tab.url),
          message: getRestrictedPageMessage(tab.url)
        })
        return
      }
      
      // Store the active eyedropper state so we know which color to update
      await setEyedropperActive(type)
      
      chrome.tabs.sendMessage(tab.id, { 
        type: 'OPEN_EYEDROPPER', 
        colorType: type 
      })
      window.close() // Close popup to allow interaction with page
    } catch (err) {
      console.error('Error opening eyedropper:', err)
      setError({ message: 'Failed to open color picker. Try refreshing the page.' })
    }
  }, [])

  // Scan page
  const handleScanPage = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab?.id || !tab.url) {
        setError({ message: 'No active tab found. Please open a webpage first.' })
        return
      }
      
      // Check if this is a restricted page
      if (isRestrictedUrl(tab.url)) {
        setError({
          title: getRestrictedPageTitle(tab.url),
          message: getRestrictedPageMessage(tab.url)
        })
        return
      }
      
      chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' })
      window.close()
    } catch (err) {
      console.error('Error scanning page:', err)
      setError({ message: 'Failed to scan page. Try refreshing the page.' })
    }
  }, [])

  return (
    <div className="w-[380px] min-h-[500px] bg-cream dark:bg-dark">
      <Header onScanPage={handleScanPage} />
      
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              {error.title && (
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  {error.title}
                </p>
              )}
              <p className="text-sm text-amber-700 dark:text-amber-300/90">{error.message}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-2">
                💡 Tip: You can still enter colors manually using the color inputs above!
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 shrink-0"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        {activeTab === 'checker' && (
          <div className="space-y-4">
            {/* Color Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Foreground"
                value={foregroundHex}
                onChange={handleForegroundChange}
                onEyedropper={() => handleEyedropper('foreground')}
                previewColor={foregroundHex}
                onCopy={handleCopy}
              />
              <ColorInput
                label="Background"
                value={backgroundHex}
                onChange={handleBackgroundChange}
                onEyedropper={() => handleEyedropper('background')}
                previewColor={backgroundHex}
                onCopy={handleCopy}
              />
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwapColors}
              className="w-full btn-ghost text-sm flex items-center justify-center gap-2"
              aria-label="Swap foreground and background colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Swap Colors
            </button>

            {/* Level & Size Selection */}
            <div className="flex gap-2">
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as 'AA' | 'AAA')}
                className="input flex-1 text-sm"
                aria-label="WCAG Level"
              >
                <option value="AA">WCAG AA</option>
                <option value="AAA">WCAG AAA</option>
              </select>
              <select
                value={textSize}
                onChange={(e) => setTextSize(e.target.value as 'normal' | 'large')}
                className="input flex-1 text-sm"
                aria-label="Text Size"
              >
                <option value="normal">Normal Text</option>
                <option value="large">Large Text</option>
              </select>
            </div>

            {/* Contrast Result */}
            {contrastResult && (
              <ContrastDisplay 
                result={contrastResult} 
                foregroundHex={foregroundHex}
                backgroundHex={backgroundHex}
                targetLevel={targetLevel}
                textSize={textSize}
              />
            )}

            {/* Suggestions */}
            {suggestions && (suggestions.bestForeground || suggestions.bestBackground) && (
              <SuggestionsList
                suggestions={suggestions}
                onApply={handleApplySuggestion}
                targetLevel={targetLevel}
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <ColorHistory
            history={history}
            onSelect={handleHistorySelect}
            onRefresh={() => getColorHistory().then(setHistory)}
          />
        )}

        {activeTab === 'settings' && (
          <Settings />
        )}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

