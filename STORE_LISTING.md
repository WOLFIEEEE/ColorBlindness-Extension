# Chrome Web Store Listing Details

Use this information when submitting to the Chrome Web Store.

---

## Extension Details

### Name
**TheWCAG Color Contrast Checker**

### Short Name (12 characters max)
**WCAG Contrast**

### Summary (132 characters max)
Check color contrast for WCAG 2.2 AA/AAA compliance. Eyedropper, suggestions, page scanner & history.

### Description (max 16,000 characters)

```
🎨 TheWCAG Color Contrast Checker - Your complete accessibility companion

Instantly check if your color combinations meet WCAG 2.2 accessibility standards. Whether you're designing websites, reviewing content, or ensuring compliance, this extension makes contrast checking fast and effortless.

✨ KEY FEATURES

🔍 EYEDROPPER TOOL
Pick any color directly from any webpage with a single click. Uses Chrome's native EyeDropper API for pixel-perfect color selection.

📊 INSTANT CONTRAST ANALYSIS
See your contrast ratio immediately with clear WCAG compliance indicators:
• Pass/Fail badges for AA and AAA levels
• Normal and large text requirements
• Real-time calculations as you type

💡 SMART COLOR SUGGESTIONS
Don't meet the requirements? Get instant color alternatives that do! Our suggestions use the OKLCH color space to preserve your color's character while adjusting only the lightness needed for compliance.

📱 FULL PAGE SCANNER
Analyze every text/background combination on any webpage at once. Quickly identify all contrast issues with a visual report showing:
• Total failures, warnings, and passes
• Click any result to jump to that element
• Export results as JSON or CSV for reports

📜 COLOR HISTORY
Never lose a color combination! Automatically saves your checked colors so you can quickly reuse them.

⚙️ CUSTOMIZABLE SETTINGS
• Dark mode support
• Set default WCAG level (AA or AAA)
• Configure for normal or large text
• Export/import your data
• Manage history size

🛠️ DEVELOPER TOOLS PANEL
Access the full contrast checker directly in Chrome DevTools (F12 > WCAG Contrast tab) for seamless integration into your workflow.

📋 MULTIPLE COLOR FORMATS
Enter colors in any format you prefer:
• HEX: #FF5500 or FF5500
• RGB: rgb(255, 85, 0)
• HSL: hsl(20, 100%, 50%)
• Named colors: red, navy, orange

📖 WCAG REQUIREMENTS REFERENCE

WCAG Level AA:
• Normal text: 4.5:1 minimum contrast
• Large text (18pt+ or 14pt bold): 3:1 minimum contrast

WCAG Level AAA:
• Normal text: 7:1 minimum contrast
• Large text: 4.5:1 minimum contrast

🔒 PRIVACY FOCUSED
• All data stored locally on your device
• No tracking or analytics
• No data sent to external servers
• Open source - review our code anytime

🌐 BROWSER SUPPORT
Works on Chrome 95+, Edge 95+, and other Chromium browsers.

Note: Cannot access Chrome Web Store or chrome:// pages (browser security restriction that applies to all extensions).

💻 OPEN SOURCE
This extension is completely open source. View, contribute, or fork the code:
https://github.com/thewcag/extension

📚 LEARN MORE
Visit https://thewcag.com for comprehensive WCAG guidelines and accessibility resources.

---

Perfect for:
• Web designers checking color accessibility
• Developers ensuring WCAG compliance
• Content creators reviewing readability
• Accessibility auditors scanning websites
• Anyone who wants better color contrast!

Download now and make the web more accessible, one color at a time!
```

---

## Category
**Developer Tools** (primary)
or **Accessibility** if available

---

## Language
**English (United States)**

---

## Required Assets

### Store Icon (128x128 PNG)
Location: `public/icons/icon-128.png`
✅ Already exists

### Screenshots (1280x800 or 640x400)
You need to create at least 1 screenshot (up to 5 recommended).

**Recommended screenshots:**

