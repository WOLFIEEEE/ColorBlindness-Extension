/**
 * Color Suggestion Algorithm
 * Finds accessible color alternatives when contrast fails
 * Uses OKLCH color space for perceptually uniform adjustments
 */

import { RGB, rgbToOklch, oklchToRgb, rgbToHex, OKLCH } from './color-utils'
import { calculateContrastRatio, WCAG_THRESHOLDS } from './contrast'

export interface ColorSuggestion {
  color: RGB
  hex: string
  contrastRatio: number
  ratioString: string
  adjustment: 'lighter' | 'darker' | 'original'
  percentChange: number
}

export interface SuggestionResult {
  original: {
    foreground: RGB
    background: RGB
    ratio: number
  }
  suggestions: {
    foreground: ColorSuggestion[]
    background: ColorSuggestion[]
  }
  bestForeground: ColorSuggestion | null
  bestBackground: ColorSuggestion | null
}

/**
 * Find the minimum lightness adjustment needed to meet target contrast
 */
function findMinimumAdjustment(
  colorToAdjust: RGB,
  fixedColor: RGB,
  targetRatio: number,
  adjustColorIsBackground: boolean
): ColorSuggestion[] {
  const suggestions: ColorSuggestion[] = []
  const originalOklch = rgbToOklch(colorToAdjust)
  const originalRatio = calculateContrastRatio(
    adjustColorIsBackground ? fixedColor : colorToAdjust,
    adjustColorIsBackground ? colorToAdjust : fixedColor
  )

  // If already meets target, return original
  if (originalRatio >= targetRatio) {
    suggestions.push({
      color: colorToAdjust,
      hex: rgbToHex(colorToAdjust),
      contrastRatio: originalRatio,
      ratioString: `${originalRatio.toFixed(2)}:1`,
      adjustment: 'original',
      percentChange: 0,
    })
    return suggestions
  }

  // Try making lighter
  const lighterSuggestion = findLightnessForContrast(
    originalOklch,
    fixedColor,
    targetRatio,
    'lighter',
    adjustColorIsBackground
  )
  if (lighterSuggestion) {
    suggestions.push(lighterSuggestion)
  }

  // Try making darker
  const darkerSuggestion = findLightnessForContrast(
    originalOklch,
    fixedColor,
    targetRatio,
    'darker',
    adjustColorIsBackground
  )
  if (darkerSuggestion) {
    suggestions.push(darkerSuggestion)
  }

  // Sort by smallest change
  suggestions.sort((a, b) => a.percentChange - b.percentChange)

  return suggestions
}

/**
 * Binary search for the lightness value that achieves target contrast
 */
function findLightnessForContrast(
  originalOklch: OKLCH,
  fixedColor: RGB,
  targetRatio: number,
  direction: 'lighter' | 'darker',
  adjustColorIsBackground: boolean
): ColorSuggestion | null {
  const originalL = originalOklch.l

  let minL = direction === 'lighter' ? originalL : 0
  let maxL = direction === 'lighter' ? 1 : originalL

  // Binary search for optimal lightness
  let iterations = 0
  const maxIterations = 20

  while (iterations < maxIterations && maxL - minL > 0.001) {
    const midL = (minL + maxL) / 2
    const testOklch: OKLCH = { ...originalOklch, l: midL }
    const testRgb = oklchToRgb(testOklch)

    const ratio = calculateContrastRatio(
      adjustColorIsBackground ? fixedColor : testRgb,
      adjustColorIsBackground ? testRgb : fixedColor
    )

    if (direction === 'lighter') {
      // Lighter colors have lower luminance relative to dark text
      if (ratio >= targetRatio) {
        maxL = midL // Can be less light
      } else {
        minL = midL // Need more light
      }
    } else {
      // Darker colors
      if (ratio >= targetRatio) {
        minL = midL // Can be less dark
      } else {
        maxL = midL // Need more dark
      }
    }

    iterations++
  }

  // Final check
  const finalL = direction === 'lighter' ? maxL : minL
  const finalOklch: OKLCH = { ...originalOklch, l: finalL }
  const finalRgb = oklchToRgb(finalOklch)

  const finalRatio = calculateContrastRatio(
    adjustColorIsBackground ? fixedColor : finalRgb,
    adjustColorIsBackground ? finalRgb : fixedColor
  )

  // Only return if we actually meet the target
  if (finalRatio >= targetRatio) {
    const percentChange = Math.abs(finalL - originalL) * 100

    return {
      color: finalRgb,
      hex: rgbToHex(finalRgb),
      contrastRatio: finalRatio,
      ratioString: `${finalRatio.toFixed(2)}:1`,
      adjustment: direction,
      percentChange,
    }
  }

  return null
}

