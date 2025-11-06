// --- Countdown Timer Logic ---

// 1. Set important target dates and times
const registrationEnd = new Date("November 12, 2025 17:00:00").getTime();
const eventStart = new Date("November 13, 2025 10:00:00").getTime();

// 2. Get the elements
const timerElement = document.getElementById("countdown-timer");
const timerLabel = document.getElementById("timer-label");
const enterBtn = document.getElementById("enter-btn");
const registerBtn = document.getElementById("register-btn");

// Hide the "Enter" button initially
enterBtn.style.display = "none";

// 3. Update the timer every second
const timerInterval = setInterval(function () {
    const now = new Date().getTime();

    // --- Case 1: Before registration end ---
    if (now < registrationEnd) {
        const distance = registrationEnd - now;

        // --- Timer calculation ---
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // --- Display countdown timer ---
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

        // Buttons and label visibility
        registerBtn.style.display = "inline-block";
        enterBtn.style.display = "none";
        timerLabel.style.display = "block";
    }

    // --- Case 2: Registration ended, waiting for event start ---
    else if (now >= registrationEnd && now < eventStart) {
        timerElement.innerHTML = `
            <div class="timer-ended">
                Registration has ended. Please wait for the event to start.
            </div>
        `;
        timerElement.className = "timer-expired";

        // Hide buttons and label
        registerBtn.style.display = "none";
        enterBtn.style.display = "none";
        timerLabel.style.display = "none";
    }

    // --- Case 3: Event started ---
    else if (now >= eventStart) {
        clearInterval(timerInterval);
        timerElement.innerHTML = "Event has started!";
        timerElement.className = "timer-expired";

        enterBtn.style.display = "inline-block";
        registerBtn.style.display = "none";
        timerLabel.style.display = "none";
    }
}, 1000);
