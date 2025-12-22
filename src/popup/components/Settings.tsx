import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  getPreferences, 
  updatePreferences, 
  clearHistory,
  exportData,
  importData,
  UserPreferences,
  StorageData
} from '@/lib/storage'

interface SettingsProps {
  onPreferencesChange?: (prefs: UserPreferences) => void
}

export function Settings({ onPreferencesChange }: SettingsProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultLevel: 'AA',
    defaultTextSize: 'normal',
    darkMode: false,
    showNotifications: true,
    maxHistoryItems: 20,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load preferences on mount
  useEffect(() => {
    getPreferences().then((prefs) => {
      setPreferences(prefs)
      setLoading(false)
      // Apply dark mode class
      if (prefs.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    })
  }, [])

  // Show message temporarily
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }, [])

  // Update a preference
  const handlePreferenceChange = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    setSaving(true)
    
    try {
      await updatePreferences({ [key]: value })
      
      // Apply dark mode immediately
      if (key === 'darkMode') {
        if (value) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      
      onPreferencesChange?.(newPrefs)
      showMessage('success', 'Preference saved')
    } catch {
      showMessage('error', 'Failed to save preference')
    } finally {
      setSaving(false)
    }
  }, [preferences, onPreferencesChange, showMessage])

  // Clear history
  const handleClearHistory = useCallback(async () => {
    if (!confirm('Are you sure you want to clear all color history?')) return
    
    try {
      await clearHistory()
      showMessage('success', 'History cleared')
    } catch {
      showMessage('error', 'Failed to clear history')
    }
  }, [showMessage])

  // Export data
  const handleExport = useCallback(async () => {
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wcag-contrast-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showMessage('success', 'Data exported successfully')
    } catch {
      showMessage('error', 'Failed to export data')
    }
  }, [showMessage])

  // Import data
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as Partial<StorageData>
      
      if (!data.colorHistory && !data.savedPalettes && !data.preferences) {
        throw new Error('Invalid backup file')
      }
      
      await importData(data)
      
      // Reload preferences if imported
      if (data.preferences) {
        const newPrefs = await getPreferences()
        setPreferences(newPrefs)
        if (newPrefs.darkMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      
      showMessage('success', 'Data imported successfully')
    } catch {
      showMessage('error', 'Failed to import data - invalid file')
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [showMessage])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message Toast */}
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Appearance */}
      <section>
        <h3 className="font-semibold text-dark dark:text-cream mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          Appearance
        </h3>
        
        <label className="flex items-center justify-between p-3 bg-beige dark:bg-warm-brown/10 rounded-lg cursor-pointer">
          <span className="text-sm text-dark dark:text-cream">Dark Mode</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={preferences.darkMode}
              onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
        </label>
      </section>

      {/* Default Settings */}
      <section>
        <h3 className="font-semibold text-dark dark:text-cream mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Default Settings
        </h3>
        
        <div className="space-y-3">
          <div className="p-3 bg-beige dark:bg-warm-brown/10 rounded-lg">
            <label className="text-sm text-dark dark:text-cream block mb-2">Default WCAG Level</label>
            <select
              value={preferences.defaultLevel}
              onChange={(e) => handlePreferenceChange('defaultLevel', e.target.value as 'AA' | 'AAA')}
              className="input text-sm"
            >
              <option value="AA">WCAG AA (4.5:1 for normal text)</option>
              <option value="AAA">WCAG AAA (7:1 for normal text)</option>
            </select>
          </div>
          
          <div className="p-3 bg-beige dark:bg-warm-brown/10 rounded-lg">
            <label className="text-sm text-dark dark:text-cream block mb-2">Default Text Size</label>
            <select
              value={preferences.defaultTextSize}
              onChange={(e) => handlePreferenceChange('defaultTextSize', e.target.value as 'normal' | 'large')}
              className="input text-sm"
            >
              <option value="normal">Normal Text (under 18pt / 24px)</option>
              <option value="large">Large Text (18pt+ or 14pt+ bold)</option>
            </select>
          </div>
          
          <div className="p-3 bg-beige dark:bg-warm-brown/10 rounded-lg">
            <label className="text-sm text-dark dark:text-cream block mb-2">Max History Items</label>
            <select
              value={preferences.maxHistoryItems}
              onChange={(e) => handlePreferenceChange('maxHistoryItems', parseInt(e.target.value))}
              className="input text-sm"
            >
              <option value="10">10 items</option>
              <option value="20">20 items</option>
              <option value="50">50 items</option>
              <option value="100">100 items</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h3 className="font-semibold text-dark dark:text-cream mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
        </h3>
        
        <label className="flex items-center justify-between p-3 bg-beige dark:bg-warm-brown/10 rounded-lg cursor-pointer">
          <div>
            <span className="text-sm text-dark dark:text-cream block">Show Notifications</span>
            <span className="text-xs text-warm-brown dark:text-cream/60">Toast messages for actions</span>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={preferences.showNotifications}
              onChange={(e) => handlePreferenceChange('showNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
        </label>
      </section>

      {/* Data Management */}
      <section>
        <h3 className="font-semibold text-dark dark:text-cream mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          Data Management
        </h3>
        
        <div className="space-y-2">
          <button
            onClick={handleClearHistory}
            className="w-full p-3 text-left bg-beige dark:bg-warm-brown/10 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
          >
            <span className="text-sm text-dark dark:text-cream group-hover:text-red-600 dark:group-hover:text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Color History
            </span>
            <span className="text-xs text-warm-brown dark:text-cream/60">Remove all saved color pairs</span>
          </button>
          
          <button
            onClick={handleExport}
            className="w-full p-3 text-left bg-beige dark:bg-warm-brown/10 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <span className="text-sm text-dark dark:text-cream flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export Data
            </span>
            <span className="text-xs text-warm-brown dark:text-cream/60">Download history and settings as JSON</span>
          </button>
          
          <label className="w-full p-3 text-left bg-beige dark:bg-warm-brown/10 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer block">
            <span className="text-sm text-dark dark:text-cream flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import Data
            </span>
            <span className="text-xs text-warm-brown dark:text-cream/60">Restore from backup file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* About */}
      <section className="border-t border-border dark:border-warm-brown/30 pt-4">
        <div className="text-center text-sm text-warm-brown dark:text-cream/60">
          <p className="font-semibold mb-1">TheWCAG Color Contrast Checker</p>
          <p className="text-xs">Version 1.0.1</p>
          <a
            href="https://thewcag.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-xs block mt-2"
          >
            thewcag.com
          </a>
        </div>
      </section>
      
      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-dark text-cream px-3 py-2 rounded-lg text-xs flex items-center gap-2">
          <div className="animate-spin w-3 h-3 border-2 border-cream border-t-transparent rounded-full" />
          Saving...
        </div>
      )}
    </div>
  )
}

