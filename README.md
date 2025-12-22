# TheWCAG Color Contrast Checker

A production-grade Chrome extension for checking color contrast ratios against WCAG 2.2 AA/AAA standards. Features eyedropper tool, auto-suggestions, full page scanning, and comprehensive settings.

![TheWCAG Logo](public/icons/icon-128.png)

## Features

### Core Functionality

- **Manual Color Input**: Enter colors in HEX, RGB, HSL, or named colors (e.g., "red", "navy")
- **Native Color Picker**: Click on the color swatch to open the system color picker
- **Eyedropper Tool**: Pick colors directly from any webpage using Chrome's native EyeDropper API (Chrome 95+)
- **Auto Suggestions**: Get accessible color alternatives using OKLCH color space for perceptually uniform adjustments
- **Instant Contrast Results**: Real-time contrast ratio calculation with WCAG compliance indicators

### Page Analysis

- **Full Page Scanner**: Analyze all text/background combinations on any page
- **Scroll to Element**: Click on scan results to scroll and highlight the element on the page
- **Export Results**: Export scan results as JSON or CSV for reporting
- **Filter Results**: Filter by failures, warnings, or passes

### User Experience

- **Color History**: Automatically saves checked color combinations
- **Copy to Clipboard**: Click on any color swatch to copy the hex value
- **Toast Notifications**: Visual feedback for actions like copy, save, and errors
- **Dark Mode**: Full dark mode support with system preference detection
- **Keyboard Shortcuts**: Quick access to common actions

### Settings & Customization

- **Default WCAG Level**: Set preferred compliance level (AA or AAA)
- **Default Text Size**: Configure for normal or large text
- **History Management**: Set max history items, clear history
- **Data Export/Import**: Backup and restore all settings and history
- **Notifications Toggle**: Enable/disable toast notifications

### Developer Tools

- **DevTools Panel**: Integrated panel in Chrome DevTools (F12 > WCAG Contrast tab)
- **Context Menu**: Right-click options for quick element checking
- **Error Handling**: Graceful handling of restricted pages with clear error messages

## Installation

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/thewcag/extension.git
   cd TheWCAG-Extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder

### From Chrome Web Store

Coming soon!

## Usage

### Popup Panel

Click the extension icon in your toolbar to open the popup panel:

1. **Checker Tab**: Enter or pick foreground/background colors
   - Use the color swatch to open native picker
   - Use the eyedropper icon to pick from the page
   - See instant contrast ratio and WCAG compliance
   - Apply suggested color fixes with one click

2. **History Tab**: View and reuse previous color combinations
   - Click any history item to load those colors
   - Automatic duplicate detection

3. **Settings Tab**: Customize extension behavior
   - Toggle dark mode
   - Set default WCAG level and text size
   - Export/import data
   - Clear history

### Page Scanner

1. Click "Scan Page" button in the header
2. View results grouped by compliance level
3. Click any result to scroll to that element on the page
4. Export results as JSON or CSV for reports

### Eyedropper Tool

1. Click the eyedropper icon next to foreground or background color
2. The popup will close to allow page interaction
3. Click anywhere on the page to pick a color
4. Reopen the popup to see the picked color applied
5. A badge appears on the extension icon when a color is picked

### DevTools Panel

1. Open Chrome DevTools (`F12` or `Cmd+Option+I`)
2. Navigate to the "WCAG Contrast" tab
3. Full-featured interface with checker, scanner, and history

## WCAG Contrast Requirements

| Level | Normal Text | Large Text | UI Components |
|-------|-------------|------------|---------------|
| AA    | 4.5:1       | 3:1        | 3:1           |
| AAA   | 7:1         | 4.5:1      | N/A           |

**Large text** is defined as:
- 18pt (24px) or larger regular weight
- 14pt (18.67px) or larger if bold (700+)

## Tech Stack

- **Build**: Vite 5 + CRXJS (Chrome Extension Plugin)
- **UI**: React 18 + TypeScript (strict mode)
- **Styling**: Tailwind CSS 3
- **State**: React hooks + Chrome Storage API
- **Testing**: Vitest
- **Linting**: ESLint with TypeScript and React rules
- **Color Science**: OKLCH color space for perceptual adjustments

