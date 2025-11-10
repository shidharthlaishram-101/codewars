// Dark Mode Toggle Functionality

(function() {
    'use strict';

    // Theme state
    const THEME_KEY = 'theme-preference';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';

    // Get current theme from localStorage or default to dark
    function getTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored) {
            return stored;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return LIGHT_THEME;
        }
        return DARK_THEME; // Default to dark
    }

    // Apply theme to document
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        
        // Update button icon
        updateToggleButton(theme);
    }

    // Update toggle button appearance
    function updateToggleButton(theme) {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.theme-icon');
            if (icon) {
                if (theme === DARK_THEME) {
                    icon.textContent = 'Dark Mode 🌙'; // Moon icon for dark mode (current)
                    toggleBtn.setAttribute('aria-label', 'Switch to light mode');
                } else {
                    icon.textContent = 'Light Mode ☀️'; // Sun icon for light mode (current)
                    toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
                }
            }
        }
    }

    // Toggle theme
    function toggleTheme() {
        const currentTheme = getTheme();
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        applyTheme(newTheme);
    }

    // Initialize theme on page load
    function initTheme() {
        const theme = getTheme();
        applyTheme(theme);
    }

    // Listen for system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        // Only apply system theme if user hasn't set a preference
        if (!localStorage.getItem(THEME_KEY)) {
            mediaQuery.addEventListener('change', (e) => {
                applyTheme(e.matches ? LIGHT_THEME : DARK_THEME);
            });
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    // Attach toggle function to window for button clicks
    window.toggleTheme = toggleTheme;
})();

