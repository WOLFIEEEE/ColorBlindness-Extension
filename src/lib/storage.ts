/**
 * Chrome Storage API Wrapper
 * Manages color history and user preferences
 */

import { RGB, rgbToHex } from './color-utils'

export interface ColorPair {
  id: string
  foreground: RGB
  background: RGB
  foregroundHex: string
  backgroundHex: string
  ratio: number
  timestamp: number
  name?: string
}

export interface StorageData {
  colorHistory: ColorPair[]
  savedPalettes: ColorPair[]
  preferences: UserPreferences
}

export interface UserPreferences {
  defaultLevel: 'AA' | 'AAA'
  defaultTextSize: 'normal' | 'large'
  darkMode: boolean
  showNotifications: boolean
  maxHistoryItems: number
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLevel: 'AA',
  defaultTextSize: 'normal',
  darkMode: false,
  showNotifications: true,
  maxHistoryItems: 20,
}

const STORAGE_KEYS = {
  COLOR_HISTORY: 'wcag_color_history',
  SAVED_PALETTES: 'wcag_saved_palettes',
  PREFERENCES: 'wcag_preferences',
  PENDING_EYEDROPPER: 'wcag_pending_eyedropper',
} as const

/**
 * Pending eyedropper state - stored when user picks a color
 */
export interface PendingEyedropper {
  color: string // hex color
  colorType: 'foreground' | 'background'
  timestamp: number
}

/**
 * Generate unique ID for color pairs
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get color history from storage
 */
export async function getColorHistory(): Promise<ColorPair[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.COLOR_HISTORY)
    return result[STORAGE_KEYS.COLOR_HISTORY] || []
  } catch (error) {
    console.error('Error getting color history:', error)
    return []
  }
}

/**
 * Add a color pair to history
 */
export async function addToHistory(
  foreground: RGB,
  background: RGB,
  ratio: number
): Promise<void> {
  try {
    const history = await getColorHistory()
    const preferences = await getPreferences()

    const newPair: ColorPair = {
      id: generateId(),
      foreground,
      background,
      foregroundHex: rgbToHex(foreground),
      backgroundHex: rgbToHex(background),
      ratio,
      timestamp: Date.now(),
    }

    // Check for duplicates
    const isDuplicate = history.some(
      (pair) =>
        pair.foregroundHex === newPair.foregroundHex &&
        pair.backgroundHex === newPair.backgroundHex
    )

    if (!isDuplicate) {
      // Add to beginning and limit size
      const updatedHistory = [newPair, ...history].slice(
        0,
        preferences.maxHistoryItems
      )
      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_HISTORY]: updatedHistory,
      })
    }
  } catch (error) {
    console.error('Error adding to history:', error)
  }
}

/**
 * Remove a color pair from history
 */
export async function removeFromHistory(id: string): Promise<void> {
  try {
    const history = await getColorHistory()
    const updatedHistory = history.filter((pair) => pair.id !== id)
    await chrome.storage.local.set({
      [STORAGE_KEYS.COLOR_HISTORY]: updatedHistory,
    })
  } catch (error) {
    console.error('Error removing from history:', error)
  }
}

/**
 * Clear all color history
 */
export async function clearHistory(): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.COLOR_HISTORY]: [] })
  } catch (error) {
    console.error('Error clearing history:', error)
  }
}

/**
 * Get saved palettes
 */
export async function getSavedPalettes(): Promise<ColorPair[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SAVED_PALETTES)
    return result[STORAGE_KEYS.SAVED_PALETTES] || []
  } catch (error) {
    console.error('Error getting saved palettes:', error)
    return []
  }
}

/**
 * Save a color pair to palettes
 */
export async function saveToPalettes(
  foreground: RGB,
  background: RGB,
  ratio: number,
  name?: string
): Promise<void> {
  try {
    const palettes = await getSavedPalettes()

    const newPair: ColorPair = {
      id: generateId(),
      foreground,
      background,
      foregroundHex: rgbToHex(foreground),
      backgroundHex: rgbToHex(background),
      ratio,
      timestamp: Date.now(),
      name,
    }

    const updatedPalettes = [...palettes, newPair]
    await chrome.storage.local.set({
      [STORAGE_KEYS.SAVED_PALETTES]: updatedPalettes,
    })
  } catch (error) {
    console.error('Error saving to palettes:', error)
  }
}

/**
 * Remove from saved palettes
 */
