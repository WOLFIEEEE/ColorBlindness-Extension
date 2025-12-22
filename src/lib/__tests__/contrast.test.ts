import { describe, it, expect } from 'vitest'
import {
  calculateContrastRatio,
  formatContrastRatio,
  analyzeContrast,
  passesWcag,
  getRequiredRatio,
  getScoreLabel,
  getScoreColor,
  getContrastGap,
  isLargeText,
  getFullCompliance,
  WCAG_THRESHOLDS,
} from '../contrast'
import { RGB } from '../color-utils'

describe('calculateContrastRatio', () => {
  it('should calculate maximum contrast for black on white', () => {
    const black: RGB = { r: 0, g: 0, b: 0 }
    const white: RGB = { r: 255, g: 255, b: 255 }
    
    const ratio = calculateContrastRatio(black, white)
    expect(ratio).toBeCloseTo(21, 0) // 21:1 is max contrast
  })

  it('should calculate minimum contrast for same colors', () => {
    const gray: RGB = { r: 128, g: 128, b: 128 }
    
    const ratio = calculateContrastRatio(gray, gray)
    expect(ratio).toBeCloseTo(1, 2) // 1:1 is same color
  })

  it('should return same ratio regardless of order', () => {
    const dark: RGB = { r: 50, g: 50, b: 50 }
    const light: RGB = { r: 200, g: 200, b: 200 }
    
    const ratio1 = calculateContrastRatio(dark, light)
    const ratio2 = calculateContrastRatio(light, dark)
    
    expect(ratio1).toBeCloseTo(ratio2, 5)
  })

  it('should calculate known contrast ratios', () => {
    // Pure red on white: approximately 4:1
    const red: RGB = { r: 255, g: 0, b: 0 }
    const white: RGB = { r: 255, g: 255, b: 255 }
    
    const ratio = calculateContrastRatio(red, white)
    expect(ratio).toBeGreaterThan(3)
    expect(ratio).toBeLessThan(5)
  })
})

describe('formatContrastRatio', () => {
  it('should format ratio with 2 decimal places', () => {
    expect(formatContrastRatio(4.5)).toBe('4.50:1')
    expect(formatContrastRatio(21)).toBe('21.00:1')
    expect(formatContrastRatio(1.123456)).toBe('1.12:1')
  })
})

describe('analyzeContrast', () => {
  it('should return AAA score for high contrast', () => {
    const black: RGB = { r: 0, g: 0, b: 0 }
    const white: RGB = { r: 255, g: 255, b: 255 }
    
    const result = analyzeContrast(black, white)
    
    expect(result.score).toBe('aaa')
    expect(result.ratio).toBeGreaterThan(7)
    expect(result.aa.normalText).toBe(true)
    expect(result.aa.largeText).toBe(true)
    expect(result.aaa.normalText).toBe(true)
    expect(result.aaa.largeText).toBe(true)
  })

  it('should return AA score for medium contrast', () => {
    // A gray that passes AA but not AAA (ratio between 4.5 and 7)
    const darkGray: RGB = { r: 96, g: 96, b: 96 }
    const white: RGB = { r: 255, g: 255, b: 255 }
    
    const result = analyzeContrast(darkGray, white)
    
    expect(result.ratio).toBeGreaterThan(4.5)
    expect(result.ratio).toBeLessThan(7)
    expect(result.score).toBe('aa')
    expect(result.aa.normalText).toBe(true)
    expect(result.aaa.normalText).toBe(false)
  })

  it('should return aa-large score for large text only compliance', () => {
    // A gray that passes AA for large text only
    const mediumGray: RGB = { r: 119, g: 119, b: 119 }
    const white: RGB = { r: 255, g: 255, b: 255 }
    
    const result = analyzeContrast(mediumGray, white)
    
    expect(result.ratio).toBeGreaterThan(3)
    expect(result.ratio).toBeLessThan(4.5)
    expect(result.score).toBe('aa-large')
    expect(result.aa.largeText).toBe(true)
    expect(result.aa.normalText).toBe(false)
  })

  it('should return fail score for low contrast', () => {
    // Very low contrast
    const lightGray1: RGB = { r: 200, g: 200, b: 200 }
    const lightGray2: RGB = { r: 220, g: 220, b: 220 }
    
    const result = analyzeContrast(lightGray1, lightGray2)
    
    expect(result.ratio).toBeLessThan(3)
    expect(result.score).toBe('fail')
    expect(result.aa.largeText).toBe(false)
  })

  it('should include hex colors in result', () => {
    const fg: RGB = { r: 255, g: 0, b: 0 }
    const bg: RGB = { r: 255, g: 255, b: 255 }
    
    const result = analyzeContrast(fg, bg)
    
    expect(result.foreground).toBe('#FF0000')
    expect(result.background).toBe('#FFFFFF')
  })
})

describe('passesWcag', () => {
  const black: RGB = { r: 0, g: 0, b: 0 }
  const white: RGB = { r: 255, g: 255, b: 255 }
  const darkGray: RGB = { r: 96, g: 96, b: 96 } // ~5.9:1 - passes AA but not AAA
  const mediumGray: RGB = { r: 119, g: 119, b: 119 } // ~3.9:1 - passes AA large only

  it('should check AA normal text (4.5:1)', () => {
    expect(passesWcag(black, white, 'AA', 'normal')).toBe(true)
    expect(passesWcag(darkGray, white, 'AA', 'normal')).toBe(true)
    expect(passesWcag(mediumGray, white, 'AA', 'normal')).toBe(false)
  })

  it('should check AA large text (3:1)', () => {
    expect(passesWcag(mediumGray, white, 'AA', 'large')).toBe(true)
  })

  it('should check AAA normal text (7:1)', () => {
    expect(passesWcag(black, white, 'AAA', 'normal')).toBe(true)
    expect(passesWcag(darkGray, white, 'AAA', 'normal')).toBe(false)
  })

  it('should check AAA large text (4.5:1)', () => {
    expect(passesWcag(darkGray, white, 'AAA', 'large')).toBe(true)
    expect(passesWcag(mediumGray, white, 'AAA', 'large')).toBe(false)
  })
})

