# Privacy Policy for TheWCAG Color Contrast Checker

**Last Updated:** December 22, 2024

## Overview

TheWCAG Color Contrast Checker ("the Extension") is committed to protecting your privacy. This privacy policy explains how the Extension handles your data.

## Data Collection

### What We Collect

The Extension collects and stores the following data **locally on your device only**:

1. **Color History**: The colors you check for contrast are saved to help you reuse them later
2. **User Preferences**: Your settings such as dark mode preference, default WCAG level, and text size
3. **Pending Eyedropper State**: Temporary storage of colors picked using the eyedropper tool

### What We Do NOT Collect

- **No Personal Information**: We do not collect names, emails, addresses, or any personally identifiable information
- **No Analytics**: We do not track your usage patterns or behavior
- **No Third-Party Data Sharing**: We do not share any data with third parties
- **No Remote Servers**: All data stays on your device; we do not send data to any external servers
- **No Browsing History**: We do not access or store your browsing history
- **No Cookies**: We do not use cookies or tracking technologies

## Data Storage

All data is stored using Chrome's `storage.local` API, which means:

- Data is stored locally on your computer
- Data is encrypted by Chrome
- Data is never transmitted over the network
- Data can be cleared at any time by you through the extension's Settings panel

## Permissions Explained

The Extension requests the following permissions:

| Permission | Why We Need It |
|------------|----------------|
| `activeTab` | To analyze colors on the current webpage when you use the eyedropper or page scanner |
| `storage` | To save your color history and preferences locally on your device |
| `scripting` | To inject the color picker and scanner tools into webpages |
| `host_permissions: <all_urls>` | To allow the eyedropper and scanner to work on any website you visit |

### Why "All URLs" Permission?

The `<all_urls>` host permission is required because:

1. **Eyedropper Tool**: Needs to capture colors from any webpage you're viewing
2. **Page Scanner**: Needs to analyze text/background combinations on any webpage
3. **Content Script**: Needs to run on any webpage to provide these features

**Important**: Even with this permission, the Extension:
- Only activates when YOU click the eyedropper or scan button
- Does not automatically read or store any webpage content
- Does not track which websites you visit

## Data Retention

- **Color History**: Retained until you clear it manually in Settings
- **Preferences**: Retained until you reset them or uninstall the extension
- **Temporary Data**: Eyedropper state is cleared after use

## Your Rights

You have full control over your data:

1. **View Data**: See your saved colors and preferences in the extension
2. **Export Data**: Export all data as JSON through Settings
3. **Delete Data**: Clear all history through Settings
4. **Uninstall**: Removing the extension deletes all associated data

## Security

- All data is stored locally using Chrome's secure storage APIs
- No data is transmitted to external servers
- The extension does not have access to sensitive browser data like passwords or payment information

## Children's Privacy

This Extension does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date above. Continued use of the Extension after changes constitutes acceptance of the updated policy.

## Contact

If you have questions about this privacy policy or the Extension, please:

- Visit: [https://thewcag.com](https://thewcag.com)
- GitHub Issues: [https://github.com/thewcag/TheWCAG-Extension/issues](https://github.com/thewcag/TheWCAG-Extension/issues)

---

**Summary**: TheWCAG Color Contrast Checker stores all data locally on your device, does not collect personal information, does not use analytics or tracking, and does not share any data with third parties.

