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

// Get references to elements
const scrollContainer = document.getElementById('scroll-container');
const header = document.getElementById('main-header');
const logo = document.getElementById('logo');
const appImage = document.getElementById('app-image');
const content = document.getElementById('content');

// Constants for header sizing
const maxScroll = 300;       // Scroll distance over which the full shrink effect happens
const maxHeaderHeight = 200; // Initial header height (px)
const minHeaderHeight = 60;  // Minimum header height (px)

// Listen for scroll events on the scroll container
scrollContainer.addEventListener('scroll', () => {
  const scrollTop = scrollContainer.scrollTop;
  // Calculate a proportional shrink factor (0 to 1)
  const shrinkFactor = Math.min(scrollTop / maxScroll, 1);
  
  // Calculate new header height based on scroll
  const newHeaderHeight = maxHeaderHeight - ((maxHeaderHeight - minHeaderHeight) * shrinkFactor);
  header.style.height = `${newHeaderHeight}px`;
  
  // Scale the logo from 1 down to 0.6 as the header shrinks
  const newLogoScale = 1 - (0.4 * shrinkFactor);
  logo.style.transform = `scale(${newLogoScale})`;
  
  // For the app image, fade it out and scale it down as you scroll:
  // It will scale from 1 down to 0.7 and fade out completely at full shrink
  const newImageScale = 1 - (0.3 * shrinkFactor);
  const newImageOpacity = 1 - shrinkFactor;
  appImage.style.transform = `scale(${newImageScale})`;
  appImage.style.opacity = newImageOpacity;
  
  // Adjust the content's top margin so that it always starts below the header (plus some extra space)
  content.style.marginTop = `${newHeaderHeight + 20}px`;
});