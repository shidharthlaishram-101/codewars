// contest.js

// Set the countdown time (in seconds)
let totalTime = 3 * 60 * 60; // 3 hours in seconds

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

// Update timer every second
function startTimer() {
    const timerInterval = setInterval(() => {
        totalTime--;

        if (totalTime >= 0) {
            if (timerElement) {
                timerElement.textContent = formatTime(totalTime);
            }
        } else {
            clearInterval(timerInterval);
            if (timerElement) {
                timerElement.textContent = "Time's up!";
            }
            // Show modal instead of alert
            showContestEndedModal();
        }
    }, 1000);
}

// Start the countdown when page loads
window.onload = startTimer;
