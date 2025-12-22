/**
 * Color Utilities - Conversions between HEX, RGB, HSL, and OKLCH color spaces
 */

export interface RGB {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
}

export interface HSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

export interface OKLCH {
  l: number // 0-1 (lightness)
  c: number // 0-0.4 (chroma)
  h: number // 0-360 (hue)
}

export interface RGBA extends RGB {
  a: number // 0-1
}

/**
 * Parse any color string to RGB
 * Handles: hex, rgb, rgba, hsl, hsla, color(srgb), oklch, named colors
 */
export function parseColor(color: string): RGB | null {
  // Remove whitespace
  color = color.trim()

  // Try HEX
  const hex = parseHex(color)
  if (hex) return hex

  // Try RGB/RGBA
  const rgb = parseRgbString(color)
  if (rgb) return rgb

  // Try HSL/HSLA
  const hsl = parseHslString(color)
  if (hsl) return hslToRgb(hsl)

  // Try color(srgb ...) function - Chrome uses this for some computed styles
  const srgb = parseSrgbColor(color)
  if (srgb) return srgb

  // Try oklch() - modern perceptual color space
  const oklch = parseOklchString(color)
  if (oklch) return oklchToRgb(oklch)

  // Try named colors
  const named = parseNamedColor(color)
  if (named) return named

  return null
}

/**
 * Parse color(srgb r g b) or color(srgb r g b / a) format
 * Values are 0-1 range, need to convert to 0-255
 */
function parseSrgbColor(str: string): RGB | null {
  const match = str.match(/color\s*\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+%?)?\s*\)/)
  if (!match) return null

  return {
    r: Math.min(255, Math.max(0, Math.round(parseFloat(match[1]) * 255))),
    g: Math.min(255, Math.max(0, Math.round(parseFloat(match[2]) * 255))),
    b: Math.min(255, Math.max(0, Math.round(parseFloat(match[3]) * 255))),
  }
}

/**
 * Parse oklch(l c h) or oklch(l c h / a) format
 */
function parseOklchString(str: string): OKLCH | null {
  const match = str.match(/oklch\s*\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*[\d.]+%?)?\s*\)/)
  if (!match) return null

  // L is typically 0-100% or 0-1, C is 0-0.4 typically, H is 0-360
  let l = parseFloat(match[1])
  // If L > 1, assume it's a percentage
  if (l > 1) l = l / 100
  
  return {
    l: Math.min(1, Math.max(0, l)),
    c: Math.min(0.4, Math.max(0, parseFloat(match[2]))),
    h: parseFloat(match[3]) % 360,
  }
}

/**
 * Parse HEX color to RGB
 */
export function parseHex(hex: string): RGB | null {
  // Remove # if present
  hex = hex.replace(/^#/, '')

  // Handle shorthand (#RGB -> #RRGGBB)
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }

  // Handle 4-char shorthand with alpha (#RGBA)
  if (hex.length === 4) {
    hex = hex.split('').map(c => c + c).join('')
  }

  // 8-char hex (with alpha) - ignore alpha for contrast calc
  if (hex.length === 8) {
    hex = hex.slice(0, 6)
  }

  if (hex.length !== 6) return null

  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null

  return { r, g, b }
}

/**
 * Parse RGB/RGBA string - handles both legacy and modern CSS syntax
 * Legacy: rgb(255, 128, 0) or rgba(255, 128, 0, 0.5)
 * Modern: rgb(255 128 0) or rgb(255 128 0 / 0.5)
 */
export function parseRgbString(str: string): RGB | null {
  // Try legacy comma-separated format first
  const legacyMatch = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/)
  if (legacyMatch) {
    return {
      r: Math.min(255, Math.max(0, parseInt(legacyMatch[1]))),
      g: Math.min(255, Math.max(0, parseInt(legacyMatch[2]))),
      b: Math.min(255, Math.max(0, parseInt(legacyMatch[3]))),
    }
  }

  // Try modern space-separated format: rgb(255 128 0) or rgb(255 128 0 / 0.5)
  const modernMatch = str.match(/rgba?\s*\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+%?)?\s*\)/)
  if (modernMatch) {
    return {
      r: Math.min(255, Math.max(0, Math.round(parseFloat(modernMatch[1])))),
      g: Math.min(255, Math.max(0, Math.round(parseFloat(modernMatch[2])))),
      b: Math.min(255, Math.max(0, Math.round(parseFloat(modernMatch[3])))),
    }
  }

  return null
}

/**
 * Parse HSL/HSLA string - handles both legacy and modern CSS syntax
 * Legacy: hsl(180, 50%, 50%) or hsla(180, 50%, 50%, 0.5)
 * Modern: hsl(180 50% 50%) or hsl(180 50% 50% / 0.5)
 */
