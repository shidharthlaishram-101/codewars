// --- Countdown Timer Logic ---

// 1. Set target date and time
const targetDate = new Date("November 12, 2025 23:59:00").getTime();

// 2. Get the elements
const timerElement = document.getElementById("countdown-timer");
const enterBtn = document.getElementById("enter-btn");
const registerBtn = document.getElementById("register-btn");

// Hide the "Enter" button initially
enterBtn.style.display = "none";

// 3. Update the timer every second
const timerInterval = setInterval(function () {
    const now = new Date().getTime();
    const distance = targetDate - now;

    // --- When timer ends ---
    if (distance < 0) {
        clearInterval(timerInterval);

        timerElement.innerHTML = "Event has started!";
        timerElement.className = "timer-expired";

        // Show the Enter button
        enterBtn.style.display = "inline-block";

        // Hide the Register button
        registerBtn.style.display = "none";

        return;
    }

    // --- Timer calculation ---
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // --- Display timer ---
    timerElement.innerHTML = `
        <div class="timer-box">
            <span class="time-value">${days}</span>
            <span class="time-label">Days</span>
        </div>
        <div class="timer-box">
            <span class="time-value">${hours}</span>
            <span class="time-label">Hours</span>
        </div>
        <div class="timer-box">
            <span class="time-value">${minutes}</span>
            <span class="time-label">Mins</span>
        </div>
        <div class="timer-box">
            <span class="time-value">${seconds}</span>
            <span class="time-label">Secs</span>
        </div>
    `;
}, 1000);
