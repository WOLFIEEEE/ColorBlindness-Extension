
interface HeaderProps {
  onScanPage: () => void
}

export function Header({ onScanPage }: HeaderProps) {
  return (
    <header className="bg-beige dark:bg-warm-brown/20 border-b border-border dark:border-warm-brown/30 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-dark dark:text-cream leading-tight">
              <span className="font-light opacity-70">the</span>
              <span className="text-primary font-bold">WCAG</span>
            </h1>
            <p className="text-xs text-warm-brown dark:text-cream/60">Color Contrast Checker</p>
          </div>
        </div>
        
        <button
          onClick={onScanPage}
          className="btn-primary text-xs py-1.5 px-3"
          title="Scan current page for contrast issues"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Scan Page
        </button>
      </div>
    </header>
  )
}

