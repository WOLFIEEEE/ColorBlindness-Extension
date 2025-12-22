/**
 * WCAG Contrast Calculation Engine
 * Implements WCAG 2.1/2.2 contrast ratio calculations and compliance checking
 */

import { RGB, getRelativeLuminance, rgbToHex } from './color-utils'

export interface ContrastResult {
  ratio: number
  ratioString: string
  aa: {
    normalText: boolean
    largeText: boolean
    uiComponents: boolean
  }
  aaa: {
    normalText: boolean
    largeText: boolean
  }
  score: 'fail' | 'aa-large' | 'aa' | 'aaa'
  foreground: string
  background: string
}

/**
 * WCAG 2.1 Contrast Ratio Thresholds
 * 
 * AA Level:
 * - Normal text: 4.5:1
 * - Large text (18pt or 14pt bold): 3:1
 * - UI Components & Graphical Objects: 3:1
 * 
 * AAA Level:
 * - Normal text: 7:1
 * - Large text: 4.5:1
 */
export const WCAG_THRESHOLDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AA_UI: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const

/**
 * Calculate contrast ratio between two colors
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter
 */
export function calculateContrastRatio(foreground: RGB, background: RGB): number {
  const lum1 = getRelativeLuminance(foreground)
  const lum2 = getRelativeLuminance(background)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`
}

/**
 * Get comprehensive contrast analysis
 */
export function analyzeContrast(foreground: RGB, background: RGB): ContrastResult {
  const ratio = calculateContrastRatio(foreground, background)

  const aa = {
    normalText: ratio >= WCAG_THRESHOLDS.AA_NORMAL,
    largeText: ratio >= WCAG_THRESHOLDS.AA_LARGE,
    uiComponents: ratio >= WCAG_THRESHOLDS.AA_UI,
  }

  const aaa = {
    normalText: ratio >= WCAG_THRESHOLDS.AAA_NORMAL,
    largeText: ratio >= WCAG_THRESHOLDS.AAA_LARGE,
  }

  // Determine overall score
  let score: ContrastResult['score'] = 'fail'
  if (aaa.normalText) {
    score = 'aaa'
  } else if (aa.normalText) {
    score = 'aa'
  } else if (aa.largeText) {
    score = 'aa-large'
  }

  return {
    ratio,
    ratioString: formatContrastRatio(ratio),
    aa,
    aaa,
    score,
    foreground: rgbToHex(foreground),
    background: rgbToHex(background),
  }
}

/**
 * Check if contrast passes specific WCAG level
 */
export function passesWcag(
  foreground: RGB,
  background: RGB,
  level: 'AA' | 'AAA',
  textSize: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = calculateContrastRatio(foreground, background)

  if (level === 'AAA') {
    return textSize === 'large'
      ? ratio >= WCAG_THRESHOLDS.AAA_LARGE
      : ratio >= WCAG_THRESHOLDS.AAA_NORMAL
  }

  return textSize === 'large'
    ? ratio >= WCAG_THRESHOLDS.AA_LARGE
    : ratio >= WCAG_THRESHOLDS.AA_NORMAL
}

/**
 * Get required contrast ratio for a specific level
 */
export function getRequiredRatio(level: 'AA' | 'AAA', textSize: 'normal' | 'large'): number {
  if (level === 'AAA') {
    return textSize === 'large' ? WCAG_THRESHOLDS.AAA_LARGE : WCAG_THRESHOLDS.AAA_NORMAL
  }
  return textSize === 'large' ? WCAG_THRESHOLDS.AA_LARGE : WCAG_THRESHOLDS.AA_NORMAL
}

/**
 * Get human-readable score label
 */
export function getScoreLabel(score: ContrastResult['score']): string {
  switch (score) {
    case 'aaa':
      return 'AAA - Excellent'
    case 'aa':
      return 'AA - Good'
    case 'aa-large':
      return 'AA Large Text Only'
    case 'fail':
      return 'Fail - Insufficient Contrast'
  }
}

/**
 * Get score color for UI display
 */
export function getScoreColor(score: ContrastResult['score']): string {
  switch (score) {
    case 'aaa':
      return '#059669' // green-600
    case 'aa':
      return '#2563EB' // blue-600
    case 'aa-large':
      return '#D97706' // amber-600
    case 'fail':
      return '#DC2626' // red-600
  }
}

/**
 * Minimum contrast needed to reach a level
 */
export function getContrastGap(
  currentRatio: number,
  targetLevel: 'AA' | 'AAA',
  textSize: 'normal' | 'large'
): number {
  const required = getRequiredRatio(targetLevel, textSize)
  return Math.max(0, required - currentRatio)
}

/**
 * Determine if text would be considered "large" based on font size
 * Large text: 18pt (24px) or 14pt (18.67px) bold
 */
export function isLargeText(fontSizePx: number, isBold: boolean): boolean {
  if (isBold) {
    return fontSizePx >= 18.67 // 14pt
  }
  return fontSizePx >= 24 // 18pt
}

/**
 * Get all WCAG compliance info in one object
 */
export function getFullCompliance(foreground: RGB, background: RGB): {
  ratio: number
  ratioString: string
  normalText: { aa: boolean; aaa: boolean }
  largeText: { aa: boolean; aaa: boolean }
  uiComponents: { aa: boolean }
  overallScore: ContrastResult['score']
} {
  const ratio = calculateContrastRatio(foreground, background)

  return {
    ratio,
    ratioString: formatContrastRatio(ratio),
    normalText: {
      aa: ratio >= WCAG_THRESHOLDS.AA_NORMAL,
      aaa: ratio >= WCAG_THRESHOLDS.AAA_NORMAL,
    },
    largeText: {
      aa: ratio >= WCAG_THRESHOLDS.AA_LARGE,
      aaa: ratio >= WCAG_THRESHOLDS.AAA_LARGE,
    },
    uiComponents: {
      aa: ratio >= WCAG_THRESHOLDS.AA_UI,
    },
    overallScore: ratio >= WCAG_THRESHOLDS.AAA_NORMAL
      ? 'aaa'
      : ratio >= WCAG_THRESHOLDS.AA_NORMAL
        ? 'aa'
        : ratio >= WCAG_THRESHOLDS.AA_LARGE
          ? 'aa-large'
          : 'fail',
  }
}

