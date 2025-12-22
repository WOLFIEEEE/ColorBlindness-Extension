import React from 'react'
import { createRoot } from 'react-dom/client'
import { PopupApp } from './components/PopupApp'
import { ErrorBoundary } from './components/ErrorBoundary'
import '../styles/globals.css'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <PopupApp />
      </ErrorBoundary>
    </React.StrictMode>
  )
}