export async function removeFromPalettes(id: string): Promise<void> {
  try {
    const palettes = await getSavedPalettes()
    const updatedPalettes = palettes.filter((pair) => pair.id !== id)
    await chrome.storage.local.set({
      [STORAGE_KEYS.SAVED_PALETTES]: updatedPalettes,
    })
  } catch (error) {
    console.error('Error removing from palettes:', error)
  }
}

/**
 * Get user preferences
 */
export async function getPreferences(): Promise<UserPreferences> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PREFERENCES)
    return { ...DEFAULT_PREFERENCES, ...result[STORAGE_KEYS.PREFERENCES] }
  } catch (error) {
    console.error('Error getting preferences:', error)
    return DEFAULT_PREFERENCES
  }
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  updates: Partial<UserPreferences>
): Promise<void> {
  try {
    const current = await getPreferences()
    const updated = { ...current, ...updates }
    await chrome.storage.local.set({ [STORAGE_KEYS.PREFERENCES]: updated })
  } catch (error) {
    console.error('Error updating preferences:', error)
  }
}

/**
 * Export all data for backup
 */
export async function exportData(): Promise<StorageData> {
  const [colorHistory, savedPalettes, preferences] = await Promise.all([
    getColorHistory(),
    getSavedPalettes(),
    getPreferences(),
  ])

  return { colorHistory, savedPalettes, preferences }
}

/**
 * Import data from backup
 */
export async function importData(data: Partial<StorageData>): Promise<void> {
  try {
    if (data.colorHistory) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_HISTORY]: data.colorHistory,
      })
    }
    if (data.savedPalettes) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SAVED_PALETTES]: data.savedPalettes,
      })
    }
    if (data.preferences) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.PREFERENCES]: data.preferences,
      })
    }
  } catch (error) {
    console.error('Error importing data:', error)
  }
}

/**
 * Listen for storage changes
 */
export function onStorageChange(
  callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local') {
      callback(changes)
    }
  }

  chrome.storage.onChanged.addListener(listener)

  // Return cleanup function
  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}

/**
 * Store pending eyedropper result
 * Called by service worker when a color is picked
 */
export async function setPendingEyedropper(
  color: string,
  colorType: 'foreground' | 'background'
): Promise<void> {
  try {
    const pending: PendingEyedropper = {
      color,
      colorType,
      timestamp: Date.now(),
    }
    await chrome.storage.local.set({
      [STORAGE_KEYS.PENDING_EYEDROPPER]: pending,
    })
  } catch (error) {
    console.error('Error setting pending eyedropper:', error)
  }
}

/**
 * Get pending eyedropper result
 * Called by popup on open to check for picked colors
 */
export async function getPendingEyedropper(): Promise<PendingEyedropper | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_EYEDROPPER)
    const pending = result[STORAGE_KEYS.PENDING_EYEDROPPER] as PendingEyedropper | undefined
    
    // Only return if picked within the last 5 minutes
    if (pending && Date.now() - pending.timestamp < 5 * 60 * 1000) {
      return pending
    }
    return null
  } catch (error) {
    console.error('Error getting pending eyedropper:', error)
    return null
  }
}

/**
 * Clear pending eyedropper result
 * Called after the color has been applied
 */
export async function clearPendingEyedropper(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.PENDING_EYEDROPPER)
  } catch (error) {
    console.error('Error clearing pending eyedropper:', error)
  }
}

/**
 * Set eyedropper active state (to track if we're waiting for a pick)
 */
export async function setEyedropperActive(
  colorType: 'foreground' | 'background'
): Promise<void> {
  try {
    await chrome.storage.local.set({
      wcag_eyedropper_active: { colorType, timestamp: Date.now() },
    })
  } catch (error) {
    console.error('Error setting eyedropper active:', error)
  }
}

/**
 * Get eyedropper active state
 */
export async function getEyedropperActive(): Promise<{
  colorType: 'foreground' | 'background'
} | null> {
  try {
    const result = await chrome.storage.local.get('wcag_eyedropper_active')
    const active = result.wcag_eyedropper_active
    
    // Only valid if set within last 30 seconds
    if (active && Date.now() - active.timestamp < 30 * 1000) {
      return { colorType: active.colorType }
    }
    return null
  } catch (error) {
    console.error('Error getting eyedropper active:', error)
    return null
  }
}

/**
 * Clear eyedropper active state
 */
export async function clearEyedropperActive(): Promise<void> {
  try {
    await chrome.storage.local.remove('wcag_eyedropper_active')
  } catch (error) {
    console.error('Error clearing eyedropper active:', error)
  }
}

