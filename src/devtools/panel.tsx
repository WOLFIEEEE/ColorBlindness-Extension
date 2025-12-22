import React from 'react'
import { createRoot } from 'react-dom/client'
import { DevToolsPanel } from './components/DevToolsPanel'
import '../styles/globals.css'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <DevToolsPanel />
    </React.StrictMode>
  )
}

