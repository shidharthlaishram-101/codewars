# Contest Disclaimer Feature

## Overview
A mandatory disclaimer modal appears when users access the contest page. Users must explicitly accept or decline the disclaimer before they can start the contest. This ensures all participants are aware of the cheating detection mechanisms and contest rules.

## Features

### 1. **Mandatory Disclaimer Modal**
- Appears automatically when contest page loads
- Cannot be closed or bypassed with Escape key
- Must explicitly accept or decline
- Blocks access to contest features until action is taken

### 2. **Content Coverage**
The disclaimer covers four key areas:

#### 🔍 **Monitoring & Tracking**
- Informs users that activity will be monitored
- Warns about incident logging
- Notes that violations may cause disqualification

#### 🚫 **Prohibited Actions** (5 Categories)
1. **Tab Switching** - Leaving the contest tab or switching windows
2. **Window Blur** - Clicking outside the browser window
3. **Right-Click** - Attempting context menu access
4. **Copy/Paste** - Attempting to copy code/content
5. **Fullscreen Exit** - Exiting fullscreen mode during contest

#### ✅ **Allowed Actions**
- Writing and testing code
- Switching between problems
- Using browser developer tools
- Reviewing problem statements
- Submitting solutions

#### ⏱️ **Contest Rules**
- Duration enforcement
- Submission timestamping
- Multiple violation consequences
- Final committee authority
- Acknowledgment of rule agreement

### 3. **User Options**
Two clear action buttons:
- **Decline & Exit** - Returns user to homepage
- **Accept & Start Contest** - Enables contest features and closes modal

### 4. **Session-Based Storage**
- Uses `sessionStorage` (cleared when browser closes)
- Disclaimer shown once per session
- Users must accept every time they open contest
- Prevents "accept once, exploit forever" scenario

## Technical Implementation

### Frontend Components

#### HTML (`views/contest.ejs`)
```html
<!-- Disclaimer Modal -->
<div id="disclaimer-modal" class="modal-overlay" style="display: flex;">
    <!-- Modal header with title -->
    <!-- Disclaimer body with 4 sections -->
    <!-- Accept/Decline buttons -->
</div>
```

#### CSS (`public/css/contest.css`)
- `.disclaimer-body` - Scrollable content area
- `.modal-overlay` - Full-screen backdrop
- `.modal-content` - Centered modal box
- Custom scrollbar styling for better UX
- Responsive design for all screen sizes

#### JavaScript (`views/contest.ejs`)
Three main functions:

1. **acceptDisclaimer()**
   - Hides modal
   - Stores acceptance in sessionStorage
   - Enables contest features
   - Logs user action

2. **rejectDisclaimer()**
   - Clears any stored acceptance
   - Redirects to homepage
   - Logs rejection

3. **Window load handler**
   - Checks sessionStorage on page load
   - Shows modal if not accepted
   - Prevents Escape key bypass

### Data Storage
```javascript
// Acceptance stored in sessionStorage (per browser tab)
sessionStorage.setItem('disclaimerAccepted', 'true');

// Retrieved on page load
const disclaimerAccepted = sessionStorage.getItem('disclaimerAccepted');
```

## User Experience Flow

### Flow Diagram
```
User loads contest page
        ↓
Check sessionStorage for acceptance
        ↓
    ┌─────────────────┐
    │ Not accepted?   │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Show disclaimer │
    │ (modal overlay) │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
  ┌───▼────┐   ┌───▼────┐
  │ Accept │   │ Decline│
  └───┬────┘   └───┬────┘
      │            │
    Hide       Redirect
   modal       to home
      │
 Enable contest
 features
```

## Accessibility & Security Features

### Accessibility
- Large, readable font sizes
- Color-coded sections for visual distinction
- Scrollable content area with custom scrollbar
- Clear action buttons with different colors
- Responsive design for mobile devices
- High contrast colors for visibility

### Security
- Prevents Escape key bypass
- Prevents closing with backdrop click
- Requires explicit user action (not default)
- Session-based storage (not persistent)
- Logs all acceptances and rejections
- No silent auto-acceptance

## Styling Details

### Color Scheme
- **Header**: Primary color (#007bff) for emphasis
- **Sections**: Color-coded borders:
  - 🔴 Monitoring: Danger color (red)
  - 🔵 Prohibited: Primary color (blue)
  - 🟢 Allowed: Success color (green)
  - 🟡 Rules: Secondary color (yellow)

### Layout
- **Modal Width**: 600px max (responsive on mobile)
- **Content Area**: 60vh max height with scrolling
- **Padding**: 1rem sections with proper spacing
- **Border Radius**: 5px for rounded corners
- **Animations**: Fade-in and slide-down effects

## Browser Compatibility

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Supported Storage APIs
- `sessionStorage` - Primary (all modern browsers)
- `localStorage` - Fallback (not used currently)

## Testing Scenarios

### Scenario 1: First Visit
1. Load contest page
2. Disclaimer should appear
3. Session storage should be empty
4. ✅ Expected: Modal blocks all contest features

### Scenario 2: Accept & Continue
1. Click "Accept & Start Contest"
2. Modal hides
3. Contest features become accessible
4. ✅ Expected: Contest page fully functional

### Scenario 3: Decline & Redirect
1. Click "Decline & Exit"
2. Should redirect to homepage
3. sessionStorage should be cleared
4. ✅ Expected: User back on home page

### Scenario 4: Page Refresh
1. Accept disclaimer
2. Refresh page (same tab)
3. Disclaimer should NOT reappear
4. ✅ Expected: Contest page loads directly

### Scenario 5: New Tab/Incognito
1. Open contest in new tab
2. sessionStorage is different
3. Disclaimer should appear again
4. ✅ Expected: Must accept again

### Scenario 6: Browser Close & Reopen
1. Accept disclaimer
2. Close entire browser
3. Reopen and navigate back
4. Disclaimer should appear
5. ✅ Expected: Must accept again (sessionStorage cleared)

## Future Enhancements

Potential improvements:
- [ ] Multi-language support
- [ ] Detailed incident explanation
- [ ] Video tutorial link
- [ ] Checkbox to confirm understanding of each section
- [ ] Analytics on how long users spend reading
- [ ] A/B testing of disclaimer effectiveness
- [ ] Requirement to scroll through entire content before accepting
- [ ] Signature/initials field for legal compliance

## Troubleshooting

### Disclaimer Not Appearing
1. Check browser console for errors
2. Verify sessionStorage is enabled
3. Clear browser cache and cookies
4. Try incognito/private mode

### Modal Stuck/Frozen
1. Check if page is loading properly
2. Open developer console (F12)
3. Manually run: `acceptDisclaimer()`
4. Or reload page

### Buttons Not Responding
1. Check JavaScript is enabled
2. Verify no JavaScript errors in console
3. Check button IDs match function names
4. Try different browser

## Compliance & Legal Notes

This disclaimer serves as:
- **Acknowledgment** of cheating detection mechanisms
- **Notice** of prohibited conduct
- **Agreement** to contest rules
- **Warning** of potential consequences
- **Documentation** of user consent

For legal compliance:
- Keep logs of all acceptances/rejections
- Store disclaimer version with acceptance
- Maintain audit trail for enforcement
- Consider legal review for your jurisdiction

---

**Last Updated**: November 13, 2025
**Version**: 1.0
**Status**: Active