describe('getRequiredRatio', () => {
  it('should return correct thresholds for AA', () => {
    expect(getRequiredRatio('AA', 'normal')).toBe(WCAG_THRESHOLDS.AA_NORMAL)
    expect(getRequiredRatio('AA', 'large')).toBe(WCAG_THRESHOLDS.AA_LARGE)
  })

  it('should return correct thresholds for AAA', () => {
    expect(getRequiredRatio('AAA', 'normal')).toBe(WCAG_THRESHOLDS.AAA_NORMAL)
    expect(getRequiredRatio('AAA', 'large')).toBe(WCAG_THRESHOLDS.AAA_LARGE)
  })
})

describe('getScoreLabel', () => {
  it('should return correct labels', () => {
    expect(getScoreLabel('aaa')).toBe('AAA - Excellent')
    expect(getScoreLabel('aa')).toBe('AA - Good')
    expect(getScoreLabel('aa-large')).toBe('AA Large Text Only')
    expect(getScoreLabel('fail')).toBe('Fail - Insufficient Contrast')
  })
})

describe('getScoreColor', () => {
  it('should return colors for each score', () => {
    expect(getScoreColor('aaa')).toBe('#059669')
    expect(getScoreColor('aa')).toBe('#2563EB')
    expect(getScoreColor('aa-large')).toBe('#D97706')
    expect(getScoreColor('fail')).toBe('#DC2626')
  })
})

describe('getContrastGap', () => {
  it('should return 0 when ratio meets target', () => {
    expect(getContrastGap(5, 'AA', 'normal')).toBe(0) // 5 > 4.5
    expect(getContrastGap(4.5, 'AA', 'normal')).toBe(0) // exact match
  })

  it('should return gap when ratio is below target', () => {
    expect(getContrastGap(3, 'AA', 'normal')).toBeCloseTo(1.5, 2) // needs 4.5
    expect(getContrastGap(5, 'AAA', 'normal')).toBeCloseTo(2, 2) // needs 7
  })
})

describe('isLargeText', () => {
  it('should return true for text >= 18pt (24px) non-bold', () => {
    expect(isLargeText(24, false)).toBe(true)
    expect(isLargeText(30, false)).toBe(true)
    expect(isLargeText(23, false)).toBe(false)
  })

  it('should return true for text >= 14pt (18.67px) bold', () => {
    expect(isLargeText(18.67, true)).toBe(true)
    expect(isLargeText(20, true)).toBe(true)
    expect(isLargeText(18, true)).toBe(false)
  })
})

describe('getFullCompliance', () => {
  it('should return full compliance info', () => {
    const black: RGB = { r: 0, g: 0, b: 0 }
    const white: RGB = { r: 255, g: 255, b: 255 }
    
    const compliance = getFullCompliance(black, white)
    
    expect(compliance.ratio).toBeGreaterThan(20)
    expect(compliance.ratioString).toMatch(/^\d+\.\d+:1$/)
    expect(compliance.normalText.aa).toBe(true)
    expect(compliance.normalText.aaa).toBe(true)
    expect(compliance.largeText.aa).toBe(true)
    expect(compliance.largeText.aaa).toBe(true)
    expect(compliance.uiComponents.aa).toBe(true)
    expect(compliance.overallScore).toBe('aaa')
  })

  it('should correctly categorize overall score', () => {
    // Create pairs with known contrast ratios
    const tests = [
      { 
        fg: { r: 0, g: 0, b: 0 }, 
        bg: { r: 255, g: 255, b: 255 }, 
        expected: 'aaa' // 21:1
      },
      { 
        fg: { r: 96, g: 96, b: 96 }, 
        bg: { r: 255, g: 255, b: 255 }, 
        expected: 'aa' // ~5.9:1
      },
      { 
        fg: { r: 119, g: 119, b: 119 }, 
        bg: { r: 255, g: 255, b: 255 }, 
        expected: 'aa-large' // ~3.9:1
      },
      { 
        fg: { r: 200, g: 200, b: 200 }, 
        bg: { r: 220, g: 220, b: 220 }, 
        expected: 'fail' // ~1.3:1
      },
    ]

    tests.forEach(({ fg, bg, expected }) => {
      const compliance = getFullCompliance(fg, bg)
      expect(compliance.overallScore).toBe(expected)
    })
  })
})

describe('WCAG_THRESHOLDS', () => {
  it('should have correct values', () => {
    expect(WCAG_THRESHOLDS.AA_NORMAL).toBe(4.5)
    expect(WCAG_THRESHOLDS.AA_LARGE).toBe(3)
    expect(WCAG_THRESHOLDS.AA_UI).toBe(3)
    expect(WCAG_THRESHOLDS.AAA_NORMAL).toBe(7)
    expect(WCAG_THRESHOLDS.AAA_LARGE).toBe(4.5)
  })
})

