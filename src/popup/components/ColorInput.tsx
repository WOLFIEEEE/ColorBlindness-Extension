import React, { useState, useCallback } from 'react'
import { copyToClipboard } from './Toast'

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onEyedropper: () => void
  previewColor: string
  onCopy?: (success: boolean) => void
}

export function ColorInput({
  label,
  value,
  onChange,
  onEyedropper,
  previewColor,
  onCopy,
}: ColorInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(value)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    onCopy?.(success)
  }, [value, onCopy])

  // Update local state when prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Only trigger onChange for valid-looking colors
    if (newValue.match(/^#[0-9A-Fa-f]{6}$/) || 
        newValue.match(/^#[0-9A-Fa-f]{3}$/) ||
        newValue.match(/^rgb/i) ||
        newValue.match(/^hsl/i)) {
      onChange(newValue)
    }
  }, [onChange])

  const handleBlur = useCallback(() => {
    onChange(inputValue)
  }, [inputValue, onChange])

  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase()
    setInputValue(newValue)
    onChange(newValue)
  }, [onChange])

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-dark dark:text-cream">
        {label}
      </label>
      
      <div className="flex gap-2">
        {/* Color Swatch with Native Picker */}
        <div className="relative group">
          <div
            className="w-10 h-10 rounded border-2 border-border dark:border-warm-brown/30 shadow-inner cursor-pointer overflow-hidden"
            style={{ backgroundColor: previewColor }}
          >
            <input
              type="color"
              value={previewColor.match(/^#[0-9A-Fa-f]{6}$/i) ? previewColor : '#000000'}
              onChange={handleColorPickerChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label={`${label} color picker`}
            />
          </div>
          {/* Copy indicator on hover */}
          <button
            onClick={handleCopy}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
            title="Copy color"
            aria-label={`Copy ${label.toLowerCase()} color`}
          >
            {copied ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="input text-sm font-mono pr-9"
            placeholder="#000000"
            aria-label={`${label} color value`}
          />
          
          {/* Eyedropper Button */}
          <button
            onClick={onEyedropper}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-beige dark:hover:bg-warm-brown/20 text-warm-brown hover:text-primary transition-colors"
            title="Pick color from page"
            aria-label={`Pick ${label.toLowerCase()} color from page`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

