// contest.js - Continuous timer across all difficulty levels

// Timer configuration
const CONTEST_DURATION = 3 * 60 * 60; // 3 hours in seconds
let timerInterval = null;
let remainingTime = CONTEST_DURATION;
let contestStartTime = null;

// Get the timer element
const timerElement = document.querySelector('.contest-timer strong');

// Function to format time as HH:MM:SS
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Show contest ended modal (make it globally available)
function showContestEndedModal() {
    const modal = document.getElementById('contest-ended-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

// Make function available globally
window.showContestEndedModal = showContestEndedModal;

// Initialize continuous timer - starts once and keeps running across all difficulty levels
function initializeTimer() {
    // Check if contest has already started (same session)
    let startTime = sessionStorage.getItem('contestStartTime');
    
    if (!startTime) {
        // First time accessing contest - start the timer
        startTime = Date.now();
        sessionStorage.setItem('contestStartTime', startTime);
        remainingTime = CONTEST_DURATION;
        console.log(`⏱️ Contest started. 3 hours timer begins!`);
    } else {
        // Contest already started earlier - calculate remaining time
        const elapsedTime = Math.floor((Date.now() - parseInt(startTime)) / 1000);
        remainingTime = Math.max(0, CONTEST_DURATION - elapsedTime);
        console.log(`⏱️ Contest resumed. Time remaining: ${formatTime(remainingTime)}`);
    }
    
    contestStartTime = parseInt(startTime);
}

// Update timer display and check for expiration
function updateTimer() {
    remainingTime--;

    if (remainingTime > 0) {
        if (timerElement) {
            timerElement.textContent = formatTime(remainingTime);
        }
    } else if (remainingTime === 0) {
        if (timerElement) {
            timerElement.textContent = "Time's up!";
        }
        stopTimer();
        showContestEndedModal();
    }
}

// Start the countdown
function startTimer() {
    // Clear any existing interval
    stopTimer();
    
    // Initialize timer (only starts once, keeps running after)
    initializeTimer();
    
    // Display initial time
    if (timerElement) {
        timerElement.textContent = formatTime(remainingTime);
    }
    
    // Start countdown
    timerInterval = setInterval(updateTimer, 1000);
}

// Stop the timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Make functions globally available
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.initializeTimer = initializeTimer;

// Timer will be started by acceptDisclaimer() function when user accepts the disclaimer
// Do NOT auto-start on page load anymore
console.log('⏱️ Timer script loaded - will start when user accepts disclaimer');
