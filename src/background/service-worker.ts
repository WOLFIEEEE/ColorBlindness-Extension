/**
 * Background Service Worker
 * Handles communication between popup, content scripts, and devtools
 */

import { setPendingEyedropper, clearEyedropperActive } from '@/lib/storage'

// Listen for extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('TheWCAG Color Contrast Checker installed/updated:', details.reason)
  
  if (details.reason === 'install') {
    // Set default preferences on first install
    chrome.storage.local.set({
      wcag_preferences: {
        defaultLevel: 'AA',
        defaultTextSize: 'normal',
        darkMode: false,
        showNotifications: true,
        maxHistoryItems: 20,
      },
      wcag_color_history: [],
      wcag_saved_palettes: [],
    })
  }
})

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Service worker received message:', message, 'from:', sender)

  switch (message.type) {
    case 'GET_TAB_INFO':
      // Get current tab info
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ tab: tabs[0] })
      })
      return true // Keep channel open for async response

    case 'INJECT_CONTENT_SCRIPT':
      // Manually inject content script if needed
      if (sender.tab?.id) {
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          files: ['src/content/content.ts'],
        }).then(() => {
          sendResponse({ success: true })
        }).catch((error) => {
          sendResponse({ success: false, error: error.message })
        })
      }
      return true

    case 'COLOR_PICKED':
      // Store picked color in storage for popup to retrieve
      setPendingEyedropper(message.color, message.colorType)
        .then(() => {
          // Clear the active eyedropper state
          clearEyedropperActive()
          
          // Set badge to indicate color was picked
          chrome.action.setBadgeText({ text: '●' })
          chrome.action.setBadgeBackgroundColor({ color: message.color })
          
          // Clear badge after 5 seconds
          setTimeout(() => {
            chrome.action.setBadgeText({ text: '' })
          }, 5000)
        })
        .catch((error) => {
          console.error('Error storing picked color:', error)
        })
      sendResponse({ success: true })
      break

    case 'SCAN_RESULTS':
      // Store scan results for devtools panel
      chrome.storage.local.set({
        wcag_last_scan: {
          url: message.url,
          timestamp: Date.now(),
          results: message.results,
        },
      })
      break

    case 'OPEN_POPUP':
      // Can't programmatically open popup, but can badge the icon
      chrome.action.setBadgeText({ text: '!' })
      chrome.action.setBadgeBackgroundColor({ color: '#D97706' })
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' })
      }, 3000)
      break

    default:
      console.log('Unknown message type:', message.type)
  }
})

// Handle keyboard shortcuts
chrome.commands?.onCommand?.addListener((command) => {
  console.log('Command received:', command)

  switch (command) {
    case 'toggle-eyedropper':
      // Send message to content script to toggle eyedropper
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_EYEDROPPER' })
        }
      })
      break

    case 'scan-page':
      // Send message to content script to scan page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SCAN_PAGE' })
        }
      })
      break
  }
})

// Context menu for right-click options
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create({
    id: 'wcag-check-element',
    title: 'Check contrast of this element',
    contexts: ['all'],
  })

  chrome.contextMenus?.create({
    id: 'wcag-scan-page',
    title: 'Scan page for contrast issues',
    contexts: ['page'],
  })
})

chrome.contextMenus?.onClicked?.addListener((info, tab) => {
  if (!tab?.id) return

  switch (info.menuItemId) {
    case 'wcag-check-element':
      // Note: pageX/pageY not available in manifest v3, user will use eyedropper instead
      chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_EYEDROPPER',
      })
      break

    case 'wcag-scan-page':
      chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' })
      break
  }
})

export {}

