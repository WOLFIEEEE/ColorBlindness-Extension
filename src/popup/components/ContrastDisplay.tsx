import { ContrastResult, getScoreLabel, WCAG_THRESHOLDS } from '@/lib/contrast'

interface ContrastDisplayProps {
  result: ContrastResult
  foregroundHex: string
  backgroundHex: string
  targetLevel: 'AA' | 'AAA'
  textSize: 'normal' | 'large'
}

export function ContrastDisplay({
  result,
  foregroundHex,
  backgroundHex,
  targetLevel,
  textSize,
}: ContrastDisplayProps) {
  const getScoreStyles = (score: ContrastResult['score']) => {
    switch (score) {
      case 'aaa':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'aa':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'aa-large':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'fail':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    }
  }

  const getRequiredRatio = () => {
    if (targetLevel === 'AAA') {
      return textSize === 'large' ? WCAG_THRESHOLDS.AAA_LARGE : WCAG_THRESHOLDS.AAA_NORMAL
    }
    return textSize === 'large' ? WCAG_THRESHOLDS.AA_LARGE : WCAG_THRESHOLDS.AA_NORMAL
  }

  const requiredRatio = getRequiredRatio()
  const meetsTarget = result.ratio >= requiredRatio

  return (
    <div className="card space-y-4">
      {/* Preview */}
      <div
        className="rounded-lg p-4 text-center border border-border dark:border-warm-brown/30"
        style={{ backgroundColor: backgroundHex }}
      >
        <p
          className="text-2xl font-bold"
          style={{ color: foregroundHex }}
        >
          Sample Text
        </p>
        <p
          className="text-sm mt-1"
          style={{ color: foregroundHex }}
        >
          The quick brown fox jumps over the lazy dog
        </p>
      </div>

      {/* Contrast Ratio */}
      <div className="text-center">
        <div className="contrast-ratio-large text-dark dark:text-cream">
          {result.ratioString}
        </div>
        <p className="text-sm text-warm-brown dark:text-cream/60 mt-1">
          Contrast Ratio
        </p>
      </div>

      {/* Score Badge */}
      <div className={`rounded-lg p-3 border ${getScoreStyles(result.score)}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{getScoreLabel(result.score)}</span>
          {meetsTarget ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-xs mt-1 opacity-80">
          {meetsTarget 
            ? `Meets ${targetLevel} requirements for ${textSize} text`
            : `Requires ${requiredRatio}:1 for ${targetLevel} ${textSize} text`
          }
        </p>
      </div>

      {/* Human-readable explanation when contrast fails */}
      {!meetsTarget && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-amber-800 dark:text-amber-300">
              <p className="font-medium mb-1">Why does this matter?</p>
              <p className="opacity-80">
                {result.ratio < 3 
                  ? "This color combination may be very difficult to read for users with low vision or color blindness. Consider making the text color darker or the background lighter."
                  : result.ratio < 4.5
                    ? "This contrast works for large text (18pt+) but may be hard to read at smaller sizes. For body text, try making the colors more distinct."
                    : "This meets basic requirements but won't achieve the highest accessibility standard. For critical content, consider increasing contrast."
                }
              </p>
              <p className="mt-2 opacity-80">
                <strong>Current:</strong> {result.ratio.toFixed(2)}:1 → <strong>Need:</strong> {requiredRatio}:1 
                <span className="ml-1">(missing {(requiredRatio - result.ratio).toFixed(2)} points)</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WCAG Compliance Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <ComplianceItem
          label="AA Normal"
          passed={result.aa.normalText}
          ratio={WCAG_THRESHOLDS.AA_NORMAL}
        />
        <ComplianceItem
          label="AA Large"
          passed={result.aa.largeText}
          ratio={WCAG_THRESHOLDS.AA_LARGE}
        />
        <ComplianceItem
          label="AAA Normal"
          passed={result.aaa.normalText}
          ratio={WCAG_THRESHOLDS.AAA_NORMAL}
        />
        <ComplianceItem
          label="AAA Large"
          passed={result.aaa.largeText}
          ratio={WCAG_THRESHOLDS.AAA_LARGE}
        />
      </div>
    </div>
  )
}

interface ComplianceItemProps {
  label: string
  passed: boolean
  ratio: number
}

function ComplianceItem({ label, passed, ratio }: ComplianceItemProps) {
  return (
    <div className={`
      flex items-center justify-between p-2 rounded
      ${passed 
        ? 'bg-green-50 dark:bg-green-900/10' 
        : 'bg-red-50 dark:bg-red-900/10'
      }
    `}>
      <span className="text-dark dark:text-cream">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-warm-brown dark:text-cream/60">{ratio}:1</span>
        {passed ? (
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  )
}

