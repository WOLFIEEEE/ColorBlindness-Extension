import { RGB, rgbToHex } from '@/lib/color-utils'
import { SuggestionResult, ColorSuggestion } from '@/lib/suggestions'

interface SuggestionsListProps {
  suggestions: SuggestionResult
  onApply: (type: 'foreground' | 'background', rgb: RGB) => void
  targetLevel: 'AA' | 'AAA'
}

export function SuggestionsList({ suggestions, onApply, targetLevel }: SuggestionsListProps) {
  // Determine which suggestion requires less change
  const fgChange = suggestions.bestForeground?.percentChange ?? Infinity
  const bgChange = suggestions.bestBackground?.percentChange ?? Infinity
  const recommendForeground = fgChange <= bgChange

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="font-semibold text-dark dark:text-cream">
          Recommended Fixes for WCAG {targetLevel}
        </h3>
      </div>

      {/* Recommendation summary */}
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <p className="text-sm text-green-800 dark:text-green-300">
          <strong>Quick fix:</strong>{' '}
          {recommendForeground && suggestions.bestForeground
            ? `Make your text color ${suggestions.bestForeground.adjustment === 'lighter' ? 'lighter' : 'darker'} to ${suggestions.bestForeground.hex}`
            : suggestions.bestBackground
              ? `Make your background ${suggestions.bestBackground.adjustment === 'lighter' ? 'lighter' : 'darker'} to ${suggestions.bestBackground.hex}`
              : 'See options below'
          }
        </p>
        <p className="text-xs text-green-700 dark:text-green-400 mt-1 opacity-80">
          This is the smallest change needed to meet {targetLevel} standards.
        </p>
      </div>

      {suggestions.bestForeground && (
        <SuggestionCard
          title="Option 1: Adjust Text Color"
          description={`Make the text ${suggestions.bestForeground.adjustment === 'lighter' ? 'lighter' : 'darker'} while keeping the same color tone`}
          suggestion={suggestions.bestForeground}
          originalHex={rgbToHex(suggestions.original.foreground)}
          onApply={() => onApply('foreground', suggestions.bestForeground!.color)}
          isRecommended={recommendForeground}
        />
      )}

      {suggestions.bestBackground && (
        <SuggestionCard
          title="Option 2: Adjust Background"
          description={`Make the background ${suggestions.bestBackground.adjustment === 'lighter' ? 'lighter' : 'darker'} while keeping the same color tone`}
          suggestion={suggestions.bestBackground}
          originalHex={rgbToHex(suggestions.original.background)}
          onApply={() => onApply('background', suggestions.bestBackground!.color)}
          isRecommended={!recommendForeground}
        />
      )}

      <p className="text-xs text-warm-brown dark:text-cream/60 italic">
        These suggestions preserve your original color&apos;s hue and saturation—only the lightness is adjusted to meet accessibility requirements.
      </p>
    </div>
  )
}

interface SuggestionCardProps {
  title: string
  description: string
  suggestion: ColorSuggestion
  originalHex: string
  onApply: () => void
  isRecommended?: boolean
}

function SuggestionCard({ title, description, suggestion, originalHex, onApply, isRecommended }: SuggestionCardProps) {
  return (
    <div className={`rounded-lg p-3 space-y-2 ${
      isRecommended 
        ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' 
        : 'bg-beige dark:bg-warm-brown/10 border border-border dark:border-warm-brown/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-dark dark:text-cream">{title}</span>
          {isRecommended && (
            <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium">
              RECOMMENDED
            </span>
          )}
        </div>
        <span className="badge badge-success">
          {suggestion.ratioString}
        </span>
      </div>

      <p className="text-xs text-warm-brown dark:text-cream/70">{description}</p>

      <div className="flex items-center gap-3">
        {/* Original */}
        <div className="flex-1">
          <p className="text-xs text-warm-brown dark:text-cream/60 mb-1">Current</p>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-border dark:border-warm-brown/30"
              style={{ backgroundColor: originalHex }}
            />
            <span className="text-xs font-mono text-dark dark:text-cream">
              {originalHex}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>

        {/* Suggested */}
        <div className="flex-1">
          <p className="text-xs text-warm-brown dark:text-cream/60 mb-1">Accessible</p>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-border dark:border-warm-brown/30"
              style={{ backgroundColor: suggestion.hex }}
            />
            <span className="text-xs font-mono text-dark dark:text-cream">
              {suggestion.hex}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-warm-brown dark:text-cream/60">
          {suggestion.adjustment === 'lighter' ? '↑ Made lighter' : '↓ Made darker'} by {suggestion.percentChange.toFixed(1)}%
        </span>
        <button
          onClick={onApply}
          className={`text-xs py-1 px-3 rounded font-medium transition-colors ${
            isRecommended
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'btn-primary'
          }`}
        >
          Apply This Fix
        </button>
      </div>
    </div>
  )
}

