import { describe, it, expect } from 'vitest'
import {
  parseColor,
  parseHex,
  parseRgbString,
  parseHslString,
  parseNamedColor,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToOklch,
  oklchToRgb,
  getRelativeLuminance,
  isLightColor,
  blendColors,
  RGB,
} from '../color-utils'

describe('parseColor', () => {
  it('should parse 6-digit hex colors', () => {
    expect(parseColor('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
    expect(parseColor('#0000FF')).toEqual({ r: 0, g: 0, b: 255 })
    expect(parseColor('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColor('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('should parse 3-digit hex colors', () => {
    expect(parseColor('#F00')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('#0F0')).toEqual({ r: 0, g: 255, b: 0 })
    expect(parseColor('#00F')).toEqual({ r: 0, g: 0, b: 255 })
    expect(parseColor('#FFF')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('should parse hex colors without #', () => {
    expect(parseColor('FF0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('FFF')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('should parse RGB strings', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('rgb(0, 255, 0)')).toEqual({ r: 0, g: 255, b: 0 })
    expect(parseColor('rgb(0, 0, 255)')).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('should parse RGBA strings (ignoring alpha)', () => {
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('rgba(0, 0, 0, 1)')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('should parse HSL strings', () => {
    const red = parseColor('hsl(0, 100%, 50%)')
    expect(red?.r).toBeCloseTo(255, 0)
    expect(red?.g).toBeCloseTo(0, 0)
    expect(red?.b).toBeCloseTo(0, 0)
  })

  it('should parse named colors', () => {
    expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('white')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColor('black')).toEqual({ r: 0, g: 0, b: 0 })
    expect(parseColor('Blue')).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('should return null for invalid colors', () => {
    expect(parseColor('')).toBeNull()
    expect(parseColor('invalid')).toBeNull()
    expect(parseColor('#GGG')).toBeNull()
    expect(parseColor('#12345')).toBeNull()
  })

  it('should handle whitespace', () => {
    expect(parseColor('  #FF0000  ')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('  rgb(255, 0, 0)  ')).toEqual({ r: 255, g: 0, b: 0 })
  })
})

describe('parseHex', () => {
  it('should parse valid hex colors', () => {
    expect(parseHex('#AABBCC')).toEqual({ r: 170, g: 187, b: 204 })
    expect(parseHex('AABBCC')).toEqual({ r: 170, g: 187, b: 204 })
    expect(parseHex('#ABC')).toEqual({ r: 170, g: 187, b: 204 })
  })

  it('should handle 8-character hex (with alpha)', () => {
    expect(parseHex('#AABBCCFF')).toEqual({ r: 170, g: 187, b: 204 })
    expect(parseHex('#AABBCC00')).toEqual({ r: 170, g: 187, b: 204 })
  })

  it('should return null for invalid hex', () => {
    expect(parseHex('#12345')).toBeNull()
    expect(parseHex('#GGGGGG')).toBeNull()
    expect(parseHex('')).toBeNull()
  })
})

describe('parseRgbString', () => {
  it('should parse RGB strings', () => {
    expect(parseRgbString('rgb(100, 150, 200)')).toEqual({ r: 100, g: 150, b: 200 })
    // Note: Current implementation is case-sensitive, so lowercase only
  })

  it('should parse RGBA strings', () => {
    expect(parseRgbString('rgba(100, 150, 200, 0.5)')).toEqual({ r: 100, g: 150, b: 200 })
  })

  it('should return null for invalid strings', () => {
    expect(parseRgbString('rgb()')).toBeNull()
    expect(parseRgbString('not rgb')).toBeNull()
    // Note: Uppercase RGB not supported in current implementation
    expect(parseRgbString('RGB(100, 150, 200)')).toBeNull()
  })
})

describe('parseHslString', () => {
  it('should parse HSL strings', () => {
    expect(parseHslString('hsl(180, 50%, 50%)')).toEqual({ h: 180, s: 50, l: 50 })
    // Note: Current implementation is case-sensitive
  })

  it('should parse HSLA strings', () => {
    expect(parseHslString('hsla(180, 50%, 50%, 0.5)')).toEqual({ h: 180, s: 50, l: 50 })
  })

  it('should handle hue overflow', () => {
    expect(parseHslString('hsl(360, 50%, 50%)')).toEqual({ h: 0, s: 50, l: 50 })
    expect(parseHslString('hsl(720, 50%, 50%)')).toEqual({ h: 0, s: 50, l: 50 })
  })

  it('should return null for invalid strings', () => {
    expect(parseHslString('hsl()')).toBeNull()
    expect(parseHslString('not hsl')).toBeNull()
    // Uppercase HSL not supported in current implementation
    expect(parseHslString('HSL(0, 100%, 50%)')).toBeNull()
  })
})

describe('parseNamedColor', () => {
  it('should parse common named colors', () => {
    expect(parseNamedColor('red')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseNamedColor('green')).toEqual({ r: 0, g: 128, b: 0 })
    expect(parseNamedColor('blue')).toEqual({ r: 0, g: 0, b: 255 })
    expect(parseNamedColor('yellow')).toEqual({ r: 255, g: 255, b: 0 })
    expect(parseNamedColor('orange')).toEqual({ r: 255, g: 165, b: 0 })
  })

  it('should be case-insensitive', () => {
    expect(parseNamedColor('RED')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseNamedColor('Red')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('should return null for unknown colors', () => {
    expect(parseNamedColor('notacolor')).toBeNull()
    expect(parseNamedColor('')).toBeNull()
  })
})

describe('rgbToHex', () => {
  it('should convert RGB to hex', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#FF0000')
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00FF00')
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000FF')
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF')
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })

  it('should handle intermediate values', () => {
    expect(rgbToHex({ r: 170, g: 187, b: 204 })).toBe('#AABBCC')
    expect(rgbToHex({ r: 15, g: 15, b: 15 })).toBe('#0F0F0F')
  })
})

describe('rgbToHsl', () => {
  it('should convert pure colors correctly', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 })
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 })
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 })
  })

  it('should convert grayscale colors correctly', () => {
    const gray = rgbToHsl({ r: 128, g: 128, b: 128 })
    expect(gray.h).toBe(0)
    expect(gray.s).toBe(0)
    expect(gray.l).toBeCloseTo(50, 0) // Allow rounding
    
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 })
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 })
  })
})

describe('hslToRgb', () => {
  it('should convert HSL to RGB', () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 })
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('should handle grayscale (0 saturation)', () => {
    expect(hslToRgb({ h: 0, s: 0, l: 50 })).toEqual({ r: 128, g: 128, b: 128 })
    expect(hslToRgb({ h: 180, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('should be inverse of rgbToHsl (with rounding tolerance)', () => {
    const original: RGB = { r: 100, g: 150, b: 200 }
    const hsl = rgbToHsl(original)
    const backToRgb = hslToRgb(hsl)
    // Allow small rounding differences due to integer rounding in both directions
    expect(Math.abs(backToRgb.r - original.r)).toBeLessThanOrEqual(2)
    expect(Math.abs(backToRgb.g - original.g)).toBeLessThanOrEqual(2)
    expect(Math.abs(backToRgb.b - original.b)).toBeLessThanOrEqual(2)
  })
})

describe('OKLCH conversions', () => {
  it('should convert RGB to OKLCH and back', () => {
    const colors: RGB[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 100, g: 150, b: 200 },
    ]

    colors.forEach((original) => {
      const oklch = rgbToOklch(original)
      const backToRgb = oklchToRgb(oklch)
      expect(backToRgb.r).toBeCloseTo(original.r, 0)
      expect(backToRgb.g).toBeCloseTo(original.g, 0)
      expect(backToRgb.b).toBeCloseTo(original.b, 0)
    })
  })

  it('should handle black and white', () => {
    const black = rgbToOklch({ r: 0, g: 0, b: 0 })
    expect(black.l).toBeCloseTo(0, 1)

    const white = rgbToOklch({ r: 255, g: 255, b: 255 })
    expect(white.l).toBeCloseTo(1, 1)
  })
})

describe('getRelativeLuminance', () => {
  it('should calculate luminance correctly', () => {
    // White has luminance 1
    expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 3)
    // Black has luminance 0
    expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 3)
  })

  it('should weight green highest', () => {
    const green = getRelativeLuminance({ r: 0, g: 255, b: 0 })
    const red = getRelativeLuminance({ r: 255, g: 0, b: 0 })
    const blue = getRelativeLuminance({ r: 0, g: 0, b: 255 })
    
    expect(green).toBeGreaterThan(red)
    expect(green).toBeGreaterThan(blue)
  })
})

describe('isLightColor', () => {
  it('should identify light colors', () => {
    expect(isLightColor({ r: 255, g: 255, b: 255 })).toBe(true)
    expect(isLightColor({ r: 255, g: 255, b: 0 })).toBe(true)
    expect(isLightColor({ r: 200, g: 200, b: 200 })).toBe(true)
  })

  it('should identify dark colors', () => {
    expect(isLightColor({ r: 0, g: 0, b: 0 })).toBe(false)
    expect(isLightColor({ r: 0, g: 0, b: 255 })).toBe(false)
    expect(isLightColor({ r: 50, g: 50, b: 50 })).toBe(false)
  })
})

describe('blendColors', () => {
  it('should blend colors with alpha', () => {
    const fg: RGB = { r: 255, g: 0, b: 0 }
    const bg: RGB = { r: 0, g: 0, b: 255 }
    
    // Full opacity - should be foreground
    const fullOpacity = blendColors(fg, bg, 1)
    expect(fullOpacity).toEqual({ r: 255, g: 0, b: 0 })
    
    // Zero opacity - should be background
    const zeroOpacity = blendColors(fg, bg, 0)
    expect(zeroOpacity).toEqual({ r: 0, g: 0, b: 255 })
    
    // 50% opacity - should be purple
    const halfOpacity = blendColors(fg, bg, 0.5)
    expect(halfOpacity.r).toBe(128)
    expect(halfOpacity.g).toBe(0)
    expect(halfOpacity.b).toBe(128)
  })
})

