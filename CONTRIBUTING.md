# Contributing to TheWCAG Color Contrast Checker

Thank you for your interest in contributing to TheWCAG Color Contrast Checker! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style](#code-style)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/TheWCAG-Extension.git
   cd TheWCAG-Extension
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/thewcag/TheWCAG-Extension.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 9+
- Chrome browser (for testing)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development mode:
   ```bash
   npm run dev
   ```

3. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Available Scripts

```bash
npm run dev          # Start development server with HMR
npm run build        # Build for production
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting errors
npm run typecheck    # Run TypeScript type checking
```

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-color-blindness-simulation`
- `fix/eyedropper-not-working-on-iframes`
- `docs/update-api-reference`
- `refactor/simplify-contrast-calculation`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(eyedropper): add support for iframe color picking
fix(contrast): correct luminance calculation for sRGB
docs(readme): add API reference section
```

## Submitting a Pull Request

1. **Update your fork**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit them

4. **Run all checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm run test:run
   npm run build
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

### PR Requirements

- [ ] All tests pass
- [ ] No linting errors
- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] Changes are documented (if applicable)
- [ ] PR description explains the changes

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use explicit return types for functions
- Avoid `any` type - use proper typing

```typescript
// ✅ Good
function calculateRatio(fg: RGB, bg: RGB): number {
  const l1 = getRelativeLuminance(fg)
  const l2 = getRelativeLuminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// ❌ Bad
function calculateRatio(fg: any, bg: any) {
  let l1 = getRelativeLuminance(fg)
  let l2 = getRelativeLuminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
```

### React Components

- Use functional components with hooks
- Use descriptive prop names
- Extract complex logic into custom hooks

```typescript
// ✅ Good
interface ColorInputProps {
  label: string
  value: string
  onChange: (color: string) => void
  onEyedropper: () => void
}

export function ColorInput({ label, value, onChange, onEyedropper }: ColorInputProps) {
  // ...
}
```

### File Organization

```
src/
├── popup/components/     # React components for popup
├── devtools/components/  # DevTools panel components
├── lib/                  # Shared utilities
├── content/              # Content scripts
└── background/           # Service worker
```

## Testing

### Running Tests

```bash
npm run test         # Watch mode
npm run test:run     # Single run
npm run test:coverage # With coverage report
```

### Writing Tests

- Place tests in `__tests__` folders or use `.test.ts` suffix
- Test edge cases and error conditions
- Use descriptive test names

```typescript
describe('calculateContrastRatio', () => {
  it('should return 21:1 for black on white', () => {
    const black = { r: 0, g: 0, b: 0 }
    const white = { r: 255, g: 255, b: 255 }
    expect(calculateContrastRatio(black, white)).toBeCloseTo(21, 1)
  })

  it('should return 1:1 for same colors', () => {
    const color = { r: 128, g: 128, b: 128 }
    expect(calculateContrastRatio(color, color)).toBe(1)
  })
})
```

## Reporting Issues

### Bug Reports

Include:
- Browser version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Console errors (if any)

### Feature Requests

Include:
- Clear description of the feature
- Use case / problem it solves
- Possible implementation approach
- Mockups (if applicable)

## Questions?

- Open a [GitHub Discussion](https://github.com/thewcag/TheWCAG-Extension/discussions)
- Check existing [Issues](https://github.com/thewcag/TheWCAG-Extension/issues)

---

Thank you for contributing to make the web more accessible! 🎨

