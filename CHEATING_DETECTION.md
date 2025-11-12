# Cheating Detection Mechanism

## Overview
A comprehensive cheating detection system that monitors user behavior during the contest and records suspicious activities. Detection is **active only during the contest** and automatically **disabled when the session ends**.

---

## Features Detected

### 1. **Tab/Window Switching** 🔄
- **Trigger:** User switches to another tab or minimizes the browser
- **Detection:** `visibilitychange` event
- **Action:** Records `tab_switch` incident

### 2. **Window Blur** 📌
- **Trigger:** User clicks outside the browser window
- **Detection:** `blur` event on window
- **Action:** Records `window_blur` incident

### 3. **Fullscreen Exit** 🖥️
- **Trigger:** User exits fullscreen mode
- **Detection:** `fullscreenchange` event
- **Action:** Records `fullscreen_exit` incident

### 4. **Right-Click Attempt** 🖱️
- **Trigger:** User attempts to right-click (inspect element)
- **Detection:** `contextmenu` event
- **Action:** 
  - Prevents default right-click menu
  - Records `right_click` incident
  - Shows alert to user

---

## Cheating Types Tracked

| Type | Detection | Action | Purpose |
|------|-----------|--------|---------|
| `tab_switch` | visibilitychange | Records incident | Detect leaving contest |
| `window_blur` | blur event | Records incident | Detect clicking outside window |
| `right_click` | contextmenu event | Blocks + Records | Prevent inspect element |
| `fullscreen_exit` | fullscreenchange event | Records incident | Detect exiting fullscreen |

**Note:** Copy/paste detection was removed to allow users to copy code snippets from problem statements.

## How It Works

### Frontend (views/contest.ejs)
```javascript
// Flag to control detection
let isCheatingDetectionActive = true;
let cheatingCount = 0;

// Event listeners track all suspicious activities
document.addEventListener('visibilitychange', ...);
window.addEventListener('blur', ...);
document.addEventListener('contextmenu', ...);
document.addEventListener('copy', ...);

// When cheating detected, records it
recordCheating(type) → POST /api/record-cheating
```

### Backend (app.js)
```javascript
POST /api/record-cheating
↓
Saves to Firestore collection: "cheating_records"
↓
Contains:
  - teamCode
  - email
  - cheatingType (tab_switch, window_blur, right_click, fullscreen_exit)
  - timestamp (when incident occurred)
  - recordedAt (server timestamp)
```

---

## Lifecycle

### ✅ Detection Active
- User is on the **contest page** (`/contest?difficulty=...`)
- Flag: `isCheatingDetectionActive = true`
- All events are monitored and recorded

### ❌ Detection Disabled
When user clicks "End Session" button:
1. Flag: `isCheatingDetectionActive = false`
2. Cheating monitoring stops immediately
3. User is redirected to feedback page
4. All remaining suspicious activities are **NOT recorded**

---

## Database Schema

**Collection: `cheating_records`**

```javascript
{
  teamCode: "TEAM001",
  email: "user@example.com",
  cheatingType: "tab_switch",              // or: window_blur, right_click, fullscreen_exit
  timestamp: ISOString,                     // When incident occurred (client time)
  recordedAt: serverTimestamp               // When recorded on server
}
```

---

## Example Scenarios

### Scenario 1: Tab Switch
1. User opens contest page
2. User switches to Chrome DevTools tab
3. Event triggered: `visibilitychange` (document.hidden = true)
4. Recorded: `{ cheatingType: 'tab_switch', ... }`

### Scenario 2: Right-Click Blocked
1. User opens contest page
2. User right-clicks on code editor
3. Event triggered: `contextmenu`
4. Action: Prevents menu, shows alert
5. Recorded: `{ cheatingType: 'right_click', ... }`

### Scenario 3: Session Ends
1. User clicks "End Session"
2. `isCheatingDetectionActive = false`
3. User switches tabs → **NOT recorded**
4. User right-clicks → **NOT recorded**
5. User redirected to feedback page

