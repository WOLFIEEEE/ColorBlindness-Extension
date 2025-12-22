/**
 * Content Script
 * Runs on web pages to enable eyedropper, page scanning, and overlay UI
 */

import { parseColor, rgbToHex } from '@/lib/color-utils'
import { calculateContrastRatio, analyzeContrast } from '@/lib/contrast'

// State
let eyedropperActive = false
let eyedropperType: 'foreground' | 'background' = 'foreground'
let overlayContainer: HTMLDivElement | null = null
let colorPreview: HTMLDivElement | null = null
let isScanning = false

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

function init() {
  console.log('TheWCAG Content Script initialized')
  createOverlayContainer()
  setupMessageListener()
}

/**
 * Create the overlay container for UI elements
 */
function createOverlayContainer() {
  if (overlayContainer) return

  overlayContainer = document.createElement('div')
  overlayContainer.className = 'thewcag-overlay'
  overlayContainer.id = 'thewcag-overlay-container'
  document.body.appendChild(overlayContainer)
}

/**
 * Setup message listener for popup/background communication
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Content script received message:', message)

    switch (message.type) {
      case 'PING':
        // Used to check if content script is loaded
        sendResponse({ success: true })
        break

      case 'OPEN_EYEDROPPER':
        activateEyedropper(message.colorType || 'foreground')
        sendResponse({ success: true })
        break

      case 'TOGGLE_EYEDROPPER':
        if (eyedropperActive) {
          deactivateEyedropper()
        } else {
          activateEyedropper('foreground')
        }
        sendResponse({ success: true })
        break

      case 'SCAN_PAGE':
        scanPage().then((results) => {
          sendResponse({ success: true, results })
          showScanResults(results)
        })
        return true // Keep channel open for async

      case 'CHECK_ELEMENT':
        checkElementAtPoint(message.x, message.y)
        sendResponse({ success: true })
        break

      case 'SCROLL_TO_ELEMENT':
        scrollToElement(message.selector)
        sendResponse({ success: true })
        break

      case 'HIGHLIGHT_ELEMENT':
        highlightElement(message.selector, message.duration || 3000)
        sendResponse({ success: true })
        break

      default:
        sendResponse({ success: false, error: 'Unknown message type' })
    }
  })
}

/**
 * Activate the eyedropper tool
 */
function activateEyedropper(type: 'foreground' | 'background') {
  eyedropperActive = true
  eyedropperType = type
  document.body.classList.add('thewcag-eyedropper-cursor')

  // Try native EyeDropper API first (Chrome 95+)
  if ('EyeDropper' in window) {
    openNativeEyeDropper()
  } else {
    openCustomEyeDropper()
  }
}

/**
 * Open native EyeDropper API
 */
async function openNativeEyeDropper() {
  try {
    // @ts-expect-error - EyeDropper is not in TypeScript types yet
    const eyeDropper = new EyeDropper()
    const result = await eyeDropper.open()
    
    const hex = result.sRGBHex.toUpperCase()
    sendColorToExtension(hex)
    showToast(`Color picked: ${hex}`)
  } catch (error) {
    // User cancelled or error
    console.log('EyeDropper cancelled or error:', error)
  } finally {
    deactivateEyedropper()
  }
}

/**
 * Custom eyedropper using mouse tracking
 */
function openCustomEyeDropper() {
  // Create color preview element
  colorPreview = document.createElement('div')
  colorPreview.className = 'thewcag-color-preview'
  colorPreview.innerHTML = `
    <div class="thewcag-color-preview-swatch"></div>
    <span class="thewcag-color-preview-value">#000000</span>
  `
  colorPreview.style.display = 'none'
  overlayContainer?.appendChild(colorPreview)

  document.addEventListener('mousemove', handleEyedropperMove)
  document.addEventListener('click', handleEyedropperClick, true)
  document.addEventListener('keydown', handleEyedropperKeydown)
}

function handleEyedropperMove(e: MouseEvent) {
  if (!eyedropperActive || !colorPreview) return

  // Get element at point
  const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
  if (!element) return

  // Get computed color
  const style = window.getComputedStyle(element)
  const bgColor = style.backgroundColor
  const color = parseColor(bgColor)
  
  if (color) {
    const hex = rgbToHex(color)
    
    // Update preview
    const swatch = colorPreview.querySelector('.thewcag-color-preview-swatch') as HTMLElement
    const value = colorPreview.querySelector('.thewcag-color-preview-value')
    
    if (swatch) swatch.style.backgroundColor = hex
    if (value) value.textContent = hex
    
    // Position preview near cursor
    colorPreview.style.display = 'flex'
    colorPreview.style.left = `${e.clientX + 15}px`
    colorPreview.style.top = `${e.clientY + 15}px`
  }
}