/**
 * Get suggestions for both foreground and background colors
 */
export function getSuggestions(
  foreground: RGB,
  background: RGB,
  targetLevel: 'AA' | 'AAA' = 'AA',
  textSize: 'normal' | 'large' = 'normal'
): SuggestionResult {
  const targetRatio =
    targetLevel === 'AAA'
      ? textSize === 'large'
        ? WCAG_THRESHOLDS.AAA_LARGE
        : WCAG_THRESHOLDS.AAA_NORMAL
      : textSize === 'large'
        ? WCAG_THRESHOLDS.AA_LARGE
        : WCAG_THRESHOLDS.AA_NORMAL

  const originalRatio = calculateContrastRatio(foreground, background)

  // Get foreground suggestions (adjusting foreground, keeping background fixed)
  const foregroundSuggestions = findMinimumAdjustment(
    foreground,
    background,
    targetRatio,
    false
  )

  // Get background suggestions (adjusting background, keeping foreground fixed)
  const backgroundSuggestions = findMinimumAdjustment(
    background,
    foreground,
    targetRatio,
    true
  )

  // Find best suggestions (smallest change)
  const bestForeground =
    foregroundSuggestions.find((s) => s.adjustment !== 'original') || null
  const bestBackground =
    backgroundSuggestions.find((s) => s.adjustment !== 'original') || null

  return {
    original: {
      foreground,
      background,
      ratio: originalRatio,
    },
    suggestions: {
      foreground: foregroundSuggestions,
      background: backgroundSuggestions,
    },
    bestForeground,
    bestBackground,
  }
}

/**
 * Get quick suggestions for multiple WCAG levels
 */
export function getQuickSuggestions(
  foreground: RGB,
  background: RGB
): {
  aaLarge: SuggestionResult
  aa: SuggestionResult
  aaa: SuggestionResult
} {
  return {
    aaLarge: getSuggestions(foreground, background, 'AA', 'large'),
    aa: getSuggestions(foreground, background, 'AA', 'normal'),
    aaa: getSuggestions(foreground, background, 'AAA', 'normal'),
  }
}

/**
 * Suggest a completely new color that maintains the hue but achieves contrast
 */
export function suggestAccessibleVariant(
  originalColor: RGB,
  againstColor: RGB,
  targetRatio: number = WCAG_THRESHOLDS.AA_NORMAL
): RGB {
  const oklch = rgbToOklch(originalColor)

  // Try multiple lightness values
  const lightnessValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

  let bestColor = originalColor
  let bestRatio = 0
  let closestToTarget = Infinity

  for (const l of lightnessValues) {
    const testOklch: OKLCH = { ...oklch, l }
    const testRgb = oklchToRgb(testOklch)
    const ratio = calculateContrastRatio(testRgb, againstColor)

    if (ratio >= targetRatio && Math.abs(ratio - targetRatio) < closestToTarget) {
      closestToTarget = Math.abs(ratio - targetRatio)
      bestColor = testRgb
      bestRatio = ratio
    }
  }

  // If nothing found, fall back to black or white
  if (bestRatio < targetRatio) {
    const blackRatio = calculateContrastRatio({ r: 0, g: 0, b: 0 }, againstColor)
    const whiteRatio = calculateContrastRatio({ r: 255, g: 255, b: 255 }, againstColor)
    return blackRatio > whiteRatio ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }
  }

  return bestColor
}

/**
 * Generate a palette of accessible color variations
 */
export function generateAccessiblePalette(
  baseColor: RGB,
  backgroundColor: RGB,
  count: number = 5
): ColorSuggestion[] {
  const palette: ColorSuggestion[] = []
  const baseOklch = rgbToOklch(baseColor)

  // Generate variations by adjusting lightness
  for (let i = 0; i < count; i++) {
    const l = 0.2 + (i / (count - 1)) * 0.6 // Range from 0.2 to 0.8
    const oklch: OKLCH = { ...baseOklch, l }
    const rgb = oklchToRgb(oklch)
    const ratio = calculateContrastRatio(rgb, backgroundColor)

    palette.push({
      color: rgb,
      hex: rgbToHex(rgb),
      contrastRatio: ratio,
      ratioString: `${ratio.toFixed(2)}:1`,
      adjustment: l > baseOklch.l ? 'lighter' : l < baseOklch.l ? 'darker' : 'original',
      percentChange: Math.abs(l - baseOklch.l) * 100,
    })
  }

  return palette
}