1. **Main Popup View** (1280x800)
   - Show the popup with colors entered
   - Display contrast ratio and compliance badges
   - Caption: "Instantly see contrast ratios with clear Pass/Fail indicators"

2. **Eyedropper in Action** (1280x800)
   - Show the eyedropper picking a color from a webpage
   - Caption: "Pick colors directly from any webpage with the eyedropper"

3. **Smart Suggestions** (1280x800)
   - Show the suggestions panel with accessible alternatives
   - Caption: "Get smart color suggestions that meet WCAG requirements"

4. **Page Scanner Results** (1280x800)
   - Show scan results overlay on a webpage
   - Caption: "Scan entire pages for contrast issues instantly"

5. **Settings Panel** (1280x800)
   - Show the settings with customization options
   - Caption: "Customize for your workflow with dark mode and preferences"

### Small Promotional Tile (440x280 PNG) - Optional
Recommended for featured placement.

### Large Promotional Tile (920x680 PNG) - Optional
For premium featured placement.

### Marquee Promotional Tile (1400x560 PNG) - Optional
For large featured placement.

---

## Privacy Practices (Required in Developer Dashboard)

### Single Purpose Description
```
This extension checks color contrast ratios against WCAG accessibility standards to help users ensure their designs meet accessibility requirements.
```

### Permission Justifications

| Permission | Justification |
|------------|---------------|
| `activeTab` | Required to analyze colors on the current webpage when the user activates the eyedropper or page scanner. Only accesses the page when the user explicitly clicks the extension. |
| `storage` | Required to save user preferences (like dark mode setting and default WCAG level) and color history locally on the device. No data is sent externally. |
| `scripting` | Required to inject the eyedropper tool and page scanner functionality into webpages when the user requests it. |
| `host_permissions (<all_urls>)` | Required for the eyedropper and page scanner to work on any website the user visits. The extension only activates on user action and does not automatically access any webpage data. |

### Data Usage Disclosure

**What data do you collect?**
- ☑️ User activity (Color combinations the user checks - stored locally only)
- ☑️ Website content (Colors on webpages - processed locally, never stored or transmitted)

**What data do you NOT collect?**
- ☐ Personally identifiable information
- ☐ Authentication information  
- ☐ Financial and payment information
- ☐ Health information
- ☐ Personal communications
- ☐ Location data
- ☐ Web history

**Certification:**
- ☑️ Data is not sold to third parties
- ☑️ Data is not used for purposes unrelated to the extension's functionality
- ☑️ Data is not used for creditworthiness or lending purposes

---

## Privacy Policy URL
Host your PRIVACY.md content at a public URL, such as:
- `https://thewcag.com/extension/privacy`
- `https://github.com/thewcag/extension/blob/main/PRIVACY.md`

---

## Support Information

### Support URL (Optional)
`https://github.com/thewcag/extension/issues`

### Homepage URL
`https://thewcag.com`

---

## Distribution

### Visibility
**Public** - Available to all users

### Countries
**All regions** (unless you have specific restrictions)

---

## Pre-Submission Checklist

Before submitting, verify:

- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] All features work correctly (eyedropper, scanner, history, settings)
- [ ] No console errors in popup or content scripts
- [ ] Icons display correctly at all sizes
- [ ] Description accurately represents functionality
- [ ] No misleading claims or keyword stuffing
- [ ] Privacy policy is accurate and accessible
- [ ] All permission justifications are complete
- [ ] Screenshots accurately show the extension
- [ ] Version number is correct (1.0.0)

---

## Build Instructions for Submission

1. Build the production version:
   ```bash
   npm run build
   ```

2. Create the ZIP file from the `dist` folder:
   ```bash
   cd dist
   zip -r ../thewcag-extension-v1.0.0.zip .
   ```

3. Upload `thewcag-extension-v1.0.0.zip` to Chrome Developer Dashboard

---

## Post-Submission

- Review typically takes 1-3 business days
- Complex permissions may extend review time
- Monitor email for feedback or rejection reasons
- If rejected, address issues and resubmit

