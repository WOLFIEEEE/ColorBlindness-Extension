import React from 'react'
import { createRoot } from 'react-dom/client'
import { DevToolsPanel } from './components/DevToolsPanel'
import { ErrorBoundary } from '../popup/components/ErrorBoundary'
import '../styles/globals.css'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <DevToolsPanel />
      </ErrorBoundary>
    </React.StrictMode>
  )
} else {
  console.error('DevTools panel: Root element not found')
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found in DevTools panel</div>'
}