---

## Frontend Implementation Details

**File:** `views/contest.ejs`

### Active Events
- `visibilitychange` - Tab/window visibility change
- `blur` - Window loses focus
- `contextmenu` - Right-click attempt
- `copy` - Ctrl+C/Cmd+C copy attempt
- `fullscreenchange` - Fullscreen mode toggle

### Recording Function
```javascript
async function recordCheating(type) {
  const response = await fetch('/api/record-cheating', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      cheatingType: type,
      timestamp: new Date().toISOString()
    })
  });
}
```

---

## Backend Implementation Details

**File:** `app.js`

### Endpoint
```
POST /api/record-cheating
Headers: Content-Type: application/json
Auth: Required (session-based)
```

### Request Body
```javascript
{
  cheatingType: string,
  timestamp: ISO8601 string
}
```

### Response
```javascript
{ 
  success: true, 
  message: "Cheating incident recorded" 
}
```

### Firestore Entry
```javascript
await db.collection("cheating_records").add({
  teamCode: string,
  email: string,
  cheatingType: string,
  timestamp: Date,
  recordedAt: serverTimestamp
});
```

---

## Viewing Cheating Records

### In Firebase Console
1. Go to Firestore Database
2. Collection: `cheating_records`
3. View documents with team code and email filters

### Query Example
```javascript
// Get all cheating records for a team
db.collection("cheating_records")
  .where("teamCode", "==", "TEAM001")
  .orderBy("recordedAt", "desc")
  .get()
```

---

## Security Notes

✅ **Secure:**
- Records are tied to authenticated session
- Cannot record cheating without valid credentials
- Server-side timestamp prevents tampering
- Uses HTTPS for data transmission

⚠️ **Limitations:**
- Frontend can be modified by user (disabled in DevTools)
- Does not prevent offline cheating aids
- Does not monitor external monitors/devices
- Cannot detect keyboard shortcuts if DevTools is open

---

## Admin/Review Features

To view cheating statistics:

1. **By Team:**
```javascript
db.collection("cheating_records").where("teamCode", "==", "TEAM_CODE").get()
```

2. **By Type:**
```javascript
db.collection("cheating_records").where("cheatingType", "==", "tab_switch").get()
```

3. **By Time Range:**
```javascript
db.collection("cheating_records")
  .where("recordedAt", ">=", startTime)
  .where("recordedAt", "<=", endTime)
  .get()
```

---

## Future Enhancements

- [ ] Auto-flag users with high cheating counts
- [ ] Dashboard to review cheating reports
- [ ] Automated penalties/warnings
- [ ] Keyboard event monitoring
- [ ] Mouse movement tracking
- [ ] Network request inspection
- [ ] Screen recording capability
- [ ] Integration with scoring system for penalty

---

## Disabling Detection

Users **CANNOT** disable detection while in contest because:
- Flag is set to false only on "End Session" click
- No UI or keyboard shortcut to disable early
- Attempts to modify the flag in console get recorded (if monitoring enabled)

To intentionally disable (admin use only):
```javascript
// In browser console
isCheatingDetectionActive = false;
```

---

## Testing

### Test Case 1: Tab Switch
```
1. Open contest page
2. Press Ctrl+Tab to switch tabs
3. Check browser console for "User left the contest page"
4. Verify Firestore has tab_switch record
```

### Test Case 2: Right-Click Block
```
1. Open contest page
2. Right-click on any element
3. Verify context menu doesn't appear
4. Verify alert shows
5. Verify Firestore has right_click record
```

### Test Case 3: End Session
```
1. Open contest page
2. Click "End Session"
3. Switch tabs (should NOT be recorded)
4. Check Firestore - no new records after session end
```

---

**Last Updated:** November 13, 2025
**Status:** Active & Functional
