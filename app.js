// === THEME TOGGLE ===
const themeToggle = document.getElementById('theme-toggle');

// Check for saved theme preference
const currentTheme = localStorage.getItem('theme') || 'light-mode';
document.body.classList.add(currentTheme);

// Function to update button text
const updateButtonText = () => {
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
};

// Set initial button text
updateButtonText();

// Toggle Theme on Click
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark-mode' : 'light-mode');
    updateButtonText();
});

const header = document.getElementById('main-header');
const logo = document.getElementById('logo');
const appImage = document.getElementById('app-image');
const content = document.getElementById('content');

const maxScroll = 400;  // The range over which shrinking happens
const initialHeaderPadding = 40;
const minHeaderPadding = 10;
const initialLogoSize = 100;
const minLogoSize = 50;
const initialImageSize = 80; // Percentage
const minImageSize = 50;
const initialMarginTop = header.offsetHeight + 20;

// Function to update header elements proportionally
const updateHeader = () => {
    const scrollY = Math.min(window.scrollY, maxScroll);
    const shrinkFactor = scrollY / maxScroll; // Value between 0 and 1

    // Calculate new sizes based on the shrink factor
    const newPadding = initialHeaderPadding - (shrinkFactor * (initialHeaderPadding - minHeaderPadding));
    const newLogoSize = initialLogoSize - (shrinkFactor * (initialLogoSize - minLogoSize));
    const newImageSize = initialImageSize - (shrinkFactor * (initialImageSize - minImageSize));
    const newImageOpacity = 1 - shrinkFactor;

    // Apply new styles
    header.style.padding = `${newPadding}px 20px`;
    logo.style.height = `${newLogoSize}px`;
    appImage.style.width = `${newImageSize}%`;
    appImage.style.opacity = newImageOpacity;

    // Lock the content position dynamically
    content.style.marginTop = `${header.getBoundingClientRect().height + 20}px`;
};

// Ensure correct layout on load and resize
window.addEventListener('load', updateHeader);
window.addEventListener('resize', updateHeader);
window.addEventListener('scroll', updateHeader);