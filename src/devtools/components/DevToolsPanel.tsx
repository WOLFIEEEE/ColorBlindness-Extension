import { useState, useEffect, useCallback, useMemo } from 'react'
import { RGB, parseColor, rgbToHex } from '@/lib/color-utils'
import { analyzeContrast, ContrastResult, WCAG_THRESHOLDS } from '@/lib/contrast'
import { getSuggestions, SuggestionResult } from '@/lib/suggestions'
import { getColorHistory, ColorPair } from '@/lib/storage'
import { copyToClipboard } from '@/popup/components/Toast'

interface ScanResult {
  element: string
  selector: string
  foreground: string
  background: string
  ratio: number
  score: string
  fontSize: string
  fontWeight: string
  text: string
}

type ViewMode = 'checker' | 'scanner' | 'history'
type ScanFilter = 'all' | 'fail' | 'warning' | 'pass'

export function DevToolsPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('checker')
  const [foregroundHex, setForegroundHex] = useState('#1F1F1E')
  const [backgroundHex, setBackgroundHex] = useState('#FFFDF9')
  const [foregroundRgb, setForegroundRgb] = useState<RGB>({ r: 31, g: 31, b: 30 })
  const [backgroundRgb, setBackgroundRgb] = useState<RGB>({ r: 255, g: 253, b: 249 })
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionResult | null>(null)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [scanFilter, setScanFilter] = useState<ScanFilter>('all')
  const [isScanning, setIsScanning] = useState(false)
  const [history, setHistory] = useState<ColorPair[]>([])
  const [targetLevel, setTargetLevel] = useState<'AA' | 'AAA'>('AA')

  // Calculate contrast when colors change
  useEffect(() => {
    const result = analyzeContrast(foregroundRgb, backgroundRgb)
    setContrastResult(result)

    if (result.score === 'fail' || result.score === 'aa-large') {
      const suggestionResult = getSuggestions(foregroundRgb, backgroundRgb, targetLevel, 'normal')
      setSuggestions(suggestionResult)
    } else {
      setSuggestions(null)
    }
  }, [foregroundRgb, backgroundRgb, targetLevel])

  // Load history
  useEffect(() => {
    getColorHistory().then(setHistory)
  }, [])

  const handleForegroundChange = useCallback((value: string) => {
    setForegroundHex(value)
    const rgb = parseColor(value)
    if (rgb) setForegroundRgb(rgb)
  }, [])

  const handleBackgroundChange = useCallback((value: string) => {
    setBackgroundHex(value)
    const rgb = parseColor(value)
    if (rgb) setBackgroundRgb(rgb)
  }, [])

  const handleSwapColors = useCallback(() => {
    setForegroundHex(backgroundHex)
    setBackgroundHex(foregroundHex)
    setForegroundRgb(backgroundRgb)
    setBackgroundRgb(foregroundRgb)
  }, [foregroundHex, backgroundHex, foregroundRgb, backgroundRgb])

  const handleScanPage = useCallback(async () => {
    setIsScanning(true)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' }, (response) => {
          if (response?.results) {
            setScanResults(response.results)
          }
          setIsScanning(false)
        })
      }
    } catch (error) {
      console.error('Scan error:', error)
      setIsScanning(false)
    }
  }, [])

  const handleApplySuggestion = useCallback((type: 'foreground' | 'background', rgb: RGB) => {
    if (type === 'foreground') {
      setForegroundRgb(rgb)
      setForegroundHex(rgbToHex(rgb))
    } else {
      setBackgroundRgb(rgb)
      setBackgroundHex(rgbToHex(rgb))
    }
  }, [])

  const handleHistorySelect = useCallback((pair: ColorPair) => {
    setForegroundRgb(pair.foreground)
    setBackgroundRgb(pair.background)
    setForegroundHex(pair.foregroundHex)
    setBackgroundHex(pair.backgroundHex)
    setViewMode('checker')
  }, [])

  // Scroll to element on the page
  const handleScrollToElement = useCallback(async (selector: string) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { 
          type: 'SCROLL_TO_ELEMENT', 
          selector 
        })
      }
    } catch (error) {
      console.error('Error scrolling to element:', error)
    }
  }, [])

  // Memoize scan stats to avoid recalculating on every render
  const scanStats = useMemo(() => ({
    total: scanResults.length,
    fail: scanResults.filter(r => r.score === 'fail').length,
    warning: scanResults.filter(r => r.score === 'aa-large').length,
    pass: scanResults.filter(r => r.score === 'aa' || r.score === 'aaa').length,
  }), [scanResults])

  // Export scan results
  const handleExportResults = useCallback((format: 'json' | 'csv') => {
    if (scanResults.length === 0) return

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify({
        scannedAt: new Date().toISOString(),
        totalElements: scanResults.length,
        summary: {
          failures: scanStats.fail,
          warnings: scanStats.warning,
          passes: scanStats.pass,
        },
        results: scanResults,
      }, null, 2)
      filename = `wcag-scan-${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    } else {
      // CSV format
      const headers = ['Element', 'Selector', 'Foreground', 'Background', 'Ratio', 'Score', 'Font Size', 'Font Weight', 'Text']
      const rows = scanResults.map(r => [
        r.element,
        `"${r.selector.replace(/"/g, '""')}"`,
        r.foreground,
        r.background,
        r.ratio.toFixed(2),
        r.score,
        r.fontSize,
        r.fontWeight,
        `"${r.text.replace(/"/g, '""')}"`,
      ])
      content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      filename = `wcag-scan-${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [scanResults, scanStats])

  const filteredResults = scanResults.filter(r => {
    if (scanFilter === 'all') return true
    if (scanFilter === 'fail') return r.score === 'fail'
    if (scanFilter === 'warning') return r.score === 'aa-large'
    if (scanFilter === 'pass') return r.score === 'aa' || r.score === 'aaa'
    return true
  })

  return (
    <div className="h-screen flex flex-col bg-cream dark:bg-dark text-dark dark:text-cream">
      {/* Header */}
      <header className="bg-beige dark:bg-warm-brown/20 border-b border-border dark:border-warm-brown/30 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">
              <span className="font-light opacity-70">the</span>
              <span className="text-primary font-bold">WCAG</span>
              <span className="ml-1 text-xs font-normal text-warm-brown dark:text-cream/60">Contrast Checker</span>
            </h1>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-white dark:bg-dark rounded-lg border border-border dark:border-warm-brown/30 p-0.5">
          {(['checker', 'scanner', 'history'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === mode
                  ? 'bg-primary text-white'
                  : 'text-warm-brown dark:text-cream/60 hover:text-dark dark:hover:text-cream'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {viewMode === 'checker' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Color Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <ColorInputField
                label="Foreground"
                value={foregroundHex}
                onChange={handleForegroundChange}
                color={foregroundHex}
              />
              <ColorInputField
                label="Background"
                value={backgroundHex}
                onChange={handleBackgroundChange}
                color={backgroundHex}
              />
            </div>

            {/* Swap & Level */}
            <div className="flex gap-2">
              <button onClick={handleSwapColors} className="btn-ghost text-xs flex-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Swap
              </button>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as 'AA' | 'AAA')}
                className="input text-xs flex-1"
              >
                <option value="AA">WCAG AA</option>
                <option value="AAA">WCAG AAA</option>
              </select>
            </div>

            {/* Preview & Result */}
            {contrastResult && (
              <div className="card">
                <div
                  className="rounded-lg p-6 mb-4 text-center border border-border dark:border-warm-brown/30"
                  style={{ backgroundColor: backgroundHex }}
                >
                  <p className="text-3xl font-bold" style={{ color: foregroundHex }}>
                    Sample Text
                  </p>
                  <p className="text-sm mt-2" style={{ color: foregroundHex }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>

                <div className="text-center mb-4">
                  <div className="text-4xl font-bold tabular-nums">{contrastResult.ratioString}</div>
                  <p className="text-sm text-warm-brown dark:text-cream/60">Contrast Ratio</p>
                </div>

                <div className={`p-3 rounded-lg text-center ${getScoreStyles(contrastResult.score)}`}>
                  <span className="font-semibold">{getScoreLabel(contrastResult.score)}</span>
                </div>

                {/* WCAG Grid */}
                <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
                  <ComplianceCell label="AA Normal" passed={contrastResult.aa.normalText} ratio={WCAG_THRESHOLDS.AA_NORMAL} />
                  <ComplianceCell label="AA Large" passed={contrastResult.aa.largeText} ratio={WCAG_THRESHOLDS.AA_LARGE} />
                  <ComplianceCell label="AAA Normal" passed={contrastResult.aaa.normalText} ratio={WCAG_THRESHOLDS.AAA_NORMAL} />
                  <ComplianceCell label="AAA Large" passed={contrastResult.aaa.largeText} ratio={WCAG_THRESHOLDS.AAA_LARGE} />
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions && (suggestions.bestForeground || suggestions.bestBackground) && (
              <div className="card">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Suggested Fixes
                </h3>
                {suggestions.bestForeground && (
                  <SuggestionItem
                    label="Foreground"
                    original={rgbToHex(suggestions.original.foreground)}
                    suggested={suggestions.bestForeground.hex}
                    ratio={suggestions.bestForeground.ratioString}
                    onApply={() => handleApplySuggestion('foreground', suggestions.bestForeground!.color)}
                  />
                )}
                {suggestions.bestBackground && (
                  <SuggestionItem
                    label="Background"
                    original={rgbToHex(suggestions.original.background)}
                    suggested={suggestions.bestBackground.hex}
                    ratio={suggestions.bestBackground.ratioString}
                    onApply={() => handleApplySuggestion('background', suggestions.bestBackground!.color)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === 'scanner' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Page Contrast Scanner</h2>
              <div className="flex gap-2">
                {scanResults.length > 0 && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleExportResults('json')}
                      className="btn-ghost text-xs py-1 px-2"
                      title="Export as JSON"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      JSON
                    </button>
                    <button
                      onClick={() => handleExportResults('csv')}
                      className="btn-ghost text-xs py-1 px-2"
                      title="Export as CSV"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      CSV
                    </button>
                  </div>
                )}
                <button
                  onClick={handleScanPage}
                  disabled={isScanning}
                  className="btn-primary text-xs"
                >
                  {isScanning ? 'Scanning...' : 'Scan Page'}
                </button>
              </div>
            </div>

            {scanResults.length > 0 && (
              <>
                {/* Stats */}
                <div className="flex gap-2">
                  <StatBadge label="Total" count={scanStats.total} color="gray" onClick={() => setScanFilter('all')} active={scanFilter === 'all'} />
                  <StatBadge label="Fail" count={scanStats.fail} color="red" onClick={() => setScanFilter('fail')} active={scanFilter === 'fail'} />
                  <StatBadge label="Warning" count={scanStats.warning} color="yellow" onClick={() => setScanFilter('warning')} active={scanFilter === 'warning'} />
                  <StatBadge label="Pass" count={scanStats.pass} color="green" onClick={() => setScanFilter('pass')} active={scanFilter === 'pass'} />
                </div>

                {/* Results List */}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filteredResults.map((result, index) => (
                    <ScanResultItem 
                      key={index} 
                      result={result} 
                      onScrollTo={handleScrollToElement}
                    />
                  ))}
                </div>
              </>
            )}

            {scanResults.length === 0 && !isScanning && (
              <div className="text-center py-12 text-warm-brown dark:text-cream/60">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Click &quot;Scan Page&quot; to analyze contrast</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'history' && (
          <div className="space-y-3">
            <h2 className="font-semibold">Color History</h2>
            {history.length === 0 ? (
              <div className="text-center py-12 text-warm-brown dark:text-cream/60">
                <p>No color history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() => handleHistorySelect(pair)}
                    className="w-full card p-3 hover:shadow-md transition-shadow text-left flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded border border-border flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: pair.backgroundHex, color: pair.foregroundHex }}
                    >
                      Aa
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-mono">{pair.foregroundHex} / {pair.backgroundHex}</div>
                      <div className={`text-xs font-semibold ${pair.ratio >= 4.5 ? 'text-green-600' : pair.ratio >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {pair.ratio.toFixed(2)}:1
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border dark:border-warm-brown/30 px-4 py-2 text-xs text-warm-brown dark:text-cream/60 text-center">
        <a href="https://thewcag.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
          thewcag.com
        </a>
      </footer>
    </div>
  )
}