function handleEyedropperClick(e: MouseEvent) {
  if (!eyedropperActive) return

  e.preventDefault()
  e.stopPropagation()

  const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
  if (!element) return

  const style = window.getComputedStyle(element)
  const bgColor = style.backgroundColor
  const color = parseColor(bgColor)

  if (color) {
    const hex = rgbToHex(color)
    sendColorToExtension(hex)
    showToast(`Color picked: ${hex}`)
  }

  deactivateEyedropper()
}

function handleEyedropperKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && eyedropperActive) {
    deactivateEyedropper()
  }
}

/**
 * Deactivate eyedropper
 */
function deactivateEyedropper() {
  eyedropperActive = false
  document.body.classList.remove('thewcag-eyedropper-cursor')
  
  document.removeEventListener('mousemove', handleEyedropperMove)
  document.removeEventListener('click', handleEyedropperClick, true)
  document.removeEventListener('keydown', handleEyedropperKeydown)
  
  if (colorPreview) {
    colorPreview.remove()
    colorPreview = null
  }
}

/**
 * Send picked color to extension
 */
function sendColorToExtension(hex: string) {
  chrome.runtime.sendMessage({
    type: 'COLOR_PICKED',
    color: hex,
    colorType: eyedropperType,
  })
}

/**
 * Scan the page for contrast issues
 */
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

async function scanPage(): Promise<ScanResult[]> {
  if (isScanning) return []
  isScanning = true

  const results: ScanResult[] = []
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label, li, td, th, div')

  textElements.forEach((el) => {
    const element = el as HTMLElement
    const style = window.getComputedStyle(element)
    
    // Skip hidden elements
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return
    }

    // Get text content (direct text nodes only)
    const text = getDirectTextContent(element)
    if (!text.trim()) return

    // Get colors
    const fgColorStr = style.color
    const bgColorStr = getEffectiveBackgroundColor(element)

    const fgColor = parseColor(fgColorStr)
    const bgColor = parseColor(bgColorStr)

    if (!fgColor || !bgColor) return

    const ratio = calculateContrastRatio(fgColor, bgColor)
    const analysis = analyzeContrast(fgColor, bgColor)

    results.push({
      element: element.tagName.toLowerCase(),
      selector: getSelector(element),
      foreground: rgbToHex(fgColor),
      background: rgbToHex(bgColor),
      ratio,
      score: analysis.score,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    })
  })

  isScanning = false
  return results
}

/**
 * Get direct text content (not from children)
 */
function getDirectTextContent(element: HTMLElement): string {
  let text = ''
  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || ''
    }
  })
  return text
}

/**
 * Get effective background color (walk up tree)
 */
function getEffectiveBackgroundColor(element: HTMLElement): string {
  let current: HTMLElement | null = element
  
  while (current) {
    const style = window.getComputedStyle(current)
    const bg = style.backgroundColor
    
    // Check if background is not transparent
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      return bg
    }
    
    current = current.parentElement
  }
  
  // Default to white if no background found
  return 'rgb(255, 255, 255)'
}

/**
 * Generate a CSS selector for an element
 */
function getSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`
  }
  
  const path: string[] = []
  let current: HTMLElement | null = element
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()
    
    if (current.className) {
      const classes = current.className.toString().split(' ').filter(c => c).slice(0, 2)
      if (classes.length) {
        selector += '.' + classes.join('.')
      }
    }
    
    path.unshift(selector)
    current = current.parentElement
    
    if (path.length >= 3) break
  }
  
  return path.join(' > ')
}

/**
 * Check element at specific point
 */
function checkElementAtPoint(x: number, y: number) {
  const element = document.elementFromPoint(x, y) as HTMLElement
  if (!element) return

  const style = window.getComputedStyle(element)
  const fgColorStr = style.color
  const bgColorStr = getEffectiveBackgroundColor(element)

  const fgColor = parseColor(fgColorStr)
  const bgColor = parseColor(bgColorStr)

  if (!fgColor || !bgColor) {
    showToast('Could not determine colors for this element')
    return
  }

  const analysis = analyzeContrast(fgColor, bgColor)
  
  // Highlight the element
  element.classList.add('thewcag-highlight')
  element.setAttribute('data-wcag-info', `${analysis.ratioString} - ${analysis.score.toUpperCase()}`)
  
  setTimeout(() => {
    element.classList.remove('thewcag-highlight')
    element.removeAttribute('data-wcag-info')
  }, 3000)

  showToast(`Contrast: ${analysis.ratioString} (${analysis.score.toUpperCase()})`)
}

/**
 * Show scan results in overlay panel
 */
function showScanResults(results: ScanResult[]) {
  const failures = results.filter(r => r.score === 'fail')
  const warnings = results.filter(r => r.score === 'aa-large')
  const passes = results.filter(r => r.score === 'aa' || r.score === 'aaa')

  // Create results panel
  const panel = document.createElement('div')
  panel.className = 'thewcag-panel'
  panel.innerHTML = `
    <div class="thewcag-panel-header">
      <div class="thewcag-panel-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Scan Results
      </div>
      <button class="thewcag-panel-close" id="thewcag-close-panel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="thewcag-panel-content">
      <div style="margin-bottom: 16px;">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${failures.length} Failures
          </span>
          <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${warnings.length} Warnings
          </span>
          <span style="background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${passes.length} Passes
          </span>
        </div>
        <p style="font-size: 12px; color: #6B5B4F;">
          Scanned ${results.length} text elements
        </p>
      </div>
      
      ${failures.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 13px; font-weight: 600; color: #991b1b; margin-bottom: 8px;">Failures</h4>
          ${failures.slice(0, 10).map(r => renderResultItem(r, 'fail')).join('')}
          ${failures.length > 10 ? `<p style="font-size: 11px; color: #6B5B4F;">+ ${failures.length - 10} more</p>` : ''}
        </div>
      ` : ''}
      
      ${warnings.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 13px; font-weight: 600; color: #92400e; margin-bottom: 8px;">Warnings (Large Text Only)</h4>
          ${warnings.slice(0, 5).map(r => renderResultItem(r, 'warning')).join('')}
          ${warnings.length > 5 ? `<p style="font-size: 11px; color: #6B5B4F;">+ ${warnings.length - 5} more</p>` : ''}
        </div>
      ` : ''}
      
      <a href="https://thewcag.com/tools/contrast-checker" target="_blank" style="display: block; text-align: center; font-size: 12px; color: #D97706; text-decoration: none; margin-top: 16px;">
        Full contrast checker at TheWCAG.com →
      </a>
    </div>
  `

  overlayContainer?.appendChild(panel)

  // Close button handler
  document.getElementById('thewcag-close-panel')?.addEventListener('click', () => {
    panel.remove()
  })

  // Auto-close after 30 seconds
  setTimeout(() => {
    panel.remove()
  }, 30000)
}

function renderResultItem(result: ScanResult, type: 'fail' | 'warning'): string {
  const borderColor = type === 'fail' ? '#fecaca' : '#fde68a'
  return `
    <div style="padding: 8px; background: ${type === 'fail' ? '#fef2f2' : '#fffbeb'}; border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 6px; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <code style="font-size: 11px; color: #374151;">${result.selector}</code>
        <span style="font-weight: 600; color: ${type === 'fail' ? '#991b1b' : '#92400e'};">${result.ratio.toFixed(2)}:1</span>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <div style="width: 16px; height: 16px; border-radius: 3px; background: ${result.foreground}; border: 1px solid #e5e7eb;"></div>
        <span style="color: #6b7280;">on</span>
        <div style="width: 16px; height: 16px; border-radius: 3px; background: ${result.background}; border: 1px solid #e5e7eb;"></div>
        <span style="color: #6b7280; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${result.text}"</span>
      </div>
    </div>
  `
}

/**
 * Show toast notification
 */
function showToast(message: string) {
  const existing = document.querySelector('.thewcag-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = 'thewcag-toast'
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

/**
 * Scroll to an element by selector and highlight it
 */
function scrollToElement(selector: string) {
  try {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) {
      showToast('Element not found on page')
      return
    }

    // Scroll element into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })

    // Highlight the element
    highlightElement(selector, 3000)
  } catch (error) {
    console.error('Error scrolling to element:', error)
    showToast('Could not scroll to element')
  }
}

/**
 * Highlight an element temporarily
 */
function highlightElement(selector: string, duration: number = 3000) {
  try {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return

    // Store original styles
    const originalOutline = element.style.outline
    const originalOutlineOffset = element.style.outlineOffset
    const originalTransition = element.style.transition

    // Apply highlight
    element.style.transition = 'outline 0.2s ease'
    element.style.outline = '3px solid #D97706'
    element.style.outlineOffset = '2px'

    // Create a pulsing animation
    let pulseCount = 0
    const pulseInterval = setInterval(() => {
      pulseCount++
      element.style.outline = pulseCount % 2 === 0 
        ? '3px solid #D97706' 
        : '3px solid #F59E0B'
      
      if (pulseCount >= 6) {
        clearInterval(pulseInterval)
      }
    }, 300)

    // Remove highlight after duration
    setTimeout(() => {
      clearInterval(pulseInterval)
      element.style.outline = originalOutline
      element.style.outlineOffset = originalOutlineOffset
      element.style.transition = originalTransition
    }, duration)
  } catch (error) {
    console.error('Error highlighting element:', error)
  }
}

export {}