export function parseHslString(str: string): HSL | null {
  // Try legacy comma-separated format first
  const legacyMatch = str.match(/hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*[\d.]+)?\s*\)/)
  if (legacyMatch) {
    return {
      h: parseFloat(legacyMatch[1]) % 360,
      s: Math.min(100, Math.max(0, parseFloat(legacyMatch[2]))),
      l: Math.min(100, Math.max(0, parseFloat(legacyMatch[3]))),
    }
  }

  // Try modern space-separated format: hsl(180 50% 50%) or hsl(180 50% 50% / 0.5)
  const modernMatch = str.match(/hsla?\s*\(\s*([\d.]+)(?:deg)?\s+([\d.]+)%?\s+([\d.]+)%?(?:\s*\/\s*[\d.]+%?)?\s*\)/)
  if (modernMatch) {
    return {
      h: parseFloat(modernMatch[1]) % 360,
      s: Math.min(100, Math.max(0, parseFloat(modernMatch[2]))),
      l: Math.min(100, Math.max(0, parseFloat(modernMatch[3]))),
    }
  }

  return null
}

/**
 * Common named colors
 */
const NAMED_COLORS: Record<string, RGB> = {
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 128, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  yellow: { r: 255, g: 255, b: 0 },
  cyan: { r: 0, g: 255, b: 255 },
  magenta: { r: 255, g: 0, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  orange: { r: 255, g: 165, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
  pink: { r: 255, g: 192, b: 203 },
  brown: { r: 165, g: 42, b: 42 },
  navy: { r: 0, g: 0, b: 128 },
  teal: { r: 0, g: 128, b: 128 },
  olive: { r: 128, g: 128, b: 0 },
  maroon: { r: 128, g: 0, b: 0 },
  lime: { r: 0, g: 255, b: 0 },
  aqua: { r: 0, g: 255, b: 255 },
  fuchsia: { r: 255, g: 0, b: 255 },
  silver: { r: 192, g: 192, b: 192 },
  transparent: { r: 0, g: 0, b: 0 }, // Note: transparency handled separately
}

export function parseNamedColor(name: string): RGB | null {
  return NAMED_COLORS[name.toLowerCase()] || null
}

/**
 * Convert RGB to HEX string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    case b:
      h = ((r - g) / d + 4) / 6
      break
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  }
}

/**
 * Convert RGB to OKLCH (for perceptual color adjustments)
 */
export function rgbToOklch(rgb: RGB): OKLCH {
  // First convert to linear RGB
  const toLinear = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  const lr = toLinear(rgb.r)
  const lg = toLinear(rgb.g)
  const lb = toLinear(rgb.b)

  // Convert to OKLab
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  const l = Math.cbrt(l_)
  const m = Math.cbrt(m_)
  const s = Math.cbrt(s_)

  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s

  // Convert to OKLCH
  const C = Math.sqrt(a * a + b * b)
  let H = Math.atan2(b, a) * 180 / Math.PI
  if (H < 0) H += 360

  return { l: L, c: C, h: H }
}

/**
 * Convert OKLCH to RGB
 */
export function oklchToRgb(oklch: OKLCH): RGB {
  const { l: L, c: C, h: H } = oklch

  // Convert to OKLab
  const a = C * Math.cos(H * Math.PI / 180)
  const b = C * Math.sin(H * Math.PI / 180)

  const l = L + 0.3963377774 * a + 0.2158037573 * b
  const m = L - 0.1055613458 * a - 0.0638541728 * b
  const s = L - 0.0894841775 * a - 1.2914855480 * b

  const l_ = l * l * l
  const m_ = m * m * m
  const s_ = s * s * s

  // Convert to linear RGB
  const lr = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
  const lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
  const lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_

  // Convert to sRGB
  const toSrgb = (c: number) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    return Math.round(Math.max(0, Math.min(255, v * 255)))
  }

  return {
    r: toSrgb(lr),
    g: toSrgb(lg),
    b: toSrgb(lb),
  }
}

/**
 * Format color for display
 */
export function formatRgb(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

export function formatHsl(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}

export function formatOklch(oklch: OKLCH): string {
  return `oklch(${(oklch.l * 100).toFixed(1)}% ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)})`
}

/**
 * Check if a color is light or dark
 */
export function isLightColor(rgb: RGB): boolean {
  // Using relative luminance
  const luminance = getRelativeLuminance(rgb)
  return luminance > 0.179
}

/**
 * Get relative luminance (WCAG formula)
 */
export function getRelativeLuminance(rgb: RGB): number {
  const toLinear = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  const r = toLinear(rgb.r)
  const g = toLinear(rgb.g)
  const b = toLinear(rgb.b)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Blend two colors with alpha
 */
export function blendColors(foreground: RGB, background: RGB, alpha: number): RGB {
  return {
    r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
    g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
    b: Math.round(foreground.b * alpha + background.b * (1 - alpha)),
  }
}

/**
 * Generate a random accessible color pair
 */
export function generateRandomAccessiblePair(): { foreground: RGB; background: RGB } {
  const background: RGB = {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }

  // Choose contrasting foreground
  const isLight = isLightColor(background)
  const foreground: RGB = isLight
    ? { r: 0, g: 0, b: 0 }
    : { r: 255, g: 255, b: 255 }

  return { foreground, background }
}

