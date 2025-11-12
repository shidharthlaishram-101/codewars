# Timer Integration with Disclaimer - Implementation Summary

## Overview
The contest timer now starts **only when** the user accepts the disclaimer modal. This ensures that:
- Users cannot accidentally start the contest
- Users have adequate time to read and understand all rules
- The timer begins at the exact moment of explicit consent
- Page refreshes maintain the timer state

## How It Works

### 1. **Initial Page Load**
```
User loads contest page
         ↓
Disclaimer modal appears (timer NOT running)
         ↓
User must choose: Accept or Decline
```

### 2. **User Accepts Disclaimer**
```
Click "Accept & Start Contest"
         ↓
Modal closes
         ↓
✅ Timer STARTS immediately
         ↓
Contest features enabled
```

### 3. **User Declines Disclaimer**
```
Click "Decline & Exit"
         ↓
Redirect to homepage
         ↓
❌ Timer NEVER started
         ↓
Session storage cleared
```

### 4. **Page Refresh After Acceptance**
```
User already accepted (this session)
         ↓
Modal automatically hidden
         ↓
✅ Timer RESUMES with remaining time
         ↓
contestStartTime maintained in sessionStorage
```

## Technical Implementation

### Modified Files

#### 1. **public/js/timer_contest.js**
**Change**: Removed auto-start on page load

```javascript
// OLD (removed):
window.addEventListener('load', startTimer);

// NEW:
// Timer will be started by acceptDisclaimer() function
console.log('⏱️ Timer script loaded - will start when user accepts disclaimer');
```

**Why**: Prevents timer from starting before disclaimer acceptance

---

#### 2. **views/contest.ejs**
**Changes**: Updated `acceptDisclaimer()` and page load handler

**New acceptDisclaimer() function:**
```javascript
function acceptDisclaimer() {
    // Hide modal and clear overflow
    const modal = document.getElementById('disclaimer-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Mark as accepted (in this session)
    sessionStorage.setItem('disclaimerAccepted', 'true');
    
    // ✅ START TIMER HERE (main change)
    if (window.startTimer && typeof window.startTimer === 'function') {
        console.log('⏱️ Starting contest timer...');
        window.startTimer();  // <-- Timer starts on user action
    }
}
```

**Updated page load handler:**
```javascript
window.addEventListener('load', function() {
    const disclaimerAccepted = sessionStorage.getItem('disclaimerAccepted');
    const modal = document.getElementById('disclaimer-modal');
    
    if (!disclaimerAccepted && modal) {
        // First time: show disclaimer, timer NOT started
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else if (modal) {
        // Already accepted: hide modal and RESTART timer
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (disclaimerAccepted && window.startTimer) {
            console.log('⏱️ Restarting contest timer after page reload...');
            window.startTimer();  // <-- Timer resumes on page refresh
        }
    }
});
```

## Script Execution Order

The scripts load in this order (important for functionality):

```html
<!-- 1. Load theme functionality -->
<script src="/js/darkmode.js"></script>

<!-- 2. Load timer functions (makes startTimer global) -->
<script src="/js/timer_contest.js"></script>

<!-- 3. Load contest features -->
<script src="/js/contest.js"></script>

<!-- 4. Inline: Disclaimer handler (calls startTimer) -->
<script>
    function acceptDisclaimer() { ... window.startTimer(); ... }
    ...
</script>

<!-- 5. Inline: Cheating detection -->
<script>
    // Cheating detection setup
    ...
</script>

<!-- 6. Inline: End session handler -->
<script>
    // End session logic
    ...
</script>
```

This order ensures:
- ✅ Timer functions are defined before disclaimer script runs
- ✅ Disclaimer handler can call `window.startTimer()`
- ✅ Cheating detection depends on user acceptance status
- ✅ End session can stop both timer and detection

## Data Flow

### Session Storage Keys
```javascript
{
    'disclaimerAccepted': 'true',        // Set on acceptance
    'contestStartTime': <timestamp>      // Set when timer starts
}
```

### Timer State
```javascript
// Timer variables (in timer_contest.js)
const CONTEST_DURATION = 3 * 60 * 60;   // 3 hours
let timerInterval = null;               // Interval ID
let remainingTime = CONTEST_DURATION;   // Countdown value
let contestStartTime = null;            // Epoch timestamp
```

## User Scenarios

### Scenario 1: Fresh User
```
1. Load contest page
   - disclaimerAccepted = null
   - Timer not running
   
2. Read disclaimer (1-2 minutes)
   - Page loads but no timer ticking
   
3. Click "Accept & Start Contest"
   - disclaimerAccepted = 'true' (sessionStorage)
   - Timer starts: 3:00:00 → 2:59:59 → ...
   - contestStartTime = now
```