// Helper Components
function ColorInputField({ label, value, onChange, color }: { label: string; value: string; onChange: (v: string) => void; color: string }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block">{label}</label>
      <div className="flex gap-2">
        <div className="w-10 h-10 rounded border border-border shrink-0 relative overflow-hidden" style={{ backgroundColor: color }}>
          <input
            type="color"
            value={color.match(/^#[0-9A-Fa-f]{6}$/i) ? color : '#000000'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input text-sm font-mono flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

function ComplianceCell({ label, passed, ratio }: { label: string; passed: boolean; ratio: number }) {
  return (
    <div className={`p-2 rounded text-center ${passed ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
      <div className="font-medium">{label}</div>
      <div className="text-warm-brown dark:text-cream/60">{ratio}:1</div>
      <div className={passed ? 'text-green-600' : 'text-red-600'}>{passed ? '✓' : '✗'}</div>
    </div>
  )
}

function SuggestionItem({ label, original, suggested, ratio, onApply }: { label: string; original: string; suggested: string; ratio: string; onApply: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-beige dark:bg-warm-brown/10 rounded mb-2">
      <div className="text-xs font-medium w-20">{label}</div>
      <div className="w-6 h-6 rounded" style={{ backgroundColor: original }} />
      <span className="text-warm-brown">→</span>
      <div className="w-6 h-6 rounded" style={{ backgroundColor: suggested }} />
      <span className="text-xs font-mono">{suggested}</span>
      <span className="badge badge-success ml-auto">{ratio}</span>
      <button onClick={onApply} className="btn-primary text-xs py-1 px-2">Apply</button>
    </div>
  )
}

function StatBadge({ label, count, color, onClick, active }: { label: string; count: number; color: string; onClick: () => void; active: boolean }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
  }
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${colors[color]} ${active ? 'ring-2 ring-primary ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
    >
      {label}: {count}
    </button>
  )
}

function ScanResultItem({ result, onScrollTo }: { result: ScanResult; onScrollTo?: (selector: string) => void }) {
  const [copied, setCopied] = useState(false)
  
  const scoreColors: Record<string, string> = {
    fail: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
    'aa-large': 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
    aa: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    aaa: 'border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30',
  }

  const handleCopySelector = async () => {
    const success = await copyToClipboard(result.selector)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className={`p-3 rounded border ${scoreColors[result.score] || 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <code className="text-xs text-warm-brown dark:text-cream/70 truncate">{result.selector}</code>
          <button
            onClick={handleCopySelector}
            className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
            title="Copy selector"
          >
            {copied ? (
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-warm-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold ${result.score === 'fail' ? 'text-red-600' : result.score === 'aa-large' ? 'text-yellow-600' : 'text-green-600'}`}>
            {result.ratio.toFixed(2)}:1
          </span>
          {onScrollTo && (
            <button
              onClick={() => onScrollTo(result.selector)}
              className="p-1 rounded hover:bg-black/10 transition-colors"
              title="Scroll to element"
            >
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="w-5 h-5 rounded border border-black/10" style={{ backgroundColor: result.foreground }} />
        <span className="text-warm-brown dark:text-cream/60">on</span>
        <div className="w-5 h-5 rounded border border-black/10" style={{ backgroundColor: result.background }} />
        <span className="text-warm-brown dark:text-cream/70 truncate flex-1">&quot;{result.text}&quot;</span>
      </div>
    </div>
  )
}

function getScoreStyles(score: string): string {
  switch (score) {
    case 'aaa': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'aa': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'aa-large': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }
}

function getScoreLabel(score: string): string {
  switch (score) {
    case 'aaa': return 'AAA - Excellent'
    case 'aa': return 'AA - Good'
    case 'aa-large': return 'AA Large Text Only'
    default: return 'Fail - Insufficient Contrast'
  }
}

