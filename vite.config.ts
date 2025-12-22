import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    {
      name: 'copy-content-css',
      closeBundle() {
        // Ensure content.css is copied to dist
        const srcPath = resolve(__dirname, 'src/styles/content.css')
        const destDir = resolve(__dirname, 'dist/src/styles')
        const destPath = resolve(destDir, 'content.css')
        
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true })
        }
        if (existsSync(srcPath)) {
          copyFileSync(srcPath, destPath)
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Use empty base for Chrome extension compatibility
  base: '',
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        devtools: resolve(__dirname, 'src/devtools/devtools.html'),
        panel: resolve(__dirname, 'src/devtools/panel.html'),
      },
    },
  },
})