## Project Structure

```
TheWCAG-Extension/
├── src/
│   ├── popup/              # Extension popup UI
│   │   ├── components/
│   │   │   ├── PopupApp.tsx       # Main popup component
│   │   │   ├── ColorInput.tsx     # Color input with picker
│   │   │   ├── ContrastDisplay.tsx # Results display
│   │   │   ├── SuggestionsList.tsx # Color suggestions
│   │   │   ├── ColorHistory.tsx   # History view
│   │   │   ├── Settings.tsx       # Settings panel
│   │   │   ├── Header.tsx         # App header
│   │   │   ├── Tabs.tsx           # Tab navigation
│   │   │   ├── Toast.tsx          # Toast notifications
│   │   │   └── ErrorBoundary.tsx  # Error handling
│   │   ├── popup.tsx              # Entry point
│   │   └── index.html
│   ├── devtools/           # DevTools panel
│   │   ├── components/
│   │   │   └── DevToolsPanel.tsx  # Full DevTools UI
│   │   ├── devtools.ts            # DevTools initialization
│   │   ├── panel.tsx              # Panel entry
│   │   └── *.html
│   ├── content/            # Content script
│   │   └── content.ts             # Eyedropper, scanner, highlight
│   ├── background/         # Service worker
│   │   └── service-worker.ts      # Message handling, storage
│   ├── lib/                # Core utilities
│   │   ├── color-utils.ts         # Color parsing & conversion
│   │   ├── contrast.ts            # WCAG calculations
│   │   ├── suggestions.ts         # Auto-suggest algorithm
│   │   ├── storage.ts             # Chrome storage wrapper
│   │   ├── content-script-helper.ts # Communication helpers
│   │   └── __tests__/             # Unit tests
│   │       ├── color-utils.test.ts
│   │       └── contrast.test.ts
│   └── styles/
│       ├── globals.css            # Tailwind + custom styles
│       └── content.css            # Injected page styles
├── public/icons/           # Extension icons (16, 32, 48, 128px)
├── dist/                   # Built extension (load this in Chrome)
├── manifest.json           # Chrome extension manifest v3
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── .eslintrc.cjs
```

## Scripts

```bash
# Development
npm run dev          # Start Vite dev server with HMR

# Build
npm run build        # TypeScript check + production build

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting errors
npm run typecheck    # TypeScript type checking
```

## Color Format Support

The extension accepts colors in multiple formats, including modern CSS Color Level 4 syntax:

| Format | Example |
|--------|---------|
| HEX (6-digit) | `#FF5500`, `FF5500` |
| HEX (3-digit) | `#F50`, `F50` |
| HEX (8-digit with alpha) | `#FF5500FF` |
| RGB (legacy) | `rgb(255, 85, 0)` |
| RGB (modern) | `rgb(255 85 0)`, `rgb(255 85 0 / 50%)` |
| RGBA | `rgba(255, 85, 0, 1)` |
| HSL (legacy) | `hsl(20, 100%, 50%)` |
| HSL (modern) | `hsl(20 100% 50%)`, `hsl(20deg 100% 50% / 0.5)` |
| HSLA | `hsla(20, 100%, 50%, 1)` |
| color(srgb) | `color(srgb 1 0.5 0)` |
| OKLCH | `oklch(0.7 0.15 180)`, `oklch(70% 0.15 180deg)` |
| LAB | `lab(50% 25 -20)` |
| LCH | `lch(50% 30 180)` |
| Named Colors | `red`, `navy`, `orange`, etc. |

### Page Scanner Features

The scanner properly handles:
- **Semi-transparent backgrounds**: Blends multiple layers using alpha compositing
- **CSS Variables**: Resolves computed values from custom properties
- **Modern color spaces**: Parses colors in newer CSS color formats

## Browser Compatibility

- **Chrome**: 95+ (required for EyeDropper API)
- **Edge**: 95+ (Chromium-based)
- **Brave**: 1.32+ (Chromium-based)

