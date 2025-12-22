import React from 'react'
import { ColorPair, clearHistory, removeFromHistory } from '@/lib/storage'

interface ColorHistoryProps {
  history: ColorPair[]
  onSelect: (pair: ColorPair) => void
  onRefresh: () => void
}

export function ColorHistory({ history, onSelect, onRefresh }: ColorHistoryProps) {
  const handleClearAll = async () => {
    if (confirm('Clear all color history?')) {
      await clearHistory()
      onRefresh()
    }
  }

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await removeFromHistory(id)
    onRefresh()
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 mx-auto text-warm-brown/30 dark:text-cream/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-warm-brown dark:text-cream/60 text-sm">No color history yet</p>
        <p className="text-warm-brown/60 dark:text-cream/40 text-xs mt-1">
          Start checking colors to build your history
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark dark:text-cream text-sm">
          Recent Colors ({history.length})
        </h3>
        <button
          onClick={handleClearAll}
          className="text-xs text-warm-brown hover:text-red-600 dark:text-cream/60 dark:hover:text-red-400 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto">
        {history.map((pair) => (
          <button
            key={pair.id}
            onClick={() => onSelect(pair)}
            className="w-full card p-3 hover:shadow-md transition-shadow group text-left"
          >
            <div className="flex items-center gap-3">
              {/* Color Preview */}
              <div className="relative w-12 h-12 rounded overflow-hidden border border-border dark:border-warm-brown/30 shrink-0">
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: pair.backgroundHex }}
                />
                <div
                  className="absolute inset-2 rounded flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: pair.backgroundHex,
                    color: pair.foregroundHex,
                  }}
                >
                  Aa
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-dark dark:text-cream truncate">
                    {pair.foregroundHex}
                  </span>
                  <span className="text-warm-brown/40 dark:text-cream/30">/</span>
                  <span className="text-xs font-mono text-dark dark:text-cream truncate">
                    {pair.backgroundHex}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold ${
                    pair.ratio >= 7 
                      ? 'text-green-600 dark:text-green-400' 
                      : pair.ratio >= 4.5 
                        ? 'text-blue-600 dark:text-blue-400'
                        : pair.ratio >= 3
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                  }`}>
                    {pair.ratio.toFixed(2)}:1
                  </span>
                  <span className="text-xs text-warm-brown/60 dark:text-cream/40">
                    {formatTimestamp(pair.timestamp)}
                  </span>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => handleRemove(e, pair.id)}
                className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 text-warm-brown hover:text-red-600 dark:text-cream/60 dark:hover:text-red-400 transition-all"
                title="Remove from history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return new Date(timestamp).toLocaleDateString()
}

