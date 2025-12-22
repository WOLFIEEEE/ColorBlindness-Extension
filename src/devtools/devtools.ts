/**
 * DevTools Entry Point
 * Creates the WCAG panel in Chrome DevTools
 */

chrome.devtools.panels.create(
  'WCAG Contrast',
  'icons/icon-32.png',
  'src/devtools/panel.html',
  (panel) => {
    console.log('WCAG Contrast panel created')
    
    // Panel shown callback
    panel.onShown.addListener((window) => {
      console.log('Panel shown', window)
    })

    // Panel hidden callback
    panel.onHidden.addListener(() => {
      console.log('Panel hidden')
    })
  }
)