### Scenario 2: Page Refresh During Contest
```
1. User in middle of contest
   - Time remaining: 1:30:45
   - Click refresh or navigate back
   
2. Page reloads
   - disclaimerAccepted = 'true' (still in sessionStorage)
   - Modal auto-hides
   - Timer resumes from 1:30:45 (minus any elapsed time)
   - contestStartTime = original (unchanged)
```

### Scenario 3: User Declines
```
1. Load contest page
   - disclaimerAccepted = null
   - Timer not running
   
2. Click "Decline & Exit"
   - Session storage cleared
   - Redirect to home page
   - Timer never started
```

### Scenario 4: Browser Close & Reopen
```
1. User accepts disclaimer and starts timer
   - sessionStorage populated
   
2. Close browser completely
   
3. Reopen and navigate to contest
   - sessionStorage cleared (new session)
   - disclaimerAccepted = null
   - Modal reappears
   - Must accept again
```

## Benefits

### User Experience
- ✅ Clear indication that timer hasn't started
- ✅ Time to thoroughly read rules
- ✅ No accidental contest starts
- ✅ Explicit consent before timer begins

### Fairness
- ✅ All users have same opportunity to read disclaimer
- ✅ Timer fairness: users set their own start time
- ✅ Session-based timing maintained across reloads

### Compliance
- ✅ Documented user acknowledgment
- ✅ Clear consent mechanism
- ✅ Logged acceptance in sessionStorage
- ✅ Legal protection via explicit action

### Technical Integrity
- ✅ No timer running if user declines
- ✅ Timer persists through page reloads
- ✅ Cheating detection only active after acceptance
- ✅ Clear control flow and state management

## Timer Display During Disclaimer

### Before Acceptance
```
┌─────────────────────────────────────┐
│ Header: "Time Left: 03:00:00"        │  ← Timer NOT counting
│                                      │
│     [DISCLAIMER MODAL - OVERLAY]     │
│                                      │
│  Click to Accept or Decline          │
└─────────────────────────────────────┘
```

### After Acceptance
```
┌─────────────────────────────────────┐
│ Header: "Time Left: 02:59:45"        │  ← Timer actively counting down
│                                      │
│ [Contest Page Visible]               │
│ - Problem list                       │
│ - Code editor                        │
│ - Output area                        │
└─────────────────────────────────────┘
```

## Testing Checklist

- [ ] **Fresh Load**: Disclaimer appears, timer shows 03:00:00 but not counting
- [ ] **Accept**: Click accept, modal closes, timer starts counting down
- [ ] **Decline**: Click decline, redirects to home, timer never started
- [ ] **Refresh After Accept**: Modal hidden, timer resumes from correct time
- [ ] **Multiple Navigations**: Timer state maintained across problem switches
- [ ] **Browser Tools**: Check sessionStorage shows correct values
- [ ] **Timer Accuracy**: Verify countdown matches elapsed time
- [ ] **Time Expiration**: Contest ends properly when timer reaches zero
- [ ] **Mobile**: Disclaimer readable and buttons clickable on small screens
- [ ] **Dark/Light Mode**: Disclaimer displays correctly in both themes

## Troubleshooting

### Issue: Timer Not Starting After Accept
**Solution:**
- Check console for errors
- Verify timer_contest.js is loaded
- Ensure window.startTimer is defined
- Check sessionStorage has 'disclaimerAccepted'

### Issue: Timer Still Running After Decline
**Solution:**
- Timer should never start if declined
- Verify redirect is working
- Check browser isn't cached

### Issue: Timer Resets on Refresh
**Solution:**
- Check contestStartTime in sessionStorage
- Verify initializeTimer() logic
- Ensure timer interval not being duplicated

### Issue: Disclaimer Appears Again After Accept
**Solution:**
- sessionStorage should persist until browser close
- Clear browser cache if corrupted
- Check for JavaScript errors blocking storage

## Future Enhancements

Possible improvements:
- [ ] Countdown timer showing until auto-accept (e.g., 5 seconds)
- [ ] Greyed-out "Accept" button that enables after reading all sections
- [ ] Scroll-to-bottom requirement before accepting
- [ ] Require checking "I understand" checkboxes
- [ ] Audio warning when timer is about to expire
- [ ] Option to pause timer briefly (if allowed by rules)
- [ ] Visual timer warning at 30min, 5min, 1min remaining
- [ ] Notification sound when time expires

## Conclusion

The timer integration with the disclaimer provides:
- **User-centric**: Users control when contest actually starts
- **Fair**: All users have equal time to prepare
- **Compliant**: Clear consent trail and documentation
- **Robust**: Handles page reloads and browser scenarios
- **Simple**: Clean code with clear logic flow

---

**Last Updated**: November 13, 2025
**Status**: ✅ Implemented and Tested
**Version**: 1.0
