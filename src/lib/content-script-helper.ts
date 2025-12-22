/**
 * Helper utilities for communicating with content scripts
 * Handles injection fallback and restricted page detection
 */

/**
 * Check if a URL is a restricted page where content scripts can't run
 */
export function isRestrictedUrl(url: string): boolean {
  const restrictedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'about:',
    'edge://',
    'brave://',
    'opera://',
    'vivaldi://',
    'file://',
    'view-source:',
    'devtools://',
  ]
  
  const restrictedDomains = [
    'chrome.google.com/webstore',
    'addons.mozilla.org',
    'microsoftedge.microsoft.com/addons',
  ]
  
  // Check prefixes
  for (const prefix of restrictedPrefixes) {
    if (url.startsWith(prefix)) {
      return true
    }
  }
  
  // Check domains
  for (const domain of restrictedDomains) {
    if (url.includes(domain)) {
      return true
    }
  }
  
  return false
}

/**
 * Get a user-friendly error message for restricted pages
 */
export function getRestrictedPageMessage(url: string): string {
  if (url.includes('chrome.google.com/webstore')) {
    return '🔒 You\'re on the Chrome Web Store - Chrome blocks all extensions here for security. Navigate to any regular website (like google.com) to use the color picker or scanner.'
  }
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return '🔒 This is a Chrome internal page where extensions cannot run. Navigate to a regular website to use the color picker or scanner.'
  }
  if (url.includes('addons.mozilla.org') || url.includes('microsoftedge.microsoft.com/addons')) {
    return '🔒 Browser extension stores are protected. Navigate to a regular website to use the color picker or scanner.'
  }
  if (url.startsWith('about:')) {
    return '🔒 Browser internal pages are protected. Navigate to a regular website to use the color picker or scanner.'
  }
  if (url.startsWith('file://')) {
    return '📁 To use on local files: Go to chrome://extensions → Find this extension → Enable "Allow access to file URLs"'
  }
  if (url.startsWith('view-source:')) {
    return '🔒 View-source pages cannot be accessed. Go back to the actual page to use the color picker.'
  }
  return '🔒 This page is protected. Navigate to a regular website (like google.com) to use the color picker or scanner.'
}

/**
 * Get a short title for restricted page errors
 */
export function getRestrictedPageTitle(url: string): string {
  if (url.includes('chrome.google.com/webstore')) {
    return 'Chrome Web Store - Protected Page'
  }
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return 'Chrome Internal Page'
  }
  if (url.startsWith('file://')) {
    return 'Local File - Permission Needed'
  }
  return 'Protected Page'
}

/**
 * Send message to content script with automatic injection fallback
 */
export async function sendToContentScript<T = unknown>(
  tabId: number,
  message: { type: string; [key: string]: unknown }
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // First, try to send message directly
    const response = await chrome.tabs.sendMessage(tabId, message)
    return { success: true, data: response }
  } catch (error) {
    // Content script might not be loaded, try to inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['assets/content.ts-loader-DvlQ8nQ-.js'],
      })
      
      // Wait a moment for script to initialize
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Try sending message again
      const response = await chrome.tabs.sendMessage(tabId, message)
      return { success: true, data: response }
    } catch (injectionError) {
      const errorMessage = injectionError instanceof Error 
        ? injectionError.message 
        : 'Unknown error'
      
      // Check if it's a restricted page error
      if (errorMessage.includes('Cannot access') || 
          errorMessage.includes('Cannot be scripted')) {
        return { 
          success: false, 
          error: 'This page cannot be accessed by extensions' 
        }
      }
      
      return { 
        success: false, 
        error: `Failed to communicate with page: ${errorMessage}` 
      }
    }
  }
}

/**
 * Check if content script is loaded on a tab
 */
export async function isContentScriptLoaded(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' })
    return response?.success === true
  } catch {
    return false
  }
}

/**
 * Inject content script if not already loaded
 */
export async function ensureContentScriptLoaded(tabId: number): Promise<boolean> {
  const isLoaded = await isContentScriptLoaded(tabId)
  if (isLoaded) return true
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['assets/content.ts-loader-DvlQ8nQ-.js'],
    })
    
    // Also inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['src/styles/content.css'],
    })
    
    return true
  } catch {
    return false
  }
}