**Note**: The extension cannot access:
- Chrome internal pages (`chrome://`)
- Chrome Web Store
- Other extension pages
- Local files (unless enabled in extension settings)

## API Reference

### Color Utilities (`src/lib/color-utils.ts`)

```typescript
parseColor(color: string): RGB | null
rgbToHex(rgb: RGB): string
rgbToHsl(rgb: RGB): HSL
hslToRgb(hsl: HSL): RGB
rgbToOklch(rgb: RGB): OKLCH
oklchToRgb(oklch: OKLCH): RGB
getRelativeLuminance(rgb: RGB): number
isLightColor(rgb: RGB): boolean
```

### Contrast Calculations (`src/lib/contrast.ts`)

```typescript
calculateContrastRatio(fg: RGB, bg: RGB): number
analyzeContrast(fg: RGB, bg: RGB): ContrastResult
passesWcag(fg: RGB, bg: RGB, level: 'AA' | 'AAA', textSize: 'normal' | 'large'): boolean
getRequiredRatio(level: 'AA' | 'AAA', textSize: 'normal' | 'large'): number
```

### Storage (`src/lib/storage.ts`)

```typescript
getColorHistory(): Promise<ColorPair[]>
addToHistory(fg: RGB, bg: RGB, ratio: number): Promise<void>
getPreferences(): Promise<UserPreferences>
updatePreferences(updates: Partial<UserPreferences>): Promise<void>
exportData(): Promise<StorageData>
importData(data: Partial<StorageData>): Promise<void>
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test:run`
5. Run lint: `npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- TypeScript strict mode enabled
- ESLint with React and TypeScript rules
- Prettier formatting (recommended)
- Conventional commits preferred

## Testing

The extension includes comprehensive unit tests:

```bash
# Run all tests
npm run test:run

# Output:
# ✓ src/lib/__tests__/contrast.test.ts (25 tests)
# ✓ src/lib/__tests__/color-utils.test.ts (36 tests)
# Test Files: 2 passed
# Tests: 61 passed
```

Tests cover:
- Color parsing (HEX, RGB, HSL, named colors)
- Color space conversions (RGB ↔ HSL ↔ OKLCH)
- Contrast ratio calculations
- WCAG compliance checking
- Suggestion algorithm

## Privacy

This extension stores all data locally on your device. We do not collect, track, or share any personal information.

See our full [Privacy Policy](PRIVACY.md) for details.

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Links

- [TheWCAG.com](https://thewcag.com) - Full WCAG reference and tools
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [Understanding WCAG Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Report Issues](https://github.com/thewcag/extension/issues)

## Changelog

### v1.0.1

**Bug Fixes & Improvements:**

- **Scanner Alpha Blending**: Properly blends semi-transparent backgrounds using alpha compositing
- **Modern CSS Color Support**: Added parsing for `lab()`, `lch()`, `oklch()`, `color(srgb)` formats
- **Space-Separated CSS Syntax**: Support for modern `rgb(255 128 0)` and `hsl(180 50% 50%)` syntax
- **Text Extraction**: Improved detection of text in nested elements and complex DOM structures
- **Content Script Injection**: Fallback injection for pages opened before extension install
- **DevTools Panel**: Fixed panel loading and error handling on restricted pages
- **Color Persistence**: Colors now persist across popup reopens during eyedropper use
- **Scanner Accuracy**: Excludes extension UI elements from scan results
- **Float RGB Values**: Handle floating-point RGB values from computed styles
- **Improved Selectors**: Generate more readable CSS selectors for scan results
- **Error Messaging**: Clearer error messages for restricted pages (chrome://, Web Store)

**Test Coverage:**

- Added 15 new tests for modern color formats
- Total: 76 tests passing

### v1.0.0

- Initial release
- Manual color input with HEX, RGB, HSL support
- Native EyeDropper API integration
- OKLCH-based color suggestions
- Full page contrast scanner
- Color history with auto-save
- DevTools panel integration
- Dark mode support
- Settings panel with preferences
- Export/Import functionality
- Comprehensive test suite (61 tests)
- ESLint + TypeScript strict mode

---

Built with care for accessibility by [TheWCAG.com](https://thewcag.com)
